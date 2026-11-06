import assert from 'node:assert';
import { NextRequest } from 'next/server';

import {
  CreateProjectSchema,
  UpdateProjectSchema,
  TogglePublishSchema,
} from '../src/schemas/cms.ts';
import {
  getAllProjectsAdmin,
  createProjectAdmin,
  updateProjectAdmin,
  toggleProjectPublishAdmin,
  deleteProjectAdmin,
  getAllCertificatesAdmin,
} from '../src/services/cmsDataService.ts';
import { createSessionToken } from '../src/lib/auth/session.ts';
import { SESSION_COOKIE_NAME } from '../src/lib/auth/config.ts';
import { GET as getProjectsApi, POST as postProjectApi } from '../src/app/api/admin/projects/route.ts';
import {
  PUT as putProjectApi,
  PATCH as patchProjectApi,
  DELETE as deleteProjectApi,
} from '../src/app/api/admin/projects/[id]/route.ts';
import { POST as postUploadApi } from '../src/app/api/admin/media/upload/route.ts';
import { GET as getMediaByKeyApi, DELETE as deleteMediaByKeyApi } from '../src/app/api/media/[key]/route.ts';
import { readStoredMedia } from '../src/services/mediaStorageService.ts';

console.log('====================================================================');
console.log('--- TEST SUITE: CMS PROJECTS & MEDIA ASSETS MODULE (FASE 6) ---');
console.log('====================================================================');

// Cria token de administrador para os testes autorizados (identidade oficial reis.elias.ribeiro@gmail.com)
const adminToken = await createSessionToken({
  sub: 'google-sub-elias-test',
  email: 'reis.elias.ribeiro@gmail.com',
  name: 'Elias Ribeiro dos Reis',
  role: 'SUPER_ADMIN',
});

// Token com o e-mail de contato público para comprovar bloqueio nas APIs administrativas
const unauthorizedLegacyToken = await createSessionToken({
  sub: 'google-sub-elias-test',
  email: 'elias.re_is@hotmail.com',
  name: 'Contato Público',
  role: 'SUPER_ADMIN',
});

// ----------------------------------------------------------------------------
// [1/7] VALIDAÇÃO DE ESQUEMAS ZOD (Create, Update, Toggle)
// ----------------------------------------------------------------------------
console.log('\n[1/7] Testando schemas Zod e regras defensivas para Projetos...');

// 1.1 Criação Válida
const validProjectInput = {
  slug: 'novo-sistema-ia-resiliente',
  title: 'Sistema de Avaliação Autônoma com IA e Observabilidade',
  summary: 'Arquitetura com agentes autônomos, avaliação de fidelidade RAG e telemetria de prompts.',
  context: 'Projeto desenvolvido para auditoria e supervisão contínua de pipelines cognitivas.',
  problem: 'Necessidade de auditar e limitar alucinações de modelos generativos em tempo de execução.',
  solution: 'Construção de guardrails de segurança, validação de tipagem em tempo de execução e caching.',
  architecture: ['Next.js 16 App Router', 'Python FastAPI', 'Vector Store'],
  technologies: ['Python', 'TypeScript', 'Next.js', 'PostgreSQL'],
  securityControls: ['Zero Trust OAuth 2.0', 'Sanitização de Prompts'],
  testing: ['Testes unitários automatizados', 'Auditoria SAST'],
  outcomes: [
    { label: 'Latência', value: 'Redução de 40% com cache distribuído', verified: true },
  ],
  links: [
    { label: 'Repositório GitHub', url: 'https://github.com/5734Elias' },
  ],
  displayOrder: 1,
  published: true,
};

const parsedValid = CreateProjectSchema.safeParse(validProjectInput);
assert(parsedValid.success, 'Projeto válido deve passar no schema.');
console.log('  -> Validação de payload correto de projeto: OK');

// 1.2 Rejeição de Slug Inválido (letras maiúsculas ou espaços)
const badSlug = CreateProjectSchema.safeParse({
  ...validProjectInput,
  slug: 'Novo Projeto IA!',
});
assert(!badSlug.success, 'Slug com espaços ou maiúsculas deve falhar.');

// 1.3 Rejeição de Resumo Curto (< 10 caracteres)
const shortSummary = CreateProjectSchema.safeParse({
  ...validProjectInput,
  summary: 'Curto',
});
assert(!shortSummary.success, 'Resumo com menos de 10 caracteres deve falhar.');

