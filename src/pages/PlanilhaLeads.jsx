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
]

export default function PlanilhaLeads() {
  const { clinicaId } = useAuth()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const editInputRef = useRef(null)

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
    }
    setRows(prev => [...prev, newRow])
    const { error } = await supabase.from('planilha_leads').insert(newRow)
    if (error) {
      console.error('addRow error:', error)
      setRows(prev => prev.filter(r => r.id !== id))
      alert('Erro ao adicionar linha. Verifique sua conexão.')
      return
    }
    setEditingCell({ rowId: id, col: 'nome' })
  }

  const saveCell = useCallback(async (rowId, col, value) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [col]: value } : r))
    const dbVal = value === '' ? null : value
    const { error } = await supabase
      .from('planilha_leads').update({ [col]: dbVal }).eq('id', rowId)
    if (error) console.error('saveCell error:', error, col, value)
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
        <td key={col.key}
          className="px-2 py-1.5 text-center cursor-pointer select-none"
          onClick={() => toggleBool(row.id, col.key)}>
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
            value ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-300'
          }`}>
            {value ? '✓' : '×'}
          </span>
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
      display = `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      display = value != null ? String(value) : ''
    }

    return (
      <td key={col.key}
        onClick={() => setEditingCell({ rowId: row.id, col: col.key })}
        className="px-2 py-1.5 cursor-text hover:bg-orange-50 transition-colors whitespace-nowrap overflow-hidden max-w-[150px]">
        <span className={`text-xs ${display ? 'text-gray-700' : 'text-gray-200'}`}>
          {display || '—'}
        </span>
      </td>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planilha de Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">Clique em qualquer célula para editar · salva automaticamente</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-28 text-center">{MESES_FULL[mes]} {ano}</span>
            <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <button onClick={addRow}
            className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total de Leads',  value: total,           color: 'text-gray-800'   },
          { label: 'Agendou',         value: agendouCount,    color: 'text-blue-600'   },
          { label: 'Compareceu',      value: compareceuCount, color: 'text-orange-500' },
          { label: 'Vendeu',          value: vendeuCount,     color: 'text-green-600'  },
          { label: 'Valor Total',     value: `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-purple-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
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
                      Nenhum lead este mês · clique em "+ Novo Lead" para começar
                    </td>
                  </tr>
                ) : rows.map((row, i) => (
                  <tr key={row.id}
                    className={`border-b border-gray-50 group ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-orange-50/20`}>
                    <td className="px-3 py-1.5 text-[10px] text-gray-300 select-none">{i + 1}</td>
                    {COLS.map(col => renderCell(row, col))}
                    <td className="px-2 py-1.5">
                      <button onClick={() => deleteRow(row.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-400 transition-all w-5 h-5 flex items-center justify-center rounded text-base leading-none">
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
    </div>
  )
}
