import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextRequest } from 'next/server';

import { ContactPayloadSchema } from '../src/schemas/content.ts';
import { extractClientIp, resetRateLimitStore } from '../src/lib/rateLimit.ts';
import { sendContactEmail } from '../src/services/contactService.ts';
import { POST } from '../src/app/api/contact/route.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('--- TEST SUITE: CYBERSECURITY HARDENING & DEFENSIVE CONTROLS ---');
console.log('================================================================');

// ----------------------------------------------------------------------------
// [1/7] CONTENT-TYPE, TAMANHO MÁXIMO E TRATAMENTO DE JSON MALFORMADO NA ROTA
// ----------------------------------------------------------------------------
console.log('\n[1/7] Testando validações de Content-Type, Payload Size e JSON na API /api/contact...');

// 1.1 Rejeição de Content-Type inválido ou ausente (HTTP 415)
const reqWrongContentType = new NextRequest('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'text/plain',
  },
  body: 'Nome=Teste',
});
const resWrongContentType = await POST(reqWrongContentType);
assert.strictEqual(resWrongContentType.status, 415, 'Requisição sem application/json deve retornar HTTP 415.');
const bodyWrongContentType = await resWrongContentType.json();
assert.strictEqual(bodyWrongContentType.code, 'UNSUPPORTED_MEDIA_TYPE');
console.log('  -> Rejeição de Content-Type não suportado (HTTP 415): OK');

// 1.2 Rejeição de Payload excedendo 10KB via Content-Length (HTTP 413)
const reqOversizedHeader = new NextRequest('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'content-length': '15000',
  },
  body: JSON.stringify({ name: 'A' }),
});
const resOversizedHeader = await POST(reqOversizedHeader);
assert.strictEqual(resOversizedHeader.status, 413, 'Content-Length > 10KB deve retornar HTTP 413.');
const bodyOversizedHeader = await resOversizedHeader.json();
assert.strictEqual(bodyOversizedHeader.code, 'PAYLOAD_TOO_LARGE');
console.log('  -> Rejeição de Content-Length > 10KB (HTTP 413): OK');

// 1.3 Rejeição de Payload excedendo 10KB no corpo real (HTTP 413)
const hugeBody = JSON.stringify({
  name: 'A'.repeat(50),
  email: 'teste@exemplo.com',
  subject: 'Assunto',
  message: 'X'.repeat(12000), // > 10KB
  consent: true,
});
const reqOversizedBody = new NextRequest('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: hugeBody,
});
const resOversizedBody = await POST(reqOversizedBody);
assert.strictEqual(resOversizedBody.status, 413, 'Corpo > 10KB deve retornar HTTP 413.');
console.log('  -> Rejeição de corpo bruto > 10KB (HTTP 413): OK');

// 1.4 Tratamento seguro de JSON malformado (HTTP 400 MALFORMED_JSON, sem erro 500)
const reqMalformedJson = new NextRequest('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: '{"name": "Incompleto", "email": ',
});
const resMalformedJson = await POST(reqMalformedJson);
assert.strictEqual(resMalformedJson.status, 400, 'JSON malformado deve retornar HTTP 400.');
const bodyMalformedJson = await resMalformedJson.json();
assert.strictEqual(bodyMalformedJson.code, 'MALFORMED_JSON');
console.log('  -> Tratamento controlado de JSON malformado (HTTP 400 MALFORMED_JSON): OK');

// ----------------------------------------------------------------------------
// [2/7] PREVENÇÃO CONTRA CRLF INJECTION E SCHEMA STRICT NO ZOD
// ----------------------------------------------------------------------------
console.log('\n[2/7] Testando regras de Anti-CRLF Injection e Schema Strict...');

const baseValidPayload = {
  name: 'Recrutador Valido',
  email: 'recrutador@empresa.com',
  subject: 'Oportunidade Senior',
  message: 'Mensagem explicativa sobre a oportunidade.',
  consent: true,
};

