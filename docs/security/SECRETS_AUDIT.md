# Auditoria de Segredos & Variáveis de Ambiente (Secrets Audit)
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0-main`)
**Data:** 2026-11-05
**Auditor Responsável:** DevSecOps Engineer & AppSec
**Critério:** OWASP Top 10 A07 (Identification and Authentication Failures) / Zero Exposed Secrets

---

## 1. Mapeamento de Variáveis de Ambiente

### 1.1 Variáveis Privadas (Exclusivas de Servidor - Node.js Runtime)
As seguintes variáveis operam estritamente no servidor e **NUNCA** devem ser expostas ao navegador do visitante nem comitadas em repositórios:

| Variável | Finalidade | Criticidade | Local de Configuração |
| :--- | :--- | :--- | :--- |
| **`RESEND_API_KEY`** | Autenticação na API de e-mail Resend | **ALTA** | Painel de Ambiente Vercel (Produção/Preview) |
| **`CONTACT_FROM_EMAIL`** | Remetente verificado de domínio próprio | **MÉDIA** | Painel de Ambiente Vercel |
| **`CONTACT_DESTINATION_EMAIL`** | Destinatário das mensagens (`elias.re_is@hotmail.com`) | **BAIXA** | Painel de Ambiente Vercel ou `.env.local` |
| **`UPSTASH_REDIS_REST_URL`** | URL de conexão REST do cluster Redis | **MÉDIA** | Painel de Ambiente Vercel |
| **`UPSTASH_REDIS_REST_TOKEN`** | Token de autorização Bearer do cluster Redis | **ALTA** | Painel de Ambiente Vercel |
| **`RATE_LIMIT_SALT`** | Salt efêmero/fixo para anonimização LGPD de IP | **MÉDIA** | Painel de Ambiente Vercel |
| **`RATE_LIMIT_ALLOW_DEGRADED_FALLBACK`** | Flag para permitir fallback local se Redis cair | **BAIXA** | Opcional (Padrão: `"false"`) |
| **`RATE_LIMIT_ALLOW_UNCONFIGURED_IN_PROD`** | Flag para permitir ausência de Redis em prod | **BAIXA** | Opcional (Padrão: `"false"`) |

### 1.2 Variáveis Públicas (Embutidas no Bundle Cliente pelo Next.js)
As seguintes variáveis utilizam o prefixo `NEXT_PUBLIC_` e são públicas por design:

| Variável | Finalidade | Sensibilidade |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_SITE_URL`** | URL canônica do site (`https://curr-culo-v-2-0-8kbn.vercel.app`) | **PÚBLICA / NÃO CONFIDENCIAL** |
| **`NEXT_PUBLIC_CONTACT_API_ENABLED`** | Flag booleana (`"false"` ou `"true"`) que ativa o formulário via API | **PÚBLICA / NÃO CONFIDENCIAL** |

---

## 2. Auditoria de Arquivos e Código-Fonte

1. **Varredura de Arquivos de Configuração (`.env`):**
   - Não foram encontrados arquivos `.env`, `.env.local`, `.env.production` com credenciais ativas no repositório.
   - O arquivo `.gitignore` bloqueia explicitamente `.env`, `.env*.local` e diretórios `.next/`.
2. **Auditoria do `.env.example`:**
   - O arquivo `.env.example` contém apenas marcadores de posição vazios (`""`) e descrições técnicas de uso.
   - Nenhuma chave secreta foi configurada com prefixo `NEXT_PUBLIC_`.
3. **Varredura no Código-Fonte:**
   - Nenhuma string no formato `re_` (Resend API Key) ou tokens Base64 hardcoded foram encontrados no código.
   - Chamadas a `process.env.RESEND_API_KEY` e `process.env.UPSTASH_REDIS_REST_TOKEN` ocorrem exclusivamente em `src/services/` e `src/lib/` no ambiente de servidor.
4. **Verificação de Histórico Git:**
   - O workspace atual é oriundo de pacote de distribuição sem pasta `.git` ativa no diretório de trabalho. Recomenda-se rodar Gitleaks na esteira de CI do repositório remoto caso novos commits sejam gerados.

---

## 3. Procedimento Seguro para Configuração em Produção (Vercel)
1. Acessar o dashboard do projeto na Vercel: **Project Settings > Environment Variables**.
2. Adicionar cada variável com escopo **Production** e **Preview**.
3. Marcar as opções de criptografia padrão da Vercel para segredos sensíveis.
4. Nunca compartilhar valores reais de tokens por e-mail ou canais abertos.
