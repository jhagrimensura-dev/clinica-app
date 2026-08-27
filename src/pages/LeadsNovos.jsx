import { useState, useEffect, useMemo } from 'react'

const genUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}
import { useLeads } from '../context/LeadsContext'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { useAgenda } from '../context/AgendaContext'
import { useVendas } from '../context/VendasContext'
import FeriadoAviso from '../components/FeriadoAviso'
import { supabase } from '../lib/supabase'

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

function ModalNovoLead({ onClose, onSalvar, ano, mes, leads }) {
  const hoje = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const amanha = (() => { const d = new Date(hoje); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  const [data, setData] = useState(hoje)
  const [responsavel, setResponsavel] = useState('')
  const [paciente, setPaciente] = useState('')
  const [fonte, setFonte] = useState('')
  const [status, setStatus] = useState('em_aberto')
  const [proximoFollowup, setProximoFollowup] = useState(amanha)
  const [obs, setObs] = useState('')

  const handleSalvar = () => {
    if (!paciente.trim()) return
    const jaExiste = (leads || []).some(l => (l.nome || '').toLowerCase().trim() === paciente.toLowerCase().trim())
    if (jaExiste) {
      alert(`Já existe um lead com o nome "${paciente.trim()}" neste mês.`)
      return
    }
    onSalvar({ nome: paciente.trim(), data, responsavel, fonte, status, proximoFollowup, obs: obs.trim(), origem: 'leads_novos' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Lead</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável <span className="text-red-400">*</span></label>
            <select
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white"
            >
              <option value="">Selecione um responsável</option>
              <option value="Dra. Amanda">Dra. Amanda</option>
              <option value="Recepção">Recepção</option>
              <option value="Equipe">Equipe</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Paciente <span className="text-red-400">*</span></label>
          <input
            autoFocus
            type="text"
            value={paciente}
            onChange={e => setPaciente(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSalvar()}
            placeholder="Selecione ou cadastre um paciente..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Origem <span className="text-red-400">*</span></label>
            <select
              value={fonte}
              onChange={e => setFonte(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white"
            >
              <option value="">Selecione a origem</option>
              <option value="Instagram Anúncio">Instagram Anúncio</option>
              <option value="Instagram Orgânico">Instagram Orgânico</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="indicacao">Indicação</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status <span className="text-red-400">*</span></label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white"
            >
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Próximo Follow-up</label>
          <input
            type="date"
            value={proximoFollowup}
            onChange={e => setProximoFollowup(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Observações sobre o lead..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={!paciente.trim()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEditarLead({ lead, onClose, onSalvar, onExcluir }) {
  const { leadOrigens, leadMidias } = useConfig()
  const ORIGENS_PADRAO = ['Instagram Anúncio', 'Instagram Orgânico', 'Tráfego', 'Indicação', 'Retorno', 'Resgate', 'Fornecedores', 'Outros']
  const MIDIAS_PADRAO = ['Campanha de msg para Whatsapp', 'Link da BIO', 'Indicação', 'Link dos Stories']
  const origens = (leadOrigens || ORIGENS_PADRAO).filter(o => o !== 'WhatsApp')
  const midias = leadMidias || MIDIAS_PADRAO

  const [dataOrigem, setDataOrigem] = useState(lead.dataOrigem || lead.data || '')
  const [data, setData] = useState(lead.data || '')
  const [responsavel, setResponsavel] = useState(lead.responsavel || '')
  const [paciente, setPaciente] = useState(lead.nome || '')
  const [telefone, setTelefone] = useState(lead.telefone || '')
  const { addLembrete, lembretes: todosLembretes, deleteLembrete } = useAgenda()
  const [origemCustom, setOrigemCustom] = useState(lead.origemCustom || lead.fonte || '')
  const [midia, setMidia] = useState(lead.midia || (lead.origemCustom === 'Tráfego' ? 'Campanha de msg para Whatsapp' : ''))
  const [linkBio, setLinkBio] = useState(lead.linkBio || '')
  const [criativo, setCriativo] = useState(lead.criativo || '')
  const [adsEngajamento, setAdsEngajamento] = useState([])

  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', 'ads_engajamento').maybeSingle()
      .then(({ data }) => { if (data?.valor) setAdsEngajamento(data.valor) })
  }, [])
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

  const handleSalvar = () => {
    if (!paciente.trim()) return
    if (origemCustom === 'Instagram' && !['Link da BIO', 'Link dos Stories'].includes(midia)) {
      alert('Para origem Instagram, a mídia é obrigatória: selecione "Link da BIO" ou "Link dos Stories".')
      return
    }
    const lemsValidos = lembretes.filter(l => l.data)
    lemsValidos.forEach((l) => {
      addLembrete({ id: genUUID(), leadNome: paciente.trim(), leadTelefone: lead.telefone || '', descricao: l.obs || obs.trim() || '', data: l.data, hora: l.hora || '', cor: 'green', concluido: false, criadoEm: Date.now() })
    })
    const CONV = ['agendado', 'fechado']
    const FOLL = ['follow1', 'follow2', 'follow3']
    const ultimoFollow = (CONV.includes(status) && !CONV.includes(lead.status) && FOLL.includes(lead.status)) ? lead.status : undefined
    onSalvar(lead.id, { nome: paciente.trim(), telefone: telefone || null, dataOrigem: dataOrigem || data, data, responsavel, origemCustom, midia: midia || null, linkBio: midia === 'Link da BIO' ? (linkBio || null) : null, criativo: origemCustom === 'Tráfego' ? (criativo || null) : null, status, agendadoPara: agendadoPara || null, proximoFollowup: lemsValidos[0]?.data || '', lembretes: lemsValidos, obs: obs.trim(), ...(ultimoFollow !== undefined ? { ultimoFollow } : {}) })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar Lead</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="mb-1">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data de Origem <span className="text-xs text-gray-400 font-normal">(primeiro contato)</span></label>
          <input type="date" value={dataOrigem} onChange={e => setDataOrigem(e.target.value)}
            className="w-full border border-amber-200 bg-amber-50/40 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
              <option value="">Selecione</option>
              <option>Dra. Amanda</option>
              <option>Fernanda</option>
              <option>Recepção</option>
              <option>Equipe</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome *</label>
          <input autoFocus value={paciente} onChange={e => setPaciente(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Telefone</label>
          <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 64999001234"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Origem</label>
            <select value={origemCustom} onChange={e => {
              const nova = e.target.value
              setOrigemCustom(nova)
              if (nova === 'Tráfego') setMidia('Campanha de msg para Whatsapp')
            }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
              <option value="">Não informado</option>
              {origens.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </div>

        {origemCustom !== 'Tráfego' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Mídia {origemCustom === 'Instagram' && <span className="text-red-400">*</span>}
            </label>
            <select value={midia} onChange={e => { setMidia(e.target.value); if (e.target.value !== 'Link da BIO') setLinkBio('') }}
              style={origemCustom === 'Instagram' && !['Link da BIO', 'Link dos Stories'].includes(midia) ? { borderColor: '#fca5a5' } : {}}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
              <option value="">Não informado</option>
              {midias.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {origemCustom === 'Tráfego' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Criativo</label>
            <select value={criativo} onChange={e => setCriativo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
              <option value="">Não informado</option>
              {adsEngajamento.map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
            </select>
          </div>
        )}

        {midia === 'Link da BIO' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Link da BIO</label>
            <input value={linkBio} onChange={e => setLinkBio(e.target.value)}
              placeholder="Ex: link da bio, campanha, landing page..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
        )}

        {status === 'agendado' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <label className="text-sm font-semibold text-blue-700 mb-1.5 block">📅 Agendado para</label>
            <input type="date" value={agendadoPara} onChange={e => setAgendadoPara(e.target.value)}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
            <FeriadoAviso data={agendadoPara} />
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
              className="text-amber-500 hover:text-amber-700 text-lg font-bold leading-none px-1">+</button>
          </div>
          <div className="space-y-3">
            {lembretes.map((l, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-2.5 space-y-2 bg-gray-50">
                <div className="flex gap-2 items-center">
                  <input type="date" value={l.data} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, data: e.target.value } : x))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-amber-400 bg-white" />
                  <input type="time" value={l.hora} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, hora: e.target.value } : x))}
                    className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-amber-400 bg-white" />
                  {lembretes.length > 1 && (
                    <button type="button" onClick={() => setLembretes(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-400 text-xs font-bold flex-shrink-0">✕</button>
                  )}
                </div>
                <FeriadoAviso data={l.data} />
                <input value={l.obs} onChange={e => setLembretes(prev => prev.map((x, j) => j === i ? { ...x, obs: e.target.value } : x))}
                  placeholder="Observação deste lembrete..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-amber-400 bg-white" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
            placeholder="Observações sobre o lead..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 resize-none" />
        </div>

        <div className="flex items-center justify-between pt-1">
          {confirmando ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-500">Excluir lead?</span>
              <button onClick={() => { onExcluir(lead.id); onClose() }}
                className="text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50">Sim</button>
              <button onClick={() => setConfirmando(false)}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50">Não</button>
            </div>
          ) : (
            <button onClick={() => setConfirmando(true)}
              className="text-sm text-red-400 hover:text-red-600 font-semibold">Excluir</button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={!paciente.trim()}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const STATUS_PRIORITY = { perdido: 0, em_aberto: 1, conversando: 2, follow1: 3, follow2: 4, follow3: 5, agendado: 6, fechado: 7 }

function ModalMesclarDuplicata({ grupo, onMesclar, onFechar }) {
  const [a, b] = grupo
  const getFollow = k => FOLLOWS.find(f => f.key === k) || FOLLOWS[0]

  const merged = useMemo(() => {
    const origemA = a.origemCustom || ''
    const origemB = b.origemCustom || ''
    const melhorOrigem = (origemA && origemA !== 'WhatsApp') ? origemA : (origemB && origemB !== 'WhatsApp') ? origemB : (origemA || origemB)
    const priorA = STATUS_PRIORITY[a.status] ?? 0
    const priorB = STATUS_PRIORITY[b.status] ?? 0
    const dataOrigemMelhor = (a.dataOrigem && b.dataOrigem) ? (a.dataOrigem < b.dataOrigem ? a.dataOrigem : b.dataOrigem) : (a.dataOrigem || b.dataOrigem)
    const dataMelhor = (a.data && b.data) ? (a.data > b.data ? a.data : b.data) : (a.data || b.data)
    const obsMerged = [a.obs, b.obs].filter(Boolean).join(' | ')
    return {
      nome: a.nome || b.nome,
      telefone: a.telefone || b.telefone,
      origemCustom: melhorOrigem,
      status: priorA >= priorB ? a.status : b.status,
      dataOrigem: dataOrigemMelhor,
      data: dataMelhor,
      responsavel: a.responsavel || b.responsavel,
      midia: a.midia || b.midia,
      linkBio: a.linkBio || b.linkBio,
      criativo: a.criativo || b.criativo,
      obs: obsMerged,
      aniversario: a.aniversario || b.aniversario,
      agendadoPara: a.agendadoPara || b.agendadoPara,
      origem: a.origem || b.origem,
    }
  }, [a, b])

  const fa = getFollow(a.status)
  const fb = getFollow(b.status)
  const fm = getFollow(merged.status)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Mesclar Leads Duplicados</h3>
            <p className="text-xs text-gray-400 mt-0.5">O melhor dado de cada campo será mantido automaticamente</p>
          </div>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[{ lead: a, fa }, { lead: b, fa: fb }].map(({ lead, fa: f }, i) => (
            <div key={i} className={`rounded-xl p-3 border ${i === 0 ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${i === 0 ? 'text-orange-500' : 'text-blue-500'}`}>Lead {i === 0 ? 'A' : 'B'}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
              <p className="text-xs text-gray-400">{lead.telefone || '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Origem: <strong>{lead.origemCustom || '—'}</strong></p>
              <p className="text-xs text-gray-500">Data: <strong>{lead.data || '—'}</strong></p>
              <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.bg} ${f.text}`}>{f.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs font-bold text-green-700 mb-2">✓ Resultado após mesclar</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>Nome: <strong>{merged.nome}</strong></span>
            <span>Telefone: <strong>{merged.telefone || '—'}</strong></span>
            <span>Origem: <strong>{merged.origemCustom || '—'}</strong></span>
            <span>Responsável: <strong>{merged.responsavel || '—'}</strong></span>
            <span>Data de Origem: <strong>{merged.dataOrigem || '—'}</strong></span>
            <span className="flex items-center gap-1">Status: <span className={`font-semibold px-1.5 py-0.5 rounded-full text-[10px] ${fm.bg} ${fm.text}`}>{fm.label}</span></span>
            {merged.obs && <span className="col-span-2">Obs: <strong>{merged.obs}</strong></span>}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onMesclar(a, b, merged)} className="flex-1 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold">Mesclar e excluir duplicata</button>
        </div>
      </div>
    </div>
  )
}

export default function LeadsNovos() {
  const { userRole } = useAuth()
  const { ano, setAno, mes, setMes, MESES } = useFinanceiro()
  const { getLeadsPorOrigem, addLead, updateLead, removeLead, leads: todosLeads } = useLeads()
  const { lancamentos, addLancamento } = useVendas()
  const [modal, setModal] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalMesclar, setModalMesclar] = useState(null)
  const [modalImport, setModalImport] = useState(null)
  const [suspeitosDecisao, setSuspeitosDecisao] = useState([]) // 'pular' | 'importar' por índice
  const [importando, setImportando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [visao, setVisao] = useState('lista')
  const [dragOver, setDragOver] = useState(null)
  const [ordem, setOrdem] = useState('desc')

  const handleImportCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) return alert('CSV vazio ou sem dados.')
      const sep = lines[0].includes('\t') ? /\t/ : /[,;]/
      const header = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''))
      const rows = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep)
        const row = {}
        header.forEach((h, idx) => { row[h] = (cols[idx] || '').trim().replace(/^"|"$/g, '') })
        if (!row.nome && !row.telefone) continue

        // Normaliza data: dd/mm/yyyy → yyyy-mm-dd (tolera barras duplas como 12/08//2026)
        const parseData = (str) => {
          if (!str) return ''
          const parts = str.split(/[\/\-]+/).filter(Boolean)
          if (parts.length === 3) {
            if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`
            return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
          }
          return ''
        }

        // Normaliza origem
        const rawOrigem = (row.origem || '').toUpperCase()
        let origemCustom = 'Instagram'
        let midia = ''
        if (rawOrigem.includes('TRAFEGO') || rawOrigem.includes('TRÁFEGO')) { origemCustom = 'Tráfego'; midia = 'Campanha de msg para Whatsapp' }
        else if (rawOrigem.includes('INDICACAO') || rawOrigem.includes('INDICAÇÃO')) { origemCustom = 'Indicação' }
        else if (rawOrigem.includes('STORIES')) { origemCustom = 'Instagram'; midia = 'Link dos Stories' }
        else if (rawOrigem.includes('BIO') || rawOrigem.includes('INSTAGRAM')) { origemCustom = 'Instagram'; midia = 'Link da BIO' }
        else if (rawOrigem.includes('ONLINE')) { origemCustom = 'Online' }

        const criativo = origemCustom === 'Tráfego' ? (row.criativo || '') : ''
        const data = parseData(row.data || row.date || '')
        const agendou = (row.agendou || '').toUpperCase() === 'SIM'

        // Parseia valor monetário: "R$ 8.400,00" → 8400
        const parseValor = (str) => {
          if (!str) return 0
          const v = parseFloat(str.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim())
          return isNaN(v) ? 0 : v
        }
        const valorConsulta = parseValor(row.consulta)

        rows.push({
          nome: row.nome || '',
          telefone: (row.telefone || '').replace(/\D/g, '') ? row.telefone : '',
          data,
          dataOrigem: data,
          origemCustom,
          midia,
          criativo,
          status: agendou ? 'agendado' : 'em_aberto',
          origem: origemCustom === 'Indicação' ? 'indicacao' : 'leads_novos',
          obs: '',
          responsavel: '',
          _valorConsulta: valorConsulta,
        })
      }

      const normNome = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
      const primNome = (s) => normNome(s).split(/\s+/)[0]

      // Normaliza telefone: remove +55, remove o 9 extra do celular → compara últimos 8 dígitos
      const normTel = (t) => {
        const d = (t || '').replace(/\D/g, '')
        if (d.length < 6) return ''
        return d.slice(-8)
      }

      // Só verifica duplicatas dentro do mesmo mês
      const leadsDoMes = todosLeads.filter(l => (l.dataOrigem || l.data || '').startsWith(prefix))

      const telefonesExistentes = new Set(
        leadsDoMes.map(l => normTel(l.telefone)).filter(t => t.length >= 6)
      )
      const nomesExistentes = new Set(leadsDoMes.map(l => normNome(l.nome)))
      // mapa: primeiro nome normalizado → leads no sistema
      const primNomesMap = {}
      leadsDoMes.forEach(l => {
        const pn = primNome(l.nome)
        if (pn.length < 3) return
        if (!primNomesMap[pn]) primNomesMap[pn] = []
        primNomesMap[pn].push(l)
      })

      const novos = []
      const duplicatas = []
      const suspeitos = []
      rows.forEach(r => {
        const tel = normTel(r.telefone)
        const nome = normNome(r.nome)
        const pn = primNome(r.nome)
        if (tel.length >= 6 && telefonesExistentes.has(tel)) {
          // Telefone idêntico = duplicata definitiva
          duplicatas.push(r)
        } else {
          // Nome exato OU primeiro nome batem com existente → suspeito para confirmar
          const matchesNome = nomesExistentes.has(nome)
            ? todosLeads.filter(l => normNome(l.nome) === nome)
            : []
          const matchesPrim = pn.length >= 3 && primNomesMap[pn] ? primNomesMap[pn] : []
          const matches = matchesNome.length ? matchesNome : matchesPrim
          if (matches.length > 0) {
            suspeitos.push({ lead: r, matches })
          } else {
            novos.push(r)
          }
        }
      })
      setModalImport({ novos, duplicatas, suspeitos })
      setSuspeitosDecisao(new Array(suspeitos.length).fill('pular'))
    }
    reader.readAsText(file, 'UTF-8')
  }

  const confirmarImport = async () => {
    if (!modalImport) return
    setImportando(true)
    let leadsImportados = 0
    let lancamentosImportados = 0

    const criarLancamento = async (lead) => {
      if (!(lead._valorConsulta > 0) || lead.status !== 'agendado') return
      await addLancamento({
        paciente: lead.nome,
        tipo: lead.origemCustom === 'Indicação' ? 'Indicação' : 'Novo',
        procedimentos: 'Consulta',
        valorTaxa: lead._valorConsulta,
        valorTratamento: 0,
        data: lead.data,
      })
      lancamentosImportados++
    }

    for (const lead of (modalImport.novos || [])) {
      const { _valorConsulta, ...leadData } = lead
      await addLead(leadData)
      leadsImportados++
      await criarLancamento(lead)
    }

    // Suspeitos marcados como 'importar' viram novos leads
    for (let i = 0; i < (modalImport.suspeitos || []).length; i++) {
      const { lead } = modalImport.suspeitos[i]
      if (suspeitosDecisao[i] === 'importar') {
        const { _valorConsulta, ...leadData } = lead
        await addLead(leadData)
        leadsImportados++
        await criarLancamento(lead)
      } else {
        // marcado como duplicata: só lança consulta se houver
        await criarLancamento(lead)
      }
    }

    // Duplicatas exatas: lead já existe, lançamentos já foram criados na importação anterior — pula

    setImportando(false)
    setModalImport(null)
    const msgs = []
    if (leadsImportados > 0) msgs.push(`${leadsImportados} lead(s) importado(s)`)
    if (lancamentosImportados > 0) msgs.push(`${lancamentosImportados} consulta(s) lançada(s) no Faturamento`)
    alert(msgs.join(' · ') || 'Nada importado.')
  }

  // Normaliza telefone para comparação: usa últimos 8 dígitos (ignora +55 e o 9 extra)
  const normTelGlobal = (t) => {
    const d = (t || '').replace(/\D/g, '')
    if (d.length < 6) return ''
    return d.slice(-8)
  }

  const gruposDuplicatas = useMemo(() => {
    const groups = {}
    todosLeads.filter(l => l.origem === 'leads_novos' || l.origem === 'indicacao').forEach(l => {
      const tel = normTelGlobal(l.telefone)
      if (!tel) return
      // Agrupa por telefone normalizado + mês de origem (não mescla meses diferentes)
      const mesRef = (l.dataOrigem || l.data || '').slice(0, 7)
      const key = `${tel}__${mesRef}`
      if (!groups[key]) groups[key] = []
      groups[key].push(l)
    })
    return Object.values(groups).filter(g => g.length >= 2)
  }, [todosLeads])

  const telesDuplicados = useMemo(() => new Set(gruposDuplicatas.flat().map(l => normTelGlobal(l.telefone))), [gruposDuplicatas])

  const isDuplicata = (lead) => {
    const tel = normTelGlobal(lead.telefone)
    return !!tel && telesDuplicados.has(tel)
  }

  const resolverTodasDuplicatas = async () => {
    if (!window.confirm(`Resolver ${gruposDuplicatas.length} grupo(s) de duplicatas automaticamente? O lead com melhor status será mantido.`)) return
    setImportando(true)
    let resolvidos = 0
    for (const grupo of gruposDuplicatas) {
      // Ordena por prioridade de status (maior = melhor)
      const sorted = [...grupo].sort((a, b) => (STATUS_PRIORITY[b.status] ?? 0) - (STATUS_PRIORITY[a.status] ?? 0))
      const manter = sorted[0]
      const excluir = sorted.slice(1)
      // Mescla dados do melhor lead com os demais
      const merged = {
        nome: sorted.find(l => l.nome)?.nome || manter.nome,
        telefone: sorted.find(l => l.telefone)?.telefone || manter.telefone,
        origemCustom: sorted.find(l => l.origemCustom && l.origemCustom !== 'WhatsApp')?.origemCustom || manter.origemCustom,
        responsavel: sorted.find(l => l.responsavel)?.responsavel || '',
        midia: sorted.find(l => l.midia)?.midia || null,
        criativo: sorted.find(l => l.criativo)?.criativo || null,
        dataOrigem: sorted.map(l => l.dataOrigem || l.data).filter(Boolean).sort()[0] || manter.dataOrigem,
        data: manter.data,
        status: manter.status,
        obs: sorted.map(l => l.obs).filter(Boolean).join(' | ') || '',
        agendadoPara: sorted.find(l => l.agendadoPara)?.agendadoPara || null,
        origem: manter.origem,
      }
      await updateLead(manter.id, merged)
      for (const l of excluir) await removeLead(l.id)
      resolvidos++
    }
    setImportando(false)
    alert(`${resolvidos} duplicata(s) resolvida(s) automaticamente.`)
  }

  const mesclarLeads = async (a, b, merged) => {
    const priorA = STATUS_PRIORITY[a.status] ?? 0
    const priorB = STATUS_PRIORITY[b.status] ?? 0
    const manter = priorA >= priorB ? a : b
    const excluir = manter.id === a.id ? b : a
    await updateLead(manter.id, merged)
    await removeLead(excluir.id)
    setModalMesclar(null)
  }

  const leads = getLeadsPorOrigem('leads_novos', ano, mes)
  const leadsIndicacao = getLeadsPorOrigem('indicacao', ano, mes)

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const isFollowUp = (lead) => {
    const dataRef = lead.dataOrigem || lead.data || ''
    return dataRef && !dataRef.startsWith(prefix)
  }
  const mesOrigem = (lead) => {
    const dataRef = lead.dataOrigem || lead.data || ''
    if (!dataRef) return ''
    const [y, m] = dataRef.split('-')
    return `${MESES_FULL[parseInt(m, 10) - 1]?.slice(0, 3)}/${y?.slice(2)}`
  }

  const contIndicacao = leadsIndicacao.length
  const leadsNovosCount = leads.filter(l => !isFollowUp(l)).length
  const leadsEmFollowCount = leads.filter(l => isFollowUp(l)).length

  // Consultas pagas neste mês (direto do Faturamento, sem alterar status de leads)
  const consultasMes = lancamentos.filter(l =>
    (l.data || '').startsWith(prefix) && (l.procedimentos || '').toLowerCase().trim() === 'consulta'
  )

  const CONV_STATUS = ['agendado', 'fechado']
  const FOLLOW_STATUS = ['follow1', 'follow2', 'follow3']

  const funil = {
    em_aberto:   leads.filter(l => l.status === 'em_aberto').length,
    conversando: leads.filter(l => l.status === 'conversando').length,
    follow1:     leads.filter(l => l.status === 'follow1').length,
    follow2:     leads.filter(l => l.status === 'follow2').length,
    follow3:     leads.filter(l => l.status === 'follow3').length,
    agendado:    leads.filter(l => l.status === 'agendado').length,
    fechado:     leads.filter(l => l.status === 'fechado').length,
    perdido:     leads.filter(l => l.status === 'perdido').length,
  }

  const convPorFollow = consultasMes.reduce((acc, lanc) => {
    const nome = (lanc.paciente || '').toLowerCase().trim()
    const lead = leads.find(l => (l.nome || '').toLowerCase().trim() === nome)
    const stage = lead?.ultimoFollow || null
    if (stage === 'follow1') acc.follow1++
    else if (stage === 'follow2') acc.follow2++
    else if (stage === 'follow3') acc.follow3++
    else acc.direto++
    return acc
  }, { direto: 0, follow1: 0, follow2: 0, follow3: 0 })

  const handleStatusChange = (lead, newStatus) => {
    const updates = { status: newStatus }
    if (CONV_STATUS.includes(newStatus) && !CONV_STATUS.includes(lead.status)) {
      updates.ultimoFollow = FOLLOW_STATUS.includes(lead.status) ? lead.status : null
    }
    updateLead(lead.id, updates)
  }

  const leadsFollowMes = todosLeads
    .filter(l => l.origem === 'leads_novos' && ['follow1', 'follow2', 'follow3'].includes(l.status) && !(l.dataOrigem || l.data || '').startsWith(prefix))
    .sort((a, b) => (a.proximoFollowup || '').localeCompare(b.proximoFollowup || ''))

  const origensDisponiveis = [...new Set(leads.map(l => l.origemCustom || l.fonte || '').filter(Boolean))].sort()

  const leadsFiltrados = leads
    .filter(l => (l.nome || '').toLowerCase().includes(busca.toLowerCase()))
    .filter(l => !filtroOrigem || (l.origemCustom || l.fonte || '') === filtroOrigem)
    .sort((a, b) => {
      const da = a.data || ''
      const db = b.data || ''
      return ordem === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
    })

  const agendados = consultasMes.length
  const totalLeadsMes = leads.length + leadsIndicacao.length
  const taxa = totalLeadsMes > 0 ? ((agendados / totalLeadsMes) * 100).toFixed(1) : '0.0'

  const dataFormatada = (data) => {
    const [, m, d] = data.split('-')
    return `${d}/${m}`
  }

  const abrirInboxContato = (telefone, e) => {
    if (e) e.stopPropagation()
    if (!telefone) return
    sessionStorage.setItem('inbox_abrir_telefone', telefone)
    window.dispatchEvent(new CustomEvent('navegarInbox'))
  }

  function IconeWpp({ ativo }) {
    return (
      <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-opacity ${ativo ? 'opacity-80 hover:opacity-100' : 'opacity-20'}`} fill={ativo ? '#25D366' : '#9ca3af'}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leads Novos</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => { if (mes === 0) { setMes(11); setAno(a => a-1) } else setMes(m => m-1) }} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-24 text-center">{MESES_FULL[mes].slice(0,3)} {ano}</span>
            <button onClick={() => { if (mes === 11) { setMes(0); setAno(a => a+1) } else setMes(m => m+1) }} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <label className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm border border-gray-200 cursor-pointer" title="Importar CSV">
            ↑ Importar CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
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
        <select
          value={filtroOrigem}
          onChange={e => setFiltroOrigem(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white text-gray-600"
        >
          <option value="">Todas as origens</option>
          {origensDisponiveis.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Banner duplicatas */}
      {gruposDuplicatas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">{gruposDuplicatas.length} {gruposDuplicatas.length === 1 ? 'lead duplicado detectado' : 'leads duplicados detectados'}</p>
              <p className="text-xs text-amber-600">Mesmo telefone cadastrado mais de uma vez no sistema</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {gruposDuplicatas.slice(0, 3).map((grupo, i) => {
              const meses = [...new Set(grupo.map(l => {
                const d = l.data || ''
                if (!d) return null
                const [y, m] = d.split('-')
                return `${MESES_FULL[parseInt(m, 10) - 1]?.slice(0, 3)}/${y?.slice(2)}`
              }).filter(Boolean))].join(' · ')
              return (
                <button key={i} onClick={() => setModalMesclar(grupo)}
                  className="text-xs bg-amber-400 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-left leading-tight">
                  <span className="block">{grupo[0].nome}</span>
                  {meses && <span className="block text-[10px] opacity-75 font-normal">{meses}</span>}
                </button>
              )
            })}
            {gruposDuplicatas.length > 3 && (
              <button onClick={() => setModalMesclar(gruposDuplicatas[3])}
                className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                +{gruposDuplicatas.length - 3} mais
              </button>
            )}
            <button onClick={resolverTodasDuplicatas} disabled={importando}
              className="text-xs bg-red-400 hover:bg-red-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {importando ? 'Resolvendo...' : '✓ Resolver todas'}
            </button>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Total de Leads</p>
            <span className="text-orange-400 text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalLeadsMes}</p>
          <div className="mt-2 space-y-1 pt-2 border-t border-gray-50">
            <div className="flex justify-between text-xs"><span className="text-blue-400">Novos este mês</span><span className="font-semibold text-blue-600">{leadsNovosCount}</span></div>
            {contIndicacao > 0 && <div className="flex justify-between text-xs"><span className="text-pink-400">Indicações</span><span className="font-semibold text-pink-500">{contIndicacao}</span></div>}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Taxa de Conversão</p>
            <span className="text-green-400 text-lg">📈</span>
          </div>
          <p className={`text-3xl font-bold ${parseFloat(taxa) > 15 ? 'text-green-600' : parseFloat(taxa) >= 10 ? 'text-orange-500' : 'text-red-500'}`}>{taxa}%</p>
          <p className="text-xs text-gray-400 mt-1">{agendados} agendamentos</p>
          {agendados > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-400 font-medium">Converteram de:</p>
              {convPorFollow.direto > 0  && <div className="flex justify-between text-xs"><span className="text-gray-400">Sem follow</span><span className="font-semibold text-gray-500">{convPorFollow.direto}</span></div>}
              {convPorFollow.follow1 > 0 && <div className="flex justify-between text-xs"><span className="text-orange-400">Follow #1</span><span className="font-semibold text-orange-500">{convPorFollow.follow1}</span></div>}
              {convPorFollow.follow2 > 0 && <div className="flex justify-between text-xs"><span className="text-yellow-500">Follow #2</span><span className="font-semibold text-yellow-600">{convPorFollow.follow2}</span></div>}
              {convPorFollow.follow3 > 0 && <div className="flex justify-between text-xs"><span className="text-amber-500">Follow #3</span><span className="font-semibold text-amber-700">{convPorFollow.follow3}</span></div>}
            </div>
          )}
          {agendados === 0 && (
            <p className="text-xs text-gray-300 mt-3">Nenhuma conversão rastreada ainda</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Agendamentos</p>
            <span className="text-blue-400 text-lg">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{consultasMes.length}</p>
          <p className="text-xs text-gray-400 mt-1">consultas pagas este mês</p>
          <div className="mt-3 space-y-1">
            {consultasMes.map((l, i) => (
              <p key={i} className="text-xs text-gray-500">· {l.paciente}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Lista / Quadro */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Leads do Mês — {MESES_FULL[mes]}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{leadsFiltrados.length} leads</span>
            <button onClick={() => setOrdem(o => o === 'desc' ? 'asc' : 'desc')} title={ordem === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'} className="text-xs text-gray-500 hover:text-orange-500 border border-gray-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1 transition-colors hover:bg-gray-50">
              {ordem === 'desc' ? '↓' : '↑'} Data
            </button>
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
            {/* Cabeçalho da tabela */}
            <div className="grid items-center px-5 py-2 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wide select-none"
              style={{ gridTemplateColumns: '2rem 1fr 5.5rem 7rem 1.5rem 1.5rem', gap: '1rem' }}>
              <div />
              <div>Nome</div>
              <div>Data de Origem</div>
              <div>Status</div>
              <div />
              <div />
            </div>
            {leadsFiltrados.map(lead => {
              const follow = getFollow(lead.status)
              return (
                <div key={lead.id}
                  className="grid items-center px-5 py-3.5 hover:bg-gray-50 transition-colors group cursor-pointer"
                  style={{ gridTemplateColumns: '2rem 1fr 5.5rem 7rem 1.5rem 1.5rem', gap: '1rem' }}
                  onClick={() => setModalEditar(lead)}>
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm">
                    {lead.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                      {isDuplicata(lead) && (
                        <button onClick={e => { e.stopPropagation(); setModalMesclar(gruposDuplicatas.find(g => g.some(l => l.id === lead.id))) }}
                          title="Lead duplicado — clique para mesclar"
                          className="flex-shrink-0 text-amber-500 hover:text-amber-600 text-xs font-bold leading-none">⚠️</button>
                      )}
                    </div>
                    {lead.status === 'agendado' && lead.agendadoPara ? (
                      <p className="text-xs text-blue-500 font-semibold">📅 {dataFormatada(lead.agendadoPara)}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Lead {dataFormatada(lead.data)}</p>
                    )}
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${isFollowUp(lead) ? 'text-amber-500' : 'text-gray-400'}`}>
                      {mesOrigem(lead) || '—'}
                    </span>
                  </div>
                  <select
                    value={lead.status}
                    onChange={e => { e.stopPropagation(); handleStatusChange(lead, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    className={`w-full text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${follow.bg} ${follow.text}`}
                  >
                    {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <div className="flex items-center justify-center">
                    <button onClick={e => abrirInboxContato(lead.telefone, e)} disabled={!lead.telefone} title={lead.telefone ? `Abrir conversa: ${lead.telefone}` : 'Sem telefone'} className="cursor-pointer disabled:cursor-not-allowed">
                      <IconeWpp ativo={!!lead.telefone} />
                    </button>
                  </div>
                  <div className="flex items-center justify-center">
                    {userRole !== 'Funcionário' && (confirmDelete === lead.id ? (
                      <div className="absolute z-10 bg-white shadow-lg rounded-xl p-3 right-5 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                        <p className="text-xs text-gray-400 whitespace-nowrap">Excluir do sistema?</p>
                        <p className="text-xs text-gray-300 whitespace-nowrap">WhatsApp não é afetado</p>
                        <div className="flex gap-1">
                          <button onClick={() => { removeLead(lead.id); setConfirmDelete(null) }} className="text-xs text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50">Sim</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 px-2 py-1 rounded hover:bg-gray-100">Não</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(lead.id) }} title="Excluir lead do sistema" className="opacity-20 group-hover:opacity-70 hover:!opacity-100 text-gray-400 hover:text-red-400 text-sm transition-all">✕</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Quadro Kanban */
          <div className="flex gap-3 p-4 overflow-x-auto">
            {FOLLOWS.map(col => {
              const colLeads = leadsFiltrados.filter(l => l.status === col.key)
              const isDragOver = dragOver === col.key
              return (
                <div key={col.key}
                  className={`flex-shrink-0 w-52 rounded-xl p-3 transition-colors ${isDragOver ? 'bg-amber-50 ring-2 ring-amber-300' : 'bg-gray-50'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
                  onDrop={e => {
                    e.preventDefault()
                    const leadId = e.dataTransfer.getData('leadId')
                    if (leadId) { const lead = leads.find(l => l.id === leadId); if (lead) handleStatusChange(lead, col.key) }
                    setDragOver(null)
                  }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{col.label}</span>
                    <span className="text-xs text-gray-400 font-semibold">{colLeads.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[60px]">
                    {colLeads.length === 0 ? (
                      <p className={`text-xs text-center py-4 transition-colors ${isDragOver ? 'text-amber-400 font-semibold' : 'text-gray-300'}`}>
                        {isDragOver ? 'Soltar aqui' : 'Nenhum item'}
                      </p>
                    ) : colLeads.map(lead => (
                      <div key={lead.id}
                        draggable
                        onDragStart={e => { e.dataTransfer.setData('leadId', lead.id); e.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => setDragOver(null)}
                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:border-amber-200 transition-colors"
                        onClick={() => setModalEditar(lead)}>
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                        {lead.status === 'agendado' && lead.agendadoPara ? (
                          <p className="text-xs text-blue-500 font-semibold mt-0.5">📅 {dataFormatada(lead.agendadoPara)}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Lead {dataFormatada(lead.data)}
                            {mesOrigem(lead) && (
                              <span className={`ml-1.5 font-semibold ${isFollowUp(lead) ? 'text-amber-500' : 'text-gray-400'}`}>
                                · Origem {mesOrigem(lead)}
                              </span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <select
                            value={lead.status}
                            onChange={e => { e.stopPropagation(); handleStatusChange(lead, e.target.value) }}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-gray-400 outline-none bg-transparent cursor-pointer"
                          >
                            {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                          <button onClick={e => abrirInboxContato(lead.telefone, e)} disabled={!lead.telefone} className="disabled:cursor-not-allowed">
                            <IconeWpp ativo={!!lead.telefone} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {colLeads.length > 0 && isDragOver && (
                      <div className="border-2 border-dashed border-amber-300 rounded-xl h-12 flex items-center justify-center">
                        <span className="text-xs text-amber-400 font-semibold">Soltar aqui</span>
                      </div>
                    )}
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
          leads={leads}
        />
      )}
      {modalEditar && (
        <ModalEditarLead
          lead={modalEditar}
          onClose={() => setModalEditar(null)}
          onSalvar={updateLead}
          onExcluir={removeLead}
        />
      )}
      {modalMesclar && (
        <ModalMesclarDuplicata
          grupo={modalMesclar}
          onMesclar={mesclarLeads}
          onFechar={() => setModalMesclar(null)}
        />
      )}

      {modalImport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !importando && setModalImport(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Importar Leads do CSV</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modalImport.novos.length} novos · {modalImport.duplicatas.length} já existem
                  {modalImport.suspeitos.length > 0 ? ` · ${modalImport.suspeitos.length} para verificar` : ''}
                </p>
              </div>
              {!importando && <button onClick={() => setModalImport(null)} className="text-gray-400 hover:text-gray-600">✕</button>}
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-3 space-y-4">
              {/* Possíveis duplicatas — requer decisão */}
              {modalImport.suspeitos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-yellow-600 mb-2">Possíveis duplicatas — confirme:</p>
                  <div className="flex flex-col gap-2">
                    {modalImport.suspeitos.map((s, i) => (
                      <div key={i} className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-800">{s.lead.nome}</p>
                              {s.lead.telefone && <span className="text-xs text-blue-500 font-mono">{s.lead.telefone}</span>}
                            </div>
                            <p className="text-xs text-gray-500">CSV · {s.lead.origemCustom}{s.lead._valorConsulta > 0 ? ` · consulta R$ ${s.lead._valorConsulta.toLocaleString('pt-BR', {minimumFractionDigits:2})}` : ''}</p>
                            <div className="mt-1.5 border-t border-yellow-200 pt-1.5 space-y-0.5">
                              {s.matches.map((m, mi) => (
                                <div key={mi} className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500">Sistema: <span className="font-medium">{m.nome}</span></p>
                                  {m.telefone && <span className="text-xs text-gray-400 font-mono">{m.telefone}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSuspeitosDecisao(d => d.map((v, j) => j === i ? 'pular' : v))}
                            className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${suspeitosDecisao[i] === 'pular' ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                          >
                            É a mesma pessoa
                          </button>
                          <button
                            onClick={() => setSuspeitosDecisao(d => d.map((v, j) => j === i ? 'importar' : v))}
                            className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${suspeitosDecisao[i] === 'importar' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                          >
                            É lead novo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Novos leads confirmados */}
              {modalImport.novos.length === 0 && modalImport.suspeitos.length === 0 && modalImport.duplicatas.filter(d => d._valorConsulta > 0).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Todos os leads já estão cadastrados no sistema.</p>
              ) : modalImport.novos.length > 0 && (
                <div>
                  {modalImport.suspeitos.length > 0 && <p className="text-xs font-semibold text-gray-500 mb-2">Novos leads:</p>}
                  <div className="flex flex-col gap-2">
                    {modalImport.novos.map((l, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{l.nome}</p>
                          <p className="text-xs text-gray-400">{l.origemCustom}{l.midia ? ` · ${l.midia}` : ''}{l.criativo ? ` · ${l.criativo}` : ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">{(l.data || '').slice(8,10)}/{(l.data || '').slice(5,7)}</p>
                          <p className="text-xs text-gray-400">{l.status === 'agendado' ? '✓ Agendou' : 'Em aberto'}{l._valorConsulta > 0 ? ` · consulta R$ ${l._valorConsulta.toLocaleString('pt-BR', {minimumFractionDigits:2})}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(modalImport.novos.length > 0 || modalImport.suspeitos.length > 0 || modalImport.duplicatas.filter(d => d._valorConsulta > 0 && d.status === 'agendado').length > 0) && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setModalImport(null)} disabled={importando} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={confirmarImport} disabled={importando} className="flex-1 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {importando ? 'Importando...' : (() => {
                    const novosTotal = modalImport.novos.length + suspeitosDecisao.filter(d => d === 'importar').length
                    const consultasTotal = modalImport.suspeitos
                      .filter((_, i) => suspeitosDecisao[i] === 'importar')
                      .map(s => s.lead)
                      .filter(d => d._valorConsulta > 0 && d.status === 'agendado').length
                    const parts = []
                    if (novosTotal > 0) parts.push(`${novosTotal} lead${novosTotal > 1 ? 's' : ''}`)
                    if (consultasTotal > 0) parts.push(`${consultasTotal} consulta${consultasTotal > 1 ? 's' : ''}`)
                    return `Confirmar${parts.length ? ` (${parts.join(' + ')})` : ''}`
                  })()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