// 2.1 Rejeição de quebra de linha (\r ou \n) em Nome (Anti-CRLF Injection)
const crlfNamePayload = {
  ...baseValidPayload,
  name: 'Atacante\r\nBcc: vitima@alvo.com',
};
const crlfNameResult = ContactPayloadSchema.safeParse(crlfNamePayload);
assert.strictEqual(crlfNameResult.success, false, 'Nome contendo CRLF deve ser rejeitado pelo schema.');
console.log('  -> Bloqueio de quebra de linha em nome: OK');

// 2.2 Rejeição de quebra de linha (\r ou \n) em Assunto (Anti-CRLF Injection)
const crlfSubjectPayload = {
  ...baseValidPayload,
  subject: 'Assunto\nCc: spam@alvo.com',
};
const crlfSubjectResult = ContactPayloadSchema.safeParse(crlfSubjectPayload);
assert.strictEqual(crlfSubjectResult.success, false, 'Assunto contendo quebra de linha deve ser rejeitado pelo schema.');
console.log('  -> Bloqueio de quebra de linha em assunto: OK');

// 2.3 Rejeição de campos extras inesperados (.strict())
const extraFieldPayload = {
  ...baseValidPayload,
  adminRole: true,
  hackField: 'injected',
};
const extraFieldResult = ContactPayloadSchema.safeParse(extraFieldPayload);
assert.strictEqual(extraFieldResult.success, false, 'Campos não autorizados devem ser estritamente bloqueados.');
console.log('  -> Bloqueio estrito de campos extras não mapeados (Schema.strict): OK');

// ----------------------------------------------------------------------------
// [3/7] SANITIZAÇÃO NO SERVIÇO DE E-MAIL E MASCARAMENTO DE ERROS EXTERNOS
// ----------------------------------------------------------------------------
console.log('\n[3/7] Testando sanitização de cabeçalhos no contactService e mascaramento de erros...');

// 3.1 Em modo de teste, a sanitização não corrompe envio legítimo
process.env.NODE_ENV = 'test';
process.env.MOCK_EMAIL_SERVICE = 'true';
const sendMockResult = await sendContactEmail({
  name: 'Elias Reis',
  email: 'elias@exemplo.com',
  subject: 'Contato Técnico',
  message: 'Mensagem de teste.',
});
assert.strictEqual(sendMockResult.success, true);
console.log('  -> Mock isolado de envio de e-mail em ambiente de teste: OK');

// 3.2 Em produção com falha do provedor externo, mensagens de infraestrutura não vazam para o cliente
resetRateLimitStore();
const reqDeliveryFailure = new NextRequest('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-vercel-forwarded-for': '198.51.100.99',
  },
  body: JSON.stringify(baseValidPayload),
});

// Forçar simulação de falha de envio em ambiente controlado
process.env.NODE_ENV = 'production';
process.env.RATE_LIMIT_ALLOW_UNCONFIGURED_IN_PROD = 'true';
process.env.RESEND_API_KEY = 're_invalid_test_key_xyz123';
process.env.CONTACT_FROM_EMAIL = 'contato@dominio-proprio-valido.com.br';

const resDeliveryFailure = await POST(reqDeliveryFailure);
const bodyDeliveryFailure = await resDeliveryFailure.json();

// O erro retornado ao visitante NÃO DEVE conter a chave nem dados internos
assert.strictEqual(resDeliveryFailure.status, 502, 'Falha do provedor externo deve retornar HTTP 502.');
assert.strictEqual(bodyDeliveryFailure.code, 'DELIVERY_FAILED');
assert.ok(
  !bodyDeliveryFailure.message.includes('re_invalid') &&
    !bodyDeliveryFailure.message.includes('xyz123'),
  'A mensagem de erro retornada ao cliente não deve vazar segredos ou respostas brutas do provedor.'
);
console.log('  -> Mascaramento de erros de infraestrutura de terceiros (sem vazamento de tokens): OK');

