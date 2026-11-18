---
name: project_sessao_20261118
description: "Sessão 2026-11-18 — PlanilhaLeads melhorias visuais: cores por célula, abas de mês, sort DATA, Agendou Sim/Não, criativos coloridos com dropdown, colunas RESPONDEU, sticky header, fundo cinza"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2a49cf6a-90ac-449c-b78e-48bbd1c57704
---

## PlanilhaLeads.jsx — Refactor visual completo (sessão 2026-11-18)

Replicação do layout Lumy CRM na PlanilhaLeads.

### Features implementadas

**Cores por célula (right-click)**
- Paleta de cores (direita do mouse) salva em coluna JSONB `cell_colors` no Supabase
- `cloneElement` para adicionar `style` e `onContextMenu` nos `<td>` — DEVE fazer merge de style: `style: { ...(cell.props.style || {}), ...(bg ? { backgroundColor: bg } : {}) }`

**Navegação por mês**
- Abas Jan–Dez com seta de ano; aba ativa = laranja sólido
- Filtra rows por `data` no mês/ano selecionado

**Sort só na coluna DATA**
- Seta ↕ / ↑ / ↓ apenas em DATA; outras colunas sem sort

**Agendou simplificado**
- Campo `agendou_tipo`: apenas "Sim" (verde) ou "Não" (vermelho/cinza)

**Criativos coloridos**
- Dropdown com badges coloridas por hash determinístico do nome
- Paleta CRIATIVO_PALETTE de 8 cores
- Busca + opção "Adicionar novo"
- Flip logic para dropdown perto do rodapé: `const y = spaceBelow < 320 ? e.clientY - 320 : e.clientY + 8`

**Colunas RESPONDEU**
- fuIndex 1–5, intercaladas após cada Follow Up
- Estado derivado de `follow_ups_feitos` (string CSV de índices 1-based)
- Clique toggle verde/cinza + salva no Supabase

**Sticky header**
- `<thead className="sticky top-0 z-10 bg-gray-200">` — bg-gray-200 no thead (não só no tr) para cobrir largura total no scroll horizontal

**Fundo da página**
- `<div className="p-3 sm:p-6 space-y-5 min-h-screen bg-gray-100">` — cinza visível para contrastar com cards brancos

### Import parser (parseSheetRows)
Mapeamento exato das colunas Google Sheets:
- col[0]=data, col[1]=nome, col[2]=tel, col[3]=origem, col[4]=criativo
- col[5]=agendou, col[6]=compareceu, col[7]=vendeu, col[8]=reagendado
- col[9]=consulta, col[10]=valor
- col[11]=fu1, col[12]=respondeu1, col[13]=fu2, col[14]=respondeu2
- col[15]=fu3, col[16]=respondeu3, col[17]=fu4, col[18]=fu5, col[19]=obs
- Nota: Google Sheets original NÃO tem RESPONDEU após fu4/fu5 (só no app)

### Bugs resolvidos
- `cloneElement` sobrescrevia `style` inline → merge obrigatório
- `consulta` era `type: 'currency'` mas campo é texto livre → voltou para `type: 'text'` com renderização condicional (só mostra R$ se número válido e ≠ 0)
- Parser antigo usava cols[11-18] errados → "NÃO | NÃO | NÃO" na observação
- Dropdown criativo abria fora da tela → flip logic
- Header cinza não cobria scroll horizontal → bg-gray-200 no thead

**Why:** Substituir Google Sheets; colaboradora usa o sistema interno.
**How to apply:** Qualquer ajuste na PlanilhaLeads deve preservar o merge de style no cloneElement e o mapeamento de colunas do import parser.
