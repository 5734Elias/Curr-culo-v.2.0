import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { Course, ProjectCase } from '@/schemas/content';
import { CreateCertificateInput, UpdateCertificateInput } from '@/schemas/cms';
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

export interface AdminCertificateRecord {
  id: string;
  title: string;
  institution: string;
  institutionGroup: string;
  technologyProvider?: string | null;
  issuerPriority: string;
  credentialType: string;
  workloadHours?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  issuedAt?: string | null;
  category: string;
  skills: string[];
  credentialAssetUrl?: string | null;
  verificationUrl?: string | null;
  credentialCode?: string | null;
  publishCredential: boolean;
  published: boolean;
  displayOrder: number;
  verificationStatus: string;
  sourceFile?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CertificateFilters {
  search?: string;
  group?: string;
  category?: string;
  status?: 'all' | 'published' | 'draft';
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

/**
 * Consulta administrativa de certificados com suporte a filtros e busca.
 */
export async function getAllCertificatesAdmin(
  filters: CertificateFilters = {}
): Promise<{ certificates: AdminCertificateRecord[]; total: number; databaseConnected: boolean }> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    try {
      const where: Record<string, unknown> = {};

      if (filters.group && filters.group !== 'todos') {
        where.institutionGroup = filters.group;
      }

      if (filters.category && filters.category !== 'todos') {
        where.category = filters.category;
      }

      if (filters.status === 'published') {
        where.published = true;
      } else if (filters.status === 'draft') {
        where.published = false;
      }

      if (filters.search?.trim()) {
        const query = filters.search.trim();
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { institution: { contains: query, mode: 'insensitive' } },
          { technologyProvider: { contains: query, mode: 'insensitive' } },
          { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } },
        ];
      }

