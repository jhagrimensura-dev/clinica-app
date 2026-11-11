---
name: feedback-commit-on-success
description: Commitar automaticamente toda vez que uma feature funcionar e for aprovada
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a9e4288f-292a-4d16-b527-d7e3e7a217fa
---

Sempre que uma atualização funcionar e o usuário confirmar, commitar E fazer deploy para produção imediatamente, sem precisar perguntar.

**Why:** O usuário pediu: "sempre faz o deploy, pq ai nao perdemos tempo".

**How to apply:** Após cada alteração confirmada: 1) commit, 2) `git push origin main` (o Vercel deploya automaticamente). Não esperar instrução separada de "faz deploy", "faz push" ou "sobe". Sempre fazer junto com o commit.
