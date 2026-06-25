import { useState, useRef, useEffect, useCallback } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useConfig } from '../context/ConfigContext'
import { useAgenda } from '../context/AgendaContext'
import { supabase } from '../lib/supabase'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

// ── Proxy helper (evita CORS) ─────────────────────────────────────
async function zapiFetch(conta, path, method = 'GET', body = null) {
  const encodedPath = encodeURIComponent(path)
  const ctParam = conta.clientToken ? `&ct=${encodeURIComponent(conta.clientToken)}` : ''
  const res = await fetch(
    `/api/zapi-proxy?i=${conta.instanciaId}&t=${conta.instanciaToken}&path=${encodedPath}${ctParam}`,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }
  )
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 100)}`)
  }
  return res.json()
}

function formatTs(ms) {
  if (!ms) return ''
  const d = new Date(Number(ms))
  if (isNaN(d)) return ''
  const diffDays = Math.floor((Date.now() - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getDayLabel(tsMs) {
  if (!tsMs) return ''
  const d = new Date(Number(tsMs))
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function normalizeChats(data, instancia) {
  const lista = Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : []
  if (!lista.length) return []
  // eslint-disable-next-line no-param-reassign
  data = lista
  return lista
    .filter(c => c.phone && !c.isGroupAnnouncement)
    .map(c => {
      const cleanPhone = (c.phone || '').replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '').replace(/@lid$/, '')
      const thumb = c.profileThumbnail || c.profilePicUrl || c.photo || null
      const foto = !thumb ? null
        : thumb.startsWith('http') ? thumb
        : thumb.startsWith('data:') ? thumb
        : `data:image/jpeg;base64,${thumb}`
      return {
      id: cleanPhone,
      instancia,
      contato: { nome: c.name || cleanPhone, telefone: cleanPhone, foto },
      naoLidas: parseInt(c.unread || c.messagesUnread || '0', 10),
      horario: formatTs(c.lastMessageTime),
      tsRaw: Number(c.lastMessageTime) || 0,
      ultimaMensagem: c.lastMessage?.body || c.lastMessage?.text?.message || c.lastMessage?.caption || '',
      ultimaDeMim: c.lastMessage?.fromMe || false,
      mensagens: [],
    }})
    .sort((a, b) => {
      const aUnread = a.naoLidas > 0 ? 1 : 0
      const bUnread = b.naoLidas > 0 ? 1 : 0
      if (bUnread !== aUnread) return bUnread - aUnread
      return b.tsRaw - a.tsRaw
    })
}

// ── Modal registrar lead ──────────────────────────────────────────
const ORIGENS_PADRAO = ['WhatsApp', 'Instagram Anúncio', 'Instagram Orgânico', 'Tráfego', 'Indicação', 'Retorno', 'Resgate']
const STATUS_PADRAO = ['Em aberto', 'Conversando', 'Follow #1', 'Follow #2', 'Follow #3', 'Agendou', 'Perdido']

const STATUS_DENORMALIZE = { 'em_aberto': 'Em aberto', 'conversando': 'Conversando', 'follow1': 'Follow #1', 'follow2': 'Follow #2', 'follow3': 'Follow #3', 'agendado': 'Agendou', 'perdido': 'Perdido' }

function ModalRegistrarLead({ contato, tipo, onSalvar, onFechar, leadInicial, lembretesDaAgenda = [], onDeletarLembrete }) {
  const { leadOrigens, setLeadOrigens, leadStatus, setLeadStatus } = useConfig()
  const hoje = new Date().toISOString().split('T')[0]
  const [nome, setNome] = useState(leadInicial?.nome || contato.nome)
  const [telefone, setTelefone] = useState(leadInicial?.telefone || contato.telefone || '')
  const [responsavel, setResponsavel] = useState(leadInicial?.responsavel || '')
  const [origemCustom, setOrigemCustom] = useState(leadInicial?.origemCustom || 'WhatsApp')
  const [status, setStatus] = useState(STATUS_DENORMALIZE[leadInicial?.status] || leadInicial?.status || 'Em aberto')
  const [data, setData] = useState(leadInicial?.data || hoje)
  const [agendadoPara, setAgendadoPara] = useState(leadInicial?.agendadoPara || '')
  const [lembretes, setLembretes] = useState(() => {
    if (leadInicial?.lembretes?.length) return leadInicial.lembretes.map(l => ({ data: l.data || '', hora: l.hora || '', obs: l.obs || '' }))
    if (leadInicial?.lembrete) return [{ data: leadInicial.lembrete, hora: leadInicial.lembreteHora || '', obs: '' }]
    return [{ data: '', hora: '', obs: '' }]
  })
  const [aniversario, setAniversario] = useState(leadInicial?.aniversario || '')
  const [obs, setObs] = useState(leadInicial?.obs || '')
  const [origens, setOrigens] = useState(leadOrigens || ORIGENS_PADRAO)
  const [editandoOrigens, setEditandoOrigens] = useState(false)
  const [novaOrigem, setNovaOrigem] = useState('')
  const [statusLista, setStatusLista] = useState(leadStatus || STATUS_PADRAO)
  const [editandoStatus, setEditandoStatus] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')

  useEffect(() => { if (leadOrigens) setOrigens(leadOrigens) }, [leadOrigens])
  useEffect(() => { if (leadStatus) setStatusLista(leadStatus) }, [leadStatus])

  function adicionarOrigem() {
    const v = novaOrigem.trim()
    if (!v || origens.includes(v)) return
    const nova = [...origens, v]
    setOrigens(nova); setLeadOrigens(nova); setNovaOrigem('')
  }
  function removerOrigem(o) {
    const nova = origens.filter(x => x !== o)
    setOrigens(nova); setLeadOrigens(nova)
    if (origemCustom === o) setOrigemCustom(nova[0] || '')
  }
  function adicionarStatus() {
    const v = novoStatus.trim()
    if (!v || statusLista.includes(v)) return
    const nova = [...statusLista, v]
    setStatusLista(nova); setLeadStatus(nova); setNovoStatus('')
  }
  function removerStatus(s) {
    const nova = statusLista.filter(x => x !== s)
    setStatusLista(nova); setLeadStatus(nova)
    if (status === s) setStatus(nova[0] || '')
  }

  const ORIGENS = {
    leads_novos:       { label: 'Lead Novo',       cor: 'bg-brand-500' },
    leads_recorrentes: { label: 'Lead Recorrente',  cor: 'bg-blue-500' },
    indicacao:         { label: 'Indicação',        cor: 'bg-purple-500' },
  }
  const origem = ORIGENS[tipo]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Registrar Lead</h3>
            <span className={`text-xs text-white font-semibold px-2 py-0.5 rounded-full ${origem.cor}`}>{origem.label}</span>
          </div>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white">
              <option value="">Selecione</option>
              <option>Dra. Amanda</option>
              <option>Fernanda</option>
              <option>Recepção</option>
              <option>Equipe</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefone</label>
          <input value={telefone} onChange={e => setTelefone(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500">Origem</label>
              <button onClick={() => setEditandoOrigens(v => !v)}
                className="text-[10px] text-brand-500 hover:text-brand-700 font-semibold">
                {editandoOrigens ? 'Fechar' : '✎ Editar lista'}
              </button>
            </div>
            {editandoOrigens ? (
              <div className="border border-gray-200 rounded-xl p-3 space-y-1.5 bg-gray-50">
                {origens.map((o, i) => (
                  <div key={o} className="flex items-center gap-1">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => { if (i === 0) return; const n = [...origens]; [n[i-1],n[i]]=[n[i],n[i-1]]; setOrigens(n); setLeadOrigens(n) }}
                        disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[10px]">▲</button>
                      <button onClick={() => { if (i === origens.length-1) return; const n = [...origens]; [n[i],n[i+1]]=[n[i+1],n[i]]; setOrigens(n); setLeadOrigens(n) }}
                        disabled={i === origens.length-1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[10px]">▼</button>
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{o}</span>
                    <button onClick={() => removerOrigem(o)}
                      className="text-gray-300 hover:text-red-400 text-xs font-bold flex-shrink-0">✕</button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1 border-t border-gray-200">
                  <input value={novaOrigem} onChange={e => setNovaOrigem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adicionarOrigem()}
                    placeholder="Nova origem..."
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-brand-300 bg-white" />
                  <button onClick={adicionarOrigem}
                    className="text-xs bg-brand-400 hover:bg-brand-500 text-white px-3 py-1 rounded-lg font-semibold">+ Add</button>
                </div>
              </div>
            ) : (
              <select value={origemCustom} onChange={e => setOrigemCustom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white">
                {origens.map(o => <option key={o}>{o}</option>)}
              </select>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500">Status</label>
              <button onClick={() => setEditandoStatus(v => !v)}
                className="text-[10px] text-brand-500 hover:text-brand-700 font-semibold">
                {editandoStatus ? 'Fechar' : '✎ Editar lista'}
              </button>
            </div>
            {editandoStatus ? (
              <div className="border border-gray-200 rounded-xl p-3 space-y-1.5 bg-gray-50">
                {statusLista.map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => { if (i === 0) return; const n = [...statusLista]; [n[i-1],n[i]]=[n[i],n[i-1]]; setStatusLista(n); setLeadStatus(n) }}
                        disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[10px]">▲</button>
                      <button onClick={() => { if (i === statusLista.length-1) return; const n = [...statusLista]; [n[i],n[i+1]]=[n[i+1],n[i]]; setStatusLista(n); setLeadStatus(n) }}
                        disabled={i === statusLista.length-1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[10px]">▼</button>
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{s}</span>
                    <button onClick={() => removerStatus(s)}
                      className="text-gray-300 hover:text-red-400 text-xs font-bold flex-shrink-0">✕</button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1 border-t border-gray-200">
                  <input value={novoStatus} onChange={e => setNovoStatus(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adicionarStatus()}
                    placeholder="Novo status..."
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-brand-300 bg-white" />
                  <button onClick={adicionarStatus}
                    className="text-xs bg-brand-400 hover:bg-brand-500 text-white px-3 py-1 rounded-lg font-semibold">+ Add</button>
                </div>
              </div>
            ) : (
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white">
                {statusLista.map(s => <option key={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>

        {status === 'Agendou' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <label className="text-xs font-semibold text-blue-700 mb-1 block">📅 Agendado para *</label>
            <input type="date" value={agendadoPara} onChange={e => setAgendadoPara(e.target.value)}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
          </div>
        )}

        {leadInicial && (() => {
          const telLead = (leadInicial.telefone || '').replace(/\D/g, '')
          const existentes = lembretesDaAgenda.filter(l => {
            if (l.concluido) return false
            const telLemb = (l.leadTelefone || '').replace(/\D/g, '')
            return telLead.length > 5 && telLemb.length > 5 && (telLemb.endsWith(telLead.slice(-8)) || telLead.endsWith(telLemb.slice(-8)))
          })
          if (existentes.length === 0) return null
          return (
            <div className="mb-1">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-amber-500"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Lembretes na agenda ({existentes.length})
              </label>
              <div className="space-y-1.5">
                {existentes.map(l => (
                  <div key={l.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-amber-800">
                        {l.data} {l.hora ? `às ${l.hora}` : ''}
                      </p>
                      {l.descricao && <p className="text-xs text-amber-700 truncate">{l.descricao}</p>}
                    </div>
                    {onDeletarLembrete && (
                      <button
                        type="button"
                        onClick={() => onDeletarLembrete(l.id)}
                        className="text-amber-400 hover:text-red-500 flex-shrink-0 transition-colors"
                        title="Apagar lembrete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500">Lembretes</label>
            <button type="button" onClick={() => setLembretes(l => [...l, { data: '', hora: '', obs: '' }])}
              className="text-brand-500 hover:text-brand-700 text-sm font-bold leading-none px-1">+</button>
          </div>
          <div className="space-y-3">
            {lembretes.map((l, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-2.5 space-y-2 bg-gray-50">
                <div className="flex gap-2 items-center">
                  <input type="date" value={l.data} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, data: e.target.value } : x))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-300 bg-white" />
                  <input type="time" value={l.hora} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, hora: e.target.value } : x))}
                    className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-300 bg-white" />
                  {lembretes.length > 1 && (
                    <button type="button" onClick={() => setLembretes(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-400 text-xs font-bold flex-shrink-0">✕</button>
                  )}
                </div>
                <input value={l.obs} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, obs: e.target.value } : x))}
                  placeholder="Observação deste lembrete..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-300 bg-white" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">🎂 Aniversário</label>
          <input type="date" value={aniversario} onChange={e => setAniversario(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
          {aniversario && (
            <p className="text-xs text-brand-500 mt-1">Um lembrete será criado automaticamente no dia do aniversário.</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
            placeholder="Ex: Interesse em preenchimento labial"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => nome.trim() && onSalvar({ nome: nome.trim(), telefone, responsavel, obs, origem: tipo, origemCustom, data, status, agendadoPara: agendadoPara || null, lembretes: lembretes.filter(l => l.data), lembrete: lembretes.find(l => l.data)?.data || null, lembreteHora: lembretes.find(l => l.data)?.hora || null, aniversario: aniversario || null, fonte: 'WhatsApp' })}
            disabled={!nome.trim() || (status === 'Agendou' && !agendadoPara)}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            {leadInicial ? 'Salvar alterações' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function loadContas() {
  try { const s = localStorage.getItem('config_whatsapp_contas'); return s ? JSON.parse(s) : [] } catch { return [] }
}

const TIPO_PARA_ORIGEM = {
  'Leads Novos':      'leads_novos',
  'Leads Recorrentes': 'leads_recorrentes',
  'Indicação':        'indicacao',
}

// ── Página principal ──────────────────────────────────────────────
export default function InboxWhatsApp({ contaId }) {
  const { leads, addLead, updateLead } = useLeads()
  const { addLembrete, lembretes: todosLembretesAgenda, deleteLembrete } = useAgenda()
  const { iaConhecimento, setIaConhecimento, iaExemplos, setIaExemplos, respostasRapidas: respostasConfig, setRespostasRapidas: setRespostasConfig } = useConfig()
  const [todasContas, setTodasContas] = useState(loadContas)
  const contaAtiva = contaId
    ? todasContas.find(c => c.id === contaId)
    : todasContas[0] || null

  // Sempre sincroniza do Supabase ao montar (fonte da verdade)
  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', 'config_whatsapp_contas').single()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valor)) {
          setTodasContas(data.valor)
          localStorage.setItem('config_whatsapp_contas', JSON.stringify(data.valor))
        }
      })
  }, [])

  const arquivadasKey = `inbox_arquivadas_${contaAtiva?.id || 'default'}`
  const arquivadasRef = useRef(new Set())
  const getArquivadas = () => arquivadasRef.current

  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', arquivadasKey).single()
      .then(({ data }) => {
        if (data?.valor && Array.isArray(data.valor)) {
          arquivadasRef.current = new Set(data.valor)
        }
      })
  }, [arquivadasKey])

  const [conversas, setConversas]     = useState([])
  const [selecionada, setSelecionada] = useState(null)
  const [mensagem, setMensagem]       = useState('')
  const [busca, setBusca]             = useState('')
  const [filtro, setFiltro]           = useState('todas')
  const [menuLead, setMenuLead]       = useState(false)
  const [modalLead, setModalLead]     = useState(null)
  const [leadRegistrado, setLeadRegistrado] = useState({})
  const [editarLeadRegistrado, setEditarLeadRegistrado] = useState(null)
  const [loadingConversas, setLoadingConversas] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [erro, setErro]               = useState(null)
  const [desconectado, setDesconectado] = useState(false)
  const [qrCode, setQrCode]           = useState(null)
  const [loadingQr, setLoadingQr]     = useState(false)
  const [painelIA, setPainelIA]       = useState(true)
  const [sugestaoIA, setSugestaoIA]   = useState('')
  const [loadingIA, setLoadingIA]     = useState(false)
  const [erroIA, setErroIA]           = useState('')
  const [modalConfigIA, setModalConfigIA] = useState(false)
  const [conhecimentoIA, setConhecimentoIA] = useState('')
  useEffect(() => { if (iaConhecimento !== undefined) setConhecimentoIA(iaConhecimento) }, [iaConhecimento])
  const [menuAnexo, setMenuAnexo]     = useState(false)
  const [modalRespostas, setModalRespostas] = useState(false)
  const [respostasRapidas, setRespostasRapidas] = useState([])
  useEffect(() => { if (Array.isArray(respostasConfig)) setRespostasRapidas(respostasConfig) }, [respostasConfig])
  const [novaResposta, setNovaResposta] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [menuOpcoes, setMenuOpcoes] = useState(null)
  const [menuMsg, setMenuMsg] = useState(null)
  const [editandoMsg, setEditandoMsg] = useState(null)
  const inputFotoRef = useRef(null)
  const inputArquivoRef = useRef(null)
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)
  const jaTemSelecao = useRef(false)
  const msgCountRef = useRef({})
  const notifPermissao = useRef(false)
  const selecionadaRef = useRef(null)
  const emojiContainerRef = useRef(null)
  const pendingMsgs = useRef(new Set())
  const fotosCache = useRef((() => {
    try {
      const raw = JSON.parse(localStorage.getItem('wpp_fotos') || '{}')
      // Remove entradas vazias de tentativas anteriores que falharam
      const limpo = Object.fromEntries(Object.entries(raw).filter(([, v]) => v))
      return limpo
    } catch { return {} }
  })())
  const lastReadRef = useRef((() => { try { return JSON.parse(localStorage.getItem('wpp_last_read') || '{}') } catch { return {} } })())

  useEffect(() => { selecionadaRef.current = selecionada }, [selecionada])

  useEffect(() => {
    if (!showEmoji) return
    const handler = (e) => {
      if (emojiContainerRef.current && !emojiContainerRef.current.contains(e.target)) {
        setShowEmoji(false)
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 150)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [showEmoji])

  // Solicita permissão de notificação ao abrir o inbox
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => { notifPermissao.current = p === 'granted' })
    } else {
      notifPermissao.current = Notification.permission === 'granted'
    }
  }, [])

  useEffect(() => {
    if (!menuOpcoes) return
    const handler = () => setMenuOpcoes(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpcoes])

  useEffect(() => {
    if (!menuMsg) return
    const handler = () => setMenuMsg(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuMsg])

  function notificar(nome, texto) {
    if (!notifPermissao.current || document.visibilityState === 'visible') return
    new Notification(`💬 ${nome}`, { body: texto, icon: '/pwa-192x192.png' })
  }

  // Carrega lista de conversas da Z-API
  const fetchConversas = useCallback(async (inicial = false) => {
    if (!contaAtiva?.instanciaId) return
    if (inicial) setLoadingConversas(true)
    setErro(null)
    try {
      const data = await zapiFetch(contaAtiva, 'chats?page=1&pageSize=50')
      const novaLista = normalizeChats(data, contaAtiva.nome)
      if (novaLista.length === 0 && data && !Array.isArray(data) && !Array.isArray(data?.value)) {
        setErro(`Z-API: ${JSON.stringify(data).slice(0, 120)}`)
      } else {
        setErro(null)
      }
      // Calcula não lidas via Supabase (comparando com última abertura de cada conversa)
      const phones = novaLista.map(c => c.id)
      const minTs = Math.min(...phones.map(p => lastReadRef.current[p] || (Date.now() - 7 * 86400000)))
      const { data: msgData } = await supabase
        .from('whatsapp_mensagens')
        .select('phone, timestamp_ms')
        .eq('de_mim', false)
        .in('phone', phones)
        .gte('timestamp_ms', minTs)

      const naoLidasMap = {}
      for (const m of msgData || []) {
        const lastRead = lastReadRef.current[m.phone] || 0
        if (m.timestamp_ms > lastRead) {
          naoLidasMap[m.phone] = (naoLidasMap[m.phone] || 0) + 1
        }
      }

      setConversas(prev => {
        const arquivadas = getArquivadas()
        return novaLista.map(nova => {
          const existente = prev.find(c => c.id === nova.id)
          const naoLidas = selecionadaRef.current?.id === nova.id
            ? 0
            : naoLidasMap[nova.id] || 0
          const arquivada = arquivadas.has(nova.id) || existente?.arquivada || false
          return existente ? { ...nova, mensagens: existente.mensagens, naoLidas, arquivada } : { ...nova, naoLidas, arquivada }
        })
      })
      const telefoneAbrir = sessionStorage.getItem('inbox_abrir_telefone')
      if (telefoneAbrir) {
        const digits = telefoneAbrir.replace(/\D/g, '')
        const match = novaLista.find(c => {
          const cDigits = c.id.replace(/\D/g, '')
          return cDigits === digits || cDigits.endsWith(digits.slice(-9)) || digits.endsWith(cDigits.slice(-9))
        })
        if (match) {
          setSelecionada(match)
          jaTemSelecao.current = true
          sessionStorage.removeItem('inbox_abrir_telefone')
        }
      }
      if (!jaTemSelecao.current && novaLista.length > 0) {
        setSelecionada(novaLista[0])
        jaTemSelecao.current = true
      }

      // Carrega fotos de perfil em fila (apenas quem não tem)
      novaLista.forEach((conv, i) => {
        if (conv.contato.foto) return
        const cached = fotosCache.current[conv.id]
        if (cached !== undefined) {
          if (cached) setConversas(prev => prev.map(c => c.id === conv.id ? { ...c, contato: { ...c.contato, foto: cached } } : c))
          return
        }
        setTimeout(async () => {
          try {
            const d = await zapiFetch(contaAtiva, `profile-picture?phone=${conv.id}`)
            console.log('[foto]', conv.id, d)
            const raw = d?.link || d?.value || d?.url || d?.profilePicUrl || d?.picture || d?.photo || null
            const url = !raw ? null
              : raw.startsWith('http') ? raw
              : raw.startsWith('data:') ? raw
              : `data:image/jpeg;base64,${raw}`
            if (url) {
              fotosCache.current[conv.id] = url
              localStorage.setItem('wpp_fotos', JSON.stringify(fotosCache.current))
              setConversas(prev => prev.map(c => c.id === conv.id ? { ...c, contato: { ...c.contato, foto: url } } : c))
            }
          } catch (e) { console.log('[foto erro]', conv.id, e.message) }
        }, i * 250)
      })
    } catch (e) {
      if (e.message.includes('connected with whatsapp') || e.message.includes('"connected"')) {
        setDesconectado(true)
        setErro(null)
      } else {
        setErro(`Erro ao carregar conversas: ${e.message}`)
      }
    }
    if (inicial) setLoadingConversas(false)
  }, [contaAtiva?.instanciaId])

  // Normaliza mensagens do Z-API para o formato interno
  function normalizarMsgsZapi(data) {
    const lista = Array.isArray(data) ? data : Array.isArray(data?.messages) ? data.messages : []
    return lista.map(m => {
      const texto = m.text?.message || m.body || m.caption || m.fileName || (m.audio ? '[áudio]' : '[mídia]')
      const mediaUrl = m.image?.imageUrl || m.image?.url || m.video?.videoUrl || m.document?.documentUrl || m.audio?.audioUrl || m.audio?.url || null
      return {
        id: m.messageId || m.id || String(m.momment || m.timestamp),
        minha: m.fromMe ?? false,
        texto,
        tipo: m.type || 'text',
        mediaUrl,
        hora: formatTs((m.momment || m.timestamp || 0) * (String(m.momment || m.timestamp || 0).length < 13 ? 1000 : 1)),
        tsMs: (m.momment || m.timestamp || 0) * (String(m.momment || m.timestamp || 0).length < 13 ? 1000 : 1),
      }
    }).filter(m => m.texto)
  }

  // Carrega mensagens do Supabase
  const fetchMensagens = useCallback(async (phone, chatNome) => {
    if (!contaAtiva?.instanciaId || !phone) return
    setLoadingMsgs(true)
    try {
      // Busca por phone (mensagens recebidas + enviadas pelo app)
      const { data: byPhone } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('phone', phone)
        .order('timestamp_ms', { ascending: true })
        .limit(100)

      // Busca mensagens enviadas pelo celular (@lid) identificadas pelo nome do contato
      let byNome = []
      if (chatNome && chatNome !== phone) {
        const { data: d } = await supabase
          .from('whatsapp_mensagens')
          .select('*')
          .eq('de_mim', true)
          .eq('nome_contato', chatNome)
          .neq('phone', phone)
          .order('timestamp_ms', { ascending: true })
          .limit(50)
        byNome = d || []
      }

      // Mescla e deduplica por message_id
      const seen = new Set()
      const normTs = t => Number(t) < 10000000000 ? Number(t) * 1000 : Number(t)
      const toMap = m => ({
        id: m.message_id || String(m.id),
        minha: m.de_mim,
        texto: m.texto || '',
        tipo: m.tipo || 'text',
        mediaUrl: m.media_url || null,
        hora: formatTs(normTs(m.timestamp_ms)),
        tsMs: normTs(m.timestamp_ms),
      })
      let msgs = [...(byPhone || []), ...byNome]
        .filter(m => { const k = m.message_id || m.id; const ok = !seen.has(k); seen.add(k); return ok })
        .map(toMap)
        .sort((a, b) => a.tsMs - b.tsMs)

      // Dedup mensagens próprias duplicadas (insert do frontend + insert do webhook Z-API)
      const seenOwn = new Map()
      msgs = msgs.filter(m => {
        if (!m.minha) return true
        const prev = seenOwn.get(m.texto)
        if (prev !== undefined && Math.abs(prev - m.tsMs) < 30000) return false
        seenOwn.set(m.texto, m.tsMs)
        return true
      })

      // Detecta mensagens novas e notifica
      const anteriorCount = msgCountRef.current[phone] ?? -1
      if (anteriorCount >= 0 && msgs.length > anteriorCount) {
        const novas = msgs.slice(anteriorCount)
        novas.filter(m => !m.minha).forEach(m => {
          const conversa = conversas.find(c => c.id === phone)
          notificar(conversa?.contato?.nome || phone, m.texto)
        })
      }
      msgCountRef.current[phone] = msgs.length

      setConversas(prev => prev.map(c => c.id === phone ? { ...c, mensagens: msgs, naoLidas: 0 } : c))
      setSelecionada(prev => prev?.id === phone ? { ...prev, mensagens: msgs, naoLidas: 0 } : prev)
    } catch {}
    setLoadingMsgs(false)
  }, [contaAtiva?.instanciaId])

  const fetchQrCode = async () => {
    if (!contaAtiva?.instanciaId) return
    setLoadingQr(true)
    setQrCode(null)
    try {
      const ctParam = contaAtiva.clientToken ? `&ct=${encodeURIComponent(contaAtiva.clientToken)}` : ''
      const res = await fetch(`/api/zapi-qr?i=${contaAtiva.instanciaId}&t=${contaAtiva.instanciaToken}${ctParam}`)
      const d = await res.json()
      const qr = d?.value || d?.qrcode || d?.qr || null
      setQrCode(qr)
    } catch {}
    setLoadingQr(false)
  }

  // Polling de status quando desconectado
  useEffect(() => {
    if (!desconectado || !contaAtiva?.instanciaId) return
    const check = async () => {
      try {
        const ctParam = contaAtiva.clientToken ? `&ct=${encodeURIComponent(contaAtiva.clientToken)}` : ''
        const res = await fetch(`/api/zapi-status?i=${contaAtiva.instanciaId}&t=${contaAtiva.instanciaToken}${ctParam}`)
        const d = await res.json()
        if (d?.connected === true || d?.status === 'connected' || d?.value === 'connected' || d?.smartphoneConnected === true) {
          setDesconectado(false)
          setQrCode(null)
          jaTemSelecao.current = false
          fetchConversas(true)
        }
      } catch {}
    }
    check()
    const interval = setInterval(check, 4000)
    return () => clearInterval(interval)
  }, [desconectado, contaAtiva?.instanciaId])

  const pedirSugestaoIA = useCallback(async (msgs, nomeContato, direcao = '') => {
    setLoadingIA(true)
    setSugestaoIA('')
    setErroIA('')
    if (!msgs?.length) {
      setErroIA('Nenhuma mensagem encontrada nesta conversa.')
      setLoadingIA(false)
      return
    }
    try {
      const conversaTexto = msgs.map(m => `${m.minha ? 'Atendente' : nomeContato || 'Lead'}: ${m.texto}`).join('\n')
      const exemplos = (Array.isArray(iaExemplos) ? iaExemplos : []).slice(0, 6)
      const conhecimento = iaConhecimento || ''
      const res = await fetch('/api/claude-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversa: conversaTexto, nomeContato, direcao, exemplos, conhecimento }),
      })
      const d = await res.json()
      if (d.sugestao) setSugestaoIA(d.sugestao)
      else if (d.error) setErroIA(`Erro: ${d.error}`)
      else setErroIA('Resposta inesperada da IA.')
    } catch (e) {
      setErroIA(`Erro de rede: ${e.message}`)
    }
    setLoadingIA(false)
  }, [])

  // Dispara sugestão quando chega mensagem nova do lead
  useEffect(() => {
    if (!selecionada?.mensagens?.length || !painelIA) return
    const ultima = selecionada.mensagens[selecionada.mensagens.length - 1]
    if (!ultima.minha) {
      pedirSugestaoIA(selecionada.mensagens, selecionada.contato?.nome)
    }
  }, [selecionada?.mensagens?.length])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [mensagem])

  useEffect(() => { jaTemSelecao.current = false; fetchConversas(true) }, [contaAtiva?.id])

  // Atualiza lista de conversas a cada 10s para capturar novas mensagens
  useEffect(() => {
    if (!contaAtiva?.instanciaId) return
    const interval = setInterval(() => fetchConversas(false), 20000)
    return () => clearInterval(interval)
  }, [contaAtiva?.instanciaId, fetchConversas])

  useEffect(() => {
    if (selecionada?.id) fetchMensagens(selecionada.id, selecionada?.contato?.nome)
  }, [selecionada?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selecionada?.mensagens?.length])

  // Realtime Supabase para novas mensagens
  useEffect(() => {
    if (!contaAtiva?.instanciaId || !selecionada?.id) return
    const channel = supabase
      .channel(`msgs-${selecionada.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_mensagens',
        filter: `phone=eq.${selecionada.id}`,
      }, payload => {
        const m = payload.new
        const _ts = Number(m.timestamp_ms) < 10000000000 ? Number(m.timestamp_ms) * 1000 : Number(m.timestamp_ms)
        const novaMsg = { id: m.message_id || String(m.id), minha: m.de_mim, texto: m.texto, tipo: m.tipo || 'text', mediaUrl: m.media_url || null, hora: formatTs(_ts), tsMs: _ts }
        if (!m.de_mim) {
          setConversas(prev => {
            const c = prev.find(x => x.id === selecionada.id)
            notificar(c?.contato?.nome || selecionada.id, m.texto)
            return prev
          })
          setSelecionada(prev => {
            const msgs = prev?.mensagens || []
            if (msgs.some(x => x.id === novaMsg.id)) return prev
            return { ...prev, mensagens: [...msgs, novaMsg] }
          })
        } else if (pendingMsgs.current.has(m.texto)) {
          // Substitui a mensagem local otimista pela confirmada do Supabase
          pendingMsgs.current.delete(m.texto)
          setSelecionada(prev => ({
            ...prev,
            mensagens: (prev?.mensagens || []).map(x =>
              (x.id?.startsWith('local-') && x.texto === m.texto) ? novaMsg : x
            ),
          }))
        } else {
          setSelecionada(prev => {
            const msgs = prev?.mensagens || []
            if (msgs.some(x => x.id === novaMsg.id)) return prev
            // Bloqueia duplicata de msg própria (frontend insert + webhook insert chegando como 2 events)
            if (novaMsg.minha && msgs.some(x => x.minha && x.texto === novaMsg.texto && Math.abs((x.tsMs || 0) - (novaMsg.tsMs || 0)) < 30000)) return prev
            return { ...prev, mensagens: [...msgs, novaMsg] }
          })
        }
        setConversas(prev => {
          const updated = prev.map(c => c.id === selecionada.id
            ? { ...c, mensagens: [...(c.mensagens || []), novaMsg], tsRaw: Date.now(), horario: novaMsg.hora }
            : c)
          return [updated.find(c => c.id === selecionada.id), ...updated.filter(c => c.id !== selecionada.id)]
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [contaAtiva?.instanciaId, selecionada?.id])

  // Realtime global: incrementa não lidas para conversas que não estão abertas
  useEffect(() => {
    if (!contaAtiva?.instanciaId) return
    const ch = supabase
      .channel('inbox-unread-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_mensagens' }, payload => {
        const m = payload.new
        if (m.de_mim) return
        if (selecionadaRef.current?.id === m.phone) return
        setConversas(prev => prev.map(c =>
          c.id === m.phone ? { ...c, naoLidas: (c.naoLidas || 0) + 1 } : c
        ))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [contaAtiva?.instanciaId])

  // Polling a cada 5s como fallback caso o realtime não esteja ativo
  useEffect(() => {
    if (!contaAtiva?.instanciaId || !selecionada?.id) return
    const interval = setInterval(() => fetchMensagens(selecionada.id, selecionada?.contato?.nome), 5000)
    return () => clearInterval(interval)
  }, [contaAtiva?.instanciaId, selecionada?.id, fetchMensagens])

  const conversa = selecionada ? conversas.find(c => c.id === selecionada.id) || selecionada : null

  // Quando troca de conversa, verifica se já há lead cadastrado com esse telefone
  useEffect(() => {
    if (!conversa) return
    setLeadRegistrado(prev => {
      if (prev[conversa.id]) return prev
      const tel = (conversa.contato?.telefone || conversa.id || '').replace(/\D/g, '')
      const leadExistente = leads.find(l => (l.telefone || '').replace(/\D/g, '') === tel && tel.length > 5)
      if (!leadExistente) return prev
      return { ...prev, [conversa.id]: { tipo: leadExistente.origem || 'leads_recorrentes', lead: leadExistente } }
    })
  }, [conversa?.id])

  function salvarRespostas(lista) {
    setRespostasRapidas(lista)
    setRespostasConfig(lista)
  }

  async function enviarArquivo(file, tipo) {
    if (!conversa || !contaAtiva?.instanciaId) return
    setEnviando(true)
    setMenuAnexo(false)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result
        if (tipo === 'foto') {
          await zapiFetch(contaAtiva, 'send-image', 'POST', { phone: conversa.id, image: base64, caption: '' })
        } else {
          await zapiFetch(contaAtiva, 'send-document', 'POST', { phone: conversa.id, document: base64, fileName: file.name, caption: '' })
        }
      }
      reader.readAsDataURL(file)
    } catch (e) {
      setErro(`Erro ao enviar: ${e.message}`)
    }
    setEnviando(false)
  }

  const conversasFiltradas = conversas.filter(c => {
    if (busca && !c.contato.nome.toLowerCase().includes(busca.toLowerCase())) return false
    if (filtro === 'nao_lidas') return c.naoLidas > 0
    if (filtro === 'arquivadas') return c.arquivada === true
    return !c.arquivada
  })

  const enviarMensagem = async () => {
    if (!mensagem.trim() || !conversa || !contaAtiva?.instanciaId) return
    const texto = mensagem.trim()
    setMensagem('')
    setEnviando(true)

    const localId = `local-${Date.now()}`
    const msgLocal = {
      id: localId, minha: true, texto,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    pendingMsgs.current.add(texto)
    setSelecionada(prev => ({ ...prev, mensagens: [...(prev?.mensagens || []), msgLocal] }))

    try {
      await zapiFetch(contaAtiva, 'send-text', 'POST', { phone: conversa.id, message: texto })

      // Salva no Supabase também
      await supabase.from('whatsapp_mensagens').insert({
        instancia_id: contaAtiva.instanciaId,
        phone: conversa.id,
        nome_contato: conversa.contato.nome,
        de_mim: true,
        texto,
        tipo: 'text',
        timestamp_ms: Date.now(),
      })
    } catch (e) {
      setErro(`Erro ao enviar: ${e.message}`)
    }
    setEnviando(false)
  }

  const abrirConversa = (c) => {
    setSelecionada(c)
    setMenuLead(false)
    setMenuOpcoes(null)
    setConversas(prev => prev.map(x => x.id === c.id ? { ...x, naoLidas: 0 } : x))
    lastReadRef.current[c.id] = Date.now()
    localStorage.setItem('wpp_last_read', JSON.stringify(lastReadRef.current))
  }

  const marcarNaoLida = (convId) => {
    delete lastReadRef.current[convId]
    localStorage.setItem('wpp_last_read', JSON.stringify(lastReadRef.current))
    setConversas(prev => prev.map(c => c.id === convId ? { ...c, naoLidas: Math.max(c.naoLidas || 0, 1) } : c))
    setMenuOpcoes(null)
  }

  const arquivarConversa = (convId) => {
    setConversas(prev => {
      const nova = prev.map(c => c.id === convId ? { ...c, arquivada: !c.arquivada } : c)
      const arquivadas = new Set(nova.filter(c => c.arquivada).map(c => c.id))
      arquivadasRef.current = arquivadas
      const lista = [...arquivadas]
      supabase.from('configuracoes').upsert({ chave: arquivadasKey, valor: lista }, { onConflict: 'chave' })
      return nova
    })
    if (selecionada?.id === convId) setSelecionada(null)
    setMenuOpcoes(null)
  }
  const apagarMensagem = async (msgId) => {
    setMenuMsg(null)
    const remover = (prev) => prev ? { ...prev, mensagens: (prev.mensagens || []).filter(m => m.id !== msgId) } : prev
    setSelecionada(remover)
    setConversas(prev => prev.map(c => c.id === selecionada?.id ? remover(c) : c))
    await supabase.from('whatsapp_mensagens').delete().eq('message_id', msgId)
  }

  const salvarEdicaoMensagem = async () => {
    if (!editandoMsg) return
    const { id, texto } = editandoMsg
    const atualizar = (prev) => prev ? { ...prev, mensagens: (prev.mensagens || []).map(m => m.id === id ? { ...m, texto } : m) } : prev
    setSelecionada(atualizar)
    setConversas(prev => prev.map(c => c.id === selecionada?.id ? atualizar(c) : c))
    await supabase.from('whatsapp_mensagens').update({ texto }).eq('message_id', id)
    setEditandoMsg(null)
  }

  const STATUS_NORMALIZE = {
    'Em aberto': 'em_aberto', 'Conversando': 'conversando',
    'Follow #1': 'follow1', 'Follow #2': 'follow2', 'Follow #3': 'follow3',
    'Agendou': 'agendado', 'Perdido': 'perdido',
  }

  const registrarLead = (tipo) => { setMenuLead(false); setModalLead(tipo) }
  const confirmarLead = async (dados) => {
    const telLimpo = (dados.telefone || '').replace(/\D/g, '')
    const leadDuplicado = telLimpo.length > 5 && leads.find(l => (l.telefone || '').replace(/\D/g, '') === telLimpo)
    let novoLead
    if (leadDuplicado) {
      await updateLead(leadDuplicado.id, { ...dados, status: STATUS_NORMALIZE[dados.status] || dados.status })
      novoLead = { ...leadDuplicado, ...dados, status: STATUS_NORMALIZE[dados.status] || dados.status }
    } else {
      novoLead = await addLead({ ...dados, status: STATUS_NORMALIZE[dados.status] || dados.status })
    }
    const todosLembretes = dados.lembretes?.length ? dados.lembretes : (dados.lembrete ? [{ data: dados.lembrete, hora: dados.lembreteHora || '', obs: '' }] : [])
    todosLembretes.filter(l => l.data).forEach((l, i) => {
      addLembrete({
        id: Date.now() + i,
        leadNome: dados.nome,
        leadTelefone: dados.telefone || '',
        descricao: l.obs || dados.obs || '',
        data: l.data,
        hora: l.hora || '',
        cor: 'blue',
        concluido: false,
        criadoEm: Date.now(),
      })
    })
    if (dados.aniversario) {
      const [, mes, dia] = dados.aniversario.split('-')
      const hoje = new Date()
      let anoAniv = hoje.getFullYear()
      const dataAniv = new Date(`${anoAniv}-${mes}-${dia}`)
      if (dataAniv <= hoje) anoAniv += 1
      addLembrete({
        id: Date.now() + 1,
        leadNome: dados.nome,
        leadTelefone: dados.telefone || '',
        descricao: `🎂 Aniversário de ${dados.nome}`,
        data: `${anoAniv}-${mes}-${dia}`,
        hora: '09:00',
        cor: 'pink',
        concluido: false,
        criadoEm: Date.now(),
      })
    }
    setLeadRegistrado(prev => ({ ...prev, [conversa.id]: { tipo: dados.origem, lead: novoLead || { ...dados, status: STATUS_NORMALIZE[dados.status] || dados.status } } }))
    setModalLead(null)
  }

  if (!contaAtiva) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-base font-semibold text-gray-700 mb-2">Nenhuma conta selecionada</p>
          <p className="text-sm text-gray-400">Acesse <strong>Configurações → WhatsApp</strong> para adicionar uma conta.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Lista de conversas */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-800">💬 {contaAtiva.nome}</h2>
              {contaAtiva.tipo && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  contaAtiva.tipo === 'Leads Novos' ? 'bg-brand-100 text-brand-700'
                  : contaAtiva.tipo === 'Leads Recorrentes' ? 'bg-blue-100 text-blue-700'
                  : contaAtiva.tipo === 'Indicação' ? 'bg-purple-100 text-purple-700'
                  : contaAtiva.tipo === 'Suporte' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-500'
                }`}>{contaAtiva.tipo}</span>
              )}
            </div>
            <button onClick={fetchConversas} disabled={loadingConversas} title="Atualizar"
              className="text-gray-300 hover:text-brand-400 transition-colors disabled:opacity-40">
              <svg className={`w-4 h-4 ${loadingConversas ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pl-8 text-sm outline-none focus:border-brand-300" />
              <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-brand-50 text-gray-400 hover:text-brand-500 text-lg font-light transition-colors flex-shrink-0">+</button>
          </div>

          <div className="flex gap-2 mt-2">
            {[['todas','Todas'],['nao_lidas','Não lidas'],['arquivadas','Arquivadas']].map(([val, label]) => (
              <button key={val} onClick={() => setFiltro(val)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  filtro === val ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {erro && !desconectado && <div className="mx-3 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500">{erro}</div>}

        {desconectado && (
          <div className="mx-3 mt-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-center">
            <p className="text-2xl mb-2">📵</p>
            <p className="text-sm font-bold text-orange-700 mb-1">WhatsApp desconectado</p>
            <p className="text-xs text-orange-500 mb-3">Escaneie o QR code para reconectar</p>
            {!qrCode ? (
              <button onClick={fetchQrCode} disabled={loadingQr}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                {loadingQr ? 'Gerando QR Code...' : 'Gerar QR Code'}
              </button>
            ) : (
              <div>
                <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48 mx-auto rounded-xl mb-2" />
                <button onClick={fetchQrCode} disabled={loadingQr}
                  className="text-xs text-orange-500 hover:text-orange-700 underline">
                  Gerar novo QR Code
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3 animate-pulse">Verificando conexão automaticamente...</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loadingConversas && conversas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <svg className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Carregando conversas...
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma conversa encontrada</div>
          ) : (
            conversasFiltradas.map(c => (
              <div key={c.id}
                onClick={() => abrirConversa(c)}
                className={`relative w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-brand-50 transition-colors cursor-pointer group ${selecionada?.id === c.id ? 'bg-brand-50 border-l-4 border-l-brand-400' : ''}`}>
                <div className="flex items-center gap-3">
                  {c.contato.foto ? (
                    <img src={c.contato.foto} className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                      onError={e => { e.target.style.display = 'none'; delete fotosCache.current[c.id]; e.target.nextSibling.style.display = 'flex' }} />
                  ) : null}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-200 to-brand-300 items-center justify-center text-brand-700 font-bold flex-shrink-0"
                    style={{ display: c.contato.foto ? 'none' : 'flex' }}>
                    {(c.contato.nome || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 flex gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${c.naoLidas > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{c.contato.nome}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {(() => {
                          const lastMsg = c.mensagens?.at(-1)
                          const texto = lastMsg?.texto || c.ultimaMensagem || ''
                          const tipo = lastMsg?.tipo || ''
                          const deMim = lastMsg ? lastMsg.minha : c.ultimaDeMim
                          const preview = tipo === 'audio' || texto === '[áudio]' ? '🎤 Áudio'
                            : tipo === 'image' || texto === '[imagem]' ? '🖼️ Imagem'
                            : tipo === 'video' || texto === '[vídeo]' ? '🎥 Vídeo'
                            : texto
                          return preview ? (deMim ? `Você: ${preview}` : preview) : ''
                        })()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between flex-shrink-0 min-w-[48px] relative">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 group-hover:hidden">{c.horario}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setMenuOpcoes(menuOpcoes === c.id ? null : c.id) }}
                          className="hidden group-hover:flex w-5 h-5 items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200 text-base leading-none font-bold"
                          title="Opções">
                          ⋮
                        </button>
                      </div>
                      {(() => {
                        const tel = (c.contato?.telefone || '').replace(/\D/g, '')
                        const count = tel.length > 5 ? todosLembretesAgenda.filter(l => !l.concluido && (l.leadTelefone || '').replace(/\D/g, '').endsWith(tel.slice(-8))).length : 0
                        return count > 0 ? (
                          <span className="flex items-center gap-0.5 text-amber-500" title={`${count} lembrete${count > 1 ? 's' : ''}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            <span className="text-xs font-bold">{count}</span>
                          </span>
                        ) : null
                      })()}
                      {c.naoLidas > 0 && (
                        <span className="bg-green-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center">
                          {c.naoLidas > 99 ? '99+' : c.naoLidas}
                        </span>
                      )}
                      {menuOpcoes === c.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-6 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 w-48">
                          <button
                            onClick={() => marcarNaoLida(c.id)}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <span>📩</span> Marcar como não lida
                          </button>
                          <button
                            onClick={() => arquivarConversa(c.id)}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <span>{c.arquivada ? '📂' : '🗂️'}</span> {c.arquivada ? 'Desarquivar' : 'Arquivar conversa'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Painel da conversa */}
      {conversa ? (
        <div className="flex-1 flex min-w-0">
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0 relative">
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {conversa.contato.foto ? (
                <img src={conversa.contato.foto} className="w-10 h-10 rounded-full object-cover"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
              ) : null}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-200 to-brand-300 items-center justify-center text-brand-700 font-bold"
                style={{ display: conversa.contato.foto ? 'none' : 'flex' }}>
                {(conversa.contato.nome || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{conversa.contato.nome}</p>
                <p className="text-xs text-gray-400">+{conversa.contato.telefone}</p>
              </div>
            </div>

            <div className="relative">
              {leadRegistrado[conversa.id] ? (
                <button onClick={() => setEditarLeadRegistrado(leadRegistrado[conversa.id])}
                  className="flex items-center gap-2 text-xs text-green-700 font-semibold bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-xl transition-colors">
                  ✓ {leadRegistrado[conversa.id].tipo === 'leads_recorrentes' ? 'Lead Recorrente registrado'
                    : leadRegistrado[conversa.id].tipo === 'leads_novos' ? 'Lead Novo registrado'
                    : leadRegistrado[conversa.id].tipo === 'indicacao' ? 'Indicação registrada'
                    : 'Lead registrado'} · Editar
                </button>
              ) : TIPO_PARA_ORIGEM[contaAtiva?.tipo] ? (
                <button onClick={() => registrarLead(TIPO_PARA_ORIGEM[contaAtiva.tipo])}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  Registrar como {contaAtiva.tipo === 'Leads Novos' ? 'Lead Novo' : contaAtiva.tipo === 'Leads Recorrentes' ? 'Lead Recorrente' : 'Indicação'}
                </button>
              ) : (
                <>
                  <button onClick={() => setMenuLead(v => !v)}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Registrar Lead
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {menuLead && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[180px]">
                      <button onClick={() => registrarLead('leads_novos')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-400"></span> Lead Novo
                      </button>
                      <button onClick={() => registrarLead('leads_recorrentes')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span> Lead Recorrente
                      </button>
                      <button onClick={() => registrarLead('indicacao')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span> Indicação
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {loadingMsgs && !(conversa.mensagens?.length) ? (
              <div className="flex justify-center pt-8">
                <svg className="w-5 h-5 animate-spin text-brand-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : !(conversa.mensagens?.length) ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
                <p className="text-3xl mb-3">💬</p>
                <p className="text-sm font-medium text-gray-500">Nenhuma mensagem ainda</p>
                <p className="text-xs text-gray-400 mt-1">As mensagens novas aparecerão aqui em tempo real</p>
              </div>
            ) : (conversa.mensagens || []).map((msg, i, arr) => {
              const diaAtual = getDayLabel(msg.tsMs)
              const diaAnterior = i > 0 ? getDayLabel(arr[i - 1].tsMs) : null
              const mostraSeparador = diaAtual && diaAtual !== diaAnterior
              return (
                <div key={msg.id}>
                  {mostraSeparador && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">{diaAtual}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className={`flex items-end gap-1 ${msg.minha ? 'justify-end' : 'justify-start'} group`}>
                    {/* ⋮ menu — só para mensagens próprias, à esquerda da bolha */}
                    {msg.minha && (
                      <div className="relative self-end mb-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setMenuMsg(menuMsg === msg.id ? null : msg.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 text-base leading-none">
                          ⋮
                        </button>
                        {menuMsg === msg.id && (
                          <div className="absolute bottom-7 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36 z-20">
                            <button onClick={() => { setEditandoMsg({ id: msg.id, texto: msg.texto }); setMenuMsg(null) }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">✏️ Editar</button>
                            <button onClick={() => apagarMensagem(msg.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">🗑️ Apagar</button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md rounded-2xl text-sm shadow-sm overflow-hidden ${
                      msg.minha ? 'bg-green-100 text-gray-800 rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'
                    }`}>
                      {editandoMsg?.id === msg.id ? (
                        <div className="px-3 py-2 min-w-[200px]">
                          <textarea autoFocus value={editandoMsg.texto}
                            onChange={e => setEditandoMsg(p => ({ ...p, texto: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salvarEdicaoMensagem() } if (e.key === 'Escape') setEditandoMsg(null) }}
                            rows={3} className="w-full text-sm outline-none resize-none bg-transparent border-b border-green-300 pb-1" />
                          <div className="flex gap-2 mt-2 justify-end">
                            <button onClick={() => setEditandoMsg(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">Cancelar</button>
                            <button onClick={salvarEdicaoMensagem} className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600">Salvar</button>
                          </div>
                        </div>
                      ) : msg.mediaUrl && (msg.tipo === 'image' || msg.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) ? (
                        <div>
                          <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                            <img src={msg.mediaUrl} alt="imagem" className="max-w-full rounded-xl block cursor-pointer hover:opacity-90 transition-opacity" style={{ maxHeight: 280 }} />
                          </a>
                          {msg.texto && msg.texto !== '[imagem]' && (
                            <p className="px-4 pt-2 pb-1 leading-relaxed break-words whitespace-pre-wrap">{msg.texto}</p>
                          )}
                        </div>
                      ) : msg.mediaUrl && (msg.tipo === 'audio' || msg.mediaUrl.match(/\.(mp3|ogg|wav|m4a|opus|aac)/i)) ? (
                        <div className="px-3 py-2.5">
                          <audio controls src={msg.mediaUrl} style={{ width: 280, height: 48 }}
                            className="rounded-lg" />
                        </div>
                      ) : msg.mediaUrl && msg.tipo === 'video' ? (
                        <div className="px-4 py-2.5">
                          <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-blue-500 underline text-xs">
                            🎥 {msg.texto !== '[vídeo]' ? msg.texto : 'Ver vídeo'}
                          </a>
                        </div>
                      ) : msg.mediaUrl ? (
                        <div className="px-4 py-2.5">
                          <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-blue-500 underline text-xs">
                            📎 {msg.texto}
                          </a>
                        </div>
                      ) : msg.tipo === 'audio' ? (
                        <p className="px-4 py-2.5 text-gray-400 text-xs">🎵 Áudio (URL indisponível)</p>
                      ) : (
                        <p className="px-4 py-2.5 leading-relaxed break-words whitespace-pre-wrap">{msg.texto}</p>
                      )}
                      {editandoMsg?.id !== msg.id && (
                        <p className={`text-xs px-4 pb-2 ${msg.minha ? 'text-green-600' : 'text-gray-400'} text-right`}>{msg.hora}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Modal Resposta Rápida */}
          {modalRespostas && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">Respostas rápidas</p>
                <button onClick={() => setModalRespostas(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {respostasRapidas.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Nenhuma resposta cadastrada ainda</p>}
                {respostasRapidas.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 group">
                    <button className="flex-1 text-left text-sm text-gray-700 truncate" onClick={() => { setMensagem(r); setModalRespostas(false) }}>{r}</button>
                    <button onClick={() => salvarRespostas(respostasRapidas.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-3 border-t border-gray-100">
                <input value={novaResposta} onChange={e => setNovaResposta(e.target.value)}
                  placeholder="Nova resposta rápida..."
                  onKeyDown={e => e.key === 'Enter' && novaResposta.trim() && (salvarRespostas([...respostasRapidas, novaResposta.trim()]), setNovaResposta(''))}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-300" />
                <button onClick={() => { if (novaResposta.trim()) { salvarRespostas([...respostasRapidas, novaResposta.trim()]); setNovaResposta('') } }}
                  className="bg-brand-500 text-white text-sm px-3 py-2 rounded-xl hover:bg-brand-600">Salvar</button>
              </div>
            </div>
          )}

          <input ref={inputFotoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && enviarArquivo(e.target.files[0], 'foto')} />
          <input ref={inputArquivoRef} type="file" className="hidden" onChange={e => e.target.files[0] && enviarArquivo(e.target.files[0], 'arquivo')} />

          {showEmoji && (
            <div ref={emojiContainerRef} className="absolute bottom-20 left-4 z-30" style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.12))' }}>
              <Picker
                data={data}
                locale="pt"
                set="native"
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                onEmojiSelect={e => {
                  setMensagem(prev => prev + e.native)
                  setShowEmoji(false)
                  setTimeout(() => textareaRef.current?.focus(), 50)
                }}
              />
            </div>
          )}

          <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2 flex-shrink-0 relative">
            {/* Menu + */}
            <div className="relative">
              <button onClick={() => { setMenuAnexo(v => !v); setModalRespostas(false) }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 text-xl font-light transition-colors flex-shrink-0">+</button>
              {menuAnexo && (
                <div className="absolute bottom-11 left-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden min-w-[160px]">
                  <button onClick={() => { inputFotoRef.current.click(); setMenuAnexo(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Foto
                  </button>
                  <button onClick={() => { inputArquivoRef.current.click(); setMenuAnexo(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Arquivo
                  </button>
                  <button onClick={() => { setModalRespostas(true); setMenuAnexo(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Resposta rápida
                  </button>
                </div>
              )}
            </div>

            <button
              onMouseDown={e => { e.preventDefault(); setShowEmoji(v => !v); setMenuAnexo(false); setModalRespostas(false) }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-yellow-50 text-xl transition-colors flex-shrink-0"
              title="Emojis">😊</button>

            <textarea
              ref={textareaRef}
              value={mensagem}
              onChange={e => { setMensagem(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviarMensagem())}
              placeholder="Digite uma mensagem ou instrução para a IA..."
              rows={1}
              style={{ resize: 'none', overflow: 'hidden', maxHeight: '200px' }}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-300"
            />
            <button onClick={enviarMensagem} disabled={!mensagem.trim() || enviando}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white p-2.5 rounded-xl transition-colors flex-shrink-0">
              {enviando
                ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Painel IA */}
        {painelIA && (
          <div className="w-72 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <p className="text-sm font-bold text-gray-800">Assistente IA</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setModalConfigIA(true)} title="Configurar IA"
                  className="text-gray-300 hover:text-brand-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button onClick={() => setPainelIA(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs text-gray-400 text-center">Sugestão de resposta para a última mensagem do lead</p>

              {loadingIA ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <svg className="w-5 h-5 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <p className="text-xs text-gray-400">Analisando conversa...</p>
                </div>
              ) : erroIA ? (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-600 leading-relaxed">{erroIA}</p>
                  </div>
                  <button
                    onClick={() => pedirSugestaoIA(conversa.mensagens, conversa.contato.nome)}
                    className="w-full border border-gray-200 text-gray-500 text-sm py-2 rounded-xl hover:bg-gray-50 transition-colors">
                    Tentar novamente
                  </button>
                </div>
              ) : sugestaoIA ? (
                <div className="space-y-2">
                  <div className="bg-brand-50 border border-brand-200 rounded-xl p-3">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{sugestaoIA}</p>
                  </div>
                  <button
                    onClick={() => {
                      const ultimaMsgLead = conversa.mensagens?.filter(m => !m.minha).at(-1)?.texto
                      if (ultimaMsgLead) {
                        const exemplos = Array.isArray(iaExemplos) ? iaExemplos : []
                        const atualizados = [
                          { lead: ultimaMsgLead, resposta: sugestaoIA },
                          ...exemplos.filter(e => e.lead !== ultimaMsgLead),
                        ].slice(0, 15)
                        setIaExemplos(atualizados)
                      }
                      setMensagem(sugestaoIA)
                      setSugestaoIA('')
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                    Usar esta resposta
                  </button>
                  <button
                    onClick={() => pedirSugestaoIA(conversa.mensagens, conversa.contato.nome, mensagem)}
                    className="w-full border border-gray-200 text-gray-500 text-sm py-2 rounded-xl hover:bg-gray-50 transition-colors">
                    Gerar outra sugestão
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400 mb-3">Digite uma instrução no campo de mensagem (opcional) e clique abaixo</p>
                  <button
                    onClick={() => pedirSugestaoIA(conversa.mensagens, conversa.contato.nome, mensagem)}
                    className="bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Analisar conversa
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center mb-2">Use o campo de mensagem como instrução</p>
              <button
                onClick={() => pedirSugestaoIA(conversa.mensagens, conversa.contato.nome, mensagem)}
                disabled={loadingIA}
                className="w-full bg-brand-400 hover:bg-brand-500 disabled:bg-brand-200 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
                {loadingIA ? 'Analisando...' : '✨ Gerar sugestão'}
              </button>
            </div>
          </div>
        )}

        {!painelIA && (
          <button onClick={() => setPainelIA(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-brand-400 hover:bg-brand-500 text-white text-xs font-semibold px-2 py-4 rounded-l-xl shadow-md transition-colors"
            style={{ writingMode: 'vertical-rl' }}>
            ✨ IA
          </button>
        )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm">Selecione uma conversa para começar</p>
          </div>
        </div>
      )}

      {modalConfigIA && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">✨ Configurar Assistente IA</h3>
                <p className="text-xs text-gray-400 mt-0.5">Informações que a IA sempre vai conhecer</p>
              </div>
              <button onClick={() => setModalConfigIA(false)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Conhecimento da clínica</label>
              <textarea
                value={conhecimentoIA}
                onChange={e => setConhecimentoIA(e.target.value)}
                rows={10}
                placeholder={`Ex:\n- Botox: a partir de R$800 por área\n- Preenchimento labial: R$1.200\n- Skinbooster: R$900\n- Horários: seg a sex 9h–18h, sáb 9h–13h\n- Promoção junho: 10% off na primeira consulta\n- WhatsApp agendamento: (11) 99999-9999`}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Adicione preços, horários, procedimentos, promoções, dúvidas frequentes — quanto mais detalhes, melhor a IA vai responder.</p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setModalConfigIA(false)}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button
                onClick={() => {
                  setIaConhecimento(conhecimentoIA)
                  setModalConfigIA(false)
                }}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalLead && (
        <ModalRegistrarLead
          contato={conversa.contato}
          tipo={modalLead}
          onSalvar={confirmarLead}
          onFechar={() => setModalLead(null)}
        />
      )}

      {editarLeadRegistrado && (
        <ModalRegistrarLead
          contato={conversa.contato}
          tipo={editarLeadRegistrado.tipo}
          leadInicial={editarLeadRegistrado.lead}
          lembretesDaAgenda={todosLembretesAgenda}
          onDeletarLembrete={deleteLembrete}
          onSalvar={(dados) => {
            if (editarLeadRegistrado.lead?.id) {
              updateLead(editarLeadRegistrado.lead.id, { ...dados, status: STATUS_NORMALIZE[dados.status] || dados.status })
              setLeadRegistrado(prev => ({ ...prev, [conversa.id]: { ...prev[conversa.id], lead: { ...editarLeadRegistrado.lead, ...dados } } }))
            }
            const todosLembretes = dados.lembretes?.length ? dados.lembretes : (dados.lembrete ? [{ data: dados.lembrete, hora: dados.lembreteHora || '', obs: '' }] : [])
            todosLembretes.filter(l => l.data).forEach((l, i) => {
              addLembrete({ id: Date.now() + i, leadNome: dados.nome, leadTelefone: dados.telefone || '', descricao: l.obs || dados.obs || '', data: l.data, hora: l.hora || '', cor: 'blue', concluido: false, criadoEm: Date.now() })
            })
            if (dados.aniversario) {
              const [, mes, dia] = dados.aniversario.split('-')
              const hoje = new Date()
              let anoAniv = hoje.getFullYear()
              const dataAniv = new Date(`${anoAniv}-${mes}-${dia}`)
              if (dataAniv <= hoje) anoAniv += 1
              addLembrete({ id: Date.now() + 99, leadNome: dados.nome, leadTelefone: dados.telefone || '', descricao: `🎂 Aniversário de ${dados.nome}`, data: `${anoAniv}-${mes}-${dia}`, hora: '09:00', cor: 'pink', concluido: false, criadoEm: Date.now() })
            }
            setEditarLeadRegistrado(null)
          }}
          onFechar={() => setEditarLeadRegistrado(null)}
        />
      )}
    </div>
  )
}
