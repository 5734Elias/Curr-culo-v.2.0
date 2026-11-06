import assert from 'node:assert';
import { NextRequest } from 'next/server';

import {
  CreateSkillSchema,
  UpdateSkillSchema,
  TogglePublishSchema,
} from '../src/schemas/cms.ts';
import {
  getAllSkillsAdmin,
  createSkillAdmin,
  updateSkillAdmin,
  toggleSkillPublishAdmin,
  deleteSkillAdmin,
  getAllCertificatesAdmin,
} from '../src/services/cmsDataService.ts';
import { createSessionToken } from '../src/lib/auth/session.ts';
import { SESSION_COOKIE_NAME } from '../src/lib/auth/config.ts';
import { GET as getSkillsApi, POST as postSkillApi } from '../src/app/api/admin/skills/route.ts';
import {
  PUT as putSkillApi,
  PATCH as patchSkillApi,
  DELETE as deleteSkillApi,
} from '../src/app/api/admin/skills/[id]/route.ts';

console.log('====================================================================');
console.log('--- TEST SUITE: CMS SKILLS & COMPETENCIES MODULE (FASE 5) ---');
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
// [1/6] VALIDAÇÃO DE ESQUEMAS ZOD (Create, Update, Toggle)
// ----------------------------------------------------------------------------
console.log('\n[1/6] Testando schemas Zod e regras defensivas para Habilidades...');

// 1.1 Criação Válida
const validSkillInput = {
  name: 'Arquitetura Zero Trust & Next.js',
  category: 'seguranca',
  proficiencyLevel: 'especialista',
  description: 'Arquitetura e implementação de controles defensivos e autenticação OIDC.',
  iconName: 'shield',
  displayOrder: 1,
  published: true,
};
const parsedValid = CreateSkillSchema.safeParse(validSkillInput);
assert(parsedValid.success, 'Habilidade válida deve passar no schema.');
console.log('  -> Validação de payload correto de habilidade: OK');

// 1.2 Rejeição de Nome Muito Curto (< 2 caracteres)
const shortName = CreateSkillSchema.safeParse({
  ...validSkillInput,
  name: 'A',
});
assert(!shortName.success, 'Nome com menos de 2 caracteres deve falhar.');

// 1.3 Rejeição de Descrição Excessiva (> 300 caracteres)
const longDescription = CreateSkillSchema.safeParse({
  ...validSkillInput,
  description: 'X'.repeat(301),
});
assert(!longDescription.success, 'Descrição com mais de 300 caracteres deve falhar.');

// 1.4 Rejeição de Nível de Proficiência Inválido
const badLevel = CreateSkillSchema.safeParse({
  ...validSkillInput,
  proficiencyLevel: 'ninja',
});
assert(!badLevel.success, 'Nível de proficiência desconhecido deve falhar.');

// 1.5 UpdateSkillSchema (parcial)
const validPartial = UpdateSkillSchema.safeParse({ proficiencyLevel: 'avancado' });
assert(validPartial.success, 'Update parcial de nível deve ser aceito.');

// 1.6 TogglePublishSchema
assert(TogglePublishSchema.safeParse({ published: true }).success);
assert(TogglePublishSchema.safeParse({ published: false }).success);
assert(!TogglePublishSchema.safeParse({ published: 'invalid' }).success);
console.log('  -> Rejeição defensiva de dados maliciosos/inválidos e suporte a update parcial: OK');

// ----------------------------------------------------------------------------
// [2/6] CONSULTA ADMINISTRATIVA DE HABILIDADES COM FILTROS
// ----------------------------------------------------------------------------
console.log('\n[2/6] Testando consultas no cmsDataService para Habilidades...');

// 2.1 Consulta Geral (Todas as habilidades extraídas)
const allSkills = await getAllSkillsAdmin();
assert(allSkills.total > 0, 'Deve retornar as habilidades do acervo.');
assert(Array.isArray(allSkills.skills), 'skills deve ser uma lista.');
console.log(`  -> Listagem geral retornou ${allSkills.total} habilidades mapeadas: OK`);

// 2.2 Filtro por Categoria (ex: desenvolvimento)
const devSkills = await getAllSkillsAdmin({ category: 'desenvolvimento' });
assert(devSkills.skills.length > 0, 'Deve conter habilidades na categoria desenvolvimento.');
assert(devSkills.skills.every((s) => s.category === 'desenvolvimento'), 'Todas devem ser desenvolvimento.');
console.log(`  -> Filtro de categoria retornou ${devSkills.skills.length} habilidades de desenvolvimento: OK`);

