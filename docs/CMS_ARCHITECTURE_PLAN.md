# Plano de Arquitetura e Migração — CMS Administrativo Seguro
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0`)
**Data:** 2026-11-05
**Branch de Desenvolvimento:** `feat/admin-cms-panel`
**Ambiente Alvo:** Vercel Serverless + PostgreSQL Gerenciado (Neon / Vercel Postgres)
**Versões Base:** Next.js 16.4.3 (App Router / Webpack) • React 19.2.8 • TypeScript 5 • Tailwind CSS v4

---

## 1. Visão Geral e Princípios Fundamentais

O objetivo deste módulo é implementar um painel administrativo privado e seguro (CMS) que permita ao proprietário gerenciar certificados, cursos, habilidades, formação acadêmica, projetos e arquivos de mídia diretamente pela web, com publicação imediata no portfólio público sem necessidade de commits Git ou novos deploys na Vercel.

### Princípios Inegociáveis:
1. **Preservação Integral dos Dados:** Os 65 cursos existentes e as 2.164,5 horas de formação já homologadas no portfólio devem ser preservados sem qualquer divergência ou perda.
2. **Resiliência e Fallback Seguro:** Se a conexão com o banco de dados estiver temporariamente indisponível ou não configurada (ex: suítes de CI ou testes locais rápidos), as páginas públicas continuam operacionais utilizando os dados estáticos auditados como fallback.
3. **Autenticação Soberana via Google OIDC:** Acesso restrito com exclusividade à conta Google autorizada, verificando o identificador imutável `sub` e `email` no servidor.
4. **Defesa em Profundidade:** Autorização server-side em cada Server Action / API route, proteção CSRF, validação com Zod, cookies HttpOnly criptografados e registro de auditoria (`AuditLog`).
5. **Design System Cyberpunk e WCAG 2.2 AA:** Interface administrativa aderente ao visual existente do portfólio, com tema escuro/claro, navegação por teclado e sem uso de Bootstrap.

---

## 2. Mapa de Páginas e Rotas Administrativas

| Rota | Descrição | Acesso |
| :--- | :--- | :---: |
| `/admin/login` | Página de autenticação via Google OAuth 2.0 / OIDC | Público (Rate-Limited) |
| `/admin` | Dashboard administrativo com totais reais e alertas | Restrito (Admin) |
| `/admin/certificates` | Listagem, busca, filtros e ações de certificados | Restrito (Admin) |
| `/admin/certificates/new` | Cadastro de novo certificado com upload de documento | Restrito (Admin) |
| `/admin/certificates/[id]` | Edição de certificado existente e pré-visualização | Restrito (Admin) |
| `/admin/skills` | Gestão de competências técnicas, níveis e ordenação | Restrito (Admin) |
| `/admin/education` | Gestão de formação técnica e acadêmica | Restrito (Admin) |
| `/admin/projects` | Gestão de estudos de caso e projetos práticos | Restrito (Admin) |
| `/admin/activity` | Histórico cronológico de acessos e ações (`AuditLog`) | Restrito (Admin) |
| `/admin/settings` | Configurações do painel, status do banco e cache | Restrito (Admin) |
| `/api/auth/[...nextauth]` ou `/api/auth/google` | Endpoint de autenticação e callback OIDC | Servidor |
| `/api/admin/upload` | Endpoint seguro para upload de PDFs e imagens | Restrito (Admin) |

---

## 3. Modelo de Entidades do Banco de Dados (PostgreSQL)

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│          Administrator          │       │           AuditLog              │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: String (UUID) [PK]          │       │ id: String (UUID) [PK]          │
│ googleSub: String [Unique]      │       │ action: String                  │
│ email: String [Unique]          │       │ entityType: String              │
│ name: String                    │       │ entityId: String?               │
│ avatarUrl: String?              │       │ details: Json?                  │
│ role: String ('SUPER_ADMIN')    │       │ ipHash: String                  │
│ lastLoginAt: DateTime?          │       │ adminEmail: String              │
│ createdAt / updatedAt: DateTime │       │ adminSub: String                │
└─────────────────────────────────┘       │ createdAt: DateTime             │
                                          └─────────────────────────────────┘

┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│           Certificate           │       │              Skill              │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: String [PK] (slug estável)  │◄──┐   │ id: String [PK]                 │
│ title: String                   │   │   │ name: String [Unique]           │
│ institution: String             │   │   │ category: String                │
│ institutionGroup: String        │   │   │ description: String?            │
│ technologyProvider: String?     │   │   │ proficiencyLevel: String?       │
│ issuerPriority: String          │   │   │ iconName: String?               │
│ credentialType: String          │   │   │ displayOrder: Int               │
│ workloadHours: Float?           │   │   │ published: Boolean (default true)│
│ startDate / endDate: String?    │   │   │ createdAt / updatedAt: DateTime │
│ issuedAt: String?               │   │   └────────────────┬────────────────┘
│ category: String                │   │                    │
│ credentialAssetUrl: String?     │   │   ┌────────────────▼────────────────┐
│ verificationUrl: String?        │   │   │        CertificateSkill         │
│ credentialCode: String?         │   └───┤ certificateId: String [PK]      │
│ published: Boolean              │       │ skillId: String [PK]            │
│ displayOrder: Int               │       └─────────────────────────────────┘
│ verificationStatus: String      │
│ sourceFile: String?             │
│ createdAt / updatedAt: DateTime │
└─────────────────────────────────┘

┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│            Education            │       │           MediaAsset            │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: String [PK]                 │       │ id: String (UUID) [PK]          │
│ institution: String             │       │ fileName: String                │
│ degree: String                  │       │ storedKey: String [Unique]      │
│ fieldOfStudy: String            │       │ mimeType: String                │
│ startDate / endDate: String?    │       │ sizeBytes: Int                  │
│ isCurrent: Boolean              │       │ assetType: String (pdf/image)   │
│ description: String?            │       │ url: String                     │
│ published: Boolean              │       │ isPublic: Boolean               │
│ displayOrder: Int               │       │ uploadedByAdminSub: String      │
│ createdAt / updatedAt: DateTime │       │ createdAt / updatedAt: DateTime │
└─────────────────────────────────┘       └─────────────────────────────────┘

┌─────────────────────────────────┐
│             Project             │
├─────────────────────────────────┤
│ id: String [PK]                 │
│ slug: String [Unique]           │
│ title: String                   │
│ summary: String                 │
│ context: String                 │
│ problem: String                 │
│ solution: String                │
│ architecture: Json              │
│ technologies: Json              │
│ securityControls: Json          │
│ testing: Json                   │
│ outcomes: Json                  │
│ links: Json                     │
│ published: Boolean              │
│ displayOrder: Int               │
│ createdAt / updatedAt: DateTime │
└─────────────────────────────────┘
```

