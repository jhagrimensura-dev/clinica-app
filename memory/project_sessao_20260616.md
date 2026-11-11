---
name: project-sessao-20260616
description: "Sessão 2026-06-16 — Indicacao rewrite, UI cleanup, inbox fixes, msg menu"
metadata: 
  node_type: memory
  type: project
  originSessionId: 32cbd0a4-dee5-4855-ac61-a1130d745b96
---

Sessão completa em 2026-06-16. Todas as alterações em produção (draamandaliima.com.br) e no GitHub.

**Por que:** sessão de polimento e paridade de features entre páginas.

**How to apply:** base para continuar na próxima sessão.

## Features implementadas

### Indicacao.jsx — reescrita completa
- Paridade total com LeadsNovos: ModalEditarLead, drag & drop Kanban, ícone WhatsApp SVG, agendadoPara
- Campo `indicadoPor` em ambos os modais
- Lista mostra "Indicado por: X" / Kanban mostra "Por: X"
- Cor verde, `origem: 'indicacao'`

### LeadsRecorrentes.jsx — reescrita completa
- Mesmas features de LeadsNovos
- Cor teal, `origem: 'leads_recorrentes'`

### Favicon
- Substituído raio roxo Vite pelo ícone "A" bege/marrom da marca

### UI cleanup
- Removido "NAVEGAÇÃO" da sidebar
- Removidos subtítulos descritivos de TODAS as páginas (Dashboard, SocialMedia, LeadsNovos, LeadsRecorrentes, Indicacao, Relatorios, Faturamento, Comercial, Metas, Financeiro, Pacientes)
- Removido campo "PROFISSIONAL / Amanda Lima Silva" da Agenda

### Dashboard — Ticket Médio
- Adicionado card "Indicação" (5 colunas: Geral, Novos, Recorrência, Indicação, Diário)
- Calcula `ticketIndicacao` e `countIndicacaoLanc` de lancamentos com `tipo === 'Indicação'`

### InboxWhatsApp — fix timestamp
- Bug: Z-API envia `momment`/`timestamp` em segundos, webhook salvava sem converter
- Fix: webhook converte para ms antes de salvar (`< 10 dígitos → × 1000`)
- Fix no frontend: `normTs()` ao mapear mensagens do Supabase e no listener realtime

### InboxWhatsApp — menu ⋮ nas mensagens
- Hover em mensagem própria → botão ⋮ à esquerda da bolha
- Opções: ✏️ Editar (inline textarea, Enter/Esc) e 🗑️ Apagar
- Ambos persistem no Supabase (update/delete em `whatsapp_mensagens`)
