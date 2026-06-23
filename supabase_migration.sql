-- ============================================================
-- MIGRAÇÃO COMPLETA — clinica-app
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
  id TEXT PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  whatsapp TEXT DEFAULT '',
  nascimento TEXT DEFAULT '',
  sexo TEXT DEFAULT '',
  status TEXT DEFAULT 'Ativo',
  anotacoes TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_pacientes" ON pacientes;
CREATE POLICY "clinic_pacientes" ON pacientes FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  origem TEXT DEFAULT '',
  origem_custom TEXT DEFAULT '',
  data TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  fonte TEXT DEFAULT '',
  status TEXT DEFAULT 'em_aberto',
  agendado_para TEXT,
  proximo_followup TEXT DEFAULT '',
  obs TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_leads" ON leads;
CREATE POLICY "clinic_leads" ON leads FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);

-- LANCAMENTOS (vendas)
CREATE TABLE IF NOT EXISTS lancamentos (
  id TEXT PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente TEXT DEFAULT '',
  data TEXT DEFAULT '',
  tipo TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  procedimentos TEXT DEFAULT '',
  valor_taxa NUMERIC DEFAULT 0,
  valor_tratamento NUMERIC DEFAULT 0,
  formas_pgto JSONB DEFAULT '[]',
  agendado BOOLEAN DEFAULT FALSE,
  obs TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_lancamentos" ON lancamentos;
CREATE POLICY "clinic_lancamentos" ON lancamentos FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);

-- CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS contas_pagar (
  id TEXT PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT DEFAULT '',
  valor NUMERIC DEFAULT 0,
  vencimento TEXT DEFAULT '',
  pago BOOLEAN DEFAULT FALSE,
  pago_em TEXT,
  categoria TEXT DEFAULT '',
  campo_key TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_contas_pagar" ON contas_pagar;
CREATE POLICY "clinic_contas_pagar" ON contas_pagar FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);

-- METAS POR MÊS
CREATE TABLE IF NOT EXISTS clinica_metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  mes INT NOT NULL,
  meta_valor NUMERIC DEFAULT 200000,
  super_meta_valor NUMERIC,
  recorde_valor NUMERIC DEFAULT 142500,
  dias_selecionados JSONB DEFAULT '[]',
  dias_valores JSONB DEFAULT '{}',
  UNIQUE(clinica_id, ano, mes)
);
ALTER TABLE clinica_metas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_metas" ON clinica_metas;
CREATE POLICY "clinic_metas" ON clinica_metas FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);

-- POSTS DE SOCIAL MEDIA POR MÊS
CREATE TABLE IF NOT EXISTS clinica_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  mes INT NOT NULL,
  posts JSONB DEFAULT '[]',
  UNIQUE(clinica_id, ano, mes)
);
ALTER TABLE clinica_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_posts" ON clinica_posts;
CREATE POLICY "clinic_posts" ON clinica_posts FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);

-- FINANCEIRO DADOS POR MÊS
CREATE TABLE IF NOT EXISTS financeiro_dados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  mes INT NOT NULL,
  receitas JSONB DEFAULT '{}',
  custos JSONB DEFAULT '{}',
  despesas JSONB DEFAULT '{}',
  investimentos JSONB DEFAULT '{}',
  emprestimos JSONB DEFAULT '{}',
  UNIQUE(clinica_id, ano, mes)
);
ALTER TABLE financeiro_dados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_financeiro_dados" ON financeiro_dados;
CREATE POLICY "clinic_financeiro_dados" ON financeiro_dados FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);

-- FINANCEIRO CONFIG (categorias + ocultos) — 1 linha por clínica
CREATE TABLE IF NOT EXISTS financeiro_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  categorias JSONB,
  ocultos JSONB DEFAULT '{"receitas":[],"custos":[],"despesas":[],"investimentos":[],"emprestimos":[]}'
);
ALTER TABLE financeiro_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_financeiro_config" ON financeiro_config;
CREATE POLICY "clinic_financeiro_config" ON financeiro_config FOR ALL USING (
  clinica_id = auth.uid()
  OR clinica_id::text = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
);