---

## 4. Escolha Tecnológica: Prisma ORM vs Drizzle ORM

- **Solução Selecionada:** **Prisma ORM** com adaptador compatível com Neon/Vercel Postgres (`@prisma/adapter-pg` ou `@prisma/client`).
- **Justificativa:**
  1. Suporte oficial a migrações versionadas em diretórios (`prisma/migrations/`), garantindo que alterações estruturais sejam aplicadas de forma determinística na Vercel via comando de build (`prisma migrate deploy`).
  2. Ecossistema consolidado de seeds (`prisma/seed.ts`), facilitando a carga inicial idempotente dos 65 cursos existentes.
  3. Tipagem estrita com validação automática integrada aos Schemas Zod já existentes no projeto.

---

## 5. Estratégia de Migração Idempotente dos 65 Cursos (2.164,5h)

1. **Origem dos Dados:** [`Currículo/frontend/src/data/courses.ts`](file:///c:/Users/elias.reis/Desktop/Curr-culo-v.2.0-main/Currículo/frontend/src/data/courses.ts).
2. **Script de Seed:** `scripts/seed-cms-data.ts`.
3. **Procedimento:**
   - Para cada curso em `COURSES`, executa `upsert` baseado no `id` estável.
   - Extrai as habilidades associadas em `course.skills` e popula a tabela `Skill` e a junção `CertificateSkill`.
   - Ao final da execução, realiza uma consulta de agregação no banco e verifica:
     - `COUNT(Certificate) == 65`
     - `SUM(workloadHours) == 2164.5`
     - Se houver qualquer divergência, a transação sofre rollback e emite erro bloqueador.
4. **Camada de Acesso Resiliente (Repository Pattern):**
   - Criar `src/services/certificateService.ts`.
   - Se `DATABASE_URL` estiver configurado e o banco acessível: consulta `Certificate` no banco (onde `published == true`).
   - Se `DATABASE_URL` não estiver configurado ou ocorrer falha de rede temporária: retorna `COURSES` estáticos locais. Isso previne que o site público fique fora do ar caso o banco sofra manutenção.

---

## 6. Autenticação Google OAuth 2.0 / OpenID Connect

1. **Variáveis de Ambiente Necessárias:**
   - `GOOGLE_CLIENT_ID`: ID do cliente OAuth gerado no Google Cloud Console.
   - `GOOGLE_CLIENT_SECRET`: Segredo do cliente OAuth.
   - `GOOGLE_ADMIN_SUB`: Identificador imutável (`sub`) da conta Google autorizada.
   - `GOOGLE_ADMIN_EMAIL`: E-mail oficial da conta Google autorizada (ex: `elias.re_is@hotmail.com` ou Gmail associado).
   - `AUTH_SECRET`: Chave simétrica de 256 bits para criptografia de cookies de sessão (JWE).
2. **Fluxo de Autorização:**
   - Usuário clica em "Entrar com Google" em `/admin/login`.
   - Redirecionamento para o consentimento do Google solicitando apenas escopos básicos: `openid`, `email`, `profile`.
   - No callback do servidor:
     1. Validação da assinatura do ID Token emitido pelo Google.
     2. Verificação estrita: `token.sub === process.env.GOOGLE_ADMIN_SUB` E/OU `token.email === process.env.GOOGLE_ADMIN_EMAIL`.
     3. Se não corresponder: a sessão é negada e destruída imediatamente, registrando o incidente no `AuditLog` como tentativa não autorizada.
     4. Se corresponder: emite cookie de sessão seguro (`HttpOnly`, `SameSite=Lax`, `Secure`, `Path=/admin`).

---

## 7. Gerenciamento de Arquivos e Uploads Seguros

1. **Armazenamento:** Compatível com **Vercel Blob** (ou storage em disco local para desenvolvimento).
2. **Validações Obrigatórias antes da Gravação:**
   - Limite de tamanho máximo: 5 MB por documento.
   - Tipos MIME permitidos: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`.
   - Validação de Magic Bytes no servidor: verificação dos primeiros bytes do arquivo (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`, `RIFF...WEBP`) para impedir mascaramento de executáveis.
   - Renomeação segura: nome do arquivo salvo é gerado via UUIDv4 com extensão normalizada (`[uuid].[ext]`).
   - Servidor com cabeçalhos de download: `Content-Disposition: inline; filename="..."` e `X-Content-Type-Options: nosniff`.

