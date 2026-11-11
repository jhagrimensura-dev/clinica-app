---
name: project-sessao-20260819
description: Sessão 2026-08-19 — Fix clique no calendário Pós Procedimento (z-index) + CSV import Leads Novos
metadata: 
  node_type: memory
  type: project
  originSessionId: 678d0706-7577-4bd1-b807-d4911e61f33c
---

## Fix calendário Pós Procedimento — z-index nos blocos

**Bug:** clicar no último bloco de um slot com múltiplas entradas (ex: Daysa às 11:00 com Mariana + Thiago + Daysa) não abria modal.

**Causa raiz:** slot de 40px altura fixa. Com 3 entradas (~20px cada), a última estourava para fora do slot e o div do slot seguinte (irmão no DOM, renderizado depois) ficava sobreposto e capturava o clique.

**Fix:** adicionado `relative z-10` nos blocos de entrada do calendário (`CalendarioPos`, `src/pages/PosTratamento.jsx`). Elementos posicionados com z-index explícito ficam acima dos divs irmãos sem z-index.

**Why:** o slot cell tem `position: relative` sem z-index, então o bloco de entrada com `z-index: 10` fica acima dos slots seguintes quando overflow ocorre.

## Importação CSV — Leads Novos

Adicionado botão "Importar CSV" na página Leads Novos (`src/pages/LeadsNovos.jsx`).
- Normaliza data (dd/mm/yyyy → yyyy-mm-dd), origem e status
- Detecta duplicatas por nome e telefone (ignora duplicatas, importa apenas novos)
- Modal de confirmação com preview dos leads novos vs. já existentes
