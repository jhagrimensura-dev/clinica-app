---
name: project_sessao_20261013_15
description: "Sessão 2026-10-13 a 10-19 — Card Conversão na Cadeira, agendados da planilha, reagendado, fix sync leads novos, follow-up no card, Colaboradoras conversão fix, bônus por colaboradora"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2e0d4233-f0a1-4c9c-881f-78f68a0e50dc
---

## Dashboard — Agendados da planilha_leads

Agendados no Dashboard agora lê de `planilha_leads.agendou = true` (não do Faturamento).
Dashboard faz fetch de `planilha_leads` com `nome, origem, agendou, compareceu, vendeu, reagendado` para o mês selecionado.

**Why:** Faturamento só tem quem foi lançado; planilha tem quem marcou consulta (mais real).

---

## Card "Conversão na Cadeira" (Dashboard — 4ª coluna da linha 1)

Calcula vendas/comparecimentos da `planilha_leads`:

- `cadeiraCompareceu` = `compareceu=true AND (!reagendado OR vendeu)` — exclui só quem reagendou sem decidir
- `cadeiraVendeu` = `compareceu=true AND vendeu=true`
- Taxa = cadeiraVendeu / cadeiraCompareceu

**Lista de nomes no card:**
- ✓ verde = compareceu + vendeu (incluindo reagendado+vendeu, mostra `· out`)
- ✗ vermelho = compareceu + !vendeu + !reagendado
- ↻ verde = reagendado + !vendeu (veio, não decidiu ainda)

Barra de scroll ativa com maxHeight `9rem` (~6 nomes).

---

## Coluna `reagendado` na planilha_leads

Adicionada coluna `reagendado boolean DEFAULT false` no Supabase (SQL executado pelo usuário).

**Semântica:**
- `reagendado=true, vendeu=false` = veio mas não decidiu, remarcou → fora do denominador
- `reagendado=true, vendeu=true` = converteu mas procedimento é no próximo mês → conta como conversão

**Posição no Google Sheets:** col I, após Vendeu (col H), antes de Consulta (col J).
Layout completo: Data|Nome|Tel|Origem|Criativo|Agendou|Compareceu|Vendeu|**Reagendado**|Consulta|Valor|FU1|FU2|FU3|FU4|FU5|Obs

Tanto `parseSheetRows` (PlanilhaLeads.jsx) quanto `sync-planilha.js` (API) já leem a coluna na posição 8.

**Importante:** o app não puxa do Google Sheets em tempo real. Qualquer alteração feita no Sheets só reflete no app após clicar em "Sincronizar Planilhas" no Dashboard.

**Cache do Google Sheets:** a versão publicada (CSV) pode demorar até 5 minutos para refletir mudanças. Esperar ~5 min após salvar no Sheets antes de sincronizar.

**Google Sheets API autenticada (decisão):** avaliado e descartado por ora. Resolveria só o delay de 5 min, mas adiciona complexidade de setup (Google Cloud, service account). Não compensa pelo ganho pequeno. Retomar se o delay virar problema real no dia a dia.

---

## Fix sync-planilha — leads novos zerados no Dashboard

**Bug:** botão "Sincronizar Planilhas" salvava em `planilha_leads` mas não criava registros em `leads`.
O Dashboard lia `leadsNovosReais` da tabela `leads` → aparecia 0.

**Fix:** `api/sync-planilha.js` agora faz upsert em `leads` após inserir em `planilha_leads`, igual ao import manual (`syncBatchToLeads`).

---

## Taxa de Conversão na PlanilhaLeads

Mudada de `vendeuCount/total` para `agendouCount/total` (leads→agendamentos).
Subtexto: `{agendouCount} agendados · {vendeuCount} vendas`.

---

## CAC

Usa `lConsultas.filter(l => l.tipo === 'Novo').length` do Faturamento — apenas consultas tipo Novo, não Indicação.

---

## Follow-up no Card "Conversão na Cadeira" (2026-10-15)

Dashboard também busca `planilha_followup` (estado `followupRows`) para o mesmo período, filtrando `vendeu=SIM`.

- `fuCadeira = followupRows.filter(r => r.vendeu)` — sem `compareceu` no followup, só conta quem fechou
- `cadeiraCompareceu` += `fuCadeira.length`
- `cadeiraVendeu` += `fuCadeira.length`
- Aparece no card como `✓ Nome · follow`

---

## `vendeu=SIM` implica `compareceu` (2026-10-15)

Leads de indicação (e outros) podem ter `vendeu=SIM` sem `compareceu` marcado na planilha.
Fix: tratar `vendeu=true` como prova de presença.

```js
const veioNaCadeira = r => (r.compareceu || r.vendeu) && (!r.reagendado || r.vendeu)
const cadeiraCompareceu = planilhaRows.filter(veioNaCadeira).length + fuCadeira.length
const cadeiraVendeu = planilhaRows.filter(r => r.vendeu).length + fuCadeira.length
```

