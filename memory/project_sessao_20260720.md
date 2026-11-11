---
name: sessao-20260720
description: Migração Z-API → Evolution API no InboxWhatsApp + fix Leads por Origem + deploy
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

Migração completa do WhatsApp Inbox de Z-API para Evolution API (Railway.app).

**Por que:** Z-API não capturava mensagens enviadas pelo celular (só via webhook "ao enviar" que era falho). Evolution API resolve com evento `messages.upsert` que inclui `fromMe: true`.

**Evolution API:**
- URL: `https://evolution-api-production-1083.up.railway.app`
- Global API key: `Amanda@2025!` (hardcoded no `evoFetch`)
- Instância 1: `leads-novos` (iPhone 11, 556499002306)
- Instância 2: `recorrente` (iPhone 15 Pro Max, 556496112306)
- Webhook configurado no Evolution Manager → `/api/webhook-whatsapp`

**Arquivos alterados:**
- `api/webhook-whatsapp.js`: evento `messages.upsert`, phone de `remoteJid@s.whatsapp.net`
- `src/pages/InboxWhatsApp.jsx`: `zapiFetch` → `evoFetch`, endpoints Evolution API
- `src/pages/Configuracoes.jsx`: removido `instanciaToken`/`clientToken`, atualizado para Evolution API

**Endpoints Evolution API:**
- Chats: `GET /chat/findChats/{instance}`
- Enviar texto: `POST /message/sendText/{instance}` `{number, text}`
- Enviar mídia: `POST /message/sendMedia/{instance}` `{number, mediatype, media, caption, fileName}`
- QR: `GET /instance/connect/{instance}` → `d.code`
- Status: `GET /instance/connectionState/{instance}` → `d.instance.state === 'open'`
- Foto: `POST /chat/fetchProfilePictureUrl/{instance}` `{number}` → `d.profilePictureUrl`

**Why:** Mensagens do celular agora aparecem no inbox via webhook, sem precisar de fetch adicional.
**How to apply:** `fetchMensagens` só usa Supabase agora (webhook captura tudo). Chat format: `id` é o JID completo (`@s.whatsapp.net`), `unreadCount` (não `unread`), `lastMessage.messageTimestamp`.

**PENDÊNCIA PÓS-DEPLOY:** Usuário precisa atualizar `config_whatsapp_contas` em Configurações → WhatsApp com os novos nomes de instância (`leads-novos` e `recorrente`).

**Leads por Origem também atualizado nessa sessão:**
- Mostra todos os criativos de `adsEngajamento` mesmo com 0 leads no mês
- Toggle grid/lista para criativos
- InstagramAnalytics agora salva TODOS os anúncios (não só engajamento) e faz merge entre contas
