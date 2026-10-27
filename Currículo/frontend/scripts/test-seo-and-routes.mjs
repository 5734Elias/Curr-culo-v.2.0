import assert from 'node:assert';
import sitemapModule from '../src/app/sitemap.ts';
import robotsModule from '../src/app/robots.ts';
import { PROJECTS } from '../src/data/projects.ts';

const sitemap = typeof sitemapModule === 'function' ? sitemapModule : sitemapModule.default;
const robots = typeof robotsModule === 'function' ? robotsModule : robotsModule.default;

console.log('--- TEST SUITE: TECHNICAL SEO, ROBOTS & SITEMAP AUDIT ---');

// 1. Auditoria do Robots.txt
console.log('[1/3] Validando configuração do robots.ts...');
const robotsConfig = robots();
const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;

assert.strictEqual(rules.allow, '/', 'Robots deve permitir rastreamento da raiz.');
assert.ok(
  Array.isArray(rules.disallow) && rules.disallow.includes('/api/'),
  'Robots deve bloquear a pasta /api/ contra indexação de endpoints.'
);
assert.strictEqual(
  robotsConfig.sitemap,
  'https://eliasreis.dev/sitemap.xml',
  'Robots deve apontar para o sitemap canônico.'
);
console.log('PASS: Robots.txt configurado com segurança e indexabilidade.');

// 2. Auditoria do Sitemap.xml
console.log('[2/3] Validando rotas e datas estáveis no sitemap.ts...');
const sitemapEntries = sitemap();
assert.ok(sitemapEntries.length >= 12, 'Sitemap deve conter todas as rotas estáticas e de projetos.');

// Validar que todas as URLs são seguras (https://eliasreis.dev)
for (const entry of sitemapEntries) {
  assert.ok(entry.url.startsWith('https://eliasreis.dev'), `URL inválida no sitemap: ${entry.url}`);
  assert.ok(entry.lastModified instanceof Date, 'lastModified deve ser um objeto Date válido.');
  assert.ok(entry.priority !== undefined && entry.priority > 0 && entry.priority <= 1.0, 'Prioridade fora do intervalo [0.1, 1.0]');
}

// Conferir se todos os projetos estão no sitemap
for (const project of PROJECTS) {
  const found = sitemapEntries.some((e) => e.url === `https://eliasreis.dev/projetos/${project.slug}`);
  assert.ok(found, `Projeto '${project.slug}' não foi incluído no sitemap.xml!`);
}
console.log(`PASS: Sitemap gerado com sucesso contendo ${sitemapEntries.length} URLs canônicas.`);

// 3. Auditoria de Cobertura de Rotas Críticas
console.log('[3/3] Validando cobertura de rotas críticas...');
const requiredRoutes = [
  'https://eliasreis.dev',
  'https://eliasreis.dev/sobre',
  'https://eliasreis.dev/experiencia',
  'https://eliasreis.dev/projetos',
  'https://eliasreis.dev/competencias',
  'https://eliasreis.dev/formacao',
  'https://eliasreis.dev/curriculo',
  'https://eliasreis.dev/contato',
];

for (const req of requiredRoutes) {
  const exists = sitemapEntries.some((e) => e.url === req);
  assert.ok(exists, `Rota obrigatória ausente no sitemap: ${req}`);
}
console.log('PASS: Todas as rotas prioritárias de navegação estão mapeadas no sitemap.');

console.log('--- AUDITORIA DE SEO TÉCNICO APROVADA COM 100% DE SUCESSO! ---');
