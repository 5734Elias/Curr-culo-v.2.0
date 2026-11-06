import { PrismaClient } from '@prisma/client';
import { COURSES } from '../src/data/courses';
import { PROJECTS } from '../src/data/projects';

const prisma = new PrismaClient();

export interface SeedResult {
  success: boolean;
  certificatesCount: number;
  totalWorkloadHours: number;
  skillsCount: number;
  projectsCount: number;
  adminConfigured: boolean;
  errors: string[];
}

/**
 * Script de Seed Idempotente do CMS:
 *
 * 1. Popula as tabelas Certificate, Skill, CertificateSkill, Project e Administrator.
 * 2. Garante que execuções sucessivas não dupliquem registros (upsert determinístico).
 * 3. Valida com rigor inegociável a preservação dos 65 cursos e 2.164,5 horas.
 */
export async function seedCmsDatabase(client: PrismaClient = prisma): Promise<SeedResult> {
  const errors: string[] = [];
  console.log('--- INICIANDO SEED IDEMPOTENTE DO CMS NO POSTGRESQL ---');

  // 1. Coleta e Upsert de Habilidades Únicas
  console.log('[1/5] Mapeando e cadastrando habilidades únicas...');
  const skillCategoryMap = new Map<string, string>();

  for (const course of COURSES) {
    for (const skillName of course.skills) {
      if (!skillCategoryMap.has(skillName)) {
        skillCategoryMap.set(skillName, course.category);
      }
    }
  }

  let skillsCount = 0;
  for (const [skillName, category] of skillCategoryMap.entries()) {
    await client.skill.upsert({
      where: { name: skillName },
      update: { category },
      create: {
        name: skillName,
        category,
        displayOrder: skillsCount,
        published: true,
      },
    });
    skillsCount++;
  }
  console.log(`  -> ${skillsCount} habilidades únicas cadastradas.`);

  // Mapeia IDs das habilidades do banco
  const allDbSkills = await client.skill.findMany({ select: { id: true, name: true } });
  const skillIdMap = new Map(allDbSkills.map((s) => [s.name, s.id]));

  // 2. Upsert Idempotente dos 65 Certificados
  console.log('[2/5] Migrando os 65 cursos e certificados com IDs canônicos...');
  let certIndex = 0;
  for (const course of COURSES) {
    const certRecord = await client.certificate.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        institution: course.institution,
        institutionGroup: course.institutionGroup,
        technologyProvider: course.technologyProvider ?? null,
        issuerPriority: course.issuerPriority,
        credentialType: course.credentialType,
        workloadHours: course.workloadHours ?? null,
        startDate: course.startDate ?? null,
        endDate: course.endDate ?? null,
        issuedAt: course.issuedAt ?? null,
        category: course.category,
        credentialAssetUrl: course.credentialAsset ?? null,
        publishCredential: course.publishCredential,
        published: true,
        displayOrder: certIndex,
        verificationStatus: course.verificationStatus,
        sourceFile: course.sourceFile ?? null,
      },
      create: {
        id: course.id,
        title: course.title,
        institution: course.institution,
        institutionGroup: course.institutionGroup,
        technologyProvider: course.technologyProvider ?? null,
        issuerPriority: course.issuerPriority,
        credentialType: course.credentialType,
        workloadHours: course.workloadHours ?? null,
        startDate: course.startDate ?? null,
        endDate: course.endDate ?? null,
        issuedAt: course.issuedAt ?? null,
        category: course.category,
        credentialAssetUrl: course.credentialAsset ?? null,
        publishCredential: course.publishCredential,
        published: true,
        displayOrder: certIndex,
        verificationStatus: course.verificationStatus,
        sourceFile: course.sourceFile ?? null,
      },
    });

    // Relaciona habilidades na tabela pivô
    for (const skillName of course.skills) {
      const skillId = skillIdMap.get(skillName);
      if (skillId) {
        await client.certificateSkill.upsert({
          where: {
            certificateId_skillId: {
              certificateId: certRecord.id,
              skillId,
            },
          },
          update: {},
          create: {
            certificateId: certRecord.id,
            skillId,
          },
        });
      }
    }
    certIndex++;
  }
  console.log(`  -> ${certIndex} cursos migrados.`);

  // 3. Upsert dos Projetos / Estudos de Caso
  console.log('[3/5] Migrando estudos de caso de projetos...');
  let projectsCount = 0;
  for (const proj of PROJECTS) {
    await client.project.upsert({
      where: { slug: proj.slug },
      update: {
        title: proj.title,
        summary: proj.summary,
        context: proj.context,
        problem: proj.problem,
        solution: proj.solution,
        architecture: proj.architecture,
        technologies: proj.technologies,
        securityControls: proj.securityControls,
        testing: proj.testing,
        outcomes: proj.outcomes,
        links: proj.links,
        published: true,
        displayOrder: projectsCount,
      },
      create: {
        slug: proj.slug,
        title: proj.title,
        summary: proj.summary,
        context: proj.context,
        problem: proj.problem,
        solution: proj.solution,
        architecture: proj.architecture,
        technologies: proj.technologies,
        securityControls: proj.securityControls,
        testing: proj.testing,
        outcomes: proj.outcomes,
        links: proj.links,
        published: true,
        displayOrder: projectsCount,
      },
    });
    projectsCount++;
  }
  console.log(`  -> ${projectsCount} projetos cadastrados.`);

  // 4. Configuração Inicial do Administrador Autorizado (somente quando GOOGLE_ADMIN_SUB estiver definido)
  console.log('[4/5] Verificando configuração inicial do Administrador...');
  const adminEmail = (process.env.GOOGLE_ADMIN_EMAIL?.trim() || 'reis.elias.ribeiro@gmail.com').toLowerCase();
  const adminSub = process.env.GOOGLE_ADMIN_SUB?.trim() || '';
  let adminConfigured = false;

  if (adminEmail && adminEmail !== 'elias.re_is@hotmail.com' && adminSub) {
    await client.administrator.upsert({
      where: { email: adminEmail },
      update: {
        role: 'SUPER_ADMIN',
        googleSub: adminSub,
      },
      create: {
        email: adminEmail,
        googleSub: adminSub,
        name: 'Elias Ribeiro dos Reis',
        role: 'SUPER_ADMIN',
      },
    });
    adminConfigured = true;
    console.log(`  -> Administrador '${adminEmail}' vinculado ao GOOGLE_ADMIN_SUB com privilégios.`);
  } else {
    console.log('  -> GOOGLE_ADMIN_SUB ainda não definido no ambiente; vínculo será exigido em produção.');
  }

  // 5. Validação de Integridade Numérica e Carga Horária Estrita
  console.log('[5/5] Executando auditoria estrita pós-migração...');
  const totalCertificates = await client.certificate.count();
  const sumResult = await client.certificate.aggregate({
    _sum: { workloadHours: true },
  });
  const totalHours = sumResult._sum.workloadHours ?? 0;

  console.log(`  -> Total de Certificados no Banco: ${totalCertificates} (Esperado: 65)`);
  console.log(`  -> Carga Horária Total no Banco: ${totalHours}h (Esperado: 2164.5h)`);

  if (totalCertificates !== 65) {
    errors.push(`Discrepância na contagem de certificados: obteve ${totalCertificates}, esperado 65.`);
  }
  if (totalHours !== 2164.5) {
    errors.push(`Discrepância na carga horária: obteve ${totalHours}h, esperado 2164.5h.`);
  }

  if (errors.length > 0) {
    console.error('ERRO CRÍTICO DE INTEGRIDADE:');
    errors.forEach((e) => console.error(`  - ${e}`));
    return {
      success: false,
      certificatesCount: totalCertificates,
      totalWorkloadHours: totalHours,
      skillsCount,
      projectsCount,
      adminConfigured,
      errors,
    };
  }

  console.log('--- SEED IDEMPOTENTE CONCLUÍDO COM 100% DE SUCESSO! ---');
  return {
    success: true,
    certificatesCount: totalCertificates,
    totalWorkloadHours: totalHours,
    skillsCount,
    projectsCount,
    adminConfigured,
    errors: [],
  };
}

// Execução direta via CLI se chamado como script principal
if (process.argv[1]?.endsWith('seed-cms-data.ts') || process.argv[1]?.endsWith('seed-cms-data.mjs')) {
  seedCmsDatabase()
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Falha na execução do seed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
