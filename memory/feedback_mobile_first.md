---
name: feedback_mobile_first
description: Toda nova página deve ser responsiva para mobile desde o início
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4f987a3b-f983-45d8-a61c-2c9176ba9bde
---

Toda nova página ou componente deve ser responsivo para mobile desde a criação, sem precisar de sessão separada para corrigir.

**Why:** O usuário acessa o sistema pelo celular também (ex: upload de transcrições que ficam no celular). Corrigir retroativamente é trabalhoso.

**How to apply:**
- Padding: sempre `p-3 sm:p-6` (nunca `p-6` fixo)
- Grids de cards: sempre com breakpoints — ex: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Tabelas: sempre dentro de `<div className="overflow-x-auto">`
- Botões/filtros em linha: sempre `flex flex-wrap gap-2`
- Nunca usar `grid-cols-N` fixo sem breakpoint responsivo (exceto grids internos de formulário como label+input)
