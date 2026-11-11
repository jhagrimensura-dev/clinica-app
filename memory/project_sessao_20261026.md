---
name: project_sessao_20261026
description: "Sessão 2026-10-26 — Histórico Financeiro (tabela editável, gráfico, linha 2027), Social Media rotina semanal, dedup automático de leads"
metadata: 
  node_type: memory
  type: project
  originSessionId: ee219fa4-2dea-4f0a-a7aa-cbc9a9fe6bc6
---

## Histórico Financeiro (nova aba no Financeiro) (10-26)

Nova aba "Histórico" no menu lateral Financeiro (junto com "Fluxo de Caixa").

**Funcionalidades:**
- Tabela com faturamento real por mês, para cada ano (2022–2026 + linha 2027 planejamento)
- Dados salvos na tabela `configuracoes` (chave/valor) no Supabase
- Todos os campos são editáveis com clique — save automático no Supabase
- Gráfico toggle linha/barras com valores reais (sem arredondamento)
- Maior faturamento por mês destacado em verde
- Zebra striping nas linhas (gray-100 para melhor contraste)
- Linha 2027 com fundo azul e inputs sempre visíveis (para planejamento)
- Comparação vs: 2026 sempre compara com 2025 (mesmo ano anterior, não o selecionado)

**Dados seed:** valores 2022–2025 inseridos manualmente na `configuracoes`.

**Bug resolvido:** `useState tipoGrafico` deve estar ANTES do early return (Rules of Hooks).

**How to apply:** ao adicionar dados históricos, inserir em `configuracoes` com chave `historico_YYYY_MM`.

---

## Social Media — Rotina Semanal (10-26)

Nova funcionalidade na página Social Media: rotina semanal com template pré-definido e fluxo de aprovação.
Permite criar e acompanhar o status de cada post/story da semana.

---

## Dedup automático de leads (10-26)

Deduplicação de leads agora roda automaticamente:
- Ao carregar a página (LeadsContext ou Dashboard)
- Ao sincronizar planilhas

**Why:** leads duplicados estavam aparecendo no Dashboard e inflando contagens. O banner de duplicatas já existia mas precisava de clique manual.

**How to apply:** ao importar leads em bulk, a dedup roda sozinha — não precisa mais clicar no banner.
