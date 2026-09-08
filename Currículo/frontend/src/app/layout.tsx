import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CyberMatrixBackground } from '@/components/effects/CyberMatrixBackground';

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
  title: 'Elias Ribeiro dos Reis | Analista de Sistemas & Desenvolvedor',
  description:
    'Portfólio profissional de Elias Ribeiro dos Reis - Analista de Sistemas e Desenvolvedor especializado em Software, Cloud AWS/Azure, IA Generativa (Google Antigravity & Microsoft AI Foundry) e Cibersegurança (Fortinet).',
  keywords: [
    'Elias Ribeiro dos Reis',
    'Analista de Sistemas',
    'Desenvolvedor Full-Stack',
    'Python',
    'TypeScript',
    'Next.js',
    'Cibersegurança',
    'Fortinet',
    'AWS Cloud',
    'IA Generativa',
    'Google Antigravity',
  ],
  authors: [{ name: 'Elias Ribeiro dos Reis' }],
  creator: 'Elias Ribeiro dos Reis',
  metadataBase: new URL('https://eliasreis.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Elias Ribeiro dos Reis | Analista de Sistemas & Desenvolvedor',
    description:
      'Portfólio interativo com projetos verificados, certificações SENAI/Fortinet/AWS/Microsoft e trajetória técnica em sistemas, dados, cloud e IA.',
    locale: 'pt_BR',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Elias Ribeiro dos Reis',
  jobTitle: 'Analista de Sistemas & Desenvolvedor Full-Stack',
  url: 'https://eliasreis.dev',
  sameAs: [
    'https://github.com/5734Elias',
    'https://www.linkedin.com/in/elias-ribeiro-dos-reis-b7791b291',
  ],
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'SENAI Suíço-Brasileiro Paulo Ernesto Tolle',
  },
  knowsAbout: [
    'Software Engineering',
    'Generative AI',
    'Google Antigravity',
    'Microsoft AI Foundry',
    'Cybersecurity',
    'Fortinet',
    'AWS Cloud',
    'Python',
    'TypeScript',
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0d1515] text-[#dce4e4] antialiased selection:bg-[#00f2ff] selection:text-[#00363a] relative min-h-screen">
        {/* Single Global Instance of Cyber Matrix Background */}
        <CyberMatrixBackground variant="letter-glitch" opacity={0.1} />
        {children}
      </body>
    </html>
  );
}
