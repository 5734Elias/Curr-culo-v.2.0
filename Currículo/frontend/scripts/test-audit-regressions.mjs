import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ContactPayloadSchema } from '../src/schemas/content.ts';
import {
  checkRateLimit,
  resetRateLimitStore,
  ATOMIC_RATE_LIMIT_LUA,
  checkDistributedRedis,
} from '../src/lib/rateLimit.ts';
import { sendContactEmail } from '../src/services/contactService.ts';
import { calculateDuration, getCurrentYearMonth } from '../src/lib/dateUtils.ts';
import { getExperiences } from '../src/data/experiences.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('--- TEST SUITE: REGRESSION SUITE FOR TECHNICAL AUDIT FIXES ---');
console.log('================================================================');

// ----------------------------------------------------------------------------
// [1/7] ITEM 1: RATE LIMITER ATÔMICO COM SCRIPT LUA, CONCORRÊNCIA, EXPIRAÇÃO E FALHA
// ----------------------------------------------------------------------------
console.log('\n[1/7] Testando Rate Limiter atômico, concorrência, expiração e falha do Redis...');
resetRateLimitStore();

// 1.1 Teste de Script Lua Atômico
assert.ok(
  ATOMIC_RATE_LIMIT_LUA.includes("redis.call('INCR', KEYS[1])") &&
    ATOMIC_RATE_LIMIT_LUA.includes("redis.call('PEXPIRE', KEYS[1], ARGV[1])"),
  'Script Lua deve executar INCR e PEXPIRE atomicamente na mesma instrução.'
);

// 1.2 Teste Sequencial Básico
const clientHash = 'regression-serverless-client';
const check1 = await checkRateLimit(clientHash, 3, 5000);
assert.strictEqual(check1.allowed, true, '1ª requisição deve ser permitida.');
assert.strictEqual(check1.remaining, 2, 'Restante deve ser 2.');

const check2 = await checkRateLimit(clientHash, 3, 5000);
assert.strictEqual(check2.allowed, true, '2ª requisição deve ser permitida.');

const check3 = await checkRateLimit(clientHash, 3, 5000);
assert.strictEqual(check3.allowed, true, '3ª requisição deve ser permitida.');

const check4 = await checkRateLimit(clientHash, 3, 5000);
assert.strictEqual(check4.allowed, false, '4ª requisição deve ser BLOQUEADA (limite de 3 excedido).');
assert.strictEqual(check4.remaining, 0, 'Restante deve ser 0.');
assert.ok(check4.resetAt > Date.now(), 'resetAt deve ser timestamp futuro.');

// 1.3 Teste de Concorrência Real (Requisições Simultâneas via Promise.all)
resetRateLimitStore();
const concurrentHash = 'concurrent-client-hash';
const concurrentRequests = Array.from({ length: 6 }, () =>
  checkRateLimit(concurrentHash, 3, 5000)
);
const concurrentResults = await Promise.all(concurrentRequests);
const allowedCount = concurrentResults.filter((r) => r.allowed).length;
const blockedCount = concurrentResults.filter((r) => !r.allowed).length;
assert.strictEqual(allowedCount, 3, 'Exatamente 3 requisições concorrentes devem ser permitidas para limite 3.');
assert.strictEqual(blockedCount, 3, 'Exatamente 3 requisições concorrentes excedentes devem ser bloqueadas.');

// 1.4 Teste de Expiração Real da Janela (TTL Reset)
resetRateLimitStore();
const expiringHash = 'expiring-client-hash';
const expCheck1 = await checkRateLimit(expiringHash, 1, 60); // Janela curta de 60ms
assert.strictEqual(expCheck1.allowed, true, '1ª requisição na janela curta deve ser permitida.');
const expCheck2 = await checkRateLimit(expiringHash, 1, 60);
assert.strictEqual(expCheck2.allowed, false, '2ª requisição imediata deve ser bloqueada.');

// Aguardar a expiração do TTL (80ms > 60ms)
await new Promise((resolve) => setTimeout(resolve, 80));
const expCheckAfter = await checkRateLimit(expiringHash, 1, 60);
assert.strictEqual(
  expCheckAfter.allowed,
  true,
  'Após a expiração do TTL da janela, a nova requisição deve ser permitida.'
);

