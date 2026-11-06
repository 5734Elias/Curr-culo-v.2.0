import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import {
  getAuthConfig,
  PUBLIC_CONTACT_ONLY_EMAIL,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from './config';

export interface AdminSessionUser {
  sub: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: 'SUPER_ADMIN';
}

export interface AdminSessionPayload extends AdminSessionUser {
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/**
 * Cria um token JWT assinado para a sessão administrativa.
 */
export async function createSessionToken(user: AdminSessionUser): Promise<string> {
  const config = getAuthConfig();
  const secretKey = new TextEncoder().encode(config.authSecret);

  return new SignJWT({
    sub: user.sub,
    email: user.email.toLowerCase(),
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('curriculo-cms-auth')
    .setAudience('curriculo-cms-admin')
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Valida o token JWT da sessão e retorna os dados do administrador.
 * Retorna null se o token for inválido, adulterado, expirado ou de identidade não autorizada.
 */
export async function verifySessionToken(
  token: string,
  enforceProductionSub: boolean = process.env.NODE_ENV === 'production'
): Promise<AdminSessionUser | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const config = getAuthConfig();
    if (!config.authSecret) {
      return null;
    }

    const secretKey = new TextEncoder().encode(config.authSecret);

    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'curriculo-cms-auth',
      audience: 'curriculo-cms-admin',
    });

    if (
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      !payload.email ||
      payload.role !== 'SUPER_ADMIN' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    const normalizedEmail = payload.email.toLowerCase().trim();

    // Validação Zero Trust: o e-mail da sessão deve coincidir com reis.elias.ribeiro@gmail.com
    // e jamais ser o e-mail de contato público (elias.re_is@hotmail.com)
    if (
      normalizedEmail === PUBLIC_CONTACT_ONLY_EMAIL ||
      normalizedEmail !== config.adminEmail
    ) {
      console.warn('[SECURITY] Sessão com conta não autorizada rejeitada.');
      return null;
    }

    // Em produção, GOOGLE_ADMIN_SUB deve estar obrigatoriamente configurado
    if (enforceProductionSub && !config.adminSub) {
      console.warn('[SECURITY] Sessão rejeitada: GOOGLE_ADMIN_SUB ausente em produção.');
      return null;
    }

    // Se adminSub estiver definido, valida a correspondência exata com o sub imutável
    if (config.adminSub && payload.sub !== config.adminSub) {
      console.warn('[SECURITY] Sessão com identificador sub divergente rejeitada.');
      return null;
    }

    return {
      sub: payload.sub,
      email: normalizedEmail,
      name: (payload.name as string) || 'Administrador',
      avatarUrl: (payload.avatarUrl as string) || null,
      role: 'SUPER_ADMIN',
    };
  } catch {
    // Falha silenciosa e segura na verificação do token (expirado ou assinatura inválida)
    return null;
  }
}

/**
 * Retorna os cabeçalhos para inclusão ou remoção segura do cookie de sessão.
 */
export function getSessionCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

export function getSessionClearCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    },
  };
}
