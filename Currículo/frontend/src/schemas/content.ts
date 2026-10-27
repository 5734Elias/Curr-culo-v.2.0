import { z } from 'zod';

export const CourseCategorySchema = z.enum([
  'desenvolvimento',
  'dados',
  'ia',
  'cloud',
  'seguranca',
  'infraestrutura',
  'outros',
]);

export type CourseCategory = z.infer<typeof CourseCategorySchema>;

export const InstitutionGroupSchema = z.enum([
  'senai',
  'ka-solution',
  'fundacao-bradesco',
  'outras',
]);

export type InstitutionGroup = z.infer<typeof InstitutionGroupSchema>;

export const CredentialTypeSchema = z.enum([
  'formacao-tecnica',
  'curso',
  'evento',
  'bootcamp',
  'certificacao',
]);

export type CredentialType = z.infer<typeof CredentialTypeSchema>;

export const VerificationStatusSchema = z.enum([
  'document-reviewed',
  'metadata-only',
  'pending-review',
]);

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const SkillItemSchema = z.object({
  name: z.string(),
  evidence: z.enum(['certificate_content', 'course_title', 'existing_verified']),
});

export type SkillItem = z.infer<typeof SkillItemSchema>;

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  institution: z.string(),
  institutionGroup: InstitutionGroupSchema.default('outras'),
  technologyProvider: z.string().optional(),
  issuerPriority: z.enum(['featured', 'standard']).default('standard'),
  credentialType: CredentialTypeSchema.default('curso'),
  workloadHours: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  issuedAt: z.string().optional(),
  category: CourseCategorySchema,
  skills: z.array(z.string()),
  skillDetails: z.array(SkillItemSchema).optional(),
  credentialAsset: z.string().optional(),
  publishCredential: z.boolean().default(true),
  sourceFile: z.string().optional(),
  verificationStatus: VerificationStatusSchema.default('document-reviewed'),
});

export type Course = z.infer<typeof CourseSchema>;

export const OutcomeSchema = z.object({
  label: z.string(),
  value: z.string(),
  verified: z.boolean(),
});

export type Outcome = z.infer<typeof OutcomeSchema>;

export const ProjectLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

export type ProjectLink = z.infer<typeof ProjectLinkSchema>;

export const ProjectCaseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  context: z.string(),
  problem: z.string(),
  solution: z.string(),
  architecture: z.array(z.string()),
  technologies: z.array(z.string()),
  securityControls: z.array(z.string()),
  testing: z.array(z.string()),
  outcomes: z.array(OutcomeSchema),
  links: z.array(ProjectLinkSchema),
});

export type ProjectCase = z.infer<typeof ProjectCaseSchema>;

export const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  period: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  location: z.string().optional(),
  overlapNote: z.string().optional(),
  responsibilities: z.array(z.string()),
  technologies: z.array(z.string()),
  outcomes: z.array(OutcomeSchema),
});

export type Experience = z.infer<typeof ExperienceSchema>;

export const ContactPayloadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Endereço de e-mail inválido.'),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres.'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres.').max(2000, 'Mensagem excedeu o limite.'),
  websiteHoneypot: z.string().max(0, 'Bot detectado.').optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Você deve concordar com a comunicação de contato.',
  }),
});

export type ContactPayload = z.infer<typeof ContactPayloadSchema>;
