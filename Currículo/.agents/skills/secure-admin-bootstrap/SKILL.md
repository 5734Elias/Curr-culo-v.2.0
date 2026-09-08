---
name: secure-admin-bootstrap
description: Lógica de bootstrap inicial de administrador com troca obrigatória de senha temporária
---

# Skill: secure-admin-bootstrap

Esta skill define o fluxo de segurança do primeiro login do administrador, garantindo que a credencial padrão (`Admin@123`) seja invalidada permanentemente após a troca obrigatória.

## Diretrizes de Execução
1. **Verificação de Flag:** O backend deve ter a flag `mustChangePassword: true` definida no seed inicial do usuário `Admin`.
2. **Restrição de Acesso:** Se `mustChangePassword` for verdadeiro, qualquer rota administrativa além de `/change-initial-password` deve retornar `403 Forbidden`.
3. **Invalidar Senha Temporária:** Após a primeira troca, a senha original temporária nunca mais deve ser aceita e todas as sessões anteriores devem ser invalidadas.
4. **Registro de Auditoria:** O evento deve ser registrado no log de auditoria com detalhes do usuário e IP mascarado.
