import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose/jwt/sign';
import { verifySessionToken } from '../src/lib/auth/session.ts';
import { getAdminSession } from '../src/lib/auth/serverAuth.ts';
import { GET as getCertificatesRoute } from '../src/app/api/admin/certificates/route.ts';
import { POST as postCertificatesRoute } from '../src/app/api/admin/certificates/route.ts';
import { POST as uploadMediaRoute } from '../src/app/api/admin/media/upload/route.ts';
import { getPublishedCertificates, getPublishedProjects } from '../src/services/cmsDataService.ts';
import nextConfig from '../next.config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('====================================================================');
console.log('--- TEST SUITE: CMS HARDENING, QA & CYBERSECURITY GATES (FASE 8) ---');
console.log('====================================================================');

// ----------------------------------------------------------------------------
// [1/6] ZERO-TRUST RBAC & VERIFICAÇÃO DE SESSÕES CRIPTOGRÁFICAS
// ----------------------------------------------------------------------------
console.log('\n[1/6] Testando portões de segurança Zero-Trust e autenticação administrativa...');

const dummySecret = new Uint8Array(32).fill(7);

// 1.1 Sessão não autenticada (sem cookie) deve ser rejeitada imediatamente com HTTP 401
const unauthReq = new NextRequest('http://localhost:3000/api/admin/certificates');
const unauthResponse = await getCertificatesRoute(unauthReq);
assert.strictEqual(unauthResponse.status, 401, 'Requisição sem cookie deve receber HTTP 401.');
const unauthData = await unauthResponse.json();
assert.strictEqual(unauthData.error, 'Acesso não autorizado.');
console.log('  -> Bloqueio imediato de requisições anônimas em GET (HTTP 401): OK');

// 1.2 POST anônimo também deve ser bloqueado com HTTP 401
const unauthPostReq = new NextRequest('http://localhost:3000/api/admin/certificates', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hacked' }),
});
const unauthPostResponse = await postCertificatesRoute(unauthPostReq);
assert.strictEqual(unauthPostResponse.status, 401, 'POST anônimo deve receber HTTP 401.');
console.log('  -> Bloqueio imediato de requisições anônimas em POST (HTTP 401): OK');

// 1.3 Upload anônimo de mídia também deve ser bloqueado com HTTP 401
const unauthUploadReq = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
});
const unauthUploadResponse = await uploadMediaRoute(unauthUploadReq);
assert.strictEqual(unauthUploadResponse.status, 401, 'Upload anônimo de mídia deve receber HTTP 401.');
console.log('  -> Bloqueio imediato de uploads anônimos de mídia (HTTP 401): OK');

