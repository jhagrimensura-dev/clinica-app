import { useState, useRef } from 'react'

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
  const [paciente, setPaciente] = useState(existing?.paciente || '')
  const [procedimento, setProcedimento] = useState(existing?.procedimento || '')
  const [status, setStatus] = useState(existing?.status || 'agendado')
  const [duracao, setDuracao] = useState(existing?.duracao || 30)
  const [telefone, setTelefone] = useState(existing?.telefone || '')

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-800">{existing ? 'Editar' : 'Novo'} Agendamento</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-pink-500 font-semibold mb-4">{slot.dayLabel} — {slot.time}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Paciente *</label>
            <input value={paciente} onChange={e => setPaciente(e.target.value)} placeholder="Nome do paciente"
              autoFocus className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Telefone</label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Procedimento</label>
            <input value={procedimento} onChange={e => setProcedimento(e.target.value)} placeholder="Ex: Consulta, Limpeza, Botox..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Duração</label>
              <select value={duracao} onChange={e => setDuracao(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h30</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {existing && (
            <button onClick={() => onDelete(existing.id)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-50">Excluir</button>
          )}
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onSave({ paciente, procedimento, status, duracao, telefone })} disabled={!paciente.trim()}
            className="flex-1 py-2 rounded-lg bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white text-sm font-semibold">Salvar</button>
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
                const showLabel = time.endsWith(':00')
                return (
                  <tr key={time} style={{ height: '22px' }}>
                    <td className={`border-r border-gray-100 text-right pr-1.5 align-top ${showLabel ? 'border-t border-gray-100' : ''}`}
                      style={{ height: '22px' }}>
                      {showLabel && <span className="text-xs text-gray-300">{time}</span>}
                    </td>
                    {weekDays.map((day, di) => {
                      if (isOccupied(day, time)) return null

                      const dow = day.getDay()
                      const fechado = isFechado(dow, time)
                      const appt = getAppt(day, time)
                      const rowSpan = appt ? appt.duracao / 15 : 1
                      const isToday = dateKey(day) === todayKey
                      const cfg = appt ? STATUS[appt.status] : null
                      const showBorder = showLabel

                      if (fechado && !appt) {
                        return (
                          <td key={di} className={`border-r border-gray-100 bg-blue-50 ${showBorder ? 'border-t border-blue-100' : ''}`}
                            style={{ height: '22px' }}>
                            {showLabel && time === '07:00' && (
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
                          className={`border-r border-gray-100 align-top p-0 transition-colors
                            ${showBorder ? 'border-t border-gray-100' : ''}
                            ${!appt && isToday ? 'bg-pink-50/30 hover:bg-pink-100/40 cursor-pointer' : ''}
                            ${!appt && !isToday ? 'hover:bg-gray-50 cursor-pointer' : ''}
                          `}
                          style={{ height: '22px' }}>
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
