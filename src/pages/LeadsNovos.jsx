import { useState } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useFinanceiro } from '../context/FinanceiroContext'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const FOLLOWS = [
  { key: 'em_aberto',   label: 'Em aberto',   bg: 'bg-gray-100',   text: 'text-gray-500'   },
  { key: 'conversando', label: 'Conversando',  bg: 'bg-purple-100', text: 'text-purple-600' },
  { key: 'follow1',     label: 'Follow #1',    bg: 'bg-orange-100', text: 'text-orange-600' },
  { key: 'follow2',     label: 'Follow #2',    bg: 'bg-yellow-100', text: 'text-yellow-600' },
  { key: 'follow3',     label: 'Follow #3',    bg: 'bg-amber-100',  text: 'text-amber-700'  },
  { key: 'agendado',    label: 'Agendado',     bg: 'bg-blue-100',   text: 'text-blue-600'   },
  { key: 'fechado',     label: 'Fechado',      bg: 'bg-green-100',  text: 'text-green-600'  },
  { key: 'perdido',     label: 'Perdido',      bg: 'bg-red-100',    text: 'text-red-500'    },
]

function getFollow(key) {
  return FOLLOWS.find(f => f.key === key) || FOLLOWS[0]
}

function ModalNovoLead({ onClose, onSalvar, ano, mes }) {
  const [nome, setNome] = useState('')
  const hoje = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const [data, setData] = useState(hoje)
  const [telefone, setTelefone] = useState('')
  const [obs, setObs] = useState('')

  const handleSalvar = () => {
    if (!nome.trim()) return
    onSalvar({ nome: nome.trim(), data, telefone: telefone.trim(), obs: obs.trim(), status: 'follow1', origem: 'leads_novos' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Novo Lead</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome *</label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSalvar()}
              placeholder="Nome do lead..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Data de entrada</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">WhatsApp</label>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(62) 9 9999-9999"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Observação</label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Interesse, procedimento, etc..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSalvar}
            disabled={!nome.trim()}
            className="flex-1 bg-orange-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-40"
          >
            Adicionar Lead
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LeadsNovos() {
  const { ano, setAno, mes, setMes, MESES } = useFinanceiro()
  const { getLeadsPorOrigem, addLead, updateLead, removeLead } = useLeads()
  const [modal, setModal] = useState(false)
  const [busca, setBusca] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [visao, setVisao] = useState('lista')

  const leads = getLeadsPorOrigem('leads_novos', ano, mes)

  const leadsFiltrados = leads.filter(l =>
    l.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const agendados = leads.filter(l => l.status === 'agendado' || l.status === 'fechado').length
  const taxa = leads.length > 0 ? ((agendados / leads.length) * 100).toFixed(1) : '0.0'

  const dataFormatada = (data) => {
    const [, m, d] = data.split('-')
    return `${d}/${m}`
  }

  const abrirWhatsApp = (telefone) => {
    if (!telefone) return
    const num = telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${num}`, '_blank')
  }

  return (
    <div className="p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leads Novos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie leads e acompanhe conversões</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => { if (mes === 0) { setMes(11); setAno(a => a-1) } else setMes(m => m-1) }} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-24 text-center">{MESES_FULL[mes].slice(0,3)} {ano}</span>
            <button onClick={() => { if (mes === 11) { setMes(0); setAno(a => a+1) } else setMes(m => m+1) }} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white"
          />
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Total de Leads</p>
            <span className="text-orange-400 text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{leads.length}</p>
          <p className="text-xs text-gray-400 mt-1">{leads.length} leads</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Taxa de Conversão</p>
            <span className="text-green-400 text-lg">📈</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{taxa}%</p>
          <p className="text-xs text-gray-400 mt-1">{agendados} agendamentos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Agendamentos</p>
            <span className="text-blue-400 text-lg">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{agendados}</p>
          <p className="text-xs text-gray-400 mt-1">de {leads.length} leads</p>
        </div>
      </div>

      {/* Lista / Quadro */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Leads do Mês — {MESES_FULL[mes]}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{leadsFiltrados.length} leads</span>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button onClick={() => setVisao('lista')} className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${visao === 'lista' ? 'bg-orange-400 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>≡ Lista</button>
              <button onClick={() => setVisao('quadro')} className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${visao === 'quadro' ? 'bg-orange-400 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>⊞ Quadro</button>
            </div>
          </div>
        </div>

        {leadsFiltrados.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 font-semibold">Nenhum lead em {MESES_FULL[mes]}</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "+ Novo Lead" para começar.</p>
          </div>
        ) : visao === 'lista' ? (
          <div className="divide-y divide-gray-50">
            {leadsFiltrados.map(lead => {
              const follow = getFollow(lead.status)
              return (
                <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm flex-shrink-0">
                    {lead.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                    <p className="text-xs text-gray-400">Follow {dataFormatada(lead.data)}</p>
                  </div>
                  {lead.obs && <p className="text-xs text-gray-400 italic truncate max-w-[180px] hidden md:block">{lead.obs}</p>}
                  <select
                    value={lead.status}
                    onChange={e => updateLead(lead.id, { status: e.target.value })}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border-0 outline-none cursor-pointer ${follow.bg} ${follow.text}`}
                  >
                    {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <button onClick={() => abrirWhatsApp(lead.telefone)} className={`text-xl flex-shrink-0 ${lead.telefone ? 'opacity-70 hover:opacity-100' : 'opacity-20 cursor-not-allowed'}`} title={lead.telefone ? lead.telefone : 'Sem telefone'}>💬</button>
                  {confirmDelete === lead.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => { removeLead(lead.id); setConfirmDelete(null) }} className="text-xs text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 px-2 py-1 rounded hover:bg-gray-100">Não</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(lead.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-all">✕</button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Quadro Kanban */
          <div className="flex gap-3 p-4 overflow-x-auto">
            {FOLLOWS.map(col => {
              const colLeads = leadsFiltrados.filter(l => l.status === col.key)
              return (
                <div key={col.key} className="flex-shrink-0 w-52 bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{col.label}</span>
                    <span className="text-xs text-gray-400 font-semibold">{colLeads.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colLeads.length === 0 ? (
                      <p className="text-xs text-gray-300 text-center py-4">Nenhum item</p>
                    ) : colLeads.map(lead => (
                      <div key={lead.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Follow {dataFormatada(lead.data)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <select
                            value={lead.status}
                            onChange={e => updateLead(lead.id, { status: e.target.value })}
                            className="text-xs text-gray-400 outline-none bg-transparent cursor-pointer"
                          >
                            {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                          <button onClick={() => abrirWhatsApp(lead.telefone)} className={`text-base ${lead.telefone ? 'opacity-70 hover:opacity-100' : 'opacity-20 cursor-not-allowed'}`}>💬</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <ModalNovoLead
          onClose={() => setModal(false)}
          onSalvar={addLead}
          ano={ano}
          mes={mes}
        />
      )}
    </div>
  )
}
