import { useState, useEffect, useCallback } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useFinanceiro } from '../context/FinanceiroContext'
import { supabase } from '../lib/supabase'

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

function MetricCard({ label, value, sub, info }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100/60">
      <div className="flex items-center gap-1 mb-1">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        {info && <InfoBubble info={info} />}
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const CONTAS_PADRAO = [
  { label: 'Dra Amanda 02', id: '' },
  { label: 'Amanda Lima – Rio Verde', id: '' },
  { label: 'CA – AMANDA LIMA 03', id: '' },
]

function ConfigModal({ onSave, initialToken, initialAccounts }) {
  const [token, setToken] = useState(initialToken || '')
  const [accounts, setAccounts] = useState(() =>
    CONTAS_PADRAO.map(c => {
      const existing = initialAccounts?.find(a => a.label === c.label)
      return { ...c, id: existing?.id || '' }
    })
  )

  const handleSave = () => {
    const valid = accounts.filter(a => a.id.trim())
    if (!token.trim() || !valid.length) return
    onSave(token.trim(), valid.map(a => ({ ...a, id: a.id.trim().replace(/^act_/, '') })))
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
            <label className="block text-xs font-semibold text-gray-600 mb-2">Contas de Anúncios</label>
            <div className="space-y-2.5">
              {accounts.map((acc, i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500 mb-1">{acc.label}</p>
                  <input
                    value={acc.id}
                    onChange={e => setAccounts(prev => prev.map((a, j) => j === i ? { ...a, id: e.target.value } : a))}
                    placeholder="Ex: 258608453829027"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">IDs visíveis no Graph API Explorer → me/adaccounts</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={!token.trim() || !accounts.some(a => a.id.trim())}
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

const COR_MIDIA = {
  'Orgânico':     { bg: 'bg-purple-100', text: 'text-purple-700', bar: '#6228d7' },
  'Impulsionar':  { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: '#ee2a7b' },
  'Campanha de msg para Whatsapp': { bg: 'bg-blue-100',   text: 'text-blue-700',   bar: '#3b82f6' },
}

function LeadsMidia({ leads, periodo }) {
  const dias = PERIODO_DIAS[periodo] || 30
  const corte = new Date()
  corte.setDate(corte.getDate() - dias)
  const cutoff = corte.toISOString().slice(0, 10)

  const filtrados = leads.filter(l => {
    const data = l.data || l.criadoEm?.slice(0, 10) || ''
    return data >= cutoff && l.midia
  })

  const porMidia = {}
  filtrados.forEach(l => {
    porMidia[l.midia] = (porMidia[l.midia] || 0) + 1
  })
  const total = filtrados.length
  const sorted = Object.entries(porMidia).sort((a, b) => b[1] - a[1])

  const trafegoPago = filtrados.filter(l => l.midia === 'Campanha de msg para Whatsapp' && l.criativo)
  const porCriativo = {}
  trafegoPago.forEach(l => {
    porCriativo[l.criativo] = (porCriativo[l.criativo] || 0) + 1
  })
  const criativos = Object.entries(porCriativo).sort((a, b) => b[1] - a[1])

  if (total === 0 && criativos.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700">Leads por Mídia</h2>
        <span className="text-xs text-gray-400">{total} leads com mídia nos últimos {dias} dias</span>
      </div>

      {total > 0 && (
        <div className="space-y-3 mb-5">
          {sorted.map(([midia, count]) => {
            const cor = COR_MIDIA[midia] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#9ca3af' }
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={midia}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cor.bg} ${cor.text}`}>{midia}</span>
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

      {criativos.length > 0 && (
        <>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Criativos — Campanha de msg para Whatsapp</p>
            <div className="space-y-2">
              {criativos.map(([criativo, count], i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`
                const pct = trafegoPago.length > 0 ? (count / trafegoPago.length) * 100 : 0
                return (
                  <div key={criativo}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700 flex items-center gap-1.5">
                        <span>{medal}</span>{criativo}
                      </span>
                      <span className="text-xs font-bold text-gray-700">{count} <span className="text-gray-400 font-normal">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#3b82f6' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const CAMPOS_ORGANICO = [
  { key: 'alcance',           label: 'Alcance',            group: 'distribuicao', onde: 'Insights → Visão geral → "Contas alcançadas"' },
  { key: 'impressoes',        label: 'Impressões',          group: 'distribuicao', onde: 'Insights → Visão geral → "Impressões"' },
  { key: 'total_seguidores',  label: 'Total seguidores',    group: 'distribuicao', onde: 'Insights → Público → total de seguidores atual' },
  { key: 'novos_seguidores',  label: 'Novos seguidores',    group: 'distribuicao', onde: 'Insights → Público → "Seguidores" (variação do mês)' },
  { key: 'visitas_perfil',    label: 'Visitas ao perfil',   group: 'distribuicao', onde: 'Insights → Visão geral → "Visitas ao perfil"' },
  { key: 'nao_seguidores_pct',label: '% não seguidores',    group: 'distribuicao', onde: 'Insights → Alcance → "Não seguidores" (%)' },
  { key: 'curtidas',          label: 'Curtidas',            group: 'engajamento',  onde: 'Insights → Visão geral → "Curtidas"' },
  { key: 'comentarios',       label: 'Comentários',         group: 'engajamento',  onde: 'Insights → Visão geral → "Comentários"' },
  { key: 'salvamentos',       label: 'Salvamentos',         group: 'engajamento',  onde: 'Insights → Visão geral → "Salvamentos"' },
  { key: 'compartilhamentos', label: 'Compartilhamentos',   group: 'engajamento',  onde: 'Insights → Visão geral → "Compartilhamentos"' },
  { key: 'cliques_bio',       label: 'Cliques no link bio', group: 'cliques',      onde: 'Insights → Visão geral → "Cliques no link do site"' },
  { key: 'mensagens',         label: 'Mensagens (DM)',       group: 'cliques',      onde: 'Insights → Visão geral → "Mensagens"' },
  { key: 'cliques_whatsapp',  label: 'Cliques WhatsApp',    group: 'cliques',      onde: 'Insights → Visão geral → "Cliques no botão de contato"' },
]

const FORMATOS_CRIATIVO = ['Reel', 'Carrossel', 'Story', 'Post estático', 'Live']

// ─── Instagram Graph API ─────────────────────────────────────────────────────
const IG_KEY = 'instagram_graph_config'

function loadIGConfig() { try { return JSON.parse(localStorage.getItem(IG_KEY) || 'null') } catch { return null } }
function saveIGConfig(cfg) {
  localStorage.setItem(IG_KEY, JSON.stringify(cfg))
  supabase.from('configuracoes').upsert({ chave: IG_KEY, valor: cfg }, { onConflict: 'chave' })
}

async function igFetch(path, token) {
  const res = await fetch(`${GRAPH_BASE}${path}${path.includes('?') ? '&' : '?'}access_token=${token}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json
}

async function fetchIGInsights(userId, token, ano, mes) {
  const inicio = new Date(ano, mes, 1)
  const fim = new Date(ano, mes + 1, 1)
  const since = Math.floor(inicio.getTime() / 1000)
  const until = Math.floor(fim.getTime() / 1000)

  const until30 = Math.min(until, since + 2592000) // API limita a 30 dias por chamada
  const [insightsDia, insightsTotal, profileJson] = await Promise.all([
    igFetch(`/${userId}/insights?metric=reach,follower_count&period=day&since=${since}&until=${until30}`, token),
    igFetch(`/${userId}/insights?metric=views,profile_views,accounts_engaged,website_clicks,total_interactions,likes,comments,shares,saves&metric_type=total_value&period=day&since=${since}&until=${until30}`, token),
    igFetch(`/${userId}?fields=followers_count,username,name`, token),
  ])

  const totals = {}
  for (const m of (insightsDia.data || [])) {
    totals[m.name] = (m.values || []).reduce((s, v) => s + (typeof v.value === 'number' ? v.value : 0), 0)
  }
  for (const m of (insightsTotal.data || [])) {
    totals[m.name] = m.total_value?.value ?? m.value ?? 0
  }

  return {
    alcance: totals.reach || 0,
    impressoes: totals.views || 0,
    novos_seguidores: totals.follower_count || 0,
    total_seguidores: profileJson.followers_count || 0,
    curtidas: totals.likes || 0,
    comentarios: totals.comments || 0,
    salvamentos: totals.saves || 0,
    compartilhamentos: totals.shares || 0,
    cliques_bio: totals.website_clicks || 0,
    mensagens: 0,
    cliques_whatsapp: 0,
    visitas_perfil: totals.profile_views || 0,
    username: profileJson.username || '',
  }
}

async function fetchIGPosts(userId, token, ano, mes) {
  const inicio = new Date(ano, mes, 1)
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59)
  const since = Math.floor(inicio.getTime() / 1000)
  const until = Math.floor(fim.getTime() / 1000)

  const mediaJson = await igFetch(
    `/${userId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url,permalink,children{media_url,thumbnail_url}&since=${since}&until=${until}&limit=50`,
    token
  )

  const posts = []
  for (const media of (mediaJson.data || [])) {
    let insights = {}
    try {
      const insJson = await igFetch(`/${media.id}/insights?metric=reach,views,saved,shares`, token)
      for (const m of (insJson.data || [])) insights[m.name] = m.values?.[0]?.value ?? m.value ?? 0
    } catch {}

    const tipo = media.media_type === 'VIDEO' ? 'Reel' : media.media_type === 'CAROUSEL_ALBUM' ? 'Carrossel' : 'Post estático'
    const data = new Date(media.timestamp)
    posts.push({
      nome: (media.caption || '').replace(/\n/g, ' ').slice(0, 60) || `${tipo} ${data.toLocaleDateString('pt-BR')}`,
      formato: tipo,
      pago: false,
      publicado_em: data.toLocaleDateString('pt-BR'),
      thumbnail: media.thumbnail_url || (media.media_type === 'CAROUSEL_ALBUM' ? media.children?.data?.[0]?.media_url : media.media_url) || '',
      permalink: media.permalink || '',
      alcance: insights.reach || 0,
      impressoes: insights.impressions || 0,
      curtidas: media.like_count || 0,
      comentarios: media.comments_count || 0,
      salvamentos: insights.saved || 0,
      compartilhamentos: insights.shares || 0,
      ig_id: media.id,
    })
  }
  return posts
}

async function fetchIGAccounts(token) {
  const contas = []
  const seen = new Set()

  const processPage = async (page) => {
    if (!page.instagram_business_account || seen.has(page.id)) return
    seen.add(page.id)
    try {
      const ig = await igFetch(`/${page.instagram_business_account.id}?fields=id,username,followers_count,profile_picture_url`, token)
      if (ig.id) contas.push({ userId: ig.id, username: ig.username, followers: ig.followers_count, pageId: page.id, pageName: page.name })
    } catch {}
  }

  // Tentativa 1: acesso direto via /me/accounts (admin tradicional)
  const direct = await igFetch('/me/accounts?fields=id,name,instagram_business_account', token)
  for (const page of (direct.data || [])) await processPage(page)

  // Tentativa 2: páginas atribuídas via Business Manager (não requer business_management)
  if (contas.length === 0) {
    const assigned = await igFetch('/me/assigned_pages?fields=id,name,instagram_business_account', token).catch(() => ({ data: [] }))
    for (const page of (assigned.data || [])) await processPage(page)
  }

  // Tentativa 3: acesso via portfólio empresarial (requer business_management)
  if (contas.length === 0) {
    const biz = await igFetch('/me/businesses?fields=id,name', token).catch(() => ({ data: [] }))
    for (const b of (biz.data || [])) {
      const owned = await igFetch(`/${b.id}/owned_pages?fields=id,name,instagram_business_account`, token).catch(() => ({ data: [] }))
      for (const page of (owned.data || [])) await processPage(page)
      const client = await igFetch(`/${b.id}/client_pages?fields=id,name,instagram_business_account`, token).catch(() => ({ data: [] }))
      for (const page of (client.data || [])) await processPage(page)
    }
  }

  return contas
}

function IGSetupModal({ onSave, onClose, initial }) {
  const [step, setStep] = useState(initial?.token ? 3 : 1)
  const [token, setToken] = useState(initial?.token || '')
  const [carregando, setCarregando] = useState(false)
  const [contas, setContas] = useState([])
  const [erro, setErro] = useState('')
  const [igIdManual, setIgIdManual] = useState('')
  const [carregandoManual, setCarregandoManual] = useState(false)

  const buscarContas = async () => {
    if (!token.trim()) return
    setCarregando(true); setErro('')
    try {
      const lista = await fetchIGAccounts(token.trim())
      if (lista.length === 0) { setErro('Não encontramos a conta automaticamente. Cole abaixo o ID da conta Instagram Business (ou gere um novo token com a permissão business_management marcada).'); setCarregando(false); return }
      setContas(lista); setStep(4)
    } catch (e) { setErro(e.message) }
    setCarregando(false)
  }

  const conectarManual = async () => {
    if (!igIdManual.trim() || !token.trim()) return
    setCarregandoManual(true); setErro('')
    try {
      const ig = await igFetch(`/${igIdManual.trim()}?fields=id,username,followers_count,profile_picture_url`, token.trim())
      if (!ig.id) { setErro('ID inválido ou sem permissão para acessar essa conta.'); setCarregandoManual(false); return }
      setContas([{ userId: ig.id, username: ig.username, followers: ig.followers_count, pageId: 'manual', pageName: 'Conexão manual' }])
      setStep(4)
    } catch (e) { setErro('Erro: ' + e.message) }
    setCarregandoManual(false)
  }

  const selecionar = (conta) => {
    const expiry = new Date(); expiry.setDate(expiry.getDate() + 55)
    onSave({ token: token.trim(), userId: conta.userId, username: conta.username, expiry: expiry.toISOString() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </div>
            <h2 className="text-base font-bold text-gray-800">Conectar Instagram Insights</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Steps */}
        {step <= 3 && (
          <div className="space-y-4 mb-6">
            <div className={`rounded-xl p-4 border ${step === 1 ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-brand-400 text-white text-xs flex items-center justify-center font-bold">1</span>
                <p className="text-sm font-semibold text-gray-700">Criar App gratuito no Meta</p>
              </div>
              <p className="text-xs text-gray-500 mb-2">Acesse developers.facebook.com/apps → "Criar app" → "Outro" → "Business" → dê qualquer nome (ex: "Clinica Analytics")</p>
              <a href="https://developers.facebook.com/apps/creation/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-500 underline">Criar app agora ↗</a>
            </div>

            <div className={`rounded-xl p-4 border ${step === 2 ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-brand-400 text-white text-xs flex items-center justify-center font-bold">2</span>
                <p className="text-sm font-semibold text-gray-700">Gerar token no Graph API Explorer</p>
              </div>
              <p className="text-xs text-gray-500 mb-1">1. Abra o Graph API Explorer</p>
              <p className="text-xs text-gray-500 mb-1">2. Selecione seu app no dropdown "Meta App"</p>
              <p className="text-xs text-gray-500 mb-1">3. Clique em "Generate Access Token"</p>
              <p className="text-xs text-gray-500 mb-2">4. Marque as permissões: <strong>instagram_basic</strong>, <strong>instagram_manage_insights</strong>, <strong>pages_show_list</strong>, <strong>pages_read_engagement</strong>, <strong>business_management</strong></p>
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-500 underline">Abrir Graph API Explorer ↗</a>
            </div>

            <div className={`rounded-xl p-4 border ${step === 3 ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-brand-400 text-white text-xs flex items-center justify-center font-bold">3</span>
                <p className="text-sm font-semibold text-gray-700">Cole o token aqui</p>
              </div>
              <textarea value={token} onChange={e => setToken(e.target.value)} placeholder="EAAxxxxxxx..." rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-gray-700 resize-none focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 mb-2" />
              <p className="text-xs text-gray-400">O token dura ~60 dias. Te avisamos quando estiver próximo de expirar.</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Selecione a conta do Instagram:</p>
            <div className="space-y-2">
              {contas.map(c => (
                <button key={c.userId} onClick={() => selecionar(c)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {c.username?.[0]?.toUpperCase() || 'I'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">@{c.username}</p>
                    <p className="text-xs text-gray-400">{c.followers?.toLocaleString('pt-BR')} seguidores · {c.pageName}</p>
                  </div>
                  <span className="ml-auto text-brand-400">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 rounded-xl px-3 py-3 mb-4 space-y-2">
            <p className="text-xs text-red-500">{erro}</p>
            <p className="text-xs text-gray-600 font-semibold">Conexão manual — cole o ID da conta Instagram Business:</p>
            <div className="flex gap-2">
              <input value={igIdManual} onChange={e => setIgIdManual(e.target.value)} placeholder="17841407062223101" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-400" />
              <button onClick={conectarManual} disabled={!igIdManual.trim() || carregandoManual} className="px-3 py-1.5 bg-brand-400 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg whitespace-nowrap">
                {carregandoManual ? '...' : 'Conectar'}
              </button>
            </div>
            <p className="text-xs text-gray-400">O ID da conta é: <strong>17841407062223101</strong> (dra.amandaliima)</p>
          </div>
        )}

        {step <= 3 && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[1,2,3].map(s => (
                <button key={s} onClick={() => setStep(s)} className={`w-2 h-2 rounded-full transition-colors ${step === s ? 'bg-brand-400' : 'bg-gray-200'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 1 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Voltar</button>}
              {step < 3 && <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl">Próximo</button>}
              {step === 3 && (
                <button onClick={buscarContas} disabled={!token.trim() || carregando} className="px-4 py-2 bg-brand-400 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl">
                  {carregando ? 'Buscando...' : 'Conectar →'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

function loadOrganico(ano, mes) {
  try { return JSON.parse(localStorage.getItem(`instagram_organico_${ano}_${mes}`) || '{}') } catch { return {} }
}
function saveOrganico(ano, mes, dados) {
  const key = `instagram_organico_${ano}_${mes}`
  localStorage.setItem(key, JSON.stringify(dados))
  supabase.from('configuracoes').upsert({ chave: key, valor: dados }, { onConflict: 'chave' })
}
function loadCriativos(ano, mes) {
  try { return JSON.parse(localStorage.getItem(`instagram_criativos_${ano}_${mes}`) || '[]') } catch { return [] }
}
function saveCriativos(ano, mes, lista) {
  const key = `instagram_criativos_${ano}_${mes}`
  localStorage.setItem(key, JSON.stringify(lista))
  supabase.from('configuracoes').upsert({ chave: key, valor: lista }, { onConflict: 'chave' })
}

function Tooltip({ texto }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[10px] flex items-center justify-center cursor-help font-bold select-none">?</span>
      {show && (
        <span className="absolute left-5 top-0 z-50 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-56 shadow-lg leading-relaxed whitespace-normal">
          📍 {texto}
        </span>
      )}
    </span>
  )
}

function PainelOrganico({ leads, mes, ano, navMes, igConfig, onOpenSetup }) {
  const [editando, setEditando] = useState(false)
  const [dados, setDados] = useState(() => loadOrganico(ano, mes))
  const [form, setForm] = useState({})
  const [sincronizando, setSincronizando] = useState(false)
  const [sincError, setSincError] = useState(null)
  const [sincOk, setSincOk] = useState(false)

  useEffect(() => {
    const key = `instagram_organico_${ano}_${mes}`
    supabase.from('configuracoes').select('valor').eq('chave', key).maybeSingle()
      .then(({ data }) => {
        if (data?.valor) { localStorage.setItem(key, JSON.stringify(data.valor)); setDados(data.valor) }
        else {
          const local = loadOrganico(ano, mes)
          if (Object.keys(local).length > 0) supabase.from('configuracoes').upsert({ chave: key, valor: local }, { onConflict: 'chave' })
          setDados(local)
        }
      })
  }, [ano, mes])

  const sincronizar = async () => {
    if (!igConfig) return
    setSincronizando(true)
    setSincError(null)
    setSincOk(false)
    try {
      const resultado = await fetchIGInsights(igConfig.userId, igConfig.token, ano, mes)
      const atual = loadOrganico(ano, mes)
      const merged = {
        ...atual,
        alcance: resultado.alcance || atual.alcance,
        impressoes: resultado.impressoes || atual.impressoes,
        total_seguidores: resultado.total_seguidores || atual.total_seguidores,
        novos_seguidores: resultado.novos_seguidores || atual.novos_seguidores,
        visitas_perfil: resultado.visitas_perfil || atual.visitas_perfil,
        curtidas: resultado.curtidas || atual.curtidas,
        comentarios: resultado.comentarios || atual.comentarios,
        salvamentos: resultado.salvamentos || atual.salvamentos,
        compartilhamentos: resultado.compartilhamentos || atual.compartilhamentos,
        cliques_bio: resultado.cliques_bio || atual.cliques_bio,
        mensagens: resultado.mensagens || atual.mensagens,
        cliques_whatsapp: resultado.cliques_whatsapp || atual.cliques_whatsapp,
      }
      saveOrganico(ano, mes, merged)
      setDados(merged)
      setSincOk(true)
      setTimeout(() => setSincOk(false), 3000)
    } catch (e) {
      setSincError('Token do Instagram expirado. Reconecte o Instagram para sincronizar.')
    }
    setSincronizando(false)
  }

  const abrirEdicao = () => { setForm({ ...dados }); setEditando(true) }
  const salvar = () => {
    const limpo = {}
    CAMPOS_ORGANICO.forEach(c => { const v = parseFloat(form[c.key]); if (!isNaN(v)) limpo[c.key] = v })
    saveOrganico(ano, mes, limpo)
    setDados(limpo)
    setEditando(false)
  }

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const totalLeads = leads.filter(l => (l.data || l.criadoEm?.slice(0,10) || '').startsWith(prefix)).length

  const num = (k) => dados[k] ?? null
  const engTotal = (num('curtidas') ?? 0) + (num('comentarios') ?? 0) + (num('salvamentos') ?? 0) + (num('compartilhamentos') ?? 0)
  const taxaEng = num('alcance') > 0 ? (engTotal / num('alcance')) * 100 : null
  const trafego = parseFloat(localStorage.getItem(`social_trafego_${ano}_${mes}`)) || 0
  const custoPorLead = trafego > 0 && totalLeads > 0 ? trafego / totalLeads : null

  const fmtN = (v) => v == null ? '—' : Number(v).toLocaleString('pt-BR')
  const fmtP = (v) => v == null ? '—' : v.toFixed(1) + '%'
  const fmtR = (v) => v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const secoes = [
    { title: 'Distribuição', color: 'text-blue-600', cols: 3, cards: [
      { label: 'Alcance', value: fmtN(num('alcance')), icon: '📡' },
      { label: 'Impressões', value: fmtN(num('impressoes')), icon: '👁️' },
      { label: 'Visitas ao perfil', value: fmtN(num('visitas_perfil')), icon: '🔍' },
      { label: 'Total seguidores', value: fmtN(num('total_seguidores')), icon: '👥' },
      { label: 'Novos seguidores', value: fmtN(num('novos_seguidores')), icon: '➕' },
      { label: '% não seguidores', value: fmtP(num('nao_seguidores_pct')), icon: '🌍' },
    ]},
    { title: 'Engajamento', color: 'text-pink-600', cols: 5, cards: [
      { label: 'Curtidas', value: fmtN(num('curtidas')), icon: '❤️' },
      { label: 'Comentários', value: fmtN(num('comentarios')), icon: '💬' },
      { label: 'Salvamentos', value: fmtN(num('salvamentos')), icon: '🔖' },
      { label: 'Compartilhamentos', value: fmtN(num('compartilhamentos')), icon: '🔁' },
      { label: 'Taxa de engajamento', value: fmtP(taxaEng), icon: '📈', highlight: true },
    ]},
    { title: 'Cliques & Conversão', color: 'text-green-600', cols: 3, cards: [
      { label: 'Cliques no link bio', value: fmtN(num('cliques_bio')), icon: '🔗' },
      { label: 'Mensagens (DM)', value: fmtN(num('mensagens')), icon: '✉️' },
      { label: 'Cliques WhatsApp', value: fmtN(num('cliques_whatsapp')), icon: '📲' },
    ]},
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Painel Orgânico</h2>
          <p className="text-xs text-gray-400">
            {igConfig ? <span className="text-green-600 font-medium">● Conectado como @{igConfig.username}</span> : 'Preenchimento manual · conecte o Instagram para sincronizar'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navMes(-1)} className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600">‹</button>
          <span className="text-sm font-semibold text-gray-700 min-w-[110px] text-center">{MESES_NOME[mes]} {ano}</span>
          <button onClick={() => navMes(1)} className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600">›</button>
          {igConfig ? (
            <div className="flex flex-col items-end gap-1">
              <button onClick={sincronizar} disabled={sincronizando} className="ml-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors">
                {sincronizando ? 'Sincronizando...' : '🔄 Sincronizar'}
              </button>
              {sincError && <p className="text-[10px] text-red-500 max-w-[200px] text-right leading-tight">{sincError}</p>}
              {sincOk && <p className="text-[10px] text-green-600 text-right">✓ Sincronizado!</p>}
            </div>
          ) : (
            <button onClick={onOpenSetup} className="ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors" style={{ background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' }}>
              Conectar Instagram
            </button>
          )}
          <button onClick={abrirEdicao} className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            ✏️ Editar
          </button>
        </div>
      </div>

      {secoes.map(sec => (
        <div key={sec.title} className="mb-4">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${sec.color}`}>{sec.title}</p>
          <div className={`grid grid-cols-${sec.cols} gap-3`}>
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

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-800">Editar métricas — {MESES_NOME[mes]} {ano}</h2>
              <button onClick={() => setEditando(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <p className="text-xs text-gray-400 mb-1">Abra o Instagram → <strong>Insights</strong> → selecione o período do mês completo</p>
            <a href="https://www.instagram.com/businessmanager/" target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 underline mb-5 inline-block">Abrir Instagram Insights ↗</a>

            {['distribuicao','engajamento','cliques'].map(group => {
              const campos = CAMPOS_ORGANICO.filter(c => c.group === group)
              const titulo = { distribuicao: 'Distribuição', engajamento: 'Engajamento', cliques: 'Cliques & Conversão' }[group]
              return (
                <div key={group} className="mb-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{titulo}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {campos.map(c => (
                      <div key={c.key}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <label className="text-xs font-semibold text-gray-600">{c.label}</label>
                          <Tooltip texto={c.onde} />
                        </div>
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
                </div>
              )
            })}

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setEditando(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} className="px-5 py-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBubble({ info }) {
  const [pos, setPos] = useState(null)
  return (
    <span className="inline-flex">
      <span
        className="text-[10px] w-3.5 h-3.5 rounded-full bg-gray-300 text-white inline-flex items-center justify-center font-bold leading-none select-none cursor-help"
        onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); const w = 260; const x = r.left + w > window.innerWidth - 8 ? r.right - w : r.left; setPos({ x, y: r.bottom + 6 }) }}
        onMouseLeave={() => setPos(null)}
      >i</span>
      {pos && (
        <span style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, width: 260 }}
          className="bg-gray-800 text-white text-[11px] text-left rounded-xl px-3 py-2.5 leading-relaxed shadow-xl normal-case tracking-normal font-normal pointer-events-none">
          {info}
        </span>
      )}
    </span>
  )
}

function ThInfo({ label, info, align = 'right', sortKey, sortCol, sortDir, onSort }) {
  const active = sortKey && sortCol === sortKey
  return (
    <th className={`px-4 py-3 text-${align}`}>
      <span className="inline-flex items-center gap-1">
        {sortKey
          ? <button onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-0.5 transition-colors outline-none focus:outline-none ${active ? 'text-gray-700' : 'hover:text-gray-500'}`}>
              {label}
              {active && <span className="text-[9px] ml-0.5">{sortDir === 'desc' ? '↓' : '↑'}</span>}
            </button>
          : label
        }
        <InfoBubble info={info} />
      </span>
    </th>
  )
}

const CRIATIVO_VAZIO = { nome: '', formato: 'Reel', pago: false, alcance: '', impressoes: '', curtidas: '', comentarios: '', salvamentos: '', compartilhamentos: '' }

function CriativosSection({ mes, ano, igConfig, onOpenSetup, boostedPermalinks }) {
  const [criativos, setCriativos] = useState(() => loadCriativos(ano, mes))
  const [modalAberto, setModalAberto] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [form, setForm] = useState(CRIATIVO_VAZIO)
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [sortCol, setSortCol] = useState('eng')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    const key = `instagram_criativos_${ano}_${mes}`
    supabase.from('configuracoes').select('valor').eq('chave', key).maybeSingle()
      .then(({ data }) => {
        if (data?.valor) { localStorage.setItem(key, JSON.stringify(data.valor)); setCriativos(data.valor) }
        else {
          const local = loadCriativos(ano, mes)
          if (local.length > 0) supabase.from('configuracoes').upsert({ chave: key, valor: local }, { onConflict: 'chave' })
          setCriativos(local)
        }
      })
  }, [ano, mes])

  const save = (lista) => { saveCriativos(ano, mes, lista); setCriativos(lista) }

  const abrirNovo = () => { setForm({ ...CRIATIVO_VAZIO }); setEditIdx(null); setModalAberto(true) }
  const abrirEditar = (i) => { setForm({ ...criativos[i] }); setEditIdx(i); setModalAberto(true) }

  const salvar = () => {
    const c = {
      ...form,
      alcance: parseFloat(form.alcance) || 0,
      impressoes: parseFloat(form.impressoes) || 0,
      curtidas: parseFloat(form.curtidas) || 0,
      comentarios: parseFloat(form.comentarios) || 0,
      salvamentos: parseFloat(form.salvamentos) || 0,
      compartilhamentos: parseFloat(form.compartilhamentos) || 0,
    }
    if (!c.nome.trim()) return
    const lista = editIdx !== null
      ? criativos.map((x, i) => i === editIdx ? c : x)
      : [...criativos, c]
    save(lista)
    setModalAberto(false)
  }

  const excluir = (i) => { if (window.confirm('Excluir este criativo?')) save(criativos.filter((_, idx) => idx !== i)) }

  const importarPosts = async () => {
    if (!igConfig) return
    setImportando(true)
    setImportMsg(null)
    try {
      const posts = await fetchIGPosts(igConfig.userId, igConfig.token, ano, mes)
      if (posts.length === 0) { setImportMsg({ tipo: 'warn', texto: 'Nenhum post encontrado neste mês.' }); setImportando(false); return }
      const existentesIds = new Set(criativos.map(c => c.ig_id).filter(Boolean))
      const novos = posts.filter(p => !existentesIds.has(p.ig_id))
      const atualizados = criativos.map(c => {
        if (!c.ig_id) return c
        const fresh = posts.find(p => p.ig_id === c.ig_id)
        return fresh ? { ...c, thumbnail: fresh.thumbnail, publicado_em: fresh.publicado_em, permalink: fresh.permalink } : c
      })
      const merged = [...atualizados, ...novos]
      save(merged)
      setImportMsg({ tipo: 'ok', texto: `${novos.length} novo(s) importado(s), ${atualizados.filter(c => c.ig_id).length} atualizado(s)!` })
    } catch (e) {
      setImportMsg({ tipo: 'erro', texto: 'Token do Instagram expirado. Reconecte o perfil orgânico.' })
    }
    setImportando(false)
  }

  const eng = (c) => c.curtidas + c.comentarios + c.salvamentos + c.compartilhamentos
  const taxaEng = (c) => c.alcance > 0 ? ((eng(c) / c.alcance) * 100) : 0

  const getVal = (c, col) => ({ alcance: c.alcance, curtidas: c.curtidas, salvamentos: c.salvamentos, compartilhamentos: c.compartilhamentos, eng: eng(c), taxa: taxaEng(c) })[col] ?? 0
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortCol(col); setSortDir('desc') } }
  const sorted = [...criativos].sort((a, b) => sortDir === 'desc' ? getVal(b, sortCol) - getVal(a, sortCol) : getVal(a, sortCol) - getVal(b, sortCol))

  const COR_FORMATO = { Reel: 'bg-purple-100 text-purple-700', Carrossel: 'bg-blue-100 text-blue-700', Story: 'bg-pink-100 text-pink-700', 'Post estático': 'bg-gray-100 text-gray-600', Live: 'bg-red-100 text-red-700' }

  const fmtN = (v) => Number(v || 0).toLocaleString('pt-BR')
  const fmtP = (v) => v.toFixed(1) + '%'

  const medalha = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Criativos</h2>
          <p className="text-xs text-gray-400">Rastreie cada post e veja qual performa melhor — {MESES_NOME[mes]} {ano}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
          {igConfig ? (
            <button onClick={importarPosts} disabled={importando} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-colors" style={{ background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' }}>
              {importando ? 'Importando...' : '📥 Importar posts do mês'}
            </button>
          ) : (
            <button onClick={onOpenSetup} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors" style={{ background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' }}>
              Conectar para importar
            </button>
          )}
          <button onClick={abrirNovo} className="px-3 py-1.5 bg-brand-400 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors">
            + Adicionar manual
          </button>
          </div>
          {importMsg && (
            <p className={`text-[10px] max-w-[260px] text-right leading-tight ${importMsg.tipo === 'erro' ? 'text-red-500' : importMsg.tipo === 'ok' ? 'text-green-600' : 'text-yellow-600'}`}>
              {importMsg.texto}
            </p>
          )}
        </div>
      </div>

      {criativos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm p-10 text-center">
          <p className="text-2xl mb-2">🎨</p>
          <p className="text-sm font-medium text-gray-600 mb-1">Nenhum criativo registrado</p>
          <p className="text-xs text-gray-400">Adicione seus posts, reels e stories para saber qual está gerando mais resultado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Criativo</th>
                  <ThInfo label="Formato" align="left" info="Tipo do post: Reel, Carrossel, Story ou Post estático." />
                  <ThInfo label="Alcance" info="Pessoas únicas que viram o post." sortKey="alcance" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <ThInfo label="Curtidas" info="Total de curtidas recebidas." sortKey="curtidas" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <ThInfo label="Salv." info="Salvamentos — quantas vezes alguém salvou o post para ver depois." sortKey="salvamentos" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <ThInfo label="Comp." info="Compartilhamentos — quantas vezes o post foi enviado para outra pessoa." sortKey="compartilhamentos" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <ThInfo label="Engajamento" info="Soma de curtidas + comentários + salvamentos + compartilhamentos." sortKey="eng" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <ThInfo label="Taxa eng." info="% do alcance que interagiu com o post. Acima de 3% é considerado bom." sortKey="taxa" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={i} className={`border-b border-gray-50 hover:bg-brand-50/30 transition-colors ${i === 0 ? 'bg-yellow-50/40' : ''}`}>
                    <td className="px-4 py-3 text-base">{medalha(i) || <span className="text-xs text-gray-400">{i + 1}</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.thumbnail
                          ? <a href={c.permalink || '#'} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 block">
                              <img src={c.thumbnail} alt="" onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='flex' }} className="w-10 h-10 rounded-lg object-cover bg-gray-100 hover:opacity-80 transition-opacity cursor-pointer" />
                              <div style={{display:'none'}} className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center text-gray-300 text-lg">🖼</div>
                            </a>
                          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-lg">🖼</div>
                        }
                        <div>
                          <p className="font-medium text-gray-800 max-w-[160px] truncate">{c.nome}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {c.publicado_em && <span className="text-[10px] text-gray-400">{c.publicado_em}</span>}
                            {c.pago && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">💰 Impulsionado</span>}
                            {!c.pago && c.permalink && boostedPermalinks?.has(c.permalink) && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">impulsionado</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_FORMATO[c.formato] || 'bg-gray-100 text-gray-600'}`}>{c.formato}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtN(c.alcance)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtN(c.curtidas)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtN(c.salvamentos)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtN(c.compartilhamentos)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtN(eng(c))}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${i === 0 ? 'text-green-600' : 'text-gray-700'}`}>{fmtP(taxaEng(c))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => abrirEditar(criativos.indexOf(c))} className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded-lg hover:bg-gray-100">✏️</button>
                        <button onClick={() => excluir(criativos.indexOf(c))} className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded-lg hover:bg-red-50">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Melhor por formato */}
          {criativos.length >= 2 && (
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Melhor por formato</p>
              <div className="flex flex-wrap gap-2">
                {FORMATOS_CRIATIVO.map(fmt => {
                  const grupo = criativos.filter(c => c.formato === fmt)
                  if (grupo.length === 0) return null
                  const melhor = grupo.sort((a, b) => taxaEng(b) - taxaEng(a))[0]
                  return (
                    <div key={fmt} className="bg-white rounded-xl border border-gray-200 px-3 py-2 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_FORMATO[fmt] || 'bg-gray-100 text-gray-600'}`}>{fmt}</span>
                      <span className="text-xs text-gray-700 font-medium truncate max-w-[120px]">{melhor.nome}</span>
                      <span className="text-xs font-bold text-green-600">{fmtP(taxaEng(melhor))}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">{editIdx !== null ? 'Editar criativo' : 'Novo criativo'}</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nome / descrição</label>
                <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Reel antes e depois julho" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Formato</label>
                  <select value={form.formato} onChange={e => setForm(p => ({ ...p, formato: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand-400">
                    {FORMATOS_CRIATIVO.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.pago} onChange={e => setForm(p => ({ ...p, pago: e.target.checked }))} className="w-4 h-4 accent-brand-400" />
                    <span className="text-sm text-gray-700 font-medium">Marcar como impulsionado</span>
                  </label>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Métricas do post</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { key: 'alcance', label: 'Alcance', onde: 'No post → "Ver insights" → Alcance' },
                { key: 'impressoes', label: 'Impressões', onde: 'No post → "Ver insights" → Impressões' },
                { key: 'curtidas', label: 'Curtidas', onde: 'Visível abaixo do post' },
                { key: 'comentarios', label: 'Comentários', onde: 'Visível abaixo do post' },
                { key: 'salvamentos', label: 'Salvamentos', onde: 'No post → "Ver insights" → Salvamentos' },
                { key: 'compartilhamentos', label: 'Compartilhamentos', onde: 'No post → "Ver insights" → Compartilhamentos' },
              ].map(c => (
                <div key={c.key}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-xs font-semibold text-gray-600">{c.label}</label>
                    <Tooltip texto={c.onde} />
                  </div>
                  <input type="number" value={form[c.key] ?? ''} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))} placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome.trim()} className="px-5 py-2 bg-brand-400 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl">Salvar</button>
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
  const [mesPainel, setMesPainel] = useState(new Date().getMonth())
  const [anoPainel, setAnoPainel] = useState(new Date().getFullYear())
  const navMes = (delta) => {
    setMesPainel(m => { let nm = m + delta, na = anoPainel; if (nm < 0) { nm = 11; na-- } if (nm > 11) { nm = 0; na++ } setAnoPainel(na); return nm })
  }
  const [igConfig, setIGConfig] = useState(() => loadIGConfig())
  const [showIGSetup, setShowIGSetup] = useState(false)
  const salvarIGConfig = (cfg) => { saveIGConfig(cfg); setIGConfig(cfg); setShowIGSetup(false) }
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('instagram_ads_config') || 'null') } catch { return null }
  })

  useEffect(() => {
    supabase.from('configuracoes').select('chave,valor').in('chave', [IG_KEY, 'instagram_ads_config'])
      .then(({ data }) => {
        const found = {}
        ;(data || []).forEach(row => { found[row.chave] = row.valor })

        if (found[IG_KEY]) { localStorage.setItem(IG_KEY, JSON.stringify(found[IG_KEY])); setIGConfig(found[IG_KEY]) }
        else { const local = loadIGConfig(); if (local) { supabase.from('configuracoes').upsert({ chave: IG_KEY, valor: local }, { onConflict: 'chave' }); setIGConfig(local) } }

        if (found['instagram_ads_config']) { localStorage.setItem('instagram_ads_config', JSON.stringify(found['instagram_ads_config'])); setConfig(found['instagram_ads_config']) }
        else { try { const local = JSON.parse(localStorage.getItem('instagram_ads_config') || 'null'); if (local) { supabase.from('configuracoes').upsert({ chave: 'instagram_ads_config', valor: local }, { onConflict: 'chave' }); setConfig(local) } } catch {} }
      })
  }, [])
  const [boostedPermalinks, setBoostedPermalinks] = useState(new Set())

  useEffect(() => {
    if (!config) return
    const { token, accounts } = config
    const ids = accounts?.map(a => a.id).filter(Boolean) || (config.accountId ? [config.accountId] : [])
    if (!ids.length || !token) return
    Promise.all(ids.map(id =>
      fetch(`${GRAPH_BASE}/act_${id}/ads?fields=creative{instagram_permalink_url}&limit=200&access_token=${token}`)
        .then(r => r.json()).catch(() => ({}))
    )).then(results => {
      const set = new Set()
      results.forEach(json => {
        ;(json.data || []).forEach(ad => { if (ad.creative?.instagram_permalink_url) set.add(ad.creative.instagram_permalink_url) })
      })
      setBoostedPermalinks(set)
    })
  }, [config])

  const [ctwaCampanhas, setCtwaCampanhas] = useState([]) // lista de campanhas buscada da API
  const [ctwaMensagens, setCtwaMensagens] = useState([]) // {id, nome, conta, mensagem} salvo no Supabase
  const [loadingCtwa, setLoadingCtwa] = useState(false)
  const [salvandoCtwa, setSalvandoCtwa] = useState(false)
  const [ctwaCarregado, setCtwaCarregado] = useState(false)

  // Carrega mensagens salvas do Supabase ao montar
  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', 'ctwa_mensagens').maybeSingle()
      .then(({ data }) => { if (data?.valor) setCtwaMensagens(data.valor) })
  }, [])

  const buscarCampanhasCtwa = async () => {
    if (!config) return
    setLoadingCtwa(true)
    const { token, accounts } = config
    const ids = accounts?.map(a => a.id).filter(Boolean) || (config.accountId ? [config.accountId] : [])
    const todas = []
    await Promise.all(ids.map(async (id, idx) => {
      const label = accounts?.[idx]?.label || `Conta ${idx + 1}`
      try {
        const res = await fetch(`${GRAPH_BASE}/act_${id}/campaigns?fields=id,name,status&limit=200&access_token=${token}`)
        const json = await res.json()
        ;(json.data || []).forEach(c => todas.push({ id: c.id, nome: c.name, conta: label, status: c.status }))
      } catch {}
    }))
    todas.sort((a, b) => (a.status === 'ACTIVE' ? -1 : 1) - (b.status === 'ACTIVE' ? -1 : 1))
    // Merge com mensagens já salvas
    const merged = todas.map(c => {
      const salvo = ctwaMensagens.find(m => m.id === c.id)
      return { ...c, mensagem: salvo?.mensagem || '' }
    })
    setCtwaCampanhas(merged)
    setCtwaCarregado(true)
    setLoadingCtwa(false)
  }

  const atualizarMensagemCtwa = (id, mensagem) => {
    setCtwaCampanhas(prev => prev.map(c => c.id === id ? { ...c, mensagem } : c))
  }

  const salvarMensagensCtwa = async () => {
    setSalvandoCtwa(true)
    const payload = ctwaCampanhas.map(({ id, nome, conta, mensagem }) => ({ id, nome, conta, mensagem }))
    await supabase.from('configuracoes').upsert({ chave: 'ctwa_mensagens', valor: payload }, { onConflict: 'chave' })
    setCtwaMensagens(payload)
    setSalvandoCtwa(false)
  }

  const [showConfig, setShowConfig] = useState(false)
  const [periodo, setPeriodo] = useState('last_30d')
  const [overview, setOverview] = useState(null)
  const [campanhas, setCampanhas] = useState([])
  const [adsEngajamento, setAdsEngajamento] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')

  // Salva no Supabase sempre que os criativos de engajamento forem carregados
  useEffect(() => {
    if (adsEngajamento.length === 0) return
    const payload = adsEngajamento.map(a => ({ ad_id: a.ad_id, nome: a.adNameFull || a.ad_name || '', thumbnail: a.thumbnail, permalink: a.permalink }))
    supabase.from('configuracoes').upsert({ chave: 'ads_engajamento', valor: payload }, { onConflict: 'chave' })
  }, [adsEngajamento])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [contaIdx, setContaIdx] = useState(0)

  const saveConfig = (token, accounts) => {
    const c = { token, accounts }
    localStorage.setItem('instagram_ads_config', JSON.stringify(c))
    supabase.from('configuracoes').upsert({ chave: 'instagram_ads_config', valor: c }, { onConflict: 'chave' })
    setConfig(c)
    setContaIdx(0)
    setShowConfig(false)
  }

  const fetchData = useCallback(async () => {
    if (!config) return
    setLoading(true)
    setError(null)
    try {
      const { token } = config
      const accountId = config.accounts?.[contaIdx]?.id || config.accountId
      const base = `${GRAPH_BASE}/act_${accountId}`
      const fields = 'spend,impressions,reach,clicks,ctr,cpm,cpp,actions'

      const [overviewRes, campaignsRes, campInfoRes, adsRes] = await Promise.all([
        fetch(`${base}/insights?fields=${fields}&date_preset=${periodo}&access_token=${token}`),
        fetch(`${base}/insights?fields=campaign_name,campaign_id,spend,impressions,reach,clicks,ctr,cpm,cpp,frequency,actions&level=campaign&date_preset=${periodo}&access_token=${token}`),
        fetch(`${base}/campaigns?fields=id,name,objective,start_time,status&access_token=${token}&limit=200`),
        fetch(`${base}/ads?fields=id,campaign_id,name,creative{thumbnail_url,image_url,instagram_permalink_url,object_story_id}&limit=200&access_token=${token}`),
      ])

      const overviewJson = await overviewRes.json()
      const campaignsJson = await campaignsRes.json()
      const campInfoJson = await campInfoRes.json()
      const adsJson = await adsRes.json()

      if (overviewJson.error) throw new Error(overviewJson.error.message)
      if (campaignsJson.error) throw new Error(campaignsJson.error.message)

      const objMap = {}
      const startMap = {}
      const statusMap = {}
      ;(campInfoJson.data || []).forEach(c => { objMap[c.id] = c.objective; if (c.start_time) startMap[c.id] = c.start_time; statusMap[c.id] = c.status || '' })

      // IDs das campanhas de engajamento
      const engCampaignIds = new Set(Object.entries(objMap).filter(([, obj]) => ['OUTCOME_ENGAGEMENT', 'POST_ENGAGEMENT'].includes(obj)).map(([id]) => id))

      // Mapa de thumbnail por ad_id E por campaign_id
      const thumbMap = {}
      const adThumbMap = {}
      ;(adsJson.data || []).forEach(ad => {
        const cr = ad.creative || {}
        let permalink = cr.instagram_permalink_url || ''
        if (!permalink && cr.object_story_id) {
          const [pageId, postId] = cr.object_story_id.split('_')
          if (pageId && postId) permalink = `https://www.facebook.com/${pageId}/posts/${postId}`
        }
        const entry = { thumbnail: cr.thumbnail_url || cr.image_url || '', permalink, adName: ad.name || '' }
        adThumbMap[ad.id] = entry
        if (!thumbMap[ad.campaign_id]) thumbMap[ad.campaign_id] = entry
      })

      setOverview(overviewJson.data?.[0] || null)
      setCampanhas((campaignsJson.data || []).map(c => ({ ...c, objetivo: objMap[c.campaign_id] || '', status: statusMap[c.campaign_id] || '', thumbnail: thumbMap[c.campaign_id]?.thumbnail || '', permalink: thumbMap[c.campaign_id]?.permalink || '', inicio: startMap[c.campaign_id] || '' })))

      // Busca métricas por anúncio: chama /{campaign_id}/insights?level=ad para cada campanha de engajamento
      let engFormatados = []
      if (engCampaignIds.size > 0) {
        try {
          const adInsightsResults = await Promise.all(
            [...engCampaignIds].map(campId =>
              fetch(`${GRAPH_BASE}/${campId}/insights?fields=ad_name,ad_id,campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpm,frequency,actions&level=ad&date_preset=${periodo}&limit=200&access_token=${token}`)
                .then(r => r.json())
                .catch(() => ({ data: [] }))
            )
          )
          const allAds = adInsightsResults.flatMap(j => (!j.error && Array.isArray(j.data)) ? j.data : [])
          if (allAds.length > 0) {
            engFormatados = allAds.map(a => ({
              ...a,
              thumbnail: adThumbMap[a.ad_id]?.thumbnail || thumbMap[a.campaign_id]?.thumbnail || '',
              permalink: adThumbMap[a.ad_id]?.permalink || thumbMap[a.campaign_id]?.permalink || '',
              adNameFull: adThumbMap[a.ad_id]?.adName || a.ad_name || '',
            }))
          }
        } catch {}
      }
      // Fallback: se não veio dado por anúncio, usa nível de campanha
      if (engFormatados.length === 0 && engCampaignIds.size > 0) {
        engFormatados = (campaignsJson.data || [])
          .filter(c => engCampaignIds.has(c.campaign_id))
          .map(c => ({
            ad_id: c.campaign_id, ad_name: c.campaign_name, campaign_id: c.campaign_id,
            campaign_name: c.campaign_name, spend: c.spend, impressions: c.impressions,
            reach: c.reach, clicks: c.clicks, ctr: c.ctr, cpm: c.cpm, frequency: c.frequency,
            actions: c.actions, thumbnail: thumbMap[c.campaign_id]?.thumbnail || '',
            permalink: thumbMap[c.campaign_id]?.permalink || '', adNameFull: c.campaign_name,
          }))
      }
      setAdsEngajamento(engFormatados)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [config, periodo, contaIdx])

  useEffect(() => { fetchData() }, [fetchData])

  const metaLeads = overview?.actions?.find(a => a.action_type === 'lead')?.value
  const mensagensAds = overview?.actions?.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value

  const LABEL_OBJETIVO = {
    OUTCOME_AWARENESS: 'Reconhecimento', OUTCOME_TRAFFIC: 'Tráfego', OUTCOME_ENGAGEMENT: 'Engajamento',
    OUTCOME_LEADS: 'Leads', OUTCOME_APP_PROMOTION: 'Aplicativo', OUTCOME_SALES: 'Vendas',
    REACH: 'Alcance', BRAND_AWARENESS: 'Reconhecimento', VIDEO_VIEWS: 'Visualizações',
    CONVERSIONS: 'Conversões', LEAD_GENERATION: 'Geração de leads', MESSAGES: 'Mensagens',
    POST_ENGAGEMENT: 'Engajamento', LINK_CLICKS: 'Cliques no link',
  }
  const tiposDisponiveis = [...new Set(campanhas.map(c => c.objetivo).filter(Boolean))]
  const campanhasFiltradas = filtroTipo ? campanhas.filter(c => c.objetivo === filtroTipo) : campanhas

  if (!config) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Análises Instagram</h1>
            <p className="text-sm text-gray-400">Meta Ads · Performance dos anúncios</p>
          </div>
        </div>

        <PainelOrganico leads={leads} mes={mesPainel} ano={anoPainel} navMes={navMes} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} />
        <CriativosSection mes={mesPainel} ano={anoPainel} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} boostedPermalinks={boostedPermalinks} />
        <LeadsMidia leads={leads} periodo={periodo} />
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

        {showConfig && <ConfigModal onSave={saveConfig} initialToken={config?.token} initialAccounts={config?.accounts} />}
        {showIGSetup && <IGSetupModal onSave={salvarIGConfig} onClose={() => setShowIGSetup(false)} initial={igConfig} />}
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Análises Instagram</h1>
            <p className="text-sm text-gray-400">Meta Ads · {config.accounts?.[contaIdx]?.label || `act_${config.accountId}`}</p>
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

      {/* Seletor de contas */}
      {config.accounts?.length > 1 && (
        <div className="flex gap-2 mb-5">
          {config.accounts.map((acc, i) => (
            <button
              key={i}
              onClick={() => { setContaIdx(i); setOverview(null); setCampanhas([]) }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${contaIdx === i ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700'}`}
              style={contaIdx === i ? { background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' } : {}}
            >
              {acc.label}
            </button>
          ))}
        </div>
      )}

      {/* Painel orgânico — sempre visível */}
      <PainelOrganico leads={leads} mes={mesPainel} ano={anoPainel} navMes={navMes} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} />
      <CriativosSection mes={mesPainel} ano={anoPainel} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} boostedPermalinks={boostedPermalinks} />

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
          <MetricCard label="Gasto total" value={fmt(overview.spend, 'R$ ')} sub="valor investido em anúncios" />
          <MetricCard label="Impressões" value={fmtInt(overview.impressions)} sub="vezes que o anúncio foi exibido" />
          <MetricCard label="Alcance" value={fmtInt(overview.reach)} sub="pessoas únicas que viram" />
          <MetricCard label="Cliques" value={fmtInt(overview.clicks)} sub="cliques no anúncio" />
          <MetricCard label="CTR" value={fmtPct(overview.ctr)} sub="% de quem viu e clicou" info="Click-Through Rate: de cada 100 pessoas que viram o anúncio, quantas clicaram. Acima de 1% é considerado bom." />
          <MetricCard label="CPM" value={fmt(overview.cpm, 'R$ ')} sub="custo para 1.000 exibições" info="Custo por Mil impressões: quanto você paga para o anúncio ser exibido 1.000 vezes. Quanto menor, mais barato está alcançando pessoas." />
          <MetricCard label="Custo por resultado" value={fmt(overview.cpp, 'R$ ')} sub="quanto custa cada ação gerada" />
          {metaLeads && <MetricCard label="Leads (Meta)" value={fmtInt(metaLeads)} sub="formulários preenchidos" />}
          {mensagensAds && <MetricCard label="Conversas iniciadas" value={fmtInt(mensagensAds)} sub="pessoas enviadas ao WhatsApp" />}
        </div>
      )}

      {/* Tabela campanhas */}
      {campanhas.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-700">Campanhas</h2>
            {tiposDisponiveis.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setFiltroTipo('')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filtroTipo ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  style={!filtroTipo ? { background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' } : {}}
                >
                  Todos
                </button>
                {tiposDisponiveis.map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroTipo === tipo ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    style={filtroTipo === tipo ? { background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' } : {}}
                  >
                    {LABEL_OBJETIVO[tipo] || tipo}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100">
                  <th className="px-5 py-3 text-left">Campanha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <ThInfo label="Gasto" info="Total investido nesta campanha no período selecionado." align="right" />
                  <ThInfo label="Impressões" info="Quantas vezes o anúncio foi exibido. Uma mesma pessoa pode ver mais de uma vez — por isso impressões é sempre maior que alcance." align="right" />
                  <ThInfo label="Alcance" info="Quantidade de pessoas únicas que viram o anúncio pelo menos uma vez no período." align="right" />
                  <ThInfo label="Cliques" info="Total de cliques no anúncio, incluindo cliques no link, no perfil ou no botão de ação." align="right" />
                  <ThInfo label="CTR" info="Click-Through Rate: de cada 100 pessoas que viram o anúncio, quantas clicaram. Acima de 1% é considerado bom." align="right" />
                  <ThInfo label="CPM" info="Custo por Mil impressões: quanto você paga para o anúncio aparecer 1.000 vezes. Quanto menor, mais barato está alcançando pessoas." align="right" />
                  <ThInfo label="Conv. WA" info="Pessoas que clicaram neste anúncio e abriram uma conversa no WhatsApp da clínica nos últimos 7 dias." align="right" />
                  <ThInfo label="Freq." info="Frequência: quantas vezes em média a mesma pessoa viu este anúncio. Acima de 3-4 vezes o público está saturado — hora de trocar o criativo." align="right" />
                </tr>
              </thead>
              <tbody>
                {campanhasFiltradas.map((c, i) => {
                  const convWA = c.actions?.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value
                  return (
                  <tr key={c.campaign_id || i} className="border-b border-gray-50 hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {c.thumbnail
                          ? (c.permalink
                              ? <a href={c.permalink} target="_blank" rel="noreferrer"><img src={c.thumbnail} className="w-9 h-9 rounded-lg object-cover shrink-0 hover:opacity-75 transition-opacity" title="Ver no Instagram" /></a>
                              : <img src={c.thumbnail} className="w-9 h-9 rounded-lg object-cover shrink-0" />)
                          : <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-base">🖼</div>
                        }
                        <div>
                          <span className="font-medium text-gray-800 truncate max-w-[160px] block cursor-default" title={c.campaign_name}>{c.campaign_name}</span>
                          {c.inicio && <span className="text-[11px] text-gray-400">{new Date(c.inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.objetivo ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{LABEL_OBJETIVO[c.objetivo] || c.objetivo}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(c.spend, 'R$ ')}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtInt(c.impressions)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtInt(c.reach)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtInt(c.clicks)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtPct(c.ctr)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(c.cpm, 'R$ ')}</td>
                    <td className="px-4 py-3 text-right">
                      {convWA ? <span className="font-semibold text-green-600">{fmtInt(convWA)}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.frequency ? (
                        <span className={`font-medium ${parseFloat(c.frequency) >= 4 ? 'text-red-500' : parseFloat(c.frequency) >= 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                          {parseFloat(c.frequency).toFixed(1)}x
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-5 py-3 text-xs font-bold text-gray-600" colSpan={2}>TOTAL ({campanhasFiltradas.length} campanhas)</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                    {fmt(campanhasFiltradas.reduce((s, c) => s + parseFloat(c.spend || 0), 0).toString(), 'R$ ')}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                    {fmtInt(campanhasFiltradas.reduce((s, c) => s + parseInt(c.impressions || 0), 0).toString())}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                    {fmtInt(campanhasFiltradas.reduce((s, c) => s + parseInt(c.reach || 0), 0).toString())}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                    {fmtInt(campanhasFiltradas.reduce((s, c) => s + parseInt(c.clicks || 0), 0).toString())}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">—</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">—</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                    {(() => { const t = campanhasFiltradas.reduce((s, c) => s + parseInt(c.actions?.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value || 0), 0); return t > 0 ? fmtInt(t.toString()) : <span className="text-gray-400">—</span> })()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Criativos de Engajamento — nível de anúncio (fallback: nível de campanha) */}
      {(() => {
        const rows = adsEngajamento.length > 0
          ? adsEngajamento
          : campanhas
              .filter(c => ['OUTCOME_ENGAGEMENT', 'POST_ENGAGEMENT'].includes(c.objetivo))
              .map(c => ({
                ad_id: c.campaign_id, ad_name: c.campaign_name, campaign_id: c.campaign_id,
                campaign_name: c.campaign_name, spend: c.spend, impressions: c.impressions,
                reach: c.reach, clicks: c.clicks, ctr: c.ctr, cpm: c.cpm, frequency: c.frequency,
                actions: c.actions, thumbnail: c.thumbnail, permalink: c.permalink,
                adNameFull: c.campaign_name,
              }))
        if (rows.length === 0) return null
        return (
          <div className="mt-4 bg-white rounded-2xl border border-brand-100/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-base">❤️</span>
              <h2 className="text-sm font-bold text-gray-700">Criativos — Engajamento</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-600">{rows.length} criativo{rows.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-3 text-left">Criativo</th>
                    <th className="px-4 py-3 text-left">Campanha</th>
                    <th className="px-4 py-3 text-right">Gasto</th>
                    <th className="px-4 py-3 text-right">Impressões</th>
                    <th className="px-4 py-3 text-right">Alcance</th>
                    <th className="px-4 py-3 text-right">Engajamentos</th>
                    <th className="px-4 py-3 text-right">CPE</th>
                    <th className="px-4 py-3 text-right">Freq.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a, i) => {
                    const engVal = parseInt(a.actions?.find(x => x.action_type === 'post_engagement')?.value || 0)
                    const cpe = engVal > 0 ? parseFloat(a.spend || 0) / engVal : null
                    const nome = a.adNameFull || a.ad_name || `Anúncio ${i + 1}`
                    return (
                      <tr key={a.ad_id || i} className="border-b border-gray-50 hover:bg-brand-50/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            {a.thumbnail
                              ? (a.permalink
                                  ? <a href={a.permalink} target="_blank" rel="noreferrer"><img src={a.thumbnail} className="w-9 h-9 rounded-lg object-cover shrink-0 hover:opacity-75 transition-opacity" title="Ver no Instagram" /></a>
                                  : <img src={a.thumbnail} className="w-9 h-9 rounded-lg object-cover shrink-0" />)
                              : <div className="w-9 h-9 rounded-lg bg-pink-50 shrink-0 flex items-center justify-center text-base">❤️</div>
                            }
                            <span className="font-medium text-gray-800 truncate max-w-[200px] block" title={nome}>{nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 truncate max-w-[160px] block" title={a.campaign_name}>{a.campaign_name}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(a.spend, 'R$ ')}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{fmtInt(a.impressions)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{fmtInt(a.reach)}</td>
                        <td className="px-4 py-3 text-right">
                          {engVal > 0 ? <span className="font-semibold text-pink-600">{fmtInt(engVal.toString())}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {cpe !== null ? fmt(cpe.toFixed(2), 'R$ ') : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.frequency
                            ? <span className={`font-medium ${parseFloat(a.frequency) >= 4 ? 'text-red-500' : parseFloat(a.frequency) >= 3 ? 'text-yellow-500' : 'text-gray-500'}`}>{parseFloat(a.frequency).toFixed(1)}x</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="px-5 py-3 text-xs font-bold text-gray-600" colSpan={2}>TOTAL ({rows.length} criativo{rows.length !== 1 ? 's' : ''})</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{fmt(rows.reduce((s, a) => s + parseFloat(a.spend || 0), 0).toFixed(2), 'R$ ')}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{fmtInt(rows.reduce((s, a) => s + parseInt(a.impressions || 0), 0).toString())}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{fmtInt(rows.reduce((s, a) => s + parseInt(a.reach || 0), 0).toString())}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-pink-600">
                      {(() => { const t = rows.reduce((s, a) => s + parseInt(a.actions?.find(x => x.action_type === 'post_engagement')?.value || 0), 0); return t > 0 ? fmtInt(t.toString()) : <span className="text-gray-400">—</span> })()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs" colSpan={2}>—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      })()}

      {/* Estado vazio após carregar */}
      {!loading && !error && overview === null && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhum dado encontrado para o período selecionado.
        </div>
      )}

      {/* Mensagens de boas-vindas CTWA por campanha */}
      <div className="mt-4 bg-white rounded-2xl border border-brand-100/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <h3 className="text-sm font-bold text-gray-700">Mensagem de saudação por campanha (CTWA)</h3>
          </div>
          <div className="flex gap-2">
            {ctwaCarregado && (
              <button onClick={salvarMensagensCtwa} disabled={salvandoCtwa}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white transition-colors">
                {salvandoCtwa ? 'Salvando...' : '💾 Salvar'}
              </button>
            )}
            <button onClick={buscarCampanhasCtwa} disabled={loadingCtwa}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #ee2a7b, #6228d7)' }}>
              {loadingCtwa ? 'Buscando...' : ctwaCarregado ? '🔄 Atualizar lista' : 'Buscar campanhas'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          O Meta não expõe a "Mensagem de saudação automática" 🟢 via API. Cole aqui o texto de cada campanha
          (veja no Ads Manager → campanha → editar → Mensagem de saudação). O sistema usará esses textos para
          identificar automaticamente de qual campanha cada lead veio no inbox.
        </p>

        {ctwaCarregado && (
          ctwaCampanhas.length === 0
            ? <p className="text-xs text-gray-400 text-center py-4">Nenhuma campanha encontrada.</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 text-gray-500 font-medium">Conta</th>
                      <th className="px-3 py-2 text-gray-500 font-medium">Campanha</th>
                      <th className="px-3 py-2 text-gray-500 font-medium">Status</th>
                      <th className="px-3 py-2 text-gray-500 font-medium w-80">Mensagem de saudação (cole o texto exato do Ads Manager)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ctwaCampanhas.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 whitespace-nowrap">{item.conta}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-700 font-medium max-w-[220px]">
                          <span title={item.nome} className="line-clamp-2">{item.nome}</span>
                        </td>
                        <td className="px-3 py-2">
                          {item.status === 'ACTIVE'
                            ? <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 whitespace-nowrap">Ativa</span>
                            : <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500 whitespace-nowrap">{item.status === 'PAUSED' ? 'Pausada' : item.status}</span>
                          }
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.mensagem}
                            onChange={e => atualizarMensagemCtwa(item.id, e.target.value)}
                            placeholder="Ex: Olá! Quero agendar com a Dra Amanda..."
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-400 bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}
      </div>

      {/* Glossário de termos */}
      <div className="mt-6 bg-white rounded-2xl border border-brand-100/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">💡</span>
          <h3 className="text-sm font-bold text-gray-700">Glossário de termos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { termo: 'CTR', def: 'Click-Through Rate — % de pessoas que viram o anúncio e clicaram. Acima de 1% é bom para clínicas.' },
            { termo: 'CPM', def: 'Custo por Mil impressões — quanto você paga para o anúncio aparecer 1.000 vezes. Quanto menor, mais barato.' },
            { termo: 'Alcance', def: 'Quantidade de pessoas únicas que viram o anúncio pelo menos uma vez.' },
            { termo: 'Impressões', def: 'Total de vezes que o anúncio foi exibido. Uma mesma pessoa pode ver várias vezes.' },
            { termo: 'Custo por resultado', def: 'Quanto custou em média cada ação gerada (clique, conversa, lead) pela campanha.' },
            { termo: 'Conv. WA', def: 'Conversas iniciadas no WhatsApp — pessoas que clicaram no anúncio e abriram o WhatsApp da clínica.' },
            { termo: 'Engajamento', def: 'Tipo de campanha para gerar curtidas, comentários e compartilhamentos. Aumenta visibilidade do perfil.' },
            { termo: 'Cliques no link', def: 'Tipo de campanha de tráfego para levar pessoas a um link — site, WhatsApp ou outra página.' },
            { termo: 'Tráfego', def: 'Similar a cliques no link, mas otimizado para visitas à página de destino.' },
            { termo: 'Conversas iniciadas', def: 'Anúncios com botão "Enviar mensagem" que direcionam diretamente para o WhatsApp da clínica.' },
          ].map(({ termo, def }) => (
            <div key={termo} className="flex gap-2.5 p-3 rounded-xl bg-gray-50">
              <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-lg shrink-0 h-fit">{termo}</span>
              <p className="text-xs text-gray-500 leading-relaxed">{def}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Raciocínio prático */}
      <div className="mt-4 bg-white rounded-2xl border border-brand-100/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🧠</span>
          <h3 className="text-sm font-bold text-gray-700">Como identificar o problema</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { sinal: 'CTR baixo (abaixo de 1%)', problema: 'O criativo não está chamando atenção — troque a imagem ou o texto do anúncio.', cor: 'text-red-600 bg-red-50' },
            { sinal: 'CTR bom mas poucos resultados', problema: 'As pessoas clicam mas não mandam mensagem — reveja a oferta ou o atendimento.', cor: 'text-orange-600 bg-orange-50' },
            { sinal: 'CPM alto', problema: 'Muita concorrência no período (datas comemorativas). Normal subir em maio, junho, dezembro.', cor: 'text-yellow-600 bg-yellow-50' },
            { sinal: 'Conv. WA alto + poucos agendamentos', problema: 'O problema está na captação — o atendimento no WhatsApp precisa melhorar.', cor: 'text-blue-600 bg-blue-50' },
            { sinal: 'Frequência acima de 3-4x', problema: 'O público está saturado — já viram o mesmo anúncio muitas vezes. Troque o criativo.', cor: 'text-purple-600 bg-purple-50' },
            { sinal: 'Alcance caindo sem motivo', problema: 'O orçamento pode estar baixo ou o público muito restrito. Amplie o público-alvo.', cor: 'text-gray-600 bg-gray-50' },
          ].map(({ sinal, problema, cor }) => (
            <div key={sinal} className="p-3 rounded-xl bg-gray-50 flex gap-3">
              <div className="shrink-0">
                <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${cor}`}>{sinal}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{problema}</p>
            </div>
          ))}
        </div>
      </div>

      {showConfig && (
        <ConfigModal
          onSave={saveConfig}
          initialToken={config.token}
          initialAccounts={config.accounts}
        />
      )}

      {showIGSetup && (
        <IGSetupModal
          onSave={salvarIGConfig}
          onClose={() => setShowIGSetup(false)}
          initial={igConfig}
        />
      )}
    </div>
  )
}
