import assert from 'node:assert';
import { ContactPayloadSchema } from '../src/schemas/content.ts';
import { extractClientIp, hashIpForPrivacy, checkRateLimit, resetRateLimitStore } from '../src/lib/rateLimit.ts';
import { sendContactEmail } from '../src/services/contactService.ts';

console.log('--- TEST SUITE: SECURITY, RATE LIMITING & CONTACT SERVICE ---');

// 1. Teste de Validação de Schemas Zod (ContactPayloadSchema)
console.log('[1/4] Testando validações do ContactPayloadSchema...');

// Caso válido
const validPayload = {
  name: 'Recrutador Teste',
  email: 'recrutador@empresa.com',
  subject: 'Oportunidade Full Stack Java/React',
  message: 'Olá Elias, gostaríamos de conversar sobre uma oportunidade técnica.',
  consent: true,
};
const validResult = ContactPayloadSchema.safeParse(validPayload);
assert.strictEqual(validResult.success, true, 'Payload válido deve passar na validação.');

// Caso inválido: E-mail incorreto
const invalidEmailPayload = { ...validPayload, email: 'email-invalido' };
const invalidEmailResult = ContactPayloadSchema.safeParse(invalidEmailPayload);
assert.strictEqual(invalidEmailResult.success, false, 'E-mail inválido deve falhar na validação.');

// Caso inválido: Mensagem muito curta (< 10 chars)
const shortMsgPayload = { ...validPayload, message: 'Oi' };
const shortMsgResult = ContactPayloadSchema.safeParse(shortMsgPayload);
assert.strictEqual(shortMsgResult.success, false, 'Mensagem curta deve falhar.');

// Caso inválido: Sem consentimento (LGPD)
const noConsentPayload = { ...validPayload, consent: false };
const noConsentResult = ContactPayloadSchema.safeParse(noConsentPayload);
assert.strictEqual(noConsentResult.success, false, 'Falta de consentimento deve falhar.');

// Limites máximos definidos (Item 5 da auditoria)
const longNamePayload = { ...validPayload, name: 'A'.repeat(101) };
assert.strictEqual(ContactPayloadSchema.safeParse(longNamePayload).success, false, 'Nome > 100 caracteres deve ser rejeitado.');

const longEmailPayload = { ...validPayload, email: `${'a'.repeat(246)}@domain.com` }; // > 254 chars
assert.strictEqual(ContactPayloadSchema.safeParse(longEmailPayload).success, false, 'E-mail > 254 caracteres deve ser rejeitado.');

const longSubjectPayload = { ...validPayload, subject: 'S'.repeat(151) };
assert.strictEqual(ContactPayloadSchema.safeParse(longSubjectPayload).success, false, 'Assunto > 150 caracteres deve ser rejeitado.');

const longMessagePayload = { ...validPayload, message: 'M'.repeat(2001) };
assert.strictEqual(ContactPayloadSchema.safeParse(longMessagePayload).success, false, 'Mensagem > 2000 caracteres deve ser rejeitada.');

// Honeypot no Zod: Não deve falhar na validação sintática do schema para permitir descarte silencioso na rota (Item 3)
const botPayload = { ...validPayload, websiteHoneypot: 'http://spam-link.bot' };
const botResult = ContactPayloadSchema.safeParse(botPayload);
assert.strictEqual(botResult.success, true, 'Honeypot preenchido não deve ser bloqueado pelo schema Zod com 400, permitindo descarte silencioso.');

console.log('PASS: Todas as regras de validação do schema e limites máximos foram confirmadas.');

// 2. Teste de Extração e Anonimização de IP
console.log('[2/4] Testando extração e hash de IP...');
// Priorização do cabeçalho gerenciado pela Vercel (x-vercel-forwarded-for)
const vercelMockHeaders = new Headers({
  'x-forwarded-for': '198.51.100.1',
  'x-vercel-forwarded-for': '203.0.113.195, 70.41.3.18',
});
const vercelIp = extractClientIp(vercelMockHeaders);
assert.strictEqual(vercelIp, '203.0.113.195', 'Deve priorizar x-vercel-forwarded-for gerenciado pela Vercel.');

