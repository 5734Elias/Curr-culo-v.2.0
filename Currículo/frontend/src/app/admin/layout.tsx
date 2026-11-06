import React from 'react';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/serverAuth';
import { Shield, LogOut, ExternalLink, LayoutDashboard, Award, Sparkles, FolderGit2 } from 'lucide-react';

export const metadata = {
  title: 'Painel Administrativo | Portfólio Profissional CMS',
  description: 'Área restrita de gestão de certificados, habilidades e projetos.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Se não houver sessão ativa (ex: tela de login /admin/login), renderiza apenas os filhos
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Barra de Navegação Superior do CMS */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Identidade Visual do CMS */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/50 text-cyan-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  PORTFÓLIO CMS
                </span>
                <span className="block font-mono text-[10px] text-zinc-500">v3.0 // ZERO TRUST</span>
              </div>
            </Link>

            {/* Links Rápidos de Navegação */}
            <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-zinc-800 pl-6 text-sm">
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-cyan-400"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Painel</span>
              </Link>
              <Link
                href="/admin/certificates"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-cyan-400"
              >
                <Award className="h-4 w-4" />
                <span>Certificados</span>
              </Link>
              <Link
                href="/admin/skills"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-cyan-400"
              >
                <Sparkles className="h-4 w-4" />
                <span>Habilidades</span>
              </Link>
              <Link
                href="/admin/projects"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-cyan-400"
              >
                <FolderGit2 className="h-4 w-4" />
                <span>Projetos</span>
              </Link>
            </nav>
          </div>

          {/* Perfil do Administrador e Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-zinc-200">{session.name}</span>
              <span className="font-mono text-[10px] text-cyan-400">{session.email}</span>
            </div>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-300"
            >
              <span>Ver Portfólio</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <a
              href="/api/auth/logout"
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:border-red-500/40 hover:bg-red-900/40"
              title="Encerrar sessão com segurança"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo da Página */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

