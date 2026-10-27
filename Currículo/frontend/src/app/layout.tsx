import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CyberMatrixBackground } from '@/components/effects/CyberMatrixBackground';
import { PROFILE } from '@/data/profile';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${PROFILE.name} | ${PROFILE.role}`,
  description: `Portfólio profissional de ${PROFILE.name} - ${PROFILE.headline}`,
  keywords: [
    PROFILE.name,
    'Analista de Sistemas',
    'Desenvolvedor Full Stack',
    'Java',
    'Spring Boot',
    'React',
    'TypeScript',
    'Python',
    'Next.js',
    'Cibersegurança',
    'AWS Cloud',
    'Azure',
    'IA Generativa',
    'APIs REST',
    'Docker',
  ],
  authors: [{ name: PROFILE.name }],
  creator: PROFILE.name,
  metadataBase: new URL('https://eliasreis.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${PROFILE.name} | ${PROFILE.role}`,
    description: `Portfólio interativo com projetos verificados, certificações e trajetória técnica em sistemas, dados, cloud e IA.`,
    url: 'https://eliasreis.dev',
    siteName: `Portfólio ${PROFILE.name}`,
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PROFILE.name} | ${PROFILE.role}`,
    description: `Portfólio interativo com projetos verificados, certificações e trajetória técnica em sistemas, dados, cloud e IA.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://eliasreis.dev/#person',
      name: PROFILE.name,
      jobTitle: PROFILE.role,
      description: PROFILE.headline,
      url: 'https://eliasreis.dev',
      sameAs: [
        PROFILE.github,
        PROFILE.linkedin,
      ],
      alumniOf: {
        '@type': 'EducationalOrganization',
        name: 'SENAI Suíço-Brasileiro Paulo Ernesto Tolle',
      },
      knowsAbout: [
        'Software Engineering',
        'Java',
        'Spring Boot',
        'React',
        'TypeScript',
        'Python',
        'REST APIs',
        'Docker',
        'Cloud Computing (AWS/Azure)',
        'Cybersecurity',
        'Generative AI',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://eliasreis.dev/#website',
      url: 'https://eliasreis.dev',
      name: `Portfólio de Engenharia de Software - ${PROFILE.name}`,
      description: PROFILE.headline,
      publisher: {
        '@id': 'https://eliasreis.dev/#person',
      },
      inLanguage: 'pt-BR',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                  if (saved === 'light' || (!saved && prefersLight)) {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0d1515] text-[#dce4e4] antialiased selection:bg-[#00f2ff] selection:text-[#00363a] relative min-h-screen">
        {/* Skip to main content link para Acessibilidade WCAG 2.2 AA */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#00f2ff] focus:text-[#00363a] focus:font-bold focus:rounded focus:outline-none focus:ring-2 focus:ring-[#00f2ff]"
        >
          Pular para o conteúdo principal
        </a>

        {/* Global Instance of Cyber Matrix Background */}
        <CyberMatrixBackground variant="letter-glitch" opacity={0.1} />
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
