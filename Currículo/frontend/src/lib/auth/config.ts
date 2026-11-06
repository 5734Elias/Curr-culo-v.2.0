/**
 * Configurações, validações e diagnósticos não sensíveis do subsistema de Autenticação e Infraestrutura do CMS.
 *
 * Aplica o princípio Zero Trust:
 * - O e-mail administrativo é restrito exclusivamente à conta Google oficial do proprietário (reis.elias.ribeiro@gmail.com).
 * - O e-mail de contato público (elias.re_is@hotmail.com) nunca é aceito como identidade administrativa.
 * - O identificador imutável `sub` do Google (GOOGLE_ADMIN_SUB) é obrigatório em produção e validado contra falsificação de identidade.
 * - Diagnósticos de configuração separam estritamente OAuth, SUB, Callback, Sessão, Banco de Dados e Armazenamento de Arquivos,
 *   sem jamais expor valores secretos.
 */

export const OFFICIAL_ADMIN_EMAIL = 'reis.elias.ribeiro@gmail.com';
export const PUBLIC_CONTACT_ONLY_EMAIL = 'elias.re_is@hotmail.com';
export const OFFICIAL_PRODUCTION_SITE_URL = 'https://curriculo-v3-admin.vercel.app';

export type ConfigVarStatus = 'CONFIGURADA' | 'AUSENTE' | 'INVÁLIDA';

export type AuthDiagnosticCode =
  | 'READY'
  | 'OAuthNotConfigured'
  | 'SubNotConfigured'
  | 'InvalidCallback';

export interface EnvironmentDiagnosticReport {
  projectTarget: string;
  environment: string;
  variables: {
    GOOGLE_CLIENT_ID: ConfigVarStatus;
    GOOGLE_CLIENT_SECRET: ConfigVarStatus;
    GOOGLE_ADMIN_EMAIL: ConfigVarStatus;
    GOOGLE_ADMIN_SUB: ConfigVarStatus;
    AUTH_SECRET: ConfigVarStatus;
    NEXTAUTH_URL: ConfigVarStatus;
    NEXT_PUBLIC_SITE_URL: ConfigVarStatus;
    DATABASE_URL: ConfigVarStatus;
    BLOB_READ_WRITE_TOKEN: ConfigVarStatus;
  };
  subsystems: {
    oauthConfigured: boolean;
    adminSubConfigured: boolean;
    callbackValid: boolean;
    authSecretValid: boolean;
    databaseConfigured: boolean;
    blobStorageConfigured: boolean;
  };
  authDiagnostic: AuthDiagnosticCode;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  adminEmail: string;
  adminSub: string | null;
  authSecret: string;
  siteUrl: string;
  callbackUrl: string;
  isOAuthConfigured: boolean;
  isAuthSecretValid: boolean;
  isCallbackValid: boolean;
  isSubConfigured: boolean;
  isConfigured: boolean;
  diagnosticCode: AuthDiagnosticCode;
}

const KNOWN_ENV_PLACEHOLDERS = new Set([
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_ADMIN_EMAIL',
  'GOOGLE_ADMIN_SUB',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SITE_URL',
  'DATABASE_URL',
  'BLOB_READ_WRITE_TOKEN',
  'CURRICULO_ELIAS',
  'SEU-CLIENT-ID',
  'SEU-CLIENT-SECRET',
  '123456789012345678901',
]);

/**
 * Remove espaços nas extremidades e aspas acidentais ("..." ou '...') coladas em variáveis de ambiente.
 */
export function cleanEnvValue(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']+|["']+$/g, '').trim();
}

function isPlaceholderOrVarName(val: string, varName: string): boolean {
  const upper = val.toUpperCase();
  if (upper === varName.toUpperCase()) return true;
  if (KNOWN_ENV_PLACEHOLDERS.has(upper)) return true;
  return false;
}