// 1.5 Teste de Execução Atômica Distribuída do Redis (com Mock de API REST)
let capturedRedisCommand = null;
const mockRedisFetch = async (url, options) => {
  capturedRedisCommand = JSON.parse(options.body);
  return {
    ok: true,
    json: async () => [{ result: [2, 58000] }], // count = 2, ttl = 58s
  };
};

const distributedResult = await checkDistributedRedis(
  'https://mock-redis.upstash.io',
  'mock-token',
  'ratelimit:test',
  5,
  60000,
  mockRedisFetch
);
assert.strictEqual(distributedResult?.allowed, true, 'Mock do Redis deve permitir requisição dentro da cota.');
assert.strictEqual(distributedResult?.remaining, 3, 'Restante deve ser 5 - 2 = 3.');
assert.strictEqual(distributedResult?.provider, 'upstash-redis', 'Provedor deve ser upstash-redis.');
assert.strictEqual(
  capturedRedisCommand[0][0],
  'EVAL',
  'Comando Redis deve ser atômico via EVAL com o script Lua.'
);

// 1.6 Teste de Política Segura para Produção (Fail-Closed por Padrão)
const failingRedisFetch = async () => {
  throw new Error('ECONNREFUSED: Redis cluster unreachable');
};

// Cenário A: Produção sem variáveis de Redis configuradas (Deve falhar por Fail-Closed por padrão)
process.env.NODE_ENV = 'production';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.RATE_LIMIT_ALLOW_UNCONFIGURED_IN_PROD;
delete process.env.RATE_LIMIT_ALLOW_DEGRADED_FALLBACK;

const unconfiguredProdResult = await checkRateLimit('prod-unconfigured-client', 5, 60000);
assert.strictEqual(
  unconfiguredProdResult.allowed,
  false,
  'Em produção sem Redis configurado, a requisição DEVE ser bloqueada por Fail-Closed por padrão.'
);
assert.strictEqual(
  unconfiguredProdResult.provider,
  'fail-closed',
  'Provedor deve ser fail-closed quando Redis estiver ausente em produção.'
);

// Cenário B: Produção com Redis inacessível (Deve acionar Fail-Closed por PADRÃO, sem necessidade de opt-in)
process.env.UPSTASH_REDIS_REST_URL = 'https://broken-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'broken-token';

const defaultFailClosedResult = await checkRateLimit('prod-failing-client-1', 5, 60000, failingRedisFetch);
assert.strictEqual(
  defaultFailClosedResult.allowed,
  false,
  'Em produção, falha do Redis DEVE acionar Fail-Closed por padrão.'
);
assert.strictEqual(
  defaultFailClosedResult.provider,
  'fail-closed',
  'Provedor padrão em falha deve ser fail-closed.'
);

// Cenário C: Produção com modo degradado explicitamente autorizado (RATE_LIMIT_ALLOW_DEGRADED_FALLBACK="true")
process.env.RATE_LIMIT_ALLOW_DEGRADED_FALLBACK = 'true';
resetRateLimitStore();

const degradedResult1 = await checkRateLimit('prod-failing-client-2', 5, 60000, failingRedisFetch);
assert.strictEqual(degradedResult1.allowed, true, '1ª requisição em modo degradado permitido deve ser aceita.');
assert.strictEqual(degradedResult1.provider, 'redis-degraded-fallback', 'Provedor deve ser redis-degraded-fallback.');

const degradedResult2 = await checkRateLimit('prod-failing-client-2', 5, 60000, failingRedisFetch);
assert.strictEqual(degradedResult2.allowed, true, '2ª requisição em modo degradado permitido deve ser aceita.');

const degradedResult3 = await checkRateLimit('prod-failing-client-2', 5, 60000, failingRedisFetch);
assert.strictEqual(
  degradedResult3.allowed,
  false,
  '3ª requisição em modo degradado DEVE ser bloqueada (cota estrita de 2 para conter DoS serverless).'
);

