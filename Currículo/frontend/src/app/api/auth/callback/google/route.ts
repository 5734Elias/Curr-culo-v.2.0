import { NextRequest, NextResponse } from 'next/server';
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/config';
import {
  exchangeCodeForTokens,
  verifyGoogleIdToken,
  authorizeAdminUser,
} from '@/lib/auth/googleOidc';
import { createSessionToken } from '@/lib/auth/session';
import { extractClientIp, hashIpForPrivacy, checkAuthRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  // Identificação segura do IP para rate limiting e trilha de auditoria
  const clientIp = extractClientIp(req.headers);
  const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

  // 0. Rate limiting contra abuso no endpoint de callback OAuth
  const rateLimit = await checkAuthRateLimit(clientIpHash);
  if (!rateLimit.allowed) {
    console.warn('[SECURITY] Rate limit atingido no callback Google OAuth.');
    const redirectUrl = new URL('/admin/login?error=RateLimitExceeded', req.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  const url = req.nextUrl;
  const searchParams = url.searchParams;

  // 1. Trata cancelamento ou erro devolvido pelo Google
  const errorParam = searchParams.get('error');
  if (errorParam) {
    console.warn('[AUTH] Fluxo Google OAuth encerrado com código de retorno.');
    const redirectUrl = new URL(
      errorParam === 'access_denied'
        ? '/admin/login?error=Cancelled'
        : '/admin/login?error=GoogleAuthError',
      req.url
    );
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  // 2. Validação contra CSRF através do state
  const returnedState = searchParams.get('state');
  const storedState = req.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!returnedState || !storedState || returnedState !== storedState) {
    console.warn('[SECURITY] Tentativa de OAuth com state inválido ou ausente (potencial CSRF).');
    const redirectUrl = new URL('/admin/login?error=StateMismatch', req.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  // 3. Obtenção do código de autorização
  const code = searchParams.get('code');
  if (!code) {
    console.warn('[AUTH] Requisição de callback sem código de autorização.');
    const redirectUrl = new URL('/admin/login?error=MissingCode', req.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  try {
    // 4. Troca do código de autorização pelo token de ID do Google
    const { id_token } = await exchangeCodeForTokens(code);
    if (!id_token) {
      throw new Error('Google não retornou o id_token esperado.');
    }

    // 5. Validação criptográfica do token com as chaves públicas do Google (JWKS)
    const googleProfile = await verifyGoogleIdToken(id_token);
    if (!googleProfile) {
      console.warn('[SECURITY] Token de ID do Google inválido ou rejeitado na verificação criptográfica.');
      const redirectUrl = new URL('/admin/login?error=InvalidToken', req.url);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      return response;
    }

    // 6. Autorização estrita Zero Trust (e-mail verificado reis.elias.ribeiro@gmail.com e sub imutável)
    const authResult = await authorizeAdminUser(googleProfile, clientIpHash);
    if (!authResult.authorized || !authResult.user) {
      console.warn('[SECURITY] Conta Google autenticada mas NÃO autorizada a acessar o CMS.');
      const errorQuery =
        authResult.reason === 'SUB_NOT_CONFIGURED' ? 'SubNotConfigured' : 'AccessDenied';
      const redirectUrl = new URL(`/admin/login?error=${errorQuery}`, req.url);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      return response;
    }

    // 7. Emissão da sessão administrativa segura
    const sessionToken = await createSessionToken(authResult.user);
    const destinationUrl = new URL('/admin', req.url);
    const response = NextResponse.redirect(destinationUrl);

    // Grava cookie de sessão com atributos de segurança avançados
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    // Limpa o cookie temporário de validação de estado
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
  } catch {
    console.error('[AUTH_ERROR] Falha no processamento do callback Google OAuth.');
    const redirectUrl = new URL('/admin/login?error=CallbackError', req.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }
}