Display:
- ✓ verde = `r.vendeu` (com ou sem compareceu marcado)
- ✗ vermelho = `r.compareceu && !r.vendeu && !r.reagendado`
- ↻ verde = `r.reagendado && !r.vendeu`

---

## Card Conversão — agendamentos + taxa geral (2026-10-16)

Card "Conversão" no Funil mostra contagem de agendamentos antes da % de cada linha:
- `Leads Novos: 5 agend. · 8.3%`
- `Leads Follow: 3 agend. · 4.0%`

Taxa geral = soma simples das duas taxas: `convComercial = parseFloat(convNovos) + parseFloat(convFollow)`.
Subtexto: `{totalAgendGeral} agend. · taxa geral`.

**Atenção:** `convComercial` deve ser declarado DEPOIS de `convNovos` (que é declarado depois). Ordem correta: `totalAgendGeral` → `convNovos` → `convRecorrencia` → `convComercial`.

---

## Fix fuAgendado = 0 no card Leads Follow (2026-10-16)

**Bug:** leads de follow-up com `agendou=SIM AND vendeu=SIM` tinham status `fechado` (não `agendado`) no banco. `fuAgendado = leadsFollowUp.filter(l => l.status === 'agendado').length` retornava 0.

**Fix:** `followupRows` (já buscado de `planilha_followup`) agora inclui `agendou` no select. Card Leads Follow exibe:
- `followupRows.filter(r => r.agendou).length` agendado
- `followupRows.filter(r => r.vendeu).length` vendido

Contagens do card Conversão na Cadeira continuam usando `fuCadeira` (vendeu=SIM), sem mudança.

---

## Média de seguidores por dia (2026-10-16)

`seguidoresPorDia = (seguidores / 30).toFixed(1)` — sempre divide por 30 dias fixos (não pelos dias decorridos do mês).

Exibido em dois lugares:
- Card **Seguidores** (seção Social Media): sub `~11.0/dia · R$ X por seguidor`
- Card **Social Media** (Funil): extra `~11.0 seguidores/dia` como primeira linha

---

## Colaboradoras — Bônus por colaboradora (2026-10-16 a 10-19)

**Fernanda:** Bônus Semanal + Bônus Mensal + Bônus por Conversão. SEM Recorrência.
**Adriele:** Bônus Mensal + Bônus Recorrência. SEM Semanal e SEM Conversão.

Implementado via `activeTab` (card e resumo lateral):
- Bônus Semanal: `{activeTab !== 'Adriele' && ...}`
- Bônus por Conversão: `{activeTab !== 'Adriele' && ...}`
- Bônus Recorrência: `{activeTab !== 'Fernanda' && ...}`

---

## Bônus Recorrência — nova lógica (2026-10-19)

**Cálculo:**
- `taxaRecorrencia = recorrentesAgendados / totalRecorrentes × 100`
- `bonusRecorrencia = taxa > 15% ? feitos × R$20 : taxa > 10% ? feitos × R$15 : 0`
- "feitos" = `vendeu=SIM` na planilha_recorrentes (procedimento realmente feito)

**Dados do Supabase:** `planilha_recorrentes` (`agendou`, `vendeu`) para o mês selecionado.
`planilhaRecRows` buscado no useEffect junto com planilha_leads e planilha_followup.

**Caso cross-month:** paciente que agenda em outubro mas vem em novembro → `agendou=SIM` em outubro (entra na taxa), `vendeu=SIM` só em novembro quando vier (bônus cai em novembro).

**Campos no state:** `totalRecorrentes`, `recorrentesAgendados`, `recorrentesFeitos` (substituem `fatRecorrencia`).

---

## Colaboradoras — Bônus por Conversão (2026-10-16)

**Bug:** `leadsDoMes` pegava TODOS os leads do mês (244), incluindo follow-ups e recorrentes → taxa de conversão artificialmente baixa (1.2%).

**Fix:** `leadsDoMes` agora retorna objeto `{ novos, followAgendados }`:
- `novos` = `leads_novos + indicacao` do mês (total)
- `followAgendados` = `leads_followup` com `status === 'agendado' || 'fechado'` (só os que agendaram)

Cálculo:
- `totalLeadsConversao = novos.length + followAgendados.length`
- `totalConvertidosConversao = novosFechados.length + followAgendados.length`
  (follow agendados contam como convertidos — agendar é o sucesso do follow)

Botão "Puxar do sistema" usa `totalLeadsConversao` e `totalConvertidosConversao`.
Mensagem exibe: "X leads novos + Y follow agendados em [Mês], sendo Z convertidos".

**Fix 2026-10-19:** tabela `leads` acumulava registros de múltiplas sincronizações → 611 leads novos em outubro (errado). Solução: Colaboradoras agora busca direto de `planilha_leads` (campo `vendeu`) e `planilha_followup` (campo `agendou`) via useEffect com `supabase`, igual ao Dashboard. Não usa mais LeadsContext para esse cálculo.