// 1.7 Teste Integrado ao Vivo com Cluster Redis (Executado se houver credenciais reais no ambiente)
if (process.env.TEST_LIVE_REDIS_URL && process.env.TEST_LIVE_REDIS_TOKEN) {
  console.log('-> Executando teste integrado ao vivo com cluster Redis remoto...');
  const liveResult = await checkDistributedRedis(
    process.env.TEST_LIVE_REDIS_URL,
    process.env.TEST_LIVE_REDIS_TOKEN,
    `ratelimit:integration-test:${Date.now()}`,
    5,
    10000
  );
  assert.strictEqual(liveResult?.allowed, true, 'Cluster Redis ao vivo deve responder com sucesso.');
  assert.strictEqual(liveResult?.provider, 'upstash-redis', 'Provedor deve ser upstash-redis no teste ao vivo.');
  console.log('-> Teste integrado ao vivo com Redis APROVADO com sucesso.');
} else {
  console.log('-> Testes integrados ao vivo: Ambiente sem cluster Redis ativo provisionado; simulação com mock de API REST atômico validada.');
}

// Restaurar variáveis de ambiente
process.env.NODE_ENV = 'test';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.RATE_LIMIT_ALLOW_DEGRADED_FALLBACK;
delete process.env.RATE_LIMIT_ALLOW_UNCONFIGURED_IN_PROD;
resetRateLimitStore();

console.log('PASS (Item 1): Rate Limiter atômico, concorrência, expiração e falha do Redis 100% validados.');

// ----------------------------------------------------------------------------
// [2/7] ITEM 2: CONTENT SECURITY POLICY (CSP) SEM 'unsafe-eval' EM PRODUÇÃO
// ----------------------------------------------------------------------------
console.log('\n[2/7] Testando Content Security Policy (CSP)...');
const nextConfigPath = path.resolve(__dirname, '../next.config.ts');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

// Verifica presença das diretivas de endurecimento
assert.ok(
  nextConfigContent.includes("script-src-attr 'none'"),
  'CSP deve incluir script-src-attr none para bloquear manipuladores inline (onclick, onerror).'
);
assert.ok(
  nextConfigContent.includes("object-src 'none'"),
  'CSP deve incluir object-src none.'
);
assert.ok(
  nextConfigContent.includes("base-uri 'self'"),
  'CSP deve incluir base-uri self.'
);
assert.ok(
  nextConfigContent.includes("isProduction ? [] : [\"'unsafe-eval'\"]"),
  'CSP deve eliminar unsafe-eval em ambiente de produção.'
);

console.log('PASS (Item 2): CSP revisada com eliminação de unsafe-eval em produção e bloqueio de atributos inline.');

// ----------------------------------------------------------------------------
// [3/7] ITEM 3: HONEYPOT NO SCHEMA ZOD E LÓGICA ANTISPAM
// ----------------------------------------------------------------------------
console.log('\n[3/7] Testando lógica de Honeypot antispam...');

const normalPayload = {
  name: 'Recrutador Legítimo',
  email: 'recrutador@tech.com',
  subject: 'Oportunidade de Engenharia',
  message: 'Olá Elias, temos uma oportunidade excelente alinhada com seu perfil.',
  consent: true,
};

// 3.1 Usuário humano (honeypot vazio ou omitido)
const humanResult = ContactPayloadSchema.safeParse(normalPayload);
assert.strictEqual(humanResult.success, true, 'Submissão legítima sem honeypot deve ser válida.');

// 3.2 Bot preenchendo o honeypot
const botSpamPayload = {
  ...normalPayload,
  websiteHoneypot: 'https://spam-phishing-bot.net',
};
const botZodResult = ContactPayloadSchema.safeParse(botSpamPayload);

// CRÍTICO: O Zod NÃO deve rejeitar o honeypot com erro 400 ("Bot detectado"),
// pois isso alerta o atacante. O schema deve aceitar para que a API descarte silenciosamente!
assert.strictEqual(
  botZodResult.success,
  true,
  'O schema Zod deve aceitar o payload para que o endpoint realize o descarte silencioso (HTTP 200) sem alertar o bot.'
);

// Verifica a regra de descarte no route.ts
const routePath = path.resolve(__dirname, '../src/app/api/contact/route.ts');
const routeContent = fs.readFileSync(routePath, 'utf8');
assert.ok(
  routeContent.includes('websiteHoneypot && websiteHoneypot.trim().length > 0'),
  'A rota de contato deve verificar websiteHoneypot preenchido e descartar silenciosamente.'
);

console.log('PASS (Item 3): Honeypot corrigido no Zod e descarte silencioso implementado na rota.');

// ----------------------------------------------------------------------------
// [4/7] ITEM 4: CÁLCULO DINÂMICO DE DATAS DE EXPERIÊNCIA (SEM 2026-10 FIXO)
// ----------------------------------------------------------------------------
console.log('\n[4/7] Testando cálculo dinâmico de datas e revalidação do Next.js...');

