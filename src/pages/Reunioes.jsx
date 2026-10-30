import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const genId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

const HOJE = () => new Date().toISOString().slice(0, 10)

function fmtData(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function Reunioes() {
  const { clinicaId } = useAuth()
  const [reunioes, setReunioes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(null)

  const fetchReunioes = async () => {
    if (!clinicaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('reunioes')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('data', { ascending: false })
    if (error) { setErro(error.message); setLoading(false); return }
    setReunioes(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchReunioes() }, [clinicaId])

  const novaReuniao = () => {
    const nova = { id: genId(), clinica_id: clinicaId, data: HOJE(), titulo: '', participantes: '', ata: '', _nova: true }
    setForm(nova)
    setSelected(null)
  }

  const abrirReuniao = (r) => {
    setSelected(r)
    setForm({ ...r })
  }

  const salvar = async () => {
    if (!form) return
    setSaving(true)
    setErro(null)
    const payload = {
      id: form.id,
      clinica_id: clinicaId,
      data: form.data,
      titulo: form.titulo || '',
      participantes: form.participantes || '',
      ata: form.ata || '',
    }
    const { error } = form._nova
      ? await supabase.from('reunioes').insert(payload)
      : await supabase.from('reunioes').update(payload).eq('id', form.id)
    if (error) { setErro(error.message); setSaving(false); return }
    await fetchReunioes()
    setSelected(payload)
    setForm({ ...payload })
    setSaving(false)
  }

  const excluir = async (id) => {
    if (!confirm('Excluir esta reunião?')) return
    await supabase.from('reunioes').delete().eq('id', id)
    setForm(null)
    setSelected(null)
    await fetchReunioes()
  }

  const changed = form && (
    form.titulo !== (selected?.titulo ?? '') ||
    form.data !== (selected?.data ?? HOJE()) ||
    form.participantes !== (selected?.participantes ?? '') ||
    form.ata !== (selected?.ata ?? '') ||
    form._nova
  )

  if (erro && erro.includes('does not exist')) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Reuniões</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-semibold text-amber-800">Tabela não encontrada — execute o SQL abaixo no Supabase Studio</p>
          <pre className="bg-white border border-amber-100 rounded-xl p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL,
  data date NOT NULL,
  titulo text NOT NULL DEFAULT '',
  participantes text DEFAULT '',
  ata text DEFAULT '',
  criado_em timestamptz DEFAULT now()
);
ALTER TABLE reunioes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reunioes_clinica" ON reunioes
  USING (clinica_id IN (
    SELECT admin_id FROM clinica_master WHERE admin_id = auth.uid()
  ));`}</pre>
          <button onClick={() => { setErro(null); fetchReunioes() }}
            className="px-4 py-2 rounded-xl bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 h-screen flex flex-col" style={{ maxHeight: 'calc(100vh - 64px)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reuniões</h1>
          <p className="text-xs text-gray-400 mt-0.5">Registro de atas e anotações</p>
        </div>
        <button onClick={novaReuniao}
          className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
          + Nova Reunião
        </button>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Lista */}
        <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <p className="px-4 py-3 text-[10px] font-bold text-gray-300 uppercase tracking-wider border-b border-gray-50">
            {reunioes.length} reunião(ões)
          </p>
          {loading ? (
            <p className="px-4 py-6 text-sm text-gray-300">Carregando...</p>
          ) : reunioes.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-300">Nenhuma reunião ainda</p>
          ) : (
            <ul className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {reunioes.map(r => (
                <li key={r.id}>
                  <button onClick={() => abrirReuniao(r)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-orange-50 ${
                      (form?.id === r.id) ? 'bg-orange-50 border-l-2 border-orange-400' : ''
                    }`}>
                    <p className="text-xs text-gray-400 mb-0.5">{fmtData(r.data)}</p>
                    <p className="text-sm font-semibold text-gray-700 truncate">{r.titulo || '(sem título)'}</p>
                    {r.participantes && <p className="text-[10px] text-gray-400 truncate mt-0.5">{r.participantes}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editor */}
        {form ? (
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <input type="date" value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-400 w-36" />
                <input type="text" value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Título da reunião"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-400 font-semibold text-gray-800" />
              </div>
              <div className="flex items-center gap-2">
                {!form._nova && (
                  <button onClick={() => excluir(form.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    Excluir
                  </button>
                )}
                <button onClick={salvar} disabled={saving || !changed}
                  className="px-4 py-1.5 rounded-lg bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>

            <div className="px-6 py-3 border-b border-gray-50">
              <input type="text" value={form.participantes}
                onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))}
                placeholder="Participantes (ex: Amanda, Fernanda, Adriele)"
                className="w-full text-sm text-gray-600 outline-none placeholder-gray-300" />
            </div>

            <div className="flex-1 overflow-hidden px-6 py-4">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2">Ata / Anotações</p>
              <textarea
                value={form.ata}
                onChange={e => setForm(f => ({ ...f, ata: e.target.value }))}
                placeholder="Digite aqui o que foi discutido, decisões tomadas, próximos passos..."
                className="w-full h-full resize-none text-sm text-gray-800 outline-none placeholder-gray-300 leading-relaxed"
              />
            </div>

            {erro && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-100">
                <p className="text-xs text-red-600">{erro}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="text-sm text-gray-300">Selecione uma reunião ou crie uma nova</p>
            <button onClick={novaReuniao}
              className="text-sm text-orange-400 hover:text-orange-600 font-semibold">
              + Nova Reunião
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
