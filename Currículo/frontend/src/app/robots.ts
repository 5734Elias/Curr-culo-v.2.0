import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/design-system'],
    },
    sitemap: 'https://eliasreis.dev/sitemap.xml',
  };
}