// Restaurar variáveis
process.env.NODE_ENV = 'test';
delete process.env.RATE_LIMIT_ALLOW_UNCONFIGURED_IN_PROD;
delete process.env.RESEND_API_KEY;
delete process.env.CONTACT_FROM_EMAIL;
delete process.env.MOCK_EMAIL_SERVICE;

// ----------------------------------------------------------------------------
// [4/7] PRECEDÊNCIA E SANITIZAÇÃO DE IP (RESISTÊNCIA A SPOOFING DE CABEÇALHOS)
// ----------------------------------------------------------------------------
console.log('\n[4/7] Testando precedência e sanitização de IP multi-proxy...');

// 4.1 Prioridade absoluta: x-vercel-forwarded-for gerenciado pela infraestrutura Vercel
const headersVercelPriority = new Headers({
  'x-vercel-forwarded-for': '203.0.113.10',
  'x-real-ip': '198.51.100.5',
  'cf-connecting-ip': '198.51.100.9',
  'x-forwarded-for': '1.1.1.1, 2.2.2.2',
});
assert.strictEqual(
  extractClientIp(headersVercelPriority),
  '203.0.113.10',
  'x-vercel-forwarded-for deve ter precedência máxima.'
);

// 4.2 Prioridade secundária: x-real-ip quando vercel-forwarded ausente
const headersRealIpPriority = new Headers({
  'x-real-ip': '198.51.100.5',
  'cf-connecting-ip': '198.51.100.9',
  'x-forwarded-for': '1.1.1.1, 2.2.2.2',
});
assert.strictEqual(
  extractClientIp(headersRealIpPriority),
  '198.51.100.5',
  'x-real-ip deve ser priorizado em relação a x-forwarded-for spoofável.'
);

// 4.3 Prioridade terciária: cf-connecting-ip
const headersCloudflarePriority = new Headers({
  'cf-connecting-ip': '198.51.100.9',
  'x-forwarded-for': '1.1.1.1, 2.2.2.2',
});
assert.strictEqual(
  extractClientIp(headersCloudflarePriority),
  '198.51.100.9',
  'cf-connecting-ip deve ser priorizado.'
);

// 4.4 Sanitização de injeções em cabeçalhos de IP
const headersInjection = new Headers({
  'x-real-ip': 'DROP TABLE users;--',
  'x-forwarded-for': '<script>alert(1)</script>, 192.0.2.1',
});
assert.strictEqual(
  extractClientIp(headersInjection),
  '192.0.2.1',
  'Injeções devem ser descartadas pelo validador sintático.'
);

// 4.5 Fallback para 127.0.0.1 quando nenhum IP for válido
const headersAllInvalid = new Headers({
  'x-forwarded-for': 'invalid-content, another-invalid',
});
assert.strictEqual(
  extractClientIp(headersAllInvalid),
  '127.0.0.1',
  'IP inválido deve recorrer a 127.0.0.1.'
);
console.log('  -> Precedência defensiva e sanitização de cabeçalhos de IP: OK');

// ----------------------------------------------------------------------------
// [5/7] CONTENT-SECURITY-POLICY E CABEÇALHOS DE DEFESA EM PROFUNDIDADE
// ----------------------------------------------------------------------------
console.log('\n[5/7] Testando endurecimento de cabeçalhos em next.config.ts...');

const nextConfigPath = path.resolve(__dirname, '../next.config.ts');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

// 5.1 Eliminação de api.resend.com do connect-src no cliente
assert.ok(
  nextConfigContent.includes("connect-src 'self';"),
  'connect-src no cliente deve ser restrito estritamente a self.'
);
assert.ok(
  !nextConfigContent.includes('connect-src \'self\' https://api.resend.com'),
  'api.resend.com não deve estar exposto no connect-src do navegador.'
);

