import { useState } from 'react'
import { useAgenda } from '../context/AgendaContext'
import { useLeads } from '../context/LeadsContext'
import { getFeriado } from '../lib/feriados'
import FeriadoAviso from '../components/FeriadoAviso'

export function gerarIdLembrete() {
  return `lem_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const HORAS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)

const CORES = [
  { id: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   solid: 'bg-blue-400'   },
  { id: 'green',  bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  solid: 'bg-green-400'  },
  { id: 'brand',  bg: 'bg-brand-100',  text: 'text-brand-800',  border: 'border-brand-300',  solid: 'bg-brand-400'  },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', solid: 'bg-purple-400' },
  { id: 'red',    bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    solid: 'bg-red-400'    },
  { id: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', solid: 'bg-yellow-400' },
]
function getCor(id) { return CORES.find(c => c.id === id) || CORES[0] }
function getCorLembrete(l) {
  if ((l.descricao || '').includes('Aniversário')) return CORES.find(c => c.id === 'yellow')
  return getCor(l.cor)
}

function formatMes(ano, mes) {
  return new Date(ano, mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

function formatDiaSemana(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, c => c.toUpperCase())
}

function getDias(ano, mes) {
  const primeiro = new Date(ano, mes, 1)
  const ultimo = new Date(ano, mes + 1, 0)
  const offset = primeiro.getDay() === 0 ? 6 : primeiro.getDay() - 1
  const dias = Array(offset).fill(null)
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(d)
  while (dias.length % 7 !== 0) dias.push(null)
  return dias
}

function toDateStr(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export default function AgendaLembretes() {
  const hoje = new Date().toISOString().split('T')[0]
  const { lembretes, addLembrete, updateLembrete, deleteLembrete } = useAgenda()
  const { leads } = useLeads()
  const [mesRef, setMesRef] = useState(() => ({ ano: new Date().getFullYear(), mes: new Date().getMonth() }))
  const [diaSel, setDiaSel] = useState(hoje)
  const [modal, setModal] = useState(null)
  const [vista, setVista] = useState('mes')

  const [fNome, setFNome] = useState('')
  const [fTel, setFTel] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fData, setFData] = useState(hoje)
  const [fHora, setFHora] = useState('09:00')
  const [fCor, setFCor] = useState('blue')

  function abrirNovo(hora = '09:00', data = diaSel) {
    setFNome(''); setFTel(''); setFDesc(''); setFData(data); setFHora(hora); setFCor('blue')
    setModal({ modo: 'novo' })
  }
  function abrirEditar(l) {
    setFNome(l.leadNome || ''); setFTel(l.leadTelefone || '')
    setFDesc(l.descricao || ''); setFData(l.data); setFHora(l.hora || '09:00'); setFCor(l.cor || 'blue')
    setModal({ modo: 'editar', lembrete: l })
  }
  function salvar() {
    if (!fNome.trim()) return
    if (modal.modo === 'novo') {
      addLembrete({ id: gerarIdLembrete(), leadNome: fNome.trim(), leadTelefone: fTel.trim(), descricao: fDesc.trim(), data: fData, hora: fHora, cor: fCor, concluido: false, criadoEm: Date.now() })
    } else {
      updateLembrete(modal.lembrete.id, { leadNome: fNome.trim(), leadTelefone: fTel.trim(), descricao: fDesc.trim(), data: fData, hora: fHora, cor: fCor })
    }
    setModal(null)
  }
  function excluir(id) { deleteLembrete(id); setModal(null) }
  function toggleConcluido(id) { updateLembrete(id, { concluido: !lembretes.find(l => l.id === id)?.concluido }) }

  const dias = getDias(mesRef.ano, mesRef.mes)
  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  function temLembrete(d) {
    if (!d) return false
    const ds = toDateStr(mesRef.ano, mesRef.mes, d)
    return lembretes.some(l => l.data === ds && !l.concluido)
  }

  function lembretesNoDia(ds) {
    return lembretes.filter(l => l.data === ds).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
  }

  const lembretesDia = lembretes.filter(l => l.data === diaSel).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
  const diaTodo = lembretesDia.filter(l => !l.hora)

  function lembretesNaHora(hora) {
    const h = hora.split(':')[0]
    return lembretesDia.filter(l => l.hora && l.hora.startsWith(h + ':'))
  }

  function navMes(delta) {
    setMesRef(m => {
      const d = new Date(m.ano, m.mes + delta)
      return { ano: d.getFullYear(), mes: d.getMonth() }
    })
  }

  function irParaDia(ds) {
    setDiaSel(ds)
    setMesRef({ ano: parseInt(ds.slice(0, 4)), mes: parseInt(ds.slice(5, 7)) - 1 })
    setVista('dia')
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

      {/* Barra superior */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navMes(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-lg">‹</button>
            <span className="text-sm font-bold text-gray-800 min-w-36 text-center">{formatMes(mesRef.ano, mesRef.mes)}</span>
            <button onClick={() => navMes(1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-lg">›</button>
          </div>
          <button
            onClick={() => { const d = new Date(); setMesRef({ ano: d.getFullYear(), mes: d.getMonth() }); setDiaSel(hoje) }}
            className="text-xs text-brand-500 hover:text-brand-700 font-semibold border border-brand-200 hover:border-brand-400 px-3 py-1.5 rounded-lg transition-colors">
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Mês / Dia */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setVista('mes')}
              className={`px-4 py-1.5 text-xs font-semibold transition-colors ${vista === 'mes' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Mês
            </button>
            <button
              onClick={() => setVista('dia')}
              className={`px-4 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 ${vista === 'dia' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Dia
            </button>
          </div>
          <button onClick={() => abrirNovo()}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            + Novo lembrete
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {vista === 'mes' ? (
        /* ===== VISTA MÊS ===== */
        <div className="flex-1 overflow-auto px-4 py-4">
          {/* Grid cabeçalho */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {diasSemana.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>
          {/* Grid dias */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200">
            {dias.map((d, i) => {
              const ds = d ? toDateStr(mesRef.ano, mesRef.mes, d) : null
              const eh_hoje = ds === hoje
              const eh_sel = ds === diaSel
              const feriado = ds ? getFeriado(ds) : null
              const itens = ds ? lembretesNoDia(ds) : []
              const visiveis = itens.slice(0, 3)
              const resto = itens.length - visiveis.length
              return (
                <div
                  key={i}
                  onClick={() => d && irParaDia(ds)}
                  className={`bg-white min-h-28 p-2 flex flex-col ${d ? 'cursor-pointer hover:bg-brand-50 transition-colors' : 'bg-gray-50'}`}>
                  {d && (
                    <>
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0
                          ${eh_hoje ? 'bg-brand-500 text-white' : eh_sel ? 'bg-brand-100 text-brand-700' : feriado ? 'text-red-500' : 'text-gray-600'}`}>
                          {d}
                        </span>
                        {feriado && (
                          <span className="text-[9px] font-semibold text-red-400 leading-tight text-right ml-1 truncate max-w-[70%]">{feriado}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1">
                        {visiveis.map(l => {
                          const cor = getCorLembrete(l)
                          return (
                            <button
                              key={l.id}
                              onClick={e => { e.stopPropagation(); abrirEditar(l) }}
                              className={`w-full text-left px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${cor.bg} ${cor.text} ${l.concluido ? 'opacity-40 line-through' : ''}`}>
                              {l.hora && <span className="opacity-60 flex-shrink-0">{l.hora}</span>}
                              <span className="truncate flex-1">{l.leadNome}</span>
                              {(l.descricao || '').includes('Aniversário') && <span className="flex-shrink-0">🎈</span>}
                            </button>
                          )
                        })}
                        {resto > 0 && (
                          <span className="text-[10px] text-gray-400 font-semibold pl-1">+{resto} mais</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
          {/* Legenda de cores */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 px-1">
            {[
              { id: 'blue',   label: 'Azul'       },
              { id: 'green',  label: 'Verde'       },
              { id: 'brand',  label: 'Rosa'        },
              { id: 'purple', label: 'Roxo'        },
              { id: 'red',    label: 'Vermelho'    },
              { id: 'yellow', label: 'Aniversário 🎂' },
            ].map(({ id, label }) => {
              const cor = getCor(id)
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cor.solid}`} />
                  <span className="text-[11px] text-gray-500">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ===== VISTA DIA ===== */
        <div className="flex flex-1 overflow-hidden">

          {/* Painel esquerdo — mini calendário */}
          <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col p-4 gap-3 overflow-hidden">

            {/* Grid mini */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {diasSemana.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 pb-1">{d}</div>
              ))}
              {dias.map((d, i) => {
                const ds = d ? toDateStr(mesRef.ano, mesRef.mes, d) : null
                const sel = ds === diaSel
                const eh_hoje = ds === hoje
                return (
                  <button key={i} onClick={() => d && setDiaSel(ds)} disabled={!d}
                    className={`relative h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors
                      ${!d ? 'invisible' : sel ? 'bg-brand-500 text-white' : eh_hoje ? 'text-brand-600 font-bold hover:bg-brand-50' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {d}
                    {d && temLembrete(d) && !sel && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Próximos lembretes */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Próximos lembretes</p>
              {lembretes
                .filter(l => !l.concluido && l.data >= hoje)
                .sort((a, b) => a.data.localeCompare(b.data) || (a.hora || '').localeCompare(b.hora || ''))
                .slice(0, 12)
                .map(l => {
                  const cor = getCorLembrete(l)
                  return (
                    <button key={l.id}
                      onClick={() => { setDiaSel(l.data); setMesRef({ ano: parseInt(l.data.slice(0, 4)), mes: parseInt(l.data.slice(5, 7)) - 1 }) }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl border ${cor.bg} ${cor.border} hover:opacity-80 transition-opacity`}>
                      <p className={`text-[10px] font-semibold ${cor.text} opacity-70`}>
                        {l.data.split('-').reverse().join('/')}{l.hora ? ` · ${l.hora}` : ''}
                      </p>
                      <div className={`flex items-center justify-between gap-1`}>
                        <p className={`text-xs font-bold ${cor.text} truncate flex-1`}>{l.leadNome}</p>
                        {(l.descricao || '').includes('Aniversário') && <span className="flex-shrink-0 text-sm">🎈</span>}
                      </div>
                      {l.descricao && <p className={`text-[10px] ${cor.text} opacity-60 truncate`}>{l.descricao}</p>}
                    </button>
                  )
                })}
              {lembretes.filter(l => !l.concluido && l.data >= hoje).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum lembrete futuro</p>
              )}
            </div>
          </div>

          {/* Painel direito — timeline */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-base font-bold text-gray-800">{formatDiaSemana(diaSel)}</p>
                <p className="text-xs text-gray-400">{lembretesDia.length} lembrete{lembretesDia.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {diaTodo.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Dia todo</p>
                  <div className="flex flex-wrap gap-2">
                    {diaTodo.map(l => {
                      const cor = getCorLembrete(l)
                      return (
                        <button key={l.id} onClick={() => abrirEditar(l)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cor.bg} ${cor.border} hover:opacity-80 ${l.concluido ? 'opacity-40' : ''}`}>
                          <span className={`text-sm font-semibold ${cor.text} ${l.concluido ? 'line-through' : ''} flex-1`}>
                            {l.leadNome}{(l.descricao || '').includes('Aniversário') ? '' : (l.descricao ? `: ${l.descricao}` : '')}
                          </span>
                          {(l.descricao || '').includes('Aniversário') && <span className="flex-shrink-0 text-base">🎈</span>}
                          <button onClick={e => { e.stopPropagation(); toggleConcluido(l.id) }}
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${cor.border} ${l.concluido ? cor.bg : 'bg-white'}`}>
                            {l.concluido && <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </button>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                {HORAS.map(hora => {
                  const itens = lembretesNaHora(hora)
                  return (
                    <div key={hora} className="flex gap-3 group" style={{ minHeight: 52 }}>
                      <div className="w-14 flex-shrink-0 pt-2">
                        <span className="text-xs font-medium text-gray-400">{hora}</span>
                      </div>
                      <div className="flex-1 border-t border-gray-100 pt-2 pb-1 flex gap-2 flex-wrap items-start relative">
                        {itens.map(l => {
                          const cor = getCorLembrete(l)
                          return (
                            <button key={l.id} onClick={() => abrirEditar(l)}
                              className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-left hover:opacity-80 transition-opacity ${cor.bg} ${cor.border} ${l.concluido ? 'opacity-40' : ''}`}
                              style={{ minWidth: 160 }}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className={`text-xs font-bold ${cor.text} ${l.concluido ? 'line-through' : ''} truncate flex-1`}>
                                    {l.hora} · {l.leadNome}
                                  </p>
                                  {(l.descricao || '').includes('Aniversário') && <span className="flex-shrink-0 text-sm">🎈</span>}
                                </div>
                                {l.descricao && (
                                  <p className={`text-[11px] ${cor.text} opacity-70 truncate ${l.concluido ? 'line-through' : ''}`}>{l.descricao}</p>
                                )}
                                {l.leadTelefone && (
                                  <p className={`text-[10px] ${cor.text} opacity-50`}>{l.leadTelefone}</p>
                                )}
                              </div>
                              <button onClick={e => { e.stopPropagation(); toggleConcluido(l.id) }}
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${cor.border} ${l.concluido ? 'bg-current' : 'bg-white'}`}>
                                {l.concluido && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                              </button>
                            </button>
                          )
                        })}
                        {itens.length === 0 && (
                          <button onClick={() => abrirNovo(hora)}
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center pl-1">
                            <span className="text-[11px] text-gray-300 font-medium">+ adicionar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal adicionar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {modal.modo === 'novo' ? 'Novo Lembrete' : 'Editar Lembrete'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Lead / Nome *</label>
              <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Nome do lead"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefone</label>
              <div className="flex gap-2">
                <input value={fTel} onChange={e => setFTel(e.target.value)} placeholder="(11) 99999-9999"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
                {fTel.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('inbox_abrir_telefone', fTel.trim())
                      setModal(null)
                      const digits = fTel.trim().replace(/\D/g, '')
                      const lead = leads.find(l => {
                        const lt = (l.telefone || '').replace(/\D/g, '')
                        return lt.length > 5 && (lt === digits || lt.endsWith(digits.slice(-9)) || digits.endsWith(lt.slice(-9)))
                      })
                      const ORIGEM_CONTA = { leads_novos: 'Leads Novos', leads_recorrentes: 'Leads Recorrentes', indicacao: 'Indicação' }
                      const contaTipo = ORIGEM_CONTA[lead?.origem] || null
                      window.dispatchEvent(new CustomEvent('navegarInbox', { detail: { telefone: fTel.trim(), contaTipo } }))
                    }}
                    title="Abrir conversa no WhatsApp"
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors text-base">
                    💬
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Descrição</label>
              <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Ex: Acompanhar interesse em botox"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Data</label>
                <input type="date" value={fData} onChange={e => setFData(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
                <FeriadoAviso data={fData} />
              </div>
              <div className="w-28">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Hora</label>
                <input type="time" value={fHora} onChange={e => setFHora(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Cor</label>
              <div className="flex gap-2">
                {CORES.map(c => (
                  <button key={c.id} onClick={() => setFCor(c.id)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${c.bg} ${fCor === c.id ? 'border-gray-500 scale-110' : 'border-transparent opacity-60'}`} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {modal.modo === 'editar' ? (
                <button onClick={() => excluir(modal.lembrete.id)}
                  className="text-sm text-red-400 hover:text-red-600 font-semibold">Excluir</button>
              ) : <div />}
              <div className="flex gap-3">
                <button onClick={() => setModal(null)}
                  className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button onClick={salvar} disabled={!fNome.trim()}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
                  {modal.modo === 'novo' ? 'Salvar' : 'Atualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
