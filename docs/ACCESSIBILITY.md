# Diretrizes e Verificações de Acessibilidade Digital (Alinhamento WCAG 2.2)

---

## 1. Declaração de Conformidade e Transparência

Este projeto adota como meta de design e engenharia as diretrizes internacionais **WCAG 2.2 (Web Content Accessibility Guidelines)** em nível **AA**.

Em conformidade com a auditoria técnica independente, **não afirmamos certificação formal irrestrita de acessibilidade**, declarando com rigor e transparência exclusivamente os critérios técnicos **efetivamente implementados e verificados** no código-fonte e na suíte de testes automatizados.

---

## 2. Critérios Verificados por Testes Automatizados (Suíte de QA)

Os itens abaixo possuem testes de regressão executados continuamente pelo script `scripts/test-ui-accessibility.mjs` no pipeline de validação:

| Critério WCAG 2.2 | Item Verificado | Evidência Técnica no Código | Status de Verificação |
|---|---|---|---|
| **2.4.1 Ignorar Blocos (Bypass Blocks)** | Link acessível "Pular para o conteúdo principal" no topo do DOM. | `layout.tsx` (`href="#main-content"`, classes `sr-only focus:not-sr-only`) | **Testado e Aprovado** |
| **2.4.7 Foco Visível** | Contorno de foco padronizado e nítido ao navegar por teclado. | `globals.css` e `Button.tsx` (`:focus-visible: 2px solid #00f2ff`) | **Testado e Aprovado** |
| **2.5.5 / 2.5.8 Tamanho do Alvo (Target Size)** | Dimensões mínimas de 44px para botões interativos em dispositivos móveis. | `Button.tsx` (`min-h-[44px]`) | **Testado e Aprovado** |
| **2.3.3 Animação por Interação** | Desativação ou atenuação de animações para usuários com sensibilidade vestibular. | `globals.css` (`@media (prefers-reduced-motion: reduce)`) | **Testado e Aprovado** |
| **4.1.2 Nome, Função e Valor** | Descrição clara de controles acessíveis para tecnologias assistivas. | `ThemeToggle.tsx` (`aria-label` descritivo dinâmico) | **Testado e Aprovado** |

---

## 3. Práticas Estruturais Implementadas no Código (Inspeção Técnica)

Os itens abaixo foram desenvolvidos seguindo padrões de acessibilidade semântica:

- **2.1.1 e 2.1.2 Operabilidade por Teclado e Foco em Modais:** O componente `Modal.tsx` implementa captura de foco (`focus trap`) quando aberto e escuta a tecla `Escape` para encerramento com restauração do foco anterior.
- **1.1.1 Conteúdo Não Textual:** Efeitos decorativos complexos em Canvas (`CyberMatrixBackground`, `ThreadsBackground`, etc.) contam com `aria-hidden="true"`, impedindo ruído em leitores de tela.
- **Estrutura Semântica:** Uso de landmarks HTML5 (`<header>`, `<main id="main-content">`, `<nav>`, `<footer>`) e hierarquia de cabeçalhos (`<h1>` a `<h3>`).

---

## 4. Escopo e Evolução Contínua

- **Contraste de Cores (1.4.3):** A paleta de cores foi projetada visando alto contraste no tema escuro e claro. Todavia, a validação automatizada de todas as combinações dinâmicas de texto sobre fundos translúcidos continua sendo acompanhada, sem declaração antecipada de conformidade total.
- **Tecnologias Assistivas:** Avaliações manuais periódicas com leitores de tela (NVDA/VoiceOver) continuam a guiar o refinamento dos componentes.
