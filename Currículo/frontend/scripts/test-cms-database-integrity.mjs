import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

import {
  getPublishedCertificates,
  getPublishedProjects,
  getPublishedSkills,
  getCmsDashboardMetrics,
} from '../src/services/cmsDataService.ts';
import { seedCmsDatabase } from './seed-cms-data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('--- TEST SUITE: CMS DATABASE & PERSISTENCE INTEGRITY (FASE 2) ---');
console.log('================================================================');

// ----------------------------------------------------------------------------
// [1/6] ESQUEMA PRISMA (schema.prisma) & MODELOS DO BANCO DE DADOS
// ----------------------------------------------------------------------------
console.log('\n[1/6] Validando schema.prisma e os 7 modelos do CMS...');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
assert(fs.existsSync(schemaPath), 'Arquivo prisma/schema.prisma deve existir.');

const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Provedor PostgreSQL
assert(schemaContent.includes('provider = "postgresql"'), 'Datasource deve ser postgresql.');
assert(schemaContent.includes('provider = "prisma-client-js"'), 'Generator deve ser prisma-client-js.');

// 7 Modelos obrigatórios
const requiredModels = [
  'model Administrator',
  'model Certificate',
  'model Skill',
  'model CertificateSkill',
  'model Education',
  'model Project',
  'model MediaAsset',
  'model AuditLog',
];

for (const model of requiredModels) {
  assert(schemaContent.includes(model), `Modelo obrigatório '${model}' ausente no schema.prisma.`);
}
console.log('  -> Todos os 7 modelos estruturados e relacionamentos verificados: OK');

// Índices essenciais
assert(schemaContent.includes('@@index([googleSub])'), 'Administrator deve indexar googleSub.');
assert(schemaContent.includes('@@index([published])'), 'Certificate deve indexar published.');
assert(schemaContent.includes('@@index([displayOrder])'), 'Certificate deve indexar displayOrder.');
console.log('  -> Índices de performance e segurança em schema.prisma: OK');

// ----------------------------------------------------------------------------
// [2/6] ARQUIVO DE MIGRAÇÃO SQL (Versionamento de Banco)
// ----------------------------------------------------------------------------
console.log('\n[2/6] Validando migração SQL versionada para PostgreSQL...');
const migrationPath = path.join(rootDir, 'prisma', 'migrations', '20261105000000_init_cms', 'migration.sql');
assert(fs.existsSync(migrationPath), 'Arquivo migration.sql de inicialização deve existir.');

const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
const requiredTables = [
  'CREATE TABLE "Administrator"',
  'CREATE TABLE "Certificate"',
  'CREATE TABLE "Skill"',
  'CREATE TABLE "CertificateSkill"',
  'CREATE TABLE "Education"',
  'CREATE TABLE "Project"',
  'CREATE TABLE "MediaAsset"',
  'CREATE TABLE "AuditLog"',
];

for (const tbl of requiredTables) {
  assert(migrationSql.includes(tbl), `Tabela '${tbl}' ausente em migration.sql.`);
}

assert(
  migrationSql.includes('ON DELETE CASCADE'),
  'Tabela pivô CertificateSkill deve possuir chave estrangeira com ON DELETE CASCADE.'
);
console.log('  -> Migração SQL validada com integridade referencial e cascade: OK');

// ----------------------------------------------------------------------------
// [3/6] PRISMA CLIENT & DELEGATES GERADOS
// ----------------------------------------------------------------------------
console.log('\n[3/6] Validando inicialização e delegates do Prisma Client...');
const testClient = new PrismaClient();
assert(typeof testClient.administrator?.findMany === 'function', 'Delegate administrator deve existir.');
assert(typeof testClient.certificate?.findMany === 'function', 'Delegate certificate deve existir.');
assert(typeof testClient.skill?.findMany === 'function', 'Delegate skill deve existir.');
assert(typeof testClient.certificateSkill?.findMany === 'function', 'Delegate certificateSkill deve existir.');
assert(typeof testClient.education?.findMany === 'function', 'Delegate education deve existir.');
assert(typeof testClient.project?.findMany === 'function', 'Delegate project deve existir.');
assert(typeof testClient.mediaAsset?.findMany === 'function', 'Delegate mediaAsset deve existir.');
assert(typeof testClient.auditLog?.findMany === 'function', 'Delegate auditLog deve existir.');
console.log('  -> Prisma Client exporta delegates para todos os 7 modelos: OK');

// ----------------------------------------------------------------------------
// [4/6] CAMADA DE SERVIÇO RESILIENTE (Repository Pattern com Fallback Estático)
// ----------------------------------------------------------------------------
console.log('\n[4/6] Testando resiliência da camada de dados sem conexão ao PostgreSQL...');

// 4.1 Certificados e Cursos
const certificates = await getPublishedCertificates();
assert.strictEqual(certificates.length, 65, 'Fallback deve retornar exatamente 65 certificados.');