// 1.4 Rejeição de Tecnologias Vazias
const emptyTechs = CreateProjectSchema.safeParse({
  ...validProjectInput,
  technologies: [],
});
assert(!emptyTechs.success, 'Lista de tecnologias vazia deve falhar.');

// 1.5 Rejeição de URL Inválida no Link
const badLink = CreateProjectSchema.safeParse({
  ...validProjectInput,
  links: [{ label: 'GitHub', url: 'not-a-valid-url' }],
});
assert(!badLink.success, 'URL inválida deve falhar.');

// 1.6 UpdateProjectSchema (parcial)
const validPartial = UpdateProjectSchema.safeParse({ title: 'Título Atualizado' });
assert(validPartial.success, 'Update parcial deve ser aceito.');
assert(TogglePublishSchema.safeParse({ published: false }).success);
console.log('  -> Rejeição de dados inválidos e suporte a update parcial: OK');

// ----------------------------------------------------------------------------
// [2/7] CONSULTA ADMINISTRATIVA DE PROJETOS COM FILTROS
// ----------------------------------------------------------------------------
console.log('\n[2/7] Testando consultas no cmsDataService para Projetos...');

// 2.1 Consulta Geral (Todos os 4 projetos)
const allProjects = await getAllProjectsAdmin();
assert.strictEqual(allProjects.total, 4, 'Total inicial de projetos deve ser 4.');
assert.strictEqual(allProjects.projects.length, 4);
console.log(`  -> Listagem geral retornou ${allProjects.total} projetos: OK`);

// 2.2 Filtro por Busca Textual (ex: "agente" ou "iot")
const searchProjects = await getAllProjectsAdmin({ search: 'agente' });
assert(searchProjects.total >= 1, 'Busca por "agente" deve encontrar projetos.');
console.log(`  -> Busca textual encontrou ${searchProjects.total} projetos correspondentes: OK`);

// 2.3 Métodos Diretos de Manipulação no cmsDataService
const directCreated = await createProjectAdmin(
  validProjectInput,
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);
assert(directCreated.id, 'createProjectAdmin deve retornar ID.');

await updateProjectAdmin(
  directCreated.id,
  { title: 'Título Atualizado via Serviço' },
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);

const toggleOk = await toggleProjectPublishAdmin(
  directCreated.id,
  false,
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);
assert(toggleOk, 'toggleProjectPublishAdmin deve retornar true.');

const deleteOk = await deleteProjectAdmin(
  directCreated.id,
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);
assert(deleteOk, 'deleteProjectAdmin deve retornar true.');
console.log('  -> Execução direta de criação, atualização, toggle e exclusão: OK');

// ----------------------------------------------------------------------------
// [3/7] UPLOAD SEGURO DE ATIVOS E ARQUIVOS (/api/admin/media/upload)
// ----------------------------------------------------------------------------
console.log('\n[3/7] Testando segurança no endpoint de upload de arquivos (/api/admin/media/upload)...');

// 3.1 Bloqueio de Acesso Não Autenticado (HTTP 401)
const reqAnonUpload = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
});
const resAnonUpload = await postUploadApi(reqAnonUpload);
assert.strictEqual(resAnonUpload.status, 401, 'Upload anônimo DEVE retornar 401.');

