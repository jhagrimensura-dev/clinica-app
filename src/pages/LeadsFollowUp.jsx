import { useState, useMemo } from 'react'
import { useLeads } from '../context/LeadsContext'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'

const genUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const FOLLOWS = [
  { key: 'em_aberto', label: 'Em aberto',  bg: 'bg-gray-100',   text: 'text-gray-500'   },
  { key: 'respondeu', label: 'Respondeu',  bg: 'bg-purple-100', text: 'text-purple-600' },
  { key: 'agendado',  label: 'Agendado',   bg: 'bg-blue-100',   text: 'text-blue-600'   },
  { key: 'vendido',   label: 'Vendido',    bg: 'bg-green-100',  text: 'text-green-600'  },
  { key: 'perdido',   label: 'Perdido',    bg: 'bg-red-100',    text: 'text-red-500'    },
]

function getFollow(key) {
  return FOLLOWS.find(f => f.key === key) || FOLLOWS[0]
}

function ModalNovoLead({ onClose, onSalvar, ano, mes }) {
  const hoje = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const [data, setData] = useState(hoje)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [origemCustom, setOrigemCustom] = useState('Instagram')
  const [status, setStatus] = useState('em_aberto')
  const [obs, setObs] = useState('')
  const { colaboradores } = useConfig()
  const [responsavel, setResponsavel] = useState('')

  const handleSalvar = () => {
    if (!nome.trim()) return
    onSalvar({ nome: nome.trim(), telefone, data, origemCustom, responsavel, status, obs: obs.trim(), origem: 'leads_followup', dataOrigem: '' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Lead Follow Up</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data Follow Up <span className="text-red-400">*</span></label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
              <option value="">Selecionar</option>
              {(colaboradores || []).map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome <span className="text-red-400">*</span></label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="Nome do lead" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Telefone</label>
          <input value={telefone} onChange={e => setTelefone(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="(64) 9 9999-9999" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Origem</label>
            <select value={origemCustom} onChange={e => setOrigemCustom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
              <option>Instagram</option>
              <option>Tráfego</option>
              <option>Indicação</option>
              <option>Online</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observação</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSalvar} disabled={!nome.trim()}
            className="flex-1 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold disabled:opacity-40">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEditarLead({ lead, onClose, onAtualizar, onRemover, userRole }) {
  const { colaboradores } = useConfig()
  const [nome, setNome] = useState(lead.nome || '')
  const [telefone, setTelefone] = useState(lead.telefone || '')
  const [origemCustom, setOrigemCustom] = useState(lead.origemCustom || 'Instagram')
  const [status, setStatus] = useState(lead.status || 'em_aberto')
  const [obs, setObs] = useState(lead.obs || '')
  const [responsavel, setResponsavel] = useState(lead.responsavel || '')
  const [data, setData] = useState(lead.data || '')
  const [confirmDel, setConfirmDel] = useState(false)

  const handleSalvar = () => {
    if (!nome.trim()) return
    onAtualizar(lead.id, { nome: nome.trim(), telefone, origemCustom, status, obs, responsavel, data })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar Lead Follow Up</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data Follow Up</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
              <option value="">Selecionar</option>
              {(colaboradores || []).map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Telefone</label>
          <input value={telefone} onChange={e => setTelefone(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Origem</label>
            <select value={origemCustom} onChange={e => setOrigemCustom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
              <option>Instagram</option>
              <option>Tráfego</option>
              <option>Indicação</option>
              <option>Online</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
              {FOLLOWS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observação</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          {userRole === 'admin' && (
            confirmDel
              ? <button onClick={() => { onRemover(lead.id); onClose() }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">Confirmar exclusão</button>
              : <button onClick={() => setConfirmDel(true)} className="py-2.5 px-4 rounded-xl border border-red-200 text-red-400 text-sm hover:bg-red-50">Excluir</button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSalvar} disabled={!nome.trim()}
            className="flex-1 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold disabled:opacity-40">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LeadsFollowUp() {
  const { userRole } = useAuth()
  const { ano, setAno, mes, setMes, MESES } = useFinanceiro()
  const { getLeadsPorOrigem, addLead, updateLead, removeLead, leads: todosLeads } = useLeads()

  const [modal, setModal] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalImport, setModalImport] = useState(null)
  const [suspeitosDecisao, setSuspeitosDecisao] = useState([])
  const [importando, setImportando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [filtroStatus] = useState('')
  const [ordem, setOrdem] = useState('desc')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const navMes = (dir) => {
    if (dir === -1) { if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1) }
    else { if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1) }
  }

  const parseData = (str) => {
    if (!str) return ''
    const s = str.trim()
    // Filter empty parts caused by double slashes (e.g. "06/08//2026")
    const parts = s.split(/[\/\-]/).filter(p => p !== '')
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      if (parts[2].length === 3 || parts[2].length === 2) {
        const yr = parseInt(parts[2], 10)
        const fullYr = yr < 100 ? 2000 + yr : yr
        return `${fullYr}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
    // Handle "07/082026" type: 2 parts where second is MMYYYY (6 chars)
    if (parts.length === 2 && parts[1].length === 6) {
      const mm = parts[1].slice(0, 2)
      const yyyy = parts[1].slice(2)
      return `${yyyy}-${mm.padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    return ''
  }

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
      const header = lines[0].split(sep).map(h => h.trim().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '_'))

      const idxDataOrigem  = header.findIndex(h => h.includes('data_origem') || h === 'data_origem')
      const idxDataFollow  = header.findIndex(h => h.includes('follow') || h === 'data_follow_up')
      const idxNome        = header.findIndex(h => h === 'nome')
      const idxTelefone    = header.findIndex(h => h === 'telefone')
      const idxOrigem      = header.findIndex(h => h === 'origem')
      const idxRespondeu   = header.findIndex(h => h === 'respondeu')
      const idxAgendou     = header.findIndex(h => h === 'agendou')
      const idxVendeu      = header.findIndex(h => h === 'vendeu')
      const idxValor       = header.findIndex(h => h === 'valor')
      const idxProc        = header.findIndex(h => h.includes('procedimento') || h.includes('proc'))
      const idxObs         = header.findIndex(h => h.includes('observa') || h.includes('obs'))

      const rows = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
        const get = (idx) => idx >= 0 ? (cols[idx] || '') : ''

        const nome = get(idxNome)
        const telefone = get(idxTelefone)

        // Pula linhas sem nome e sem telefone
        if (!nome && !telefone) continue
        // Pula linhas com nome claramente inválido
        if (nome === '.' || nome === '@' || nome === '@@') continue

        const rawOrigem = get(idxOrigem).toUpperCase()
        let origemCustom = 'Instagram'
        let midia = 'Link da BIO'
        if (rawOrigem.includes('TRAFEGO') || rawOrigem.includes('TRÁFEGO')) { origemCustom = 'Tráfego'; midia = '' }
        else if (rawOrigem.includes('INDICACAO') || rawOrigem.includes('INDICAÇÃO')) { origemCustom = 'Indicação'; midia = '' }
        else if (rawOrigem.includes('STORIES')) { origemCustom = 'Instagram'; midia = 'Link dos Stories' }
        else if (rawOrigem.includes('BIO') || rawOrigem.includes('INSTAGRAM')) { origemCustom = 'Instagram'; midia = 'Link da BIO' }

        const respondeu = get(idxRespondeu).toUpperCase() === 'SIM'
        const agendou   = get(idxAgendou).toUpperCase() === 'SIM'
        const vendeu    = get(idxVendeu).toUpperCase() === 'SIM'

        let status = 'em_aberto'
        if (vendeu)   status = 'vendido'
        else if (agendou)  status = 'agendado'
        else if (respondeu) status = 'respondeu'

        // DATA FOLLOW UP como data principal (para filtro por mês)
        const dataFollowUp = parseData(get(idxDataFollow))
        const dataOrigem   = parseData(get(idxDataOrigem))

        // Monta obs com informações extras
        const obsParts = []
        if (dataOrigem) obsParts.push(`Data origem: ${dataOrigem}`)
        const proc  = get(idxProc)
        const valor = get(idxValor)
        if (proc)  obsParts.push(`Procedimento: ${proc}`)
        if (valor) obsParts.push(`Valor: ${valor}`)
        const obsExtra = get(idxObs)
        if (obsExtra) obsParts.push(obsExtra)

        rows.push({
          id: genUUID(),
          nome: nome || telefone,
          telefone: nome ? telefone : '',
          data: dataFollowUp,
          dataOrigem: '',
          origemCustom,
          midia,
          status,
          obs: obsParts.join(' | '),
          origem: 'leads_followup',
          responsavel: '',
        })
      }

      if (rows.length === 0) return alert('Nenhum lead válido encontrado no CSV.')

      const normNome = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
      const primNome = (s) => normNome(s).split(/\s+/)[0]

      const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
      const followupLeads = todosLeads.filter(l => l.origem === 'leads_followup' && (l.data || '').startsWith(prefix))
      const telefonesExistentes = new Set(followupLeads.map(l => (l.telefone || '').replace(/\D/g, '')).filter(t => t.length >= 6))
      const nomesExistentes = new Set(followupLeads.map(l => normNome(l.nome)))
      const primNomesMap = {}
      followupLeads.forEach(l => {
        const pn = primNome(l.nome)
        if (pn.length < 3) return
        if (!primNomesMap[pn]) primNomesMap[pn] = []
        primNomesMap[pn].push(l)
      })

      const novos = [], duplicatas = [], suspeitos = []
      rows.forEach(r => {
        const tel = (r.telefone || '').replace(/\D/g, '')
        const nome = normNome(r.nome)
        const pn = primNome(r.nome)
        if (tel.length >= 6 && telefonesExistentes.has(tel)) {
          duplicatas.push(r)
        } else if (nomesExistentes.has(nome) || (pn.length >= 3 && primNomesMap[pn])) {
          suspeitos.push({ lead: r, matches: primNomesMap[pn] || [] })
        } else {
          novos.push(r)
        }
      })

      setModalImport({ novos, duplicatas, suspeitos })
      setSuspeitosDecisao(new Array(suspeitos.length).fill('importar'))
    }
    reader.readAsText(file, 'UTF-8')
  }

  const confirmarImport = async () => {
    if (!modalImport) return
    setImportando(true)
    let importados = 0
    for (const lead of (modalImport.novos || [])) {
      await addLead(lead); importados++
    }
    for (let i = 0; i < (modalImport.suspeitos || []).length; i++) {
      if (suspeitosDecisao[i] === 'importar') {
        await addLead(modalImport.suspeitos[i].lead); importados++
      }
    }
    setImportando(false)
    setModalImport(null)
    alert(`${importados} lead(s) importado(s). ${modalImport.duplicatas.length} já existiam e foram ignorados.`)
  }

  const leads = getLeadsPorOrigem('leads_followup', ano, mes)

  const normTelGlobal = (t) => { const d = (t || '').replace(/\D/g, ''); return d.length >= 6 ? d.slice(-8) : '' }

  const gruposDuplicatas = useMemo(() => {
    const groups = {}
    leads.forEach(l => {
      const tel = normTelGlobal(l.telefone)
      if (!tel) return
      if (!groups[tel]) groups[tel] = []
      groups[tel].push(l)
    })
    return Object.values(groups).filter(g => g.length >= 2)
  }, [leads])

  const resolverDuplicata = async (grupo) => {
    const manter = grupo.reduce((a, b) => ((a.criadoEm || '') > (b.criadoEm || '') ? a : b))
    const excluir = grupo.filter(l => l.id !== manter.id)
    await Promise.all(excluir.map(l => removeLead(l.id)))
  }

  const resolverTodasDuplicatas = async () => {
    setImportando(true)
    for (const grupo of gruposDuplicatas) await resolverDuplicata(grupo)
    setImportando(false)
  }

  const funil = useMemo(() => ({
    em_aberto: leads.filter(l => l.status === 'em_aberto').length,
    respondeu:  leads.filter(l => l.status === 'respondeu').length,
    agendado:   leads.filter(l => l.status === 'agendado').length,
    vendido:    leads.filter(l => l.status === 'vendido').length,
    perdido:    leads.filter(l => l.status === 'perdido').length,
  }), [leads])

  const origensDisponiveis = useMemo(() =>
    [...new Set(leads.map(l => l.origemCustom || '').filter(Boolean))].sort(), [leads])

  const leadsFiltrados = useMemo(() => leads
    .filter(l => (l.nome || '').toLowerCase().includes(busca.toLowerCase()))
    .filter(l => !filtroOrigem || (l.origemCustom || '') === filtroOrigem)
    .filter(l => !filtroStatus || l.status === filtroStatus)
    .sort((a, b) => {
      const da = a.data || '', db = b.data || ''
      return ordem === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
    }), [leads, busca, filtroOrigem, filtroStatus, ordem])

  const abrirInboxContato = (telefone, e) => {
    if (e) e.stopPropagation()
    if (!telefone) return
    sessionStorage.setItem('inbox_abrir_telefone', telefone)
    window.dispatchEvent(new CustomEvent('navegarInbox'))
  }

  const taxa = leads.length > 0
    ? (((funil.agendado + funil.vendido) / leads.length) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leads Follow Up</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-24 text-center">{MESES_FULL[mes].slice(0,3)} {ano}</span>
            <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <label className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm border border-gray-200 cursor-pointer">
            ↑ Importar CSV
            <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Banner duplicatas */}
      {gruposDuplicatas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 font-medium">⚠️ {gruposDuplicatas.length} telefone(s) duplicado(s) encontrado(s)</p>
          <button onClick={resolverTodasDuplicatas} disabled={importando}
            className="text-xs bg-red-400 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
            {importando ? 'Resolvendo...' : '✓ Resolver todas'}
          </button>
        </div>
      )}

      {/* Resumo */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-8 items-center">
        <div>
          <p className="text-xs text-gray-400">Total este mês</p>
          <p className="text-xl font-bold text-gray-800">{leads.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Taxa agend. + vendido</p>
          <p className="text-xl font-bold text-blue-500">{taxa}%</p>
        </div>
      </div>

      {/* Busca e filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white" />
        </div>
        <select value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white text-gray-600">
          <option value="">Todas as origens</option>
          {origensDisponiveis.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button onClick={() => setOrdem(o => o === 'desc' ? 'asc' : 'desc')}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-500 hover:bg-gray-50">
          {ordem === 'desc' ? '↓ Mais recentes' : '↑ Mais antigos'}
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {leadsFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-300 text-4xl mb-3">📋</p>
            <p className="text-gray-400 text-sm">Nenhum lead encontrado</p>
            <p className="text-gray-300 text-xs mt-1">Importe um CSV ou adicione manualmente</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {leadsFiltrados.map(lead => {
              const f = getFollow(lead.status)
              const tel = (lead.telefone || '').replace(/\D/g, '')
              const temTel = tel.length >= 6
              return (
                <div key={lead.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setModalEditar(lead)}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-orange-500">{(lead.nome || '?')[0].toUpperCase()}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${f.bg} ${f.text}`}>{f.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-gray-400">{lead.origemCustom || '—'}{lead.midia ? ` · ${lead.midia}` : ''}</p>
                      {lead.obs && <p className="text-xs text-gray-400 truncate max-w-xs">{lead.obs}</p>}
                    </div>
                  </div>

                  {/* Data e telefone */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs text-gray-500">
                      {lead.data ? `${lead.data.slice(8,10)}/${lead.data.slice(5,7)}` : '—'}
                    </p>
                    {lead.telefone && <p className="text-xs text-gray-400">{lead.telefone}</p>}
                  </div>

                  {/* WhatsApp */}
                  <button onClick={e => abrirInboxContato(lead.telefone, e)}
                    className={`shrink-0 ${!temTel ? 'opacity-20 cursor-default' : 'hover:scale-110 transition-transform'}`}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={temTel ? '#25D366' : '#9ca3af'}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </button>

                  {/* Status dropdown inline */}
                  <select
                    value={lead.status}
                    onChange={e => { e.stopPropagation(); updateLead(lead.id, { status: e.target.value }) }}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer shrink-0 ${f.bg} ${f.text}`}>
                    {FOLLOWS.map(fo => <option key={fo.key} value={fo.key}>{fo.label}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modais */}
      {modal && (
        <ModalNovoLead ano={ano} mes={mes}
          onClose={() => setModal(false)}
          onSalvar={async (lead) => { await addLead(lead); setModal(false) }} />
      )}

      {modalEditar && (
        <ModalEditarLead lead={modalEditar} userRole={userRole}
          onClose={() => setModalEditar(null)}
          onAtualizar={updateLead}
          onRemover={removeLead} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <p className="text-sm font-semibold text-gray-800">Excluir "{confirmDelete.nome}"?</p>
            <p className="text-xs text-gray-400">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">Cancelar</button>
              <button onClick={() => { removeLead(confirmDelete.id); setConfirmDelete(null) }}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {modalImport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !importando && setModalImport(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Importar Leads Follow Up</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modalImport.novos.length} novos · {modalImport.duplicatas.length} já existem
                  {modalImport.suspeitos.length > 0 ? ` · ${modalImport.suspeitos.length} para verificar` : ''}
                </p>
              </div>
              {!importando && <button onClick={() => setModalImport(null)} className="text-gray-400 hover:text-gray-600">✕</button>}
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-3 space-y-4">
              {/* Possíveis duplicatas */}
              {modalImport.suspeitos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-yellow-600 mb-2">Possíveis duplicatas — confirme:</p>
                  <div className="flex flex-col gap-2">
                    {modalImport.suspeitos.map((s, i) => (
                      <div key={i} className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
                        <p className="text-sm font-semibold text-gray-800">{s.lead.nome}</p>
                        <p className="text-xs text-gray-500">CSV · {s.lead.origemCustom}{s.lead.telefone ? ` · ${s.lead.telefone}` : ''}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Sistema: {s.matches.map(m => `${m.nome}${m.telefone ? ` · ${m.telefone}` : ''}`).join(', ')}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setSuspeitosDecisao(d => d.map((v, j) => j === i ? 'pular' : v))}
                            className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${suspeitosDecisao[i] === 'pular' ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
                            É a mesma pessoa
                          </button>
                          <button onClick={() => setSuspeitosDecisao(d => d.map((v, j) => j === i ? 'importar' : v))}
                            className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${suspeitosDecisao[i] === 'importar' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
                            É lead novo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Novos */}
              {modalImport.novos.length === 0 && modalImport.suspeitos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Todos os leads já estão cadastrados.</p>
              ) : modalImport.novos.length > 0 && (
                <div>
                  {modalImport.suspeitos.length > 0 && <p className="text-xs font-semibold text-gray-500 mb-2">Novos leads:</p>}
                  <div className="flex flex-col gap-2">
                    {modalImport.novos.map((l, i) => {
                      const f = getFollow(l.status)
                      return (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{l.nome}</p>
                            <p className="text-xs text-gray-400">{l.origemCustom}{l.midia ? ` · ${l.midia}` : ''}</p>
                            {l.obs && <p className="text-xs text-gray-300 truncate max-w-xs">{l.obs}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-xs text-gray-500">{(l.data || '').slice(8,10)}/{(l.data || '').slice(5,7)}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.bg} ${f.text}`}>{f.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {(modalImport.novos.length > 0 || modalImport.suspeitos.length > 0) && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setModalImport(null)} disabled={importando}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={confirmarImport} disabled={importando}
                  className="flex-1 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
                  {importando ? 'Importando...' : `Importar ${modalImport.novos.length + suspeitosDecisao.filter(d => d === 'importar').length} leads`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
