/**
 * Configuração centralizada de domínio e modo de contato do Portfólio v3.0.
 *
 * Permite operar no domínio gratuito `.vercel.app` da Vercel sem retrabalho de código
 * quando um domínio próprio for adquirido e conectado futuramente.
 */

export const DEFAULT_VERCEL_DOMAIN = 'https://curr-culo-v-2-0-8kbn.vercel.app';

/**
 * Retorna a URL base canônica do portfólio (sem barra final).
 * Ordem de prioridade:
 * 1. `NEXT_PUBLIC_SITE_URL` (definida quando um domínio próprio for adquirido, ex: https://eliasreis.dev)
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` (injetada automaticamente pela Vercel com o domínio principal do projeto)
 * 3. `DEFAULT_VERCEL_DOMAIN` (`https://curr-culo-v-2-0-8kbn.vercel.app`)
 */
export function getSiteUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, '');
  }

  const vercelProdHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProdHost) {
    const normalized = vercelProdHost.startsWith('http')
      ? vercelProdHost
      : `https://${vercelProdHost}`;
    return normalized.replace(/\/+$/, '');
  }

  return DEFAULT_VERCEL_DOMAIN;
}

/**
 * Indica se o envio automático via API (`/api/contact` + Resend com domínio verificado)
 * está habilitado na interface.
 *
 * Enquanto o projeto utilizar apenas o domínio gratuito `.vercel.app` sem domínio de e-mail
 * próprio verificado via DNS no Resend, permanece `false` por padrão, utilizando o fluxo
 * transparente de envio direto via aplicativo de e-mail (`mailto:`).
 *
 * Para ativar futuramente após verificar o domínio no Resend, basta definir:
 * `NEXT_PUBLIC_CONTACT_API_ENABLED="true"` nas variáveis de ambiente da Vercel.
 */
export function isContactApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CONTACT_API_ENABLED === 'true';
}