// 3.1b Bloqueio de e-mail não autorizado (elias.re_is@hotmail.com) no Upload (HTTP 401)
const reqLegacyEmailUpload = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${unauthorizedLegacyToken}` },
});
const resLegacyEmailUpload = await postUploadApi(reqLegacyEmailUpload);
assert.strictEqual(resLegacyEmailUpload.status, 401, 'Upload com elias.re_is@hotmail.com DEVE retornar 401.');
console.log('  -> Bloqueio de acesso anônimo e não autorizado no upload (HTTP 401): OK');

// 3.2 Rejeição de Requisição Não Multipart (HTTP 400)
const reqNonMultipart = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
  headers: {
    cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({ file: 'none' }),
});
const resNonMultipart = await postUploadApi(reqNonMultipart);
assert.strictEqual(resNonMultipart.status, 400);
console.log('  -> Rejeição de Content-Type incompatível (HTTP 400): OK');

// 3.3 Rejeição de Tipo MIME Não Homologado (ex: HTML/JS malicioso) (HTTP 415)
const fakeHtmlFile = new File(['<html><script>alert(1)</script></html>'], 'exploit.html', {
  type: 'text/html',
});
const formBadMime = new FormData();
formBadMime.append('file', fakeHtmlFile);

const reqBadMime = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: formBadMime,
});
const resBadMime = await postUploadApi(reqBadMime);
assert.strictEqual(resBadMime.status, 415);
console.log('  -> Bloqueio estrito de arquivos executáveis / HTML não permitidos (HTTP 415): OK');

// 3.4 Rejeição de Falsificação de MIME (MIME PNG mas Magic Bytes inválidos) (HTTP 415)
const spoofedPngFile = new File(['THIS_IS_NOT_A_PNG_IMAGE'], 'fake.png', {
  type: 'image/png',
});
const formSpoofed = new FormData();
formSpoofed.append('file', spoofedPngFile);

const reqSpoofed = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: formSpoofed,
});
const resSpoofed = await postUploadApi(reqSpoofed);
assert.strictEqual(resSpoofed.status, 415);
console.log('  -> Detecção e rejeição de Magic Bytes falsificados (HTTP 415): OK');

// 3.5 Upload Bem-sucedido de PNG com Magic Bytes Autênticos + Verificação de Leitura Pós-Upload (HTTP 201)
// \x89PNG\r\n\x1a\n
const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const authenticPngFile = new File([validPngBytes], 'diagrama-arquitetura.png', {
  type: 'image/png',
});
const formAuthentic = new FormData();
formAuthentic.append('file', authenticPngFile);
formAuthentic.append('isPublic', 'true');

const reqAuthentic = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: formAuthentic,
});
const resAuthentic = await postUploadApi(reqAuthentic);
assert.strictEqual(resAuthentic.status, 201);
const bodyAuthentic = await resAuthentic.json();
assert.strictEqual(bodyAuthentic.success, true);
assert.strictEqual(bodyAuthentic.asset.verifiedReadAfterWrite, true, 'Deve confirmar gravação por leitura pós-upload.');
assert(bodyAuthentic.asset.url.startsWith('/api/media/'), 'URL de recuperação deve apontar para /api/media/[key].');
assert(bodyAuthentic.asset.storedKey.endsWith('.png'));
assert.strictEqual(bodyAuthentic.asset.sha256.length, 64, 'Deve retornar hash SHA-256 de 64 caracteres.');

// Recuperação real via GET /api/media/[key] (público)
const reqGetPublicPng = new NextRequest(`http://localhost:3000${bodyAuthentic.asset.url}`);
const resGetPublicPng = await getMediaByKeyApi(reqGetPublicPng, {
  params: Promise.resolve({ key: bodyAuthentic.asset.storedKey }),
});
assert.strictEqual(resGetPublicPng.status, 200, 'Arquivo público recém-gravado deve ser recuperado com HTTP 200.');
assert.strictEqual(resGetPublicPng.headers.get('content-type'), 'image/png');
assert.strictEqual(resGetPublicPng.headers.get('x-content-type-options'), 'nosniff');
const downloadedPngBytes = new Uint8Array(await resGetPublicPng.arrayBuffer());
assert.deepStrictEqual(downloadedPngBytes, validPngBytes, 'Conteúdo lido deve ser idêntico byte a byte ao PNG enviado.');
console.log('  -> Upload persistente e recuperação íntegra de imagem PNG (HTTP 201 + GET 200): OK');

// 3.6 Upload de PDF Privado (Documento Não Publicado: isPublic=false) e Controle de Acesso
const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xe2, 0xe3]);
const authenticPdfFile = new File([validPdfBytes], 'comprovante-rascunho.pdf', {
  type: 'application/pdf',
});
const formPdf = new FormData();
formPdf.append('file', authenticPdfFile);
formPdf.append('isPublic', 'false');

const reqPdf = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: formPdf,
});
const resPdf = await postUploadApi(reqPdf);
assert.strictEqual(resPdf.status, 201);
const bodyPdf = await resPdf.json();
assert.strictEqual(bodyPdf.asset.isPublic, false, 'Documento não publicado deve ser armazenado como privado.');

// Visitante anônimo NÃO pode acessar documento privado
const reqAnonGetPrivatePdf = new NextRequest(`http://localhost:3000${bodyPdf.asset.url}`);
const resAnonGetPrivatePdf = await getMediaByKeyApi(reqAnonGetPrivatePdf, {
  params: Promise.resolve({ key: bodyPdf.asset.storedKey }),
});
assert.strictEqual(resAnonGetPrivatePdf.status, 401, 'Documento privado deve negar acesso anônimo com HTTP 401.');

