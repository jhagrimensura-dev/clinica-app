import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const UNIDADES = ['unidade', 'caixa', 'ml', 'g', 'mg', 'ampola', 'frasco', 'tubo', 'par', 'kit']

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
  const hoje = new Date()
  const val = new Date(validade + 'T00:00:00')
  return Math.ceil((val - hoje) / (1000 * 60 * 60 * 24))
}

export default function Estoque() {
  const { clinicaId } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [movimentos, setMovimentos] = useState({})
  const [loading, setLoading] = useState(true)
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
    if (!confirm('Excluir produto e todos os movimentos? Essa ação não pode ser desfeita.')) return
    await supabase.from('estoque_movimentos').delete().eq('produto_id', id)
    await supabase.from('estoque_produtos').delete().eq('id', id)
    setModalProd(null)
    carregar()
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const alertasBaixo = produtos.filter(p => {
    const atual = estoqueAtual(movimentos[p.id] || [])
    return p.estoque_minimo > 0 && atual <= p.estoque_minimo
  })
  const alertasValidade = produtos.filter(p => {
    const movs = movimentos[p.id] || []
    const val = movs.filter(m => m.tipo === 'entrada' && m.validade).map(m => m.validade)
    return val.some(v => v <= hoje || diasAteValidade(v) <= 30)
  })

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>
          {(alertasBaixo.length > 0 || alertasValidade.length > 0) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {alertasBaixo.length > 0 && <span className="text-red-500 font-medium">{alertasBaixo.length} abaixo do mínimo</span>}
              {alertasBaixo.length > 0 && alertasValidade.length > 0 && ' · '}
              {alertasValidade.length > 0 && <span className="text-orange-500 font-medium">{alertasValidade.length} com validade próxima</span>}
            </p>
          )}
        </div>
        <button
          onClick={() => setModalProd({ nome: '', unidade: 'unidade', fornecedor: '', estoque_minimo: 0 })}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-400 text-white text-sm font-medium rounded-lg hover:bg-brand-500 transition-colors"
        >
          + Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando…</div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <p className="font-medium">Nenhum produto cadastrado</p>
          <p className="text-sm mt-1">Clique em "+ Novo Produto" para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Unidade</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estoque</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Mínimo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Validade</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {produtos.map(p => {
                  const movs = movimentos[p.id] || []
                  const atual = estoqueAtual(movs)
                  const validade = validadeMaisProxima(movs)
                  const dias = diasAteValidade(validade)
                  const vencidoVal = movs.some(m => m.tipo === 'entrada' && m.validade && m.validade < hoje)
                  const baixo = p.estoque_minimo > 0 && atual <= p.estoque_minimo
                  const vencendo = dias !== null && dias <= 30

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{p.nome}</div>
                        {p.fornecedor && <div className="text-xs text-gray-400">{p.fornecedor}</div>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">{p.unidade}</td>
                      <td className="px-4 py-3 text-center">
                        <div className={`font-semibold ${baixo ? 'text-red-500' : 'text-gray-800'}`}>
                          {atual % 1 === 0 ? atual : atual.toFixed(1)}
                        </div>
                        {baixo && (
                          <div className="text-xs text-red-500 font-medium">Baixo</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 hidden sm:table-cell">
                        {p.estoque_minimo > 0 ? p.estoque_minimo : '—'}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {vencidoVal ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            Vencido
                          </span>
                        ) : validade ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            vencendo ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {new Date(validade + 'T00:00:00').toLocaleDateString('pt-BR')}
                            {vencendo ? ` · ${dias}d` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setModalMov({ produto_id: p.id, produto_nome: p.nome, tipo: 'entrada', quantidade: '', data: hoje, validade: '', observacao: '' })}
                            className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => setModalMov({ produto_id: p.id, produto_nome: p.nome, tipo: 'saida', quantidade: '', data: hoje, observacao: '' })}
                            className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                          >
                            −
                          </button>
                          <button
                            onClick={() => setModalProd({ ...p })}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            ⋯
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Botox Allergan 100u"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unidade *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.unidade}
                onChange={e => set('unidade', e.target.value)}
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estoque mínimo</label>
              <input
                type="number" min="0" step="0.5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.estoque_minimo}
                onChange={e => set('estoque_minimo', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fornecedor</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.fornecedor || ''}
              onChange={e => set('fornecedor', e.target.value)}
              placeholder="Ex: Distribuidora XYZ"
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-gray-100">
          {onDelete ? (
            <button onClick={onDelete} className="text-sm text-red-500 hover:text-red-600">
              Excluir produto
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
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
              <button
                key={t.value}
                onClick={() => set('tipo', t.value)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${form.tipo === t.value ? t.active : t.idle}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade *</label>
              <input
                type="number" min="0.01" step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.quantidade}
                onChange={e => set('quantidade', e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data *</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.data}
                onChange={e => set('data', e.target.value)}
              />
            </div>
          </div>
          {form.tipo === 'entrada' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data de validade</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={form.validade || ''}
                onChange={e => set('validade', e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observação</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.observacao || ''}
              onChange={e => set('observacao', e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
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