      const records = await prisma.certificate.findMany({
        where,
        include: {
          skills: {
            include: { skill: true },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });

      return {
        certificates: records.map((r) => ({
          id: r.id,
          title: r.title,
          institution: r.institution,
          institutionGroup: r.institutionGroup,
          technologyProvider: r.technologyProvider,
          issuerPriority: r.issuerPriority,
          credentialType: r.credentialType,
          workloadHours: r.workloadHours,
          startDate: r.startDate,
          endDate: r.endDate,
          issuedAt: r.issuedAt,
          category: r.category,
          skills: r.skills.map((s) => s.skill.name),
          credentialAssetUrl: r.credentialAssetUrl,
          verificationUrl: r.verificationUrl,
          credentialCode: r.credentialCode,
          publishCredential: r.publishCredential,
          published: r.published,
          displayOrder: r.displayOrder,
          verificationStatus: r.verificationStatus,
          sourceFile: r.sourceFile,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total: records.length,
        databaseConnected: true,
      };
    } catch (err) {
      console.warn('[CMS_SERVICE] Erro ao consultar certificados no banco para o admin:', err);
    }
  }

  // Fallback para lista estática
  let staticList: AdminCertificateRecord[] = COURSES.map((c, idx) => ({
    id: c.id,
    title: c.title,
    institution: c.institution,
    institutionGroup: c.institutionGroup,
    technologyProvider: c.technologyProvider ?? null,
    issuerPriority: c.issuerPriority,
    credentialType: c.credentialType,
    workloadHours: c.workloadHours ?? null,
    startDate: c.startDate ?? null,
    endDate: c.endDate ?? null,
    issuedAt: c.issuedAt ?? null,
    category: c.category,
    skills: c.skills,
    credentialAssetUrl: c.credentialAsset ?? null,
    verificationUrl: null,
    credentialCode: null,
    publishCredential: c.publishCredential,
    published: true,
    displayOrder: idx,
    verificationStatus: c.verificationStatus,
    sourceFile: c.sourceFile ?? null,
  }));

  if (filters.group && filters.group !== 'todos') {
    staticList = staticList.filter((c) => c.institutionGroup === filters.group);
  }
  if (filters.category && filters.category !== 'todos') {
    staticList = staticList.filter((c) => c.category === filters.category);
  }
  if (filters.status === 'draft') {
    staticList = [];
  }
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase().trim();
    staticList = staticList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.institution.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  return {
    certificates: staticList,
    total: staticList.length,
    databaseConnected: false,
  };
}

/**
 * Criação administrativa de novo certificado.
 */
export async function createCertificateAdmin(
  input: CreateCertificateInput,
  adminEmail: string,
  adminSub: string,
  ipHash: string = 'unknown'
): Promise<AdminCertificateRecord> {
  const isDbReady = await isDatabaseAvailable();
  const id =
    input.id ||
    input.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  if (isDbReady) {
    // 1. Processa e garante a criação das skills associadas
    const skillIds: string[] = [];
    for (const skillName of input.skills) {
      const skillRecord = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: {
          name: skillName,
          category: input.category,
        },
      });
      skillIds.push(skillRecord.id);
    }

    // 2. Cria o certificado
    const cert = await prisma.certificate.create({
      data: {
        id,
        title: input.title,
        institution: input.institution,
        institutionGroup: input.institutionGroup,
        technologyProvider: input.technologyProvider ?? null,
        issuerPriority: input.issuerPriority,
        credentialType: input.credentialType,
        workloadHours: input.workloadHours ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        issuedAt: input.issuedAt ?? null,
        category: input.category,
        credentialAssetUrl: input.credentialAssetUrl ?? null,
        verificationUrl: input.verificationUrl ?? null,
        credentialCode: input.credentialCode ?? null,
        publishCredential: input.publishCredential,
        published: input.published,
        displayOrder: input.displayOrder,
        verificationStatus: input.verificationStatus,
        sourceFile: input.sourceFile ?? null,
        skills: {
          create: skillIds.map((sId) => ({ skillId: sId })),
        },
      },
      include: {
        skills: { include: { skill: true } },
      },
    });

    // 3. Registra na trilha de auditoria
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_CERTIFICATE',
        entityType: 'Certificate',
        entityId: cert.id,
        adminEmail,
        adminSub,
        ipHash,
        details: { title: cert.title, institution: cert.institution },
      },
    });

    return {
      id: cert.id,
      title: cert.title,
      institution: cert.institution,
      institutionGroup: cert.institutionGroup,
      technologyProvider: cert.technologyProvider,
      issuerPriority: cert.issuerPriority,
      credentialType: cert.credentialType,
      workloadHours: cert.workloadHours,
      startDate: cert.startDate,
      endDate: cert.endDate,
      issuedAt: cert.issuedAt,
      category: cert.category,
      skills: cert.skills.map((s) => s.skill.name),
      credentialAssetUrl: cert.credentialAssetUrl,
      verificationUrl: cert.verificationUrl,
      credentialCode: cert.credentialCode,
      publishCredential: cert.publishCredential,
      published: cert.published,
      displayOrder: cert.displayOrder,
      verificationStatus: cert.verificationStatus,
      sourceFile: cert.sourceFile,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
    };
  }

  // Fallback simulado para testes locais sem banco ativo
  return {
    ...input,
    id,
    skills: input.skills,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Atualização administrativa de certificado existente.
 */
export async function updateCertificateAdmin(
  id: string,
  input: UpdateCertificateInput,
  adminEmail: string,
  adminSub: string,
  ipHash: string = 'unknown'
): Promise<AdminCertificateRecord | null> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    // Se novas skills foram fornecidas, sincroniza a relação
    if (input.skills) {
      await prisma.certificateSkill.deleteMany({ where: { certificateId: id } });
      for (const skillName of input.skills) {
        const skillRecord = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName, category: input.category || 'desenvolvimento' },
        });
        await prisma.certificateSkill.create({
          data: { certificateId: id, skillId: skillRecord.id },
        });
      }
    }

    const cert = await prisma.certificate.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.institution !== undefined ? { institution: input.institution } : {}),
        ...(input.institutionGroup !== undefined ? { institutionGroup: input.institutionGroup } : {}),
        ...(input.technologyProvider !== undefined ? { technologyProvider: input.technologyProvider } : {}),
        ...(input.issuerPriority !== undefined ? { issuerPriority: input.issuerPriority } : {}),
        ...(input.credentialType !== undefined ? { credentialType: input.credentialType } : {}),
        ...(input.workloadHours !== undefined ? { workloadHours: input.workloadHours } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        ...(input.issuedAt !== undefined ? { issuedAt: input.issuedAt } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.credentialAssetUrl !== undefined ? { credentialAssetUrl: input.credentialAssetUrl } : {}),
        ...(input.verificationUrl !== undefined ? { verificationUrl: input.verificationUrl } : {}),
        ...(input.credentialCode !== undefined ? { credentialCode: input.credentialCode } : {}),
        ...(input.publishCredential !== undefined ? { publishCredential: input.publishCredential } : {}),
        ...(input.published !== undefined ? { published: input.published } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.verificationStatus !== undefined ? { verificationStatus: input.verificationStatus } : {}),
        ...(input.sourceFile !== undefined ? { sourceFile: input.sourceFile } : {}),
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CERTIFICATE',
        entityType: 'Certificate',
        entityId: id,
        adminEmail,
        adminSub,
        ipHash,
        details: { updatedFields: Object.keys(input) },
      },
    });

    return {
      id: cert.id,
      title: cert.title,
      institution: cert.institution,
      institutionGroup: cert.institutionGroup,
      technologyProvider: cert.technologyProvider,
      issuerPriority: cert.issuerPriority,
      credentialType: cert.credentialType,
      workloadHours: cert.workloadHours,
      startDate: cert.startDate,
      endDate: cert.endDate,
      issuedAt: cert.issuedAt,
      category: cert.category,
      skills: cert.skills.map((s) => s.skill.name),
      credentialAssetUrl: cert.credentialAssetUrl,
      verificationUrl: cert.verificationUrl,
      credentialCode: cert.credentialCode,
      publishCredential: cert.publishCredential,
      published: cert.published,
      displayOrder: cert.displayOrder,
      verificationStatus: cert.verificationStatus,
      sourceFile: cert.sourceFile,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
    };
  }

  return null;
}

/**
 * Alternância rápida de publicação (Publicado / Rascunho).
 */
export async function toggleCertificatePublishAdmin(
  id: string,
  published: boolean,
  adminEmail: string,
  adminSub: string,
  ipHash: string = 'unknown'
): Promise<boolean> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    await prisma.certificate.update({
      where: { id },
      data: { published },
    });

    await prisma.auditLog.create({
      data: {
        action: 'TOGGLE_CERTIFICATE_PUBLISHED',
        entityType: 'Certificate',
        entityId: id,
        adminEmail,
        adminSub,
        ipHash,
        details: { published },
      },
    });
    return true;
  }

  return true;
}

/**
 * Exclusão administrativa de certificado.
 */
export async function deleteCertificateAdmin(
  id: string,
  adminEmail: string,
  adminSub: string,
  ipHash: string = 'unknown'
): Promise<boolean> {
  const isDbReady = await isDatabaseAvailable();

  if (isDbReady) {
    await prisma.certificate.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_CERTIFICATE',
        entityType: 'Certificate',
        entityId: id,
        adminEmail,
        adminSub,
        ipHash,
        details: { id },
      },
    });
    return true;
  }

  return true;
}