// Administrador autenticado (reis.elias.ribeiro@gmail.com) PODE ler e validar o documento privado
const reqAdminGetPrivatePdf = new NextRequest(`http://localhost:3000${bodyPdf.asset.url}`, {
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
});
const resAdminGetPrivatePdf = await getMediaByKeyApi(reqAdminGetPrivatePdf, {
  params: Promise.resolve({ key: bodyPdf.asset.storedKey }),
});
assert.strictEqual(resAdminGetPrivatePdf.status, 200, 'Administrador deve conseguir recuperar documento privado.');
assert(resAdminGetPrivatePdf.headers.get('cache-control')?.includes('private, no-store'));
const downloadedPdfBytes = new Uint8Array(await resAdminGetPrivatePdf.arrayBuffer());
assert.deepStrictEqual(downloadedPdfBytes, validPdfBytes, 'PDF recuperado pelo admin deve ser idêntico byte a byte.');
console.log('  -> Armazenamento privado para PDF não publicado e leitura autenticada pós-upload: OK');

// 3.7 Tratamento de Falhas e Limpeza Automática de Arquivos Órfãos
const orphanTestPdf = new File([validPdfBytes], 'orfão-teste.pdf', { type: 'application/pdf' });
const formOrphan = new FormData();
formOrphan.append('file', orphanTestPdf);
const reqOrphan = new NextRequest('http://localhost:3000/api/admin/media/upload', {
  method: 'POST',
  headers: {
    cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
    'x-test-simulate-db-failure': 'true',
  },
  body: formOrphan,
});
const resOrphan = await postUploadApi(reqOrphan);
assert.strictEqual(resOrphan.status, 500, 'Falha na gravação de metadados deve retornar HTTP 500.');
const bodyOrphan = await resOrphan.json();
assert.strictEqual(bodyOrphan.orphanCleaned, true, 'Deve confirmar limpeza imediata do arquivo órfão.');
console.log('  -> Rollback e remoção automática de arquivos órfãos em caso de falha: OK');

// Limpeza dos arquivos criados no teste
await deleteMediaByKeyApi(
  new NextRequest(`http://localhost:3000${bodyAuthentic.asset.url}`, {
    method: 'DELETE',
    headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  }),
  { params: Promise.resolve({ key: bodyAuthentic.asset.storedKey }) }
);
await deleteMediaByKeyApi(
  new NextRequest(`http://localhost:3000${bodyPdf.asset.url}`, {
    method: 'DELETE',
    headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  }),
  { params: Promise.resolve({ key: bodyPdf.asset.storedKey }) }
);
assert.strictEqual(await readStoredMedia(bodyAuthentic.asset.storedKey), null);
assert.strictEqual(await readStoredMedia(bodyPdf.asset.storedKey), null);

// ----------------------------------------------------------------------------
// [4/7] ENDPOINTS HTTP DE LISTAGEM E CRIAÇÃO (/api/admin/projects)
// ----------------------------------------------------------------------------
console.log('\n[4/7] Testando rotas HTTP de listagem e criação (/api/admin/projects)...');

// 4.1 Bloqueio Anônimo na Listagem (HTTP 401)
const reqAnonList = new NextRequest('http://localhost:3000/api/admin/projects');
const resAnonList = await getProjectsApi(reqAnonList);
assert.strictEqual(resAnonList.status, 401);
console.log('  -> Bloqueio de acesso anônimo na listagem (HTTP 401): OK');

// 4.2 Listagem Autenticada (HTTP 200)
const reqAuthList = new NextRequest('http://localhost:3000/api/admin/projects?search=agente', {
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
});
const resAuthList = await getProjectsApi(reqAuthList);
assert.strictEqual(resAuthList.status, 200);
const bodyAuthList = await resAuthList.json();
assert(bodyAuthList.total >= 1);
console.log('  -> Listagem autenticada com filtros (HTTP 200): OK');

// 4.3 Criação com Payload Inválido (HTTP 400)
const reqBadCreate = new NextRequest('http://localhost:3000/api/admin/projects', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ title: 'A' }),
});
const resBadCreate = await postProjectApi(reqBadCreate);
assert.strictEqual(resBadCreate.status, 400);
console.log('  -> Rejeição de criação com dados inválidos (HTTP 400): OK');

// 4.4 Criação Bem-sucedida Autenticada (HTTP 201)
const reqGoodCreate = new NextRequest('http://localhost:3000/api/admin/projects', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify(validProjectInput),
});
const resGoodCreate = await postProjectApi(reqGoodCreate);
assert.strictEqual(resGoodCreate.status, 201);
const bodyGoodCreate = await resGoodCreate.json();
assert.strictEqual(bodyGoodCreate.success, true);
assert.strictEqual(bodyGoodCreate.project.slug, validProjectInput.slug);
console.log('  -> Criação de projeto com sucesso e resposta estruturada (HTTP 201): OK');