export function evaluateClientIdStatus(rawVal?: string): {
  value: string;
  status: ConfigVarStatus;
} {
  const val = cleanEnvValue(rawVal);
  if (!val) {
    return { value: '', status: 'AUSENTE' };
  }

  const isValid =
    !isPlaceholderOrVarName(val, 'GOOGLE_CLIENT_ID') &&
    !/\s/.test(val) &&
    val.endsWith('.apps.googleusercontent.com') &&
    val.length > '.apps.googleusercontent.com'.length + 3 &&
    !val.toLowerCase().startsWith('seu-client-id');

  return {
    value: val,
    status: isValid ? 'CONFIGURADA' : 'INVÁLIDA',
  };
}

export function evaluateClientSecretStatus(rawVal?: string): {
  value: string;
  status: ConfigVarStatus;
} {
  const val = cleanEnvValue(rawVal);
  if (!val) {
    return { value: '', status: 'AUSENTE' };
  }

  const isValid =
    !isPlaceholderOrVarName(val, 'GOOGLE_CLIENT_SECRET') &&
    !/\s/.test(val) &&
    val.length >= 12;

  return {
    value: val,
    status: isValid ? 'CONFIGURADA' : 'INVÁLIDA',
  };
}

export function evaluateAdminSubStatus(rawVal?: string): {
  value: string | null;
  status: ConfigVarStatus;
} {
  const val = cleanEnvValue(rawVal);
  if (!val) {
    return { value: null, status: 'AUSENTE' };
  }

  const isValid =
    !isPlaceholderOrVarName(val, 'GOOGLE_ADMIN_SUB') &&
    !/\s/.test(val) &&
    val.length >= 5;

  return {
    value: isValid ? val : null,
    status: isValid ? 'CONFIGURADA' : 'INVÁLIDA',
  };
}

