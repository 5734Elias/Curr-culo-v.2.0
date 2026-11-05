# Modelagem de Ameaças (Threat Model - STRIDE & DREAD)
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0-main`)
**Metodologias:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) e DREAD.

---

## 1. Ativos Críticos e Limites de Confiança (Trust Boundaries)

### 1.1 Ativos Protegidos
1. **Credenciais de Terceiros:** Chave de API do Resend (`RESEND_API_KEY`) e Tokens do Redis (`UPSTASH_REDIS_REST_TOKEN`).
2. **Disponibilidade da Aplicação e Custos Serverless:** Infraestrutura de funções Vercel e cotas de requisições de e-mail / banco de cache.
3. **Privacidade dos Visitantes (LGPD):** Dados fornecidos no formulário (nome, e-mail, mensagem) e endereços IP.
4. **Reputação de Domínio e E-mail:** Prevenção contra uso do portfólio como relay de spam ou phishing.
5. **Integridade Visual e de Conteúdo:** Garantia de que informações profissionais e links não sejam adulterados.

### 1.2 Limites de Confiança
- **TB-1 (Internet ↔ Borda Vercel):** Todo tráfego de entrada é não confiável; cabeçalhos podem ser forjados por atacantes.
- **TB-2 (Borda Vercel ↔ Função Serverless Node.js):** Headers gerenciados como `x-vercel-forwarded-for` e `x-real-ip` possuem maior confiabilidade que `x-forwarded-for`.
- **TB-3 (Função Serverless ↔ APIs Externas):** Conexões de saída TLS 1.3 autenticadas com Upstash Redis e Resend.

---

## 2. Análise de Ameaças STRIDE

### 2.1 Spoofing (Falsificação de Identidade)
- **Ameaça S-1: Forjamento de endereço IP para evasão de Rate Limit.**
  - *Vetor:* Atacante envia requisições rotacionando o cabeçalho `X-Forwarded-For: <random-ip>`.
  - *Mitigação Implementada:* A função `extractClientIp` prioriza cabeçalhos gerenciados pela infraestrutura (`x-vercel-forwarded-for` e `x-real-ip`) e valida o formato sintático estrito de IPv4 e IPv6 antes de aceitar qualquer candidato.

### 2.2 Tampering (Adulteração de Dados)
- **Ameaça T-1: Email Header Injection / CRLF Injection.**
  - *Vetor:* Inserção de caracteres `\r\n` nos campos `name` ou `subject` para injetar cabeçalhos SMTP como `Bcc:` ou `Cc:`.
  - *Mitigação Implementada:* Validação de schema Zod com regex estrita (`/^[^\r\n]*$/`) e sanitização programática ativa em `contactService.ts`.
- **Ameaça T-2: Injeção de Parâmetros / Prototype Pollution no JSON de entrada.**
  - *Vetor:* Envio de propriedades adicionais como `__proto__` ou `admin: true`.
  - *Mitigação Implementada:* `ContactPayloadSchema.strict()` rejeita sumariamente qualquer campo desconhecido.

### 2.3 Repudiation (Repúdio)
- **Ameaça R-1: Negação de submissão de mensagens abusivas.**
  - *Vetor:* Remetente malicioso contesta envio ou utiliza IPs dinâmicos.
  - *Mitigação Implementada:* Registro estruturado de tentativas bloqueadas e hashes anonimizados em logs do servidor sem expor dados pessoais (LGPD).

### 2.4 Information Disclosure (Vazamento de Informações)
- **Ameaça I-1: Exposição de chaves privadas no bundle cliente do navegador.**
  - *Vetor:* Inclusão indevida de credenciais com prefixo `NEXT_PUBLIC_` ou em commits.
  - *Mitigação Implementada:* Nenhuma chave sensível possui prefixo `NEXT_PUBLIC_`. Teste automatizado em `test-cybersecurity-hardening.mjs` valida isso a cada build.
- **Ameaça I-2: Vazamento de stack traces ou mensagens internas de APIs externas.**
  - *Vetor:* O provedor Resend retorna erro contendo trechos de chave ou limites e a API reflete isso ao cliente.
  - *Mitigação Implementada:* A rota `/api/contact` retorna apenas mensagens padronizadas e controladas ao cliente, mantendo detalhes técnicos em logs internos com mascaramento (`re_***`).

### 2.5 Denial of Service (Negação de Serviço)
- **Ameaça D-1: Exaustão de memória da função serverless por Payload Excessivo.**
  - *Vetor:* Atacante envia requisição POST com corpo de 50MB.
  - *Mitigação Implementada:* Rejeição antecipada com HTTP 413 (`PAYLOAD_TOO_LARGE`) se `Content-Length` ou buffer exceder 10KB.
- **Ameaça D-2: Inundação de envio de e-mails para exaustão de cotas da API Resend.**
  - *Vetor:* Script automatizado submete centenas de mensagens de contato por segundo.
  - *Mitigação Implementada:* Rate Limiter serverless com cota de 5 requisições/hora por IP anonimizado e Honeypot invisível para bots.
- **Ameaça D-3: Evasão por falha proposital de conectividade com o Redis.**
  - *Vetor:* Se o cluster Redis ficar indisponível em produção, o sistema poderia falhar de forma aberta (Fail-Open).
  - *Mitigação Implementada:* Política Fail-Closed ativa por padrão em ambiente de produção (retorna HTTP 503 com `Retry-After`).

### 2.6 Elevation of Privilege (Elevação de Privilégio)
- **Ameaça E-1: Tentativa de acesso a rotas administrativas.**
  - *Vetor:* Enumeração de endpoints como `/admin`, `/dashboard` ou rotas REST privadas.
  - *Mitigação Implementada:* A aplicação não possui painel administrativo nem banco de dados autenticado; rotas inexistentes retornam 404 estático sem processamento no servidor.

---

## 3. Matriz DREAD de Riscos

| Ameaça | Damage (D) | Reproducibility (R) | Exploitability (E) | Affected Users (A) | Discoverability (D) | DREAD Médio | Nível de Risco |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Exaustão de memória por Payload DoS** | 6 | 8 | 8 | 8 | 7 | **7.4** | **Médio (Mitigado)** |
| **Email Header / CRLF Injection** | 7 | 6 | 6 | 4 | 6 | **5.8** | **Médio (Mitigado)** |
| **Bypass de Rate Limit por IP Spoofing** | 5 | 7 | 6 | 6 | 7 | **6.2** | **Médio (Mitigado)** |
| **Vazamento de credenciais em erro 502** | 8 | 5 | 5 | 2 | 5 | **5.0** | **Baixo (Mitigado)** |
| **Abuso de cota por bots em formulário** | 6 | 8 | 9 | 4 | 8 | **7.0** | **Médio (Mitigado)** |
| **XSS via injeção em atributos inline** | 7 | 5 | 4 | 5 | 6 | **5.4** | **Baixo (Mitigado)** |