---

## 8. Publicação em Tempo Real sem Deploys (On-Demand ISR)

Ao alterar o status de um certificado para "Publicado":
1. Atualiza `published = true` no PostgreSQL.
2. Invoca as funções de revalidação nativas do Next.js:
   - `revalidatePath('/curriculo')`
   - `revalidatePath('/formacao')`
   - `revalidatePath('/')`
   - `revalidateTag('certificates')`
3. Registra a ação no `AuditLog`.
4. O visitante externo vê o certificado no ar no próximo acesso sem que seja necessário nenhum deploy ou commit Git.

---

## 9. Plano de Execução por Fases

- [x] **Fase 1: Auditoria da arquitetura atual e plano de migração.** (Concluída nesta etapa)
- [x] **Fase 2: Banco de dados e persistência (Prisma + Migrations + Seeder idempotente de 65 cursos).** (Concluída nesta etapa)
- [ ] **Fase 3: Autenticação Google OIDC e proteção administrativa (Auth.js / Jose + Middleware de sessão).**
- [ ] **Fase 4: Dashboard administrativo (`/admin`) com métricas reais e identidade Cyberpunk.**
- [ ] **Fase 5: CRUD de certificados (`/admin/certificates`) com upload seguro.**
- [ ] **Fase 6: CRUD de habilidades e formação (`/admin/skills` e `/admin/education`).**
- [ ] **Fase 7: Gerenciamento de projetos e mídia (`/admin/projects`).**
- [ ] **Fase 8: Integração do conteúdo dinâmico ao portfólio público com revalidação sob demanda.**
- [ ] **Fase 9: Hardening, QA e testes de segurança automatizados.**
- [ ] **Fase 10: Homologação na Vercel e publicação autorizada na branch `main`.**

