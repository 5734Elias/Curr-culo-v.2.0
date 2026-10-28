import assert from 'node:assert';
import {
  PROFILE,
  PHONE_INTERNATIONAL,
  WHATSAPP_INITIAL_MESSAGE,
  WHATSAPP_CONTACT_URL,
  TELEGRAM_CONTACT_URL,
} from '../src/data/profile.ts';
import { PROJECTS } from '../src/data/projects.ts';
import { EXPERIENCES } from '../src/data/experiences.ts';
import { COURSES } from '../src/data/courses.ts';

console.log('--- TEST SUITE: SINGLE SOURCE OF TRUTH & DATA CONSISTENCY ---');

// 1. Validação de Profile Central (PROFILE) e Canais WhatsApp / Telegram
console.log('[1/5] Validando integridade da Fonte Única de Dados do Perfil e Mensageiros...');
assert.ok(PROFILE.name.length > 5, 'Nome do perfil deve ser preenchido.');
assert.strictEqual(
  PROFILE.phone,
  '+55 (11) 98605-0195',
  'Telefone do perfil deve estar no formato padronizado +55 (11) 98605-0195.'
);
assert.strictEqual(
  PHONE_INTERNATIONAL,
  '5511986050195',
  'Número internacional normalizado deve ser exatamente 5511986050195.'
);
assert.strictEqual(
  WHATSAPP_INITIAL_MESSAGE,
  'Olá, Elias! Vi seu portfólio profissional e gostaria de conversar sobre uma oportunidade ou projeto.',
  'Mensagem inicial do WhatsApp deve corresponder ao texto profissional homologado.'
);
assert.ok(
  WHATSAPP_CONTACT_URL.startsWith('https://wa.me/5511986050195?text='),
  'URL do WhatsApp deve utilizar wa.me com o número internacional 5511986050195.'
);
const parsedWhatsappUrl = new URL(WHATSAPP_CONTACT_URL);
assert.strictEqual(
  parsedWhatsappUrl.searchParams.get('text'),
  WHATSAPP_INITIAL_MESSAGE,
  'Parâmetro text da URL do WhatsApp deve decodificar exatamente para a mensagem inicial.'
);
assert.strictEqual(
  TELEGRAM_CONTACT_URL,
  'https://t.me/+5511986050195',
  'URL do Telegram deve ser exatamente https://t.me/+5511986050195.'
);
assert.ok(PROFILE.email.includes('@'), 'E-mail deve ser válido.');
assert.ok(PROFILE.github.startsWith('https://github.com/'), 'Link do GitHub deve ser URL segura.');
assert.ok(PROFILE.linkedin.startsWith('https://www.linkedin.com/'), 'Link do LinkedIn deve ser URL segura.');
console.log(`PASS: Perfil de ${PROFILE.name} e canais WhatsApp/Telegram validados com sucesso.`);

// 2. Validação de Consistência de Redes Sociais em Projetos
console.log('[2/5] Validando sincronização de links em Projetos com PROFILE...');
for (const project of PROJECTS) {
  for (const link of project.links) {
    if (link.label.toLowerCase().includes('linkedin')) {
      assert.strictEqual(
        link.url,
        PROFILE.linkedin,
        `Link do LinkedIn no projeto '${project.slug}' diverge do PROFILE.linkedin!`
      );
    }
    if (link.label.toLowerCase().includes('github')) {
      assert.strictEqual(
        link.url,
        PROFILE.github,
        `Link do GitHub no projeto '${project.slug}' diverge do PROFILE.github!`
      );
    }
  }
}
console.log('PASS: Todos os links em projetos apontam para os canais oficiais do perfil.');

// 3. Validação de Slugs e Rotas Estáticas
console.log('[3/5] Validando formato e unicidade dos slugs de projetos...');
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const projectSlugs = new Set();
for (const project of PROJECTS) {
  assert.ok(
    slugRegex.test(project.slug),
    `Slug '${project.slug}' inválido. Deve ser kebab-case minúsculo.`
  );
  assert.ok(!projectSlugs.has(project.slug), `Slug duplicado detectado: ${project.slug}`);
  projectSlugs.add(project.slug);
}
console.log(`PASS: Todos os ${projectSlugs.size} slugs de projetos são canônicos e únicos.`);

// 4. Validação de Experiências e Métricas
console.log('[4/5] Validando consistência de experiências profissionais...');
for (const exp of EXPERIENCES) {
  assert.ok(exp.role.length > 0, 'Cargo não pode ser vazio.');
  assert.ok(exp.company.length > 0, 'Empresa não pode ser vazia.');
  assert.ok(exp.responsibilities.length > 0, 'Deve conter lista de responsabilidades.');
  assert.ok(exp.technologies.length > 0, 'Deve conter tecnologias relacionadas.');
}
console.log(`PASS: Todas as ${EXPERIENCES.length} experiências auditadas com sucesso.`);

// 5. Validação de Cursos e Horas
console.log('[5/5] Validando coerência de carga horária dos cursos...');
let totalHours = 0;
for (const course of COURSES) {
  if (course.workloadHours !== undefined) {
    assert.ok(course.workloadHours > 0, `Curso '${course.id}' possui carga horária inválida!`);
    totalHours += course.workloadHours;
  }
}
console.log(`PASS: ${COURSES.length} cursos auditados totalizando ${totalHours}h verificadas.`);

console.log('--- CONSISTÊNCIA DE DADOS APROVADA: ZERO DIVERGÊNCIAS DETECTADAS! ---');
