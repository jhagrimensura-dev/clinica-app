import { useState, useEffect } from 'react'
import { useLeads } from '../context/LeadsContext'
import { supabase } from '../lib/supabase'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const COR_ORIGEM = {
  'Instagram Anúncio':    { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: '#ee2a7b' },
  'Instagram Orgânico':   { bg: 'bg-purple-100',  text: 'text-purple-700', bar: '#6228d7' },
  'WhatsApp':             { bg: 'bg-green-100',   text: 'text-green-700',  bar: '#25d366' },
  'Indicação':            { bg: 'bg-yellow-100',  text: 'text-yellow-700', bar: '#f59e0b' },
  'Tráfego':              { bg: 'bg-blue-100',    text: 'text-blue-700',   bar: '#3b82f6' },
  'Instagram':            { bg: 'bg-pink-100',    text: 'text-pink-700',   bar: '#ee2a7b' },
  'Fornecedores':         { bg: 'bg-orange-100',  text: 'text-orange-700', bar: '#f97316' },
  'Outros':               { bg: 'bg-gray-100',    text: 'text-gray-600',   bar: '#9ca3af' },
  'Fornecedores / Outros':{ bg: 'bg-orange-100',  text: 'text-orange-700', bar: '#f97316' },
}
const COR_MIDIA = {
  'Campanha de msg para Whatsapp': { bg: 'bg-green-100',  text: 'text-green-700',  bar: '#25d366' },
  'Link da BIO':                   { bg: 'bg-amber-100',  text: 'text-amber-700',  bar: '#f59e0b' },
  'Link dos Stories':              { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: '#ee2a7b' },
  'Indicação':                     { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: '#eab308' },
  'WhatsApp Direto':               { bg: 'bg-teal-100',   text: 'text-teal-700',   bar: '#14b8a6' },
}

const MIDIAS_INSTAGRAM = ['Link da BIO', 'Link dos Stories']

function getCorOrigem(o) {
  return COR_ORIGEM[o] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#9ca3af' }
}
function getCorMidia(m) {
  return COR_MIDIA[m] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#9ca3af' }
}

