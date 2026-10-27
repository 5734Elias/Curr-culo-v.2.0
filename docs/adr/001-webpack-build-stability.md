# ADR 001: Adoção do Webpack para Compilação Estável de Produção

- **Status:** Aceito
- **Data:** 2026-10-27
- **Decisores:** Arquiteto Principal de Software

## Contexto
Durante a execução de diagnóstico e baseline (Fase 0), identificou-se que o motor Turbopack do Next.js 16 no sistema operacional Windows apresentava interrupção de processo (`TurbopackInternalError`) ao processar loaders de PostCSS com Tailwind CSS v4.

## Decisão
Configurou-se o comando `"build": "next build --webpack"` no `package.json`, garantindo estabilidade absoluta de compilação multiplataforma tanto no ambiente Windows local quanto nos runners Linux do GitHub Actions e servidores da Vercel.

## Consequências
- **Positivas:** Compilação 100% previsível e livre de crashes inesperados; compatibilidade total com plugins PostCSS.
- **Negativas:** Tempo de compilação ligeiramente maior se comparado ao Turbopack experimental, porém sem impacto perceptível no tamanho ou performance do bundle final.