// 5.2 Presença de Cross-Origin-Opener-Policy e Cross-Origin-Resource-Policy
assert.ok(
  nextConfigContent.includes("key: 'Cross-Origin-Opener-Policy'") &&
    nextConfigContent.includes("value: 'same-origin'"),
  'Deve conter Cross-Origin-Opener-Policy: same-origin.'
);
assert.ok(
  nextConfigContent.includes("key: 'Cross-Origin-Resource-Policy'") &&
    nextConfigContent.includes("value: 'same-origin'"),
  'Deve conter Cross-Origin-Resource-Policy: same-origin.'
);

// 5.3 Desativação do cabeçalho de tecnologia (poweredByHeader: false)
assert.ok(
  nextConfigContent.includes('poweredByHeader: false'),
  'poweredByHeader deve ser false para não expor Next.js no header X-Powered-By.'
);
console.log('  -> Restrição de CSP connect-src para self e isolamento Cross-Origin: OK');

// ----------------------------------------------------------------------------
// [6/7] AUDITORIA DE LINKS EXTERNOS (NOOPENER NOREFERRER & PROTOCOLOS SEGUROS)
// ----------------------------------------------------------------------------
console.log('\n[6/7] Testando segurança de links externos (target="_blank")...');

const srcDir = path.resolve(__dirname, '../src');

function getTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getTsxFiles(fullPath));
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const tsxFiles = getTsxFiles(srcDir);
let totalTargetBlank = 0;
let totalRelProtected = 0;

tsxFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Encontrar todas as tags <a que contêm target="_blank"
  const aTagRegex = /<a\s+[^>]*target=["']_blank["'][^>]*>/gi;
  const matches = content.match(aTagRegex) || [];
  matches.forEach((tag) => {
    totalTargetBlank++;
    if (tag.includes('rel="noopener noreferrer"') || tag.includes("rel='noopener noreferrer'")) {
      totalRelProtected++;
    } else {
      assert.fail(`Link com target="_blank" sem rel="noopener noreferrer" em ${filePath}: ${tag}`);
    }
  });
});

assert.strictEqual(
  totalTargetBlank,
  totalRelProtected,
  'Todos os links target="_blank" devem ter rel="noopener noreferrer".'
);
assert.ok(totalTargetBlank > 0, 'Deve auditar links existentes na aplicação.');
console.log(`  -> 100% dos ${totalTargetBlank} links externos possuem proteção rel="noopener noreferrer": OK`);

// ----------------------------------------------------------------------------
// [7/7] ISOLAMENTO DE SEGREDOS E AUSÊNCIA DE PREFIXO NEXT_PUBLIC_ EM CREDENCIAIS
// ----------------------------------------------------------------------------
console.log('\n[7/7] Testando isolamento e ausência de segredos com NEXT_PUBLIC_...');

const envExamplePath = path.resolve(__dirname, '../.env.example');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

const forbiddenPublicKeys = [
  'NEXT_PUBLIC_RESEND_API_KEY',
  'NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_KV_REST_API_TOKEN',
  'NEXT_PUBLIC_SECRET',
  'NEXT_PUBLIC_PRIVATE_KEY',
];

forbiddenPublicKeys.forEach((key) => {
  assert.ok(
    !envExampleContent.includes(key),
    `Chave secreta proibida não pode ter prefixo NEXT_PUBLIC_: ${key}`
  );
});

// Conferir se chaves confidenciais estão sem NEXT_PUBLIC_
assert.ok(envExampleContent.includes('RESEND_API_KEY=""'), 'RESEND_API_KEY deve ser privada.');
assert.ok(envExampleContent.includes('UPSTASH_REDIS_REST_TOKEN=""'), 'UPSTASH_REDIS_REST_TOKEN deve ser privada.');
console.log('  -> Auditoria de isolamento de segredos no servidor aprovada: OK');

console.log('\n================================================================');
console.log('>>> TODOS OS 7 TESTES DE CYBERSECURITY HARDENING FORAM APROVADOS! <<<');
console.log('================================================================\n');
