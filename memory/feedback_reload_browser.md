---
name: feedback-reload-browser
description: Sempre recarregar o Chrome após editar arquivos do projeto
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a9e4288f-292a-4d16-b527-d7e3e7a217fa
---

Sempre recarregar o Chrome automaticamente após qualquer alteração no código, sem o usuário precisar pedir.

**Why:** o usuário quer ver o resultado imediatamente após cada mudança.
**How to apply:** após todo Edit/Write em arquivos do projeto, executar `osascript -e 'tell application "Google Chrome" to reload active tab of front window'` automaticamente.
