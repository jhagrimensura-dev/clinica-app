---
name: sessao-20260721
description: "Fix inbox Evolution API — @lid, nomes, histórico de mensagens"
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

Continuação da migração Z-API → Evolution API. Bugs corrigidos no InboxWhatsApp.

**Bug 1 (tela de desconectado):** `findChats` era chamado como GET; Evolution API exige POST com body `{}`. Retornava 404 → disparava detecção de desconexão.

**Bug 2 (@lid sem nomes):** Evolution API retorna JIDs `@lid` (ex: `279576768995488@lid`) em vez de telefone real para todos os contatos quando iPhone conecta como linked device (via QR). `findChats` tem `pushName: null` para esses contatos. Fix: buscar `findContacts` em paralelo → monta mapa `jid → nome` → 405 de 417 @lid têm nome resolvido.

**Bug 3 (histórico só enviadas):** Mensagens recebidas não estavam no Supabase porque webhook descartava @lid (falha no `/^\d+$/` test). Fix: webhook agora strip `@lid` antes do test. Para histórico existente: `fetchMensagens` agora chama `findMessages` na abertura da conversa e faz backfill no Supabase.

**@lid como identificador interno:**
- `id` da conversa = lid sem sufixo (ex: `279576768995488`) — chave no Supabase
- `jid` = JID completo (ex: `279576768995488@lid`) — usado em chamadas da API (sendText, sendMedia, fetchProfilePicture)
- `contato.telefone` = vazio para @lid (não é número real)

**Limitação @lid:** iPhone linked device via QR → WhatsApp usa @lid internamente → número real não disponível via Evolution API. Z-API resolvia isso internamente. Com Evolution API não tem como obter número real do @lid — usuário precisa digitar manualmente ao registrar lead.

**Pendências:** Verificar se msgs recebidas de novos leads chegam corretamente após o fix do webhook.
