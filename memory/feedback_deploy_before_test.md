---
name: feedback-deploy-before-test
description: "Sempre fazer deploy antes de pedir ao usuário para testar — o usuário usa o site de produção, não localhost"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f7a786eb-4561-4e4c-b48c-4eb25ce9939d
---

Sempre fazer `vercel --prod` antes de pedir ao usuário para testar qualquer mudança. O usuário testa exclusivamente no site de produção (draamandaliima.com.br), nunca no localhost. Código local não tem efeito nenhum para ele.

**Why:** Esqueci de fazer deploy e pedi para o usuário testar no console várias vezes — os logs não apareciam porque o código de produção era antigo. O usuário ficou frustrado ("pelo amor de deus, como vc esquece isso").

**How to apply:** Imediatamente após editar qualquer arquivo, fazer deploy antes de pedir teste. Se adicionar logs de debug, deploy → teste → remove logs → deploy de novo.
