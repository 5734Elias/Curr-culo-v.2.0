import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextRequest } from 'next/server';

import { ContactPayloadSchema } from '../src/schemas/content.ts';
import { extractClientIp, isValidIp, resetRateLimitStore } from '../src/lib/rateLimit.ts';
import { readRequestBodyWithLimit, MAX_REQUEST_BODY_BYTES } from '../src/lib/bodyLimiter.ts';
import { sendContactEmail } from '../src/services/contactService.ts';
import { POST } from '../src/app/api/contact/route.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('--- TEST SUITE: CYBERSECURITY HARDENING & DEFENSIVE CONTROLS ---');
console.log('================================================================');

// ----------------------------------------------------------------------------
// [1/8] CONTENT-TYPE, TAMANHO MÁXIMO EM BYTES, LEITURA INCREMENTAL E ENCODING
// ----------------------------------------------------------------------------
console.log('\n[1/8] Testando validações de Content-Type, bytes UTF-8 e streaming na API /api/contact...');

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
console.log('  -> Rejeição antecipada via Content-Length > 10KB (HTTP 413): OK');

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
const bodyOversizedRes = await resOversizedBody.json();
assert.strictEqual(bodyOversizedRes.code, 'PAYLOAD_TOO_LARGE');
console.log('  -> Rejeição de corpo bruto > 10KB (HTTP 413): OK');

// 1.4 Contagem real de bytes UTF-8 (multibyte/emojis):
// 3.000 emojis 🚀 ocupam 6.000 caracteres UTF-16 (.length), porém 12.000 bytes em UTF-8 (> 10.240 bytes)
const emojiMessage = '🚀'.repeat(3000); // 6.000 chars UTF-16, 12.000 bytes UTF-8
const multibytePayload = JSON.stringify({
  name: 'Elias Reis',
  email: 'elias@exemplo.com',
  subject: 'Oportunidade',
  message: emojiMessage,
  consent: true,
});
const reqMultibyteOversized = new NextRequest('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: multibytePayload,
});
const resMultibyteOversized = await POST(reqMultibyteOversized);
assert.strictEqual(
  resMultibyteOversized.status,
  413,
  'Payload com contagem de caracteres UTF-16 baixa mas contagem de bytes UTF-8 > 10KB deve retornar HTTP 413.'
);
const bodyMultibyteRes = await resMultibyteOversized.json();
assert.strictEqual(bodyMultibyteRes.code, 'PAYLOAD_TOO_LARGE');
console.log('  -> Contagem real de bytes UTF-8 com emojis multibyte (HTTP 413): OK');

// 1.5 Tratamento seguro de JSON malformado (HTTP 400 MALFORMED_JSON, sem erro 500)
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

// 1.6 Tratamento de sequência de bytes UTF-8 inválida (HTTP 400 INVALID_ENCODING)
const invalidUtf8Bytes = new Uint8Array([0x7b, 0x22, 0xff, 0xff, 0x22, 0x7d]); // bytes inválidos em UTF-8
const rawReqInvalidUtf8 = new Request('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: invalidUtf8Bytes,
});
const encodingCheck = await readRequestBodyWithLimit(rawReqInvalidUtf8);
assert.strictEqual(encodingCheck.ok, false);
assert.strictEqual(encodingCheck.status, 400);
assert.strictEqual(encodingCheck.code, 'INVALID_ENCODING');
console.log('  -> Rejeição de bytes UTF-8 inválidos com TextDecoder fatal (HTTP 400 INVALID_ENCODING): OK');

// ----------------------------------------------------------------------------
// [2/8] PREVENÇÃO CONTRA CRLF INJECTION E SCHEMA STRICT NO ZOD
// ----------------------------------------------------------------------------
console.log('\n[2/8] Testando regras de Anti-CRLF Injection e Schema Strict...');

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
// [3/8] SANITIZAÇÃO NO SERVIÇO DE E-MAIL E MASCARAMENTO DE ERROS EXTERNOS
// ----------------------------------------------------------------------------
console.log('\n[3/8] Testando sanitização de cabeçalhos no contactService e mascaramento de erros...');

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
// [4/8] CONFIANÇA NO IP DO VISITANTE NA VERCEL E RESISTÊNCIA A SPOOFING
// ----------------------------------------------------------------------------
console.log('\n[4/8] Testando precedência real de IP da Vercel, eliminação de cf-connecting-ip e rejeição de spoofing...');