function validateSiteAndCallbackUrl(
  rawUrl: string,
  isProduction: boolean
): { siteUrl: string; callbackUrl: string; isValid: boolean } {
  const cleaned = cleanEnvValue(rawUrl).replace(/\/+$/, '');
  try {
    const parsed = new URL(cleaned);
    const isHttpsOrLocal =
      parsed.protocol === 'https:' ||
      (!isProduction && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'));

    const isValidHost = isProduction
      ? parsed.protocol === 'https:' && Boolean(parsed.hostname)
      : isHttpsOrLocal;

    const siteUrl = `${parsed.protocol}//${parsed.host}`;
    return {
      siteUrl,
      callbackUrl: `${siteUrl}/api/auth/callback/google`,
      isValid: isValidHost,
    };
  } catch {
    return {
      siteUrl: OFFICIAL_PRODUCTION_SITE_URL,
      callbackUrl: `${OFFICIAL_PRODUCTION_SITE_URL}/api/auth/callback/google`,
      isValid: false,
    };
  }
}

export function getAuthConfig(): AuthConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  const clientIdCheck = evaluateClientIdStatus(process.env.GOOGLE_CLIENT_ID);
  const clientSecretCheck = evaluateClientSecretStatus(process.env.GOOGLE_CLIENT_SECRET);

  const clientId = clientIdCheck.value;
  const clientSecret = clientSecretCheck.value;
  const rawAdminEmail = cleanEnvValue(process.env.GOOGLE_ADMIN_EMAIL).toLowerCase();

  // Impede que o e-mail de contato público seja utilizado como identidade administrativa
  const adminEmail =
    !rawAdminEmail || rawAdminEmail === PUBLIC_CONTACT_ONLY_EMAIL
      ? OFFICIAL_ADMIN_EMAIL
      : rawAdminEmail;

  const isAdminEmailValid = !rawAdminEmail || rawAdminEmail === OFFICIAL_ADMIN_EMAIL;

  const adminSubCheck = evaluateAdminSubStatus(process.env.GOOGLE_ADMIN_SUB);
  const adminSub = adminSubCheck.value;

  // URL base canônica para redirecionamentos OAuth (Domínio oficial da Vercel por padrão)
  const rawSiteUrl =
    cleanEnvValue(process.env.NEXTAUTH_URL) ||
    cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) ||
    OFFICIAL_PRODUCTION_SITE_URL;

  const { siteUrl, callbackUrl, isValid: isCallbackValid } = validateSiteAndCallbackUrl(
    rawSiteUrl,
    isProduction
  );

  // Segredo de sessão com proteção de ambiente
  let authSecret = cleanEnvValue(process.env.AUTH_SECRET);

  if (!authSecret) {
    if (isProduction) {
      console.error('[SECURITY_CRITICAL] AUTH_SECRET não configurado em ambiente de produção!');
    } else {
      // Valor temporário estrito apenas para testes e desenvolvimento local
      authSecret = 'dev-fallback-secret-minimum-32-chars-long-for-testing-only-12345';
    }
  }

  const isOAuthConfigured = Boolean(
    clientIdCheck.status === 'CONFIGURADA' &&
      clientSecretCheck.status === 'CONFIGURADA' &&
      isAdminEmailValid &&
      adminEmail === OFFICIAL_ADMIN_EMAIL
  );
  const isAuthSecretValid =
    authSecret.length >= 32 && !isPlaceholderOrVarName(authSecret, 'AUTH_SECRET');
  const isSubConfigured = adminSubCheck.status === 'CONFIGURADA';

  let diagnosticCode: AuthDiagnosticCode = 'READY';
  if (!isCallbackValid) {
    diagnosticCode = 'InvalidCallback';
  } else if (!isOAuthConfigured || !isAuthSecretValid) {
    diagnosticCode = 'OAuthNotConfigured';
  } else if (isProduction && !isSubConfigured) {
    diagnosticCode = 'SubNotConfigured';
  }

  // Em produção, GOOGLE_ADMIN_SUB também é estritamente obrigatório
  const isConfigured =
    isCallbackValid &&
    isOAuthConfigured &&
    isAuthSecretValid &&
    (isProduction ? isSubConfigured : true);

  return {
    clientId,
    clientSecret,
    adminEmail,
    adminSub,
    authSecret,
    siteUrl,
    callbackUrl,
    isOAuthConfigured,
    isAuthSecretValid,
    isCallbackValid,
    isSubConfigured,
    isConfigured,
    diagnosticCode,
  };
}

/**
 * Inspeciona a disponibilidade e validade estrutural das variáveis de ambiente no servidor,
 * retornando exclusivamente os estados 'CONFIGURADA', 'AUSENTE' ou 'INVÁLIDA'.
 * Jamais retorna valores secretos, prefixos ou comprimentos.
 */
