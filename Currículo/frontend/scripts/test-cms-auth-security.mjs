import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose/jwt/sign';

import {
  getAuthConfig,
  getEnvironmentDiagnostics,
  resolveLoginErrorDetails,
  OFFICIAL_ADMIN_EMAIL,
  PUBLIC_CONTACT_ONLY_EMAIL,
  SESSION_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_PKCE_COOKIE_NAME,
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
  generatePkcePair,
  computeCodeChallenge,
} from '../src/lib/auth/googleOidc.ts';
import { resetRateLimitStore } from '../src/lib/rateLimit.ts';
import { GET as getGoogleAuth } from '../src/app/api/auth/google/route.ts';
import { GET as getGoogleCallback } from '../src/app/api/auth/callback/google/route.ts';
import { GET as getLogout, POST as postLogout } from '../src/app/api/auth/logout/route.ts';
import { GET as getSessionApi } from '../src/app/api/auth/session/route.ts';
import { middleware } from '../src/middleware.ts';

console.log('================================================================');
console.log('--- TEST SUITE: CMS AUTHENTICATION & ZERO-TRUST SECURITY (FASE 3) ---');
console.log('================================================================');

resetRateLimitStore();

// ----------------------------------------------------------------------------
// [1/7] CONFIGURAÇÃO E EXTRAÇÃO SEGURA DE AMBIENTE
// ----------------------------------------------------------------------------
console.log('\n[1/7] Testando configurações de autenticação e identidade oficial...');
const config = getAuthConfig();
assert.strictEqual(
  config.adminEmail,
  'reis.elias.ribeiro@gmail.com',
  'E-mail oficial do administrador deve ser estritamente reis.elias.ribeiro@gmail.com'
);
assert.strictEqual(OFFICIAL_ADMIN_EMAIL, 'reis.elias.ribeiro@gmail.com');
assert.strictEqual(PUBLIC_CONTACT_ONLY_EMAIL, 'elias.re_is@hotmail.com');
assert(config.authSecret.length >= 32, 'authSecret deve ter no mínimo 32 caracteres para HS256 seguro.');
assert(
  config.callbackUrl === 'https://curriculo-v3-admin.vercel.app/api/auth/callback/google' ||
    config.callbackUrl.endsWith('/api/auth/callback/google'),
  'callbackUrl deve apontar para o endpoint de callback no domínio oficial da Vercel.'
);
console.log('  -> Identidade oficial reis.elias.ribeiro@gmail.com e callback Vercel validados: OK');

// ----------------------------------------------------------------------------
// [2/7] CRIAÇÃO, ASSINATURA E VALIDAÇÃO DE TOKENS JWT DE SESSÃO
// ----------------------------------------------------------------------------
console.log('\n[2/7] Testando ciclo de vida criptográfico dos tokens de sessão (JWT)...');

const mockAdminUser = {
  sub: 'google-sub-elias-123456789',
  email: 'reis.elias.ribeiro@gmail.com',
  name: 'Elias Ribeiro dos Reis',
  role: 'SUPER_ADMIN',
};

// 2.1 Emissão e verificação de token válido
const validToken = await createSessionToken(mockAdminUser);
assert(typeof validToken === 'string' && validToken.length > 50, 'Token JWT deve ser gerado.');

const verified = await verifySessionToken(validToken);
assert(verified !== null, 'Token recém-gerado deve ser verificado com sucesso.');
assert.strictEqual(verified.email, 'reis.elias.ribeiro@gmail.com');
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

