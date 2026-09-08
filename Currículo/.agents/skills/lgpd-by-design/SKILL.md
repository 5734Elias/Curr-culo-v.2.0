---
name: lgpd-by-design
description: Garante minimização de dados, controle de consentimentos separados e mascaramento de dados sensíveis em logs
---

# Skill: lgpd-by-design

Esta skill rege a implementação dos padrões da LGPD para proteção dos dados dos pacientes.

## Diretrizes de Execução
1. **Consentimentos Separados:** Nunca usar um único checkbox para aceitar todos os termos. Separar consentimento para marketing/contato do consentimento para tratamento de dados da consulta.
2. **Logs Limpos:** Nunca registrar e-mails, telefones completos, IPs não mascarados ou mensagens nos logs de depuração.
3. **Mapeamento de Retenção:** Dados de solicitações recusadas ou não convertidas em consultas devem ser excluídos ou anonimizados periodicamente.
4. **Preferência de Cookies:** Cookies não essenciais (analytics, marketing) só devem ser carregados após o aceite explícito do banner de cookies.
