---
name: project-sessao-20260730
description: "Sessão 2026-07-30 — Fix Social Media isFollow, busca leads no Inbox, detecção de duplicatas, diagnóstico clinicaId multi-usuário"
metadata: 
  node_type: memory
  type: project
  originSessionId: f7a786eb-4561-4e4c-b48c-4eb25ce9939d
---

## Fix Social Media — isFollow consistente com LeadsNovos

Social Media mostrava 124 novos / 0 follow-up enquanto LeadsNovos mostrava 96 novos / 28 follow-up. Causa: `isFollow` no SocialMedia.jsx não checava `dataOrigem`, só texto "follow" em campos. Fix: alinhar com a lógica canônica de `LeadsNovos.jsx` — checar `dataOrigem || data` vs `prefix` primeiro.

**How to apply:** A referência canônica de "novo vs follow-up" é `isFollowUp` em `LeadsNovos.jsx`. Qualquer outra página que precise dessa distinção deve usar a mesma lógica.

---

## Busca no Inbox mostra leads cadastrados

Feature: ao digitar ≥2 chars no campo de busca do Inbox, leads do sistema que batem com o nome (e que não têm conversa aberta) aparecem numa secção "Leads cadastrados". Clicar abre o chat com o número do lead.

**Bug corrigido imediatamente após:** `tel.includes("")` é sempre `true` — quando a busca não tem dígitos, o filtro de telefone retornava todos os leads. Fix: só aplicar busca por telefone se `qDigits.length >= 4`.

---

## Detecção e mesclagem de duplicatas em Leads Novos

Feature completa: detecta leads com mesmo telefone em TODOS os leads do sistema (não só mês atual), mostra:
- Banner laranja no topo com contagem e botões por duplicata
- Badge ⚠️ clicável na linha da lista
- Modal `ModalMesclarDuplicata`: mostra Lead A vs Lead B lado a lado, auto-merge inteligente (melhor origem, status mais avançado por `STATUS_PRIORITY`, dataOrigem mais antiga, obs concatenadas), botão "Mesclar e excluir duplicata"

**Why:** Fernanda tinha registrado leads diretamente no Leads Novos sem preencher origem, enquanto o inbox tinha os mesmos leads com dados corretos — gerando duplicatas quando o clinicaId foi unificado.

---

## Banner de duplicatas mostra mês de cada lead

Os botões no banner de duplicatas agora mostram o nome do lead e abaixo (em texto menor) os meses onde os registros estão — ex: "Camila Bemfica / Jul/26 · Mar/26". Motivo: leads de meses diferentes não apareciam na lista do mês atual, então o utilizador não conseguia encontrá-los. Com o mês visível, sabe onde navegar ou pode clicar direto no botão do banner.

---

## Telefone editável no modal Editar Lead

Campo Telefone adicionado no `ModalEditarLead` de LeadsNovos, logo abaixo do campo Nome. Estado inicializado com `lead.telefone`, salvo no `onSalvar`. Aceita apenas dígitos (`.replace(/\D/g, '')`).

**Why:** O telefone existia no lead mas não era editável no modal — só visível na lista (e só via Inbox). Agora pode ser corrigido diretamente.

**Feedback do utilizador:** Perguntou para pedir confirmação antes de implementar. A pedido anterior (telefone na lista) foi revertido — o utilizador queria no modal, não na lista. Perguntar sempre antes de fazer quando a localização/formato não for 100% explícito.

---

## Diagnóstico clinicaId multi-usuário

Problema investigado: dados de Fernanda apareciam separados dos dados do admin. Causa: ao entrar no sistema antes de `clinica_master` estar configurado, `setClinicaId(session.user.id)` era chamado (fallback), isolando os dados dela.

**Resultado da auditoria:** query `SELECT clinica_id, COUNT(*) FROM leads GROUP BY clinica_id` retornou apenas 1 linha com 1001 leads — todos os dados estão unificados. Nenhum outro usuário tem o problema.

**How to apply:** Se houver suspeita de dados partidos, rodar essa query no Supabase SQL Editor. Mais de 1 `clinica_id` = dados isolados de algum usuário.
