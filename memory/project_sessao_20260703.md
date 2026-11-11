---
name: project-sessao-20260703
description: Sessão 2026-07-03 — Pós Procedimento + anúncio CTW no inbox + Colaboradoras (calculadora de bônus completa)
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

## Módulo Pós Procedimento (`src/pages/PosTratamento.jsx`)

Criado módulo completo de acompanhamento pós-atendimento, acessível no submenu WhatsApp da sidebar.

**Estrutura de dados:** reusa tabela `leads` com `origem: 'pos_tratamento'`. Lembretes armazenados como JSON no campo `obs`: `{ lembretes: [{ data, hora, obs }] }`. Sem vínculo com a agenda comercial de lembretes.

**Calendário próprio (semanal, estilo Agenda):**
- Mini calendário na esquerda + seção "Próximos"
- Visão semanal com colunas Dom–Sáb e horários 07:00–20:00
- Lembretes aparecem nos slots corretos, coloridos por status
- Clique no bloco abre direto o modal de edição
- Navegação por semana + botão "Hoje"

**Modal Novo:**
- Autocomplete de pacientes da base (`usePacientes`)
- 3 lembretes pré-preenchidos: "1º Contato" (+3 dias), "2º Contato" (+5 dias), "3º Contato" (+7 dias), todos às 09:00
- Campo observação por lembrete

**Modal Editar:**
- Selector de status (4 opções): Pendente, Contatado, Sem resposta, Concluído
- Lembretes editáveis com obs

**Tabela:**
- Clique na linha abre edição (sem botão "Editar" separado)
- Botão excluir visível para todos (não só admin)
- Nome riscado quando status = Concluído
- Coluna Status removida
- Cards de resumo (Total/Pendentes/etc) removidos

**Sidebar:** item "Pós Procedimento" no submenu WhatsApp (icon: coração com check). `PAGE_PARENT['pos_tratamento'] = 'comercial'`.

**Renomeações:** "Pós Tratamento" → "Pós Procedimento" em toda a UI (sidebar, cabeçalho da página, modal).

---

## Anúncio Click-to-WhatsApp no Inbox

Quando lead chega pelo clique em anúncio do Instagram/Facebook, Z-API envia campo `referral` no webhook com título e thumbnail do anúncio.

**Webhook (`api/webhook-whatsapp.js`):**
- Extrai `payload?.referral || payload?.referralAd`
- Salva `referral_anuncio` (headline/body/title) e `referral_thumbnail` (thumbnailUrl)

**Supabase — colunas adicionadas manualmente:**
```sql
ALTER TABLE whatsapp_mensagens ADD COLUMN IF NOT EXISTS referral_anuncio TEXT;
ALTER TABLE whatsapp_mensagens ADD COLUMN IF NOT EXISTS referral_thumbnail TEXT;
```

**InboxWhatsApp:** card roxo acima da primeira mensagem mostrando miniatura (40x40px) + label "ANÚNCIO" + nome da campanha. Só aparece quando `referralAnuncio` está preenchido.

---

## Colaboradoras (`src/pages/Colaboradoras.jsx`)

Nova página em **Financeiro → Colaboradoras** com calculadora de bonificação mensal.

**Estrutura do plano comercial:**
- Salário base: R$ 3.000
- Bônus semanais (acumulam): Aceitável R$45k→+R$50 | Ideal R$50k→+R$100 | Super Meta R$54.45k→+R$150
- Bônus mensal (acumulam): Aceitável R$180k→+R$300 | Ideal R$200k→+R$500 | Super Meta R$217.8k→+R$800
- Bônus conversão: taxa = leads convertidos/total; 10-15%→10% das consultas | 15-20%→15% | >20%→20%
- Bônus recorrência (acumulam): Aceitável R$72k→+R$150 | Ideal R$80k→+R$250 | Super Meta R$87.12k→+R$400

**UI:** 4 semanas com inputs, bônus calculado por tier, tabelas de referência, painel resumo fixo à direita com barra visual de composição. Dados salvos em localStorage por mês (`colaboradoras_YYYY_M`). Navegação por mês.

**Sidebar:** `PAGE_PARENT['colaboradoras'] = 'financeiro'`