function CardContagem({ label, count, pct, cor, thumbnail, permalink, subItems, info }) {
  return (
    <div className="text-left p-4 rounded-2xl border bg-white border-gray-100 shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        {thumbnail && (
          permalink
            ? <a href={permalink} target="_blank" rel="noreferrer">
                <img src={thumbnail} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
              </a>
            : <img src={thumbnail} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
        )}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cor.bg} ${cor.text} truncate max-w-[160px]`} title={label}>{label}</span>
        {info && (
          <div className="relative group ml-auto shrink-0">
            <svg className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute right-0 bottom-5 bg-gray-800 text-white text-[11px] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-52 leading-relaxed shadow-lg">
              {info}
            </div>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-800">{count}</div>
      <div className="text-xs text-gray-400 mb-1">{pct.toFixed(0)}% do total</div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor.bar }} />
      </div>
      {subItems?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1.5">
          {subItems.map(({ label: sl, count: sc, cor: scor }) => (
            <div key={sl} className="flex items-center justify-between gap-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${scor.bg} ${scor.text} truncate max-w-[110px]`} title={sl}>{sl}</span>
              <span className="text-xs font-semibold text-gray-600">{sc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RowContagem({ label, count, pct, cor, thumbnail, permalink }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
      {thumbnail && (
        permalink
          ? <a href={permalink} target="_blank" rel="noreferrer">
              <img src={thumbnail} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
            </a>
          : <img src={thumbnail} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
      )}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cor.bg} ${cor.text}`} title={label}>{label}</span>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor.bar }} />
        </div>
      </div>
      <div className="text-xs text-gray-400 shrink-0 w-10 text-right">{pct.toFixed(0)}%</div>
      <div className="text-base font-bold text-gray-800 shrink-0 w-6 text-right">{count}</div>
    </div>
  )
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  )
}

function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="3" rx="1.5"/><rect x="1" y="6.5" width="14" height="3" rx="1.5"/>
      <rect x="1" y="11" width="14" height="3" rx="1.5"/>
    </svg>
  )
}

function ModalGerenciarCriativos({ criativos, contagemCriativo, onSalvar, onFechar }) {
  const [lista, setLista] = useState(criativos)
  const [form, setForm] = useState({ nome: '', thumbnail: '', permalink: '' })
  const [editIdx, setEditIdx] = useState(null)
  const [limpando, setLimpando] = useState(false)
  const [confirmLimpar, setConfirmLimpar] = useState(false)
  const [limpandoNome, setLimpandoNome] = useState(null)
  const [confirmLimparNome, setConfirmLimparNome] = useState(null)
  const [uploading, setUploading] = useState(false)

  const uploadImagem = async (file) => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `criativos/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('criativos').upload(path, file)
    if (error) { alert('Erro ao fazer upload: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('criativos').getPublicUrl(path)
    setForm(f => ({ ...f, thumbnail: data.publicUrl }))
    setUploading(false)
  }

  const limparTodosLeads = async () => {
    setLimpando(true)
    await supabase.from('leads').update({ criativo: null }).not('criativo', 'is', null)
    setLimpando(false)
    setConfirmLimpar(false)
    alert('Criativos removidos de todos os leads.')
  }

  const limparLeadsPorNome = async (nome) => {
    setLimpandoNome(nome)
    await supabase.from('leads').update({ criativo: null }).eq('criativo', nome)
    setLimpandoNome(null)
    setConfirmLimparNome(null)
  }

  const salvarForm = () => {
    if (!form.nome.trim()) return
    const novaLista = editIdx !== null
      ? lista.map((c, i) => i === editIdx ? { ...form } : c)
      : [...lista, { ...form }]
    setLista(novaLista)
    setForm({ nome: '', thumbnail: '', permalink: '' })
    setEditIdx(null)
  }

  const excluir = (i) => setLista(l => l.filter((_, idx) => idx !== i))

  const editar = (i) => { setForm({ ...lista[i] }); setEditIdx(i) }

  // Nomes de criativos nos leads mas que não estão na lista cadastrada
  const nomesNaLista = new Set(lista.map(c => c.nome))
  const nomesForaDaLista = Object.keys(contagemCriativo).filter(n => !nomesNaLista.has(n))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Gerenciar Criativos</h2>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {/* Lista */}
        {lista.length > 0 ? (
          <div className="space-y-2">
            {lista.map((c, i) => {
              const qtd = contagemCriativo[c.nome] || 0
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {c.thumbnail && <img src={c.thumbnail} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.nome}</p>
                    {c.permalink && <p className="text-xs text-gray-400 truncate">{c.permalink}</p>}
                  </div>
                  {qtd > 0 && (
                    confirmLimparNome === c.nome ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-red-500">Limpar {qtd} leads?</span>
                        <button onClick={() => limparLeadsPorNome(c.nome)} disabled={limpandoNome === c.nome} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-lg disabled:opacity-50">
                          {limpandoNome === c.nome ? '...' : 'Sim'}
                        </button>
                        <button onClick={() => setConfirmLimparNome(null)} className="text-xs text-gray-500 px-1.5 py-0.5 rounded-lg hover:bg-gray-100">Não</button>
                      </div>
                    ) : (
                      <span onClick={() => setConfirmLimparNome(c.nome)} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer shrink-0 bg-gray-100 hover:bg-red-50 px-2 py-0.5 rounded-lg transition-colors" title="Limpar criativo dos leads com este nome">
                        {qtd} leads ✕
                      </span>
                    )
                  )}
                  <button onClick={() => editar(i)} className="text-gray-400 hover:text-blue-500 text-xs px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">✏️</button>
                  <button onClick={() => excluir(i)} className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">🗑️</button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum criativo cadastrado</p>
        )}

        {/* Criativos com nome errado (existem nos leads mas não na lista) */}
        {nomesForaDaLista.length > 0 && (
          <div className="border border-orange-100 rounded-xl p-3 bg-orange-50 space-y-2">
            <p className="text-xs font-bold text-orange-600 uppercase">Criativos com nome incorreto nos leads</p>
            {nomesForaDaLista.map(nome => {
              const qtd = contagemCriativo[nome]
              return (
                <div key={nome} className="flex items-center gap-2">
                  <span className="text-xs text-orange-800 flex-1 truncate" title={nome}>"{nome}" — {qtd} lead{qtd !== 1 ? 's' : ''}</span>
                  {confirmLimparNome === nome ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => limparLeadsPorNome(nome)} disabled={limpandoNome === nome} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-lg disabled:opacity-50">
                        {limpandoNome === nome ? '...' : 'Limpar'}
                      </button>
                      <button onClick={() => setConfirmLimparNome(null)} className="text-xs text-gray-500 px-1.5 py-0.5 rounded-lg hover:bg-gray-100">Não</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmLimparNome(nome)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 rounded-lg hover:bg-red-50 border border-red-200 transition-colors shrink-0">
                      Apagar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Formulário */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase">{editIdx !== null ? 'Editando criativo' : 'Novo criativo'}</p>
          <input
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Nome do criativo *"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <div className="flex items-center gap-3">
            {form.thumbnail && (
              <img src={form.thumbnail} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200" />
            )}
            <label className={`flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-3 py-3 cursor-pointer transition-colors text-sm ${uploading ? 'border-brand-300 bg-brand-50 text-brand-500' : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-400 hover:text-brand-500'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={e => uploadImagem(e.target.files[0])} disabled={uploading} />
              {uploading ? '⏳ Enviando...' : form.thumbnail ? '🖼 Trocar imagem' : '📷 Adicionar imagem'}
            </label>
            {form.thumbnail && (
              <button onClick={() => setForm(f => ({ ...f, thumbnail: '' }))} className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0">×</button>
            )}
          </div>
          <input
            value={form.permalink}
            onChange={e => setForm(f => ({ ...f, permalink: e.target.value }))}
            placeholder="Link do anúncio (permalink)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <div className="flex gap-2">
            {editIdx !== null && (
              <button onClick={() => { setForm({ nome: '', thumbnail: '', permalink: '' }); setEditIdx(null) }}
                className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancelar
              </button>
            )}
            <button onClick={salvarForm} disabled={!form.nome.trim()}
              className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors">
              {editIdx !== null ? 'Salvar edição' : '+ Adicionar'}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          {confirmLimpar ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3 mb-3">
              <p className="text-xs text-red-600 font-semibold">Remover criativo de todos os leads?</p>
              <div className="flex gap-2">
                <button onClick={limparTodosLeads} disabled={limpando} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg disabled:opacity-50">
                  {limpando ? 'Limpando...' : 'Sim, limpar'}
                </button>
                <button onClick={() => setConfirmLimpar(false)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Não</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmLimpar(true)} className="w-full mb-3 px-4 py-2 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 font-semibold transition-colors">
              🗑 Limpar criativo de todos os leads
            </button>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={onFechar} className="px-5 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button onClick={() => onSalvar(lista)} className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors">Salvar tudo</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadsPorOrigem() {
  const { leads } = useLeads()
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [adsEngajamento, setAdsEngajamento] = useState([])
  const [viewCriativo, setViewCriativo] = useState('grid')
  const [modalCriativos, setModalCriativos] = useState(false)

  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', 'ads_engajamento').maybeSingle()
      .then(({ data }) => { if (data?.valor) setAdsEngajamento(data.valor) })
  }, [])

  const salvarCriativos = async (lista) => {
    setAdsEngajamento(lista)
    setModalCriativos(false)
    await supabase.from('configuracoes').upsert({ chave: 'ads_engajamento', valor: lista }, { onConflict: 'chave' })
  }

  function navMes(dir) {
    if (dir === -1) {
      if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1)
    } else {
      if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1)
    }
  }

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`

  const ORIGENS_PERMITIDAS = ['Instagram', 'Tráfego', 'Indicação', 'Fornecedores', 'Outros', 'Fornecedores / Outros']

  const filtrados = leads.filter(l => {
    const d = l.dataOrigem || l.data || l.criadoEm?.slice(0, 10) || ''
    const origem = l.origemCustom || l.fonte || ''
    return l.origem !== 'leads_recorrentes' && d.startsWith(prefix) && ORIGENS_PERMITIDAS.includes(origem)
  })

  const total = filtrados.length

  // Contagem por origem — agrupa Fornecedores/Outros em um único label
  const contagemOrigem = { 'Fornecedores / Outros': 0 }
  filtrados.forEach(l => {
    const o = l.origemCustom || l.fonte || 'Não informado'
    if (o === 'Fornecedores' || o === 'Outros' || o === 'Fornecedores / Outros') {
      contagemOrigem['Fornecedores / Outros'] = (contagemOrigem['Fornecedores / Outros'] || 0) + 1
    } else {
      contagemOrigem[o] = (contagemOrigem[o] || 0) + 1
    }
  })
  const sortedOrigem = Object.entries(contagemOrigem).sort((a, b) => b[1] - a[1])

  // Sub-breakdown de mídia para o card do Instagram — todos os leads, sem exceção
  const instagramMidias = {}
  filtrados.filter(l => (l.origemCustom || l.fonte) === 'Instagram').forEach(l => {
    const key = l.midia || 'Sem mídia'
    instagramMidias[key] = (instagramMidias[key] || 0) + 1
  })
  const instagramSubItems = Object.entries(instagramMidias)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, cor: getCorMidia(label) }))

  // Contagem por mídia — exclui mídias que aparecem dentro do card do Instagram
  const contagemMidia = {}
  filtrados.forEach(l => {
    if (!l.midia || l.midia === 'Campanha de msg para Whatsapp' || MIDIAS_INSTAGRAM.includes(l.midia)) return
    contagemMidia[l.midia] = (contagemMidia[l.midia] || 0) + 1
  })
  const sortedMidia = Object.entries(contagemMidia).sort((a, b) => b[1] - a[1])

  // Contagem por criativo — mostra TODOS os criativos cadastrados, mesmo com 0 leads
  const contagemCriativo = {}
  filtrados.forEach(l => {
    if (!l.criativo) return
    contagemCriativo[l.criativo] = (contagemCriativo[l.criativo] || 0) + 1
  })

  const adMap = {}
  adsEngajamento.forEach(a => { adMap[a.nome] = a })

  const todosCreativos = new Set([...Object.keys(contagemCriativo), ...adsEngajamento.map(a => a.nome)])
  const sortedCriativo = Array.from(todosCreativos)
    .map(nome => [nome, contagemCriativo[nome] || 0])
    .sort((a, b) => b[1] - a[1])
  const totalCriativos = sortedCriativo.reduce((s, [, c]) => s + c, 0)

  const corCriativo = { bg: 'bg-brand-50', text: 'text-brand-700', bar: '#a855f7' }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">📊</div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Leads por Origem</h1>
            <p className="text-sm text-gray-400">{total} leads em {MESES[mes].toLowerCase()} de {ano}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
          <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none">‹</button>
          <span className="text-sm font-bold text-gray-700 w-36 text-center">{MESES[mes]} {ano}</span>
          <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none">›</button>
        </div>
      </div>

      {total === 0 && sortedCriativo.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-400">Nenhum lead registrado em {MESES[mes]} de {ano}.</p>
        </div>
      ) : (
        <>
          {/* Origem */}
          {total > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Por Origem</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedOrigem.map(([origem, count]) => (
                  <CardContagem
                    key={origem}
                    label={origem}
                    count={count}
                    pct={total > 0 ? (count / total) * 100 : 0}
                    cor={getCorOrigem(origem)}
                    subItems={origem === 'Instagram' ? instagramSubItems : undefined}
                    info={origem === 'Tráfego' ? 'Contabiliza quantos leads novos vieram de anúncios pagos no mês, e a seção abaixo mostra qual anúncio trouxe mais leads' : undefined}
                  />
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <span className="text-sm text-gray-400">Total: <span className="font-bold text-gray-700 text-base">{total}</span> leads</span>
              </div>
            </section>
          )}

          {/* Criativo */}
          {sortedCriativo.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Por Criativo</h2>
                <div className="flex items-center gap-2">
                <button onClick={() => setModalCriativos(true)} className="text-xs text-brand-500 hover:text-brand-700 font-semibold border border-brand-200 px-3 py-1 rounded-xl hover:bg-brand-50 transition-colors">⚙ Gerenciar</button>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewCriativo('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${viewCriativo === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Grade"
                  >
                    <IconGrid />
                  </button>
                  <button
                    onClick={() => setViewCriativo('list')}
                    className={`p-1.5 rounded-lg transition-colors ${viewCriativo === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Lista"
                  >
                    <IconList />
                  </button>
                </div>
                </div>
              </div>

              {viewCriativo === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sortedCriativo.map(([criativo, count]) => {
                    const ad = adMap[criativo]
                    return (
                      <CardContagem
                        key={criativo}
                        label={criativo}
                        count={count}
                        pct={totalCriativos > 0 ? (count / totalCriativos) * 100 : 0}
                        cor={corCriativo}
                        thumbnail={ad?.thumbnail || ''}
                        permalink={ad?.permalink || ''}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedCriativo.map(([criativo, count]) => {
                    const ad = adMap[criativo]
                    return (
                      <RowContagem
                        key={criativo}
                        label={criativo}
                        count={count}
                        pct={totalCriativos > 0 ? (count / totalCriativos) * 100 : 0}
                        cor={corCriativo}
                        thumbnail={ad?.thumbnail || ''}
                        permalink={ad?.permalink || ''}
                      />
                    )
                  })}
                </div>
              )}
            </section>
          )}

        </>
      )}

      {modalCriativos && (
        <ModalGerenciarCriativos
          criativos={adsEngajamento}
          contagemCriativo={contagemCriativo}
          onSalvar={salvarCriativos}
          onFechar={() => setModalCriativos(false)}
        />
      )}
    </div>
  )
}
