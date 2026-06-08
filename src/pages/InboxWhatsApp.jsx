import { useState, useRef, useEffect } from 'react'
import { useLeads } from '../context/LeadsContext'

const CONVERSAS_MOCK = [
  {
    id: '1', instancia: 'Comercial',
    contato: { nome: 'Maria Silva', telefone: '31999887766' },
    naoLidas: 2, horario: '14:32',
    mensagens: [
      { id: 1, minha: false, texto: 'Oi! Vi o perfil de vocês no Instagram e fiquei interessada 😊', hora: '14:28' },
      { id: 2, minha: false, texto: 'Queria saber sobre procedimentos para manchas no rosto', hora: '14:29' },
      { id: 3, minha: true,  texto: 'Oi Maria! Tudo bem? Que bom que nos encontrou 😄', hora: '14:31' },
      { id: 4, minha: true,  texto: 'A Dra. Amanda trabalha com tratamentos de manchas sim! Posso te passar mais informações?', hora: '14:31' },
      { id: 5, minha: false, texto: 'Sim por favor! Qual o valor?', hora: '14:32' },
    ],
  },
  {
    id: '2', instancia: 'Comercial',
    contato: { nome: 'Juliana Ferreira', telefone: '31988776655' },
    naoLidas: 0, horario: '13:15',
    mensagens: [
      { id: 1, minha: false, texto: 'Bom dia! Vocês atendem pelo plano Unimed?', hora: '13:10' },
      { id: 2, minha: true,  texto: 'Bom dia Juliana! Atendemos sim alguns planos. Pode me dizer qual o seu?', hora: '13:14' },
      { id: 3, minha: false, texto: 'Unimed BH', hora: '13:15' },
    ],
  },
  {
    id: '3', instancia: 'Comercial',
    contato: { nome: 'Fernanda Costa', telefone: '31977665544' },
    naoLidas: 1, horario: '11:47',
    mensagens: [
      { id: 1, minha: false, texto: 'Boa tarde! Minha amiga fez tratamento com vocês e ficou linda!', hora: '11:40' },
      { id: 2, minha: false, texto: 'Queria marcar uma consulta de avaliação', hora: '11:41' },
      { id: 3, minha: true,  texto: 'Que ótimo ouvir isso! 💕 Podemos agendar uma avaliação com a Dra. Amanda.', hora: '11:45' },
      { id: 4, minha: true,  texto: 'Qual seria o melhor dia pra você?', hora: '11:45' },
      { id: 5, minha: false, texto: 'Pode ser na próxima semana, qualquer dia pela manhã', hora: '11:47' },
    ],
  },
  {
    id: '4', instancia: 'Recorrência',
    contato: { nome: 'Camila Rodrigues', telefone: '31966554433' },
    naoLidas: 0, horario: 'Ontem',
    mensagens: [
      { id: 1, minha: true,  texto: 'Oi Camila! Tudo bem? Você fez sua última sessão há 3 meses, já está na hora de renovar! 🌟', hora: '10:00' },
      { id: 2, minha: false, texto: 'Ai verdade! Estava precisando mesmo', hora: '10:05' },
      { id: 3, minha: false, texto: 'Pode marcar para semana que vem?', hora: '10:06' },
    ],
  },
  {
    id: '5', instancia: 'Comercial',
    contato: { nome: 'Patricia Lima', telefone: '31955443322' },
    naoLidas: 0, horario: 'Ontem',
    mensagens: [
      { id: 1, minha: false, texto: 'Olá, vi o anúncio de vocês. Quanto custa o preenchimento labial?', hora: '09:20' },
      { id: 2, minha: true,  texto: 'Oi Patricia! O preenchimento labial a partir de R$ 800. Mas o valor exato depende da avaliação da Dra. Amanda.', hora: '09:35' },
      { id: 3, minha: true,  texto: 'Quer agendar uma avaliação gratuita?', hora: '09:36' },
    ],
  },
]

