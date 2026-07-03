import { useState, useMemo, useRef, useEffect } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useAgenda } from '../context/AgendaContext'
import { useAuth } from '../context/AuthContext'
import { usePacientes } from '../context/PacientesContext'

const STATUSES = {
  pendente:     { label: 'Pendente',     bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  contatado:    { label: 'Contatado',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  sem_resposta: { label: 'Sem resposta', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  concluido:    { label: 'Concluído',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400'  },
}

function formatData(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function StatusBadge({ status }) {
  const s = STATUSES[status] || STATUSES.pendente
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function ProximoContato({ data, hoje }) {
  if (!data) return <span className="text-xs text-gray-400">Sem data</span>
  if (data < hoje) return <span className="text-xs font-semibold text-red-500">⚠️ Atrasado · {formatData(data)}</span>
  if (data === hoje) return <span className="text-xs font-semibold text-amber-600">🔔 Hoje · {formatData(data)}</span>
  return <span className="text-xs text-blue-600">{formatData(data)}</span>
}

function ModalNovo({ onSalvar, onFechar }) {
  const { pacientes } = usePacientes()
  const hoje = new Date().toISOString().slice(0, 10)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [data, setData] = useState(hoje)
  const [obs, setObs] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [showSug, setShowSug] = useState(false)
  const inputRef = useRef(null)

  const handleNomeChange = (val) => {
    setNome(val)
    if (val.trim().length < 2) { setSugestoes([]); setShowSug(false); return }
    const termo = val.toLowerCase()
    const matches = pacientes
      .filter(p => p.nome.toLowerCase().includes(termo))
      .slice(0, 6)
    setSugestoes(matches)
    setShowSug(matches.length > 0)
  }

  const selecionarPaciente = (p) => {
    setNome(p.nome)
    setTelefone(p.whatsapp || '')
    setSugestoes([])
    setShowSug(false)
  }

  useEffect(() => {
    const fechar = (e) => { if (!inputRef.current?.parentElement?.contains(e.target)) setShowSug(false) }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Novo Pós Tratamento</h2>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 relative" ref={inputRef}>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome <span className="text-red-400">*</span></label>
            <input
              value={nome}
              onChange={e => handleNomeChange(e.target.value)}
              onFocus={() => sugestoes.length > 0 && setShowSug(true)}
              placeholder="Buscar paciente pelo nome..."
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300"
            />
            {showSug && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {sugestoes.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => selecionarPaciente(p)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-800">{p.nome}</span>
                    {p.whatsapp && <span className="text-xs text-gray-400">{p.whatsapp}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefone</label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Data do tratamento</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Observações <span className="text-gray-300">(opcional)</span></label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
              placeholder="Ex: realizou Botox, retorno em 15 dias..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button
            disabled={!nome.trim()}
            onClick={() => onSalvar({ nome: nome.trim(), telefone, data, obs, status: 'pendente', origem: 'pos_tratamento' })}
            className="px-5 py-2 bg-brand-400 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEditar({ lead, onSalvar, onFechar }) {
  const [status, setStatus] = useState(lead.status || 'pendente')
  const [lembretes, setLembretes] = useState([{ data: lead.proximoFollowup || '', hora: '09:00', obs: '' }])

  const setLembrete = (i, field, val) => setLembretes(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  const addLembrete = () => setLembretes(prev => [...prev, { data: '', hora: '09:00', obs: '' }])
  const removeLembrete = (i) => setLembretes(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Editar — {lead.nome}</h2>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Status do contato</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STATUSES).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  status === key ? `${s.bg} ${s.text} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${status === key ? s.dot : 'bg-gray-300'}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Lembretes de retorno</label>
          <div className="space-y-3">
            {lembretes.map((l, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50 relative">
                {lembretes.length > 1 && (
                  <button onClick={() => removeLembrete(i)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                )}
                <div className="flex gap-2">
                  <input type="date" value={l.data} onChange={e => setLembrete(i, 'data', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 bg-white" />
                  <input type="time" value={l.hora} onChange={e => setLembrete(i, 'hora', e.target.value)}
                    className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 bg-white" />
                </div>
                <textarea value={l.obs} onChange={e => setLembrete(i, 'obs', e.target.value)} rows={2}
                  placeholder="Observação do retorno..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 resize-none bg-white" />
              </div>
            ))}
          </div>
          <button onClick={addLembrete}
            className="w-full mt-2 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:text-brand-500 hover:border-brand-300 transition-colors">
            + Adicionar lembrete
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onSalvar({ status, lembretes })}
            className="px-5 py-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl">Salvar</button>
        </div>
      </div>
    </div>
  )
}

export default function PosTratamento({ onNavigate }) {
  const { leads, addLead, updateLead, removeLead } = useLeads()
  const { addLembrete } = useAgenda()
  const { userRole } = useAuth()
  const isAdmin = userRole === 'Administrador'
  const hoje = new Date().toISOString().slice(0, 10)

  const registros = useMemo(() =>
    leads
      .filter(l => l.origem === 'pos_tratamento')
      .sort((a, b) => {
        const aVenc = a.proximoFollowup && a.proximoFollowup < hoje
        const bVenc = b.proximoFollowup && b.proximoFollowup < hoje
        const aHoje = a.proximoFollowup === hoje
        const bHoje = b.proximoFollowup === hoje
        if (aVenc !== bVenc) return aVenc ? -1 : 1
        if (aHoje !== bHoje) return aHoje ? -1 : 1
        if (a.proximoFollowup && b.proximoFollowup) return a.proximoFollowup.localeCompare(b.proximoFollowup)
        return (b.data || '').localeCompare(a.data || '')
      })
  , [leads, hoje])

  const pendentes   = registros.filter(l => l.status === 'pendente').length
  const atrasados   = registros.filter(l => l.proximoFollowup && l.proximoFollowup < hoje && l.status !== 'concluido').length
  const concluidos  = registros.filter(l => l.status === 'concluido').length
  const semResposta = registros.filter(l => l.status === 'sem_resposta').length

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modalNovo, setModalNovo] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)

  const filtrados = registros.filter(l => {
    const matchBusca = !busca || (l.nome || '').toLowerCase().includes(busca.toLowerCase()) || (l.telefone || '').includes(busca)
    const matchStatus = filtroStatus === 'todos' || l.status === filtroStatus
    return matchBusca && matchStatus
  })

  const handleNovo = async (dados) => {
    await addLead(dados)
    setModalNovo(false)
  }

  const handleSalvarEdicao = async (registro, { status, lembretes }) => {
    const primeiro = lembretes?.[0]
    await updateLead(registro.id, {
      status,
      proximoFollowup: primeiro?.data || registro.proximoFollowup || '',
    })
    for (const lem of (lembretes || [])) {
      if (!lem.data) continue
      addLembrete({
        id: Date.now() + Math.random(),
        leadNome: registro.nome,
        leadTelefone: registro.telefone || '',
        descricao: `Pós tratamento — ${registro.nome}${lem.obs ? ': ' + lem.obs : ''}`,
        data: lem.data,
        hora: lem.hora || '09:00',
        cor: 'teal',
        concluido: false,
        criadoEm: Date.now(),
      })
    }
    if (lembretes?.some(l => l.data) && onNavigate) onNavigate('agenda_lembretes')
    setModalEditar(null)
  }

  const abrirInbox = (registro) => {
    if (registro.telefone) {
      sessionStorage.setItem('inbox_abrir_telefone', registro.telefone)
      window.dispatchEvent(new CustomEvent('navegarInbox', {
        detail: { telefone: registro.telefone, contaTipo: 'Leads Recorrentes' }
      }))
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💆 Pós Tratamento</h1>
          <p className="text-sm text-gray-400 mt-1">Acompanhamento pós-atendimento das pacientes</p>
        </div>
        <button onClick={() => setModalNovo(true)}
          className="px-4 py-2.5 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-colors">
          + Nova entrada
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: registros.length, color: 'text-gray-700', bg: 'bg-white' },
          { label: 'Pendentes', value: pendentes, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Sem resposta', value: semResposta, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Concluídos', value: concluidos, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} rounded-2xl p-4 shadow-sm border border-gray-100`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="flex-1 max-w-xs border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300"
        />
        {[
          ['todos', 'Todos'],
          ['pendente', 'Pendentes'],
          ['contatado', 'Contatados'],
          ['sem_resposta', 'Sem resposta'],
          ['concluido', 'Concluídos'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => setFiltroStatus(val)}
            className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${
              filtroStatus === val
                ? 'bg-brand-400 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">💆</p>
            <p className="font-semibold text-gray-600">Nenhum registro encontrado</p>
            <p className="text-sm mt-1">Clique em "+ Nova entrada" para registrar o pós-tratamento de uma paciente.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Nome', 'Contato', 'Status', 'Atendimento', 'Próx. retorno', 'Observações', 'Ações'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((reg) => {
                const vencido = reg.proximoFollowup && reg.proximoFollowup < hoje && reg.status !== 'concluido'
                return (
                  <tr key={reg.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${vencido ? 'bg-red-50/40' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-800">{reg.nome}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{reg.telefone || '—'}</span>
                        {reg.telefone && (
                          <button onClick={() => abrirInbox(reg)} title="Abrir conversa"
                            className="text-green-500 hover:text-green-600 transition-colors flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">{formatData(reg.data)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <ProximoContato data={reg.proximoFollowup} hoje={hoje} />
                    </td>
                    <td className="px-5 py-3 max-w-[160px]">
                      <span className="text-xs text-gray-500 truncate block">{reg.obs || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalEditar(reg)}
                          className="text-xs px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 font-semibold rounded-lg transition-colors">
                          Editar
                        </button>
                        {isAdmin && (
                          <button onClick={() => {
                            if (window.confirm(`Excluir "${reg.nome}"?\n\nEssa ação não pode ser desfeita.`)) removeLead(reg.id)
                          }}
                            className="text-xs px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalNovo && <ModalNovo onSalvar={handleNovo} onFechar={() => setModalNovo(false)} />}
      {modalEditar && (
        <ModalEditar
          lead={modalEditar}
          onSalvar={(dados) => handleSalvarEdicao(modalEditar, dados)}
          onFechar={() => setModalEditar(null)}
        />
      )}
    </div>
  )
}