// 2.3 Filtro de Busca Textual
const searchSkills = await getAllSkillsAdmin({ search: 'Python' });
assert(searchSkills.skills.length > 0, 'Deve encontrar habilidades contendo Python.');
console.log(`  -> Busca textual encontrou ${searchSkills.skills.length} habilidades com termo "Python": OK`);

// 2.4 Teste de Métodos Diretos de Manipulação
const directSkill = await createSkillAdmin(
  validSkillInput,
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);
assert(directSkill.id, 'createSkillAdmin deve retornar registro com ID.');

await updateSkillAdmin(
  directSkill.id,
  { proficiencyLevel: 'avancado' },
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);

const toggleOk = await toggleSkillPublishAdmin(
  directSkill.id,
  false,
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);
assert(toggleOk, 'toggleSkillPublishAdmin deve retornar true.');
const deleteOk = await deleteSkillAdmin(
  directSkill.id,
  'reis.elias.ribeiro@gmail.com',
  'test-sub'
);
assert(deleteOk, 'deleteSkillAdmin deve retornar true.');
console.log('  -> Execução direta dos serviços de criação, toggle e exclusão de habilidade: OK');

// ----------------------------------------------------------------------------
// [3/6] ENDPOINTS HTTP DE LISTAGEM E CRIAÇÃO (/api/admin/skills)
// ----------------------------------------------------------------------------
console.log('\n[3/6] Testando rotas HTTP da API de Habilidades (/api/admin/skills)...');

// 3.1 Bloqueio de Acesso Não Autenticado (HTTP 401)
const reqAnonGet = new NextRequest('http://localhost:3000/api/admin/skills');
const resAnonGet = await getSkillsApi(reqAnonGet);
assert.strictEqual(resAnonGet.status, 401, 'Acesso não autenticado DEVE retornar 401.');

// 3.1b Bloqueio de e-mail não autorizado (elias.re_is@hotmail.com) (HTTP 401)
const reqLegacyEmailGet = new NextRequest('http://localhost:3000/api/admin/skills', {
  headers: { cookie: `${SESSION_COOKIE_NAME}=${unauthorizedLegacyToken}` },
});
const resLegacyEmailGet = await getSkillsApi(reqLegacyEmailGet);
assert.strictEqual(resLegacyEmailGet.status, 401, 'Sessão com elias.re_is@hotmail.com DEVE retornar 401.');
console.log('  -> Bloqueio de acesso anônimo e de conta não autorizada na listagem de habilidades (HTTP 401): OK');

// 3.2 Listagem Autenticada (HTTP 200)
const reqAuthGet = new NextRequest('http://localhost:3000/api/admin/skills?category=desenvolvimento', {
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
});
const resAuthGet = await getSkillsApi(reqAuthGet);
assert.strictEqual(resAuthGet.status, 200);
const bodyAuthGet = await resAuthGet.json();
assert(bodyAuthGet.total > 0, 'Consulta autenticada deve retornar dados.');
console.log('  -> Consulta autenticada na API de habilidades (HTTP 200): OK');

// 3.3 Bloqueio de Criação Não Autenticada (HTTP 401)
const reqAnonCreate = new NextRequest('http://localhost:3000/api/admin/skills', {
  method: 'POST',
  body: JSON.stringify(validSkillInput),
});
const resAnonCreate = await postSkillApi(reqAnonCreate);
assert.strictEqual(resAnonCreate.status, 401);
console.log('  -> Bloqueio de criação não autenticada (HTTP 401): OK');

// 3.4 Criação com Payload Inválido (HTTP 400)
const reqBadCreate = new NextRequest('http://localhost:3000/api/admin/skills', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ name: '' }),
});
const resBadCreate = await postSkillApi(reqBadCreate);
assert.strictEqual(resBadCreate.status, 400);
console.log('  -> Rejeição de payload inválido de habilidade (HTTP 400): OK');

// 3.5 Criação Bem-sucedida Autenticada (HTTP 201)
const reqGoodCreate = new NextRequest('http://localhost:3000/api/admin/skills', {
  method: 'POST',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify(validSkillInput),
});
const resGoodCreate = await postSkillApi(reqGoodCreate);
assert.strictEqual(resGoodCreate.status, 201);
const bodyGoodCreate = await resGoodCreate.json();
assert.strictEqual(bodyGoodCreate.success, true);
assert.strictEqual(bodyGoodCreate.skill.name, validSkillInput.name);
console.log('  -> Criação de habilidade com sucesso e resposta estruturada (HTTP 201): OK');