function ModalRegistrarLead({ contato, tipo, onSalvar, onFechar }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [nome, setNome] = useState(contato.nome)
  const [responsavel, setResponsavel] = useState('')
  const [obs, setObs] = useState('')

  const ORIGENS = {
    leads_novos: { label: 'Lead Novo', cor: 'bg-pink-500' },
    leads_recorrentes: { label: 'Lead Recorrente', cor: 'bg-blue-500' },
    indicacao: { label: 'Indicação', cor: 'bg-purple-500' },
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
          <button onClick={() => nome.trim() && onSalvar({ nome: nome.trim(), responsavel, obs, origem: tipo, data: hoje, status: 'em_aberto', fonte: 'WhatsApp' })}
            disabled={!nome.trim()}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            Registrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InboxWhatsApp() {
  const { addLead } = useLeads()
  const [conversas, setConversas] = useState(CONVERSAS_MOCK)
  const [selecionada, setSelecionada] = useState(CONVERSAS_MOCK[0])
  const [mensagem, setMensagem] = useState('')
  const [busca, setBusca] = useState('')
  const [menuLead, setMenuLead] = useState(false)
  const [modalLead, setModalLead] = useState(null)
  const [leadRegistrado, setLeadRegistrado] = useState({})
  const [filtroInstancia, setFiltroInstancia] = useState('Todas')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selecionada])

  const conversa = selecionada ? conversas.find(c => c.id === selecionada.id) : null

  const conversasFiltradas = conversas.filter(c => {
    const matchBusca = c.contato.nome.toLowerCase().includes(busca.toLowerCase())
    const matchInstancia = filtroInstancia === 'Todas' || c.instancia === filtroInstancia
    return matchBusca && matchInstancia
  })

  const enviarMensagem = () => {
    if (!mensagem.trim() || !conversa) return
    const nova = { id: Date.now(), minha: true, texto: mensagem.trim(), hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    setConversas(cs => cs.map(c => c.id === conversa.id ? { ...c, mensagens: [...c.mensagens, nova], horario: nova.hora } : c))
    setSelecionada(prev => ({ ...prev, mensagens: [...(conversa.mensagens), nova] }))
    setMensagem('')
  }

  const abrirConversa = (c) => {
    setSelecionada(c)
    setConversas(cs => cs.map(cv => cv.id === c.id ? { ...cv, naoLidas: 0 } : cv))
    setMenuLead(false)
  }

  const registrarLead = (tipo) => {
    setMenuLead(false)
    setModalLead(tipo)
  }

  const confirmarLead = (dados) => {
    addLead(dados)
    setLeadRegistrado(prev => ({ ...prev, [conversa.id]: dados.origem }))
    setModalLead(null)
  }

  const instancias = ['Todas', ...new Set(conversas.map(c => c.instancia))]

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>

      {/* Painel esquerdo — lista de conversas */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-3">💬 Conversas</h2>
          <div className="relative mb-2">
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar contato..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pl-8 text-sm outline-none focus:border-pink-300" />
            <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-1">
            {instancias.map(inst => (
              <button key={inst} onClick={() => setFiltroInstancia(inst)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${filtroInstancia === inst ? 'bg-pink-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {conversasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma conversa encontrada</div>
          ) : (
            conversasFiltradas.map(c => (
              <button key={c.id} onClick={() => abrirConversa(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-pink-50 transition-colors ${selecionada?.id === c.id ? 'bg-pink-50 border-l-4 border-l-pink-400' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-pink-700 font-bold text-sm flex-shrink-0">
                    {c.contato.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.contato.nome}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{c.horario}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 truncate">{c.mensagens.at(-1)?.texto}</p>
                      {c.naoLidas > 0 && (
                        <span className="ml-1 flex-shrink-0 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {c.naoLidas}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-300">{c.instancia}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Painel direito — conversa */}
      {conversa ? (
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {/* Header da conversa */}
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-pink-700 font-bold">
                {conversa.contato.nome.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{conversa.contato.nome}</p>
                <p className="text-xs text-gray-400">{conversa.contato.telefone} · {conversa.instancia}</p>
              </div>
            </div>

            {/* Botão registrar lead */}
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
                      <button onClick={() => registrarLead('leads_novos')}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-400"></span> Lead Novo
                      </button>
                      <button onClick={() => registrarLead('leads_recorrentes')}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span> Lead Recorrente
                      </button>
                      <button onClick={() => registrarLead('indicacao')}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span> Indicação
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {conversa.mensagens.map(msg => (
              <div key={msg.id} className={`flex ${msg.minha ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  msg.minha
                    ? 'bg-green-100 text-gray-800 rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed">{msg.texto}</p>
                  <p className={`text-xs mt-1 ${msg.minha ? 'text-green-600' : 'text-gray-400'} text-right`}>{msg.hora}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <input
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300"
            />
            <button onClick={enviarMensagem} disabled={!mensagem.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white p-2.5 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
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
