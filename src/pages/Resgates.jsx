import { useState, useMemo } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useAgenda } from '../context/AgendaContext'
import { RESGATES_IMPORT } from '../data/resgatesImport'
import { RESGATES_IMPORT2 } from '../data/resgatesImport2'
import { RESGATES_IMPORT3 } from '../data/resgatesImport3'

const MOTIVOS = ['Não respondeu', 'Preço alto', 'Não tem interesse agora', 'Escolheu concorrente', 'Sem condições financeiras', 'Outro']
const ORIGENS = ['WhatsApp', 'Instagram Anúncio', 'Instagram Orgânico', 'Tráfego', 'Indicação', 'Retorno', 'Outro']

function ModalNovoResgate({ onSalvar, onFechar }) {
  const hoje = new Date().toISOString().slice(0, 10)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [origem, setOrigem] = useState('WhatsApp')
  const [motivo, setMotivo] = useState('')
  const [proximoFollowup, setProximoFollowup] = useState('')
  const [obs, setObs] = useState('')
  const [data, setData] = useState(hoje)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Novo Resgate</h2>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome <span className="text-red-400">*</span></label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do lead"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefone <span className="text-gray-300">(opcional)</span></label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Data do lead</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Origem</label>
            <select value={origem} onChange={e => setOrigem(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300">
              {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Motivo da perda <span className="text-red-400">*</span></label>
            <select value={motivo} onChange={e => setMotivo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300">
              <option value="">Selecionar...</option>
              {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Próximo contato</label>
            <input type="date" value={proximoFollowup} onChange={e => setProximoFollowup(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
              placeholder="Anotações sobre o lead..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button
            disabled={!nome.trim() || !motivo}
            onClick={() => onSalvar({ nome: nome.trim(), telefone, origemCustom: origem, data, status: 'perdido', obs: motivo ? `[${motivo}] ${obs}`.trim() : obs, proximoFollowup, origem: 'leads_novos' })}
            className="px-5 py-2 bg-brand-400 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function abrirWhatsApp(telefone) {
  const digits = (telefone || '').replace(/\D/g, '')
  if (!digits) return
  const num = digits.startsWith('55') ? digits : `55${digits}`
  window.open(`https://wa.me/${num}`, '_blank')
}

function formatData(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function StatusFollowup({ data, hoje }) {
  if (!data) return <span className="text-xs text-gray-400">Sem agenda</span>
  if (data < hoje) return <span className="text-xs font-semibold text-red-500">⚠️ Atrasado · {formatData(data)}</span>
  if (data === hoje) return <span className="text-xs font-semibold text-amber-600">🔔 Hoje · {formatData(data)}</span>
  return <span className="text-xs text-blue-600">{formatData(data)}</span>
}

function ModalReativar({ lead, onConfirmar, onFechar }) {
  const [status, setStatus] = useState('em_aberto')
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">Reativar lead</h2>
        <p className="text-sm text-gray-500">Mover <strong>{lead.nome}</strong> para qual etapa?</p>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300">
          <option value="em_aberto">Em aberto</option>
          <option value="conversando">Conversando</option>
          <option value="follow1">Follow #1</option>
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onConfirmar(status)} className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl">Reativar</button>
        </div>
      </div>
    </div>
  )
}

function ModalEditar({ lead, onSalvar, onFechar }) {
  const [proximoFollowup, setProximoFollowup] = useState(lead.proximoFollowup || '')
  const [motivo, setMotivo] = useState('')
  const [obs, setObs] = useState(lead.obs || '')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Editar resgate — {lead.nome}</h2>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Motivo da perda <span className="text-red-400">*</span></label>
          <select value={motivo} onChange={e => setMotivo(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300">
            <option value="">Selecionar motivo...</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Próximo contato</label>
          <input type="date" value={proximoFollowup} onChange={e => setProximoFollowup(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 resize-none"
            placeholder="Anotações sobre o contato..." />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onSalvar({ proximoFollowup, obs: motivo ? `[${motivo}] ${obs}`.trim() : obs })}
            disabled={!motivo}
            className="px-5 py-2 bg-brand-400 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl">Salvar</button>
        </div>
      </div>
    </div>
  )
}

export default function Resgates() {
  const { leads, updateLead, importLeads } = useLeads()
  const { addLembrete } = useAgenda()

  const hoje = new Date().toISOString().slice(0, 10)

  const perdidos = useMemo(() =>
    leads
      .filter(l => l.status === 'perdido')
      .sort((a, b) => {
        const aVenc = a.proximoFollowup && a.proximoFollowup < hoje
        const bVenc = b.proximoFollowup && b.proximoFollowup < hoje
        const aHoje = a.proximoFollowup === hoje
        const bHoje = b.proximoFollowup === hoje
        if (aVenc !== bVenc) return aVenc ? -1 : 1
        if (aHoje !== bHoje) return aHoje ? -1 : 1
        if (a.proximoFollowup && b.proximoFollowup) return a.proximoFollowup.localeCompare(b.proximoFollowup)
        if (a.proximoFollowup) return -1
        if (b.proximoFollowup) return 1
        return (b.data || '').localeCompare(a.data || '')
      })
  , [leads, hoje])

  const atrasados = perdidos.filter(l => l.proximoFollowup && l.proximoFollowup < hoje).length
  const paraHoje  = perdidos.filter(l => l.proximoFollowup === hoje).length
  const semAgenda = perdidos.filter(l => !l.proximoFollowup).length

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modalReativar, setModalReativar] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalNovo, setModalNovo] = useState(false)
  const [importando, setImportando] = useState(false)
  const jaImportado = leads.some(l => l.nome === 'Glauce' && l.status === 'perdido' && l.data === '2025-05-04')
  const jaImportado2 = leads.some(l => l.nome === 'Edvania Cardim' && l.status === 'perdido')
  const jaImportado3 = leads.some(l => l.nome === 'Eliane Sterchile' && l.status === 'perdido')

  const filtrados = perdidos.filter(l => {
    const termo = busca.toLowerCase()
    const matchBusca = !busca || (l.nome || '').toLowerCase().includes(termo) || (l.telefone || '').includes(busca)
    const matchStatus =
      filtroStatus === 'todos' ? true
      : filtroStatus === 'atrasado' ? (l.proximoFollowup && l.proximoFollowup < hoje)
      : filtroStatus === 'hoje' ? (l.proximoFollowup === hoje)
      : filtroStatus === 'sem_agenda' ? !l.proximoFollowup
      : true
    return matchBusca && matchStatus
  })

  const handleImportar = async () => {
    if (!window.confirm(`Importar ${RESGATES_IMPORT.length} leads do sistema antigo?\n\nLeads com nomes já existentes serão ignorados.`)) return
    setImportando(true)
    const importados = await importLeads(RESGATES_IMPORT)
    setImportando(false)
    alert(`✅ ${importados} leads importados com sucesso!`)
  }

  const handleNovoResgate = async (dados) => {
    const novoLead = await addLead(dados)
    if (dados.proximoFollowup && novoLead) {
      addLembrete({
        id: Date.now(),
        leadNome: dados.nome,
        leadTelefone: dados.telefone || '',
        descricao: `Follow-up resgate — ${dados.nome}`,
        data: dados.proximoFollowup,
        hora: '09:00',
        cor: 'red',
        concluido: false,
        criadoEm: Date.now(),
      })
    }
    setModalNovo(false)
  }

  const handleReativar = async (lead, status) => {
    await updateLead(lead.id, { status, proximoFollowup: '' })
    setModalReativar(null)
  }

  const handleSalvarEdicao = async (lead, dados) => {
    await updateLead(lead.id, dados)
    if (dados.proximoFollowup) {
      addLembrete({
        id: Date.now(),
        leadNome: lead.nome,
        leadTelefone: lead.telefone || '',
        descricao: `Follow-up resgate — ${lead.nome}`,
        data: dados.proximoFollowup,
        hora: '09:00',
        cor: 'red',
        concluido: false,
        criadoEm: Date.now(),
      })
    }
    setModalEditar(null)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">♻️ Resgates</h1>
          <p className="text-sm text-gray-400 mt-1">Leads perdidos que podem ser reconquistados</p>
        </div>
        <div className="flex gap-2">
          {!jaImportado && (
            <button onClick={handleImportar} disabled={importando}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {importando ? 'Importando...' : '⬆️ Importar lista 1'}
            </button>
          )}
          {!jaImportado2 && (
            <button onClick={async () => {
              if (!window.confirm(`Importar ${RESGATES_IMPORT2.length} leads? Duplicatas serão ignoradas automaticamente.`)) return
              setImportando(true)
              const importados = await importLeads(RESGATES_IMPORT2)
              setImportando(false)
              alert(`✅ ${importados} leads novos importados!`)
            }} disabled={importando}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {importando ? 'Importando...' : '⬆️ Importar lista 2'}
            </button>
          )}
          {!jaImportado3 && (
            <button onClick={async () => {
              if (!window.confirm(`Importar ${RESGATES_IMPORT3.length} leads? Duplicatas serão ignoradas automaticamente.`)) return
              setImportando(true)
              const importados = await importLeads(RESGATES_IMPORT3)
              setImportando(false)
              alert(`✅ ${importados} leads novos importados!`)
            }} disabled={importando}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {importando ? 'Importando...' : '⬆️ Importar lista 3'}
            </button>
          )}
          <button onClick={() => setModalNovo(true)}
            className="px-4 py-2.5 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-colors">
            + Novo Resgate
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total perdidos', value: perdidos.length, color: 'text-gray-700', bg: 'bg-white' },
          { label: 'Atrasados', value: atrasados, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Follow-up hoje', value: paraHoje, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Sem agenda', value: semAgenda, color: 'text-gray-400', bg: 'bg-gray-50' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} rounded-2xl p-4 shadow-sm border border-gray-100`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="flex-1 max-w-xs border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300"
        />
        {[
          ['todos', 'Todos'],
          ['atrasado', `Atrasados${atrasados > 0 ? ` (${atrasados})` : ''}`],
          ['hoje', `Hoje${paraHoje > 0 ? ` (${paraHoje})` : ''}`],
          ['sem_agenda', 'Sem agenda'],
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
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-gray-600">Nenhum lead perdido aqui!</p>
            <p className="text-sm mt-1">Quando um lead for marcado como Perdido ele aparecerá aqui para follow-up.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Nome', 'Contato', 'Origem', 'Perdido em', 'Motivo', 'Próximo contato', 'Ações'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((lead, i) => {
                const vencido = lead.proximoFollowup && lead.proximoFollowup < hoje
                return (
                  <tr key={lead.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${vencido ? 'bg-red-50/40' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-800">{lead.nome}</p>
                      {lead.responsavel && <p className="text-xs text-gray-400">{lead.responsavel}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{lead.telefone || '—'}</span>
                        {lead.telefone && (
                          <button onClick={() => abrirWhatsApp(lead.telefone)}
                            title="Abrir WhatsApp"
                            className="text-green-500 hover:text-green-600 transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">{lead.origemCustom || lead.origem || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">{formatData(lead.data)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500 truncate max-w-[140px] block">{lead.obs || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusFollowup data={lead.proximoFollowup} hoje={hoje} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModalEditar(lead)}
                          title="Editar follow-up"
                          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                          Editar
                        </button>
                        <button
                          onClick={() => setModalReativar(lead)}
                          title="Reativar lead"
                          className="text-xs px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg transition-colors">
                          Reativar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalNovo && (
        <ModalNovoResgate
          onSalvar={handleNovoResgate}
          onFechar={() => setModalNovo(false)}
        />
      )}
      {modalReativar && (
        <ModalReativar
          lead={modalReativar}
          onConfirmar={(status) => handleReativar(modalReativar, status)}
          onFechar={() => setModalReativar(null)}
        />
      )}
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