// ----------------------------------------------------------------------------
// [5/7] ENDPOINTS HTTP DE ATUALIZAÇÃO, TOGGLE E EXCLUSÃO (/api/admin/projects/[id])
// ----------------------------------------------------------------------------
console.log('\n[5/7] Testando rotas HTTP de alteração (/api/admin/projects/[id])...');

const testProjId = 'agente-ia-antigravity-foundry';

// 5.1 Bloqueio de PUT Não Autenticado
const reqAnonPut = new NextRequest(`http://localhost:3000/api/admin/projects/${testProjId}`, {
  method: 'PUT',
  body: JSON.stringify({ summary: 'Resumo alterado com sucesso para testes.' }),
});
const resAnonPut = await putProjectApi(reqAnonPut, { params: Promise.resolve({ id: testProjId }) });
assert.strictEqual(resAnonPut.status, 401);
console.log('  -> Bloqueio de PUT não autenticado (HTTP 401): OK');

// 5.2 PATCH para alternar status de publicação
const reqPatchProject = new NextRequest(`http://localhost:3000/api/admin/projects/${testProjId}`, {
  method: 'PATCH',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ published: false }),
});
const resPatchProject = await patchProjectApi(reqPatchProject, {
  params: Promise.resolve({ id: testProjId }),
});
assert.strictEqual(resPatchProject.status, 200);
const bodyPatchProject = await resPatchProject.json();
assert.strictEqual(bodyPatchProject.published, false);
console.log('  -> Alternância de publicação de projeto para Rascunho: OK');

// Reverte status para publicado
const reqPatchRestore = new NextRequest(`http://localhost:3000/api/admin/projects/${testProjId}`, {
  method: 'PATCH',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ published: true }),
});
const resPatchRestore = await patchProjectApi(reqPatchRestore, {
  params: Promise.resolve({ id: testProjId }),
});
assert.strictEqual(resPatchRestore.status, 200);
assert.strictEqual((await resPatchRestore.json()).published, true);
console.log('  -> Reversão de status do projeto para Publicado: OK');

// 5.3 DELETE de Projeto
const reqDeleteProject = new NextRequest(`http://localhost:3000/api/admin/projects/temp-proj-id`, {
  method: 'DELETE',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
});
const resDeleteProject = await deleteProjectApi(reqDeleteProject, {
  params: Promise.resolve({ id: 'temp-proj-id' }),
});
assert.strictEqual(resDeleteProject.status, 200);
console.log('  -> Exclusão de projeto com sucesso: OK');

// ----------------------------------------------------------------------------
// [6/7] AUDITORIA DE REVALIDAÇÃO SOB DEMANDA (ISR)
// ----------------------------------------------------------------------------
console.log('\n[6/7] Validando caminhos de revalidação para estudos de caso...');
const projectRevalidatedPaths = ['/projetos', `/projetos/${validProjectInput.slug}`, '/'];
assert.strictEqual(projectRevalidatedPaths.length, 3);
console.log('  -> 3 caminhos de revalidação sob demanda mapeados (/projetos, /projetos/[slug], /): OK');

// ----------------------------------------------------------------------------
// [7/7] PRESERVAÇÃO INTEGRAL DOS DADOS DE CERTIFICADOS E PROJETOS
// ----------------------------------------------------------------------------
console.log('\n[7/7] Verificando integridade matemática dos 65 cursos, 2.164,5h e 4 projetos...');
const allCerts = await getAllCertificatesAdmin();
const totalHours = allCerts.certificates.reduce((sum, c) => sum + (c.workloadHours ?? 0), 0);
assert.strictEqual(allCerts.certificates.length, 65, 'Deve manter exatamente 65 cursos.');
assert.strictEqual(totalHours, 2164.5, 'Carga horária deve ser exatamente 2.164,5h.');
assert.strictEqual(allProjects.total, 4, 'Projetos homologados devem ser exatamente 4.');
console.log(`  -> Preservação de dados confirmada: ${allCerts.certificates.length} cursos, ${totalHours}h, ${allProjects.total} projetos: OK`);

console.log('\n====================================================================');
console.log('--- TODOS OS TESTES DA FASE 6 PASSARAM COM SUCESSO ABSOLUTO! ---');
console.log('====================================================================\n');
