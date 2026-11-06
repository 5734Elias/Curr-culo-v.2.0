import React from 'react';
import type { Metadata } from 'next';
import { getPublishedCertificates } from '@/services/cmsDataService';
import { FormacaoClientView } from './FormacaoClientView';
import { PROFILE } from '@/data/profile';

export const metadata: Metadata = {
  title: `Formação & Certificações | ${PROFILE.name}`,
  description:
    'Acervo completo de qualificações técnicas, treinamentos corporativos, especializações em IA/Cibersegurança/Nuvem e participações em eventos.',
};

export default async function FormacaoPage() {
  const courses = await getPublishedCertificates();

  return <FormacaoClientView initialCourses={courses} />;
}
