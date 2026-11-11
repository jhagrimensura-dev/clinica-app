---
name: project-sessao-20260624
description: Sessão 2026-06-24 — Realtime todos contexts + migração completa localStorage → Supabase
metadata: 
  node_type: memory
  type: project
  originSessionId: a5e27418-829b-497a-8ae2-31fde232bf1c
---

Sessão focada em sincronização total entre Mac e Windows.

## Parte 1 (início da sessão — contexto compactado)
- Realtime subscriptions adicionadas a todos os contexts (PacientesContext, LeadsContext, VendasContext, ContasContext, FinanceiroContext, ClinicaContext)
- Migração localStorage → Supabase para Metas e Financeiro
- SocialContext criado (tráfego/seguidores por mês em `social_metricas`, rotina em `social_rotina`)

## Parte 2 (esta sessão)
Migração completa de TODAS as páginas restantes:

- `AgendaContext.jsx` (criado): agendamentos e lembretes em tabelas `agendamentos` e `agenda_lembretes`
- `ConfigContext.jsx` (criado): config_clinica, config_perfil, config_equipe, procedimentos_cadastro, lead_origens, lead_status, ia_conhecimento, ia_exemplos, respostas_rapidas — tabela `configuracoes` (chave/valor)
- `App.jsx`: AgendaProvider e ConfigProvider adicionados ao wrapper (fora de ClinicaProvider, usam useAuth diretamente)
- `Agenda.jsx` + `AgendaLembretes.jsx`: migrados para AgendaContext
- `Dashboard.jsx`: usa SocialContext + chama carregarMes ao montar
- `Faturamento.jsx`: procedimentos via ConfigContext
- `InboxWhatsApp.jsx`: lead_origens, lead_status, ia_conhecimento, ia_exemplos, respostas_rapidas via ConfigContext; lembretes via AgendaContext (removida dependência de AgendaLembretes.jsx)
- `Configuracoes.jsx`: TabClinica, TabPerfil, TabEquipe migradas para ConfigContext

## Fix Social Media Windows (commit 054979d)
- Bug 1: Dashboard nunca chamava `carregarMes` → dados sempre 0 no Windows no load inicial
- Bug 2: stale closure em `setTrafego`/`setSeguidores` → usava closure antiga de `metricas`, podendo salvar seguidores=0 no Supabase
- Fix: `metricasRef` sempre atualizado em sync com o state, setTimeout usa o ref em vez do closure

**How to apply:** Qualquer novo dado persistente deve usar um dos contexts existentes. Nunca usar localStorage diretamente para dados que precisam sincronizar entre dispositivos.
