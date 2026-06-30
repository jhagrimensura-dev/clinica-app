import { useState, useEffect, useCallback } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useFinanceiro } from '../context/FinanceiroContext'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

const PERIODOS = [
  { label: '7 dias',  value: 'last_7d'  },
  { label: '30 dias', value: 'last_30d' },
  { label: '90 dias', value: 'last_90d' },
]

function fmt(n, prefix = '') {
  if (n == null || n === '') return '—'
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  return prefix + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtInt(n) {
  if (n == null || n === '') return '—'
  const num = parseInt(n)
  if (isNaN(num)) return '—'
  return num.toLocaleString('pt-BR')
}

function fmtPct(n) {
  if (n == null || n === '') return '—'
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  return num.toFixed(2) + '%'
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE:   { label: 'Ativa',    cls: 'bg-green-100 text-green-700'  },
    PAUSED:   { label: 'Pausada',  cls: 'bg-yellow-100 text-yellow-700'},
    ARCHIVED: { label: 'Arquivada',cls: 'bg-gray-100 text-gray-500'   },
    DELETED:  { label: 'Deletada', cls: 'bg-red-100 text-red-500'     },
  }
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100/60">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ConfigModal({ onSave, initialToken, initialAccountId }) {
  const [token, setToken] = useState(initialToken || '')
  const [accountId, setAccountId] = useState(initialAccountId || '')

  const handleSave = () => {
    const id = accountId.trim().replace(/^act_/, '')
    if (!token.trim() || !id) return
    onSave(token.trim(), id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Conectar Instagram Ads</h2>
            <p className="text-xs text-gray-400">Meta Ads API</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Access Token</label>
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Cole aqui o token de acesso..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">ID da Conta de Anúncios</label>
            <input
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="Ex: 1234567890 ou act_1234567890"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            <p className="text-xs text-gray-400 mt-1">Encontre em: Gerenciador de Anúncios → canto superior esquerdo</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={!token.trim() || !accountId.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' }}
          >
            Conectar
          </button>
        </div>
      </div>
    </div>
  )
}

const PERIODO_DIAS = { last_7d: 7, last_30d: 30, last_90d: 90 }

const COR_ORIGEM = {
  'Instagram Anúncio':  { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: '#ee2a7b' },
  'Instagram Orgânico': { bg: 'bg-purple-100',  text: 'text-purple-700', bar: '#6228d7' },
  'WhatsApp':           { bg: 'bg-green-100',   text: 'text-green-700',  bar: '#25d366' },
  'Indicação':          { bg: 'bg-yellow-100',  text: 'text-yellow-700', bar: '#f59e0b' },
  'Tráfego':            { bg: 'bg-blue-100',    text: 'text-blue-700',   bar: '#3b82f6' },
  'facebook':           { bg: 'bg-blue-100',    text: 'text-blue-700',   bar: '#1877f2' },
  'google':             { bg: 'bg-orange-100',  text: 'text-orange-700', bar: '#ea4335' },
}

function getCorOrigem(origem) {
  return COR_ORIGEM[origem] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#9ca3af' }
}

function LeadsOrigem({ leads, periodo }) {
  const dias = PERIODO_DIAS[periodo] || 30
  const corte = new Date()
  corte.setDate(corte.getDate() - dias)
  const cutoff = corte.toISOString().slice(0, 10)

  const filtrados = leads.filter(l => {
    const data = l.data || l.criadoEm?.slice(0, 10) || ''
    return data >= cutoff
  })

  const contagem = {}
  filtrados.forEach(l => {
    const origem = l.origemCustom || l.fonte || 'Não informado'
    contagem[origem] = (contagem[origem] || 0) + 1
  })

  const total = filtrados.length
  const sorted = Object.entries(contagem).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700">Leads por Origem</h2>
        <span className="text-xs text-gray-400">{total} leads nos últimos {dias} dias</span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Nenhum lead registrado neste período.<br/>Ao registrar leads no WhatsApp ou em Leads Novos, eles aparecerão aqui.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([origem, count]) => {
            const cor = getCorOrigem(origem)
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={origem}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cor.bg} ${cor.text}`}>{origem}</span>
                  <span className="text-xs font-bold text-gray-700">{count} <span className="text-gray-400 font-normal">({pct.toFixed(0)}%)</span></span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cor.bar }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const CAMPOS_ORGANICO = [
  { key: 'alcance',           label: 'Alcance',             group: 'distribuicao' },
  { key: 'impressoes',        label: 'Impressões',           group: 'distribuicao' },
  { key: 'novos_seguidores',  label: 'Novos seguidores',     group: 'distribuicao' },
  { key: 'nao_seguidores_pct',label: '% não seguidores',     group: 'distribuicao', pct: true },
  { key: 'curtidas',          label: 'Curtidas',             group: 'engajamento' },
  { key: 'comentarios',       label: 'Comentários',          group: 'engajamento' },
  { key: 'salvamentos',       label: 'Salvamentos',          group: 'engajamento' },
  { key: 'compartilhamentos', label: 'Compartilhamentos',    group: 'engajamento' },
  { key: 'cliques_bio',       label: 'Cliques no link bio',  group: 'cliques' },
  { key: 'cliques_whatsapp',  label: 'Cliques no WhatsApp',  group: 'cliques' },
]

function loadOrganico(ano, mes) {
  try { return JSON.parse(localStorage.getItem(`instagram_organico_${ano}_${mes}`) || '{}') } catch { return {} }
}
function saveOrganico(ano, mes, dados) {
  localStorage.setItem(`instagram_organico_${ano}_${mes}`, JSON.stringify(dados))
}

function PainelOrganico({ leads }) {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [editando, setEditando] = useState(false)
  const [dados, setDados] = useState(() => loadOrganico(hoje.getFullYear(), hoje.getMonth()))
  const [form, setForm] = useState({})

  useEffect(() => {
    const d = loadOrganico(ano, mes)
    setDados(d)
  }, [ano, mes])

  const navMes = (delta) => {
    let m = mes + delta, a = ano
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m); setAno(a)
  }

  const abrirEdicao = () => { setForm({ ...dados }); setEditando(true) }
  const salvar = () => {
    const limpo = {}
    CAMPOS_ORGANICO.forEach(c => { const v = parseFloat(form[c.key]); if (!isNaN(v)) limpo[c.key] = v })
    saveOrganico(ano, mes, limpo)
    setDados(limpo)
    setEditando(false)
  }

  // Leads do mês
  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const leadsDoMes = leads.filter(l => {
    const d = l.data || l.criadoEm?.slice(0, 10) || ''
    return d.startsWith(prefix)
  })
  const totalLeads = leadsDoMes.length

  const num = (k) => dados[k] ?? null
  const engTotal = (num('curtidas') ?? 0) + (num('comentarios') ?? 0) + (num('salvamentos') ?? 0) + (num('compartilhamentos') ?? 0)
  const taxaEng = num('alcance') > 0 ? ((engTotal / num('alcance')) * 100) : null

  const trafego = parseFloat(localStorage.getItem(`social_trafego_${ano}_${mes}`)) || 0
  const custoPorLead = trafego > 0 && totalLeads > 0 ? trafego / totalLeads : null

  const fmtN = (v) => v == null ? '—' : Number(v).toLocaleString('pt-BR')
  const fmtP = (v) => v == null ? '—' : v.toFixed(1) + '%'
  const fmtR = (v) => v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const secoes = [
    {
      title: 'Distribuição', color: 'text-blue-600', cards: [
        { label: 'Alcance', value: fmtN(num('alcance')), icon: '📡' },
        { label: 'Impressões', value: fmtN(num('impressoes')), icon: '👁️' },
        { label: 'Novos seguidores', value: fmtN(num('novos_seguidores')), icon: '➕' },
        { label: '% não seguidores', value: fmtP(num('nao_seguidores_pct')), icon: '🌍' },
      ]
    },
    {
      title: 'Engajamento', color: 'text-pink-600', cards: [
        { label: 'Curtidas', value: fmtN(num('curtidas')), icon: '❤️' },
        { label: 'Comentários', value: fmtN(num('comentarios')), icon: '💬' },
        { label: 'Salvamentos', value: fmtN(num('salvamentos')), icon: '🔖' },
        { label: 'Compartilhamentos', value: fmtN(num('compartilhamentos')), icon: '🔁' },
        { label: 'Taxa de engajamento', value: fmtP(taxaEng), icon: '📈', highlight: true },
      ]
    },
    {
      title: 'Cliques & Conversão', color: 'text-green-600', cards: [
        { label: 'Cliques no link bio', value: fmtN(num('cliques_bio')), icon: '🔗' },
        { label: 'Cliques WhatsApp', value: fmtN(num('cliques_whatsapp')), icon: '📲' },
        { label: 'Leads recebidos', value: fmtN(totalLeads), icon: '🎯' },
        { label: 'Custo por lead', value: fmtR(custoPorLead), icon: '💰' },
      ]
    },
  ]

  return (
    <div className="mb-8">
      {/* Header do painel */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Painel Orgânico</h2>
          <p className="text-xs text-gray-400">Métricas do Instagram — preenchimento manual</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navMes(-1)} className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600">‹</button>
          <span className="text-sm font-semibold text-gray-700 min-w-[110px] text-center">{MESES_NOME[mes]} {ano}</span>
          <button onClick={() => navMes(1)} className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600">›</button>
          <button onClick={abrirEdicao} className="ml-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            ✏️ Editar métricas
          </button>
        </div>
      </div>

      {/* Seções de cards */}
      {secoes.map(sec => (
        <div key={sec.title} className="mb-4">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${sec.color}`}>{sec.title}</p>
          <div className="grid grid-cols-5 gap-3">
            {sec.cards.map(card => (
              <div key={card.label} className={`bg-white rounded-2xl p-4 shadow-sm border ${card.highlight ? 'border-pink-200 bg-pink-50/40' : 'border-brand-100/60'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{card.icon}</span>
                  <p className="text-xs text-gray-400 font-medium leading-tight">{card.label}</p>
                </div>
                <p className={`text-lg font-bold ${card.highlight ? 'text-pink-600' : 'text-gray-800'}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Editar métricas — {MESES_NOME[mes]} {ano}</h2>
            <p className="text-xs text-gray-400 mb-5">Preencha com os dados do Instagram Insights</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {CAMPOS_ORGANICO.map(c => (
                <div key={c.key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{c.label}</label>
                  <input
                    type="number"
                    value={form[c.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [c.key]: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditando(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} className="px-5 py-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InstagramAnalytics() {
  const { leads } = useLeads()
  const { mes: mesFinanceiro, ano: anoFinanceiro } = useFinanceiro()
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('instagram_ads_config') || 'null') } catch { return null }
  })
  const [showConfig, setShowConfig] = useState(false)
  const [periodo, setPeriodo] = useState('last_30d')
  const [overview, setOverview] = useState(null)
  const [campanhas, setCampanhas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveConfig = (token, accountId) => {
    const c = { token, accountId }
    localStorage.setItem('instagram_ads_config', JSON.stringify(c))
    setConfig(c)
    setShowConfig(false)
  }

  const fetchData = useCallback(async () => {
    if (!config) return
    setLoading(true)
    setError(null)
    try {
      const { token, accountId } = config
      const base = `${GRAPH_BASE}/act_${accountId}`
      const fields = 'spend,impressions,reach,clicks,ctr,cpm,cpp,actions'

      const [overviewRes, campaignsRes] = await Promise.all([
        fetch(`${base}/insights?fields=${fields}&date_preset=${periodo}&access_token=${token}`),
        fetch(`${base}/insights?fields=campaign_name,campaign_id,spend,impressions,reach,clicks,ctr,cpm,cpp&level=campaign&date_preset=${periodo}&access_token=${token}`),
      ])

      const overviewJson = await overviewRes.json()
      const campaignsJson = await campaignsRes.json()

      if (overviewJson.error) throw new Error(overviewJson.error.message)
      if (campaignsJson.error) throw new Error(campaignsJson.error.message)

      setOverview(overviewJson.data?.[0] || null)
      setCampanhas(campaignsJson.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [config, periodo])

  useEffect(() => { fetchData() }, [fetchData])

  const metaLeads = overview?.actions?.find(a => a.action_type === 'lead')?.value
  const mensagens = overview?.actions?.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value

  if (!config) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Análises Instagram</h1>
            <p className="text-sm text-gray-400">Meta Ads · Performance dos anúncios</p>
          </div>
        </div>

        <PainelOrganico leads={leads} />
        <LeadsOrigem leads={leads} periodo={periodo} />

        <div className="bg-white rounded-2xl border border-brand-100 p-8 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-2">Conecte sua conta de anúncios</h2>
          <p className="text-sm text-gray-400 mb-6">Visualize gasto, alcance, cliques e desempenho de cada campanha do Instagram.</p>
          <button
            onClick={() => setShowConfig(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' }}
          >
            Configurar integração
          </button>
        </div>

        {showConfig && <ConfigModal onSave={saveConfig} />}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Análises Instagram</h1>
            <p className="text-sm text-gray-400">Meta Ads · act_{config.accountId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Período */}
          <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
            {PERIODOS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  periodo === p.value
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={periodo === p.value ? { background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            title="Atualizar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
          </button>

          <button
            onClick={() => setShowConfig(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title="Configurações"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>

      {/* Painel orgânico — sempre visível */}
      <PainelOrganico leads={leads} />

      {/* Leads por origem — sempre visível */}
      <LeadsOrigem leads={leads} periodo={periodo} />

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-20 border border-brand-100/60" />
          ))}
        </div>
      )}

      {/* Métricas overview */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Gasto total" value={fmt(overview.spend, 'R$ ')} />
          <MetricCard label="Impressões" value={fmtInt(overview.impressions)} />
          <MetricCard label="Alcance" value={fmtInt(overview.reach)} />
          <MetricCard label="Cliques" value={fmtInt(overview.clicks)} />
          <MetricCard label="CTR" value={fmtPct(overview.ctr)} sub="taxa de cliques" />
          <MetricCard label="CPM" value={fmt(overview.cpm, 'R$ ')} sub="custo por 1k impressões" />
          <MetricCard label="Custo por resultado" value={fmt(overview.cpp, 'R$ ')} />
          {metaLeads && <MetricCard label="Leads (Meta)" value={fmtInt(metaLeads)} />}
          {!metaLeads && mensagens && <MetricCard label="Conversas iniciadas" value={fmtInt(mensagens)} />}
        </div>
      )}

      {/* Tabela campanhas */}
      {campanhas.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Campanhas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100">
                  <th className="px-5 py-3 text-left">Campanha</th>
                  <th className="px-4 py-3 text-right">Gasto</th>
                  <th className="px-4 py-3 text-right">Impressões</th>
                  <th className="px-4 py-3 text-right">Alcance</th>
                  <th className="px-4 py-3 text-right">Cliques</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">CPM</th>
                </tr>
              </thead>
              <tbody>
                {campanhas.map((c, i) => (
                  <tr key={c.campaign_id || i} className="border-b border-gray-50 hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800 max-w-[220px] truncate">{c.campaign_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(c.spend, 'R$ ')}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtInt(c.impressions)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtInt(c.reach)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtInt(c.clicks)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtPct(c.ctr)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(c.cpm, 'R$ ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vazio após carregar */}
      {!loading && !error && overview === null && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhum dado encontrado para o período selecionado.
        </div>
      )}

      {showConfig && (
        <ConfigModal
          onSave={saveConfig}
          initialToken={config.token}
          initialAccountId={config.accountId}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}
