import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const ORIGENS = ['Instagram Bio', 'Instagram Stories', 'Tráfego', 'Conexão', 'Indicação', 'Outro']

const genId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function rowStatus(r) {
  return r.vendeu ? 'fechado' : r.agendou ? 'agendado' : r.respondeu ? 'conversando' : 'em_aberto'
}

async function syncRowData(row, clinicaId) {
  if (!row?.id || !clinicaId || !row.nome?.trim()) return
  await supabase.from('leads').upsert({
    id: row.id,
    clinica_id: clinicaId,
    nome: row.nome,
    telefone: row.telefone || '',
    origem: 'leads_followup',
    origem_custom: row.origem || '',
    data: row.data_followup || '',
    data_origem: '',
    responsavel: '',
    fonte: '',
    status: rowStatus(row),
    agendado_para: null,
    proximo_followup: '',
    obs: row.observacao || '',
    aniversario: null,
    midia: row.origem || null,
    criativo: null,
    link_bio: null,
  }, { onConflict: 'id' })
}

async function syncBatchToLeads(rows, clinicaId) {
  const valid = rows.filter(r => r.nome?.trim())
  if (!valid.length) return null
  const payload = valid.map(r => ({
    id: r.id,
    clinica_id: clinicaId,
    nome: r.nome,
    telefone: r.telefone || '',
    origem: 'leads_followup',
    origem_custom: r.origem || '',
    data: r.data_followup || '',
    data_origem: '',
    responsavel: '',
    fonte: '',
    status: rowStatus(r),
    agendado_para: null,
    proximo_followup: '',
    obs: r.observacao || '',
    aniversario: null,
    midia: r.origem || null,
    criativo: null,
    link_bio: null,
  }))
  for (let i = 0; i < payload.length; i += 25) {
    const { error } = await supabase.from('leads').upsert(payload.slice(i, i + 25), { onConflict: 'id' })
    if (error) return error
  }
  return null
}

const COLS = [
  { key: 'data_origem',   label: 'Data Origem',   type: 'date'     },
  { key: 'data_followup', label: 'Data Follow Up', type: 'date'     },
  { key: 'nome',          label: 'Nome',           type: 'text'     },
  { key: 'telefone',      label: 'Telefone',       type: 'text'     },
  { key: 'origem',        label: 'Origem',         type: 'select'   },
  { key: 'respondeu',     label: 'Respondeu',      type: 'bool'     },
  { key: 'agendou',       label: 'Agendou',        type: 'bool'     },
  { key: 'vendeu',        label: 'Vendeu',         type: 'bool'     },
  { key: 'valor',         label: 'Valor (R$)',      type: 'currency' },
  { key: 'procedimento',  label: 'Procedimento',   type: 'text'     },
  { key: 'observacao',    label: 'Observação',     type: 'text'     },
]

