/**
 * Definições e Contratos de Tipagem de Domínio do Portfólio v3.0
 * Fonte de tipos centralizada para manter desacoplamento e consistência.
 */

export type {
  Course,
  CourseCategory,
  InstitutionGroup,
  CredentialType,
  VerificationStatus,
  SkillItem,
  Outcome,
  ProjectLink,
  ProjectCase,
  Experience,
  ContactPayload,
} from '@/schemas/content';

export type {
  ContactMessage,
  SendMessageResult,
} from '@/services/contactService';

export interface ProfileData {
  name: string;
  role: string;
  headline: string;
  summary: string;
  location: string;
  phone: string;
  email: string;
  github: string;
  linkedin: string;
  availability: string;
}
