/**
 * Configurações e constantes do subsistema de Autenticação e Autorização do CMS.
 *
 * Aplica o princípio Zero Trust:
 * - O e-mail administrativo é restrito à conta expressamente autorizada pelo proprietário.
 * - O identificador imutável `sub` do Google é validado contra falsificação de identidade.
 */

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  adminEmail: string;
  adminSub: string | null;
  authSecret: string;
  siteUrl: string;
  callbackUrl: string;
  isConfigured: boolean;
}

export function getAuthConfig(): AuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || '';
  const adminEmail = (process.env.GOOGLE_ADMIN_EMAIL?.trim() || 'elias.re_is@hotmail.com').toLowerCase();
  const adminSub = process.env.GOOGLE_ADMIN_SUB?.trim() || null;
  
  // URL base canônica para redirecionamentos OAuth
  const siteUrl = (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://curr-culo-v-2-0-8kbn.vercel.app'
  ).replace(/\/$/, '');

  const callbackUrl = `${siteUrl}/api/auth/callback/google`;

  // Segredo de sessão com proteção de ambiente
  let authSecret = process.env.AUTH_SECRET?.trim() || '';
  if (!authSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY_CRITICAL] AUTH_SECRET não configurado em ambiente de produção!');
    } else {
      // Valor temporário estrito apenas para testes e desenvolvimento local
      authSecret = 'dev-fallback-secret-minimum-32-chars-long-for-testing-only-12345';
    }
  }

  const isConfigured = Boolean(clientId && clientSecret && authSecret);

  return {
    clientId,
    clientSecret,
    adminEmail,
    adminSub,
    authSecret,
    siteUrl,
    callbackUrl,
    isConfigured,
  };
}

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Secure-cms-session' : 'cms-session';

export const OAUTH_STATE_COOKIE_NAME = 'cms-oauth-state';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 horas

