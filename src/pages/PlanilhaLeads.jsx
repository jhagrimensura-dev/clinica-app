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

const COLS = [
  { key: 'data',               label: 'Data',         type: 'date'     },
  { key: 'nome',               label: 'Nome',         type: 'text'     },
  { key: 'telefone',           label: 'Telefone',     type: 'text'     },
  { key: 'origem',             label: 'Origem',       type: 'select'   },
  { key: 'criativo',           label: 'Criativo',     type: 'text'     },
  { key: 'agendou',            label: 'Agendou',      type: 'bool'     },
  { key: 'compareceu',         label: 'Compareceu',   type: 'bool'     },
  { key: 'vendeu',             label: 'Vendeu',       type: 'bool'     },
  { key: 'consulta',           label: 'Consulta',     type: 'text'     },
  { key: 'valor_procedimento', label: 'Valor (R$)',   type: 'currency' },
  { key: 'follow_up_1',        label: 'Follow Up 1',  type: 'date'     },
  { key: 'follow_up_2',        label: 'Follow Up 2',  type: 'date'     },
  { key: 'follow_up_3',        label: 'Follow Up 3',  type: 'date'     },
  { key: 'follow_up_4',        label: 'Follow Up 4',  type: 'date'     },
  { key: 'follow_up_5',        label: 'Follow Up 5',  type: 'date'     },
  { key: 'observacao',         label: 'Observação',   type: 'text'     },
]

