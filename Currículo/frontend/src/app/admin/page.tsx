import React from 'react';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/serverAuth';
import { getCmsDashboardMetrics } from '@/services/cmsDataService';
import {
  Award,
  Clock,
  Sparkles,
  FolderGit2,
  Database,
  ShieldCheck,
  ArrowRight,
  Activity,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const metrics = await getCmsDashboardMetrics();

  return (
    <div className="space-y-8">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-zinc-950 to-blue-950/40 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sessão Autenticada // SUPER_ADMIN</span>
            </div>
            <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-white">
              Olá, {session.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Painel de controle administrativo do portfólio profissional Currículo v3.0.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-mono ${
                metrics.databaseConnected
                  ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-950/30 text-amber-300'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>
                {metrics.databaseConnected
                  ? 'POSTGRESQL // CONECTADO'
                  : 'MODO FALLBACK // RESILIENTE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Cursos & Certificados */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Cursos Cadastrados
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{metrics.totalCertificates}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {metrics.publishedCertificates} publicados no portfólio
          </p>
        </div>

        {/* Card 2: Carga Horária Total */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Carga Horária
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-950/40 text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {metrics.totalWorkloadHours.toLocaleString('pt-BR')}h
          </p>
          <p className="mt-1 text-xs text-zinc-400">Horas verificadas com comprovantes</p>
        </div>

        {/* Card 3: Habilidades Mapeadas */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Habilidades
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-950/40 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{metrics.totalSkills}</p>
          <p className="mt-1 text-xs text-zinc-400">Competências associadas a certificados</p>
        </div>

        {/* Card 4: Projetos & Estudos de Caso */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Estudos de Caso
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
              <FolderGit2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{metrics.totalProjects}</p>
          <p className="mt-1 text-xs text-zinc-400">Projetos em destaque no portfólio</p>
        </div>
      </div>

      {/* Módulos de Acesso Rápido */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Módulos Administrativos</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/admin/certificates"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-cyan-500/30 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-950/30 text-cyan-400">
                <Award className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Gerenciar Certificados</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Cadastrar, editar, ordenar e publicar novos cursos ou certificados com upload de comprovantes.
            </p>
          </Link>

          <Link
            href="/admin/skills"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-cyan-500/30 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-950/30 text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-purple-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Gerenciar Habilidades</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Organizar competências técnicas, categorias e vincular cursos a tecnologias específicas.
            </p>
          </Link>

          <Link
            href="/admin/projects"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-cyan-500/30 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-950/30 text-emerald-400">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Gerenciar Projetos</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Atualizar arquiteturas, soluções, tecnologias e links dos estudos de caso em destaque.
            </p>
          </Link>
        </div>
      </div>

      {/* Informações de Infraestrutura e Auditoria */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-xs text-zinc-400">
        <div className="flex items-center gap-2 font-medium text-zinc-200">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span>Status do Sistema & Conformidade de Segurança</span>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p><span className="text-zinc-500">Administrador Autenticado:</span> {session.email}</p>
            <p><span className="text-zinc-500">Identificador Imutável Google (sub):</span> {session.sub}</p>
            <p><span className="text-zinc-500">Nível de Permissão:</span> {session.role}</p>
          </div>
          <div className="space-y-1">
            <p><span className="text-zinc-500">Segurança de Sessão:</span> JWT assinado (HMAC SHA-256) em cookie HttpOnly / SameSite: Lax</p>
            <p><span className="text-zinc-500">Proteção de Rotas:</span> Edge Middleware + Verificação Obrigatória no Servidor</p>
            <p><span className="text-zinc-500">Trilha de Auditoria:</span> Ativa na tabela AuditLog do PostgreSQL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
