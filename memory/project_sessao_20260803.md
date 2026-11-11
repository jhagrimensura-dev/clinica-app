---
name: project-sessao-20260803
description: Sessão 2026-08-03 — Fix status Follow
metadata: 
  node_type: memory
  type: project
  originSessionId: f7a786eb-4561-4e4c-b48c-4eb25ce9939d
---

Fix do bug de status Follow #1 no InboxWhatsApp.

**Causa raiz:** O modal de edição de lead no InboxWhatsApp inicializava o status com `STATUS_DENORMALIZE[lead.status]` = `'Follow #1'`, mas a lista customizada do usuário tem `'Follow #1 (24 hrs)'`. O valor não batia com nenhuma opção do `<select>`, então o Chrome exibia visualmente a primeira opção ("Em aberto"), enganando o usuário. O banco ESTAVA salvando `follow1` corretamente — o bug era só visual.

**Fix 1 — InboxWhatsApp.jsx linha ~118:** Inicialização do status no `ModalRegistrarLead` usando `startsWith` para encontrar o label correto na lista customizada.

**Fix 2 — LeadsContext.jsx:** Adicionada função `normalizeStatusKey` e aplicada no `fromDB` — converte labels customizados salvos literalmente no banco (ex: "Follow #1 (24 hrs)") para a chave correta ('follow1') ao carregar.

**Why:** O usuário customizou os labels de status no InboxWhatsApp (adicionando duração: "24 hrs", "48 hrs"), mas o STATUS_DENORMALIZE usava os labels padrão sem sufixo.

**How to apply:** Se o usuário reportar status mostrando errado após refresh no InboxWhatsApp, verificar se a lista customizada de status tem labels diferentes dos padrões e se a inicialização do modal está usando `startsWith` para buscar o match.
