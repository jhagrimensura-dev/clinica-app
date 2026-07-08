import { useState } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { useAgenda } from '../context/AgendaContext'

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
  const [indicadoPor, setIndicadoPor] = useState('')
  const [status, setStatus] = useState('em_aberto')
  const [proximoFollowup, setProximoFollowup] = useState('')
  const [obs, setObs] = useState('')

  const handleSalvar = () => {
    if (!paciente.trim()) return
    onSalvar({ nome: paciente.trim(), data, responsavel, indicadoPor: indicadoPor.trim(), status, proximoFollowup, obs: obs.trim(), origem: 'indicacao' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nova Indicação</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white">
              <option value="">Selecione</option>
              <option>Dra. Amanda</option><option>Fernanda</option><option>Recepção</option><option>Equipe</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome *</label>
          <input autoFocus value={paciente} onChange={e => setPaciente(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSalvar()}
            placeholder="Nome do paciente indicado..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Indicado por</label>
          <input value={indicadoPor} onChange={e => setIndicadoPor(e.target.value)}
            placeholder="Nome de quem indicou..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white">
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Próximo Follow-up</label>
            <input type="date" value={proximoFollowup} onChange={e => setProximoFollowup(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} placeholder="Observações..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSalvar} disabled={!paciente.trim()}
            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Criar</button>
        </div>
      </div>
    </div>
  )
}

function ModalEditarLead({ lead, onClose, onSalvar, onExcluir }) {
  const { leadMidias } = useConfig()
  const MIDIAS_PADRAO = ['Tráfego pago', 'Link da BIO', 'Indicação', 'Link dos Stories']
  const midias = leadMidias || MIDIAS_PADRAO

  const [data, setData] = useState(lead.data || '')
  const [responsavel, setResponsavel] = useState(lead.responsavel || '')
  const [paciente, setPaciente] = useState(lead.nome || '')
  const [indicadoPor, setIndicadoPor] = useState(lead.indicadoPor || '')
  const { addLembrete, lembretes: todosLembretes, deleteLembrete } = useAgenda()
  const [midia, setMidia] = useState(lead.midia || '')
  const [linkBio, setLinkBio] = useState(lead.linkBio || '')
  const [status, setStatus] = useState(lead.status || 'em_aberto')
  const [agendadoPara, setAgendadoPara] = useState(lead.agendadoPara || '')
  const [obs, setObs] = useState(lead.obs || '')
  const [confirmando, setConfirmando] = useState(false)
  const [lembretes, setLembretes] = useState(() => {
    if (lead.lembretes?.length) return lead.lembretes.map(l => ({ data: l.data || '', hora: l.hora || '', obs: l.obs || '' }))
    if (lead.proximoFollowup) return [{ data: lead.proximoFollowup, hora: '', obs: '' }]
    return [{ data: '', hora: '', obs: '' }]
  })
  const telLead = (lead.telefone || '').replace(/\D/g, '')
  const lembretesDaAgenda = todosLembretes.filter(l => {
    const telLemb = (l.leadTelefone || '').replace(/\D/g, '')
    if (telLead.length > 5 && telLemb.length > 5) return telLemb.endsWith(telLead.slice(-8)) || telLead.endsWith(telLemb.slice(-8))
    return l.leadNome === lead.nome
  }).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar Indicação</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white">
              <option value="">Selecione</option>
              <option>Dra. Amanda</option><option>Fernanda</option><option>Recepção</option><option>Equipe</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome *</label>
          <input autoFocus value={paciente} onChange={e => setPaciente(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Indicado por</label>
          <input value={indicadoPor} onChange={e => setIndicadoPor(e.target.value)}
            placeholder="Nome de quem indicou..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white">
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Próximo Follow-up</label>
            <input type="date" value={proximoFollowup} onChange={e => setProximoFollowup(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mídia</label>
          <select value={midia} onChange={e => { setMidia(e.target.value); if (e.target.value !== 'Link da BIO') setLinkBio('') }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white">
            <option value="">Não informado</option>
            {midias.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {midia === 'Link da BIO' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Link da BIO</label>
            <input value={linkBio} onChange={e => setLinkBio(e.target.value)}
              placeholder="Ex: link da bio, campanha, landing page..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
          </div>
        )}
        {status === 'agendado' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <label className="text-sm font-semibold text-blue-700 mb-1.5 block">📅 Agendado para</label>
            <input type="date" value={agendadoPara} onChange={e => setAgendadoPara(e.target.value)}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
          </div>
        )}
        {lembretesDaAgenda.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-amber-500"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Lembretes na agenda ({lembretesDaAgenda.length})
            </label>
            <div className="space-y-1.5">
              {lembretesDaAgenda.map(l => (
                <div key={l.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${l.concluido ? 'bg-gray-50 border border-gray-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${l.concluido ? 'text-gray-400 line-through' : 'text-amber-800'}`}>{l.data}{l.hora ? ` às ${l.hora}` : ''}{l.concluido ? ' ✓' : ''}</p>
                    {l.descricao && <p className={`text-xs truncate ${l.concluido ? 'text-gray-400' : 'text-amber-700'}`}>{l.descricao}</p>}
                  </div>
                  {!l.concluido && (
                    <button type="button" onClick={() => deleteLembrete(l.id)} className="text-amber-400 hover:text-red-500 flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Lembretes</label>
            <button type="button" onClick={() => setLembretes(l => [...l, { data: '', hora: '', obs: '' }])}
              className="text-green-500 hover:text-green-700 text-lg font-bold leading-none px-1">+</button>
          </div>
          <div className="space-y-3">
            {lembretes.map((l, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-2.5 space-y-2 bg-gray-50">
                <div className="flex gap-2 items-center">
                  <input type="date" value={l.data} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, data: e.target.value } : x))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400 bg-white" />
                  <input type="time" value={l.hora} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, hora: e.target.value } : x))}
                    className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400 bg-white" />
                  {lembretes.length > 1 && (
                    <button type="button" onClick={() => setLembretes(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-400 text-xs font-bold flex-shrink-0">✕</button>
                  )}
                </div>
                <input value={l.obs} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, obs: e.target.value } : x))}
                  placeholder="Observação deste lembrete..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400 bg-white" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
        <div className="flex items-center justify-between pt-1">
          {confirmando ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-500">Excluir indicação?</span>
              <button onClick={() => { onExcluir(lead.id); onClose() }} className="text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50">Sim</button>
              <button onClick={() => setConfirmando(false)} className="text-sm text-gray-400 px-3 py-1 rounded-lg hover:bg-gray-50">Não</button>
            </div>
          ) : (
            <button onClick={() => setConfirmando(true)} className="text-sm text-red-400 hover:text-red-600 font-semibold">Excluir</button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button onClick={() => { const lemsValidos = lembretes.filter(l => l.data); lemsValidos.forEach((l, i) => addLembrete({ id: Date.now() + i, leadNome: paciente.trim(), leadTelefone: lead.telefone || '', descricao: l.obs || obs || '', data: l.data, hora: l.hora || '', cor: 'blue', concluido: false, criadoEm: Date.now() })); onSalvar(lead.id, { nome: paciente.trim(), data, responsavel, indicadoPor: indicadoPor.trim(), midia: midia || null, linkBio: midia === 'Link da BIO' ? (linkBio || null) : null, status, agendadoPara: agendadoPara || null, proximoFollowup: lemsValidos[0]?.data || '', lembretes: lemsValidos, obs }); onClose() }}
              disabled={!paciente.trim()}
              className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Indicacao() {
  const { userRole } = useAuth()
  const { ano, setAno, mes, setMes } = useFinanceiro()
  const { getLeadsPorOrigem, addLead, updateLead, removeLead } = useLeads()
  const [modal, setModal] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [busca, setBusca] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [visao, setVisao] = useState('lista')
  const [dragOver, setDragOver] = useState(null)
  const [ordem, setOrdem] = useState('desc')

  const leads = getLeadsPorOrigem('indicacao', ano, mes)
  const leadsFiltrados = leads
    .filter(l => l.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => {
      const da = a.data || '', db = b.data || ''
      return ordem === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
    })
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
          <h1 className="text-2xl font-bold text-gray-800">Indicação</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie leads vindos por indicação de pacientes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => { if (mes === 0) { setMes(11); setAno(a => a-1) } else setMes(m => m-1) }} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-24 text-center">{MESES_FULL[mes].slice(0,3)} {ano}</span>
            <button onClick={() => { if (mes === 11) { setMes(0); setAno(a => a+1) } else setMes(m => m+1) }} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
            + Nova Indicação
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Indicações', value: leads.length, sub: `${leads.length} indicações`, icon: '🤝', cor: 'text-green-400' },
          { label: 'Taxa de Conversão', value: `${taxa}%`, sub: `${agendados} agendamentos`, icon: '📈', cor: 'text-emerald-400' },
          { label: 'Agendamentos', value: agendados, sub: `de ${leads.length} indicações`, icon: '📅', cor: 'text-blue-400' },
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
          <h2 className="text-base font-bold text-gray-800">Indicações do Mês — {MESES_FULL[mes]}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{leadsFiltrados.length} indicações</span>
            <button onClick={() => setOrdem(o => o === 'desc' ? 'asc' : 'desc')} title={ordem === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'} className="text-xs text-gray-500 hover:text-green-500 border border-gray-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1 transition-colors hover:bg-gray-50">
              {ordem === 'desc' ? '↓' : '↑'} Data
            </button>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button onClick={() => setVisao('lista')} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${visao === 'lista' ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>≡ Lista</button>
              <button onClick={() => setVisao('quadro')} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${visao === 'quadro' ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>⊞ Quadro</button>
            </div>
          </div>
        </div>

        {leadsFiltrados.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-4xl mb-3">🤝</p>
            <p className="text-gray-500 font-semibold">Nenhuma indicação em {MESES_FULL[mes]}</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "+ Nova Indicação" para começar.</p>
          </div>
        ) : visao === 'lista' ? (
          <div className="divide-y divide-gray-50">
            {leadsFiltrados.map(lead => {
              const follow = getFollow(lead.status)
              return (
                <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setModalEditar(lead)}>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                    {lead.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                    {lead.status === 'agendado' && lead.agendadoPara ? (
                      <p className="text-xs text-blue-500 font-semibold">📅 {dataFormatada(lead.agendadoPara)}</p>
                    ) : lead.indicadoPor ? (
                      <p className="text-xs text-gray-400">Indicado por: {lead.indicadoPor}</p>
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
                  {userRole !== 'Funcionário' && (confirmDelete === lead.id ? (
                    <div className="flex flex-col items-end gap-1" onClick={e => e.stopPropagation()}>
                      <p className="text-xs text-gray-400 whitespace-nowrap">Excluir do sistema?</p>
                      <p className="text-xs text-gray-300 whitespace-nowrap">WhatsApp não é afetado</p>
                      <div className="flex gap-1">
                        <button onClick={() => { removeLead(lead.id); setConfirmDelete(null) }} className="text-xs text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50">Sim</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 px-2 py-1 rounded hover:bg-gray-100">Não</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(lead.id) }} title="Excluir lead do sistema (WhatsApp não é afetado)" className="opacity-20 group-hover:opacity-70 hover:!opacity-100 text-gray-400 hover:text-red-400 text-sm transition-all">✕</button>
                  ))}
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
                  className={`flex-shrink-0 w-52 rounded-xl p-3 transition-colors ${isDragOver ? 'bg-green-50 ring-2 ring-green-300' : 'bg-gray-50'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
                  onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('leadId'); if (id) updateLead(id, { status: col.key }); setDragOver(null) }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{col.label}</span>
                    <span className="text-xs text-gray-400 font-semibold">{colLeads.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[60px]">
                    {colLeads.length === 0 ? (
                      <p className={`text-xs text-center py-4 ${isDragOver ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                        {isDragOver ? 'Soltar aqui' : 'Nenhum item'}
                      </p>
                    ) : colLeads.map(lead => (
                      <div key={lead.id} draggable
                        onDragStart={e => { e.dataTransfer.setData('leadId', lead.id); e.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => setDragOver(null)}
                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:border-green-200 transition-colors"
                        onClick={() => setModalEditar(lead)}>
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                        {lead.status === 'agendado' && lead.agendadoPara ? (
                          <p className="text-xs text-blue-500 font-semibold mt-0.5">📅 {dataFormatada(lead.agendadoPara)}</p>
                        ) : lead.indicadoPor ? (
                          <p className="text-xs text-gray-400 mt-0.5">Por: {lead.indicadoPor}</p>
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
                      <div className="border-2 border-dashed border-green-300 rounded-xl h-12 flex items-center justify-center">
                        <span className="text-xs text-green-400 font-semibold">Soltar aqui</span>
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
