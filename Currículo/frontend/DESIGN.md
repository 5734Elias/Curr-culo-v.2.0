# DESIGN.md — Diretrizes de Design & Sistema Visual

## 1. Paleta de Cores (Google Stitch Cyber Theme)
- **Fundo Base:** `#0d1515` (Escuro Profundo Cyber)
- **Superfície Nível 1 (Informativa):** `#151d1e` (Container plano e discreto)
- **Superfície Nível 2 (Destacada):** `#192122` (Vidro temperado com borda `#3a494b`)
- **Superfície Nível 3 (Interativa):** `#232b2c` (Superfície reativa com halo Cyan em hover)
- **Primary Accent:** `#00f2ff` (Cyber Blue - Ações primárias e destaques de engenharia)
- **Secondary Accent:** `#c0c1ff` (Electric Indigo - Destaques de IA e inovação)
- **Security Accent:** `#ffb4ab` / `#ffe173` (Segurança, Alertas e Provas)
- **Texto Primário:** `#dce4e4` (Contraste alto > 12:1)
- **Texto Muted:** `#b9cacb` (Leitura secundária)

## 2. Tipografia
- **Sans-serif (Interface & Corpo):** `Inter`, system-ui, sans-serif
- **Monospace (Código, Métricas & Badges):** `JetBrains Mono`, monospace

## 3. Elevação & Superfícies (3 Níveis)
- **Nível 1 (Informativa):** Fundo `#151d1e`, borda sutil `#3a494b/40`, sem glow.
- **Nível 2 (Destacada):** Fundo `#192122`, borda `#3a494b`, blur leve 8px.
- **Nível 3 (Interativa):** Fundo `#232b2c`, borda `#00f2ff/60`, halo Cyber Blue `0 0 15px rgba(0,242,255,0.2)`.

## 4. Movimento & Animações
- **Micro-interações:** 120ms – 180ms (`ease-out`)
- **Componentes & Modais:** 200ms – 280ms (`cubic-bezier(0.16, 1, 0.3, 1)`)
- **Revelação de Seções:** 350ms – 450ms
- **Ambiente Global:** Loop contínuo de baixo contraste (30 FPS cap, opacidade 8%-12%)
- **Reduced Motion:** Substituição obrigatória de animações por estados estáticos discretos.

## 5. Anti-Referências Invioláveis
- Templates SaaS genéricos sem personalidade.
- Animações ornamentais sem propósito que atrasem a navegação.
- Glow permanente forte em todos os cards sem hierarquia.
- Fundos claros ou gradientes roxos genéricos de IA comercial.
- Textos com contraste menor que 4.5:1.
