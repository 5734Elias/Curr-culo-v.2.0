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

// Armazenamento em memória para fallback local (desenvolvimento / CI / testes / modo degradado opcional)
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

  // IPv6 canônico ou compactado
  const ipv6Regex =
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/;
  return ipv6Regex.test(trimmed);
}

/**
 * Extrai e sanitiza o endereço IP real da requisição considerando a topologia real de proxies:
 *
 * 1. x-vercel-forwarded-for: Autoridade absoluta na infraestrutura Vercel. Gerado e assinado no
 *    Edge de entrada; qualquer tentativa de spoofing pelo cliente é sobrescrita pela Vercel.
 * 2. cf-connecting-ip: Autoridade de borda Cloudflare.
 * 3. x-real-ip: Atribuído por proxy reverso autoritativo único (ex: Nginx, AWS ALB).
 * 4. x-forwarded-for: Em arquiteturas com múltiplos proxies reversos, o cliente injeta valores à
 *    esquerda e os proxies confiáveis anexam o IP real à direita. Portanto, avaliamos da direita
 *    para a esquerda (rightmost hop) para evitar que IPs spoofados pelo cliente sejam adotados.
 */
export function extractClientIp(headers: Headers): string {
  // 1. Vercel Edge Proxy Autorizado
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }

  // 2. Cloudflare Edge Proxy
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  // 3. Proxy reverso direto (X-Real-IP)
  const realIp = headers.get('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // 4. Cadeia padrão X-Forwarded-For (Proteção contra Spoofing: leitura do rightmost hop confiável)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map((p) => p.trim()).filter(Boolean);
    // Avalia da direita para a esquerda: o proxy reverso de borda sempre anexa no final
    for (let i = parts.length - 1; i >= 0; i--) {
      if (isValidIp(parts[i])) {
        return parts[i];
      }
    }
  }

  // Fallback seguro caso nenhum cabeçalho válido seja detectado
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

  // Limpeza periódica de registros expirados para prevenir saturação de memória
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
 * Política de Produção Estrita (Fail-Closed por Padrão):
 * 1. Em produção (NODE_ENV === 'production'), a presença de Redis distribuído é MANDATÓRIA.
 *    Se as variáveis de ambiente não estiverem configuradas, o sistema REJEITA requisições por Fail-Closed
 *    (a menos que RATE_LIMIT_ALLOW_UNCONFIGURED_IN_PROD="true" seja expressamente definido).
 * 2. Em caso de indisponibilidade ou timeout do cluster Redis em produção:
 *    - O comportamento PADRÃO é FAIL-CLOSED: bloqueio preventivo (HTTP 503) com Retry-After.
 *    - Somente caso RATE_LIMIT_ALLOW_DEGRADED_FALLBACK="true" seja configurado pelo operador,
 *      o modo degradado local (máximo 2 requisições por instância) será admitido.
 * 3. Em ambientes locais / testes (NODE_ENV !== 'production'):
 *    - Opera via fallback em memória seguro para permitir desenvolvimento e testes de CI.
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

  // 1. Verificação em Ambiente de Produção
  if (process.env.NODE_ENV === 'production') {
    // 1.1 Se as variáveis do Redis não estiverem configuradas em produção
    if (!redisUrl || !redisToken) {
      const allowUnconfigured = process.env.RATE_LIMIT_ALLOW_UNCONFIGURED_IN_PROD === 'true';

      console.error(
        '[SECURITY][RATE_LIMIT] CONFIGURAÇÃO CRÍTICA AUSENTE: Redis distribuído não está configurado em produção. Aplicando Fail-Closed para proteção do sistema.',
        {
          key: rateLimitKey,
          allowUnconfigured,
          timestamp: new Date().toISOString(),
        }
      );

      if (!allowUnconfigured) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + 60 * 1000,
          provider: 'fail-closed',
        };
      }

      // Se explicitamente permitido pelo operador
      return checkMemoryFallback(rateLimitKey, Math.min(2, maxRequests), windowMs, 'redis-degraded-fallback');
    }

    // 1.2 Redis configurado: tenta execução atômica distribuída
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

    // 1.3 Falha de conectividade ou timeout do Redis em produção: FAIL-CLOSED por padrão
    const allowDegraded = process.env.RATE_LIMIT_ALLOW_DEGRADED_FALLBACK === 'true';

    console.error(
      '[SECURITY][RATE_LIMIT] Indisponibilidade de Redis em produção. Aplicando Fail-Closed por padrão.',
      {
        key: rateLimitKey,
        allowDegraded,
        timestamp: new Date().toISOString(),
      }
    );

    if (!allowDegraded) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60 * 1000,
        provider: 'fail-closed',
      };
    }

    // Modo degradado estrito se explicitamente opt-in
    return checkMemoryFallback(rateLimitKey, Math.min(2, maxRequests), windowMs, 'redis-degraded-fallback');
  }

  // 2. Ambiente Não-Produtivo (Desenvolvimento local / Testes de CI)
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
  }

  // Fallback in-memory para dev / CI
  return checkMemoryFallback(rateLimitKey, maxRequests, windowMs, 'memory-fallback');
}
