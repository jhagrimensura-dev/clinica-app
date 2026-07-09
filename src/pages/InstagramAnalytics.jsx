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

const COR_MIDIA = {
  'Orgânico':     { bg: 'bg-purple-100', text: 'text-purple-700', bar: '#6228d7' },
  'Impulsionar':  { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: '#ee2a7b' },
  'Tráfego pago': { bg: 'bg-blue-100',   text: 'text-blue-700',   bar: '#3b82f6' },
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

  const trafegoPago = filtrados.filter(l => l.midia === 'Tráfego pago' && l.criativo)
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
            <p className="text-xs font-semibold text-gray-500 mb-3">Criativos — Tráfego pago</p>
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

  const [insightsJson, profileJson] = await Promise.all([
    igFetch(`/${userId}/insights?metric=reach,views,profile_views,accounts_engaged,follower_count,website_clicks,total_interactions,likes,comments,shares,saves&period=day&since=${since}&until=${until}`, token),
    igFetch(`/${userId}?fields=followers_count,username,name`, token),
  ])

  const totals = {}
  for (const m of (insightsJson.data || [])) {
    totals[m.name] = (m.values || []).reduce((s, v) => s + (typeof v.value === 'number' ? v.value : 0), 0)
  }

  return {
    alcance: totals.reach || 0,
    impressoes: totals.views || 0,
    novos_seguidores: totals.follower_count || 0,
    total_seguidores: profileJson.followers_count || 0,
    curtidas: totals.likes || totals.accounts_engaged || 0,
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
    `/${userId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&since=${since}&until=${until}&limit=50`,
    token
  )

  const posts = []
  for (const media of (mediaJson.data || [])) {
    let insights = {}
    try {
      const insJson = await igFetch(`/${media.id}/insights?metric=reach,views,saves,shares`, token)
      for (const m of (insJson.data || [])) insights[m.name] = m.values?.[0]?.value ?? m.value ?? 0
    } catch {}

    const tipo = media.media_type === 'VIDEO' ? 'Reel' : media.media_type === 'CAROUSEL_ALBUM' ? 'Carrossel' : 'Post estático'
    const data = new Date(media.timestamp)
    posts.push({
      nome: (media.caption || '').replace(/\n/g, ' ').slice(0, 60) || `${tipo} ${data.toLocaleDateString('pt-BR')}`,
      formato: tipo,
      pago: false,
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
        cliques_bio: resultado.cliques_bio || atual.cliques_bio,
        mensagens: resultado.mensagens || atual.mensagens,
        cliques_whatsapp: resultado.cliques_whatsapp || atual.cliques_whatsapp,
      }
      saveOrganico(ano, mes, merged)
      setDados(merged)
      alert(`✅ Dados sincronizados de @${igConfig.username}!\n\nAlcance: ${resultado.alcance?.toLocaleString('pt-BR')}\nImpressões: ${resultado.impressoes?.toLocaleString('pt-BR')}\nNovos seguidores: ${resultado.novos_seguidores?.toLocaleString('pt-BR')}`)
    } catch (e) {
      alert('Erro ao sincronizar: ' + e.message)
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
    { title: 'Cliques & Conversão', color: 'text-green-600', cols: 5, cards: [
      { label: 'Cliques no link bio', value: fmtN(num('cliques_bio')), icon: '🔗' },
      { label: 'Mensagens (DM)', value: fmtN(num('mensagens')), icon: '✉️' },
      { label: 'Cliques WhatsApp', value: fmtN(num('cliques_whatsapp')), icon: '📲' },
      { label: 'Leads recebidos', value: fmtN(totalLeads), icon: '🎯' },
      { label: 'Custo por lead', value: fmtR(custoPorLead), icon: '💰' },
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
            <button onClick={sincronizar} disabled={sincronizando} className="ml-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors">
              {sincronizando ? 'Sincronizando...' : '🔄 Sincronizar'}
            </button>
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

const CRIATIVO_VAZIO = { nome: '', formato: 'Reel', pago: false, alcance: '', impressoes: '', curtidas: '', comentarios: '', salvamentos: '', compartilhamentos: '' }

function CriativosSection({ mes, ano, igConfig, onOpenSetup }) {
  const [criativos, setCriativos] = useState(() => loadCriativos(ano, mes))
  const [modalAberto, setModalAberto] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [form, setForm] = useState(CRIATIVO_VAZIO)
  const [importando, setImportando] = useState(false)

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
    try {
      const posts = await fetchIGPosts(igConfig.userId, igConfig.token, ano, mes)
      if (posts.length === 0) { alert('Nenhum post encontrado neste mês.'); setImportando(false); return }
      const existentesIds = new Set(criativos.map(c => c.ig_id).filter(Boolean))
      const novos = posts.filter(p => !existentesIds.has(p.ig_id))
      const merged = [...criativos, ...novos]
      save(merged)
      alert(`✅ ${novos.length} post(s) importado(s)!${novos.length < posts.length ? `\n${posts.length - novos.length} já existiam.` : ''}`)
    } catch (e) {
      alert('Erro ao importar posts: ' + e.message)
    }
    setImportando(false)
  }

  const eng = (c) => c.curtidas + c.comentarios + c.salvamentos + c.compartilhamentos
  const taxaEng = (c) => c.alcance > 0 ? ((eng(c) / c.alcance) * 100) : 0

  const sorted = [...criativos].sort((a, b) => taxaEng(b) - taxaEng(a))

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
                  <th className="px-4 py-3 text-left">Formato</th>
                  <th className="px-4 py-3 text-right">Alcance</th>
                  <th className="px-4 py-3 text-right">Curtidas</th>
                  <th className="px-4 py-3 text-right">Salv.</th>
                  <th className="px-4 py-3 text-right">Comp.</th>
                  <th className="px-4 py-3 text-right">Engajamento</th>
                  <th className="px-4 py-3 text-right">Taxa eng.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={i} className={`border-b border-gray-50 hover:bg-brand-50/30 transition-colors ${i === 0 ? 'bg-yellow-50/40' : ''}`}>
                    <td className="px-4 py-3 text-base">{medalha(i) || <span className="text-xs text-gray-400">{i + 1}</span>}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 max-w-[180px] truncate">{c.nome}</p>
                      {c.pago && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">pago</span>}
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
                    <span className="text-sm text-gray-700 font-medium">Conteúdo pago / impulsionado</span>
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
  const [showConfig, setShowConfig] = useState(false)
  const [periodo, setPeriodo] = useState('last_30d')
  const [overview, setOverview] = useState(null)
  const [campanhas, setCampanhas] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveConfig = (token, accountId) => {
    const c = { token, accountId }
    localStorage.setItem('instagram_ads_config', JSON.stringify(c))
    supabase.from('configuracoes').upsert({ chave: 'instagram_ads_config', valor: c }, { onConflict: 'chave' })
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

      const [overviewRes, campaignsRes, campInfoRes] = await Promise.all([
        fetch(`${base}/insights?fields=${fields}&date_preset=${periodo}&access_token=${token}`),
        fetch(`${base}/insights?fields=campaign_name,campaign_id,spend,impressions,reach,clicks,ctr,cpm,cpp&level=campaign&date_preset=${periodo}&access_token=${token}`),
        fetch(`${base}/campaigns?fields=id,name,objective&access_token=${token}&limit=200`),
      ])

      const overviewJson = await overviewRes.json()
      const campaignsJson = await campaignsRes.json()
      const campInfoJson = await campInfoRes.json()

      if (overviewJson.error) throw new Error(overviewJson.error.message)
      if (campaignsJson.error) throw new Error(campaignsJson.error.message)

      const objMap = {}
      ;(campInfoJson.data || []).forEach(c => { objMap[c.id] = c.objective })

      setOverview(overviewJson.data?.[0] || null)
      setCampanhas((campaignsJson.data || []).map(c => ({ ...c, objetivo: objMap[c.campaign_id] || '' })))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [config, periodo])

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

        <PainelOrganico leads={leads} mes={mesPainel} ano={anoPainel} navMes={navMes} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} />
        <CriativosSection mes={mesPainel} ano={anoPainel} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} />
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

        {showConfig && <ConfigModal onSave={saveConfig} />}
        {showIGSetup && <IGSetupModal onSave={salvarIGConfig} onClose={() => setShowIGSetup(false)} initial={igConfig} />}
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
      <PainelOrganico leads={leads} mes={mesPainel} ano={anoPainel} navMes={navMes} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} />
      <CriativosSection mes={mesPainel} ano={anoPainel} igConfig={igConfig} onOpenSetup={() => setShowIGSetup(true)} />

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
          {!metaLeads && mensagensAds && <MetricCard label="Conversas iniciadas" value={fmtInt(mensagensAds)} />}
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
                  <th className="px-4 py-3 text-right">Gasto</th>
                  <th className="px-4 py-3 text-right">Impressões</th>
                  <th className="px-4 py-3 text-right">Alcance</th>
                  <th className="px-4 py-3 text-right">Cliques</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">CPM</th>
                </tr>
              </thead>
              <tbody>
                {campanhasFiltradas.map((c, i) => (
                  <tr key={c.campaign_id || i} className="border-b border-gray-50 hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800 max-w-[200px] truncate">{c.campaign_name}</td>
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
