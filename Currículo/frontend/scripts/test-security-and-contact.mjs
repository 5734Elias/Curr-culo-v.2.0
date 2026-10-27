import assert from 'node:assert';
import { ContactPayloadSchema } from '../src/schemas/content.ts';
import { extractClientIp, hashIpForPrivacy, checkRateLimit } from '../src/lib/rateLimit.ts';
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

console.log('PASS: Todas as regras de validação do schema foram confirmadas.');

// 2. Teste de Extração e Anonimização de IP
console.log('[2/4] Testando extração e hash de IP...');
const mockHeaders = new Headers({
  'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
});
const extractedIp = extractClientIp(mockHeaders);
assert.strictEqual(extractedIp, '203.0.113.195', 'Deve extrair o primeiro IP da lista de proxy.');

const hash1 = hashIpForPrivacy('203.0.113.195');
const hash2 = hashIpForPrivacy('203.0.113.195');
assert.strictEqual(hash1, hash2, 'Hashes para o mesmo IP devem ser determinísticos.');
assert.notStrictEqual(hash1, '203.0.113.195', 'IP não pode ficar em texto plano.');
console.log('PASS: Extração de proxy e anonimização de IP verificadas.');

// 3. Teste de Rate Limiting
console.log('[3/4] Testando bloqueio do Rate Limiter após 5 requisições...');
const testHash = 'test-client-unique-hash';

// Executar 5 requisições permitidas
for (let i = 1; i <= 5; i++) {
  const check = checkRateLimit(testHash, 5, 10000);
  assert.strictEqual(check.allowed, true, `Requisição ${i} de 5 deve ser permitida.`);
}

// 6ª requisição deve ser bloqueada
const blockedCheck = checkRateLimit(testHash, 5, 10000);
assert.strictEqual(blockedCheck.allowed, false, 'A 6ª requisição deve ser BLOQUEADA (HTTP 429).');
assert.strictEqual(blockedCheck.remaining, 0, 'Restante deve ser 0.');
console.log('PASS: Rate limiter bloqueia com sucesso após o limite estipulado.');

// 4. Teste de Prevenção de Falso Sucesso no ContactService
console.log('[4/4] Testando prevenção de falso sucesso no ContactService...');
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
console.log('PASS: Falso sucesso eliminado. Serviço reporta status real.');

console.log('--- TODOS OS TESTES DE SEGURANÇA E CONTATO PASSARAM COM SUCESSO! ---');

