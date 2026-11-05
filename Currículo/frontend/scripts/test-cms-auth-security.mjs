import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';

import {
  getAuthConfig,
  SESSION_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from '../src/lib/auth/config.ts';
import {
  createSessionToken,
  verifySessionToken,
  getSessionCookieOptions,
  getSessionClearCookieOptions,
} from '../src/lib/auth/session.ts';
import {
  buildGoogleAuthUrl,
  authorizeAdminUser,
} from '../src/lib/auth/googleOidc.ts';
import { GET as getGoogleAuth } from '../src/app/api/auth/google/route.ts';
import { GET as getGoogleCallback } from '../src/app/api/auth/callback/google/route.ts';
import { GET as getLogout, POST as postLogout } from '../src/app/api/auth/logout/route.ts';
import { GET as getSessionApi } from '../src/app/api/auth/session/route.ts';
import { middleware } from '../src/middleware.ts';

console.log('================================================================');
console.log('--- TEST SUITE: CMS AUTHENTICATION & ZERO-TRUST SECURITY (FASE 3) ---');
console.log('================================================================');

// ----------------------------------------------------------------------------
// [1/6] CONFIGURAÇÃO E EXTRAÇÃO SEGURA DE AMBIENTE
// ----------------------------------------------------------------------------
console.log('\n[1/6] Testando configurações de autenticação e política de segredos...');
const config = getAuthConfig();
assert(config.adminEmail === 'elias.re_is@hotmail.com', 'E-mail do administrador deve ser elias.re_is@hotmail.com');
assert(config.authSecret.length >= 32, 'authSecret deve ter no mínimo 32 caracteres para HS256 seguro.');
assert(config.callbackUrl.includes('/api/auth/callback/google'), 'callbackUrl deve apontar para o endpoint de callback.');
console.log('  -> Configuração de autorização Zero Trust validada: OK');

// ----------------------------------------------------------------------------
// [2/6] CRIAÇÃO, ASSINATURA E VALIDAÇÃO DE TOKENS JWT DE SESSÃO
// ----------------------------------------------------------------------------
console.log('\n[2/6] Testando ciclo de vida criptográfico dos tokens de sessão (JWT)...');

const mockAdminUser = {
  sub: 'google-sub-elias-123456789',
  email: 'elias.re_is@hotmail.com',
  name: 'Elias Ribeiro dos Reis',
  role: 'SUPER_ADMIN',
};

// 2.1 Emissão e verificação de token válido
const validToken = await createSessionToken(mockAdminUser);
assert(typeof validToken === 'string' && validToken.length > 50, 'Token JWT deve ser gerado.');

const verified = await verifySessionToken(validToken);
assert(verified !== null, 'Token recém-gerado deve ser verificado com sucesso.');
assert.strictEqual(verified.email, 'elias.re_is@hotmail.com');
assert.strictEqual(verified.role, 'SUPER_ADMIN');
console.log('  -> Emissão e verificação de JWT de sessão com HMAC SHA-256: OK');

// 2.2 Rejeição de token adulterado
const tamperedToken = validToken.slice(0, -6) + 'abcdef';
const tamperedResult = await verifySessionToken(tamperedToken);
assert.strictEqual(tamperedResult, null, 'Token com assinatura adulterada DEVE ser rejeitado.');
console.log('  -> Rejeição segura de token com assinatura adulterada: OK');

// 2.3 Rejeição de token assinado com chave secreta incorreta
const forgedToken = await new SignJWT({
  sub: mockAdminUser.sub,
  email: mockAdminUser.email,
  role: 'SUPER_ADMIN',
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuer('curriculo-cms-auth')
  .setAudience('curriculo-cms-admin')
  .setExpirationTime('24h')
  .sign(new TextEncoder().encode('chave-falsa-do-atacante-com-mais-de-32-chars-xyz'));

const forgedResult = await verifySessionToken(forgedToken);
assert.strictEqual(forgedResult, null, 'Token assinado com chave forjada DEVE ser rejeitado.');
console.log('  -> Rejeição segura de token forjado com chave externa: OK');

// 2.4 Rejeição de token com e-mail não autorizado (Zero Trust)
const attackerToken = await new SignJWT({
  sub: 'attacker-sub',
  email: 'invasor@gmail.com',
  role: 'SUPER_ADMIN',
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuer('curriculo-cms-auth')
  .setAudience('curriculo-cms-admin')
  .setExpirationTime('24h')
  .sign(new TextEncoder().encode(config.authSecret));

const attackerResult = await verifySessionToken(attackerToken);
assert.strictEqual(attackerResult, null, 'Token com e-mail não autorizado DEVE ser rejeitado pelo Zero Trust.');
console.log('  -> Bloqueio Zero Trust para e-mails não autorizados em tokens válidos: OK');

// ----------------------------------------------------------------------------
// [3/6] ATRIBUTOS DE SEGURANÇA DE COOKIES (HttpOnly, Secure, SameSite)
// ----------------------------------------------------------------------------
console.log('\n[3/6] Testando conformidade de cookies e opções de segurança...');

const prodCookieOpts = getSessionCookieOptions(true);
assert.strictEqual(prodCookieOpts.options.httpOnly, true, 'Cookie de sessão DEVE ser HttpOnly.');
assert.strictEqual(prodCookieOpts.options.secure, true, 'Cookie em produção DEVE ter Secure=true.');
assert.strictEqual(prodCookieOpts.options.sameSite, 'lax', 'Cookie DEVE usar SameSite=lax.');
assert.strictEqual(prodCookieOpts.options.path, '/', 'Cookie deve ser delimitado ao path raiz.');

const clearCookieOpts = getSessionClearCookieOptions(true);
assert.strictEqual(clearCookieOpts.options.maxAge, 0, 'Limpeza de cookie deve definir maxAge=0.');
console.log('  -> Atributos de segurança dos cookies (HttpOnly, Secure, SameSite): OK');

// ----------------------------------------------------------------------------
// [4/6] AUTORIZAÇÃO ZERO TRUST COM PERFIL GOOGLE (authorizeAdminUser)
// ----------------------------------------------------------------------------
console.log('\n[4/6] Testando motor de autorização Zero Trust contra Google Profiles...');

// 4.1 Rejeição de e-mail não verificado pelo Google
const unverifiedProfile = {
  sub: 'google-sub-1',
  email: 'elias.re_is@hotmail.com',
  email_verified: false,
};
const unverifiedResult = await authorizeAdminUser(unverifiedProfile, 'test-ip-hash');
assert.strictEqual(unverifiedResult.authorized, false);
assert.strictEqual(unverifiedResult.reason, 'EMAIL_NOT_VERIFIED');
console.log('  -> Rejeição de perfil Google com e-mail não verificado: OK');

// 4.2 Rejeição de e-mail de terceiro / invasor
const thirdPartyProfile = {
  sub: 'google-sub-attacker',
  email: 'hacker@example.com',
  email_verified: true,
};
const thirdPartyResult = await authorizeAdminUser(thirdPartyProfile, 'test-ip-hash');
assert.strictEqual(thirdPartyResult.authorized, false);
assert.strictEqual(thirdPartyResult.reason, 'EMAIL_MISMATCH');
console.log('  -> Rejeição imediata de e-mail Google não cadastrado pelo proprietário: OK');

// 4.3 Aprovação estrita do proprietário
const ownerProfile = {
  sub: 'google-sub-elias-verified-12345',
  email: 'elias.re_is@hotmail.com',
  email_verified: true,
  name: 'Elias Ribeiro dos Reis',
};
const ownerResult = await authorizeAdminUser(ownerProfile, 'test-ip-hash');
assert.strictEqual(ownerResult.authorized, true);
assert.strictEqual(ownerResult.user?.email, 'elias.re_is@hotmail.com');
assert.strictEqual(ownerResult.user?.role, 'SUPER_ADMIN');
console.log('  -> Aprovação do proprietário com privilégio SUPER_ADMIN: OK');

// ----------------------------------------------------------------------------
// [5/6] ROUTE HANDLERS DE AUTENTICAÇÃO (/api/auth/*)
// ----------------------------------------------------------------------------
console.log('\n[5/6] Testando endpoints de autenticação e proteção contra CSRF...');

// 5.0 Função buildGoogleAuthUrl
if (config.clientId) {
  const generatedUrl = buildGoogleAuthUrl('test-state-abc');
  assert(generatedUrl.includes('accounts.google.com'), 'URL de autenticação deve apontar para o Google.');
  assert(generatedUrl.includes('test-state-abc'), 'URL de autenticação deve incluir o state.');
  console.log('  -> buildGoogleAuthUrl gera URL correta com state: OK');
} else {
  assert.throws(() => buildGoogleAuthUrl('test-state-abc'), /GOOGLE_CLIENT_ID/);
  console.log('  -> buildGoogleAuthUrl bloqueia com exceção segura sem CLIENT_ID: OK');
}

// 5.1 Endpoint /api/auth/google sem credenciais completas
const reqGoogleAuth = new NextRequest('http://localhost:3000/api/auth/google');
const resGoogleAuth = await getGoogleAuth(reqGoogleAuth);
// Se credenciais não estiverem em .env.local, deve redirecionar com segurança para ConfigurationError
assert.strictEqual(resGoogleAuth.status, 307);
const locationGoogle = resGoogleAuth.headers.get('location') || '';
assert(
  locationGoogle.includes('/admin/login?error=ConfigurationError') ||
  locationGoogle.includes('accounts.google.com'),
  'Endpoint /api/auth/google deve tratar falta de credenciais ou redirecionar ao Google.'
);
console.log('  -> /api/auth/google redireciona com integridade sem quebrar: OK');

// 5.2 Callback /api/auth/callback/google com cancelamento do Google
const reqCancelled = new NextRequest('http://localhost:3000/api/auth/callback/google?error=access_denied');
const resCancelled = await getGoogleCallback(reqCancelled);
assert.strictEqual(resCancelled.status, 307);
assert(resCancelled.headers.get('location')?.includes('/admin/login?error=Cancelled'));
console.log('  -> Callback trata cancelamento do usuário no Google: OK');

// 5.3 Callback com State Mismatch (Proteção CSRF)
const reqCsrf = new NextRequest('http://localhost:3000/api/auth/callback/google?code=fake-code&state=attack-state', {
  headers: {
    cookie: `${OAUTH_STATE_COOKIE_NAME}=legitimate-state`,
  },
});
const resCsrf = await getGoogleCallback(reqCsrf);
assert.strictEqual(resCsrf.status, 307);
assert(resCsrf.headers.get('location')?.includes('/admin/login?error=StateMismatch'));
console.log('  -> Callback bloqueia divergência de State (CSRF): OK');

// 5.4 Logout via GET e POST
const reqLogout = new NextRequest('http://localhost:3000/api/auth/logout');
const resLogoutGet = await getLogout(reqLogout);
assert.strictEqual(resLogoutGet.status, 307);
assert(resLogoutGet.headers.get('location')?.includes('/admin/login?logout=success'));

const resLogoutPost = await postLogout(reqLogout);
assert.strictEqual(resLogoutPost.status, 307);
assert(resLogoutPost.headers.get('location')?.includes('/admin/login?logout=success'));
console.log('  -> Endpoints de Logout (GET e POST) limpam sessão com sucesso: OK');

// 5.5 Endpoint /api/auth/session sem sessão ativa e com sessão ativa
const reqSessionAnon = new NextRequest('http://localhost:3000/api/auth/session');
const resSessionAnon = await getSessionApi(reqSessionAnon);
assert.strictEqual(resSessionAnon.status, 200);
const sessionBodyAnon = await resSessionAnon.json();
assert.strictEqual(sessionBodyAnon.authenticated, false);

const reqSessionAuth = new NextRequest('http://localhost:3000/api/auth/session', {
  headers: {
    cookie: `${SESSION_COOKIE_NAME}=${validToken}`,
  },
});
const resSessionAuth = await getSessionApi(reqSessionAuth);
assert.strictEqual(resSessionAuth.status, 200);
const sessionBodyAuth = await resSessionAuth.json();
assert.strictEqual(sessionBodyAuth.authenticated, true);
assert.strictEqual(sessionBodyAuth.user.email, 'elias.re_is@hotmail.com');
console.log('  -> /api/auth/session responde com precisão para anônimos e autenticados: OK');

// ----------------------------------------------------------------------------
// [6/6] EDGE MIDDLEWARE DE PROTEÇÃO DE ROTAS (/admin/*)
// ----------------------------------------------------------------------------
console.log('\n[6/6] Testando isolamento e proteção do Middleware em /admin/*...');

// 6.1 Permissão irrestrita para /admin/login
const reqLoginRoute = new NextRequest('http://localhost:3000/admin/login');
const resLoginRoute = await middleware(reqLoginRoute);
assert.strictEqual(resLoginRoute.status, 200, 'Middleware deve liberar /admin/login sem bloqueios.');
console.log('  -> Rota pública /admin/login liberada pelo middleware: OK');

// 6.2 Bloqueio de rota protegida /admin sem cookie (redireciona para /admin/login)
const reqAdminNoAuth = new NextRequest('http://localhost:3000/admin');
const resAdminNoAuth = await middleware(reqAdminNoAuth);
assert.strictEqual(resAdminNoAuth.status, 307, 'Acesso não autenticado a /admin deve redirecionar (307).');
assert(resAdminNoAuth.headers.get('location')?.includes('/admin/login'));
console.log('  -> Middleware bloqueia acesso anônimo a /admin e redireciona para login: OK');

// 6.3 Bloqueio de rota protegida /admin/certificates sem cookie
const reqCertsNoAuth = new NextRequest('http://localhost:3000/admin/certificates');
const resCertsNoAuth = await middleware(reqCertsNoAuth);
assert.strictEqual(resCertsNoAuth.status, 307);
assert(resCertsNoAuth.headers.get('location')?.includes('/admin/login'));
console.log('  -> Middleware bloqueia acesso anônimo a /admin/certificates: OK');

// 6.4 Bloqueio com cookie de sessão corrompido / expirado
const reqAdminCorrupt = new NextRequest('http://localhost:3000/admin', {
  headers: {
    cookie: `${SESSION_COOKIE_NAME}=invalid-session-token`,
  },
});
const resAdminCorrupt = await middleware(reqAdminCorrupt);
assert.strictEqual(resAdminCorrupt.status, 307);
assert(resAdminCorrupt.headers.get('location')?.includes('/admin/login?error=SessionExpired'));
console.log('  -> Middleware rejeita cookie inválido e expira sessão: OK');

// 6.5 Liberação de rota protegida com token válido
const reqAdminValid = new NextRequest('http://localhost:3000/admin', {
  headers: {
    cookie: `${SESSION_COOKIE_NAME}=${validToken}`,
  },
});
const resAdminValid = await middleware(reqAdminValid);
assert.strictEqual(resAdminValid.status, 200, 'Middleware deve liberar /admin para sessão válida.');
console.log('  -> Middleware autoriza acesso a /admin com sessão válida: OK');

console.log('\n================================================================');
console.log('--- TODOS OS TESTES DA FASE 3 PASSARAM COM SUCESSO ABSOLUTO! ---');
console.log('================================================================\n');
