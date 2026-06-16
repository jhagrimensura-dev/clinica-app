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

function getFollow(key) { return FOLLOWS.find(f => f.key === key) || FOLLOWS[0] }

function IconeWpp({ ativo }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-opacity ${ativo ? 'opacity-80 hover:opacity-100' : 'opacity-20'}`} fill={ativo ? '#25D366' : '#9ca3af'}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

function ModalNovoLead({ onClose, onSalvar, ano, mes }) {
  const hoje = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const [data, setData] = useState(hoje)
  const [responsavel, setResponsavel] = useState('')
  const [paciente, setPaciente] = useState('')
  const [fonte, setFonte] = useState('')
  const [status, setStatus] = useState('em_aberto')
  const [proximoFollowup, setProximoFollowup] = useState('')
  const [obs, setObs] = useState('')

  const handleSalvar = () => {
    if (!paciente.trim()) return
    onSalvar({ nome: paciente.trim(), data, responsavel, fonte, status, proximoFollowup, obs: obs.trim(), origem: 'leads_recorrentes' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Lead Recorrente</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-white">
              <option value="">Selecione</option>
              <option>Dra. Amanda</option><option>Fernanda</option><option>Recepção</option><option>Equipe</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome *</label>
          <input autoFocus value={paciente} onChange={e => setPaciente(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSalvar()}
            placeholder="Nome do paciente recorrente..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Origem</label>
            <select value={fonte} onChange={e => setFonte(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-white">
              <option value="">Selecione</option>
              <option value="instagram">Instagram</option><option value="facebook">Facebook</option>
              <option value="google">Google</option><option value="indicacao">Indicação</option>
              <option value="whatsapp">WhatsApp</option><option value="outros">Outros</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-white">
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Próximo Follow-up</label>
          <input type="date" value={proximoFollowup} onChange={e => setProximoFollowup(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} placeholder="Observações..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSalvar} disabled={!paciente.trim()}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Criar</button>
        </div>
      </div>
    </div>
  )
}

function ModalEditarLead({ lead, onClose, onSalvar, onExcluir }) {
  const [data, setData] = useState(lead.data || '')
  const [responsavel, setResponsavel] = useState(lead.responsavel || '')
  const [paciente, setPaciente] = useState(lead.nome || '')
  const [fonte, setFonte] = useState(lead.fonte || lead.origemCustom || '')
  const [status, setStatus] = useState(lead.status || 'em_aberto')
  const [agendadoPara, setAgendadoPara] = useState(lead.agendadoPara || '')
  const [proximoFollowup, setProximoFollowup] = useState(lead.proximoFollowup || '')
  const [obs, setObs] = useState(lead.obs || '')
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar Lead</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-white">
              <option value="">Selecione</option>
              <option>Dra. Amanda</option><option>Fernanda</option><option>Recepção</option><option>Equipe</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome *</label>
          <input autoFocus value={paciente} onChange={e => setPaciente(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Origem</label>
            <select value={fonte} onChange={e => setFonte(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-white">
              <option value="">Selecione</option>
              <option value="instagram">Instagram</option><option value="facebook">Facebook</option>
              <option value="google">Google</option><option value="indicacao">Indicação</option>
              <option value="whatsapp">WhatsApp</option><option value="outros">Outros</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-white">
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </div>
        {status === 'agendado' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <label className="text-sm font-semibold text-blue-700 mb-1.5 block">📅 Agendado para</label>
            <input type="date" value={agendadoPara} onChange={e => setAgendadoPara(e.target.value)}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Próximo Follow-up</label>
          <input type="date" value={proximoFollowup} onChange={e => setProximoFollowup(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 resize-none" />
        </div>
        <div className="flex items-center justify-between pt-1">
          {confirmando ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-500">Excluir lead?</span>
              <button onClick={() => { onExcluir(lead.id); onClose() }} className="text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50">Sim</button>
              <button onClick={() => setConfirmando(false)} className="text-sm text-gray-400 px-3 py-1 rounded-lg hover:bg-gray-50">Não</button>
            </div>
          ) : (
            <button onClick={() => setConfirmando(true)} className="text-sm text-red-400 hover:text-red-600 font-semibold">Excluir</button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button onClick={() => { onSalvar(lead.id, { nome: paciente.trim(), data, responsavel, fonte, status, agendadoPara: agendadoPara || null, proximoFollowup, obs }); onClose() }}
              disabled={!paciente.trim()}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadsRecorrentes() {
  const { ano, setAno, mes, setMes } = useFinanceiro()
  const { getLeadsPorOrigem, addLead, updateLead, removeLead } = useLeads()
  const [modal, setModal] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [busca, setBusca] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [visao, setVisao] = useState('lista')
  const [dragOver, setDragOver] = useState(null)

  const leads = getLeadsPorOrigem('leads_recorrentes', ano, mes)
  const leadsFiltrados = leads.filter(l => l.nome.toLowerCase().includes(busca.toLowerCase()))
  const agendados = leads.filter(l => l.status === 'agendado' || l.status === 'fechado').length
  const taxa = leads.length > 0 ? ((agendados / leads.length) * 100).toFixed(1) : '0.0'

  const dataFormatada = (data) => { const [, m, d] = (data || '').split('-'); return d && m ? `${d}/${m}` : '—' }

  const abrirInboxContato = (telefone, e) => {
    if (e) e.stopPropagation()
    if (!telefone) return
    sessionStorage.setItem('inbox_abrir_telefone', telefone)
    window.dispatchEvent(new CustomEvent('navegarInbox'))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leads Recorrentes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie leads de pacientes recorrentes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => { if (mes === 0) { setMes(11); setAno(a => a-1) } else setMes(m => m-1) }} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-24 text-center">{MESES_FULL[mes].slice(0,3)} {ano}</span>
            <button onClick={() => { if (mes === 11) { setMes(0); setAno(a => a+1) } else setMes(m => m+1) }} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
            + Novo Lead
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-400 bg-white" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Leads', value: leads.length, sub: `${leads.length} leads recorrentes`, icon: '🔄', cor: 'text-teal-400' },
          { label: 'Taxa de Conversão', value: `${taxa}%`, sub: `${agendados} agendamentos`, icon: '📈', cor: 'text-green-400' },
          { label: 'Agendamentos', value: agendados, sub: `de ${leads.length} leads`, icon: '📅', cor: 'text-blue-400' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm text-gray-500 font-medium">{c.label}</p>
              <span className={`text-lg ${c.cor}`}>{c.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Leads do Mês — {MESES_FULL[mes]}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{leadsFiltrados.length} leads</span>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button onClick={() => setVisao('lista')} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${visao === 'lista' ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>≡ Lista</button>
              <button onClick={() => setVisao('quadro')} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${visao === 'quadro' ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>⊞ Quadro</button>
            </div>
          </div>
        </div>

        {leadsFiltrados.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-4xl mb-3">🔄</p>
            <p className="text-gray-500 font-semibold">Nenhum lead em {MESES_FULL[mes]}</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "+ Novo Lead" para começar.</p>
          </div>
        ) : visao === 'lista' ? (
          <div className="divide-y divide-gray-50">
            {leadsFiltrados.map(lead => {
              const follow = getFollow(lead.status)
              return (
                <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setModalEditar(lead)}>
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm flex-shrink-0">
                    {lead.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                    {lead.status === 'agendado' && lead.agendadoPara ? (
                      <p className="text-xs text-blue-500 font-semibold">📅 {dataFormatada(lead.agendadoPara)}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Lead {dataFormatada(lead.data)}</p>
                    )}
                  </div>
                  {lead.obs && <p className="text-xs text-gray-400 italic truncate max-w-[180px] hidden md:block">{lead.obs}</p>}
                  <select value={lead.status}
                    onChange={e => { e.stopPropagation(); updateLead(lead.id, { status: e.target.value }) }}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border-0 outline-none cursor-pointer ${follow.bg} ${follow.text}`}>
                    {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <button onClick={e => abrirInboxContato(lead.telefone, e)} disabled={!lead.telefone} className="flex-shrink-0 disabled:cursor-not-allowed">
                    <IconeWpp ativo={!!lead.telefone} />
                  </button>
                  {confirmDelete === lead.id ? (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { removeLead(lead.id); setConfirmDelete(null) }} className="text-xs text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 px-2 py-1 rounded hover:bg-gray-100">Não</button>
                    </div>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(lead.id) }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-all">✕</button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex gap-3 p-4 overflow-x-auto">
            {FOLLOWS.map(col => {
              const colLeads = leadsFiltrados.filter(l => l.status === col.key)
              const isDragOver = dragOver === col.key
              return (
                <div key={col.key}
                  className={`flex-shrink-0 w-52 rounded-xl p-3 transition-colors ${isDragOver ? 'bg-teal-50 ring-2 ring-teal-300' : 'bg-gray-50'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
                  onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('leadId'); if (id) updateLead(id, { status: col.key }); setDragOver(null) }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{col.label}</span>
                    <span className="text-xs text-gray-400 font-semibold">{colLeads.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[60px]">
                    {colLeads.length === 0 ? (
                      <p className={`text-xs text-center py-4 ${isDragOver ? 'text-teal-400 font-semibold' : 'text-gray-300'}`}>
                        {isDragOver ? 'Soltar aqui' : 'Nenhum item'}
                      </p>
                    ) : colLeads.map(lead => (
                      <div key={lead.id} draggable
                        onDragStart={e => { e.dataTransfer.setData('leadId', lead.id); e.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => setDragOver(null)}
                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:border-teal-200 transition-colors"
                        onClick={() => setModalEditar(lead)}>
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                        {lead.status === 'agendado' && lead.agendadoPara ? (
                          <p className="text-xs text-blue-500 font-semibold mt-0.5">📅 {dataFormatada(lead.agendadoPara)}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">Lead {dataFormatada(lead.data)}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <select value={lead.status}
                            onChange={e => { e.stopPropagation(); updateLead(lead.id, { status: e.target.value }) }}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-gray-400 outline-none bg-transparent cursor-pointer">
                            {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                          <button onClick={e => abrirInboxContato(lead.telefone, e)} disabled={!lead.telefone} className="disabled:cursor-not-allowed">
                            <IconeWpp ativo={!!lead.telefone} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {colLeads.length > 0 && isDragOver && (
                      <div className="border-2 border-dashed border-teal-300 rounded-xl h-12 flex items-center justify-center">
                        <span className="text-xs text-teal-400 font-semibold">Soltar aqui</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && <ModalNovoLead onClose={() => setModal(false)} onSalvar={addLead} ano={ano} mes={mes} />}
      {modalEditar && (
        <ModalEditarLead lead={modalEditar} onClose={() => setModalEditar(null)} onSalvar={updateLead} onExcluir={removeLead} />
      )}
    </div>
  )
}