// 4.1 Prioridade absoluta: x-vercel-forwarded-for gerenciado pela infraestrutura Vercel
const headersVercelPriority = new Headers({
  'x-vercel-forwarded-for': '203.0.113.10, 10.0.0.1',
  'x-real-ip': '198.51.100.5',
  'cf-connecting-ip': '198.51.100.9',
  'x-forwarded-for': '1.1.1.1, 2.2.2.2',
});
assert.strictEqual(
  extractClientIp(headersVercelPriority),
  '203.0.113.10',
  'x-vercel-forwarded-for deve ter precedência máxima (primeiro IP da borda).'
);
console.log('  -> x-vercel-forwarded-for priorizado como fonte primária da borda Vercel: OK');

// 4.2 Prioridade secundária: x-real-ip normalizado pela Vercel quando x-vercel-forwarded ausente
const headersRealIpPriority = new Headers({
  'x-real-ip': '198.51.100.5',
  'cf-connecting-ip': '198.51.100.9',
  'x-forwarded-for': '1.1.1.1, 2.2.2.2',
});
assert.strictEqual(
  extractClientIp(headersRealIpPriority),
  '198.51.100.5',
  'x-real-ip deve ser considerado quando x-vercel-forwarded-for não estiver presente.'
);
console.log('  -> x-real-ip como fonte secundária normalizada da Vercel: OK');

// 4.3 Eliminação de cf-connecting-ip: não é confiável no ambiente Vercel
// Em produção, cabeçalho cf-connecting-ip enviado isoladamente é totalmente desconsiderado
const headersCloudflareSpoof = new Headers({
  'cf-connecting-ip': '198.51.100.9',
});
assert.strictEqual(
  extractClientIp(headersCloudflareSpoof, true),
  null,
  'cf-connecting-ip deve ser completamente ignorado em produção (retorna null).'
);
console.log('  -> cf-connecting-ip desconsiderado e não confiável no ambiente Vercel: OK');

// 4.4 Política estrita de Produção: nunca colapsar em 127.0.0.1 e rejeitar clientes não identificados
// Previne DoS mútuo onde atacante esgotaria cota compartilhada de 127.0.0.1
const headersMissingInProd = new Headers({
  'user-agent': 'Mozilla/5.0',
});
assert.strictEqual(
  extractClientIp(headersMissingInProd, true),
  null,
  'Em produção, cabeçalhos ausentes devem retornar null em vez de colapsar em 127.0.0.1.'
);

// Na API /api/contact em produção, requisição sem procedência comprovada retorna HTTP 400 UNIDENTIFIED_CLIENT
process.env.NODE_ENV = 'production';
const reqUnidentifiedProd = new NextRequest('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'cf-connecting-ip': '1.2.3.4', // Atacante tentando spoofing de IP via cf-connecting-ip
  },
  body: JSON.stringify(baseValidPayload),
});
const resUnidentifiedProd = await POST(reqUnidentifiedProd);
assert.strictEqual(
  resUnidentifiedProd.status,
  400,
  'Requisição em produção com cabeçalho de IP spoofado/ausente deve ser rejeitada com HTTP 400.'
);
const bodyUnidentifiedRes = await resUnidentifiedProd.json();
assert.strictEqual(
  bodyUnidentifiedRes.code,
  'UNIDENTIFIED_CLIENT',
  'Código de erro deve ser UNIDENTIFIED_CLIENT.'
);
console.log('  -> Proteção contra spoofing de IP e mitigação de DoS por 127.0.0.1 (HTTP 400 UNIDENTIFIED_CLIENT): OK');

// Restaurar NODE_ENV para test
process.env.NODE_ENV = 'test';

// 4.5 Ambiente local/desenvolvimento: permite testes com x-forwarded-for ou fallback seguro 127.0.0.1
const headersDevXff = new Headers({
  'x-forwarded-for': '192.168.1.50',
});
assert.strictEqual(
  extractClientIp(headersDevXff, false),
  '192.168.1.50',
  'Em desenvolvimento/teste, x-forwarded-for é aceito para permitir testes locais.'
);