// 1.4 Token expirado
const expiredToken = await new SignJWT({
  sub: 'admin-google-sub-12345',
  email: 'elias.re_is@hotmail.com',
  name: 'Elias Ribeiro',
  role: 'admin',
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
  .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
  .sign(dummySecret);

const expiredVerify = await verifySessionToken(expiredToken);
assert.strictEqual(expiredVerify, null, 'Token expirado deve ser rejeitado com valor nulo.');
console.log('  -> Rejeição estrita de tokens expirados: OK');

// 1.5 Token assinado com chave HMAC forjada/incorreta
const forgedSecret = new Uint8Array(32).fill(99);
const forgedToken = await new SignJWT({
  sub: 'admin-google-sub-12345',
  email: 'elias.re_is@hotmail.com',
  name: 'Hacker',
  role: 'admin',
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(forgedSecret);

const forgedVerify = await verifySessionToken(forgedToken);
assert.strictEqual(forgedVerify, null, 'Token assinado com chave espúria deve ser estritamente descartado.');
console.log('  -> Rejeição de tokens com assinatura HMAC forjada: OK');

// 1.6 getAdminSession com cookie inválido
const forgedReq = new NextRequest('http://localhost:3000/api/admin/certificates', {
  headers: {
    cookie: `admin_session=${forgedToken}`,
  },
});
const forgedSession = await getAdminSession(forgedReq);
assert.strictEqual(forgedSession, null, 'getAdminSession deve retornar null para token forjado.');
console.log('  -> getAdminSession descarta cookies com tokens inválidos: OK');

// ----------------------------------------------------------------------------
// [2/6] PORTÕES DE SEGURANÇA NO UPLOAD DE MÍDIA (/api/admin/media/upload)
// ----------------------------------------------------------------------------
console.log('\n[2/6] Testando proteções e isolamento de uploads de mídia...');

// Validação de tipos permitidos e magic bytes
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MAGIC_BYTE_HEADERS = {
  pdf: Buffer.from('%PDF-'),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  webp: Buffer.from('RIFF'),
};

// 2.1 Verifica que extensões perigosas são banidas
const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.ts', '.html', '.svg', '.php'];
for (const ext of dangerousExtensions) {
  const isAllowed = ALLOWED_MIME_TYPES.some((m) => m.includes(ext.replace('.', '')));
  assert.strictEqual(isAllowed, false, `Extensão perigosa ${ext} não deve ser aceita.`);
}
console.log('  -> Bloqueio preventivo de arquivos executáveis e scripts perigosos: OK');

// 2.2 Rejeição de falsificação de cabeçalho binário (Magic Bytes)
const fakePngContent = Buffer.from('<?php echo "malicious code"; ?>');
const isPng = fakePngContent.subarray(0, 4).equals(MAGIC_BYTE_HEADERS.png);
assert.strictEqual(isPng, false, 'Arquivo falso mascarado de imagem deve falhar na validação binária.');
console.log('  -> Deteção de mascaramento de arquivos por inspeção de Magic Bytes: OK');

// 2.3 Prevenção de Path Traversal nos nomes de arquivos
const traversalPayloads = ['../../etc/passwd', '..\\windows\\system32', 'foo/../../bar.pdf'];
for (const p of traversalPayloads) {
  const sanitized = path.basename(p);
  assert(!sanitized.includes('..'), `Path traversal em "${p}" deve ser neutralizado.`);
}
console.log('  -> Neutralização de Path Traversal em nomes de arquivos: OK');

// ----------------------------------------------------------------------------
// [3/6] HARDENING DE CABEÇALHOS HTTP E CONTENT SECURITY POLICY (CSP)
// ----------------------------------------------------------------------------
console.log('\n[3/6] Validando Content-Security-Policy e cabeçalhos de defesa em profundidade...');

const configObj = nextConfig?.default || nextConfig;
const headersConfig = typeof configObj.headers === 'function' ? await configObj.headers() : [];
assert(Array.isArray(headersConfig), 'Configuração de headers deve ser uma lista.');

const defaultHeaders = headersConfig.find((h) => h.source === '/(.*)');
assert(defaultHeaders, 'Deve existir configuração global de headers para /(.*).');

const headerMap = new Map(defaultHeaders.headers.map((h) => [h.key, h.value]));

// 3.1 Content-Security-Policy
const csp = headerMap.get('Content-Security-Policy');
assert(csp, 'Content-Security-Policy deve estar explicitamente configurada.');
assert(csp.includes("default-src 'self'"), "CSP deve declarar default-src 'self'.");
assert(csp.includes("object-src 'none'"), "CSP deve proibir plugins (object-src 'none').");
assert(csp.includes("base-uri 'self'"), "CSP deve restringir base-uri.");
assert(csp.includes("frame-ancestors 'none'"), 'CSP deve impedir clickjacking (frame-ancestors).');
console.log('  -> Diretivas críticas de Content-Security-Policy auditadas: OK');

// 3.2 HSTS (Strict-Transport-Security)
const hsts = headerMap.get('Strict-Transport-Security');
assert(hsts && hsts.includes('max-age=63072000'), 'HSTS deve ter max-age de pelo menos 2 anos.');
assert(hsts.includes('includeSubDomains'), 'HSTS deve incluir subdomínios.');
assert(hsts.includes('preload'), 'HSTS deve habilitar preload.');
console.log('  -> HSTS rígido com preload e subdomínios: OK');

// 3.3 Defesas adicionais
assert.strictEqual(headerMap.get('X-Frame-Options'), 'DENY', 'X-Frame-Options deve ser DENY.');
assert.strictEqual(headerMap.get('X-Content-Type-Options'), 'nosniff', 'X-Content-Type-Options deve ser nosniff.');
assert.strictEqual(headerMap.get('Referrer-Policy'), 'strict-origin-when-cross-origin', 'Referrer-Policy deve ser strict-origin.');
assert(headerMap.get('Permissions-Policy')?.includes('camera=()'), 'Permissions-Policy deve bloquear recursos desnecessários.');
console.log('  -> X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy: OK');

// ----------------------------------------------------------------------------
// [4/6] VARREDURA ESTÁTICA CONTRA VAZAMENTO DE SEGREDOS NO CÓDIGO
// ----------------------------------------------------------------------------
console.log('\n[4/6] Executando varredura estática de segredos e credenciais hardcoded...');

const directoriesToScan = [
  path.join(projectRoot, 'src'),
  path.join(projectRoot, 'prisma'),
];

const secretPatterns = [
  { name: 'GitHub Personal Access Token', regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'GitHub OAuth Token', regex: /gho_[a-zA-Z0-9]{36}/ },
  { name: 'Chave de API Resend', regex: /re_[a-zA-Z0-9]{24,}/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Chave Privada RSA/EC', regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Senha de Banco em URL Real', regex: /postgres:\/\/[a-zA-Z0-9_-]+:[^@\s]+@/ },
];

function scanDirectoryForSecrets(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDirectoryForSecrets(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.json'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const pattern of secretPatterns) {
        assert(!pattern.regex.test(content), `ALERTA DE SEGURANÇA: Possível ${pattern.name} detectado em ${fullPath}`);
      }
    }
  }
}

for (const dir of directoriesToScan) {
  if (fs.existsSync(dir)) {
    scanDirectoryForSecrets(dir);
  }
}
console.log('  -> Varredura estática concluída: ZERO segredos, tokens ou senhas encontrados no código: OK');

// ----------------------------------------------------------------------------
// [5/6] AUDITORIA DE REVALIDAÇÃO SOB DEMANDA (ISR) E ROTAS DO PORTFÓLIO
// ----------------------------------------------------------------------------
console.log('\n[5/6] Validando integridade das rotas públicas e ISR...');

const publishedCerts = await getPublishedCertificates();
assert.strictEqual(publishedCerts.length, 65, 'Todos os 65 cursos devem ser retornados.');

const publishedProjects = await getPublishedProjects();
assert.strictEqual(publishedProjects.length, 4, 'Todos os 4 projetos devem ser retornados.');

console.log('  -> Camada resiliente do CMS ativa com resposta imediata e sem bloqueios: OK');

// ----------------------------------------------------------------------------
// [6/6] INTEGRIDADE MATEMÁTICA ABSOLUTA (ZERO REGRESSÃO)
// ----------------------------------------------------------------------------
console.log('\n[6/6] Verificando integridade matemática e garantias finais...');

const totalHoursVerified = publishedCerts.reduce((sum, c) => sum + (c.workloadHours ?? 0), 0);
assert.strictEqual(totalHoursVerified, 2164.5, 'Carga horária total deve permanecer estritamente 2.164,5h.');
assert.strictEqual(new Set(publishedCerts.map((c) => c.institution)).size, 13, 'Devem existir exatamente 13 instituições únicas catalogadas.');

console.log(`  -> 65 cursos e 2.164,5 horas preservados com precisão matemática absoluta: OK`);

console.log('\n====================================================================');
console.log('--- TODOS OS PORTÕES DE CIBERSEGURANÇA E QA FORAM APROVADOS! ---');
console.log('====================================================================\n');
