import { useState, useRef, useEffect } from 'react'
import { usePacientes } from '../context/PacientesContext'

// Slots de 15 em 15 minutos, das 7:00 às 19:00
const HORARIOS = []
for (let h = 7; h < 19; h++) {
  for (let m = 0; m < 60; m += 15) {
    HORARIOS.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
}

const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DIAS_FULL   = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const MESES       = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_CURTO = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

// Horário de funcionamento por dia da semana (0=Dom,1=Seg...6=Sáb)
const HORARIO_FUNC = {
  0: null,               // Domingo — fechado
  1: ['08:00','18:00'],  // Segunda
  2: ['08:00','18:00'],  // Terça
  3: ['08:00','18:00'],  // Quarta
  4: ['08:00','18:00'],  // Quinta
  5: ['08:00','18:00'],  // Sexta
  6: null,               // Sábado — fechado
}

const STATUS = {
  agendado:   { label: 'Agendado',   bg: 'bg-blue-400',   text: 'text-white', light: 'bg-blue-100 border-blue-300 text-blue-800' },
  confirmado: { label: 'Confirmado', bg: 'bg-green-500',  text: 'text-white', light: 'bg-green-100 border-green-300 text-green-800' },
  atendido:   { label: 'Atendido',   bg: 'bg-gray-400',   text: 'text-white', light: 'bg-gray-100 border-gray-300 text-gray-600' },
  faltou:     { label: 'Faltou',     bg: 'bg-red-400',    text: 'text-white', light: 'bg-red-100 border-red-300 text-red-700' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-orange-400', text: 'text-white', light: 'bg-orange-100 border-orange-300 text-orange-700' },
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getWeekDays(ref) {
  const d = new Date(ref)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff - 1) // começa no domingo
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mon)
    day.setDate(mon.getDate() + i)
    return day
  })
}

function isFechado(dayOfWeek, time) {
  const func = HORARIO_FUNC[dayOfWeek]
  if (!func) return true
  return time < func[0] || time >= func[1]
}

