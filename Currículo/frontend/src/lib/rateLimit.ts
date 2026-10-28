import crypto from 'crypto';

export type RateLimitProvider =
  | 'upstash-redis'
  | 'memory-fallback'
  | 'redis-degraded-fallback'
  | 'fail-closed';

export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  provider: RateLimitProvider;
}

// Armazenamento em memória para fallback local (desenvolvimento / CI / testes / modo degradado)
const localMemoryStore = new Map<string, RateLimitRecord>();

// Salt efêmero em runtime para anonimização de IP conforme LGPD
const RATE_LIMIT_SALT = process.env.RATE_LIMIT_SALT || crypto.randomBytes(16).toString('hex');

/**
 * Reseta o store local (utilizado primordialmente em testes e limpeza de ambiente)
 */
export function resetRateLimitStore(): void {
  localMemoryStore.clear();
}

/**
 * Validação rigorosa de formato IPv4 ou IPv6 para prevenção de cabeçalhos forjados / injection.
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const trimmed = ip.trim();

  // IPv4 padrão (ex: 192.168.1.1 ou 203.0.113.195)
  const ipv4Regex =
    /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  if (ipv4Regex.test(trimmed)) return true;

  // IPv6 simplificado / canônico
  const ipv6Regex =
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/;
  return ipv6Regex.test(trimmed);
}

/**
 * Extrai e sanitiza o endereço IP real da requisição, priorizando cabeçalhos assinados de proxies confiáveis:
 * 1. x-vercel-forwarded-for: atribuído diretamente pelo Edge da Vercel (não manipulável pelo cliente na Vercel)
 * 2. cf-connecting-ip: atribuído pela Cloudflare Edge Network
 * 3. x-real-ip: atribuído por proxies reversos autoritativos (Nginx, ALB)
 * 4. x-forwarded-for: inspecionado e sanitizado com validação de formato
 */
export function extractClientIp(headers: Headers): string {
  // 1. Vercel Edge Proxy confiável
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }

  // 2. Cloudflare Edge Proxy confiável
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  // 3. Proxy reverso direto (X-Real-IP)
  const realIp = headers.get('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // 4. Cadeia padrão X-Forwarded-For
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map((p) => p.trim());
    // Avalia os IPs válidos na lista (da esquerda para a direita, primeiro hop válido)
    for (const ip of parts) {
      if (isValidIp(ip)) {
        return ip;
      }
    }
  }

  // Fallback seguro
  return '127.0.0.1';
}

/**
 * Anonimiza o IP gerando um hash seguro unidirecional com salt (LGPD por Design)
 */
export function hashIpForPrivacy(ip: string): string {
  return crypto.createHash('sha256').update(`${ip}:${RATE_LIMIT_SALT}`).digest('hex');
}

/**
 * Script Lua executado atomicamente no Redis (Upstash / Vercel KV).
 * Garante incremento e definição incondicional do TTL na mesma operação atômica,
 * eliminando chaves órfãs ou sem expiração causadas por falhas de rede.
 */
export const ATOMIC_RATE_LIMIT_LUA = `
local current = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {current, ttl}
`.trim();

/**
 * Executa verificação atômica via REST API de Redis distribuído (Upstash Redis / Vercel KV)
 * utilizando o script Lua de incremento e expiração atômicos.
 */
export async function checkDistributedRedis(
  redisUrl: string,
  redisToken: string,
  key: string,
  maxRequests: number,
  windowMs: number,
  fetchFn: typeof fetch = fetch
): Promise<RateLimitResult | null> {
  try {
    const endpoint = `${redisUrl.replace(/\/$/, '')}/pipeline`;
    const commands = [
      ['EVAL', ATOMIC_RATE_LIMIT_LUA, 1, key, windowMs.toString()],
    ];

    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    // Upstash REST pipeline retorna array de resultados: [{ result: [count, ttl] }]
    // ou em caso de execução direta: { result: [count, ttl] }
    const evalResult = Array.isArray(payload) ? payload[0]?.result : payload?.result;

    if (!Array.isArray(evalResult) || evalResult.length < 2) {
      return null;
    }

    const count = Number(evalResult[0]) || 1;
    const ttlMs = Number(evalResult[1]) > 0 ? Number(evalResult[1]) : windowMs;

    const resetAt = Date.now() + ttlMs;
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return {
      allowed,
      remaining,
      resetAt,
      provider: 'upstash-redis',
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY][RATE_LIMIT] Falha ao comunicar com Redis distribuído:', error);
    }
    return null;
  }
}

/**
 * Fallback em memória para ambientes locais ou modo degradado
 */
export function checkMemoryFallback(
  key: string,
  maxRequests: number,
  windowMs: number,
  provider: RateLimitProvider = 'memory-fallback'
): RateLimitResult {
  const now = Date.now();

  // Limpeza de registros expirados para prevenir saturação de memória
  if (localMemoryStore.size > 1000) {
    for (const [storeKey, record] of localMemoryStore.entries()) {
      if (now > record.resetAt) {
        localMemoryStore.delete(storeKey);
      }
    }
  }

  const current = localMemoryStore.get(key);

  if (!current || now > current.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    localMemoryStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetAt: newRecord.resetAt,
      provider,
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      provider,
    };
  }

  current.count += 1;
  localMemoryStore.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - current.count),
    resetAt: current.resetAt,
    provider,
  };
}

/**
 * Verifica e aplica rate limiting por IP anonimizado.
 *
 * Política de Alta Disponibilidade e Segurança:
 * 1. Em ambientes com Redis configurado (Upstash/KV), executa script Lua atômico.
 * 2. Em caso de falha de conexão com Redis em produção (NODE_ENV=production):
 *    - Se RATE_LIMIT_FAIL_CLOSED="true": aciona Fail-Closed e bloqueia preventivamente.
 *    - Caso padrão: aciona Modo Degradado Seguro ('redis-degraded-fallback') com limite
 *      estrito reduzido (máx 2 reqs) para conter DoS entre múltiplas instâncias serverless.
 * 3. Em desenvolvimento / testes: opera em memória de forma transparente.
 */
export async function checkRateLimit(
  hashedIp: string,
  maxRequests = 5,
  windowMs = 60 * 60 * 1000,
  injectedFetch?: typeof fetch
): Promise<RateLimitResult> {
  const rateLimitKey = `ratelimit:contact:${hashedIp}`;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    const distributedResult = await checkDistributedRedis(
      redisUrl,
      redisToken,
      rateLimitKey,
      maxRequests,
      windowMs,
      injectedFetch
    );

    if (distributedResult) {
      return distributedResult;
    }

    // Tratamento de falha do Redis em produção
    if (process.env.NODE_ENV === 'production') {
      const isFailClosed = process.env.RATE_LIMIT_FAIL_CLOSED === 'true';

      console.error('[SECURITY][RATE_LIMIT] Indisponibilidade de Redis em produção. Aplicando política de segurança.', {
        key: rateLimitKey,
        isFailClosed,
        timestamp: new Date().toISOString(),
      });

      if (isFailClosed) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + 60 * 1000,
          provider: 'fail-closed',
        };
      }

      // Modo degradado em produção: cota restritiva reduzida
      const degradedMax = Math.min(2, maxRequests);
      return checkMemoryFallback(rateLimitKey, degradedMax, windowMs, 'redis-degraded-fallback');
    }
  }

  // Fallback in-memory para dev / CI
  return checkMemoryFallback(rateLimitKey, maxRequests, windowMs, 'memory-fallback');
}