---

## Ajuda — "De onde vêm os leads?" + InfoTooltip

**Página Ajuda:** nova seção no topo explicando os dois tipos de anúncio:
- 📸 Instagram Impulsionar → Link da Bio / Link dos Stories
- 📊 Tráfego Gerenciador → campanha Meta Ads com emoji+❤️+🔵 no nome

**Componente reutilizável `src/components/InfoTooltip.jsx`:**
- Bolinha cinza com "i", tooltip escuro aparece no hover
- Adicionado ao campo **Mídia** no InboxWhatsApp com explicação completa
- Reutilizável: `<InfoTooltip>conteúdo JSX</InfoTooltip>`

---

---

## Colaboradoras — Calculadora de Bônus (continuação da sessão)

`src/pages/Colaboradoras.jsx` — página completa com todas as funcionalidades finalizadas e bugfixes.

### Estrutura de cálculo

- **Salário base:** R$3.000
- **Bônus semanal:** tier mais alto atingido (NÃO acumulativo entre tiers da mesma semana). Aceitável R$45k→+R$50 | Ideal R$50k→+R$100 | Super Meta R$54.45k→+R$150
- **Bônus mensal:** mesmo critério. Aceitável R$180k→+R$300 | Ideal R$200k→+R$500 | Super Meta R$217.8k→+R$800
- **Bônus conversão:** `taxa = leadsConvertidos/totalLeads * 100`. 10-15%→10% das consultas | 15-20% (inclusive 20%)→15% | >20% (estritamente)→20%
- **Bônus recorrência:** mesmo critério. Aceitável R$72k→+R$150 | Ideal R$80k→+R$250 | Super Meta R$87.12k→+R$400

### Metas editáveis por mês

Tiers armazenados dentro do `dados` no localStorage (`colaboradoras_YYYY_M`). Cada mês tem suas próprias metas. Campos editáveis aparecem na seção "Editar metas" de cada bloco.

### Puxar do sistema

| Campo | Fonte |
|---|---|
| Semanas (vendido) | `lancamentos` tipo='Novo', agrupados por `semanaDoMes(dia)` (1-7=S1, 8-14=S2, 15-21=S3, 22+=S4) |
| Faturamento mensal | Todos os `lancamentos` do mês: `valorTratamento + valorTaxa` |
| Recorrência | `lancamentos` tipo='Recorrência', só `valorTratamento` |
| Valor das consultas | Todos os `lancamentos` do mês, soma de `valorTaxa` |
| Total leads / convertidos | `useLeads()`, filtra `origem !== 'pos_tratamento'`, mês pelo campo `data`. Convertidos = `status === 'fechado'` |

### Bugs corrigidos nesta sessão

1. `MoneyInput` não sincronizava ao clicar Puxar → `useEffect` com guard `parseMoney(raw) !== value`
2. Badge de conversão a 20% exato mostrava "20% das consultas" (errado) → corrigido para `> 20` (estritamente maior)
3. `fatTotalDoMes` só somava `valorTratamento`, ignorava `valorTaxa` → corrigido para incluir consultas
4. `calcBonusAcum` acumulava todos os tiers atingidos → corrigido para retornar só o maior

### Layout dos cards de semana

Linha horizontal: `Semana N` | input Vendido | 3 mini-boxes de meta (verde quando atingida) | TierBadge | bônus. Barra de progresso fina embaixo mostrando % rumo à Super Meta. TierBadge some quando abaixo de qualquer meta.

### Isolamento — sem efeitos colaterais

Colaboradoras só faz leitura dos contexts (VendasContext, LeadsContext). Escreve apenas em localStorage. Não afeta nenhuma outra aba.

---

## Diagnóstico WhatsApp — mensagens do celular

- Configuração Z-API está correta: "Notificar as enviadas por mim também" = ON
- Mensagens antigas (antes do webhook ser ligado) = perdidas, não recuperáveis
- Mensagens novas enviadas pelo celular aparecem no sistema SE o contato já tiver mandado pelo menos uma mensagem (necessário para resolver o `@lid` → número real)
- Configurações ao receber: todos os "Ignorar" desligados — todos os tipos capturados