// Mini calendário
function MiniCalendario({ selected, onSelect }) {
  const [view, setView] = useState(new Date(selected))
  const ano = view.getFullYear()
  const mes = view.getMonth()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const hoje = dateKey(new Date())

  const cells = []
  for (let i = 0; i < primeiroDia; i++) cells.push(null)
  for (let d = 1; d <= totalDias; d++) cells.push(d)

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => { const d = new Date(view); d.setMonth(d.getMonth()-1); setView(d) }}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-sm">‹</button>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{MESES[mes].slice(0,3)} {ano}</p>
        <button onClick={() => { const d = new Date(view); d.setMonth(d.getMonth()+1); setView(d) }}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {['D','S','T','Q','Q','S','S'].map((d,i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-semibold py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const dk = `${ano}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const isSelected = dk === dateKey(selected)
          const isHoje = dk === hoje
          return (
            <button key={i} onClick={() => onSelect(new Date(ano, mes, d))}
              className={`text-xs w-7 h-7 rounded-full mx-auto flex items-center justify-center transition-colors
                ${isSelected ? 'bg-pink-400 text-white font-bold' : ''}
                ${isHoje && !isSelected ? 'bg-pink-100 text-pink-600 font-bold' : ''}
                ${!isSelected && !isHoje ? 'text-gray-600 hover:bg-gray-100' : ''}
              `}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Modal({ slot, existing, onClose, onSave, onDelete }) {
  const { pacientes } = usePacientes()
  const [aba, setAba] = useState(existing?.tipo || 'consulta')
  // Consulta
  const [paciente, setPaciente] = useState(existing?.paciente || '')
  const [email, setEmail] = useState(existing?.email || '')
  const [celular, setCelular] = useState(existing?.celular || '')
  const [sugestoes, setSugestoes] = useState([])
  const [showSugestoes, setShowSugestoes] = useState(false)
  const [primeiraConsulta, setPrimeiraConsulta] = useState(existing?.primeiraConsulta || false)
  const [procedimento, setProcedimento] = useState(existing?.procedimento || '')
  const [categoria, setCategoria] = useState(existing?.categoria || '')
  const [obs, setObs] = useState(existing?.obs || '')
  const [status, setStatus] = useState(existing?.status || 'agendado')
  const [duracao, setDuracao] = useState(existing?.duracao || 30)
  // Compromisso
  const [compromisso, setCompromisso] = useState(existing?.compromisso || '')
  const [obsComp, setObsComp] = useState(existing?.obsComp || '')
  const [diaInteiro, setDiaInteiro] = useState(existing?.diaInteiro || false)
  // Evento
  const [evento, setEvento] = useState(existing?.evento || '')
  const [obsEvento, setObsEvento] = useState(existing?.obsEvento || '')

  const handleSave = () => {
    if (aba === 'consulta') {
      onSave({ tipo: 'consulta', paciente, email, celular, primeiraConsulta, procedimento, categoria, obs, status, duracao })
    } else if (aba === 'compromisso') {
      onSave({ tipo: 'compromisso', paciente: compromisso, compromisso, obsComp, diaInteiro, status: 'agendado', duracao: diaInteiro ? 480 : duracao })
    } else {
      onSave({ tipo: 'evento', paciente: evento, evento, obsEvento, status: 'agendado', duracao })
    }
  }

  const canSave = aba === 'consulta' ? paciente.trim() : aba === 'compromisso' ? compromisso.trim() : evento.trim()

  const ABAS = [
    { id: 'consulta', label: 'Consulta' },
    { id: 'compromisso', label: 'Compromisso' },
    { id: 'evento', label: 'Evento' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>

        {/* Header com abas */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1">
            {ABAS.map((a, i) => (
              <div key={a.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-200">|</span>}
                <button onClick={(e) => { e.stopPropagation(); setAba(a.id) }}
                  className={`text-sm px-1 transition-colors ${aba === a.id ? 'font-bold text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                  {aba === a.id ? `Nov${a.id === 'consulta' ? 'a' : 'o'} ${a.label}` : a.label}
                </button>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-pink-500 font-semibold">{slot.dayLabel} — {slot.time}</p>

          {/* ABA CONSULTA */}
          {aba === 'consulta' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <span className="absolute left-0 top-2 text-gray-400 text-sm">🔍</span>
                  <input
                    value={paciente}
                    onChange={e => {
                      const v = e.target.value
                      setPaciente(v)
                      if (v.length >= 2) {
                        const matches = pacientes.filter(p => p.nome.toLowerCase().includes(v.toLowerCase())).slice(0, 5)
                        setSugestoes(matches)
                        setShowSugestoes(matches.length > 0)
                      } else {
                        setShowSugestoes(false)
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
                    placeholder="Paciente"
                    autoFocus
                    className="w-full pl-6 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent"
                  />
                  {showSugestoes && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                      {sugestoes.map(p => (
                        <button key={p.id} onMouseDown={() => {
                          setPaciente(p.nome)
                          setCelular(p.whatsapp || '')
                          setShowSugestoes(false)
                        }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50 flex items-center gap-2 border-b border-gray-50 last:border-0">
                          <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{p.nome}</p>
                            {p.whatsapp && <p className="text-xs text-gray-400">{p.whatsapp}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-0 top-2 text-gray-400 text-sm">✉️</span>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                    className="w-full pl-6 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
                </div>
                <div className="relative">
                  <span className="absolute left-0 top-2 text-gray-400 text-sm">📱</span>
                  <input value={celular} onChange={e => setCelular(e.target.value)} placeholder="Celular"
                    className="w-full pl-6 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={primeiraConsulta} onChange={e => setPrimeiraConsulta(e.target.checked)}
                  className="w-4 h-4 accent-pink-400" />
                <span className="text-sm text-gray-600">Primeira Consulta</span>
              </label>
              <div className="border border-gray-100 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Procedimentos</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <input value={procedimento} onChange={e => setProcedimento(e.target.value)} placeholder="Procedimentos"
                      className="w-full py-1.5 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">⏱</span>
                    <select value={duracao} onChange={e => setDuracao(Number(e.target.value))}
                      className="flex-1 py-1.5 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent">
                      {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d < 60 ? `${d}min` : `${d/60}h${d%60?d%60:''}` }</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Obs"
                    className="py-1.5 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
                  <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    className="py-1.5 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent text-gray-500">
                    <option value="">Categoria</option>
                    <option value="consulta_online">🔵 Consulta On line</option>
                    <option value="paciente_novo">🩵 Consulta Paciente Novo</option>
                    <option value="paciente_modelo">🔴 Paciente Modelo</option>
                    <option value="paciente_recorrente">🟣 Paciente Recorrente - Consulta</option>
                    <option value="paciente_sem_receita">🟠 Paciente sem receita</option>
                    <option value="procedimento">🟢 Procedimento</option>
                    <option value="retorno">🩷 Retorno</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-gray-500">Status:</span>
                {Object.entries(STATUS).map(([k, v]) => (
                  <button key={k} onClick={() => setStatus(k)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border
                      ${status === k ? `${v.bg} ${v.text} border-transparent` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ABA COMPROMISSO */}
          {aba === 'compromisso' && (
            <>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-2">📅</span>
                <input value={compromisso} onChange={e => setCompromisso(e.target.value)} placeholder="Compromisso *"
                  autoFocus className="flex-1 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Profissional:</span>
                <span className="font-semibold text-gray-700">Amanda Lima Silva</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-2">🏷️</span>
                <input value={obsComp} onChange={e => setObsComp(e.target.value)} placeholder="Observações"
                  className="flex-1 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Data</p>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span>📅</span> {slot.dayLabel}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input type="checkbox" checked={diaInteiro} onChange={e => setDiaInteiro(e.target.checked)}
                    className="w-4 h-4 accent-pink-400" />
                  <span className="text-sm text-gray-600">Dia Inteiro</span>
                </label>
              </div>
              {!diaInteiro && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">Horário</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">🕐</span>
                      <span className="text-sm font-semibold text-pink-500">{duracao < 60 ? `${duracao}min` : `${Math.floor(duracao/60)}h${duracao%60?duracao%60:''}`} selecionado</span>
                    </div>
                  </div>
                  {/* Faixa de horários */}
                  <div className="overflow-x-auto pb-1">
                    <div className="flex gap-0.5" style={{ minWidth: 'max-content' }}>
                      {HORARIOS.map(h => {
                        const occupied = (agendamentos || []).some(a => a.date === slot.date && a.time === h)
                        const selected = h === slot.time
                        return (
                          <div key={h}
                            title={h}
                            className={`flex flex-col items-center cursor-pointer select-none`}
                            style={{ width: '28px' }}
                          >
                            <div className={`w-full rounded-sm transition-colors
                              ${selected ? 'bg-pink-400' : occupied ? 'bg-red-300' : 'bg-gray-200 hover:bg-pink-200'}
                            `} style={{ height: '28px' }} />
                            {h.endsWith(':00') && (
                              <span className="text-xs text-gray-400 mt-0.5 whitespace-nowrap" style={{ fontSize: '9px' }}>{h.slice(0,5)}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">Duração:</span>
                    <div className="flex gap-1 flex-wrap">
                      {[15,30,45,60,90,120].map(d => (
                        <button key={d} onClick={() => setDuracao(d)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors
                            ${duracao === d ? 'bg-pink-400 text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          {d < 60 ? `${d}min` : `${Math.floor(d/60)}h${d%60?d%60:''}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ABA EVENTO */}
          {aba === 'evento' && (
            <>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-2">🎯</span>
                <input value={evento} onChange={e => setEvento(e.target.value)} placeholder="Nome do Evento *"
                  autoFocus className="flex-1 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Data e Horário:</span>
                <span className="font-semibold text-gray-700">{slot.dayLabel} — {slot.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">⏱</span>
                <select value={duracao} onChange={e => setDuracao(Number(e.target.value))}
                  className="py-1.5 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent">
                  {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d < 60 ? `${d}min` : `${d/60}h${d%60?d%60:''}`}</option>)}
                </select>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-2">🏷️</span>
                <input value={obsEvento} onChange={e => setObsEvento(e.target.value)} placeholder="Observações"
                  className="flex-1 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-pink-400 bg-transparent" />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div>
            {existing && (
              <button onClick={() => onDelete(existing.id)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-50 border border-red-100">
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!canSave}
              className="px-6 py-2 rounded-lg bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white text-sm font-semibold">
              Agendar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Agenda() {
  const today = new Date()
  const [refDate, setRefDate] = useState(today)
  const [modal, setModal] = useState(null)
  const [agendamentos, setAgendamentos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agenda_agendamentos') || '[]') } catch { return [] }
  })

  const weekDays = getWeekDays(refDate)
  const todayKey = dateKey(today)

  const navWeek = (n) => {
    const d = new Date(refDate); d.setDate(d.getDate() + n * 7); setRefDate(d)
  }

  const save = (list) => {
    setAgendamentos(list)
    localStorage.setItem('agenda_agendamentos', JSON.stringify(list))
  }

  const getAppt = (day, time) => {
    const dk = dateKey(day)
    return agendamentos.find(a => a.date === dk && a.time === time)
  }

  const isOccupied = (day, time) => {
    const dk = dateKey(day)
    const idx = HORARIOS.indexOf(time)
    return agendamentos.some(a => {
      if (a.date !== dk) return false
      const ai = HORARIOS.indexOf(a.time)
      const slots = a.duracao / 15
      return idx > ai && idx < ai + slots
    })
  }

  const openModal = (day, time) => {
    const appt = getAppt(day, time)
    const dayLabel = `${DIAS_FULL[day.getDay()]}, ${day.getDate()} de ${MESES[day.getMonth()]}`
    setModal({ date: dateKey(day), time, dayLabel, existing: appt || null })
  }

  const handleSave = ({ paciente, procedimento, status, duracao, telefone }) => {
    if (modal.existing) {
      save(agendamentos.map(a => a.id === modal.existing.id ? { ...a, paciente, procedimento, status, duracao, telefone } : a))
    } else {
      save([...agendamentos, { id: Date.now().toString(), date: modal.date, time: modal.time, paciente, procedimento, status, duracao, telefone }])
    }
    setModal(null)
  }

  const handleDelete = (id) => { save(agendamentos.filter(a => a.id !== id)); setModal(null) }

  // Label da semana
  const dom = weekDays[0], sab = weekDays[6]
  const semanaLabel = `${DIAS_SEMANA[dom.getDay()]} ${dom.getDate()} – ${DIAS_SEMANA[sab.getDay()]} ${sab.getDate()} de ${MESES[sab.getMonth()]} de ${sab.getFullYear()}`

  // Dia selecionado para o mini calendário
  const handleSelectDay = (d) => setRefDate(d)

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>

      {/* Sidebar esquerda */}
      <div className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Clínica Amanda Lima</p>
        </div>

        <MiniCalendario selected={refDate} onSelect={handleSelectDay} />

        <div className="px-3 py-2 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Profissional</p>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-pink-50 border border-pink-100">
            <div className="w-5 h-5 rounded-full bg-pink-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
            <span className="text-xs font-semibold text-pink-700 truncate">Amanda Lima Silva</span>
          </div>
        </div>

        {/* Próximos agendamentos */}
        <div className="px-3 py-2 border-t border-gray-100 flex-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Próximos</p>
          {agendamentos
            .filter(a => a.date >= dateKey(today))
            .sort((a, b) => a.date + a.time > b.date + b.time ? 1 : -1)
            .slice(0, 8)
            .map(a => {
              const cfg = STATUS[a.status]
              return (
                <div key={a.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.bg}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{a.paciente}</p>
                    <p className="text-xs text-gray-400">{a.time} · {a.date.slice(8)}/{a.date.slice(5,7)}</p>
                  </div>
                </div>
              )
            })
          }
          {agendamentos.filter(a => a.date >= dateKey(today)).length === 0 && (
            <p className="text-xs text-gray-300 italic">Nenhum agendamento</p>
          )}
        </div>
      </div>

      {/* Grade principal */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => navWeek(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 font-bold text-lg transition-colors">‹</button>
          <button onClick={() => navWeek(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 font-bold text-lg transition-colors">›</button>
          <button onClick={() => setRefDate(new Date())}
            className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Hoje</button>
          <p className="text-sm font-semibold text-gray-700 flex-1">{semanaLabel}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {Object.entries(STATUS).map(([k,v]) => (
              <div key={k} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${v.bg}`} />
                <span>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grade */}
        <div className="flex-1 overflow-auto">
          <table className="border-collapse" style={{ tableLayout: 'fixed', width: '100%', minWidth: '700px' }}>
            <colgroup>
              <col style={{ width: '52px' }} />
              {weekDays.map((_, i) => <col key={i} />)}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th className="border-b border-r border-gray-100" />
                {weekDays.map((day, i) => {
                  const isToday = dateKey(day) === todayKey
                  const dow = day.getDay()
                  const fechado = !HORARIO_FUNC[dow]
                  return (
                    <th key={i} className={`border-b border-r border-gray-100 py-2 text-center
                      ${isToday ? 'bg-pink-50' : fechado ? 'bg-blue-50' : 'bg-white'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wide
                        ${isToday ? 'text-pink-400' : fechado ? 'text-blue-400' : 'text-gray-400'}`}>
                        {DIAS_SEMANA[dow]}
                      </p>
                      <p className={`text-base font-bold leading-tight
                        ${isToday ? 'text-pink-500' : fechado ? 'text-blue-400' : 'text-gray-700'}`}>
                        {day.getDate()}
                      </p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map((time) => {
                const isHour = time.endsWith(':00')
                const isHalf = time.endsWith(':30')
                const isQuarter = !isHour && !isHalf
                return (
                  <tr key={time} style={{ height: '24px' }}>
                    <td className={`border-r border-gray-200 text-right pr-1.5 align-top
                      ${isHour ? 'border-t border-gray-300' : isHalf ? 'border-t border-gray-200' : 'border-t border-gray-100'}`}
                      style={{ height: '24px' }}>
                      {isHour && <span className="text-xs text-gray-400 font-medium">{time}</span>}
                      {isHalf && <span className="text-xs text-gray-300">{time}</span>}
                    </td>
                    {weekDays.map((day, di) => {
                      if (isOccupied(day, time)) return null

                      const dow = day.getDay()
                      const fechado = isFechado(dow, time)
                      const appt = getAppt(day, time)
                      const rowSpan = appt ? appt.duracao / 15 : 1
                      const isToday = dateKey(day) === todayKey
                      const cfg = appt ? STATUS[appt.status] : null
                      const borderClass = isHour ? 'border-t border-gray-300' : isHalf ? 'border-t border-gray-200' : 'border-t border-gray-100'

                      if (fechado && !appt) {
                        return (
                          <td key={di} className={`border-r border-gray-200 bg-blue-50 ${borderClass}`}
                            style={{ height: '24px' }}>
                            {isHour && time === '07:00' && (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-xs font-bold text-blue-300 tracking-widest">FECHADO</span>
                              </div>
                            )}
                          </td>
                        )
                      }

                      return (
                        <td key={di} rowSpan={rowSpan}
                          onClick={() => !fechado && openModal(day, time)}
                          className={`border-r border-gray-200 align-top p-0 transition-colors
                            ${borderClass}
                            ${!appt && isToday ? 'bg-pink-50/30 hover:bg-pink-100/40 cursor-pointer' : ''}
                            ${!appt && !isToday ? 'hover:bg-gray-50 cursor-pointer' : ''}
                          `}
                          style={{ height: '24px' }}>
                          {appt && (
                            <div onClick={() => openModal(day, time)}
                              className={`w-full h-full px-1.5 py-0.5 cursor-pointer overflow-hidden ${cfg.bg} ${cfg.text} rounded-sm`}
                              style={{ minHeight: `${rowSpan * 22}px` }}>
                              <p className="text-xs font-bold leading-tight truncate">{appt.paciente}</p>
                              {rowSpan >= 3 && appt.procedimento && (
                                <p className="text-xs leading-tight truncate opacity-80">{appt.procedimento}</p>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal slot={modal} existing={modal.existing} onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDelete} />
      )}
    </div>
  )
}
