import crypto from 'node:crypto';
import { createRemoteJWKSet } from 'jose/jwks/remote';
import { jwtVerify } from 'jose/jwt/verify';
import { getAuthConfig, PUBLIC_CONTACT_ONLY_EMAIL } from './config';
import { AdminSessionUser } from './session';
import { prisma, isDatabaseAvailable } from '../prisma';

const GOOGLE_CERTS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');
const googleJWKS = createRemoteJWKSet(GOOGLE_CERTS_URL);

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Calcula o code_challenge S256 (RFC 7636) a partir de um code_verifier.
 */
export function computeCodeChallenge(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

/**
 * Gera um par criptográfico PKCE (Proof Key for Code Exchange - RFC 7636) com método S256.
 */
export function generatePkcePair(): PkcePair {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = computeCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

export interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export interface AuthorizeResult {
  authorized: boolean;
  reason?:
    | 'EMAIL_MISMATCH'
    | 'SUB_MISMATCH'
    | 'SUB_NOT_CONFIGURED'
    | 'EMAIL_NOT_VERIFIED'
    | 'CONFIG_ERROR';
  user?: AdminSessionUser;
}

/**
 * Gera a URL do Google OAuth 2.0 / OpenID Connect para redirecionamento do administrador.
 * Inclui proteção anti-CSRF (`state`) e PKCE (`code_challenge` S256).
 * O fluxo aproveita integralmente a autenticação de dois fatores (2FA) já ativa na conta Google.
 */
export function buildGoogleAuthUrl(state: string, codeChallenge?: string): string {
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

  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Troca o código de autorização retornado pelo Google pelos tokens de acesso e ID,
 * enviando o `code_verifier` PKCE correspondente para impedir interceptação de código.
 * Não registra tokens nem corpos brutos de resposta em logs para preservar sigilo absoluto.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ id_token: string; access_token: string }> {
  if (!codeVerifier || !codeVerifier.trim()) {
    throw new Error('Verificador PKCE (code_verifier) obrigatório para troca de código OAuth.');
  }

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
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    console.error(`[AUTH_ERROR] Falha na troca do código OAuth com o Google (HTTP ${response.status}).`);
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

    if (
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      !payload.email ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified === true,
      name: (payload.name as string) || 'Administrador',
      picture: (payload.picture as string) || undefined,
    };
  } catch {
    console.warn('[SECURITY] Falha na validação criptográfica do Google ID Token.');
    return null;
  }
}

/**
 * Aplica a política estrita de autorização Zero Trust:
 * 1. O e-mail DEVE ter sido verificado pelo Google (email_verified === true).
 * 2. O e-mail DEVE coincidir com GOOGLE_ADMIN_EMAIL (reis.elias.ribeiro@gmail.com) e jamais ser o e-mail de contato público.
 * 3. Em produção, GOOGLE_ADMIN_SUB DEVE estar previamente configurado (não permite auto-registro pelo primeiro login).
 * 4. O identificador imutável `sub` DEVE corresponder a GOOGLE_ADMIN_SUB.
 * 5. Nenhum token, credencial ou identificador `sub` é exposto em logs.
 */
export async function authorizeAdminUser(
  googleProfile: GoogleIdTokenPayload,
  clientIpHash: string = 'unknown',
  enforceProductionSub: boolean = process.env.NODE_ENV === 'production'
): Promise<AuthorizeResult> {
  const config = getAuthConfig();

  // 1. O e-mail deve ter sido verificado pelo próprio Google
  if (googleProfile.email_verified !== true) {
    console.warn('[SECURITY] Tentativa de login rejeitada: e-mail Google não verificado.');
    return { authorized: false, reason: 'EMAIL_NOT_VERIFIED' };
  }

  // 2. Validação do identificador sub no payload
  if (!googleProfile.sub || typeof googleProfile.sub !== 'string' || !googleProfile.sub.trim()) {
    console.warn('[SECURITY] Tentativa de login rejeitada: identificador sub ausente no perfil.');
    return { authorized: false, reason: 'SUB_MISMATCH' };
  }

  // 3. O e-mail deve ser idêntico ao e-mail oficial do administrador (e nunca o e-mail apenas de contato público)
  const normalizedEmail = (googleProfile.email || '').toLowerCase().trim();
  if (
    normalizedEmail === PUBLIC_CONTACT_ONLY_EMAIL ||
    normalizedEmail !== config.adminEmail
  ) {
    console.warn('[SECURITY] Tentativa de acesso administrativo negada: conta Google não autorizada.');

    if (await isDatabaseAvailable()) {
      try {
        await prisma.auditLog.create({
          data: {
            action: 'UNAUTHORIZED_LOGIN_ATTEMPT',
            entityType: 'Authentication',
            ipHash: clientIpHash,
            adminEmail: 'redacted-unauthorized',
            adminSub: 'redacted-unauthorized',
            details: {
              reason: 'EMAIL_MISMATCH',
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch {
        console.warn('[SECURITY] Erro ao gravar log de auditoria de tentativa rejeitada.');
      }
    }

    return { authorized: false, reason: 'EMAIL_MISMATCH' };
  }

  // 4. Em produção, exige que GOOGLE_ADMIN_SUB esteja previamente configurado (impede "first user claims admin")
  if (enforceProductionSub && !config.adminSub) {
    console.error('[SECURITY] GOOGLE_ADMIN_SUB não configurado em produção. Login bloqueado (Fail-Closed).');
    return { authorized: false, reason: 'SUB_NOT_CONFIGURED' };
  }

  // 5. Vinculação estrita ao identificador imutável `sub` da conta Google
  if (config.adminSub && googleProfile.sub !== config.adminSub) {
    console.warn('[SECURITY] Tentativa de acesso administrativo negada: identificador imutável (sub) divergente.');

    if (await isDatabaseAvailable()) {
      try {
        await prisma.auditLog.create({
          data: {
            action: 'UNAUTHORIZED_LOGIN_ATTEMPT',
            entityType: 'Authentication',
            ipHash: clientIpHash,
            adminEmail: normalizedEmail,
            adminSub: 'redacted-mismatch',
            details: {
              reason: 'SUB_MISMATCH',
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch {
        console.warn('[SECURITY] Erro ao gravar log de auditoria de divergência de sub.');
      }
    }

    return { authorized: false, reason: 'SUB_MISMATCH' };
  }

  // 6. Usuário validado e autorizado com privilégio de SUPER_ADMIN
  const user: AdminSessionUser = {
    sub: googleProfile.sub,
    email: normalizedEmail,
    name: googleProfile.name || 'Elias Ribeiro dos Reis',
    avatarUrl: googleProfile.picture || null,
    role: 'SUPER_ADMIN',
  };

  // Sincroniza registro apenas quando o sub configurado estiver validado
  if (config.adminSub && (await isDatabaseAvailable())) {
    try {
      await prisma.administrator.upsert({
        where: { email: user.email },
        update: {
          googleSub: config.adminSub,
          name: user.name,
          avatarUrl: user.avatarUrl,
          lastLoginAt: new Date(),
        },
        create: {
          email: user.email,
          googleSub: config.adminSub,
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
          adminSub: 'verified-admin-sub',
          details: {
            loginTime: new Date().toISOString(),
          },
        },
      });
    } catch {
      console.warn('[SECURITY] Falha ao persistir evento de login de administrador no banco.');
    }
  }

  return { authorized: true, user };
}
