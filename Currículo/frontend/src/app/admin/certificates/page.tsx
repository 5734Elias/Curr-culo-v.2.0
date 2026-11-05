import React from 'react';
import { requireAdminSession } from '@/lib/auth/serverAuth';
import { getAllCertificatesAdmin } from '@/services/cmsDataService';
import { CertificatesClientManager } from './CertificatesClientManager';

export const metadata = {
  title: 'Gestão de Certificados & Cursos | Painel Administrativo CMS',
  description: 'Gerenciamento do acervo de cursos profissionais, carga horária e publicação.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCertificatesPage() {
  await requireAdminSession();
  const { certificates, databaseConnected } = await getAllCertificatesAdmin();

  return (
    <CertificatesClientManager
      initialCertificates={certificates}
      databaseConnected={databaseConnected}
    />
  );
}