function parseSheetDate(s) {
  if (!s) return null
  const clean = s.trim().replace(/\/\//g, '/')
  if (!clean.match(/\d/)) return null
  const parts = clean.split(/[\/\-]/).filter(p => p && /^\d+$/.test(p))
  if (parts.length !== 3) return null
  let iso
  if (parts[2].length === 4) {
    iso = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
  } else if (parts[0].length === 4) {
    iso = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`
  } else {
    return null
  }
  // Valida que a data existe (ex: 31/09 é inválida)
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  const [y, m, day] = iso.split('-').map(Number)
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return null
  return iso
}

function parseOrigin(s) {
  const u = (s || '').toUpperCase().trim()
  if (u.includes('STORIES')) return 'Instagram Stories'
  if (u.includes('BIO')) return 'Instagram Bio'
  if (u.includes('TRÁFEGO') || u.includes('TRAFEGO')) return 'Tráfego'
  if (u.includes('INDICAÇÃO') || u.includes('INDICACAO')) return 'Indicação'
  if (u.includes('ONLINE')) return 'Outro'
  if (u.includes('CONEXÃO') || u.includes('CONEXAO')) return 'Conexão'
  return s?.trim() || ''
}

function parseValue(s) {
  if (!s || !s.trim()) return null
  const clean = s.replace(/R\$\s?/,'').replace(/\./g,'').replace(',','.').trim()
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

function parseSheetRows(text, clinicaId) {
  const lines = text.split('\n').filter(l => l.trim())
  const rows = []
  for (const line of lines) {
    const cols = line.split('\t')
    const rawDataOrigem = cols[0]?.trim()
    const rawDataFollowup = cols[1]?.trim()
    // Skip header rows and lines without any recognizable date
    const hasDate = (rawDataOrigem && rawDataOrigem.match(/\d{1,2}[\/\-]+\d{1,2}[\/\-]+\d{4}/)) ||
                    (rawDataFollowup && rawDataFollowup.match(/\d{1,2}[\/\-]+\d{1,2}[\/\-]+\d{4}/))
    if (!hasDate) continue

    // col[8] é coluna vazia na planilha; VALOR está em col[9], segundo valor em col[10]
    const val1 = parseValue(cols[9])
    const val2 = parseValue(cols[10])
    const valor = val1 ?? val2 ?? null
    const procedimento = cols[11]?.trim() || ''
    const observacao   = cols[12]?.trim() || ''

    rows.push({
      id: genId(),
      clinica_id: clinicaId,
      data_origem:  parseSheetDate(rawDataOrigem),
      data_followup: parseSheetDate(rawDataFollowup),
      nome:         cols[2]?.trim() || '',
      telefone:     cols[3]?.trim() || '',
      origem:       parseOrigin(cols[4]),
      respondeu:    (cols[5] || '').trim().toUpperCase() === 'SIM',
      agendou:      (cols[6] || '').trim().toUpperCase() === 'SIM',
      vendeu:       (cols[7] || '').trim().toUpperCase() === 'SIM',
      valor,
      procedimento,
      observacao,
    })
  }
  return rows
}

function ModalImport({ clinicaId, ano, mes, onClose, onDone }) {
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState([])
  const [importando, setImportando] = useState(false)
  const [done, setDone] = useState(0)
  const [erro, setErro] = useState(null)

  const prefixMes = `${ano}-${String(mes + 1).padStart(2, '0')}`

  const analisar = () => {
    setErro(null)
    const rows = parseSheetRows(texto, clinicaId)
    const soMesAtual = rows.filter(r => (r.data_followup || '').startsWith(prefixMes))
    setPreview(soMesAtual)
  }

  const importar = async () => {
    if (!preview.length) return
    if (!clinicaId) { setErro('clinicaId não disponível — recarregue a página e tente novamente.'); return }
    setImportando(true)
    setErro(null)

    const meses = [...new Set(preview.map(r => r.data_followup?.slice(0, 7)).filter(Boolean))]
    for (const m of meses) {
      const [y, mo] = m.split('-').map(Number)
      const nextMes = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
      const iniMes = `${m}-01`
      const fimMes = `${nextMes}-01`
      const { error: delErr } = await supabase.from('planilha_followup')
        .delete().eq('clinica_id', clinicaId).gte('data_followup', iniMes).lt('data_followup', fimMes)
      if (delErr) { setErro(`Erro ao apagar mês ${m}: ${delErr.message}`); setImportando(false); return }
    }

    const CHUNK = 25
    for (let i = 0; i < preview.length; i += CHUNK) {
      const chunk = preview.slice(i, i + CHUNK)
      const { error } = await supabase.from('planilha_followup').insert(chunk)
      if (error) {
        setErro(`Erro ao inserir linhas ${i + 1}–${i + chunk.length}: ${error.message}`)
        setImportando(false)
        await onDone()
        return
      }
      setDone(Math.min(i + CHUNK, preview.length))
    }

    // Sincroniza com a tabela leads para aparecer no Leads Follow Up
    for (const m of meses) {
      const [y, mo] = m.split('-').map(Number)
      const nextMes = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
      await supabase.from('leads')
        .delete()
        .eq('clinica_id', clinicaId)
        .eq('origem', 'leads_followup')
        .gte('data', `${m}-01`)
        .lt('data', `${nextMes}-01`)
    }
    const syncErr = await syncBatchToLeads(preview, clinicaId)
    if (syncErr) { setErro(`Erro ao sincronizar com Leads Follow Up: ${syncErr.message}`); setImportando(false); await onDone(); return }

    setImportando(false)
    await onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">Importar do Google Sheets</h2>
            <p className="text-xs text-gray-400 mt-0.5">Selecione tudo na planilha (Ctrl+A → Ctrl+C) e cole abaixo · só importa {String(mes + 1).padStart(2,'0')}/{ano} (por Data Follow Up)</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <textarea
            value={texto}
            onChange={e => { setTexto(e.target.value); setPreview([]) }}
            placeholder="Cole aqui os dados copiados do Google Sheets..."
            rows={7}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-orange-400 resize-none"
          />

          <button onClick={analisar} disabled={!texto.trim()}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors disabled:opacity-40">
            Analisar dados
          </button>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">{preview.length} lead(s) encontrado(s) — prévia:</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {preview.slice(0, 25).map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 text-xs border-b border-gray-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <span className="text-gray-400 w-14 shrink-0">
                      {r.data_followup ? `${r.data_followup.slice(8,10)}/${r.data_followup.slice(5,7)}` : '—'}
                    </span>
                    <span className="font-semibold text-gray-700 w-36 truncate">{r.nome || '—'}</span>
                    <span className="text-gray-400 w-28 shrink-0">{r.telefone || '—'}</span>
                    <span className="text-gray-400 truncate flex-1">{r.origem || '—'}</span>
                    <div className="flex gap-1 shrink-0">
                      {r.respondeu && <span className="text-purple-600 text-[10px] bg-purple-50 px-1.5 py-0.5 rounded-full font-semibold">Rsp</span>}
                      {r.agendou   && <span className="text-blue-600 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded-full font-semibold">Ag</span>}
                      {r.vendeu    && <span className="text-green-600 text-[10px] bg-green-50 px-1.5 py-0.5 rounded-full font-semibold">Vd</span>}
                    </div>
                  </div>
                ))}
                {preview.length > 25 && (
                  <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 text-center">
                    +{preview.length - 25} leads adicionais
                  </div>
                )}
              </div>
            </div>
          )}

          {importando && (
            <div className="bg-orange-50 rounded-xl px-4 py-3">
              <p className="text-sm text-orange-700 font-medium">Importando... {done}/{preview.length}</p>
              <div className="mt-2 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${(done/preview.length)*100}%` }} />
              </div>
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-700 font-semibold">Erro na importação</p>
              <p className="text-xs text-red-600 mt-1 font-mono break-all">{erro}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} disabled={importando}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">
            Cancelar
          </button>
          <button onClick={importar} disabled={preview.length === 0 || importando}
            className="flex-1 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
            {importando ? 'Importando...' : `Importar ${preview.length} leads`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlanilhaFollowUp() {
  const { clinicaId } = useAuth()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const [modalImport, setModalImport] = useState(false)
  const editInputRef = useRef(null)
  const rowsRef = useRef([])

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const monthStart = `${prefix}-01`
  const nextMonth = mes === 11
    ? `${ano + 1}-01-01`
    : `${ano}-${String(mes + 2).padStart(2, '0')}-01`

  const navMes = (dir) => {
    if (dir === -1) { if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1) }
    else { if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1) }
  }

  const fetchRows = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('planilha_followup')
      .select('*')
      .eq('clinica_id', clinicaId)
      .gte('data_followup', monthStart)
      .lt('data_followup', nextMonth)
      .order('data_followup', { ascending: true })
      .order('criado_em', { ascending: true })
    if (error) { console.error(error); setLoading(false); return }
    setRows(data || [])
    setLoading(false)
  }, [clinicaId, monthStart, nextMonth])

  useEffect(() => { fetchRows() }, [fetchRows])
  useEffect(() => { rowsRef.current = rows }, [rows])

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      if (editInputRef.current.select) editInputRef.current.select()
    }
  }, [editingCell])

  const addRow = async () => {
    if (!clinicaId) return
    const id = genId()
    const dataHoje = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
    const newRow = {
      id, clinica_id: clinicaId,
      data_origem: null, data_followup: dataHoje,
      nome: '', telefone: '', origem: '',
      respondeu: false, agendou: false, vendeu: false,
      valor: null, procedimento: '', observacao: '',
    }
    setRows(prev => [...prev, newRow])
    const { error } = await supabase.from('planilha_followup').insert(newRow)
    if (error) {
      console.error('addRow error:', error)
      setRows(prev => prev.filter(r => r.id !== id))
      alert('Erro ao adicionar linha.')
      return
    }
    setEditingCell({ rowId: id, col: 'nome' })
  }

  const saveCell = useCallback(async (rowId, col, value) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [col]: value } : r))
    const dbVal = value === '' ? null : value
    const { error } = await supabase
      .from('planilha_followup').update({ [col]: dbVal }).eq('id', rowId)
    if (error) console.error('saveCell error:', error)
  }, [])

  const toggleBool = useCallback((rowId, col) => {
    setRows(prev => {
      const row = prev.find(r => r.id === rowId)
      if (!row) return prev
      const newVal = !row[col]
      const updatedRow = { ...row, [col]: newVal }
      supabase.from('planilha_followup').update({ [col]: newVal }).eq('id', rowId)
        .then(({ error }) => { if (error) console.error('toggleBool error:', error) })
      if (['respondeu', 'agendou', 'vendeu'].includes(col)) {
        syncRowData(updatedRow, clinicaId)
      }
      return prev.map(r => r.id === rowId ? updatedRow : r)
    })
  }, [clinicaId])

  const deleteRow = async (rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
    await supabase.from('planilha_followup').delete().eq('id', rowId)
  }

  const handleBlur = (rowId, col, value) => {
    saveCell(rowId, col, value)
    setEditingCell(null)
  }

  const handleKeyDown = (e, rowId, col, getValue) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      saveCell(rowId, col, getValue())
      setEditingCell(null)
    }
    if (e.key === 'Escape') setEditingCell(null)
  }

  const total = rows.length
  const respondeuCount = rows.filter(r => r.respondeu).length
  const agendouCount = rows.filter(r => r.agendou).length
  const vendeuCount = rows.filter(r => r.vendeu).length
  const valorTotal = rows.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0)

  const renderCell = (row, col) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.col === col.key
    const value = row[col.key]

    if (col.type === 'bool') {
      return (
        <td key={col.key} className="px-2 py-1.5 text-center cursor-pointer select-none"
          onClick={() => toggleBool(row.id, col.key)}>
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
            value ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-300'
          }`}>{value ? '✓' : '×'}</span>
        </td>
      )
    }

    if (isEditing) {
      if (col.type === 'select') {
        return (
          <td key={col.key} className="px-1 py-0.5">
            <select ref={editInputRef} defaultValue={value || ''} autoFocus
              onBlur={e => handleBlur(row.id, col.key, e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setEditingCell(null) }}
              className="text-xs border border-orange-400 rounded px-1 py-0.5 outline-none bg-white min-w-[130px]">
              <option value="">—</option>
              {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </td>
        )
      }
      if (col.type === 'date') {
        return (
          <td key={col.key} className="px-1 py-0.5">
            <input ref={editInputRef} type="date" defaultValue={value || ''} autoFocus
              onBlur={e => handleBlur(row.id, col.key, e.target.value || null)}
              onKeyDown={e => handleKeyDown(e, row.id, col.key, () => editInputRef.current?.value || null)}
              className="text-xs border border-orange-400 rounded px-1 py-0.5 outline-none w-32" />
          </td>
        )
      }
      if (col.type === 'currency') {
        return (
          <td key={col.key} className="px-1 py-0.5">
            <input ref={editInputRef} type="number" step="0.01" min="0" defaultValue={value ?? ''} autoFocus
              onBlur={e => handleBlur(row.id, col.key, e.target.value !== '' ? parseFloat(e.target.value) : null)}
              onKeyDown={e => handleKeyDown(e, row.id, col.key, () => {
                const v = editInputRef.current?.value
                return v !== '' && v !== undefined ? parseFloat(v) : null
              })}
              className="text-xs border border-orange-400 rounded px-1 py-0.5 outline-none w-24" />
          </td>
        )
      }
      return (
        <td key={col.key} className="px-1 py-0.5">
          <input ref={editInputRef} type="text" defaultValue={value || ''} autoFocus
            onBlur={e => handleBlur(row.id, col.key, e.target.value)}
            onKeyDown={e => handleKeyDown(e, row.id, col.key, () => editInputRef.current?.value || '')}
            className="text-xs border border-orange-400 rounded px-1 py-0.5 outline-none min-w-[90px]" />
        </td>
      )
    }

    let display = ''
    if (col.type === 'date' && value) {
      display = `${String(value).slice(8,10)}/${String(value).slice(5,7)}`
    } else if (col.type === 'currency' && value != null) {
      display = `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    } else {
      display = value != null ? String(value) : ''
    }

    return (
      <td key={col.key}
        onClick={() => setEditingCell({ rowId: row.id, col: col.key })}
        className="px-2 py-1.5 cursor-text hover:bg-orange-50 transition-colors whitespace-nowrap overflow-hidden max-w-[160px]">
        <span className={`text-xs ${display ? 'text-gray-700' : 'text-gray-200'}`}>
          {display || '—'}
        </span>
      </td>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planilha de Leads Follow Up</h1>
          <p className="text-sm text-gray-400 mt-0.5">Navegação por Data Follow Up · clique em qualquer célula para editar · salva automaticamente</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-28 text-center">{MESES_FULL[mes]} {ano}</span>
            <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <button onClick={() => setModalImport(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 transition-colors shadow-sm">
            ↑ Importar Planilha
          </button>
          <button onClick={addRow}
            className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
            + Novo Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Total Follow Ups</p>
            <span className="text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-400 mt-1">leads este mês</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Respondeu</p>
            <span className="text-lg">💬</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{respondeuCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {total > 0 ? `${((respondeuCount / total) * 100).toFixed(1)}% dos leads` : 'nenhum ainda'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Agendou</p>
            <span className="text-lg">📅</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{agendouCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {respondeuCount > 0 ? `${((agendouCount / respondeuCount) * 100).toFixed(0)}% dos que responderam` : 'nenhum ainda'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Vendeu</p>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{vendeuCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {agendouCount > 0 ? `${((vendeuCount / agendouCount) * 100).toFixed(0)}% dos agendados` : 'nenhum ainda'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Valor Total</p>
            <span className="text-lg">📈</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {valorTotal > 0 ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{vendeuCount} venda(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-gray-300 text-sm">Carregando...</div>
        ) : (
          <>
            <table className="text-left text-xs border-collapse" style={{ minWidth: '1200px' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-300 uppercase w-8">#</th>
                  {COLS.map(col => (
                    <th key={col.key} className="px-2 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="w-8 px-2" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length + 2} className="py-16 text-center text-gray-300 text-sm">
                      Nenhum follow up este mês · clique em "+ Novo Lead" ou "Importar Planilha"
                    </td>
                  </tr>
                ) : rows.map((row, i) => (
                  <tr key={row.id}
                    className={`border-b border-gray-100 group ${i % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-orange-50/40`}>
                    <td className="px-3 py-1.5 text-[10px] text-gray-300 select-none">{i + 1}</td>
                    {COLS.map(col => renderCell(row, col))}
                    <td className="px-2 py-1.5">
                      <button onClick={() => deleteRow(row.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all w-6 h-6 flex items-center justify-center rounded-md text-lg leading-none"
                        title="Apagar linha">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addRow}
              className="w-full py-2 text-xs text-gray-300 hover:text-orange-500 hover:bg-orange-50 border-t border-gray-50 transition-colors text-left px-4">
              + Adicionar linha
            </button>
          </>
        )}
      </div>

      {modalImport && (
        <ModalImport
          clinicaId={clinicaId}
          ano={ano}
          mes={mes}
          onClose={() => setModalImport(false)}
          onDone={fetchRows}
        />
      )}
    </div>
  )
}