const headersDevFallback = new Headers({});
assert.strictEqual(
  extractClientIp(headersDevFallback, false),
  '127.0.0.1',
  'Em desenvolvimento/teste, fallback para 127.0.0.1 é permitido exclusivamente fora de produção.'
);
console.log('  -> Fallback controlado restrito a desenvolvimento/teste: OK');

// 4.6 Validação rigorosa de IPv4 e IPv6 (nativa via net.isIP) e descarte de injeções sintáticas
assert.strictEqual(isValidIp('203.0.113.195'), true, 'IPv4 válido deve ser reconhecido.');
assert.strictEqual(isValidIp('192.168.1.1'), true, 'IPv4 privado deve ser reconhecido.');
assert.strictEqual(isValidIp('127.0.0.1'), true, 'IPv4 loopback deve ser reconhecido.');
assert.strictEqual(isValidIp('8.8.8.8'), true, 'IPv4 público deve ser reconhecido.');

// IPv6 em formatos canônico, compactado e mapeado (RFC 4291 / RFC 5952)
assert.strictEqual(isValidIp('2001:db8::1'), true, 'IPv6 compactado com :: no meio deve ser reconhecido.');
assert.strictEqual(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), true, 'IPv6 completo de 8 grupos deve ser reconhecido.');
assert.strictEqual(isValidIp('2001:db8:85a3::8a2e:370:7334'), true, 'IPv6 compactado com grupos múltiplos deve ser reconhecido.');
assert.strictEqual(isValidIp('::1'), true, 'IPv6 loopback (::1) deve ser reconhecido.');
assert.strictEqual(isValidIp('::'), true, 'IPv6 unspecified (::) deve ser reconhecido.');
assert.strictEqual(isValidIp('fe80::1ff:fe23:4567:890a'), true, 'IPv6 link-local deve ser reconhecido.');
assert.strictEqual(isValidIp('::ffff:192.0.2.1'), true, 'IPv6 IPv4-mapped deve ser reconhecido.');

// Entradas maliciosas, corrompidas ou fora dos padrões RFC
assert.strictEqual(isValidIp('DROP TABLE users;--'), false, 'Injeção SQL não é IP válido.');
assert.strictEqual(isValidIp('<script>alert(1)</script>'), false, 'Injeção XSS não é IP válido.');
assert.strictEqual(isValidIp('256.0.0.1'), false, 'IPv4 com octeto > 255 deve ser rejeitado.');
assert.strictEqual(isValidIp('1.2.3.4.5'), false, 'IPv4 com 5 octetos deve ser rejeitado.');
assert.strictEqual(isValidIp('2001:xyz::1'), false, 'IPv6 com caracteres hexadecimais inválidos deve ser rejeitado.');
assert.strictEqual(isValidIp('127.0.0.1:8080'), false, 'IP com porta anexada deve ser rejeitado para sanitização.');
assert.strictEqual(isValidIp(''), false, 'String vazia deve ser rejeitada.');
// @ts-expect-error testando tipo incorreto em runtime
assert.strictEqual(isValidIp(null), false, 'Valor nulo deve ser rejeitado.');
// @ts-expect-error testando tipo incorreto em runtime
assert.strictEqual(isValidIp(undefined), false, 'Valor indefinido deve ser rejeitado.');
const headersInjection = new Headers({
  'x-real-ip': 'DROP TABLE users;--',
  'x-forwarded-for': '<script>alert(1)</script>, 192.0.2.1',
});
assert.strictEqual(
  extractClientIp(headersInjection, false),
  '192.0.2.1',
  'Injeções maliciosas em cabeçalhos de IP devem ser descartadas pelo validador sintático.'
);
console.log('  -> Validação sintática rigorosa de IP descartando injeções SQL/XSS: OK');

// ----------------------------------------------------------------------------
// [5/8] LEITURA INCREMENTAL DIRETA E CANCELAMENTO DE STREAM EM BODYLIMITER
// ----------------------------------------------------------------------------
console.log('\n[5/8] Testando leitura incremental com ReadableStream e interrupção de fluxo...');

