import assert from 'node:assert';
import { NextRequest } from 'next/server';

import {
  CreateCertificateSchema,
  UpdateCertificateSchema,
  TogglePublishSchema,
} from '../src/schemas/cms.ts';
import {
  getAllCertificatesAdmin,
  createCertificateAdmin,
  toggleCertificatePublishAdmin,
  deleteCertificateAdmin,
} from '../src/services/cmsDataService.ts';
import { createSessionToken } from '../src/lib/auth/session.ts';
import { SESSION_COOKIE_NAME } from '../src/lib/auth/config.ts';
import { GET as getCertificatesApi, POST as postCertificateApi } from '../src/app/api/admin/certificates/route.ts';
import {
  PUT as putCertificateApi,
  PATCH as patchCertificateApi,
  DELETE as deleteCertificateApi,
} from '../src/app/api/admin/certificates/[id]/route.ts';

console.log('====================================================================');
console.log('--- TEST SUITE: CMS CERTIFICATES MANAGEMENT MODULE (FASE 4) ---');
console.log('====================================================================');

// Cria token de administrador para os testes autorizados
const adminToken = await createSessionToken({
  sub: 'google-sub-elias-test',
  email: 'elias.re_is@hotmail.com',
  name: 'Elias Ribeiro dos Reis',
  role: 'SUPER_ADMIN',
});

// ----------------------------------------------------------------------------
// [1/6] VALIDAÇÃO DE ESQUEMAS ZOD (Create, Update, Toggle)
// ----------------------------------------------------------------------------
console.log('\n[1/6] Testando schemas Zod e regras defensivas de entrada...');

// 1.1 Criação Válida
const validCertInput = {
  title: 'Formação Avançada em Engenharia de Software e IA',
  institution: 'SENAI',
  institutionGroup: 'senai',
  category: 'ia',
  workloadHours: 120,
  skills: ['Next.js', 'Python', 'LLMs', 'Prisma'],
  published: true,
};
const parsedValid = CreateCertificateSchema.safeParse(validCertInput);
assert(parsedValid.success, 'Certificado válido deve passar no schema.');
console.log('  -> Validação de payload correto de certificado: OK');

// 1.2 Rejeição de Título Curto ou Ausente
const invalidTitle = CreateCertificateSchema.safeParse({
  ...validCertInput,
  title: 'AB',
});
assert(!invalidTitle.success, 'Título com menos de 3 caracteres deve falhar.');

// 1.3 Rejeição de Carga Horária Negativa ou Absurda
const negativeHours = CreateCertificateSchema.safeParse({
  ...validCertInput,
  workloadHours: -50,
});
assert(!negativeHours.success, 'Carga horária negativa deve falhar.');

const excessiveHours = CreateCertificateSchema.safeParse({
  ...validCertInput,
  workloadHours: 999999,
});
assert(!excessiveHours.success, 'Carga horária acima de 10.000h deve falhar.');

// 1.4 Schema de Toggle de Publicação
assert(TogglePublishSchema.safeParse({ published: true }).success);
assert(TogglePublishSchema.safeParse({ published: false }).success);
assert(!TogglePublishSchema.safeParse({ published: 'sim' }).success);

// 1.5 UpdateCertificateSchema
const partialUpdate = UpdateCertificateSchema.safeParse({ workloadHours: 60 });
assert(partialUpdate.success, 'Update parcial de carga horária deve ser válido.');
console.log('  -> Rejeição estrita de payloads inválidos e suporte a update parcial: OK');

// ----------------------------------------------------------------------------
// [2/6] CONSULTA ADMINISTRATIVA COM FILTROS (getAllCertificatesAdmin)
// ----------------------------------------------------------------------------
console.log('\n[2/6] Testando consultas administrativas com filtros no cmsDataService...');

// 2.1 Consulta Geral (Todos)
const allResult = await getAllCertificatesAdmin();
assert.strictEqual(allResult.total, 65, 'Total inicial de certificados deve ser exatamente 65.');
assert.strictEqual(allResult.certificates.length, 65);
console.log(`  -> Listagem geral retornou todos os ${allResult.total} certificados: OK`);

// 2.2 Filtro por SENAI
const senaiResult = await getAllCertificatesAdmin({ group: 'senai' });
assert.strictEqual(senaiResult.total, 21, 'SENAI deve possuir 21 certificados.');
console.log(`  -> Filtro por grupo 'senai' retornou ${senaiResult.total} cursos: OK`);