// 2.4 Rejeição estrita de token com o antigo e-mail de contato público (elias.re_is@hotmail.com)
const legacyEmailToken = await new SignJWT({
  sub: mockAdminUser.sub,
  email: 'elias.re_is@hotmail.com',
  role: 'SUPER_ADMIN',
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuer('curriculo-cms-auth')
  .setAudience('curriculo-cms-admin')
  .setExpirationTime('24h')
  .sign(new TextEncoder().encode(config.authSecret));

const legacyEmailResult = await verifySessionToken(legacyEmailToken);
assert.strictEqual(
  legacyEmailResult,
  null,
  'Token com e-mail de contato público (elias.re_is@hotmail.com) DEVE ser rejeitado para login administrativo.'
);
console.log('  -> Bloqueio estrito de elias.re_is@hotmail.com para sessão administrativa: OK');

// 2.5 Rejeição de token com e-mail de terceiro
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
// [3/7] ATRIBUTOS DE SEGURANÇA DE COOKIES (HttpOnly, Secure, SameSite)
// ----------------------------------------------------------------------------
console.log('\n[3/7] Testando conformidade de cookies e opções de segurança...');

const prodCookieOpts = getSessionCookieOptions(true);
assert.strictEqual(prodCookieOpts.options.httpOnly, true, 'Cookie de sessão DEVE ser HttpOnly.');
assert.strictEqual(prodCookieOpts.options.secure, true, 'Cookie em produção DEVE ter Secure=true.');
assert.strictEqual(prodCookieOpts.options.sameSite, 'lax', 'Cookie DEVE usar SameSite=lax.');
assert.strictEqual(prodCookieOpts.options.path, '/', 'Cookie deve ser delimitado ao path raiz.');

const clearCookieOpts = getSessionClearCookieOptions(true);
assert.strictEqual(clearCookieOpts.options.maxAge, 0, 'Limpeza de cookie deve definir maxAge=0.');
console.log('  -> Atributos de segurança dos cookies (HttpOnly, Secure, SameSite): OK');

// ----------------------------------------------------------------------------
// [4/7] AUTORIZAÇÃO ZERO TRUST COM PERFIL GOOGLE & VÍNCULO SUB IMUTÁVEL
// ----------------------------------------------------------------------------
console.log('\n[4/7] Testando motor de autorização Zero Trust (email_verified + GOOGLE_ADMIN_SUB)...');

// 4.1 Rejeição de e-mail não verificado pelo Google (mesmo com e-mail oficial)
const unverifiedProfile = {
  sub: 'google-sub-elias-123456789',
  email: 'reis.elias.ribeiro@gmail.com',
  email_verified: false,
};
const unverifiedResult = await authorizeAdminUser(unverifiedProfile, 'test-ip-hash');
assert.strictEqual(unverifiedResult.authorized, false);
assert.strictEqual(unverifiedResult.reason, 'EMAIL_NOT_VERIFIED');
console.log('  -> Rejeição de perfil Google com e-mail não verificado (email_verified=false): OK');

// 4.2 Rejeição estrita de elias.re_is@hotmail.com (e-mail de contato público)
const publicContactProfile = {
  sub: 'google-sub-elias-123456789',
  email: 'elias.re_is@hotmail.com',
  email_verified: true,
};
const publicContactResult = await authorizeAdminUser(publicContactProfile, 'test-ip-hash');
assert.strictEqual(publicContactResult.authorized, false);
assert.strictEqual(publicContactResult.reason, 'EMAIL_MISMATCH');
console.log('  -> Rejeição estrita de elias.re_is@hotmail.com como login administrativo: OK');

// 4.3 Rejeição de e-mail de terceiro / invasor
const thirdPartyProfile = {
  sub: 'google-sub-attacker',
  email: 'hacker@gmail.com',
  email_verified: true,
};
const thirdPartyResult = await authorizeAdminUser(thirdPartyProfile, 'test-ip-hash');
assert.strictEqual(thirdPartyResult.authorized, false);
assert.strictEqual(thirdPartyResult.reason, 'EMAIL_MISMATCH');
console.log('  -> Rejeição imediata de e-mail Google de terceiro: OK');

// 4.4 Exigência obrigatória de GOOGLE_ADMIN_SUB em produção (Fail-Closed se ausente)
const prevSub = process.env.GOOGLE_ADMIN_SUB;
delete process.env.GOOGLE_ADMIN_SUB;

const prodWithoutSubResult = await authorizeAdminUser(
  {
    sub: 'google-sub-elias-123456789',
    email: 'reis.elias.ribeiro@gmail.com',
    email_verified: true,
  },
  'test-ip-hash',
  true // enforceProductionSub = true
);
assert.strictEqual(prodWithoutSubResult.authorized, false, 'Em produção, ausência de GOOGLE_ADMIN_SUB deve bloquear login.');
assert.strictEqual(prodWithoutSubResult.reason, 'SUB_NOT_CONFIGURED');

const prodSessionWithoutSub = await verifySessionToken(validToken, true);
assert.strictEqual(prodSessionWithoutSub, null, 'Em produção, sessão sem GOOGLE_ADMIN_SUB configurado deve ser negada.');
console.log('  -> Bloqueio Fail-Closed em produção quando GOOGLE_ADMIN_SUB não está configurado (impede auto-registro): OK');

// 4.5 Validação estrita de correspondência com GOOGLE_ADMIN_SUB
process.env.GOOGLE_ADMIN_SUB = '109876543210987654321';

// Tentativa com e-mail correto e verificado, mas sub divergente
const wrongSubResult = await authorizeAdminUser(
  {
    sub: '999999999999999999999',
    email: 'reis.elias.ribeiro@gmail.com',
    email_verified: true,
  },
  'test-ip-hash',
  true
);
assert.strictEqual(wrongSubResult.authorized, false, 'Sub divergente deve ser negado.');
assert.strictEqual(wrongSubResult.reason, 'SUB_MISMATCH');

// Tentativa com e-mail correto, verificado e sub idêntico ao GOOGLE_ADMIN_SUB
const exactMatchResult = await authorizeAdminUser(
  {
    sub: '109876543210987654321',
    email: 'reis.elias.ribeiro@gmail.com',
    email_verified: true,
    name: 'Elias Ribeiro dos Reis',
  },
  'test-ip-hash',
  true
);
assert.strictEqual(exactMatchResult.authorized, true, 'Proprietário com e-mail verificado e sub exato deve ser autorizado.');
assert.strictEqual(exactMatchResult.user?.email, 'reis.elias.ribeiro@gmail.com');
assert.strictEqual(exactMatchResult.user?.sub, '109876543210987654321');
assert.strictEqual(exactMatchResult.user?.role, 'SUPER_ADMIN');
console.log('  -> Vinculação obrigatória ao sub imutável (GOOGLE_ADMIN_SUB) validada: OK');

// Restaura GOOGLE_ADMIN_SUB original do ambiente de teste
if (prevSub === undefined) {
  delete process.env.GOOGLE_ADMIN_SUB;
} else {
  process.env.GOOGLE_ADMIN_SUB = prevSub;
}

// ----------------------------------------------------------------------------
// [5/7] ROUTE HANDLERS DE AUTENTICAÇÃO (/api/auth/*), PKCE & PROTEÇÃO CSRF
// ----------------------------------------------------------------------------
console.log('\n[5/7] Testando endpoints de autenticação, PKCE (S256) e proteção contra CSRF...');

const pkce = generatePkcePair();
assert(pkce.codeVerifier.length >= 43, 'PKCE codeVerifier deve seguir RFC 7636 (>= 43 chars).');
assert.strictEqual(
  computeCodeChallenge(pkce.codeVerifier),
  pkce.codeChallenge,
  'codeChallenge deve corresponder ao hash SHA-256 base64url do codeVerifier.'
);

const prevClientId = process.env.GOOGLE_CLIENT_ID;
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
const generatedUrlWithPkce = buildGoogleAuthUrl('test-state-abc', pkce.codeChallenge);
assert(generatedUrlWithPkce.includes('accounts.google.com'), 'URL de autenticação deve apontar para o Google.');
assert(generatedUrlWithPkce.includes('state=test-state-abc'), 'URL de autenticação deve incluir o state.');
assert(
  generatedUrlWithPkce.includes(`code_challenge=${encodeURIComponent(pkce.codeChallenge)}`),
  'URL de autenticação deve incluir code_challenge PKCE.'
);
assert(
  generatedUrlWithPkce.includes('code_challenge_method=S256'),
  'URL de autenticação deve exigir code_challenge_method=S256.'
);
if (prevClientId === undefined) {
  delete process.env.GOOGLE_CLIENT_ID;
} else {
  process.env.GOOGLE_CLIENT_ID = prevClientId;
}
console.log('  -> PKCE (S256) e buildGoogleAuthUrl validados com state e code_challenge: OK');

// 5.1 Endpoint /api/auth/google sem credenciais completas (ConfigurationError / OAuthNotConfigured)
const reqGoogleAuth = new NextRequest('http://localhost:3000/api/auth/google');
const resGoogleAuth = await getGoogleAuth(reqGoogleAuth);
assert.strictEqual(resGoogleAuth.status, 307);
const locationGoogle = resGoogleAuth.headers.get('location') || '';
assert(
  locationGoogle.includes('/admin/login?error=ConfigurationError') ||
    locationGoogle.includes('accounts.google.com'),
  'Endpoint /api/auth/google deve tratar falta de credenciais ou redirecionar ao Google.'
);

// 5.1b Diagnósticos Separados (OAuth vs. SUB vs. Callback vs. Database vs. Storage)
const oauthErr = resolveLoginErrorDetails('ConfigurationError', 'OAuthNotConfigured');
assert(oauthErr && oauthErr.category === 'OAUTH_CONFIG');
assert(
  !oauthErr.message.toLowerCase().includes('banco de dados'),
  'ConfigurationError de OAuth JAMAIS deve culpar o banco de dados PostgreSQL.'
);
const subErr = resolveLoginErrorDetails('SubNotConfigured');
assert(subErr && subErr.category === 'SUB_CONFIG');
const cbErr = resolveLoginErrorDetails('InvalidCallback');
assert(cbErr && cbErr.category === 'CALLBACK_CONFIG');
const dbErr = resolveLoginErrorDetails('DatabaseUnavailable');
assert(dbErr && dbErr.category === 'DATABASE_STATUS');
const storageErr = resolveLoginErrorDetails('StorageUnavailable');
assert(storageErr && storageErr.category === 'STORAGE_STATUS');

// 5.1c Simulação completa com OAuth configurado e Banco Indisponível (NÃO deve dar ConfigurationError!)
const savedEnv = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_ADMIN_SUB: process.env.GOOGLE_ADMIN_SUB,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  DATABASE_URL: process.env.DATABASE_URL,
};

process.env.GOOGLE_CLIENT_ID = '1234567890-eliascurriculo.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = '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2345';
process.env.GOOGLE_ADMIN_SUB = '109876543210987654321';
delete process.env.DATABASE_URL; // Mesmo sem DATABASE_URL, o OAuth deve funcionar integralmente!

const diagReady = getEnvironmentDiagnostics();
assert.strictEqual(diagReady.variables.GOOGLE_CLIENT_ID, 'CONFIGURADA');
assert.strictEqual(diagReady.variables.GOOGLE_CLIENT_SECRET, 'CONFIGURADA');
assert.strictEqual(diagReady.variables.GOOGLE_ADMIN_EMAIL, 'CONFIGURADA');
assert.strictEqual(diagReady.variables.GOOGLE_ADMIN_SUB, 'CONFIGURADA');
assert.strictEqual(diagReady.variables.NEXTAUTH_URL, 'CONFIGURADA');
assert.strictEqual(diagReady.variables.DATABASE_URL, 'AUSENTE');
assert.strictEqual(diagReady.authDiagnostic, 'READY');

const reqGoogleReady = new NextRequest('http://localhost:3000/api/auth/google');
const resGoogleReady = await getGoogleAuth(reqGoogleReady);
assert.strictEqual(resGoogleReady.status, 307);
const locReady = resGoogleReady.headers.get('location') || '';
assert(
  locReady.startsWith('https://accounts.google.com/o/oauth2/v2/auth'),
  'Com OAuth configurado, /api/auth/google deve redirecionar diretamente ao Google mesmo sem DATABASE_URL.'
);
assert(!locReady.includes('ConfigurationError'));

// Teste de InvalidCallback quando NEXTAUTH_URL é malformada
process.env.NEXTAUTH_URL = 'not-a-valid-url';
const reqInvalidCb = new NextRequest('http://localhost:3000/api/auth/google');
const resInvalidCb = await getGoogleAuth(reqInvalidCb);
assert.strictEqual(resInvalidCb.status, 307);
assert(
  resInvalidCb.headers.get('location')?.includes('/admin/login?error=InvalidCallback'),
  'URL base malformada deve redirecionar com InvalidCallback.'
);

// Restaura variáveis originais
for (const [k, v] of Object.entries(savedEnv)) {
  if (v === undefined) delete process.env[k];
  else process.env[k] = v;
}
console.log('  -> Diagnósticos separados (OAuth, SUB, Callback, DB, Storage) e independência do banco validados: OK');

// 5.2 Callback /api/auth/callback/google com cancelamento do Google
const reqCancelled = new NextRequest('http://localhost:3000/api/auth/callback/google?error=access_denied');
const resCancelled = await getGoogleCallback(reqCancelled);
assert.strictEqual(resCancelled.status, 307);
assert(resCancelled.headers.get('location')?.includes('/admin/login?error=Cancelled'));
console.log('  -> Callback trata cancelamento do usuário no Google: OK');

// 5.3 Callback com State Mismatch (Proteção CSRF)
const reqCsrf = new NextRequest('http://localhost:3000/api/auth/callback/google?code=fake-code&state=attack-state', {
  headers: {
    cookie: `${OAUTH_STATE_COOKIE_NAME}=legitimate-state; ${OAUTH_PKCE_COOKIE_NAME}=${pkce.codeVerifier}`,
  },
});
const resCsrf = await getGoogleCallback(reqCsrf);
assert.strictEqual(resCsrf.status, 307);
assert(resCsrf.headers.get('location')?.includes('/admin/login?error=StateMismatch'));
console.log('  -> Callback bloqueia divergência de State (CSRF): OK');

// 5.3b Callback sem cookie PKCE (Proteção contra interceptação de código)
const reqMissingPkce = new NextRequest('http://localhost:3000/api/auth/callback/google?code=fake-code&state=legitimate-state', {
  headers: {
    cookie: `${OAUTH_STATE_COOKIE_NAME}=legitimate-state`,
  },
});
const resMissingPkce = await getGoogleCallback(reqMissingPkce);
assert.strictEqual(resMissingPkce.status, 307);
assert(
  resMissingPkce.headers.get('location')?.includes('/admin/login?error=PkceMissing'),
  'Callback sem verificador PKCE deve ser rejeitado com PkceMissing.'
);
console.log('  -> Callback bloqueia ausência de verificador PKCE (PkceMissing): OK');

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
assert.strictEqual(sessionBodyAuth.user.email, 'reis.elias.ribeiro@gmail.com');
console.log('  -> /api/auth/session responde com precisão para anônimos e autenticados: OK');

// ----------------------------------------------------------------------------
// [6/7] RATE LIMITING NO FLUXO DE AUTENTICAÇÃO OAUTH
// ----------------------------------------------------------------------------
console.log('\n[6/7] Testando Rate Limiting nos endpoints de autenticação...');
resetRateLimitStore();

let blockedByRateLimit = false;
for (let i = 1; i <= 12; i++) {
  const reqFlood = new NextRequest('http://localhost:3000/api/auth/google', {
    headers: { 'x-forwarded-for': '203.0.113.77' },
  });
  const resFlood = await getGoogleAuth(reqFlood);
  const loc = resFlood.headers.get('location') || '';
  if (loc.includes('error=RateLimitExceeded')) {
    blockedByRateLimit = true;
    break;
  }
}
assert.strictEqual(blockedByRateLimit, true, 'Fluxo OAuth deve bloquear IP após exceder limite de tentativas.');
resetRateLimitStore();
console.log('  -> Rate limiting ativo e bloqueando excesso de tentativas em /api/auth/*: OK');

// ----------------------------------------------------------------------------
// [7/7] EDGE MIDDLEWARE DE PROTEÇÃO DE ROTAS (/admin/*)
// ----------------------------------------------------------------------------
console.log('\n[7/7] Testando isolamento e proteção do Middleware em /admin/*...');

// 7.1 Permissão irrestrita para /admin/login
const reqLoginRoute = new NextRequest('http://localhost:3000/admin/login');
const resLoginRoute = await middleware(reqLoginRoute);
assert.strictEqual(resLoginRoute.status, 200, 'Middleware deve liberar /admin/login sem bloqueios.');
console.log('  -> Rota pública /admin/login liberada pelo middleware: OK');

// 7.2 Bloqueio de rota protegida /admin sem cookie
const reqAdminNoAuth = new NextRequest('http://localhost:3000/admin');
const resAdminNoAuth = await middleware(reqAdminNoAuth);
assert.strictEqual(resAdminNoAuth.status, 307, 'Acesso não autenticado a /admin deve redirecionar (307).');
assert(resAdminNoAuth.headers.get('location')?.includes('/admin/login'));
console.log('  -> Middleware bloqueia acesso anônimo a /admin e redireciona para login: OK');

// 7.3 Bloqueio de cookie com o antigo e-mail (elias.re_is@hotmail.com) no Middleware
const reqAdminLegacyEmail = new NextRequest('http://localhost:3000/admin', {
  headers: {
    cookie: `${SESSION_COOKIE_NAME}=${legacyEmailToken}`,
  },
});
const resAdminLegacyEmail = await middleware(reqAdminLegacyEmail);
assert.strictEqual(resAdminLegacyEmail.status, 307, 'Middleware deve rejeitar sessão com elias.re_is@hotmail.com.');
assert(resAdminLegacyEmail.headers.get('location')?.includes('/admin/login?error=SessionExpired'));
console.log('  -> Middleware rejeita token de elias.re_is@hotmail.com: OK');

// 7.4 Liberação de rota protegida exclusivamente para reis.elias.ribeiro@gmail.com
const reqAdminValid = new NextRequest('http://localhost:3000/admin', {
  headers: {
    cookie: `${SESSION_COOKIE_NAME}=${validToken}`,
  },
});
const resAdminValid = await middleware(reqAdminValid);
assert.strictEqual(resAdminValid.status, 200, 'Middleware deve liberar /admin para sessão válida de reis.elias.ribeiro@gmail.com.');
console.log('  -> Middleware autoriza acesso a /admin exclusivamente para reis.elias.ribeiro@gmail.com: OK');

console.log('\n================================================================');
console.log('--- TODOS OS TESTES DA FASE 3 PASSARAM COM SUCESSO ABSOLUTO! ---');
console.log('================================================================\n');
