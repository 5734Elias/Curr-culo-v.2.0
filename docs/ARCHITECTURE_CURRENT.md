# Arquitetura Atual do Sistema (Currículo v2.0)

**Data:** 2026-10-27  
**Projeto:** Currículo Digital v2.0  

---

## 1. Visão Arquitetural

A aplicação é construída com **Next.js (App Router)**, operando principalmente com componentes Server-Side Rendered (SSG / Static Rendering) e componentes de interface interativos (Client Components com `'use client'`).

```
[ Usuário / Navegador ]
        │
        ▼
[ Next.js App Router (frontend/src/app) ]
   ├── Layout Global (HTML, Metadata, JSON-LD, Fontes, Matriz de Fundo)
   ├── Rotas Estáticas: /, /sobre, /experiencia, /competencias, /formacao, /curriculo, /design-system
   ├── Rotas Dinâmicas (SSG): /projetos, /projetos/[slug]
   └── API Serverless: POST /api/contact
```

---

## 2. Camadas do Frontend

### 2.1 Camada de Dados (`src/data/`)
- `profile.ts`: Dados biográficos, títulos, contatos e redes sociais.
- `projects.ts`: Dados estruturados dos 4 projetos principais (arquitetura, tecnologias, resultados).
- `courses.ts`: Banco de 65 cursos auditados e normalizados por instituição (SENAI, Ka Solution, Bradesco, etc.).
- `experiences.ts`: Experiências profissionais com responsabilidades e métricas.

### 2.2 Camada de Validação (`src/schemas/`)
- `content.ts`: Schemas Zod para cursos, projetos, experiências e payload de contato.

### 2.3 Camada de Componentes (`src/components/`)
- `layout/`: Navbar, Footer.
- `ui/`: Button, Card, Badge, Modal, SectionHeader, Icons.
- `motion/`: Reveal, StaggerGroup (animações baseadas em IntersectionObserver / CSS).
- `effects/`: CyberMatrixBackground, ThreadsBackground, DotGridBackground, LetterGlitchMatrix, AmbientGlow.

---

## 3. Limitações Arquiteturais Identificadas

1. **Ausência de Camada de Serviços (Services Layer):** A rota de API (`/api/contact`) acumula regras de validação, rate limiting e resposta diretamente no arquivo de rota, sem abstração para envio de e-mails.
2. **Duplicação de Metadados:** Informações do desenvolvedor estão duplicadas manualmente em `layout.tsx` em vez de referenciar `profile.ts`.
3. **Persistência de Rate Limiting Incompatível com Serverless:** O uso de `Map` em memória RAM local falha em funções lambda efêmeras.
4. **Acoplamento de Efeitos Visuais:** Animações intensivas de Canvas/WebGL rodam sem controle explícito de preferência de movimento do usuário (`prefers-reduced-motion`).

