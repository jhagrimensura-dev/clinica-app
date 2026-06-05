import { useState } from 'react'

const HORARIOS = []
for (let h = 8; h < 19; h++) {
  HORARIOS.push(`${String(h).padStart(2,'0')}:00`)
  if (h < 18) HORARIOS.push(`${String(h).padStart(2,'0')}:30`)
}

const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const MESES_CURTO = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

const STATUS = {
  agendado:   { label: 'Agendado',   bg: 'bg-blue-100 border-blue-300 text-blue-800' },
  confirmado: { label: 'Confirmado', bg: 'bg-green-100 border-green-300 text-green-800' },
  atendido:   { label: 'Atendido',   bg: 'bg-gray-100 border-gray-300 text-gray-600' },
  faltou:     { label: 'Faltou',     bg: 'bg-red-100 border-red-300 text-red-700' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-orange-100 border-orange-300 text-orange-700' },
}

function getWeekDays(ref) {
  const d = new Date(ref)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return Array.from({ length: 6 }, (_, i) => {
    const day = new Date(mon)
    day.setDate(mon.getDate() + i)
    return day
  })
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function Modal({ slot, existing, onClose, onSave, onDelete }) {
  const [paciente, setPaciente] = useState(existing?.paciente || '')
  const [procedimento, setProcedimento] = useState(existing?.procedimento || '')
  const [status, setStatus] = useState(existing?.status || 'agendado')
  const [duracao, setDuracao] = useState(existing?.duracao || 30)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-800 text-base">{existing ? 'Editar' : 'Novo'} Agendamento</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-pink-500 font-semibold mb-5">{slot.dayLabel} — {slot.time}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Paciente *</label>
            <input value={paciente} onChange={e => setPaciente(e.target.value)} placeholder="Nome do paciente"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Procedimento</label>
            <input value={procedimento} onChange={e => setProcedimento(e.target.value)} placeholder="Ex: Consulta, Limpeza, Botox..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Duração</label>
              <select value={duracao} onChange={e => setDuracao(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                <option value={30}>30 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h30</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {existing && (
            <button onClick={() => onDelete(existing.id)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              Excluir
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onSave({ paciente, procedimento, status, duracao })} disabled={!paciente.trim()}
            className="flex-1 py-2.5 rounded-lg bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white text-sm font-semibold transition-colors">
            Salvar
          </button>
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
    try { return JSON.parse(localStorage.getItem('agenda_agendamentos') || '[]') }
    catch { return [] }
  })

  const weekDays = getWeekDays(refDate)
  const todayKey = dateKey(today)

  const navWeek = (n) => {
    const d = new Date(refDate)
    d.setDate(d.getDate() + n * 7)
    setRefDate(d)
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
      const slots = a.duracao / 30
      return idx > ai && idx < ai + slots
    })
  }

  const openModal = (day, time) => {
    const appt = getAppt(day, time)
    const dayLabel = `${DIAS_SEMANA[day.getDay()]}, ${day.getDate()} de ${MESES[day.getMonth()]}`
    setModal({ date: dateKey(day), time, dayLabel, existing: appt || null })
  }

  const handleSave = ({ paciente, procedimento, status, duracao }) => {
    if (modal.existing) {
      save(agendamentos.map(a => a.id === modal.existing.id ? { ...a, paciente, procedimento, status, duracao } : a))
    } else {
      save([...agendamentos, { id: Date.now().toString(), date: modal.date, time: modal.time, paciente, procedimento, status, duracao }])
    }
    setModal(null)
  }

  const handleDelete = (id) => {
    save(agendamentos.filter(a => a.id !== id))
    setModal(null)
  }

  const mon = weekDays[0]
  const sat = weekDays[5]
  const weekLabel = mon.getMonth() === sat.getMonth()
    ? `${mon.getDate()} a ${sat.getDate()} de ${MESES[sat.getMonth()]} de ${sat.getFullYear()}`
    : `${mon.getDate()} de ${MESES_CURTO[mon.getMonth()]} — ${sat.getDate()} de ${MESES_CURTO[sat.getMonth()]} de ${sat.getFullYear()}`

  return (
    <div className="p-6 space-y-4">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visão semanal de agendamentos</p>
        </div>
        <button onClick={() => setRefDate(new Date())}
          className="px-4 py-2 rounded-lg bg-pink-100 text-pink-600 text-sm font-semibold hover:bg-pink-200 transition-colors">
          Hoje
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Navegação de semana */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button onClick={() => navWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl font-bold transition-colors">‹</button>
          <p className="text-sm font-semibold text-gray-700">{weekLabel}</p>
          <button onClick={() => navWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl font-bold transition-colors">›</button>
        </div>

        {/* Grade */}
        <div className="overflow-auto" style={{ maxHeight: '560px' }}>
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: '52px' }} />
              {weekDays.map((_, i) => <col key={i} />)}
            </colgroup>
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr>
                <th className="border-b border-r border-gray-100" />
                {weekDays.map((day, i) => {
                  const isToday = dateKey(day) === todayKey
                  return (
                    <th key={i} className={`border-b border-r border-gray-100 py-2 px-1 text-center ${isToday ? 'bg-pink-50' : ''}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-pink-400' : 'text-gray-400'}`}>
                        {DIAS_SEMANA[day.getDay()]}
                      </p>
                      <p className={`text-lg font-bold leading-tight ${isToday ? 'text-pink-500' : 'text-gray-700'}`}>
                        {day.getDate()}
                      </p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map((time) => (
                <tr key={time}>
                  <td className="border-r border-gray-100 align-top pr-2 pt-0.5" style={{ height: '40px' }}>
                    {time.endsWith(':00') && (
                      <span className="text-xs text-gray-300 block text-right">{time}</span>
                    )}
                  </td>
                  {weekDays.map((day, di) => {
                    if (isOccupied(day, time)) return null

                    const appt = getAppt(day, time)
                    const rowSpan = appt ? appt.duracao / 30 : 1
                    const isToday = dateKey(day) === todayKey
                    const cfg = appt ? STATUS[appt.status] : null

                    return (
                      <td
                        key={di}
                        rowSpan={rowSpan}
                        onClick={() => openModal(day, time)}
                        style={{ height: '40px' }}
                        className={`border-b border-r border-gray-50 cursor-pointer align-top p-0.5 transition-colors
                          ${!appt && isToday ? 'bg-pink-50/40 hover:bg-pink-100/40' : ''}
                          ${!appt && !isToday ? 'hover:bg-gray-50' : ''}
                        `}
                      >
                        {appt && (
                          <div className={`w-full h-full rounded-md border px-1.5 py-1 overflow-hidden ${cfg.bg}`} style={{ minHeight: `${rowSpan * 40 - 4}px` }}>
                            <p className="text-xs font-bold leading-tight truncate">{appt.paciente}</p>
                            {appt.procedimento && <p className="text-xs leading-tight truncate opacity-70">{appt.procedimento}</p>}
                            <p className="text-xs leading-tight opacity-50 mt-0.5">{appt.time} · {appt.duracao}min</p>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${v.bg}`} />
            <span className="text-xs text-gray-500">{v.label}</span>
          </div>
        ))}
        <p className="text-xs text-gray-300 ml-auto">Clique em qualquer horário para agendar</p>
      </div>

      {modal && (
        <Modal slot={modal} existing={modal.existing} onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDelete} />
      )}
    </div>
  )
}
