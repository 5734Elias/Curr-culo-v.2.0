import crypto from 'crypto';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Armazenamento em memória com limpeza periódica para evitar vazamento de memória
const rateLimitStore = new Map<string, RateLimitRecord>();

// Salt efêmero em runtime para anonimização de IP conforme LGPD
const RATE_LIMIT_SALT = process.env.RATE_LIMIT_SALT || crypto.randomBytes(16).toString('hex');

/**
 * Extrai e sanitiza o endereço IP real da requisição
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
 * Anonimiza o IP gerando um hash seguro unidirecional com salt
 */
export function hashIpForPrivacy(ip: string): string {
  return crypto.createHash('sha256').update(`${ip}:${RATE_LIMIT_SALT}`).digest('hex');
}

/**
 * Verifica e aplica rate limiting por IP anonimizado
 * @param hashedIp Hash do IP do cliente
 * @param maxRequests Máximo de requisições permitidas na janela
 * @param windowMs Janela de tempo em milissegundos
 */
export function checkRateLimit(
  hashedIp: string,
  maxRequests = 5,
  windowMs = 60 * 60 * 1000 // 1 hora padrão
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  // Limpeza de registros expirados se a lista crescer
  if (rateLimitStore.size > 1000) {
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }

  const current = rateLimitStore.get(hashedIp);

  if (!current || now > current.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(hashedIp, newRecord);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  rateLimitStore.set(hashedIp, current);

  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetAt: current.resetAt,
  };
}

