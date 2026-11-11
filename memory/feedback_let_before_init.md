---
name: feedback_let_before_init
description: Bug crítico — nunca referenciar variável let/const em console.log antes de sua declaração em funções de webhook/serverless
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

Nunca colocar `console.log` ou qualquer referência a uma variável `let`/`const` antes da linha onde ela é declarada, especialmente em API handlers.

**Why:** Em julho/2026, o webhook `/api/webhook-whatsapp.js` tinha um `console.log('[WH5] resolved_phone:', phone)` antes do `let phone = ...`. Isso causava `Cannot access 'phone' before initialization` (temporal dead zone) em TODA mensagem enviada pelo celular (`fromMe: true`), fazendo o handler crashar silenciosamente (retorna 200 mesmo com erro) e nunca salvando as mensagens no Supabase. O bug existia desde que os logs de debug foram adicionados e ficou oculto porque o catch retorna 200.

**How to apply:** Ao adicionar logs de debug em qualquer handler: declarar todas as variáveis PRIMEIRO, depois logar. Ou usar `rawPhone`/`rawChatId` nos logs em vez da variável derivada. Em handlers com try/catch que sempre retornam 200, bugs de sintaxe/runtime ficam completamente invisíveis nos logs de status HTTP — checar `vercel logs` com filtro `error` quando algo não funciona mesmo com status 200.