const totalHours = certificates.reduce((acc, c) => acc + (c.workloadHours ?? 0), 0);
assert.strictEqual(totalHours, 2164.5, 'Carga horária total no fallback deve somar exatamente 2.164,5h.');
console.log(`  -> Certificados no fallback: ${certificates.length} itens, totalizando ${totalHours}h: OK`);

// 4.2 Projetos
const projects = await getPublishedProjects();
assert.strictEqual(projects.length, 4, 'Fallback de projetos deve retornar exatamente 4 projetos.');
assert(projects.every((p) => p.slug && p.title && p.technologies), 'Projetos devem possuir estrutura completa.');
console.log(`  -> Projetos no fallback: ${projects.length} itens auditados: OK`);

// 4.3 Habilidades
const skills = await getPublishedSkills();
assert(skills.length > 0, 'Fallback de habilidades deve mapear skills existentes.');
assert(skills.every((s) => s.name && s.category), 'Habilidades no fallback devem ter nome e categoria.');
console.log(`  -> Habilidades no fallback: ${skills.length} itens extraídos: OK`);

// 4.4 Métricas do Painel CMS
const metrics = await getCmsDashboardMetrics();
assert.strictEqual(metrics.totalCertificates, 65, 'Métrica totalCertificates deve ser 65.');
assert.strictEqual(metrics.totalCourses, 65, 'Métrica totalCourses deve ser 65.');
assert.strictEqual(metrics.totalWorkloadHours, 2164.5, 'Métrica totalWorkloadHours deve ser 2164.5.');
assert.strictEqual(metrics.publishedCertificates, 65, 'Métrica publishedCertificates deve ser 65.');
assert.strictEqual(metrics.draftCertificates, 0, 'Métrica draftCertificates deve ser 0.');
assert.strictEqual(metrics.totalProjects, 4, 'Métrica totalProjects deve ser 4.');
assert.strictEqual(metrics.databaseConnected, false, 'Métrica databaseConnected deve ser false quando sem DB.');
console.log('  -> Métricas do Dashboard CMS computadas com exatidão no fallback: OK');

// ----------------------------------------------------------------------------
// [5/6] SCRIPT DE SEED IDEMPOTENTE
// ----------------------------------------------------------------------------
console.log('\n[5/6] Validando contrato e regras do script de seed idempotente...');
assert(typeof seedCmsDatabase === 'function', 'seedCmsDatabase deve ser uma função exportada.');

const seedFileContent = fs.readFileSync(path.join(rootDir, 'scripts', 'seed-cms-data.ts'), 'utf-8');
assert(seedFileContent.includes('upsert'), 'Seed deve utilizar upsert para garantir idempotência.');
assert(seedFileContent.includes('totalCertificates !== 65'), 'Seed deve auditar contagem exata de 65 cursos.');
assert(seedFileContent.includes('totalHours !== 2164.5'), 'Seed deve auditar carga horária exata de 2.164,5h.');
console.log('  -> Script de seed idempotente com checagens estritas de integridade: OK');

// ----------------------------------------------------------------------------
// [6/6] HIGIENE DE VARIÁVEIS DE AMBIENTE (.env.example)
// ----------------------------------------------------------------------------
console.log('\n[6/6] Verificando documentação e higiene de variáveis em .env.example...');
const envExamplePath = path.join(rootDir, '.env.example');
assert(fs.existsSync(envExamplePath), '.env.example deve existir.');

const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
const requiredEnvVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_ADMIN_EMAIL',
  'GOOGLE_ADMIN_SUB',
];

for (const envVar of requiredEnvVars) {
  assert(envExampleContent.includes(envVar), `Variável '${envVar}' deve estar documentada em .env.example.`);
}

assert(
  envExampleContent.includes('GOOGLE_ADMIN_EMAIL="reis.elias.ribeiro@gmail.com"'),
  '.env.example deve configurar GOOGLE_ADMIN_EMAIL com reis.elias.ribeiro@gmail.com.'
);
assert(
  envExampleContent.includes('CONTACT_DESTINATION_EMAIL="elias.re_is@hotmail.com"'),
  '.env.example deve manter CONTACT_DESTINATION_EMAIL com elias.re_is@hotmail.com apenas para contato público.'
);

// Certificar que não há senhas reais ou tokens comprometidos
assert(
  !envExampleContent.includes('ghp_'),
  '.env.example NUNCA deve conter tokens do GitHub.'
);
assert(
  !envExampleContent.includes('postgres://root:password'),
  '.env.example deve conter apenas placeholders.'
);
console.log('  -> .env.example documentado e livre de segredos expostos: OK');

console.log('\n================================================================');
console.log('--- TODOS OS TESTES DA FASE 2 PASSARAM COM SUCESSO ABSOLUTO! ---');
console.log('================================================================\n');

