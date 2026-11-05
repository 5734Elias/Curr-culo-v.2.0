# Plano de Resposta a Incidentes de Segurança (Incident Response Plan)
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0-main`)
**Data:** 2026-11-05
**Responsável:** Incident Responder & DevSecOps
**Conformidade:** LGPD (Art. 48 da Lei 13.709/2018) & NIST SP 800-61 Rev. 2

---

## 1. Classificação de Severidade de Incidentes

| Nível | Cenário de Exemplo | Ação Imediata | Tempo de Resposta Alvo |
| :---: | :--- | :--- | :---: |
| **SEV-1 (Crítico)** | Vazamento confirmado de `RESEND_API_KEY` ou `UPSTASH_REDIS_REST_TOKEN`. | Revogação e rotação imediata de credenciais no painel. | < 1 hora |
| **SEV-2 (Alto)** | Ataque volumétrico de spam no formulário ou DoS contra a função serverless. | Ativação do modo Fail-Closed ou chaveamento para modo estritamente `mailto:`. | < 2 horas |
| **SEV-3 (Médio)** | Indisponibilidade do cluster Upstash Redis em produção. | Monitoramento da política Fail-Closed (HTTP 503) e restauração do cluster. | < 4 horas |
| **SEV-4 (Baixo)** | Tentativas isoladas de injeção sintática (bloqueadas pelo Zod/Rate Limiter). | Registro em logs e análise preventiva de tendências. | < 24 horas |

---

## 2. Playbooks de Resposta por Cenário

### Playbook 1: Comprometimento ou Suspeita de Vazamento de Credenciais
1. **Identificação:** Detecção de chave em logs públicos, alertas do GitHub Secret Scanning ou uso incomum no dashboard do Resend/Upstash.
2. **Contenção Imediata:**
   - Acessar o painel do Resend (https://resend.com) e deletar a API Key comprometida.
   - Gerar uma nova API Key com permissões restritas.
   - Acessar o console do Upstash Redis (https://console.upstash.com) e regenerar os REST Tokens.
3. **Erradicação:**
   - Atualizar os valores nos Secrets da Vercel (Production e Preview).
   - Realizar Redeploy imediato da aplicação sem cache.
4. **Recuperação e Pós-Incidente:**
   - Inspecionar histórico de envios no Resend para auditar se houve mensagens disparadas por invasores.
   - Documentar o evento no registro de incidentes.

### Playbook 2: Indisponibilidade ou Falha do Cluster Redis
1. **Comportamento Automático:**
   - A aplicação já implementa política **Fail-Closed por Padrão** (`provider: 'fail-closed'`).
   - Requisições ao `/api/contact` respondem HTTP 503 com `Retry-After: 60`, protegendo o sistema contra sobrecargas descontroladas.
2. **Ação Operacional (se o operador desejar manter recepção temporária):**
   - Configurar temporariamente `RATE_LIMIT_ALLOW_DEGRADED_FALLBACK="true"` na Vercel (limite degradado estrito de 2 requisições por instância).
   - Ou alterar `NEXT_PUBLIC_CONTACT_API_ENABLED="false"`, fazendo a interface operar no modo direto via aplicativo de e-mail (`mailto:`).

### Playbook 3: Notificação de Incidentes Conforme a LGPD (Art. 48)
1. **Avaliação de Relevância:**
   - A aplicação armazena dados em trânsito de forma volátil apenas durante o disparo do e-mail.
   - Não há banco de dados de usuários ou cookies de rastreamento.
2. **Procedimento em Caso de Interceptação de Dados Pessoais:**
   - Comunicar a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados caso haja risco relevante aos direitos e liberdades individuais.
   - Descrever a natureza dos dados, medidas técnicas aplicadas e planos de mitigação.

---

## 3. Contatos de Emergência
- **Operador Responsável:** Elias Ribeiro dos Reis
- **E-mail de Segurança:** `elias.re_is@hotmail.com`
- **Painel de Hospedagem:** Vercel Dashboard (https://vercel.com)
