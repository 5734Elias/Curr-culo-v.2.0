'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, AlertTriangle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const logout = searchParams.get('logout');

  // Mapeamento semântico de erros para mensagens amigáveis em português
  let alertBanner = null;

  if (logout === 'success') {
    alertBanner = (
      <div
        role="status"
        className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-200"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="font-semibold text-emerald-300">Sessão Encerrada</p>
          <p className="text-sm text-emerald-200/80">Você saiu com sucesso do painel administrativo.</p>
        </div>
      </div>
    );
  } else if (error) {
    let errorTitle = 'Acesso Não Autorizado';
    let errorMessage = 'Não foi possível autenticar sua conta Google.';

    switch (error) {
      case 'AccessDenied':
        errorTitle = 'Acesso Negado (Zero Trust)';
        errorMessage =
          'Esta conta Google não está autorizada a administrar este portfólio. Apenas a conta Google oficial e o identificador imutável (sub) do proprietário possuem permissão.';
        break;
      case 'SubNotConfigured':
        errorTitle = 'Identificador Google (sub) Pendente';
        errorMessage =
          'Por segurança Zero Trust, o login em produção exige que o identificador imutável GOOGLE_ADMIN_SUB esteja previamente configurado nas variáveis de ambiente.';
        break;
      case 'RateLimitExceeded':
        errorTitle = 'Muitas Tentativas de Autenticação';
        errorMessage =
          'O limite de tentativas de login para o seu endereço IP foi atingido temporariamente. Aguarde alguns minutos antes de tentar novamente.';
        break;
      case 'ConfigurationError':
        errorTitle = 'Configuração Pendente';
        errorMessage =
          'As credenciais do Google OAuth ou do banco de dados ainda não foram configuradas nas variáveis de ambiente do servidor.';
        break;
      case 'SessionExpired':
        errorTitle = 'Sessão Expirada';
        errorMessage = 'Sua sessão administrativa expirou. Por favor, faça login novamente.';
        break;
      case 'StateMismatch':
        errorTitle = 'Falha de Validação CSRF';
        errorMessage = 'Ocorreu uma divergência de segurança na validação de estado. Tente novamente.';
        break;
      case 'PkceMissing':
        errorTitle = 'Falha de Validação PKCE';
        errorMessage =
          'O verificador criptográfico PKCE expirou ou estava ausente na requisição. Inicie o login novamente.';
        break;
      case 'Cancelled':
        errorTitle = 'Login Cancelado';
        errorMessage = 'O procedimento de login com a conta Google foi cancelado.';
        break;
      default:
        errorTitle = 'Falha na Autenticação';
        errorMessage = 'Ocorreu um erro inesperado ao processar a autenticação. Tente novamente.';
    }

    alertBanner = (
      <div
        role="alert"
        className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-4 text-red-200"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div>
          <p className="font-semibold text-red-300">{errorTitle}</p>
          <p className="text-sm text-red-200/80">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-zinc-950/90 p-8 shadow-2xl backdrop-blur-xl">
      {/* Cabeçalho do Card */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <Shield className="h-7 w-7" />
        </div>
        <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 font-mono text-xs tracking-wider text-cyan-300">
          PAINEL PRIVADO // CMS
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
          Acesso Administrativo
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Área de gestão do portfólio profissional com autenticação segura Google OpenID Connect.
        </p>
      </div>

      {/* Banner de Status ou Erro */}
      {alertBanner}

      {/* Botão de Ação Google OAuth */}
      <div className="space-y-4">
        <a
          href="/api/auth/google"
          className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3.5 font-medium text-white shadow-lg shadow-cyan-900/30 transition-all duration-200 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-[0.98]"
        >
          {/* Ícone estilizado do Google */}
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Entrar com Google</span>
        </a>

        {/* Políticas de Segurança */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-medium text-zinc-300">
            <Lock className="h-4 w-4 text-cyan-400" />
            <span>Controles de Cibersegurança Ativos</span>
          </div>
          <ul className="mt-2 space-y-1.5 pl-6 list-disc text-zinc-400">
            <li>Autenticação restrita exclusivamente à conta do proprietário.</li>
            <li>Tokens e sessões validados integralmente no servidor (HttpOnly / SameSite).</li>
            <li>Proteção anti-CSRF e monitoramento de eventos em trilha de auditoria.</li>
          </ul>
        </div>

        {/* Link de Retorno ao Portfólio */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-cyan-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao Portfólio Público</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
      {/* Background Decorativo Cyberpunk */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center gap-3 font-mono text-sm text-cyan-400">
            <KeyRound className="h-5 w-5 animate-spin" />
            <span>Inicializando ambiente seguro...</span>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </main>
  );
}

