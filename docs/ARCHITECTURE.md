# Arquitetura de Software — Portfólio Profissional v3.0

**Autor:** Elias Ribeiro dos Reis  
**Status:** Aprovado em Produção  
**Versão:** 3.0.0  

---

## 1. Visão Geral e Princípios Fundamentais

O projeto foi concebido seguindo os princípios de engenharia de software contemporânea:
- **Separação de Preocupações (SoC):** Isolamento entre camada de apresentação, serviços de negócio, validação e dados.
- **Single Source of Truth (SSoT / DRY):** Dados pessoais, URLs sociais e metadados residem exclusivamente em `src/data/profile.ts`, consumidos dinamicamente por layouts, footers e JSON-LD.
- **Fail-Safe & Graceful Degradation:** Na ausência de credenciais de serviços de e-mail, o sistema não simula falso sucesso; ele apresenta fallback transparente para o cliente de e-mail do usuário.
- **Privacy & Security by Design:** Anonimização de dados de telemetria e IP em conformidade com a LGPD.

---

## 2. Diagrama de Camadas da Aplicação

```text
[ Cliente Web / Navegador ]
         │  (HTTPS / TLS 1.3)
         ▼
[ Camada de Roteamento Next.js 16 (App Router) ]
   ├── Layout Global (HTML, Metadados Canônicos, Script Anti-FOUC de Tema)
   ├── Páginas Estáticas (SSG):
   │     /, /sobre, /experiencia, /competencias, /formacao, /curriculo
   ├── Páginas Dinâmicas Pré-renderizadas (SSG):
   │     /projetos/[slug] (via generateStaticParams)
   └── API Serverless (Route Handler):
         POST /api/contact
               │
               ▼
[ Camada de Proteção & Segurança (src/lib/) ]
   ├── extractClientIp (Sanitização de proxy e x-forwarded-for)
   ├── hashIpForPrivacy (Anonimização SHA-256 com salt)
   └── checkRateLimit (Controle de vazão por janela deslizante)
               │
               ▼
[ Camada de Validação (src/schemas/) ]
   └── ContactPayloadSchema (Validação estrita com Zod + Honeypot)
               │
               ▼
[ Camada de Serviços (src/services/) ]
   └── contactService.ts (Abstração de mensageria com Resend / Mock)
```

---

## 3. Padrões de Componentização

- **Atomicidade e Composição:** Componentes da pasta `src/components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `FeedbackStates`) são puros e não acoplados a fontes de dados de domínio.
- **Desacoplamento de Tipagem:** A pasta `src/types/` define contratos TypeScript de alto nível (`ProfileData`, `ProjectCase`, `Course`), desvinculados dos validadores de runtime do Zod.
- **Tema Claro/Escuro:** Gerenciado pelo `ThemeToggle` com sincronização via `useSyncExternalStore` e `MutationObserver`, eliminando renderizações em cascata e estado redundante.

