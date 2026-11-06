/**
 * Configurações e constantes do subsistema de Autenticação e Autorização do CMS.
 *
 * Aplica o princípio Zero Trust:
 * - O e-mail administrativo é restrito exclusivamente à conta Google oficial do proprietário (reis.elias.ribeiro@gmail.com).
 * - O e-mail de contato público (elias.re_is@hotmail.com) nunca é aceito como identidade administrativa.
 * - O identificador imutável `sub` do Google (GOOGLE_ADMIN_SUB) é obrigatório em produção e validado contra falsificação de identidade.
 */

export const OFFICIAL_ADMIN_EMAIL = 'reis.elias.ribeiro@gmail.com';
export const PUBLIC_CONTACT_ONLY_EMAIL = 'elias.re_is@hotmail.com';

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
  const rawAdminEmail = (process.env.GOOGLE_ADMIN_EMAIL?.trim() || OFFICIAL_ADMIN_EMAIL).toLowerCase();

  // Impede que o e-mail de contato público seja utilizado como identidade administrativa
  const adminEmail =
    rawAdminEmail === PUBLIC_CONTACT_ONLY_EMAIL ? OFFICIAL_ADMIN_EMAIL : rawAdminEmail;

  const adminSub = process.env.GOOGLE_ADMIN_SUB?.trim() || null;

  // URL base canônica para redirecionamentos OAuth (Domínio oficial da Vercel por padrão)
  const siteUrl = (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://curr-culo-v-2-0-8kbn.vercel.app'
  ).replace(/\/$/, '');

  const callbackUrl = `${siteUrl}/api/auth/callback/google`;

  // Segredo de sessão com proteção de ambiente
  let authSecret = process.env.AUTH_SECRET?.trim() || '';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!authSecret) {
    if (isProduction) {
      console.error('[SECURITY_CRITICAL] AUTH_SECRET não configurado em ambiente de produção!');
    } else {
      // Valor temporário estrito apenas para testes e desenvolvimento local
      authSecret = 'dev-fallback-secret-minimum-32-chars-long-for-testing-only-12345';
    }
  }

  // Em produção, GOOGLE_ADMIN_SUB também é estritamente obrigatório
  const isConfigured = isProduction
    ? Boolean(clientId && clientSecret && authSecret && adminSub)
    : Boolean(clientId && clientSecret && authSecret);

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

export const OAUTH_PKCE_COOKIE_NAME = 'cms-oauth-pkce';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 horas
