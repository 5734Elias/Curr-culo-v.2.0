import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, OAUTH_STATE_COOKIE_NAME } from '@/lib/auth/config';
import { buildGoogleAuthUrl } from '@/lib/auth/googleOidc';

export async function GET(req: NextRequest) {
  const config = getAuthConfig();

  // Se credenciais do Google não foram configuradas, redireciona informando a ausência de configuração
  if (!config.clientId || !config.clientSecret) {
    console.warn('[AUTH] Tentativa de login Google sem GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET configurados.');
    const errorUrl = new URL('/admin/login?error=ConfigurationError', req.url);
    return NextResponse.redirect(errorUrl);
  }

  // Gera estado criptográfico aleatório para proteção contra CSRF
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
  } catch (err) {
    console.error('[AUTH_ERROR] Erro ao construir URL de autenticação Google:', err);
    return NextResponse.redirect(new URL('/admin/login?error=UnknownError', req.url));
  }
}

