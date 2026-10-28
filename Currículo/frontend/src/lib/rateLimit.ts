import crypto from 'crypto';

export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  provider: 'upstash-redis' | 'memory-fallback';
}

// Armazenamento em memória para fallback local (desenvolvimento / CI / testes)
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
 * Extrai e sanitiza o endereço IP real da requisição, priorizando cabeçalhos de proxies confiáveis
 */
export function extractClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Anonimiza o IP gerando um hash seguro unidirecional com salt (LGPD por Design)
 */
export function hashIpForPrivacy(ip: string): string {
  return crypto.createHash('sha256').update(`${ip}:${RATE_LIMIT_SALT}`).digest('hex');
}

/**
 * Executa verificação atômica via REST API de Redis distribuído (Upstash Redis / Vercel KV).
 * Compatível nativamente com múltiplas instâncias serverless e edge runtimes (zero dependências nativas).
 */
async function checkDistributedRedis(
  redisUrl: string,
  redisToken: string,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  try {
    const windowSeconds = Math.ceil(windowMs / 1000);
    // Pipeline atômico via REST: INCR + PTTL (ou EXPIRE se for o primeiro acesso)
    const pipelineUrl = `${redisUrl.replace(/\/$/, '')}/pipeline`;

    const commands = [
      ['INCR', key],
      ['PTTL', key],
    ];

    const response = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      // Timeout curto para evitar bloqueio da requisição em caso de lentidão na rede externa
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return null;
    }

    const results = await response.json();
    const count = typeof results[0]?.result === 'number' ? results[0].result : 1;
    let ttlMs = typeof results[1]?.result === 'number' ? results[1].result : -1;

    // Se a chave é nova (sem TTL ou TTL negativo), define expiração
    if (count === 1 || ttlMs < 0) {
      await fetch(`${redisUrl.replace(/\/$/, '')}/expire`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([key, windowSeconds]),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {});
      ttlMs = windowMs;
    }

    const resetAt = Date.now() + (ttlMs > 0 ? ttlMs : windowMs);
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return {
      allowed,
      remaining,
      resetAt,
      provider: 'upstash-redis',
    };
  } catch {
    // Em caso de falha de conexão com o Redis externo, permite fallback resiliente
    return null;
  }
}

/**
 * Fallback em memória para ambientes sem Redis configurado (Dev local / CI)
 */
function checkMemoryFallback(
  key: string,
  maxRequests: number,
  windowMs: number
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
      remaining: maxRequests - 1,
      resetAt: newRecord.resetAt,
      provider: 'memory-fallback',
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      provider: 'memory-fallback',
    };
  }

  current.count += 1;
  localMemoryStore.set(key, current);

  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetAt: current.resetAt,
    provider: 'memory-fallback',
  };
}

/**
 * Verifica e aplica rate limiting por IP anonimizado.
 * Em ambientes serverless em produção com Upstash/KV configurado, persiste de forma compartilhada.
 * Caso contrário, utiliza fallback em memória com segurança.
 *
 * @param hashedIp Hash do IP do cliente
 * @param maxRequests Máximo de requisições permitidas na janela (padrão: 5)
 * @param windowMs Janela de tempo em milissegundos (padrão: 1 hora)
 */
export async function checkRateLimit(
  hashedIp: string,
  maxRequests = 5,
  windowMs = 60 * 60 * 1000
): Promise<RateLimitResult> {
  const rateLimitKey = `ratelimit:contact:${hashedIp}`;

  // Credenciais de Redis REST distribuído (Upstash Redis ou Vercel KV)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    const distributedResult = await checkDistributedRedis(
      redisUrl,
      redisToken,
      rateLimitKey,
      maxRequests,
      windowMs
    );

    if (distributedResult) {
      return distributedResult;
    }
  }

  // Fallback in-memory para dev / CI
  return checkMemoryFallback(rateLimitKey, maxRequests, windowMs);
}
