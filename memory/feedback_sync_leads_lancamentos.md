---
name: feedback-sync-leads-lancamentos
description: Nunca sincronizar status de leads automaticamente via useEffect — preferir leitura cruzada de dados entre contextos
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3fe3e48a-8a59-4d8e-9fe4-cfb7184af3e7
---

Não alterar status de leads automaticamente com base em dados de outros contextos (ex: marcar lead como "fechado" quando existe um lançamento no Faturamento).

**Why:** Na sessão 2026-07-28, várias tentativas de sync automático (useEffect + ref) alteraram leads indevidamente, e um bug crítico (revertRef) acabou destruindo statuses toda vez que a página abria. Muito difícil de depurar e reverter.

**How to apply:** Para mostrar dados cruzados entre contextos (ex: consultas pagas no card de Leads), importar o contexto necessário (useVendas em LeadsNovos) e fazer a computação na hora da renderização, sem side effects. Nunca usar useEffect para escrever em outro contexto como reação a mudanças de estado.
