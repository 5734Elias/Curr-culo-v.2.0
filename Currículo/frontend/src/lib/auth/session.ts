import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import {
  getAuthConfig,
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
 * Retorna null se o token for inválido, adulterado ou expirado.
 */
export async function verifySessionToken(token: string): Promise<AdminSessionUser | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const config = getAuthConfig();
    const secretKey = new TextEncoder().encode(config.authSecret);

    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'curriculo-cms-auth',
      audience: 'curriculo-cms-admin',
    });

    if (
      !payload.sub ||
      !payload.email ||
      payload.role !== 'SUPER_ADMIN' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    // Validação Zero Trust: o e-mail da sessão deve coincidir com o e-mail administrativo configurado
    if (payload.email.toLowerCase() !== config.adminEmail) {
      console.warn('[SECURITY] Sessão com e-mail não autorizado rejeitada:', payload.email);
      return null;
    }

    // Se adminSub estiver definido, valida também o sub imutável
    if (config.adminSub && payload.sub !== config.adminSub) {
      console.warn('[SECURITY] Sessão com sub imutável divergente rejeitada:', payload.sub);
      return null;
    }

    return {
      sub: payload.sub as string,
      email: payload.email as string,
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
