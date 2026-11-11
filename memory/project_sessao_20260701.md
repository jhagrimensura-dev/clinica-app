---
name: project-sessao-20260701
description: "Sessão 2026-07-01 — Mídia editável, busca paciente, leads no Faturamento, responsável editável, fix realtime multi-usuário, badge leads calendário"
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

## O que foi feito

### InboxWhatsApp — Mídia editável pelo admin
- Campo Mídia agora tem lista editável (mesmo padrão de Origem/Status)
- Botão "✎ Editar lista" visível só para admins
- Default: Orgânico, Impulsionar, Tráfego pago, Link da BIO
- Salvo em `ConfigContext` como `lead_midias` no Supabase

### Faturamento — Campo Nome do Paciente com busca
- Substituiu `<select>` por combobox com input de texto filtrante
- Digita o nome → lista filtra em tempo real
- Leads também aparecem como sugestão (com tag "lead") além dos pacientes cadastrados
- Componente: `PacienteCombobox` em Faturamento.jsx

### Faturamento — Campo Responsável editável
- Novo componente `ResponsavelSelect` com "✎ Editar lista"
- Default: Dra. Amanda, Recepção, Equipe
- Salvo em `ConfigContext` como `faturamento_responsaveis` no Supabase
- Funciona nos dois modais (Novo Lançamento e Editar Lançamento)

### Fix crítico — Realtime multi-usuário com RLS
- **Problema**: funcionária salvava dados no PC dela, não aparecia no Mac da Amanda
- **Causa**: subscriptions de realtime sem `filter: 'clinica_id=eq.${clinicaId}'` — com RLS ativo, Supabase não entrega eventos entre usuários diferentes sem filtro explícito
- **Fix**: adicionado `filter` em todos os contexts sem filtro: VendasContext, LeadsContext, AgendaContext, PacientesContext, SocialContext
- FinanceiroContext já tinha filtro correto e funcionava
- Channel names renomeados de `:all` para `:${clinicaId}`

### Social Media — Badge de leads novos no calendário
- Calendário de Posts agora mostra badge laranja (ícone pessoas + número) nos dias com leads novos
- Conta apenas `origem === 'leads_novos'` — recorrentes e indicações não contam
- `leadsPorDia` calculado filtrando `leads` do contexto por mês/dia

**Why:** Sessão de melhorias de UX e fix crítico de sync entre usuários.
**How to apply:** Realtime com RLS exige `filter` explícito — sempre adicionar ao criar novas subscriptions.