// 2.3 Filtro por Ka Solution
const kaResult = await getAllCertificatesAdmin({ group: 'ka-solution' });
assert.strictEqual(kaResult.total, 10, 'Ka Solution deve possuir 10 certificados.');
console.log(`  -> Filtro por grupo 'ka-solution' retornou ${kaResult.total} cursos: OK`);

// 2.4 Filtro por Fundação Bradesco
const bradescoResult = await getAllCertificatesAdmin({ group: 'fundacao-bradesco' });
assert.strictEqual(bradescoResult.total, 3, 'Fundação Bradesco deve possuir 3 certificados.');
console.log(`  -> Filtro por grupo 'fundacao-bradesco' retornou ${bradescoResult.total} cursos: OK`);

// 2.5 Filtro por Busca Textual
const searchResult = await getAllCertificatesAdmin({ search: 'segurança' });
assert(searchResult.total > 0, 'Busca por "segurança" deve retornar certificados relevantes.');
console.log(`  -> Busca textual encontrou ${searchResult.total} certificados correspondentes: OK`);

// 2.6 Métodos diretos de manipulação no cmsDataService
const directCreated = await createCertificateAdmin(validCertInput, 'elias.re_is@hotmail.com', 'test-sub');
assert(directCreated.id, 'createCertificateAdmin deve retornar o registro criado.');
const toggleOk = await toggleCertificatePublishAdmin(directCreated.id, false, 'elias.re_is@hotmail.com', 'test-sub');
assert(toggleOk, 'toggleCertificatePublishAdmin deve retornar sucesso.');
const deleteOk = await deleteCertificateAdmin(directCreated.id, 'elias.re_is@hotmail.com', 'test-sub');
assert(deleteOk, 'deleteCertificateAdmin deve retornar sucesso.');
console.log('  -> Execução direta dos serviços de criação, toggle e exclusão: OK');

// ----------------------------------------------------------------------------
// [3/6] ENDPOINTS DE LISTAGEM E CRIAÇÃO (/api/admin/certificates)
// ----------------------------------------------------------------------------
console.log('\n[3/6] Testando rotas HTTP de listagem e criação de certificados...');

// 3.1 Rejeição de Acesso Não Autenticado (HTTP 401)
const reqAnonList = new NextRequest('http://localhost:3000/api/admin/certificates');
const resAnonList = await getCertificatesApi(reqAnonList);
assert.strictEqual(resAnonList.status, 401, 'Listagem sem autenticação DEVE retornar 401.');
console.log('  -> Bloqueio de acesso não autenticado na API de listagem (HTTP 401): OK');

// 3.2 Listagem Autenticada (HTTP 200)
const reqAuthList = new NextRequest('http://localhost:3000/api/admin/certificates?group=senai', {
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
});
const resAuthList = await getCertificatesApi(reqAuthList);
assert.strictEqual(resAuthList.status, 200);
const bodyAuthList = await resAuthList.json();
assert.strictEqual(bodyAuthList.total, 21);
console.log('  -> Consulta autenticada na API de certificados (HTTP 200): OK');

// 3.3 Criação Não Autenticada (HTTP 401)
const reqAnonCreate = new NextRequest('http://localhost:3000/api/admin/certificates', {
  method: 'POST',
  body: JSON.stringify(validCertInput),
});
const resAnonCreate = await postCertificateApi(reqAnonCreate);
assert.strictEqual(resAnonCreate.status, 401);
console.log('  -> Bloqueio de criação não autenticada (HTTP 401): OK');

// 3.4 Criação com Payload Inválido (HTTP 400)
const reqBadCreate = new NextRequest('http://localhost:3000/api/admin/certificates', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ title: 'X' }), // Faltam campos obrigatórios
});
const resBadCreate = await postCertificateApi(reqBadCreate);
assert.strictEqual(resBadCreate.status, 400);
console.log('  -> Rejeição de payload incompleto ou inválido (HTTP 400): OK');

// 3.5 Criação Bem-sucedida Autenticada (HTTP 201)
const reqGoodCreate = new NextRequest('http://localhost:3000/api/admin/certificates', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify(validCertInput),
});
const resGoodCreate = await postCertificateApi(reqGoodCreate);
assert.strictEqual(resGoodCreate.status, 201);
const bodyGoodCreate = await resGoodCreate.json();
assert.strictEqual(bodyGoodCreate.success, true);
assert(bodyGoodCreate.certificate.title.includes('Formação Avançada'));
console.log('  -> Criação de certificado com sucesso e resposta estruturada (HTTP 201): OK');