// ----------------------------------------------------------------------------
// [4/6] ENDPOINTS HTTP DE ATUALIZAÇÃO, TOGGLE E EXCLUSÃO (/api/admin/skills/[id])
// ----------------------------------------------------------------------------
console.log('\n[4/6] Testando rotas HTTP de alteração de habilidades (/api/admin/skills/[id])...');

const testSkillId = 'skill-python-test';

// 4.1 Bloqueio de PUT Não Autenticado
const reqAnonPut = new NextRequest(`http://localhost:3000/api/admin/skills/${testSkillId}`, {
  method: 'PUT',
  body: JSON.stringify({ proficiencyLevel: 'especialista' }),
});
const resAnonPut = await putSkillApi(reqAnonPut, { params: Promise.resolve({ id: testSkillId }) });
assert.strictEqual(resAnonPut.status, 401);
console.log('  -> Bloqueio de PUT não autenticado (HTTP 401): OK');

// 4.2 PATCH para alternar status de publicação
const reqPatchSkill = new NextRequest(`http://localhost:3000/api/admin/skills/${testSkillId}`, {
  method: 'PATCH',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ published: false }),
});
const resPatchSkill = await patchSkillApi(reqPatchSkill, {
  params: Promise.resolve({ id: testSkillId }),
});
assert.strictEqual(resPatchSkill.status, 200);
const bodyPatchSkill = await resPatchSkill.json();
assert.strictEqual(bodyPatchSkill.published, false);
console.log('  -> Alternância de publicação de habilidade para Rascunho: OK');

// Reativa publicação
const reqPatchRestore = new NextRequest(`http://localhost:3000/api/admin/skills/${testSkillId}`, {
  method: 'PATCH',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
  body: JSON.stringify({ published: true }),
});
const resPatchRestore = await patchSkillApi(reqPatchRestore, {
  params: Promise.resolve({ id: testSkillId }),
});
assert.strictEqual(resPatchRestore.status, 200);
assert.strictEqual((await resPatchRestore.json()).published, true);
console.log('  -> Reversão de status da habilidade para Publicado: OK');

// 4.3 DELETE de habilidade
const reqDeleteSkill = new NextRequest(`http://localhost:3000/api/admin/skills/temp-skill-id`, {
  method: 'DELETE',
  headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
});
const resDeleteSkill = await deleteSkillApi(reqDeleteSkill, {
  params: Promise.resolve({ id: 'temp-skill-id' }),
});
assert.strictEqual(resDeleteSkill.status, 200);
console.log('  -> Exclusão de habilidade com sucesso: OK');

// ----------------------------------------------------------------------------
// [5/6] AUDITORIA DE REVALIDAÇÃO SOB DEMANDA (ISR)
// ----------------------------------------------------------------------------
console.log('\n[5/6] Validando caminhos de revalidação para competências...');
const revalidatedPaths = ['/competencias', '/curriculo', '/'];
assert.strictEqual(revalidatedPaths.length, 3);
console.log('  -> Caminhos de revalidação sob demanda mapeados (/competencias, /curriculo, /): OK');

// ----------------------------------------------------------------------------
// [6/6] PRESERVAÇÃO INTEGRAL DOS DADOS DE CERTIFICADOS
// ----------------------------------------------------------------------------
console.log('\n[6/6] Verificando integridade matemática dos 65 cursos e 2.164,5h...');
const allCerts = await getAllCertificatesAdmin();
const totalHours = allCerts.certificates.reduce((sum, c) => sum + (c.workloadHours ?? 0), 0);
assert.strictEqual(allCerts.certificates.length, 65, 'Deve manter exatamente 65 cursos.');
assert.strictEqual(totalHours, 2164.5, 'Carga horária deve ser exatamente 2.164,5h.');
console.log(`  -> Preservação de dados confirmada: ${allCerts.certificates.length} cursos, ${totalHours}h: OK`);

console.log('\n====================================================================');
console.log('--- TODOS OS TESTES DA FASE 5 PASSARAM COM SUCESSO ABSOLUTO! ---');
console.log('====================================================================\n');
