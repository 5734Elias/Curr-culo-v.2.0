import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { Course, ProjectCase } from '@/schemas/content';
import { COURSES } from '@/data/courses';
import { PROJECTS } from '@/data/projects';

export interface CmsSkill {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  proficiencyLevel?: string | null;
  iconName?: string | null;
  displayOrder: number;
  published: boolean;
}

export interface CmsDashboardMetrics {
  totalCertificates: number;
  totalCourses: number;
  totalWorkloadHours: number;
  publishedCertificates: number;
  draftCertificates: number;
  totalSkills: number;
  totalProjects: number;
  databaseConnected: boolean;
}

/**
 * Camada de Acesso a Dados do CMS (Repository Pattern com Fallback Resiliente):
 *
 * 1. Prioriza o PostgreSQL gerenciado via Prisma Client quando DATABASE_URL estiver configurado e saudável.
 * 2. Em caso de banco não configurado (ex: desenvolvimento local sem DB ativo, CI rápido) ou falha temporária
 *    de rede, recorre aos dados estáticos homologados (COURSES, PROJECTS).
 * 3. Garante que o portfólio público NUNCA fique inacessível ou retorne 500 caso o banco sofra indisponibilidade.
 */

export async function getPublishedCertificates(): Promise<Course[]> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    try {
      const records = await prisma.certificate.findMany({
        where: { published: true },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
        orderBy: [{ issuerPriority: 'asc' }, { displayOrder: 'asc' }],
      });

      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          title: r.title,
          institution: r.institution,
          institutionGroup: r.institutionGroup as Course['institutionGroup'],
          technologyProvider: r.technologyProvider ?? undefined,
          issuerPriority: r.issuerPriority as Course['issuerPriority'],
          credentialType: r.credentialType as Course['credentialType'],
          workloadHours: r.workloadHours ?? undefined,
          startDate: r.startDate ?? undefined,
          endDate: r.endDate ?? undefined,
          issuedAt: r.issuedAt ?? undefined,
          category: r.category as Course['category'],
          skills: r.skills.map((s) => s.skill.name),
          credentialAsset: r.credentialAssetUrl ?? undefined,
          publishCredential: r.publishCredential,
          sourceFile: r.sourceFile ?? undefined,
          verificationStatus: r.verificationStatus as Course['verificationStatus'],
        }));
      }
    } catch (err) {
      console.warn('[CMS_SERVICE] Erro ao consultar certificados no banco. Ativando fallback estático:', err);
    }
  }

  // Fallback transparente e resiliente para os dados estáticos auditados
  return COURSES;
}

export async function getPublishedProjects(): Promise<ProjectCase[]> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    try {
      const records = await prisma.project.findMany({
        where: { published: true },
        orderBy: { displayOrder: 'asc' },
      });

      if (records && records.length > 0) {
        return records.map((p) => ({
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          context: p.context,
          problem: p.problem,
          solution: p.solution,
          architecture: p.architecture as unknown as string[],
          technologies: p.technologies as unknown as string[],
          securityControls: p.securityControls as unknown as string[],
          testing: p.testing as unknown as string[],
          outcomes: p.outcomes as unknown as ProjectCase['outcomes'],
          links: p.links as unknown as ProjectCase['links'],
        }));
      }
    } catch (err) {
      console.warn('[CMS_SERVICE] Erro ao consultar projetos no banco. Ativando fallback estático:', err);
    }
  }

  return PROJECTS;
}

export async function getPublishedSkills(): Promise<CmsSkill[]> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    try {
      const records = await prisma.skill.findMany({
        where: { published: true },
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      });

      if (records && records.length > 0) {
        return records.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          description: s.description,
          proficiencyLevel: s.proficiencyLevel,
          iconName: s.iconName,
          displayOrder: s.displayOrder,
          published: s.published,
        }));
      }
    } catch (err) {
      console.warn('[CMS_SERVICE] Erro ao consultar habilidades no banco. Ativando fallback estático:', err);
    }
  }

  // Fallback derivado da lista estática
  const skillSet = new Map<string, CmsSkill>();
  let idx = 0;
  for (const c of COURSES) {
    for (const name of c.skills) {
      if (!skillSet.has(name)) {
        skillSet.set(name, {
          id: `static-skill-${idx}`,
          name,
          category: c.category,
          displayOrder: idx,
          published: true,
        });
        idx++;
      }
    }
  }

  return Array.from(skillSet.values());
}

export async function getCmsDashboardMetrics(): Promise<CmsDashboardMetrics> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    try {
      const [totalCerts, publishedCerts, draftCerts, sumHours, totalSkills, totalProjects] =
        await Promise.all([
          prisma.certificate.count(),
          prisma.certificate.count({ where: { published: true } }),
          prisma.certificate.count({ where: { published: false } }),
          prisma.certificate.aggregate({ _sum: { workloadHours: true } }),
          prisma.skill.count(),
          prisma.project.count(),
        ]);

      return {
        totalCertificates: totalCerts,
        totalCourses: totalCerts,
        totalWorkloadHours: sumHours._sum.workloadHours ?? 0,
        publishedCertificates: publishedCerts,
        draftCertificates: draftCerts,
        totalSkills,
        totalProjects,
        databaseConnected: true,
      };
    } catch (err) {
      console.warn('[CMS_SERVICE] Erro ao calcular métricas no banco:', err);
    }
  }

  // Métricas extraídas das fontes estáticas auditadas
  const staticHours = COURSES.reduce((acc, c) => acc + (c.workloadHours ?? 0), 0);
  const staticSkills = new Set(COURSES.flatMap((c) => c.skills)).size;

  return {
    totalCertificates: COURSES.length,
    totalCourses: COURSES.length,
    totalWorkloadHours: staticHours,
    publishedCertificates: COURSES.length,
    draftCertificates: 0,
    totalSkills: staticSkills,
    totalProjects: PROJECTS.length,
    databaseConnected: false,
  };
}