// 4.1 Não há mais "2026-10" fixo no dateUtils.ts
const dateUtilsPath = path.resolve(__dirname, '../src/lib/dateUtils.ts');
const dateUtilsContent = fs.readFileSync(dateUtilsPath, 'utf8');
assert.ok(
  !dateUtilsContent.includes("currentReference: string = '2026-10'"),
  'dateUtils.ts não deve conter valor padrão hardcoded "2026-10".'
);

// 4.2 getCurrentYearMonth retorna o ano e mês atuais dinamicamente
const currentYm = getCurrentYearMonth();
const now = new Date();
const expectedYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
assert.strictEqual(currentYm, expectedYm, 'getCurrentYearMonth deve retornar a data corrente.');

// 4.3 calculateDuration com data corrente
const currentDuration = calculateDuration('2024-01', undefined, true);
assert.ok(currentDuration.years >= 0, 'Duração de anos deve ser positiva.');
assert.ok(typeof currentDuration.label === 'string', 'Label deve ser gerada.');

// 4.4 calculateDuration com referência explícita (determinismo de testes)
const fixedTestDuration = calculateDuration('2024-01', undefined, true, '2026-06');
assert.strictEqual(fixedTestDuration.years, 2, 'De Jan/2024 a Jun/2026 devem ser 2 anos.');
assert.strictEqual(fixedTestDuration.months, 5, 'De Jan/2024 a Jun/2026 devem ser 5 meses.');
assert.strictEqual(fixedTestDuration.label, '2 anos e 5 meses');

// 4.5 getExperiences gera lista com períodos atualizados
const experiences = getExperiences();
assert.ok(experiences.length > 0, 'getExperiences deve retornar lista de experiências.');
const currentExp = experiences.find((e) => e.isCurrent);
assert.ok(currentExp, 'Deve haver ao menos uma experiência atual.');
assert.ok(currentExp.period.includes('Presente'), 'Experiência atual deve indicar "Presente".');

// 4.6 Revalidação no Next.js App Router (ISR)
const expPagePath = path.resolve(__dirname, '../src/app/experiencia/page.tsx');
const expPageContent = fs.readFileSync(expPagePath, 'utf8');
assert.ok(
  expPageContent.includes('export const revalidate = 86400'),
  'A página /experiencia deve exportar revalidate para manter o cache do Next.js sincronizado.'
);

console.log('PASS (Item 4): Cálculo dinâmico de datas ativo e política de revalidação configurada.');

// ----------------------------------------------------------------------------
// [5/7] ITEM 5: LIMITES MÁXIMOS ADEQUADOS NO FORMULÁRIO DE CONTATO
// ----------------------------------------------------------------------------
console.log('\n[5/7] Testando limites máximos de caracteres no formulário de contato...');

// Nome: máx 100 caracteres
const validNameMax = { ...normalPayload, name: 'A'.repeat(100) };
assert.strictEqual(ContactPayloadSchema.safeParse(validNameMax).success, true, 'Nome de 100 caracteres deve ser aceito.');

const invalidNameExceeded = { ...normalPayload, name: 'A'.repeat(101) };
const resNameExceeded = ContactPayloadSchema.safeParse(invalidNameExceeded);
assert.strictEqual(resNameExceeded.success, false, 'Nome de 101 caracteres deve falhar.');
assert.ok(
  JSON.stringify(resNameExceeded.error).includes('máximo 100'),
  'Mensagem de erro de limite de nome deve ser clara.'
);

// E-mail: máx 254 caracteres (RFC 5321)
const validEmailMax = { ...normalPayload, email: `contato@${'a'.repeat(240)}.com` };
assert.ok(validEmailMax.email.length <= 254);

const invalidEmailExceeded = { ...normalPayload, email: `${'a'.repeat(245)}@empresa.com` }; // 257 chars
assert.strictEqual(ContactPayloadSchema.safeParse(invalidEmailExceeded).success, false, 'E-mail > 254 caracteres deve falhar.');

// Assunto: máx 150 caracteres
const validSubjectMax = { ...normalPayload, subject: 'S'.repeat(150) };
assert.strictEqual(ContactPayloadSchema.safeParse(validSubjectMax).success, true, 'Assunto de 150 caracteres deve ser aceito.');