export function getEnvironmentDiagnostics(): EnvironmentDiagnosticReport {
  const isProduction = process.env.NODE_ENV === 'production';

  const clientIdStatus = evaluateClientIdStatus(process.env.GOOGLE_CLIENT_ID).status;
  const clientSecretStatus = evaluateClientSecretStatus(process.env.GOOGLE_CLIENT_SECRET).status;

  const rawAdminEmail = cleanEnvValue(process.env.GOOGLE_ADMIN_EMAIL).toLowerCase();
  const adminEmailStatus: ConfigVarStatus = !rawAdminEmail
    ? 'CONFIGURADA' // Utiliza o fallback canônico seguro reis.elias.ribeiro@gmail.com
    : rawAdminEmail === OFFICIAL_ADMIN_EMAIL
      ? 'CONFIGURADA'
      : 'INVÁLIDA';

  const adminSubStatus = evaluateAdminSubStatus(process.env.GOOGLE_ADMIN_SUB).status;

  const rawAuthSecret = cleanEnvValue(process.env.AUTH_SECRET);
  const authSecretStatus: ConfigVarStatus = !rawAuthSecret
    ? 'AUSENTE'
    : rawAuthSecret.length >= 32 && !isPlaceholderOrVarName(rawAuthSecret, 'AUTH_SECRET')
      ? 'CONFIGURADA'
      : 'INVÁLIDA';

  const rawNextAuthUrl =
    cleanEnvValue(process.env.NEXTAUTH_URL) ||
    cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) ||
    OFFICIAL_PRODUCTION_SITE_URL;
  const urlCheck = validateSiteAndCallbackUrl(rawNextAuthUrl, isProduction);
  const nextAuthUrlStatus: ConfigVarStatus = urlCheck.isValid ? 'CONFIGURADA' : 'INVÁLIDA';

  const rawPublicSiteUrl =
    cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) || OFFICIAL_PRODUCTION_SITE_URL;
  const publicSiteUrlCheck = validateSiteAndCallbackUrl(rawPublicSiteUrl, isProduction);
  const nextPublicSiteUrlStatus: ConfigVarStatus = publicSiteUrlCheck.isValid
    ? 'CONFIGURADA'
    : 'INVÁLIDA';

  const rawDatabaseUrl = cleanEnvValue(process.env.DATABASE_URL);
  const databaseUrlStatus: ConfigVarStatus = !rawDatabaseUrl
    ? 'AUSENTE'
    : (rawDatabaseUrl.startsWith('postgres://') || rawDatabaseUrl.startsWith('postgresql://')) &&
        !rawDatabaseUrl.includes('usuario:senha@host') &&
        !isPlaceholderOrVarName(rawDatabaseUrl, 'DATABASE_URL')
      ? 'CONFIGURADA'
      : 'INVÁLIDA';

  const rawBlobToken = cleanEnvValue(process.env.BLOB_READ_WRITE_TOKEN);
  const blobTokenStatus: ConfigVarStatus = !rawBlobToken
    ? 'AUSENTE'
    : rawBlobToken.length >= 15 &&
        !/\s/.test(rawBlobToken) &&
        !isPlaceholderOrVarName(rawBlobToken, 'BLOB_READ_WRITE_TOKEN')
      ? 'CONFIGURADA'
      : 'INVÁLIDA';

  const authConfig = getAuthConfig();

  return {
    projectTarget: 'curriculo-v3-admin',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    variables: {
      GOOGLE_CLIENT_ID: clientIdStatus,
      GOOGLE_CLIENT_SECRET: clientSecretStatus,
      GOOGLE_ADMIN_EMAIL: adminEmailStatus,
      GOOGLE_ADMIN_SUB: adminSubStatus,
      AUTH_SECRET: authSecretStatus,
      NEXTAUTH_URL: nextAuthUrlStatus,
      NEXT_PUBLIC_SITE_URL: nextPublicSiteUrlStatus,
      DATABASE_URL: databaseUrlStatus,
      BLOB_READ_WRITE_TOKEN: blobTokenStatus,
    },
    subsystems: {
      oauthConfigured:
        clientIdStatus === 'CONFIGURADA' &&
        clientSecretStatus === 'CONFIGURADA' &&
        adminEmailStatus === 'CONFIGURADA',
      adminSubConfigured: adminSubStatus === 'CONFIGURADA',
      callbackValid: nextAuthUrlStatus === 'CONFIGURADA',
      authSecretValid: authConfig.isAuthSecretValid,
      databaseConfigured: databaseUrlStatus === 'CONFIGURADA',
      blobStorageConfigured: blobTokenStatus === 'CONFIGURADA',
    },
    authDiagnostic: authConfig.diagnosticCode,
  };
}

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Secure-cms-session' : 'cms-session';

export const OAUTH_STATE_COOKIE_NAME = 'cms-oauth-state';

export const OAUTH_PKCE_COOKIE_NAME = 'cms-oauth-pkce';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 horas

/**
 * Mapeia os códigos de erro e diagnóstico do fluxo administrativo para títulos, mensagens e categorias isoladas.
 * Garante que indisponibilidade do banco PostgreSQL ou de armazenamento jamais seja confundida com credencial OAuth ausente.
 */
