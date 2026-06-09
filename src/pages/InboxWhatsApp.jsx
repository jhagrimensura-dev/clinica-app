import { useState, useRef, useEffect, useCallback } from 'react'
import { useLeads } from '../context/LeadsContext'

const ZAPI_BASE = 'https://api.z-api.io'

// ── Z-API helper ──────────────────────────────────────────────────
function zapiUrl(conta, path) {
  return `${ZAPI_BASE}/instances/${conta.instanciaId}/token/${conta.instanciaToken}/${path}`
}

async function zapiFetch(conta, path, method = 'GET', body = null) {
  const res = await fetch(zapiUrl(conta, path), {
    method,
    headers: { 'Content-Type': 'application/json', 'client-token': conta.instanciaToken },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}`)
  }
  return res.json()
}

function formatTs(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  if (isNaN(d)) return ''
  const diffDays = Math.floor((Date.now() - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getMsgTextoZapi(msg) {
  return msg?.text?.message
    || msg?.image?.caption
    || msg?.video?.caption
    || msg?.audio ? '[áudio]' : ''
    || msg?.document?.fileName
    || msg?.sticker ? '[sticker]' : ''
    || '[mídia]'
}

function normalizeChatsZapi(data, instancia) {
  const arr = Array.isArray(data) ? data : []
  return arr
    .filter(c => c.phone)
    .map(c => ({
      id: c.phone,
      instancia,
      contato: {
        nome: c.name || c.phone,
        telefone: c.phone,
      },
      naoLidas: c.unread || 0,
      horario: formatTs(c.lastMessage?.momment),
      ultimaMensagem: getMsgTextoZapi(c.lastMessage),
      mensagens: [],
    }))
}

function normalizeMensagensZapi(data, phone) {
  const arr = Array.isArray(data) ? data
    : Array.isArray(data?.messages) ? data.messages
    : []
  return arr.map(m => ({
    id: m.messageId || String(m.momment || Math.random()),
    minha: m.fromMe ?? false,
    texto: getMsgTextoZapi(m),
    hora: formatTs(m.momment),
  }))
}

// ── Modal registrar lead ──────────────────────────────────────────
function ModalRegistrarLead({ contato, tipo, onSalvar, onFechar }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [nome, setNome] = useState(contato.nome)
  const [responsavel, setResponsavel] = useState('')
  const [obs, setObs] = useState('')

  const ORIGENS = {
    leads_novos:      { label: 'Lead Novo',       cor: 'bg-pink-500' },
    leads_recorrentes:{ label: 'Lead Recorrente',  cor: 'bg-blue-500' },
    indicacao:        { label: 'Indicação',        cor: 'bg-purple-500' },
  }
  const origem = ORIGENS[tipo]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Registrar Lead</h3>
            <span className={`text-xs text-white font-semibold px-2 py-0.5 rounded-full ${origem.cor}`}>{origem.label}</span>
          </div>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Responsável</label>
          <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300 bg-white">
            <option value="">Selecione</option>
            <option>Dra. Amanda</option>
            <option>Recepção</option>
            <option>Equipe</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Observação</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
            placeholder="Ex: Interesse em preenchimento labial"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300 resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => nome.trim() && onSalvar({ nome: nome.trim(), responsavel, obs, origem: tipo, data: hoje, status: 'em_aberto', fonte: 'WhatsApp' })}
            disabled={!nome.trim()}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            Registrar
          </button>
        </div>
      </div>
    </div>
  )
}

function loadContas() {
  try { const s = localStorage.getItem('config_whatsapp_contas'); return s ? JSON.parse(s) : [] } catch { return [] }
}

// ── Página principal ──────────────────────────────────────────────
export default function InboxWhatsApp({ contaId }) {
  const { addLead } = useLeads()
  const contaAtiva = contaId ? loadContas().find(c => c.id === contaId) : null

  const [conversas, setConversas]       = useState([])
  const [selecionada, setSelecionada]   = useState(null)
  const [mensagem, setMensagem]         = useState('')
  const [busca, setBusca]               = useState('')
  const [menuLead, setMenuLead]         = useState(false)
  const [modalLead, setModalLead]       = useState(null)
  const [leadRegistrado, setLeadRegistrado] = useState({})
  const [loadingConversas, setLoadingConversas] = useState(false)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [enviando, setEnviando]         = useState(false)
  const [erro, setErro]                 = useState(null)
  const messagesEndRef = useRef(null)
  const pollRef        = useRef(null)

  const fetchConversas = useCallback(async () => {
    if (!contaAtiva?.instanciaId) return
    setLoadingConversas(true)
    setErro(null)
    try {
      const data = await zapiFetch(contaAtiva, 'chats')
      const lista = normalizeChatsZapi(data, contaAtiva.nome)
      setConversas(lista)
      if (!selecionada && lista.length > 0) setSelecionada(lista[0])
    } catch (e) {
      setErro(`Erro ao carregar conversas: ${e.message}`)
    }
    setLoadingConversas(false)
  }, [contaAtiva?.instanciaId, selecionada])

  const fetchMensagens = useCallback(async (phone) => {
    if (!contaAtiva?.instanciaId || !phone) return
    setLoadingMsgs(true)
    try {
      const data = await zapiFetch(contaAtiva, `chats/${phone}/messages?page=1&pageSize=50`)
      const msgs = normalizeMensagensZapi(data, phone)
      setConversas(prev => prev.map(c => c.id === phone ? { ...c, mensagens: msgs, naoLidas: 0 } : c))
      setSelecionada(prev => prev?.id === phone ? { ...prev, mensagens: msgs, naoLidas: 0 } : prev)
    } catch {
      // silencia erro de mensagens individuais
    }
    setLoadingMsgs(false)
  }, [contaAtiva?.instanciaId])

  useEffect(() => { fetchConversas() }, [contaAtiva?.id])

  useEffect(() => {
    if (selecionada?.id) fetchMensagens(selecionada.id)
  }, [selecionada?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selecionada?.mensagens?.length])

  useEffect(() => {
    if (!contaAtiva?.instanciaId) return
    pollRef.current = setInterval(() => {
      if (selecionada?.id) fetchMensagens(selecionada.id)
    }, 10000)
    return () => clearInterval(pollRef.current)
  }, [contaAtiva?.id, selecionada?.id])

  const conversa = selecionada ? conversas.find(c => c.id === selecionada.id) || selecionada : null

  const conversasFiltradas = conversas.filter(c =>
    c.contato.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const enviarMensagem = async () => {
    if (!mensagem.trim() || !conversa || !contaAtiva?.instanciaId) return
    const texto = mensagem.trim()
    setMensagem('')
    setEnviando(true)
    const msgLocal = {
      id: String(Date.now()),
      minha: true,
      texto,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setConversas(cs => cs.map(c => c.id === conversa.id ? { ...c, mensagens: [...(c.mensagens || []), msgLocal] } : c))
    setSelecionada(prev => ({ ...prev, mensagens: [...(prev?.mensagens || []), msgLocal] }))
    try {
      await zapiFetch(contaAtiva, 'send-text', 'POST', {
        phone: conversa.id,
        message: texto,
      })
    } catch (e) {
      setErro(`Erro ao enviar: ${e.message}`)
    }
    setEnviando(false)
  }

  const abrirConversa = (c) => { setSelecionada(c); setMenuLead(false) }
  const registrarLead = (tipo) => { setMenuLead(false); setModalLead(tipo) }
  const confirmarLead = (dados) => {
    addLead(dados)
    setLeadRegistrado(prev => ({ ...prev, [conversa.id]: dados.origem }))
    setModalLead(null)
  }

  // ── Sem conta configurada ──
  if (!contaAtiva) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-base font-semibold text-gray-700 mb-2">Nenhuma conta selecionada</p>
          <p className="text-sm text-gray-400">Acesse <strong>Configurações → WhatsApp</strong> para adicionar uma conta via Z-API.</p>
        </div>
      </div>
    )
  }

  // ── Conta sem credenciais ──
  if (!contaAtiva.instanciaId || !contaAtiva.instanciaToken) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-sm">
          <p className="text-3xl mb-4">⚙️</p>
          <p className="text-base font-semibold text-gray-700 mb-2">Credenciais incompletas</p>
          <p className="text-sm text-gray-400">Edite a conta <strong>{contaAtiva.nome}</strong> em Configurações e adicione o ID e Token da Z-API.</p>
        </div>
      </div>
    )
  }

  // ── UI principal ──
  return (
    <div className="flex h-screen overflow-hidden">

      {/* Lista de conversas */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">💬 {contaAtiva.nome}</h2>
            <button onClick={fetchConversas} disabled={loadingConversas} title="Atualizar"
              className="text-gray-300 hover:text-pink-400 transition-colors disabled:opacity-40">
              <svg className={`w-4 h-4 ${loadingConversas ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar contato..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pl-8 text-sm outline-none focus:border-pink-300" />
            <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {erro && (
          <div className="mx-3 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500">
            {erro}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loadingConversas && conversas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <svg className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Carregando conversas...
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma conversa encontrada</div>
          ) : (
            conversasFiltradas.map(c => (
              <button key={c.id} onClick={() => abrirConversa(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-pink-50 transition-colors ${selecionada?.id === c.id ? 'bg-pink-50 border-l-4 border-l-pink-400' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-pink-700 font-bold text-sm flex-shrink-0">
                    {(c.contato.nome || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.contato.nome}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{c.horario}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 truncate">{c.ultimaMensagem}</p>
                      {c.naoLidas > 0 && (
                        <span className="ml-1 flex-shrink-0 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {c.naoLidas}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Painel da conversa */}
      {conversa ? (
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-pink-700 font-bold">
                {(conversa.contato.nome || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{conversa.contato.nome}</p>
                <p className="text-xs text-gray-400">+{conversa.contato.telefone}</p>
              </div>
            </div>

            <div className="relative">
              {leadRegistrado[conversa.id] ? (
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-xl">✓ Lead registrado</span>
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
                      <button onClick={() => registrarLead('leads_novos')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-400"></span> Lead Novo
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
                <svg className="w-5 h-5 animate-spin text-pink-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : (conversa.mensagens || []).map(msg => (
              <div key={msg.id} className={`flex ${msg.minha ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  msg.minha ? 'bg-green-100 text-gray-800 rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed">{msg.texto}</p>
                  <p className={`text-xs mt-1 ${msg.minha ? 'text-green-600' : 'text-gray-400'} text-right`}>{msg.hora}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <input
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300"
            />
            <button onClick={enviarMensagem} disabled={!mensagem.trim() || enviando}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white p-2.5 rounded-xl transition-colors">
              {enviando
                ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              }
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm">Selecione uma conversa para começar</p>
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
    </div>
  )
}
