---
name: production-readiness
description: Critérios de homologação para produção, backups seguros de SQLite e Docker compose
---

# Skill: production-readiness

Esta skill rege a preparação e homologação do sistema para deploys em produção.

## Diretrizes de Execução
1. **Segredos:** Nenhuma senha ou chave OAuth deve constar no repositório de código ou arquivos de build. Usar estritamente variáveis de ambiente.
2. **Backups do SQLite:** O banco de dados SQLite deve ter processos de backup programados para local seguro fora da pasta pública.
3. **Healthcheck & Docker:** Garantir que as imagens Docker tenham status healthcheck funcionais para monitorar reinícios em caso de falha.