export function resolveLoginErrorDetails(
  error: string | null,
  reason?: string | null
): { title: string; message: string; category: string } | null {
  if (!error) return null;

  switch (error) {
    case 'AccessDenied':
      return {
        title: 'Acesso Negado (Zero Trust)',
        message:
          'Esta conta Google não está autorizada a administrar este portfólio. Apenas a conta Google oficial (reis.elias.ribeiro@gmail.com) e o identificador imutável (sub) do proprietário possuem permissão.',
        category: 'AUTH_DENIED',
      };
    case 'OAuthNotConfigured':
    case 'ConfigurationError':
      return {
        title: 'OAuth Não Configurado no Servidor',
        message:
          reason === 'AuthSecretInvalid'
            ? 'O segredo criptográfico de sessão (AUTH_SECRET) está ausente ou possui menos de 32 caracteres no painel da Vercel.'
            : 'As credenciais do Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) ou o segredo de sessão (AUTH_SECRET) ainda não foram cadastrados no ambiente Production da Vercel.',
        category: 'OAUTH_CONFIG',
      };
    case 'SubNotConfigured':
      return {
        title: 'Identificador Google SUB Ausente',
        message:
          'Por segurança Zero Trust, o login em produção exige que o identificador imutável GOOGLE_ADMIN_SUB esteja previamente configurado nas variáveis de ambiente da Vercel.',
        category: 'SUB_CONFIG',
      };
    case 'InvalidCallback':
      return {
        title: 'URL de Callback OAuth Inválida',
        message:
          'A URL base configurada (NEXTAUTH_URL) é inválida ou incompatível com o endpoint HTTPS oficial de callback (/api/auth/callback/google).',
        category: 'CALLBACK_CONFIG',
      };
    case 'DatabaseUnavailable':
      return {
        title: 'Banco de Dados Indisponível',
        message:
          'O banco de dados PostgreSQL (DATABASE_URL) está temporariamente indisponível ou não configurado. O login Google opera de forma independente em modo resiliente.',
        category: 'DATABASE_STATUS',
      };
    case 'StorageUnavailable':
      return {
        title: 'Armazenamento de Arquivos Indisponível',
        message:
          'O serviço de armazenamento persistente de mídia (BLOB_READ_WRITE_TOKEN) não está configurado para gravação de novos comprovantes em produção.',
        category: 'STORAGE_STATUS',
      };
    case 'RateLimitExceeded':
      return {
        title: 'Muitas Tentativas de Autenticação',
        message:
          'O limite de tentativas de login para o seu endereço IP foi atingido temporariamente. Aguarde alguns minutos antes de tentar novamente.',
        category: 'RATE_LIMIT',
      };
    case 'SessionExpired':
      return {
        title: 'Sessão Expirada',
        message: 'Sua sessão administrativa expirou. Por favor, faça login novamente.',
        category: 'SESSION',
      };
    case 'StateMismatch':
      return {
        title: 'Falha de Validação CSRF',
        message: 'Ocorreu uma divergência de segurança na validação de estado. Tente novamente.',
        category: 'CSRF',
      };
    case 'PkceMissing':
      return {
        title: 'Falha de Validação PKCE',
        message:
          'O verificador criptográfico PKCE expirou ou estava ausente na requisição. Inicie o login novamente.',
        category: 'PKCE',
      };
    case 'Cancelled':
      return {
        title: 'Login Cancelado',
        message: 'O procedimento de login com a conta Google foi cancelado.',
        category: 'CANCELLED',
      };
    case 'AuthenticationFailed':
    case 'GoogleAuthError':
    case 'InvalidToken':
    case 'CallbackError':
    case 'MissingCode':
    default:
      return {
        title: 'Falha na Autenticação Google',
        message:
          'Não foi possível concluir a validação do código ou token junto ao Google OAuth. Verifique a configuração do cliente OAuth e tente novamente.',
        category: 'AUTH_FAILURE',
      };
  }
}
