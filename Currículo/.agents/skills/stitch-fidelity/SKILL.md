---
name: stitch-fidelity
description: Compara a implementação com o design do Google Stitch para garantir fidelidade visual máxima
---

# Skill: stitch-fidelity

Esta skill garante a fidelidade visual inegociável entre o design system oficial no Google Stitch e o código frontend implementado.

## Diretrizes de Execução
1. **Inspeção de Elementos:** Para qualquer tela a ser desenvolvida, o desenvolvedor deve ler os detalhes extraídos do Stitch (cores, fontes, rounded, padding).
2. **Uso de Classes Utilitárias:** Nunca utilizar valores de cores e medidas fixas inline (ex: `bg-[#123456]` ou `p-[21px]`). Use sempre as classes do Tailwind configuradas (ex: `bg-primary`, `p-md`, `rounded-2xl`).
3. **Mapeamento Desktop vs Mobile:** Sempre compare as versões de desktop e mobile no Stitch para garantir a correta responsividade.
4. **Micro-interações:** Adicione estados de hover, active e focus fiéis (sombra suave do Stitch e pequenas escalas de 98% no clique).
