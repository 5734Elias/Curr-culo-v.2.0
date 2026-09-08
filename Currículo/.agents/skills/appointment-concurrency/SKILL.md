---
name: appointment-concurrency
description: Evita reservas duplicadas de horários usando transações de banco e chaves únicas
---

# Skill: appointment-concurrency

Esta skill garante a integridade da agenda contra agendamentos simultâneos no mesmo horário (race conditions).

## Diretrizes de Execução
1. **Validação no Backend:** Nunca depender do frontend para verificar se o horário está disponível.
2. **Uso de Transações:** A reserva de horário deve ser feita usando transações isoladas (`Serializable` ou bloqueio pessimista via Prisma/Raw SQL) e restrição única (`UNIQUE` constraint) no banco de dados.
3. **Mapeamento de Estados:** Gerenciar estados como "Reservado", "Confirmado" e "Bloqueado" de forma transparente e segura.