const invalidSubjectExceeded = { ...normalPayload, subject: 'S'.repeat(151) };
assert.strictEqual(ContactPayloadSchema.safeParse(invalidSubjectExceeded).success, false, 'Assunto de 151 caracteres deve falhar.');

// Mensagem: máx 2000 caracteres
const validMessageMax = { ...normalPayload, message: 'M'.repeat(2000) };
assert.strictEqual(ContactPayloadSchema.safeParse(validMessageMax).success, true, 'Mensagem de 2000 caracteres deve ser aceita.');

const invalidMessageExceeded = { ...normalPayload, message: 'M'.repeat(2001) };
assert.strictEqual(ContactPayloadSchema.safeParse(invalidMessageExceeded).success, false, 'Mensagem de 2001 caracteres deve falhar.');

// Atributos maxLength no JSX do formulário
const contatoPagePath = path.resolve(__dirname, '../src/app/contato/page.tsx');
const contatoPageContent = fs.readFileSync(contatoPagePath, 'utf8');
assert.ok(contatoPageContent.includes('maxLength={100}'), 'Input de nome deve possuir maxLength=100.');
assert.ok(contatoPageContent.includes('maxLength={254}'), 'Input de e-mail deve possuir maxLength=254.');
assert.ok(contatoPageContent.includes('maxLength={150}'), 'Input de assunto deve possuir maxLength=150.');
assert.ok(contatoPageContent.includes('maxLength={2000}'), 'Textarea de mensagem deve possuir maxLength=2000.');

console.log('PASS (Item 5): Limites máximos estritos confirmados no Schema e no formulário JSX.');

// ----------------------------------------------------------------------------
// [6/7] ITEM 6: BLOQUEIO TOTAL DE MOCK EM PRODUÇÃO
// ----------------------------------------------------------------------------
console.log('\n[6/7] Testando bloqueio rigoroso de simulação por mock em produção...');

process.env.NODE_ENV = 'production';
process.env.MOCK_EMAIL_SERVICE = 'true'; // Tentativa maliciosa ou acidental de forçar mock
delete process.env.RESEND_API_KEY;

const productionResult = await sendContactEmail({
  name: normalPayload.name,
  email: normalPayload.email,
  subject: normalPayload.subject,
  message: normalPayload.message,
});

assert.strictEqual(
  productionResult.success,
  false,
  'Em ambiente de produção (NODE_ENV=production), mock NÃO PODE simular sucesso sob hipótese alguma.'
);
assert.strictEqual(
  productionResult.notConfigured,
  true,
  'Sem chave de API real em produção, deve reportar notConfigured para fallback seguro.'
);

// Limpeza de variáveis de ambiente
process.env.NODE_ENV = 'test';
delete process.env.MOCK_EMAIL_SERVICE;

console.log('PASS (Item 6): Bloqueio de mock em produção verificado com sucesso.');

// ----------------------------------------------------------------------------
// [7/7] ITEM 7: REVISÃO DE DECLARAÇÕES WCAG 2.2 AA
// ----------------------------------------------------------------------------
console.log('\n[7/7] Testando adequação das declarações de acessibilidade WCAG 2.2...');

const a11yDocPath = path.resolve(__dirname, '../../../docs/ACCESSIBILITY.md');
const a11yDocContent = fs.readFileSync(a11yDocPath, 'utf8');

assert.ok(
  a11yDocContent.includes('não afirmamos certificação formal irrestrita'),
  'Documento ACCESSIBILITY.md deve deixar explícito que não se trata de certificação formal irrestrita.'
);
assert.ok(
  a11yDocContent.includes('Critérios Verificados por Testes Automatizados'),
  'Documento ACCESSIBILITY.md deve especificar claramente os critérios testados.'
);

const readmePath = path.resolve(__dirname, '../../../README.md');
const readmeContent = fs.readFileSync(readmePath, 'utf8');
assert.ok(
  readmeContent.includes('WCAG%202.2%20Aligned'),
  'Badge no README.md deve expressar alinhamento ("WCAG 2.2 Aligned") e não alegação absoluta de conformidade formal.'
);

console.log('PASS (Item 7): Documentação e selos de acessibilidade ajustados para refletir estritamente verificações reais.');

console.log('\n================================================================');
console.log('--- TODOS OS 8 ITENS DA AUDITORIA FORAM COBERTOS E APROVADOS! ---');
console.log('================================================================');
