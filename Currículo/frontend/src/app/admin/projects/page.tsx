import React from 'react';
import { requireAdminSession } from '@/lib/auth/serverAuth';
import { getAllProjectsAdmin } from '@/services/cmsDataService';
import { ProjectsClientManager } from './ProjectsClientManager';

export const metadata = {
  title: 'Gestão de Projetos e Estudos de Caso | Painel Administrativo CMS',
  description: 'Gerenciamento dos estudos de caso em destaque, arquiteturas, tecnologias e salvaguardas.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminProjectsPage() {
  await requireAdminSession();
  const { projects, databaseConnected } = await getAllProjectsAdmin();

  return (
    <ProjectsClientManager
      initialProjects={projects}
      databaseConnected={databaseConnected}
    />
  );
}
