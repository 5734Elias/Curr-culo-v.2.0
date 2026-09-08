---
name: google-meet-integration
description: Integração segura com Google Calendar e Meet utilizando providers desacoplados
---

# Skill: google-meet-integration

Esta skill define como a integração com o Google Calendar e Meet deve ser codificada de forma segura e desacoplada.

## Diretrizes de Execução
1. **Providers Desacoplados:** Utilizar a classe interface `MeetingProvider` com implementações `GoogleMeetProvider`, `MockMeetingProvider` e `ManualMeetingProvider`.
2. **OAuth Seguro:** Escopos de tokens devem ser limitados estritamente ao necessário. Refresh tokens e credenciais OAuth devem ser armazenados de forma criptografada no banco.
3. **Links Protegidos:** O link do Google Meet nunca deve ser exposto publicamente no site e não deve constar nos logs.
