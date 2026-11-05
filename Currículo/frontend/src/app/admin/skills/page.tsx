import React from 'react';
import { requireAdminSession } from '@/lib/auth/serverAuth';
import { getAllSkillsAdmin } from '@/services/cmsDataService';
import { SkillsClientManager } from './SkillsClientManager';

export const metadata = {
  title: 'Gestão de Habilidades e Competências | Painel Administrativo CMS',
  description: 'Gerenciamento de competências técnicas, níveis de proficiência e catálogo de tecnologias.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSkillsPage() {
  await requireAdminSession();
  const { skills, databaseConnected } = await getAllSkillsAdmin();

  return (
    <SkillsClientManager
      initialSkills={skills}
      databaseConnected={databaseConnected}
    />
  );
}
