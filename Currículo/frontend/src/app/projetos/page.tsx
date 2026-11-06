import React from 'react';
import type { Metadata } from 'next';
import { getPublishedProjects } from '@/services/cmsDataService';
import { ProjetosClientView } from './ProjetosClientView';
import { PROFILE } from '@/data/profile';

export const metadata: Metadata = {
  title: `Projetos & Estudos de Caso | ${PROFILE.name}`,
  description:
    'Estudos de caso reais e projetos estruturados em arquitetura de microsserviços, inteligência artificial multimodal, perímetros Fortinet e pipelines de dados.',
};

export default async function ProjetosPage() {
  const projects = await getPublishedProjects();

  return <ProjetosClientView initialProjects={projects} />;
}