// Extração padrão em x-forwarded-for (primeiro IP do cliente)
const standardXffHeaders = new Headers({
  'x-forwarded-for': '198.51.100.55, 70.41.3.18',
});
assert.strictEqual(
  extractClientIp(standardXffHeaders),
  '198.51.100.55',
  'Em x-forwarded-for, deve extrair o primeiro IP (origem do cliente).'
);

// Rejeição de formatos de IP inválidos ou maliciosos
const maliciousHeaders = new Headers({
  'x-forwarded-for': '<script>alert(1)</script>, 10.0.0.1',
});
assert.strictEqual(extractClientIp(maliciousHeaders), '10.0.0.1', 'Deve ignorar entradas maliciosas e pegar o próximo IP válido.');

const invalidHeaders = new Headers({
  'x-forwarded-for': 'invalid-payload-string',
});
assert.strictEqual(extractClientIp(invalidHeaders), '127.0.0.1', 'Deve recorrer a fallback seguro se nenhum IP for válido.');

const hash1 = hashIpForPrivacy('203.0.113.195');
const hash2 = hashIpForPrivacy('203.0.113.195');
assert.strictEqual(hash1, hash2, 'Hashes para o mesmo IP devem ser determinísticos.');
assert.notStrictEqual(hash1, '203.0.113.195', 'IP não pode ficar em texto plano.');
console.log('PASS: Extração de proxy e anonimização de IP verificadas.');

// 3. Teste de Rate Limiting Serverless / Assíncrono
console.log('[3/4] Testando bloqueio do Rate Limiter após 5 requisições...');
resetRateLimitStore();
const testHash = 'test-client-unique-hash';

// Executar 5 requisições permitidas
for (let i = 1; i <= 5; i++) {
  const check = await checkRateLimit(testHash, 5, 10000);
  assert.strictEqual(check.allowed, true, `Requisição ${i} de 5 deve ser permitida.`);
}

// 6ª requisição deve ser bloqueada
const blockedCheck = await checkRateLimit(testHash, 5, 10000);
assert.strictEqual(blockedCheck.allowed, false, 'A 6ª requisição deve ser BLOQUEADA (HTTP 429).');
assert.strictEqual(blockedCheck.remaining, 0, 'Restante deve ser 0.');
console.log('PASS: Rate limiter bloqueia com sucesso após o limite estipulado.');

// 4. Teste de Prevenção de Falso Sucesso no ContactService (e proteção de Mock em Produção)
console.log('[4/4] Testando prevenção de falso sucesso e isolamento de mock em produção...');

// 4.1 Sem chave e sem mock em ambiente de dev/teste
process.env.NODE_ENV = 'development';
process.env.MOCK_EMAIL_SERVICE = 'false';
delete process.env.RESEND_API_KEY;

const unconfiguredResult = await sendContactEmail({
  name: validPayload.name,
  email: validPayload.email,
  subject: validPayload.subject,
  message: validPayload.message,
});

assert.strictEqual(unconfiguredResult.success, false, 'Não deve fingir sucesso sem chave de API.');
assert.strictEqual(unconfiguredResult.notConfigured, true, 'Deve sinalizar status notConfigured.');

// 4.2 Em produção com MOCK_EMAIL_SERVICE='true', mock NUNCA deve simular sucesso (Item 6)
process.env.NODE_ENV = 'production';
process.env.MOCK_EMAIL_SERVICE = 'true';
delete process.env.RESEND_API_KEY;

const prodMockAttempt = await sendContactEmail({
  name: validPayload.name,
  email: validPayload.email,
  subject: validPayload.subject,
  message: validPayload.message,
});

assert.strictEqual(prodMockAttempt.success, false, 'Mock em produção NUNCA deve retornar sucesso.');
assert.strictEqual(prodMockAttempt.notConfigured, true, 'Em produção sem chave real, deve reportar notConfigured.');

// Restaurar para ambiente de teste
process.env.NODE_ENV = 'test';
delete process.env.MOCK_EMAIL_SERVICE;

console.log('PASS: Falso sucesso e simulação de mock em produção eliminados com sucesso.');
console.log('--- TODOS OS TESTES DE SEGURANÇA E CONTATO PASSARAM COM SUCESSO! ---');