// 5.1 Stream que gera dados além do limite máximo de 10.240 bytes
let streamCancelled = false;
let chunksSent = 0;
const testOversizedStream = new ReadableStream({
  pull(controller) {
    if (chunksSent < 20) {
      // Envia blocos de 1KB
      controller.enqueue(new Uint8Array(1024));
      chunksSent++;
    } else {
      controller.close();
    }
  },
  cancel() {
    streamCancelled = true;
  },
});

const mockStreamReq = new Request('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: testOversizedStream,
  // @ts-expect-error duplex is required in node fetch for streaming bodies
  duplex: 'half',
});

const streamLimitResult = await readRequestBodyWithLimit(mockStreamReq, MAX_REQUEST_BODY_BYTES);
assert.strictEqual(streamLimitResult.ok, false);
assert.strictEqual(streamLimitResult.status, 413);
assert.strictEqual(streamLimitResult.code, 'PAYLOAD_TOO_LARGE');
assert.strictEqual(streamCancelled, true, 'O stream deve ser cancelado imediatamente ao atingir o limite.');
console.log('  -> Leitura incremental interrompida com cancelamento de stream ativo (HTTP 413): OK');

// 5.2 Stream válido abaixo do limite
const validPayloadString = JSON.stringify(baseValidPayload);
const testValidStream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode(validPayloadString));
    controller.close();
  },
});
const mockValidStreamReq = new Request('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: testValidStream,
  // @ts-expect-error duplex is required in node fetch
  duplex: 'half',
});
const streamValidResult = await readRequestBodyWithLimit(mockValidStreamReq, MAX_REQUEST_BODY_BYTES);
assert.strictEqual(streamValidResult.ok, true);
if (streamValidResult.ok) {
  assert.strictEqual(streamValidResult.rawBody, validPayloadString);
  assert.strictEqual(streamValidResult.byteLength, Buffer.byteLength(validPayloadString, 'utf-8'));
}
console.log('  -> Leitura incremental bem-sucedida de stream dentro da cota: OK');

// ----------------------------------------------------------------------------
// [6/8] CONTENT-SECURITY-POLICY E CABEÇALHOS DE DEFESA EM PROFUNDIDADE
// ----------------------------------------------------------------------------
console.log('\n[6/8] Testando endurecimento de cabeçalhos em next.config.ts...');

const nextConfigPath = path.resolve(__dirname, '../next.config.ts');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

// 6.1 Eliminação de api.resend.com do connect-src no cliente
assert.ok(
  nextConfigContent.includes("connect-src 'self';"),
  'connect-src no cliente deve ser restrito estritamente a self.'
);
assert.ok(
  !nextConfigContent.includes('connect-src \'self\' https://api.resend.com'),
  'api.resend.com não deve estar exposto no connect-src do navegador.'
);

// 6.2 Presença de Cross-Origin-Opener-Policy e Cross-Origin-Resource-Policy
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

// 6.3 Desativação do cabeçalho de tecnologia (poweredByHeader: false)
assert.ok(
  nextConfigContent.includes('poweredByHeader: false'),
  'poweredByHeader deve ser false para não expor Next.js no header X-Powered-By.'
);
console.log('  -> Restrição de CSP connect-src para self e isolamento Cross-Origin: OK');

// ----------------------------------------------------------------------------
// [7/8] AUDITORIA DE LINKS EXTERNOS (NOOPENER NOREFERRER & PROTOCOLOS SEGUROS)
// ----------------------------------------------------------------------------
console.log('\n[7/8] Testando segurança de links externos (target="_blank")...');

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
// [8/8] ISOLAMENTO DE SEGREDOS E AUSÊNCIA DE PREFIXO NEXT_PUBLIC_ EM CREDENCIAIS
// ----------------------------------------------------------------------------
console.log('\n[8/8] Testando isolamento e ausência de segredos com NEXT_PUBLIC_...');

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

assert.ok(envExampleContent.includes('RESEND_API_KEY=""'), 'RESEND_API_KEY deve ser privada.');
assert.ok(envExampleContent.includes('UPSTASH_REDIS_REST_TOKEN=""'), 'UPSTASH_REDIS_REST_TOKEN deve ser privada.');
console.log('  -> Auditoria de isolamento de segredos no servidor aprovada: OK');

console.log('\n================================================================');
console.log('>>> TODOS OS 8 TESTES DE CYBERSECURITY HARDENING FORAM APROVADOS! <<<');
console.log('================================================================\n');
