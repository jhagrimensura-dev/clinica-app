---
name: project_sessao_20260827
description: "Sessão 27/08/2026 — import Follow Up 141 leads, 4 fixes de dedup/data/origem"
metadata: 
  node_type: memory
  type: project
  originSessionId: 520125a0-05f3-4155-93d8-06fb006eb97c
---

Import de 141 leads de agosto 2026 na página Leads Follow Up. Quatro bugs corrigidos.

**Fixes aplicados:**
1. **Dedup mês-escopo no Follow Up** (`LeadsFollowUp.jsx`): dedup do import agora compara só contra leads do mesmo mês (não todos os meses). Leads de julho com mesmo telefone não bloqueavam mais agosto.
2. **parseData tolerante** (`LeadsFollowUp.jsx`): `06/08//2026` (duplo slash) e `07/082026` (sem slash) agora parseiam corretamente para `2026-08-06` e `2026-08-07`.
3. **Suspeitos default 'importar'** (`LeadsFollowUp.jsx`): primeiro nome igual vai para suspeitos (não duplicata), com default 'importar'. Dedup por nome exato também foi para suspeitos (não bloqueio total), evitando bloquear dois "Sem Nome" com telefones diferentes.
4. **Duplicatas Leads Novos ignora Follow Up** (`LeadsNovos.jsx`): `gruposDuplicatas` filtrado por `leads_novos | indicacao` — deixou de mostrar falsos alertas quando o mesmo telefone existe em Follow Up e em Leads Novos.

**Resultado final:** 141 leads em agosto no Follow Up, banner de duplicatas sumiu do Leads Novos.

**Why:** Leads de meses anteriores bloqueavam import do mês corrente; datas digitadas erradas viravam leads invisíveis; dois "Sem Nome" diferentes bloqueavam um ao outro; Follow Up e Leads Novos compartilham telefones mas são pipelines independentes.

**How to apply:** Sempre escopar dedup de import por mês quando a entidade tem histórico multi-mês. Nunca usar nome como critério de bloqueio total — só telefone bloqueia, nome vai para suspeitos.
