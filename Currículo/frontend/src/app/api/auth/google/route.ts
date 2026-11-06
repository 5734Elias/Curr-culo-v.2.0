import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, OAUTH_STATE_COOKIE_NAME } from '@/lib/auth/config';
import { buildGoogleAuthUrl } from '@/lib/auth/googleOidc';
import { extractClientIp, hashIpForPrivacy, checkAuthRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  // 1. Rate limiting no fluxo de autenticação
  const clientIp = extractClientIp(req.headers);
  const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');
  const rateLimit = await checkAuthRateLimit(clientIpHash);

  if (!rateLimit.allowed) {
    console.warn('[SECURITY] Rate limit atingido no início do fluxo Google OAuth.');
    return NextResponse.redirect(new URL('/admin/login?error=RateLimitExceeded', req.url));
  }

  const config = getAuthConfig();

  // 2. Se credenciais do Google não foram configuradas, redireciona informando a ausência de configuração
  if (!config.clientId || !config.clientSecret || !config.authSecret) {
    console.warn('[AUTH] Tentativa de login Google com variáveis OAuth pendentes.');
    const errorUrl = new URL('/admin/login?error=ConfigurationError', req.url);
    return NextResponse.redirect(errorUrl);
  }

  // 3. Em produção, exige que GOOGLE_ADMIN_SUB esteja previamente configurado (Zero Trust)
  if (process.env.NODE_ENV === 'production' && !config.adminSub) {
    console.warn('[SECURITY] Tentativa de login em produção sem GOOGLE_ADMIN_SUB configurado.');
    const errorUrl = new URL('/admin/login?error=SubNotConfigured', req.url);
    return NextResponse.redirect(errorUrl);
  }

  // 4. Gera estado criptográfico aleatório para proteção contra CSRF
  const stateBytes = new Uint8Array(24);
  crypto.getRandomValues(stateBytes);
  const state = Buffer.from(stateBytes).toString('base64url');

  try {
    const authUrl = buildGoogleAuthUrl(state);
    const response = NextResponse.redirect(authUrl);

    // Grava o cookie temporário de validação de estado (10 minutos)
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutos
    });

    return response;
  } catch {
    console.error('[AUTH_ERROR] Erro ao construir URL de autenticação Google.');
    return NextResponse.redirect(new URL('/admin/login?error=UnknownError', req.url));
  }
}
