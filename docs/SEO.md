# Estratégia Técnica de SEO & Dados Estruturados

---

## 1. Dados Estruturados (JSON-LD)

A aplicação injeta metadados estruturados em formato JSON-LD para indexação rica pelo Google e outros buscadores:

### 1.1 Layout Global (`src/app/layout.tsx`)
Utiliza um grafo semântico unificado (`@graph`):
- **Person:** Identifica o autor (Elias Ribeiro dos Reis), cargo, formação (SENAI), áreas de conhecimento técnico e links de perfis oficiais (`sameAs`).
- **WebSite:** Identifica a propriedade digital e conecta o publicador ao nó `Person`.

### 1.2 Detalhamento de Projetos (`src/app/projetos/[slug]/page.tsx`)
- **BreadcrumbList:** Trilha de navegação estruturada (Início > Projetos > Nome do Projeto) para exibição em breadcrumbs nos resultados de busca do Google.
- **TechArticle:** Artigo técnico contendo título, resumo, tecnologias e autor verificado.

---

## 2. Sitemap Canônico & Robots.txt

- **Data Real Estável:** O `sitemap.ts` utiliza data real e fixa da última revisão, eliminando "fake fresh dates".
- **Prioridades:**
  - `1.0`: Página Inicial (`/`)
  - `0.8`: Páginas principais (`/sobre`, `/experiencia`, `/projetos`, `/competencias`, `/formacao`, `/curriculo`, `/contato`)
  - `0.7`: Estudos de caso específicos (`/projetos/[slug]`)
- **Robots.txt:** Bloqueia endpoints de API (`/api/`) e componentes de demonstração (`/design-system`), apontando diretamente para o `sitemap.xml`.