function parseSheetDate(s) {
  if (!s) return null
  const clean = s.trim().replace(/\/\//g, '/')
  if (!clean.match(/\d/)) return null
  const parts = clean.split(/[\/\-]/).filter(p => p && /^\d+$/.test(p))
  if (parts.length !== 3) return null
  if (parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
  }
  if (parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`
  }
  return null
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

function parseFUField(s) {
  // Returns { date, obs } — if it's a date, date is set; otherwise it's an obs
  if (!s || !s.trim()) return { date: null, obs: '' }
  const d = parseSheetDate(s)
  if (d) return { date: d, obs: '' }
  // It's a text, treat as observation
  return { date: null, obs: s.trim() }
}

function parseSheetRows(text, clinicaId) {
  const lines = text.split('\n').filter(l => l.trim())
  const rows = []
  for (const line of lines) {
    const cols = line.split('\t')
    const rawDate = cols[0]?.trim()
    // Skip header row and empty rows
    if (!rawDate || !rawDate.match(/\d{2}\/\d{2}\/\d{4}/)) continue

    const fu1 = parseFUField(cols[10])
    const fu2 = parseFUField(cols[11])
    const fu3 = parseFUField(cols[12])
    const fu4 = parseFUField(cols[13])
    const fu5 = parseFUField(cols[14])

    const obsSheet = cols[15]?.trim() || ''
    const extraObs = [fu1.obs, fu2.obs, fu3.obs, fu4.obs, fu5.obs].filter(Boolean).join(' | ')
    const fullObs = [obsSheet, extraObs].filter(Boolean).join(' | ')

    rows.push({
      id: genId(),
      clinica_id: clinicaId,
      data: parseSheetDate(rawDate),
      nome: cols[1]?.trim() || '',
      telefone: cols[2]?.trim() || '',
      origem: parseOrigin(cols[3]),
      criativo: cols[4]?.trim() || '',
      agendou: (cols[5] || '').trim().toUpperCase() === 'SIM',
      compareceu: (cols[6] || '').trim().toUpperCase() === 'SIM',
      vendeu: (cols[7] || '').trim().toUpperCase() === 'SIM',
      consulta: cols[8]?.trim() || '',
      valor_procedimento: parseValue(cols[9]),
      follow_up_1: fu1.date,
      follow_up_2: fu2.date,
      follow_up_3: fu3.date,
      follow_up_4: fu4.date,
      follow_up_5: fu5.date,
      observacao: fullObs,
    })
  }
  return rows
}

function ModalImport({ clinicaId, onClose, onDone }) {
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState([])
  const [importando, setImportando] = useState(false)
  const [done, setDone] = useState(0)

  const analisar = () => {
    const rows = parseSheetRows(texto, clinicaId)
    setPreview(rows)
  }

  const importar = async () => {
    if (!preview.length) return
    setImportando(true)
    const CHUNK = 50
    let total = 0
    for (let i = 0; i < preview.length; i += CHUNK) {
      const chunk = preview.slice(i, i + CHUNK)
      const { error } = await supabase.from('planilha_leads').insert(chunk)
      if (error) console.error('import chunk error:', error)
      else total += chunk.length
      setDone(Math.min(i + CHUNK, preview.length))
    }
    setImportando(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">Importar do Google Sheets</h2>
            <p className="text-xs text-gray-400 mt-0.5">Selecione tudo na planilha (Ctrl+A → Ctrl+C) e cole abaixo</p>
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
                      {r.data ? `${r.data.slice(8,10)}/${r.data.slice(5,7)}` : '—'}
                    </span>
                    <span className="font-semibold text-gray-700 w-36 truncate">{r.nome || '—'}</span>
                    <span className="text-gray-400 w-28 shrink-0">{r.telefone || '—'}</span>
                    <span className="text-gray-400 truncate flex-1">{r.origem || '—'}</span>
                    <div className="flex gap-1 shrink-0">
                      {r.agendou    && <span className="text-blue-600 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded-full font-semibold">Ag</span>}
                      {r.compareceu && <span className="text-orange-600 text-[10px] bg-orange-50 px-1.5 py-0.5 rounded-full font-semibold">Cp</span>}
                      {r.vendeu     && <span className="text-green-600 text-[10px] bg-green-50 px-1.5 py-0.5 rounded-full font-semibold">Vd</span>}
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

export default function PlanilhaLeads() {
  const { clinicaId } = useAuth()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const [modalImport, setModalImport] = useState(false)
  const [metaAg, setMetaAg] = useState(20)
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [metaInput, setMetaInput] = useState('')
  const editInputRef = useRef(null)

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const monthStart = `${prefix}-01`
  const nextMonth = mes === 11
    ? `${ano + 1}-01-01`
    : `${ano}-${String(mes + 2).padStart(2, '0')}-01`

  const metaKey = `planilha_meta_ag_${ano}_${mes + 1}`

  useEffect(() => {
    if (!clinicaId) return
    supabase.from('configuracoes').select('valor').eq('chave', metaKey).single()
      .then(({ data }) => { if (data?.valor != null) setMetaAg(parseInt(data.valor) || 20) })
  }, [metaKey, clinicaId])

  const salvarMeta = async (val) => {
    const n = parseInt(val)
    if (isNaN(n) || n < 0) return
    setMetaAg(n)
    setEditandoMeta(false)
    await supabase.from('configuracoes').upsert({ chave: metaKey, valor: String(n) }, { onConflict: 'chave' })
  }

  const navMes = (dir) => {
    if (dir === -1) { if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1) }
    else { if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1) }
  }

  const fetchRows = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('planilha_leads')
      .select('*')
      .eq('clinica_id', clinicaId)
      .gte('data', monthStart)
      .lt('data', nextMonth)
      .order('data', { ascending: true })
      .order('criado_em', { ascending: true })
    if (error) { console.error(error); setLoading(false); return }
    setRows(data || [])
    setLoading(false)
  }, [clinicaId, monthStart, nextMonth])

  useEffect(() => { fetchRows() }, [fetchRows])

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
      data: dataHoje, nome: '', telefone: '', origem: '', criativo: '',
      agendou: false, compareceu: false, vendeu: false,
      consulta: '', valor_procedimento: null,
      follow_up_1: null, follow_up_2: null, follow_up_3: null,
      follow_up_4: null, follow_up_5: null, observacao: '',
    }
    setRows(prev => [...prev, newRow])
    const { error } = await supabase.from('planilha_leads').insert(newRow)
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
      .from('planilha_leads').update({ [col]: dbVal }).eq('id', rowId)
    if (error) console.error('saveCell error:', error)
  }, [])

  const toggleBool = useCallback((rowId, col) => {
    setRows(prev => {
      const row = prev.find(r => r.id === rowId)
      if (!row) return prev
      const newVal = !row[col]
      supabase.from('planilha_leads').update({ [col]: newVal }).eq('id', rowId)
        .then(({ error }) => { if (error) console.error('toggleBool error:', error) })
      return prev.map(r => r.id === rowId ? { ...r, [col]: newVal } : r)
    })
  }, [])

  const deleteRow = async (rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
    await supabase.from('planilha_leads').delete().eq('id', rowId)
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
  const agendouCount = rows.filter(r => r.agendou).length
  const compareceuCount = rows.filter(r => r.compareceu).length
  const vendeuCount = rows.filter(r => r.vendeu).length
  const valorTotal = rows.reduce((s, r) => s + (parseFloat(r.valor_procedimento) || 0), 0)

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

    const isFollowUp = col.key.startsWith('follow_up_')

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
        {isFollowUp && display ? (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            value <= new Date().toISOString().slice(0,10)
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {display}
          </span>
        ) : (
          <span className={`text-xs ${display ? 'text-gray-700' : 'text-gray-200'}`}>
            {display || '—'}
          </span>
        )}
      </td>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planilha de Leads Novos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Clique em qualquer célula para editar · salva automaticamente</p>
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

      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Total de Leads</p>
            <span className="text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-400 mt-1">leads este mês</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Agendou</p>
            <span className="text-lg">📅</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{agendouCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {total > 0 ? `${((agendouCount / total) * 100).toFixed(1)}% dos leads` : 'nenhum ainda'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Compareceu</p>
            <span className="text-lg">✅</span>
          </div>
          <p className="text-3xl font-bold text-orange-500">{compareceuCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {agendouCount > 0 ? `${((compareceuCount / agendouCount) * 100).toFixed(0)}% dos agendados` : 'nenhum ainda'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Vendeu</p>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{vendeuCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {compareceuCount > 0 ? `${((vendeuCount / compareceuCount) * 100).toFixed(0)}% dos que vieram` : 'nenhum ainda'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Taxa de Conversão</p>
            <span className="text-lg">📈</span>
          </div>
          <p className={`text-3xl font-bold ${total > 0 && vendeuCount / total >= 0.1 ? 'text-green-600' : 'text-red-500'}`}>
            {total > 0 ? `${((vendeuCount / total) * 100).toFixed(1)}%` : '0.0%'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{vendeuCount} vendas · R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Meta de Agendamentos</p>
            <button onClick={() => { setMetaInput(String(metaAg)); setEditandoMeta(true) }}
              className="text-orange-300 hover:text-orange-500 transition-colors text-base leading-none" title="Editar meta">✏️</button>
          </div>
          {editandoMeta ? (
            <div className="flex items-center gap-2 mt-1">
              <input autoFocus type="number" value={metaInput} onChange={e => setMetaInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') salvarMeta(metaInput); if (e.key === 'Escape') setEditandoMeta(false) }}
                className="w-20 text-2xl font-bold border border-orange-400 rounded-lg px-2 py-0.5 outline-none" />
              <button onClick={() => salvarMeta(metaInput)} className="text-xs bg-orange-400 text-white px-2 py-1 rounded-lg">OK</button>
            </div>
          ) : (
            <p className="text-3xl font-bold text-orange-500">
              {agendouCount} <span className="text-lg font-normal text-gray-400">/ {metaAg}</span>
            </p>
          )}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full transition-all"
              style={{ width: `${Math.min((agendouCount / metaAg) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {agendouCount >= metaAg ? '🎯 Meta atingida!' : `faltam ${metaAg - agendouCount}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-gray-300 text-sm">Carregando...</div>
        ) : (
          <>
            <table className="text-left text-xs border-collapse" style={{ minWidth: '1600px' }}>
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
                      Nenhum lead este mês · clique em "+ Novo Lead" ou "Importar Planilha"
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
          onClose={() => setModalImport(false)}
          onDone={fetchRows}
        />
      )}
    </div>
  )
}
