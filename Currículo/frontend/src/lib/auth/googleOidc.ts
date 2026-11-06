import { createRemoteJWKSet } from 'jose/jwks/remote';
import { jwtVerify } from 'jose/jwt/verify';
import { getAuthConfig } from './config';
import { AdminSessionUser } from './session';
import { prisma, isDatabaseAvailable } from '../prisma';

const GOOGLE_CERTS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');
const googleJWKS = createRemoteJWKSet(GOOGLE_CERTS_URL);

export interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export interface AuthorizeResult {
  authorized: boolean;
  reason?: 'EMAIL_MISMATCH' | 'SUB_MISMATCH' | 'EMAIL_NOT_VERIFIED' | 'CONFIG_ERROR';
  user?: AdminSessionUser;
}

/**
 * Gera a URL do Google OAuth 2.0 para redirecionamento do administrador.
 */
export function buildGoogleAuthUrl(state: string): string {
  const config = getAuthConfig();
  if (!config.clientId) {
    throw new Error('GOOGLE_CLIENT_ID não configurado no servidor.');
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Troca o código de autorização retornado pelo Google pelos tokens de acesso e ID.
 */
export async function exchangeCodeForTokens(code: string): Promise<{ id_token: string; access_token: string }> {
  const config = getAuthConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[AUTH_ERROR] Falha na troca do código OAuth por tokens com o Google:', errorBody);
    throw new Error('Falha ao comunicar com o provedor Google OAuth.');
  }

  return response.json();
}

/**
 * Valida o ID Token emitido pelo Google contra o conjunto público de chaves (JWKS) do Google.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload | null> {
  const config = getAuthConfig();

  try {
    const { payload } = await jwtVerify(idToken, googleJWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: config.clientId,
    });

    if (!payload.sub || !payload.email || typeof payload.email !== 'string') {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: Boolean(payload.email_verified),
      name: (payload.name as string) || 'Administrador',
      picture: (payload.picture as string) || undefined,
    };
  } catch (err) {
    console.warn('[SECURITY] Falha na validação do Google ID Token:', err);
    return null;
  }
}

/**
 * Aplica a política estrita de autorização Zero Trust.
 * Apenas a conta Google explicitamente configurada pelo proprietário é autorizada.
 */
export async function authorizeAdminUser(
  googleProfile: GoogleIdTokenPayload,
  clientIpHash: string = 'unknown'
): Promise<AuthorizeResult> {
  const config = getAuthConfig();

  // 1. O e-mail deve ter sido verificado pelo próprio Google
  if (!googleProfile.email_verified) {
    console.warn('[SECURITY] Tentativa de login rejeitada: e-mail não verificado pelo Google:', googleProfile.email);
    return { authorized: false, reason: 'EMAIL_NOT_VERIFIED' };
  }

  // 2. O e-mail deve ser idêntico ao e-mail do proprietário
  if (googleProfile.email.toLowerCase().trim() !== config.adminEmail) {
    console.warn(
      `[SECURITY] Tentativa de acesso não autorizada: '${googleProfile.email}' tentou acessar o CMS (Esperado: '${config.adminEmail}').`
    );

    // Registra tentativa não autorizada no log de auditoria
    if (await isDatabaseAvailable()) {
      try {
        await prisma.auditLog.create({
          data: {
            action: 'UNAUTHORIZED_LOGIN_ATTEMPT',
            entityType: 'Authentication',
            ipHash: clientIpHash,
            adminEmail: googleProfile.email.toLowerCase(),
            adminSub: googleProfile.sub,
            details: {
              attemptedEmail: googleProfile.email,
              expectedEmail: config.adminEmail,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (err) {
        console.warn('[SECURITY] Erro ao gravar log de auditoria:', err);
      }
    }

    return { authorized: false, reason: 'EMAIL_MISMATCH' };
  }

  // 3. Se GOOGLE_ADMIN_SUB estiver configurado, valida a imutabilidade do identificador Google
  if (config.adminSub && googleProfile.sub !== config.adminSub) {
    console.warn(
      `[SECURITY] Identificador sub divergente para '${googleProfile.email}': recebido '${googleProfile.sub}', esperado '${config.adminSub}'.`
    );
    return { authorized: false, reason: 'SUB_MISMATCH' };
  }

  // 4. Usuário validado e autorizado com privilégio de SUPER_ADMIN
  const user: AdminSessionUser = {
    sub: googleProfile.sub,
    email: googleProfile.email.toLowerCase().trim(),
    name: googleProfile.name || 'Elias Ribeiro dos Reis',
    avatarUrl: googleProfile.picture || null,
    role: 'SUPER_ADMIN',
  };

  // Se banco de dados estiver disponível, sincroniza e registra log de auditoria
  if (await isDatabaseAvailable()) {
    try {
      await prisma.administrator.upsert({
        where: { email: user.email },
        update: {
          googleSub: user.sub,
          name: user.name,
          avatarUrl: user.avatarUrl,
          lastLoginAt: new Date(),
        },
        create: {
          email: user.email,
          googleSub: user.sub,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: 'SUPER_ADMIN',
          lastLoginAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_LOGIN_SUCCESS',
          entityType: 'Authentication',
          ipHash: clientIpHash,
          adminEmail: user.email,
          adminSub: user.sub,
          details: {
            loginTime: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.warn('[SECURITY] Falha ao persistir login de administrador no banco:', err);
    }
  }

  return { authorized: true, user };
}
