import { MetadataRoute } from 'next';
import { PROJECTS } from '@/data/projects';

// Data real da última auditoria e publicação das páginas do portfólio v3.0
const LAST_AUDITED_DATE = new Date('2026-10-27T13:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://eliasreis.dev';

  const staticRoutes = [
    '',
    '/sobre',
    '/experiencia',
    '/projetos',
    '/competencias',
    '/formacao',
    '/curriculo',
    '/contato',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: LAST_AUDITED_DATE,
    changeFrequency: route === '' ? ('weekly' as const) : ('monthly' as const),
    priority: route === '' ? 1.0 : 0.8,
  }));

  const projectRoutes = PROJECTS.map((p) => ({
    url: `${baseUrl}/projetos/${p.slug}`,
    lastModified: LAST_AUDITED_DATE,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}
