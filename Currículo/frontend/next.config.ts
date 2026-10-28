import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

// Em produção, 'unsafe-eval' é estritamente eliminado.
// 'unsafe-inline' em script-src é mantido exclusivamente para hidratação estática do Next.js App Router,
// enquanto 'script-src-attr' é configurado como 'none' para impedir handlers inline maliciosos (onclick, onerror, etc.).
const scriptSrcDirectives = [
  "'self'",
  ...(isProduction ? [] : ["'unsafe-eval'"]),
  "'unsafe-inline'",
].join(' ');

const cspHeader = `
  default-src 'self';
  script-src ${scriptSrcDirectives};
  script-src-attr 'none';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://api.resend.com;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  form-action 'self';
  ${isProduction ? 'upgrade-insecure-requests;' : ''}
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
