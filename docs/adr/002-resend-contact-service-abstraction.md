# ADR 002: Abstração de Mensageria e Eliminação de Falso Sucesso

- **Status:** Aceito
- **Data:** 2026-10-27
- **Decisores:** Arquiteto Principal de Software

## Contexto
O endpoint original de contato (`/api/contact`) realizava apenas a validação em memória e retornava HTTP 200 de sucesso para o cliente, sem efetuar o envio real da mensagem (falso sucesso). Isso levava visitantes e recrutadores a acreditarem que a mensagem havia sido entregue, acarretando perda de oportunidades profissionais.

## Decisão
Implementou-se a camada de serviço `src/services/contactService.ts` com:
1. Suporte nativo ao provedor transacional Resend via chamadas HTTPS diretas sem dependências externas adicionais.
2. Modo mock estrito para ambientes de teste automatizado (`NODE_ENV === 'test'`).
3. Resposta transparente (`code: 'SERVICE_NOT_CONFIGURED'` com HTTP 503) e fallback imediato com botão `mailto:` pré-formatado quando o servidor não possui chave configurada.

## Consequências
- **Positivas:** Eliminação de 100% dos falsos sucessos; experiência do usuário profissional e honesta; facilidade de plugar novos provedores no futuro.
- **Negativas:** Requer a configuração de uma chave de API para envios automáticos por formulário em produção.
