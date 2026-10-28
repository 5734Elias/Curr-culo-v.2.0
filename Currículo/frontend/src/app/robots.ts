import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/design-system'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
