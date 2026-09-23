import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const UNIDADES = ['unidade', 'caixa', 'pacote', 'ml', 'g', 'mg', 'ampola', 'frasco', 'tubo', 'par', 'kit']
const UNIDADE_BADGE = {
  unidade: 'UN', caixa: 'CX', pacote: 'PT', ml: 'ML', g: 'G', mg: 'MG',
  ampola: 'AM', frasco: 'FR', tubo: 'TB', par: 'PR', kit: 'KT',
}

function estoqueAtual(movs) {
  return (movs || []).reduce((acc, m) => acc + (m.tipo === 'entrada' ? m.quantidade : -m.quantidade), 0)
}

function validadeMaisProxima(movs) {
  const hoje = new Date().toISOString().slice(0, 10)
  return (movs || [])
    .filter(m => m.tipo === 'entrada' && m.validade && m.validade >= hoje)
    .sort((a, b) => a.validade.localeCompare(b.validade))[0]?.validade || null
}

function diasAteValidade(validade) {
  if (!validade) return null
  return Math.ceil((new Date(validade + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24))
}

export default function Estoque() {
  const { clinicaId } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [movimentos, setMovimentos] = useState({})
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalProd, setModalProd] = useState(null)
  const [modalMov, setModalMov] = useState(null)
  const [saving, setSaving] = useState(false)

  const carregar = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from('estoque_produtos').select('*').eq('clinica_id', clinicaId).order('nome'),
      supabase.from('estoque_movimentos').select('*').eq('clinica_id', clinicaId).order('data', { ascending: false })
    ])
    setProdutos(prods || [])
    const byP = {}
    for (const m of movs || []) {
      if (!byP[m.produto_id]) byP[m.produto_id] = []
      byP[m.produto_id].push(m)
    }
    setMovimentos(byP)
    setLoading(false)
  }, [clinicaId])

  useEffect(() => { carregar() }, [carregar])

  async function salvarProduto(form) {
    setSaving(true)
    const payload = {
      clinica_id: clinicaId,
      nome: form.nome,
      unidade: form.unidade,
      fornecedor: form.fornecedor || '',
      estoque_minimo: parseFloat(form.estoque_minimo) || 0,
    }
    if (form.id) {
      await supabase.from('estoque_produtos').update(payload).eq('id', form.id)
    } else {
      await supabase.from('estoque_produtos').insert({ ...payload, id: crypto.randomUUID() })
    }
    setSaving(false)
    setModalProd(null)
    carregar()
  }

  async function salvarMovimento(form) {
    setSaving(true)
    await supabase.from('estoque_movimentos').insert({
      id: crypto.randomUUID(),
      clinica_id: clinicaId,
      produto_id: form.produto_id,
      tipo: form.tipo,
      quantidade: parseFloat(form.quantidade),
      data: form.data,
      validade: form.validade || null,
      observacao: form.observacao || '',
    })
    setSaving(false)
    setModalMov(null)
    carregar()
  }

  async function excluirProduto(id) {
    if (!confirm('Excluir produto e todos os movimentos?')) return
    await supabase.from('estoque_movimentos').delete().eq('produto_id', id)
    await supabase.from('estoque_produtos').delete().eq('id', id)
    setModalProd(null)
    carregar()
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
            placeholder="Filtrar Produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <button
          onClick={() => setModalProd({ nome: '', unidade: 'unidade', fornecedor: '', estoque_minimo: 0 })}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-400 text-white text-sm font-medium rounded-xl hover:bg-brand-500 transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14"/></svg>
          Adicionar Produto
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando…</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {busca ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtrados.map((p, idx) => {
            const movs = movimentos[p.id] || []
            const atual = estoqueAtual(movs)
            const validade = validadeMaisProxima(movs)
            const dias = diasAteValidade(validade)
            const vencidoFlag = movs.some(m => m.tipo === 'entrada' && m.validade && m.validade < hoje)
            const baixo = p.estoque_minimo > 0 && atual <= p.estoque_minimo
            const vencendo = !vencidoFlag && dias !== null && dias <= 30
            const badge = UNIDADE_BADGE[p.unidade] || p.unidade.toUpperCase().slice(0, 2)

            return (
              <div
                key={p.id}
                className={`flex items-center gap-4 px-5 py-4 ${idx < filtrados.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                {/* Ícones de ação — sempre visíveis */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setModalMov({ produto_id: p.id, produto_nome: p.nome, tipo: 'entrada', quantidade: '', data: hoje, validade: '', observacao: '' })}
                    title="Entrada"
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14"/></svg>
                  </button>
                  <button
                    onClick={() => setModalMov({ produto_id: p.id, produto_nome: p.nome, tipo: 'saida', quantidade: '', data: hoje, observacao: '' })}
                    title="Saída"
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4 4 4"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8v12m0 0 4-4m-4 4-4-4"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => excluirProduto(p.id)}
                    title="Excluir"
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                  </button>
                  <button
                    onClick={() => setModalProd({ ...p })}
                    title="Editar"
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                </div>

                {/* Nome do produto */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-800">{p.nome}</span>
                  {p.fornecedor && <span className="ml-2 text-xs text-gray-400">{p.fornecedor}</span>}
                  <div className="flex gap-2 mt-0.5">
                    {baixo && <span className="text-xs text-red-500 font-medium">Estoque baixo</span>}
                    {vencidoFlag && <span className="text-xs text-red-500 font-medium">Vencido</span>}
                    {vencendo && <span className="text-xs text-orange-500 font-medium">Vence em {dias}d</span>}
                  </div>
                </div>

                {/* Quantidade Disponível */}
                <div className="text-sm text-gray-400 flex-shrink-0 hidden sm:block">
                  Quantidade Disponível{' '}
                  <span className={`font-bold text-gray-800 ${baixo ? 'text-red-500' : ''}`}>
                    {atual % 1 === 0 ? atual : atual.toFixed(1)}
                  </span>
                </div>

                {/* Unidade de Medida */}
                <div className="text-sm text-gray-400 flex-shrink-0 w-32 text-right hidden sm:block">
                  Unidade de Medida{' '}
                  <span className="font-bold text-gray-800">{badge}</span>
                </div>

                {/* Mobile: quantidade compacta */}
                <div className="sm:hidden text-sm font-bold text-gray-800 flex-shrink-0">
                  {atual % 1 === 0 ? atual : atual.toFixed(1)} {badge}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalProd && (
        <ModalProduto
          initial={modalProd}
          saving={saving}
          onSave={salvarProduto}
          onDelete={modalProd.id ? () => excluirProduto(modalProd.id) : null}
          onClose={() => setModalProd(null)}
        />
      )}

      {modalMov && (
        <ModalMovimento
          initial={modalMov}
          saving={saving}
          onSave={salvarMovimento}
          onClose={() => setModalMov(null)}
        />
      )}
    </div>
  )
}

function ModalProduto({ initial, saving, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{form.id ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Botox Allergan 100u" autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unidade *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.unidade} onChange={e => set('unidade', e.target.value)}
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estoque mínimo</label>
              <input
                type="number" min="0" step="0.5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.estoque_minimo} onChange={e => set('estoque_minimo', e.target.value)} placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fornecedor</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.fornecedor || ''} onChange={e => set('fornecedor', e.target.value)}
              placeholder="Ex: Distribuidora XYZ"
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-gray-100">
          {onDelete ? (
            <button onClick={onDelete} className="text-sm text-red-500 hover:text-red-600">Excluir produto</button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button
              onClick={() => onSave(form)}
              disabled={!form.nome.trim() || saving}
              className="px-4 py-2 text-sm font-medium bg-brand-400 text-white rounded-lg hover:bg-brand-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalMovimento({ initial, saving, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{form.produto_nome}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {[
              { value: 'entrada', label: '+ Entrada', active: 'bg-green-500 text-white', idle: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
              { value: 'saida',   label: '− Saída',   active: 'bg-orange-500 text-white', idle: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
            ].map(t => (
              <button key={t.value} onClick={() => set('tipo', t.value)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${form.tipo === t.value ? t.active : t.idle}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade *</label>
              <input
                type="number" min="0.01" step="0.01" autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.quantidade} onChange={e => set('quantidade', e.target.value)} placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data *</label>
              <input type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.data} onChange={e => set('data', e.target.value)}
              />
            </div>
          </div>
          {form.tipo === 'entrada' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data de validade</label>
              <input type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.validade || ''} onChange={e => set('validade', e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observação</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.observacao || ''} onChange={e => set('observacao', e.target.value)} placeholder="Opcional"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.quantidade || saving}
            className="px-4 py-2 text-sm font-medium bg-brand-400 text-white rounded-lg hover:bg-brand-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
