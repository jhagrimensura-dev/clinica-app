---
name: project_sessao_20260826
description: "Sessão 26/08/2026 — import CSV 90 leads agosto, fix indicações invisíveis, crash proximoFollowup, taxa de conversão inclui indicações"
metadata: 
  node_type: memory
  type: project
  originSessionId: 520125a0-05f3-4155-93d8-06fb006eb97c
---

Import de 90 leads de agosto 2026 na página Leads Novos. Vários bugs corrigidos.

**Fixes aplicados:**
1. `LeadsNovos.jsx` import: leads com `origemCustom === 'Indicação'` agora recebem `origem: 'indicacao'` (não `'leads_novos'`)
2. `LeadsContext.jsx`: migration automática no `fetchAll` corrige leads antigos com `origem_custom = 'Indicação'` e `origem = 'leads_novos'` → atualiza para `origem = 'indicacao'`
3. `Indicacao.jsx` `ModalEditarLead`: faltava `const [proximoFollowup, setProximoFollowup] = useState(lead.proximoFollowup || '')` — causava crash ao clicar no lead
4. Taxa de conversão agora usa `leads.length + leadsIndicacao.length` no denominador (inclui indicações)
5. "Total de Leads" no card agora mostra `totalLeadsMes` (novos + indicações)

**Resultado final:** Total 90 (84 novos + 6 indicações), taxa 8 ÷ 90 = 8.9%

**Why:** Indicações importadas via CSV estavam invisíveis em ambas as views (leads_novos excluía origemCustom=Indicação, indicacao exigia origem=indicacao). Fix retroativo via migration no contexto.

**How to apply:** Sempre que mexer no campo `origem` de leads, verificar impacto nas duas views E nos dados já existentes no banco. Fazer migration junto com o fix de código.
