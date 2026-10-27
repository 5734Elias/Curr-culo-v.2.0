# Diretrizes de Acessibilidade (WCAG 2.2 AA)

---

## 1. Critérios Atendidos

| Critério WCAG 2.2 | Implementação no Projeto |
|---|---|
| **2.1.1 Teclado** | Toda a navegação, menus, botões e modais são operáveis exclusivamente via teclado. |
| **2.1.2 Sem Bloqueio de Teclado** | Modais e menus móveis contam com armadilha de foco cíclico com tecla `Escape` para fechar. |
| **2.4.1 Ignorar Blocos (Bypass Blocks)** | Link acessível "Pular para o conteúdo principal" (`#main-content`) implementado no topo do layout. |
| **2.4.7 Foco Visível** | Contorno de foco padronizado (`:focus-visible: 2px solid #00f2ff`). |
| **2.5.5 Tamanho do Alvo (Target Size)** | Botões e elementos interativos em dispositivos móveis possuem altura mínima de 44px. |
| **1.4.3 Contraste Mínimo** | Relação de contraste de cores de texto superior a 7:1 no tema escuro e claro. |
| **2.3.3 Animação por Interação** | Suporte completo a `@media (prefers-reduced-motion: reduce)` congelando efeitos e loops Canvas. |

---

## 2. Acessibilidade de Imagens e Leitores de Tela

- Todas as imagens possuem atributos `alt` descritivos e semânticos.
- Efeitos visuais puramente decorativos em Canvas utilizam `aria-hidden="true"`.
- Alternador de tema possui atributos `aria-label` que informam o estado atual e a ação disponível.

