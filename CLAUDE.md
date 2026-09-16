# Clínica App — Contexto para Claude Code

## O que é esse projeto

Sistema de gestão comercial para a clínica estética **Dra. Amanda Lima** (`draamandaliima.com.br`).
Substituiu planilhas e Google Sheets. Acesso via web em qualquer computador.

**Stack:** React + Vite + Tailwind CSS + Supabase (banco + auth + realtime) + Vercel (deploy)

---

## Regras importantes

- **Sempre fazer `vercel --prod` antes de pedir ao usuário para testar** — ele usa só o site de produção, nunca localhost
- **Commitar automaticamente** toda vez que uma feature for confirmada como funcionando
- **Não sincronizar leads automaticamente via useEffect** — nunca alterar status de leads via side effects; preferir leitura cruzada de contextos
- **Consultas nunca entram na contagem de vendas/ticket médio** — entram só no valor do faturamento
- **Deduplicação de lembretes** fica dentro de `addLembrete` (AgendaContext), não nos chamadores
- **Nunca referenciar let/const antes da declaração** em handlers de webhook
- **Perguntar antes de implementar** quando localização/formato não for explícito
- **src/pages/ com letra minúscula** — maiúsculo quebra o build no Linux (Vercel)
- O site de produção é **draamandaliima.com.br**

---

## Estrutura do projeto

```
src/
  pages/          — páginas do sistema (uma por módulo)
  components/     — componentes reutilizáveis (Sidebar, etc.)
  context/        — contextos React (dados globais)
  lib/supabase.js — cliente Supabase
  App.jsx         — roteamento principal
```

### Páginas existentes

| Arquivo | Descrição |
|---|---|
| Dashboard.jsx | Visão geral: faturamento, leads, agendamentos, metas |
| Faturamento.jsx | Lançamentos financeiros (consultas + procedimentos) |
| Financeiro.jsx | Contas a pagar, fluxo de caixa |
| Agenda.jsx | Calendário de agendamentos |
| AgendaLembretes.jsx | Lembretes por lead |
| LeadsNovos.jsx | Kanban de leads novos (Instagram, indicação, etc.) |
| LeadsFollowUp.jsx | Leads em follow-up |
| LeadsPorOrigem.jsx | Análise de leads por origem/mídia |
| PlanilhaLeads.jsx | Planilha editável inline (substitui Google Sheets) — tabela de leads com follow-ups |
| Indicacao.jsx | Leads vindos por indicação |
| LeadsRecorrentes.jsx | Pacientes recorrentes |
| InboxWhatsApp.jsx | Inbox do WhatsApp (Evolution API) |
| InstagramAnalytics.jsx | Painel de métricas do Instagram |
| SocialMedia.jsx | Gestão de posts/stories |
| Colaboradoras.jsx | Calculadora de bônus por colaboradora (Fernanda/Adriele) |
| Pacientes.jsx | Cadastro de pacientes |
| PosTratamento.jsx | Pós procedimento / acompanhamento |
| Metas.jsx | Metas mensais |
| Configuracoes.jsx | Configurações da clínica |
| Comercial.jsx | Visão comercial |

### Contextos (dados globais)

| Contexto | Dados |
|---|---|
| AuthContext | clinicaId, usuário logado |
| LeadsContext | leads (Supabase, realtime) |
| FinanceiroContext | lançamentos financeiros |
| AgendaContext | agendamentos + lembretes |
| VendasContext | vendas/procedimentos |
| PacientesContext | cadastro de pacientes |
| SocialContext | dados Instagram |
| ContasContext | contas a pagar |
| ClinicaContext | dados da clínica |
| ConfigContext | configurações gerais |

---

## Banco de dados (Supabase)

Todas as tabelas têm RLS ativado com política baseada em `clinica_master.admin_id`.

### Tabelas principais

- `leads` — leads novos e follow-ups
- `lancamentos` — faturamento (consultas e procedimentos)
- `agendamentos` — agenda
- `lembretes` — lembretes por lead
- `pacientes` — cadastro de pacientes
- `planilha_leads` — planilha de leads novos (substitui Google Sheets)
- `configuracoes` — chave/valor para metas e configurações
- `contas_pagar` — contas a pagar
- `clinica_master` — dados da clínica + credenciais

### Tabela planilha_leads

Colunas: `id, clinica_id, data, nome, telefone, origem, criativo, agendou (bool), compareceu (bool), vendeu (bool), consulta, valor_procedimento, follow_up_1..5 (date), follow_ups_feitos (text), observacao, criado_em`

- `follow_ups_feitos`: string com índices separados por vírgula, ex: `"1,3"` = follow_up_1 e follow_up_3 marcados como feitos
- Clique na pílula da data = toggle verde (feito) / cinza
- Ícone de lápis no hover = editar a data

---

## WhatsApp / Mensagens

Usa **Evolution API** hospedada no Railway. Webhook recebe mensagens e salva no Supabase.
Não usa mais Z-API.

---

## Instagram

Painel orgânico conectado via Graph API v20+. Dados salvos no Supabase.
Anúncios: Instagram Impulsionar (bio/stories) vs Tráfego no Gerenciador (identificado por emoji no nome).

---

## Deploy

```bash
vercel --prod
```

Projeto no Vercel: `joao-henrique-s-projects1/clinica-app`
Repositório GitHub: `jhagrimensura-dev/clinica-app`

---

## Colaboradoras

- **Fernanda** e **Adriele** — abas separadas em Colaboradoras
- Salário base editável por colaboradora
- Calculadora de bônus com metas mensais editáveis
