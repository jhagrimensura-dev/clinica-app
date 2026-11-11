---
name: feedback_dedup_lembretes
description: "Proteção contra duplicação de lembretes deve ficar na raiz (addLembrete), não nos chamadores"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3fe3e48a-8a59-4d8e-9fe4-cfb7184af3e7
---

Nunca confiar que os chamadores de `addLembrete` vão evitar duplicatas — a proteção deve estar dentro do próprio `addLembrete` no AgendaContext.

**Why:** Lembretes de aniversário estavam sendo criados 3+ vezes para o mesmo contato porque cada vez que o lead era salvo/editado chamava `addLembrete` sem checar se já existia um igual. Isso foi considerado amadorismo grave pelo usuário.

**How to apply:** Ao implementar qualquer função que adiciona dados recorrentes (lembretes, notificações, badges), colocar o guard de deduplicação na função central, não nos chamadores individuais. O guard atual em `addLembrete`: rejeita se já existe lembrete com mesmo `leadNome` + `data` + `descricao` não concluído.
