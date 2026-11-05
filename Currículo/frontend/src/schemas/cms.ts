import { z } from 'zod';
import {
  CourseCategorySchema,
  InstitutionGroupSchema,
  CredentialTypeSchema,
  VerificationStatusSchema,
} from './content';

/**
 * Schema para Criação de Certificado/Curso pelo Painel Administrativo.
 */
export const CreateCertificateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, 'O identificador único deve ter pelo menos 2 caracteres.')
    .max(120, 'O identificador único deve ter no máximo 120 caracteres.')
    .regex(/^[a-z0-9-_]+$/, 'O identificador deve conter apenas letras minúsculas, números, hífens e sublinhados.')
    .optional(),
  title: z
    .string()
    .trim()
    .min(3, 'O título deve ter pelo menos 3 caracteres.')
    .max(250, 'O título não pode exceder 250 caracteres.'),
  institution: z
    .string()
    .trim()
    .min(2, 'A instituição deve ter pelo menos 2 caracteres.')
    .max(150, 'A instituição não pode exceder 150 caracteres.'),
  institutionGroup: InstitutionGroupSchema.default('outras'),
  technologyProvider: z
    .string()
    .trim()
    .max(100, 'O provedor tecnológico não pode exceder 100 caracteres.')
    .optional()
    .nullable(),
  issuerPriority: z.enum(['featured', 'standard']).default('standard'),
  credentialType: CredentialTypeSchema.default('curso'),
  workloadHours: z
    .number()
    .positive('A carga horária deve ser um valor numérico positivo.')
    .max(10000, 'A carga horária máxima é 10.000 horas.')
    .optional()
    .nullable(),
  startDate: z.string().trim().max(30).optional().nullable(),
  endDate: z.string().trim().max(30).optional().nullable(),
  issuedAt: z.string().trim().max(30).optional().nullable(),
  category: CourseCategorySchema.default('desenvolvimento'),
  skills: z
    .array(z.string().trim().min(1).max(80))
    .max(50, 'Máximo de 50 habilidades por certificado.')
    .default([]),
  credentialAssetUrl: z.string().trim().max(500).optional().nullable(),
  verificationUrl: z.string().trim().url('URL de verificação inválida.').max(500).optional().nullable(),
  credentialCode: z.string().trim().max(100).optional().nullable(),
  publishCredential: z.boolean().default(true),
  published: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  verificationStatus: VerificationStatusSchema.default('document-reviewed'),
  sourceFile: z.string().trim().max(200).optional().nullable(),
});

export type CreateCertificateInput = z.infer<typeof CreateCertificateSchema>;

/**
 * Schema para Atualização Parcial de Certificado.
 */
export const UpdateCertificateSchema = CreateCertificateSchema.partial();
export type UpdateCertificateInput = z.infer<typeof UpdateCertificateSchema>;

/**
 * Schema para Alternar Status de Publicação.
 */
export const TogglePublishSchema = z.object({
  published: z.boolean(),
});
export type TogglePublishInput = z.infer<typeof TogglePublishSchema>;

/**
 * Schema para Criação de Habilidade / Competência Técnica.
 */
export const CreateSkillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome da habilidade deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome da habilidade não pode exceder 80 caracteres.'),
  category: CourseCategorySchema.default('desenvolvimento'),
  description: z.string().trim().max(300, 'A descrição não pode exceder 300 caracteres.').optional().nullable(),
  proficiencyLevel: z
    .enum(['iniciante', 'intermediario', 'avancado', 'especialista'])
    .default('avancado'),
  iconName: z.string().trim().max(50).optional().nullable(),
  displayOrder: z.number().int().default(0),
  published: z.boolean().default(true),
});
export type CreateSkillInput = z.infer<typeof CreateSkillSchema>;

/**
 * Schema para Atualização de Habilidade.
 */
export const UpdateSkillSchema = CreateSkillSchema.partial();
export type UpdateSkillInput = z.infer<typeof UpdateSkillSchema>;

