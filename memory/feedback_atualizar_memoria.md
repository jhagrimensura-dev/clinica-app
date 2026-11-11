---
name: feedback_atualizar_memoria
description: Sempre atualizar a memória da sessão quando o usuário perguntar como está o programa
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 655248e7-c125-44f1-a944-acbaad080b18
---

Sempre que o usuário perguntar "como está o programa", "como está o sistema", "o que tem de novo" ou variações, atualizar a memória da sessão atual antes de responder.

**Why:** O usuário quer que a memória reflita o estado mais recente do sistema sempre que fizer esse tipo de pergunta, para que futuras sessões tenham contexto atualizado.

**How to apply:** Ao detectar perguntas sobre o estado geral do sistema/app, primeiro atualizar/criar o arquivo de memória da sessão atual em `project_sessao_YYYYMMDD.md` e o MEMORY.md, depois responder.
