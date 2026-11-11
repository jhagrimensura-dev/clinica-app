---
name: project_sessao_20260929
description: Sessão 2026-09-29 — fix MCP leads zerados + banner duplicatas persiste dismiss
metadata:
  node_type: memory
  type: project
  originSessionId: current
---

## O que foi feito

### Fix MCP — leads zerados (root cause: .like() em coluna date)
- Todos os tools do MCP retornavam `total_mes: 0` para leads
- Root cause: coluna `data` em `planilha_leads` é tipo `date` no Postgres — `.like()` lança erro `operator does not exist: date ~~ unknown`
- Fix: substituiu todos `.like('data', '${prefix}%')` por `.gte('data', ini).lt('data', fim)` em todo o `mcp/index.js`
- Adicionado helper `rangesMes(ano, mes)` que retorna `{ ini: '2026-09-01', fim: '2026-10-01' }`
- Resultado correto após fix: 99 leads setembro, 12 agendaram, 7 venderam
- Arquivo: `mcp/index.js`

**Why:** Postgres não aceita operador LIKE (`~~`) em colunas do tipo `date` — só funciona em `text`/`varchar`. Sempre usar `.gte()/.lt()` para filtrar por período em colunas date.

### Fix banner duplicatas — dismiss persiste após reload
- Antes: estado `bannerDupDismissed` era apenas React state, resetava a cada reload
- Fix: ao clicar X, salva fingerprint (telefones ordenados concatenados) no `localStorage('dup_dismissed')`
- No mount, `useEffect` compara fingerprint atual com o salvo — se igual, começa dispensado
- Se aparecer duplicata nova (telefone diferente), banner volta automaticamente
- Arquivo: `src/pages/LeadsNovos.jsx`

**How to apply:** Para persistir dismiss de banners de aviso, usar fingerprint do conteúdo no localStorage em vez de flag booleana simples — assim o aviso volta se o conteúdo mudar.
