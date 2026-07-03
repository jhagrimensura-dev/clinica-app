import { useState, useMemo, useRef, useEffect } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useAuth } from '../context/AuthContext'
import { usePacientes } from '../context/PacientesContext'

const STATUSES = {
  pendente:     { label: 'Pendente',     bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  contatado:    { label: 'Contatado',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  sem_resposta: { label: 'Sem resposta', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  concluido:    { label: 'Concluído',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400'  },
}

const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatData(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function parseLembretes(obs) {
  try { const p = JSON.parse(obs || '{}'); return Array.isArray(p.lembretes) ? p.lembretes : [] } catch { return [] }
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

// ─── Calendário semanal (estilo Agenda) ──────────────────────────────────────
const DIAS_FULL  = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']
const MESES_PT   = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const SLOT_H_PX  = 40 // height per 30-min slot

const SLOTS = []
for (let h = 7; h <= 20; h++) {
  SLOTS.push(`${String(h).padStart(2,'0')}:00`)
  if (h < 20) SLOTS.push(`${String(h).padStart(2,'0')}:30`)
}

const STATUS_SLOT = {
  pendente:     'bg-yellow-100 text-yellow-800 border-yellow-300',
  contatado:    'bg-blue-100   text-blue-800   border-blue-300',
  sem_resposta: 'bg-orange-100 text-orange-800 border-orange-300',
  concluido:    'bg-green-100  text-green-700  border-green-300',
}

function semanaRef0(data) {
  const d = new Date(data)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function CalendarioPos({ registros, onSelectDia }) {
  const hojeDate = new Date()
  const hojeStr  = hojeDate.toISOString().slice(0, 10)

  const [semana, setSemana] = useState(() => semanaRef0(hojeDate))
  const [miniMes, setMiniMes] = useState(hojeDate.getMonth())
  const [miniAno, setMiniAno] = useState(hojeDate.getFullYear())

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semana)
    d.setDate(semana.getDate() + i)
    return d
  })

  const navSemana = (delta) => setSemana(prev => {
    const d = new Date(prev); d.setDate(d.getDate() + delta * 7); return d
  })
  const irHoje = () => setSemana(semanaRef0(new Date()))

  const dom = diasSemana[0], sab = diasSemana[6]
  const semanaLabel = `Dom ${dom.getDate()} – Sáb ${sab.getDate()} de ${MESES_PT[sab.getMonth()]} de ${sab.getFullYear()}`

  // index: date → [{ ...reg, lembHora }]
  const lembMap = useMemo(() => {
    const map = {}
    registros.forEach(r => {
      parseLembretes(r.obs).forEach(l => {
        if (!l.data) return
        if (!map[l.data]) map[l.data] = []
        map[l.data].push({ ...r, lembHora: l.hora || '09:00', lembObs: l.obs })
      })
    })
    return map
  }, [registros])

  const getSlotEntries = (dayStr, slot) => {
    const [sh, sm] = slot.split(':').map(Number)
    const slotMin = sh * 60 + sm
    return (lembMap[dayStr] || []).filter(e => {
      const [eh, em] = (e.lembHora || '09:00').split(':').map(Number)
      const em2 = eh * 60 + em
      return em2 >= slotMin && em2 < slotMin + 30
    })
  }

  // próximos a partir de hoje
  const proximos = useMemo(() => {
    const arr = []
    registros.forEach(r => parseLembretes(r.obs).forEach(l => {
      if (l.data && l.data >= hojeStr) arr.push({ ...r, lembHora: l.hora, lembData: l.data })
    }))
    return arr.sort((a,b) => a.lembData.localeCompare(b.lembData) || (a.lembHora||'').localeCompare(b.lembHora||'')).slice(0, 6)
  }, [registros, hojeStr])

  // mini calendar
  const miniPrimeiro = new Date(miniAno, miniMes, 1).getDay()
  const miniTotal    = new Date(miniAno, miniMes + 1, 0).getDate()
  const miniCells    = [...Array(miniPrimeiro).fill(null), ...Array.from({ length: miniTotal }, (_, i) => i + 1)]
  const navMini = (d) => {
    let nm = miniMes + d, na = miniAno
    if (nm < 0) { nm = 11; na-- } else if (nm > 11) { nm = 0; na++ }
    setMiniMes(nm); setMiniAno(na)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex" style={{ height: '560px' }}>

      {/* ── Sidebar esquerda ─────────────────────── */}
      <div className="w-44 border-r border-gray-100 flex flex-col flex-shrink-0 overflow-y-auto">
        {/* mini cal */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <button onClick={() => navMini(-1)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm">‹</button>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{MESES_NOME[miniMes].slice(0,3)} {miniAno}</span>
            <button onClick={() => navMini(1)}  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm">›</button>
          </div>
          <div className="grid grid-cols-7">
            {['D','S','T','Q','Q','S','S'].map((d,i) => (
              <div key={i} className="text-center text-[9px] font-semibold text-gray-400 py-0.5">{d}</div>
            ))}
            {miniCells.map((d, i) => {
              if (!d) return <div key={i} />
              const ds = `${miniAno}-${String(miniMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
              const isHoje = ds === hojeStr
              const hasPac = !!lembMap[ds]
              return (
                <button key={i} onClick={() => setSemana(semanaRef0(new Date(miniAno, miniMes, d)))}
                  className={`text-[10px] w-5 h-5 mx-auto flex items-center justify-center rounded-full font-medium transition-colors ${
                    isHoje ? 'bg-brand-400 text-white' : hasPac ? 'text-teal-600 font-bold' : 'text-gray-500 hover:bg-gray-100'
                  }`}>{d}</button>
              )
            })}
          </div>
        </div>

        {/* próximos */}
        <div className="px-3 pb-3 flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Próximos</p>
          {proximos.length === 0
            ? <p className="text-[10px] text-gray-300">Nenhum agendado</p>
            : proximos.map((p, i) => (
              <div key={i} className="mb-2 cursor-pointer" onClick={() => { setSemana(semanaRef0(new Date(p.lembData))); onSelectDia(p.lembData) }}>
                <p className="text-[10px] text-brand-500 font-semibold">{formatData(p.lembData)}{p.lembHora ? ` · ${p.lembHora}` : ''}</p>
                <p className="text-[11px] text-gray-700 font-medium truncate">{p.nome}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Área principal ───────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* top bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => navSemana(-1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-base">‹</button>
          <button onClick={() => navSemana(1)}  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-base">›</button>
          <button onClick={irHoje} className="px-3 py-1 rounded-lg border border-brand-200 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors">Hoje</button>
          <span className="text-sm font-semibold text-gray-700 flex-1">{semanaLabel}</span>
        </div>

        {/* day headers */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <div className="w-14 flex-shrink-0" />
          {diasSemana.map((day, i) => {
            const ds = day.toISOString().slice(0, 10)
            const isHoje = ds === hojeStr
            return (
              <div key={i} className={`flex-1 py-2 text-center border-l border-gray-100 ${isHoje ? 'bg-brand-50' : ''}`}>
                <p className={`text-[10px] font-semibold ${isHoje ? 'text-brand-500' : 'text-gray-400'}`}>{DIAS_FULL[i]}</p>
                <p className={`text-sm font-bold ${isHoje ? 'text-brand-600' : 'text-gray-700'}`}>{day.getDate()}</p>
              </div>
            )
          })}
        </div>

        {/* time grid */}
        <div className="flex-1 overflow-y-auto">
          {SLOTS.map((slot, si) => (
            <div key={si} className="flex" style={{ height: `${SLOT_H_PX}px` }}>
              <div className="w-14 flex-shrink-0 flex items-start justify-end pr-2 pt-0.5">
                {slot.endsWith(':00') && <span className="text-[10px] text-gray-400">{slot}</span>}
              </div>
              {diasSemana.map((day, di) => {
                const ds = day.toISOString().slice(0, 10)
                const entries = getSlotEntries(ds, slot)
                const isHoje = ds === hojeStr
                return (
                  <div key={di} className={`flex-1 border-l border-t border-gray-100 relative px-0.5 py-0.5 ${isHoje ? 'bg-brand-50/20' : ''} ${slot.endsWith(':00') ? '' : 'border-t-dashed'}`}>
                    {entries.map((e, ei) => (
                      <div key={ei}
                        onClick={() => onSelectDia(ds)}
                        className={`w-full rounded border px-1.5 py-0.5 text-[10px] font-semibold truncate cursor-pointer leading-tight ${STATUS_SLOT[e.status] || 'bg-teal-100 text-teal-800 border-teal-300'}`}>
                        <span className="opacity-70">{e.lembHora} </span>{e.nome}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Modal Novo ───────────────────────────────────────────────────────────────
function ModalNovo({ onSalvar, onFechar }) {
  const { pacientes } = usePacientes()
  const hoje = new Date().toISOString().slice(0, 10)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [data, setData] = useState(hoje)
  const [lembretes, setLembretes] = useState([
    { data: '', hora: '09:00', obs: '' },
    { data: '', hora: '09:00', obs: '' },
    { data: '', hora: '09:00', obs: '' },
  ])
  const [sugestoes, setSugestoes] = useState([])
  const [showSug, setShowSug] = useState(false)
  const inputRef = useRef(null)

  const setLembrete = (i, field, val) => setLembretes(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  const addLembrete = () => setLembretes(prev => [...prev, { data: '', hora: '09:00', obs: '' }])
  const removeLembrete = (i) => setLembretes(prev => prev.filter((_, idx) => idx !== i))

  const handleNomeChange = (val) => {
    setNome(val)
    if (val.trim().length < 2) { setSugestoes([]); setShowSug(false); return }
    const matches = pacientes.filter(p => p.nome.toLowerCase().includes(val.toLowerCase())).slice(0, 6)
    setSugestoes(matches); setShowSug(matches.length > 0)
  }

  const selecionarPaciente = (p) => { setNome(p.nome); setTelefone(p.whatsapp || ''); setSugestoes([]); setShowSug(false) }

  useEffect(() => {
    const fechar = (e) => { if (!inputRef.current?.parentElement?.contains(e.target)) setShowSug(false) }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Novo Pós Procedimento</h2>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 relative" ref={inputRef}>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome <span className="text-red-400">*</span></label>
            <input value={nome} onChange={e => handleNomeChange(e.target.value)}
              onFocus={() => sugestoes.length > 0 && setShowSug(true)}
              placeholder="Buscar paciente pelo nome..." autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
            {showSug && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {sugestoes.map(p => (
                  <button key={p.id} type="button" onMouseDown={() => selecionarPaciente(p)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors flex items-center justify-between">
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
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Lembrete de Pós procedimento</label>
          <div className="space-y-2">
            {lembretes.map((l, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>
                  <input type="date" value={l.data} onChange={e => setLembrete(i, 'data', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white" />
                  <input type="time" value={l.hora} onChange={e => setLembrete(i, 'hora', e.target.value)}
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white" />
                  {lembretes.length > 1 && (
                    <button onClick={() => removeLembrete(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0">×</button>
                  )}
                </div>
                <input value={l.obs} onChange={e => setLembrete(i, 'obs', e.target.value)}
                  placeholder="Observação do lembrete..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white" />
              </div>
            ))}
          </div>
          <button onClick={addLembrete}
            className="w-full mt-2 py-1.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:text-brand-500 hover:border-brand-300 transition-colors">
            + Adicionar lembrete
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button disabled={!nome.trim()}
            onClick={() => onSalvar({ nome: nome.trim(), telefone, data, lembretes, status: 'pendente', origem: 'pos_tratamento' })}
            className="px-5 py-2 bg-brand-400 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Editar ─────────────────────────────────────────────────────────────
function ModalEditar({ lead, onSalvar, onFechar }) {
  const existingLems = parseLembretes(lead.obs)
  const [status, setStatus] = useState(lead.status || 'pendente')
  const [lembretes, setLembretes] = useState(
    existingLems.length > 0
      ? existingLems
      : [{ data: lead.proximoFollowup || '', hora: '09:00', obs: '' },
         { data: '', hora: '09:00', obs: '' },
         { data: '', hora: '09:00', obs: '' }]
  )

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
              <button key={key} onClick={() => setStatus(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  status === key ? `${s.bg} ${s.text} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                <span className={`w-2 h-2 rounded-full ${status === key ? s.dot : 'bg-gray-300'}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Lembrete de Pós procedimento</label>
          <div className="space-y-2">
            {lembretes.map((l, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>
                  <input type="date" value={l.data} onChange={e => setLembrete(i, 'data', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white" />
                  <input type="time" value={l.hora} onChange={e => setLembrete(i, 'hora', e.target.value)}
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white" />
                  {lembretes.length > 1 && (
                    <button onClick={() => removeLembrete(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0">×</button>
                  )}
                </div>
                <input value={l.obs} onChange={e => setLembrete(i, 'obs', e.target.value)}
                  placeholder="Observação do lembrete..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white" />
              </div>
            ))}
          </div>
          <button onClick={addLembrete}
            className="w-full mt-2 py-1.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:text-brand-500 hover:border-brand-300 transition-colors">
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

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PosTratamento() {
  const { leads, addLead, updateLead, removeLead } = useLeads()
  const { userRole } = useAuth()
  const isAdmin = userRole === 'Administrador'
  const hoje = new Date().toISOString().slice(0, 10)

  const registros = useMemo(() =>
    leads
      .filter(l => l.origem === 'pos_tratamento')
      .sort((a, b) => {
        const aVenc = a.proximoFollowup && a.proximoFollowup < hoje
        const bVenc = b.proximoFollowup && b.proximoFollowup < hoje
        if (aVenc !== bVenc) return aVenc ? -1 : 1
        if (a.proximoFollowup && b.proximoFollowup) return a.proximoFollowup.localeCompare(b.proximoFollowup)
        return (b.data || '').localeCompare(a.data || '')
      })
  , [leads, hoje])

  const pendentes   = registros.filter(l => l.status === 'pendente').length
  const concluidos  = registros.filter(l => l.status === 'concluido').length
  const semResposta = registros.filter(l => l.status === 'sem_resposta').length

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [modalNovo, setModalNovo] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)

  const filtrados = registros.filter(l => {
    const matchBusca = !busca || (l.nome || '').toLowerCase().includes(busca.toLowerCase()) || (l.telefone || '').includes(busca)
    const matchStatus = filtroStatus === 'todos' || l.status === filtroStatus
    const matchDia = !diaSelecionado || parseLembretes(l.obs).some(lem => lem.data === diaSelecionado)
    return matchBusca && matchStatus && matchDia
  })

  const handleNovo = async (dados) => {
    const { lembretes, ...leadDados } = dados
    const lemsValidos = (lembretes || []).filter(l => l.data)
    const obs = lemsValidos.length > 0 ? JSON.stringify({ lembretes: lemsValidos }) : ''
    const proximoFollowup = lemsValidos[0]?.data || ''
    await addLead({ ...leadDados, obs, proximoFollowup })
    setModalNovo(false)
  }

  const handleSalvarEdicao = async (registro, { status, lembretes }) => {
    const lemsValidos = (lembretes || []).filter(l => l.data)
    const obs = lemsValidos.length > 0 ? JSON.stringify({ lembretes: lemsValidos }) : ''
    const proximoFollowup = lemsValidos[0]?.data || ''
    await updateLead(registro.id, { status, proximoFollowup, obs })
    setModalEditar(null)
  }

  const abrirInbox = (reg) => {
    if (reg.telefone) {
      sessionStorage.setItem('inbox_abrir_telefone', reg.telefone)
      window.dispatchEvent(new CustomEvent('navegarInbox', {
        detail: { telefone: reg.telefone, contaTipo: 'Leads Recorrentes' }
      }))
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💆 Pós Procedimento</h1>
          <p className="text-sm text-gray-400 mt-1">Acompanhamento pós-atendimento das pacientes</p>
        </div>
        <button onClick={() => setModalNovo(true)}
          className="px-4 py-2.5 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-colors">
          + Nova entrada
        </button>
      </div>

      {/* Calendário */}
      <CalendarioPos registros={registros} diaSelecionado={diaSelecionado} onSelectDia={setDiaSelecionado} />

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
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="flex-1 max-w-xs border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
        {diaSelecionado && (
          <button onClick={() => setDiaSelecionado(null)}
            className="px-3 py-2 text-xs rounded-xl font-medium bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200 transition-colors">
            📅 {formatData(diaSelecionado)} ×
          </button>
        )}
        {[['todos','Todos'],['pendente','Pendentes'],['contatado','Contatados'],['sem_resposta','Sem resposta'],['concluido','Concluídos']].map(([val, label]) => (
          <button key={val} onClick={() => setFiltroStatus(val)}
            className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${
              filtroStatus === val ? 'bg-brand-400 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-300'
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
                {['Nome', 'Contato', 'Atendimento', 'Próx. retorno', 'Ações'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((reg) => {
                const vencido = reg.proximoFollowup && reg.proximoFollowup < hoje && reg.status !== 'concluido'
                return (
                  <tr key={reg.id} onClick={() => setModalEditar(reg)}
                    className={`border-t border-gray-50 hover:bg-brand-50/40 cursor-pointer transition-colors ${vencido ? 'bg-red-50/40' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-800">{reg.nome}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{reg.telefone || '—'}</span>
                        {reg.telefone && (
                          <button onClick={e => { e.stopPropagation(); abrirInbox(reg) }} title="Abrir conversa"
                            className="text-green-500 hover:text-green-600 transition-colors flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-xs text-gray-500">{formatData(reg.data)}</span></td>
                    <td className="px-5 py-3"><ProximoContato data={reg.proximoFollowup} hoje={hoje} /></td>
                    <td className="px-5 py-3">
                      <button onClick={e => { e.stopPropagation(); if (window.confirm(`Excluir "${reg.nome}"?`)) removeLead(reg.id) }}
                        className="text-xs px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                      </button>
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
        <ModalEditar lead={modalEditar}
          onSalvar={(dados) => handleSalvarEdicao(modalEditar, dados)}
          onFechar={() => setModalEditar(null)} />
      )}
    </div>
  )
}