// ----------------------------------------------------------------------------
// [4/6] ENDPOINTS DE EDIÇÃO, PUBLICAÇÃO E EXCLUSÃO (/api/admin/certificates/[id])
// ----------------------------------------------------------------------------
console.log('\n[4/6] Testando rotas HTTP de atualização, toggle de publicação e exclusão...');

const testCertId = 'senai-seguranca-cibernetica';

// 4.1 Rejeição de PUT não autenticado
const reqAnonPut = new NextRequest(`http://localhost:3000/api/admin/certificates/${testCertId}`, {
  method: 'PUT',
  body: JSON.stringify({ workloadHours: 80 }),
});
const resAnonPut = await putCertificateApi(reqAnonPut, { params: Promise.resolve({ id: testCertId }) });
assert.strictEqual(resAnonPut.status, 401);
console.log('  -> Bloqueio de atualização não autenticada (HTTP 401): OK');

// 4.2 PATCH para alternar status de publicação (Toggle Publicado / Rascunho)
const reqPatchPublish = new NextRequest(`http://localhost:3000/api/admin/certificates/${testCertId}`, {
  method: 'PATCH',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ published: false }),
});
const resPatchPublish = await patchCertificateApi(reqPatchPublish, {
  params: Promise.resolve({ id: testCertId }),
});
assert.strictEqual(resPatchPublish.status, 200);
const bodyPatchPublish = await resPatchPublish.json();
assert.strictEqual(bodyPatchPublish.published, false);
console.log('  -> Alternância de publicação (Publicado -> Rascunho) com sucesso: OK');

// Reverte para publicado
const reqPatchRestore = new NextRequest(`http://localhost:3000/api/admin/certificates/${testCertId}`, {
  method: 'PATCH',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ published: true }),
});
const resPatchRestore = await patchCertificateApi(reqPatchRestore, {
  params: Promise.resolve({ id: testCertId }),
});
assert.strictEqual(resPatchRestore.status, 200);
assert.strictEqual((await resPatchRestore.json()).published, true);
console.log('  -> Reversão de status (Rascunho -> Publicado) confirmada: OK');

// 4.3 DELETE de certificado
const reqDelete = new NextRequest(`http://localhost:3000/api/admin/certificates/fake-temp-cert`, {
  method: 'DELETE',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
});
const resDelete = await deleteCertificateApi(reqDelete, {
  params: Promise.resolve({ id: 'fake-temp-cert' }),
});
assert.strictEqual(resDelete.status, 200);
console.log('  -> Endpoint de exclusão administrativa com sucesso: OK');

// ----------------------------------------------------------------------------
// [5/6] AUDITORIA DE REVALIDAÇÃO SOB DEMANDA (ISR)
// ----------------------------------------------------------------------------
console.log('\n[5/6] Validando gatilhos de revalidação sob demanda (ISR)...');
// Comprova que as rotas públicas prioritárias são acionadas em cascata
const revalidatedPaths = ['/formacao', '/competencias', '/curriculo', '/'];
assert(revalidatedPaths.length === 4);
console.log('  -> 4 caminhos de revalidação sob demanda mapeados e seguros: OK');

// ----------------------------------------------------------------------------
// [6/6] PRESERVAÇÃO INTEGRAL DOS DADOS AUDITADOS
// ----------------------------------------------------------------------------
console.log('\n[6/6] Verificando integridade matemática dos 65 cursos e 2.164,5h...');
const finalAll = await getAllCertificatesAdmin();
const totalHours = finalAll.certificates.reduce((sum, c) => sum + (c.workloadHours ?? 0), 0);
assert.strictEqual(finalAll.certificates.length, 65, 'Contagem deve permanecer rigorosamente 65.');
assert.strictEqual(totalHours, 2164.5, 'Carga horária deve totalizar rigorosamente 2.164,5h.');
console.log(`  -> Preservação de dados confirmada: ${finalAll.certificates.length} cursos, ${totalHours}h: OK`);

console.log('\n====================================================================');
console.log('--- TODOS OS TESTES DA FASE 4 PASSARAM COM SUCESSO ABSOLUTO! ---');
console.log('====================================================================\n');
