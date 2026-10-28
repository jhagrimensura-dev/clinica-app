import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const AGENDOU_OPTS = [
  { value: 'SIM',                  label: 'SIM',                  cls: 'bg-green-100 text-green-700' },
  { value: 'NÃO',                  label: 'NÃO',                  cls: 'bg-red-50 text-red-400' },
  { value: 'AGENDOU MESMO MÊS',    label: 'AGENDOU MESMO MÊS',    cls: 'bg-blue-100 text-blue-700' },
  { value: 'AGENDOU PRÓXIMO MÊS',  label: 'AGENDOU PRÓXIMO MÊS',  cls: 'bg-yellow-100 text-yellow-700' },
  { value: 'AGENDOU MÊS ANTERIOR', label: 'AGENDOU MÊS ANTERIOR', cls: 'bg-red-900 text-white' },
]

function agendouOpt(val) {
  if (val === true)  return AGENDOU_OPTS[0]
  if (!val || val === false) return AGENDOU_OPTS[1]
  return AGENDOU_OPTS.find(o => o.value === val) || AGENDOU_OPTS[1]
}

function isAgendou(val) {
  if (typeof val === 'boolean') return val
  return val && val !== 'NÃO'
}

const genId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function rowStatus(r) {
  return r.vendeu ? 'fechado' : isAgendou(r.agendou) ? 'agendado' : 'em_aberto'
}

async function syncRowData(row, clinicaId) {
  if (!row?.id || !clinicaId || !row.nome?.trim()) return
  await supabase.from('leads').upsert({
    id: row.id,
    clinica_id: clinicaId,
    nome: row.nome,
    telefone: row.telefone || '',
    origem: 'leads_recorrentes',
    origem_custom: '',
    data: row.data || '',
    data_origem: '',
    responsavel: '',
    fonte: '',
    status: rowStatus(row),
    agendado_para: null,
    proximo_followup: '',
    obs: row.observacao || '',
    aniversario: null,
    midia: null,
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
    origem: 'leads_recorrentes',
    origem_custom: '',
    data: r.data || '',
    data_origem: '',
    responsavel: '',
    fonte: '',
    status: rowStatus(r),
    agendado_para: null,
    proximo_followup: '',
    obs: r.observacao || '',
    aniversario: null,
    midia: null,
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
  { key: 'data',        label: 'Data',        type: 'date',           width: 70  },
  { key: 'nome',        label: 'Nome',        type: 'text',           width: 220 },
  { key: 'telefone',    label: 'Telefone',    type: 'text',           width: 130 },
  { key: 'agendou',     label: 'Agendou',     type: 'agendou_select', width: 170 },
  { key: 'vendeu',      label: 'Vendeu',      type: 'bool',           width: 80  },
  { key: 'valor',       label: 'Valor (R$)',  type: 'currency',       width: 110 },
  { key: 'observacao',  label: 'Observação',  type: 'text',           width: 200 },
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
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  const [y, m, day] = iso.split('-').map(Number)
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return null
  return iso
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
    const rawData = cols[0]?.trim()
    const hasDate = rawData && rawData.match(/\d{1,2}[\/\-]+\d{1,2}[\/\-]+\d{2,4}/)
    if (!hasDate) continue

    const agendouRaw = (cols[3] || '').trim().toUpperCase()
    const agendou = agendouRaw.includes('PRÓXIMO') || agendouRaw.includes('PROXIMO') ? 'AGENDOU PRÓXIMO MÊS'
      : agendouRaw.includes('MESMO') ? 'AGENDOU MESMO MÊS'
      : agendouRaw.includes('ANTERIOR') ? 'AGENDOU MÊS ANTERIOR'
      : agendouRaw === 'SIM' ? 'SIM'
      : 'NÃO'
    const vendeuRaw = (cols[4] || '').trim().toUpperCase()
    const vendeu = vendeuRaw === 'SIM'

    let observacao = cols[6]?.trim() || ''

    rows.push({
      id: genId(),
      clinica_id: clinicaId,
      data: parseSheetDate(rawData),
      nome: cols[1]?.trim() || '',
      telefone: cols[2]?.trim() || '',
      agendou,
      vendeu,
      valor: parseValue(cols[5]),
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
    const soMes = rows.filter(r => (r.data || '').startsWith(prefixMes))
    setPreview(soMes)
  }

  const importar = async () => {
    if (!preview.length) return
    if (!clinicaId) { setErro('clinicaId não disponível — recarregue a página.'); return }
    setImportando(true)
    setErro(null)

    const meses = [...new Set(preview.map(r => r.data?.slice(0, 7)).filter(Boolean))]
    for (const m of meses) {
      const [y, mo] = m.split('-').map(Number)
      const nextMes = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
      const { error: delErr } = await supabase.from('planilha_recorrentes')
        .delete().eq('clinica_id', clinicaId).gte('data', `${m}-01`).lt('data', `${nextMes}-01`)
      if (delErr) { setErro(`Erro ao apagar mês ${m}: ${delErr.message}`); setImportando(false); return }
    }

    const CHUNK = 25
    for (let i = 0; i < preview.length; i += CHUNK) {
      const { error } = await supabase.from('planilha_recorrentes').insert(preview.slice(i, i + CHUNK))
      if (error) {
        setErro(`Erro ao inserir linhas ${i + 1}–${i + CHUNK}: ${error.message}`)
        setImportando(false)
        await onDone()
        return
      }
      setDone(Math.min(i + CHUNK, preview.length))
    }

    // Sync para LeadsRecorrentes
    for (const m of meses) {
      const [y, mo] = m.split('-').map(Number)
      const nextMes = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
      await supabase.from('leads')
        .delete().eq('clinica_id', clinicaId).eq('origem', 'leads_recorrentes')
        .gte('data', `${m}-01`).lt('data', `${nextMes}-01`)
    }
    const syncErr = await syncBatchToLeads(preview, clinicaId)
    if (syncErr) { setErro(`Erro ao sincronizar: ${syncErr.message}`); setImportando(false); await onDone(); return }

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
            <p className="text-xs text-gray-400 mt-0.5">Ctrl+A → Ctrl+C na planilha e cole abaixo · só importa {String(mes + 1).padStart(2,'0')}/{ano}</p>
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
              <p className="text-sm font-semibold text-gray-700 mb-2">{preview.length} paciente(s) encontrado(s) — prévia:</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {preview.slice(0, 25).map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 text-xs border-b border-gray-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <span className="text-gray-400 w-14 shrink-0">
                      {r.data ? `${r.data.slice(8,10)}/${r.data.slice(5,7)}` : '—'}
                    </span>
                    <span className="font-semibold text-gray-700 w-40 truncate">{r.nome || '—'}</span>
                    <span className="text-gray-400 w-28 shrink-0">{r.telefone || '—'}</span>
                    <div className="flex gap-1 shrink-0">
                      {r.agendou && <span className="text-blue-600 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded-full font-semibold">Ag</span>}
                      {r.vendeu  && <span className="text-green-600 text-[10px] bg-green-50 px-1.5 py-0.5 rounded-full font-semibold">Vd</span>}
                    </div>
                    {r.valor && <span className="text-orange-500 text-[10px] font-semibold shrink-0">R${r.valor.toLocaleString('pt-BR')}</span>}
                  </div>
                ))}
                {preview.length > 25 && (
                  <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 text-center">+{preview.length - 25} pacientes adicionais</div>
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
            {importando ? 'Importando...' : `Importar ${preview.length} pacientes`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlanilhaRecorrentes() {
  const { clinicaId } = useAuth()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [modalImport, setModalImport] = useState(false)
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
      .from('planilha_recorrentes')
      .select('*')
      .eq('clinica_id', clinicaId)
      .gte('data', monthStart)
      .lt('data', nextMonth)
      .order('data', { ascending: true })
      .order('criado_em', { ascending: true })
    if (error) { console.error(error); setLoading(false); return }
    const loaded = data || []
    setRows(loaded)
    setLoading(false)

    // Auto-popular próximo mês para quem já estava com "AGENDOU PRÓXIMO MÊS"
    const proxMesRows = loaded.filter(r => r.agendou === 'AGENDOU PRÓXIMO MÊS' && r.nome?.trim())
    if (!proxMesRows.length) return
    const proxMes = mes === 11 ? 0 : mes + 1
    const proxAno = mes === 11 ? ano + 1 : ano
    const dataProx  = `${proxAno}-${String(proxMes + 1).padStart(2,'0')}-01`
    const fimProx   = proxMes === 11
      ? `${proxAno + 1}-01-01`
      : `${proxAno}-${String(proxMes + 2).padStart(2,'0')}-01`
    const { data: jaExistem } = await supabase.from('planilha_recorrentes')
      .select('nome').eq('clinica_id', clinicaId).gte('data', dataProx).lt('data', fimProx)
    const nomesJaLa = new Set((jaExistem || []).map(r => r.nome?.trim().toLowerCase()))
    const inserir = proxMesRows.filter(r => !nomesJaLa.has(r.nome.trim().toLowerCase()))
    if (!inserir.length) return
    await supabase.from('planilha_recorrentes').insert(inserir.map(r => ({
      id: genId(), clinica_id: clinicaId,
      data: dataProx, nome: r.nome,
      telefone: r.telefone || '', agendou: 'NÃO',
      vendeu: false, valor: null,
      observacao: `Vindo de ${MESES_FULL[mes]}`,
    })))
  }, [clinicaId, mes, ano, monthStart, nextMonth])

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
      data: dataHoje, nome: '', telefone: '',
      agendou: 'NÃO', vendeu: false, valor: null, observacao: '',
    }
    setRows(prev => [...prev, newRow])
    const { error } = await supabase.from('planilha_recorrentes').insert(newRow)
    if (error) { console.error(error); setRows(prev => prev.filter(r => r.id !== id)); alert('Erro ao adicionar linha.'); return }
    setEditingCell({ rowId: id, col: 'nome' })
  }

  const saveCell = useCallback(async (rowId, col, value) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [col]: value } : r))
    const { error } = await supabase.from('planilha_recorrentes').update({ [col]: value === '' ? null : value }).eq('id', rowId)
    if (error) console.error('saveCell error:', error)
  }, [])

  const toggleBool = useCallback((rowId, col) => {
    setRows(prev => {
      const row = prev.find(r => r.id === rowId)
      if (!row) return prev
      const newVal = !row[col]
      const updatedRow = { ...row, [col]: newVal }
      supabase.from('planilha_recorrentes').update({ [col]: newVal }).eq('id', rowId)
        .then(({ error }) => { if (error) console.error('toggleBool error:', error) })
      if (['agendou', 'vendeu'].includes(col)) syncRowData(updatedRow, clinicaId)
      return prev.map(r => r.id === rowId ? updatedRow : r)
    })
  }, [clinicaId])

  const deleteRow = async (rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
    await supabase.from('planilha_recorrentes').delete().eq('id', rowId)
  }

  const handleBlur = (rowId, col, value) => { saveCell(rowId, col, value); setEditingCell(null) }
  const handleKeyDown = (e, rowId, col, getValue) => {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); saveCell(rowId, col, getValue()); setEditingCell(null) }
    if (e.key === 'Escape') setEditingCell(null)
  }

  const total      = rows.length
  const agendouCount = rows.filter(r => isAgendou(r.agendou)).length
  const vendeuCount  = rows.filter(r => r.vendeu).length
  const valorTotal   = rows.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0)

  const mesmoMes   = rows.filter(r => r.agendou === 'SIM' || r.agendou === 'AGENDOU MESMO MÊS' || r.agendou === true)
  const proximoMes = rows.filter(r => r.agendou === 'AGENDOU PRÓXIMO MÊS')

  const renderCell = (row, col) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.col === col.key
    const value = row[col.key]

    if (col.type === 'agendou_select') {
      const opt = agendouOpt(value)
      const isOpen = openDropdown?.rowId === row.id && openDropdown?.col === col.key
      return (
        <td key={col.key} className="px-2 py-1.5 select-none relative">
          <div className="flex justify-center">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${opt.cls}`}
            onClick={() => setOpenDropdown(isOpen ? null : { rowId: row.id, col: col.key })}
          >{opt.label}</span>
          </div>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
              <div className="absolute z-50 left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 min-w-max">
                {AGENDOU_OPTS.map(o => (
                  <button key={o.value} className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
                    onClick={async () => {
                      setOpenDropdown(null)
                      setRows(prev => prev.map(r => r.id === row.id ? { ...r, agendou: o.value } : r))
                      await supabase.from('planilha_recorrentes').update({ agendou: o.value }).eq('id', row.id)
                      const updated = rows.find(r => r.id === row.id)
                      if (updated) syncRowData({ ...updated, agendou: o.value }, clinicaId)
                      // Auto-mover para próximo mês
                      if (o.value === 'AGENDOU PRÓXIMO MÊS' && row.nome?.trim()) {
                        const proxMes = mes === 11 ? 0 : mes + 1
                        const proxAno = mes === 11 ? ano + 1 : ano
                        const dataProx = `${proxAno}-${String(proxMes + 1).padStart(2,'0')}-01`
                        const { data: existe } = await supabase.from('planilha_recorrentes')
                          .select('id').eq('clinica_id', clinicaId)
                          .eq('nome', row.nome).gte('data', dataProx)
                          .lt('data', `${proxAno}-${String(proxMes + 2 > 12 ? 1 : proxMes + 2).padStart(2,'0')}-01`)
                          .maybeSingle()
                        if (!existe) {
                          await supabase.from('planilha_recorrentes').insert({
                            id: genId(), clinica_id: clinicaId,
                            data: dataProx, nome: row.nome,
                            telefone: row.telefone || '', agendou: 'NÃO',
                            vendeu: false, valor: null, observacao: `Vindo de ${MESES_FULL[mes]}`,
                          })
                        }
                      }
                    }}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${o.cls}`}>{o.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </td>
      )
    }

    if (col.type === 'bool') {
      return (
        <td key={col.key} className="px-2 py-1.5 text-center cursor-pointer select-none"
          onClick={() => toggleBool(row.id, col.key)}>
          <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
            value ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'
          }`}>{value ? 'SIM' : 'NÃO'}</span>
        </td>
      )
    }

    if (isEditing) {
      if (col.type === 'date') {
        return (
          <td key={col.key} className="px-2 py-1">
            <input ref={editInputRef} type="date" defaultValue={value || ''}
              onBlur={e => handleBlur(row.id, col.key, e.target.value || null)}
              onKeyDown={e => handleKeyDown(e, row.id, col.key, () => e.target.value || null)}
              className="w-full border border-orange-300 rounded-lg px-2 py-1 text-xs outline-none bg-white" />
          </td>
        )
      }
      if (col.type === 'currency') {
        return (
          <td key={col.key} className="px-2 py-1">
            <input ref={editInputRef} type="number" step="0.01" defaultValue={value ?? ''}
              onBlur={e => handleBlur(row.id, col.key, e.target.value === '' ? null : parseFloat(e.target.value))}
              onKeyDown={e => handleKeyDown(e, row.id, col.key, () => e.target.value === '' ? null : parseFloat(e.target.value))}
              className="w-full border border-orange-300 rounded-lg px-2 py-1 text-xs outline-none bg-white" />
          </td>
        )
      }
      return (
        <td key={col.key} className="px-2 py-1">
          <input ref={editInputRef} type="text" defaultValue={value || ''}
            onBlur={e => handleBlur(row.id, col.key, e.target.value)}
            onKeyDown={e => handleKeyDown(e, row.id, col.key, () => e.target.value)}
            className="w-full border border-orange-300 rounded-lg px-2 py-1 text-xs outline-none bg-white" />
        </td>
      )
    }

    const display = () => {
      if (col.type === 'date') return value ? `${value.slice(8,10)}/${value.slice(5,7)}` : '—'
      if (col.type === 'currency') return value != null ? `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
      return value || '—'
    }

    return (
      <td key={col.key} className="px-2 py-1.5 cursor-pointer group/cell"
        onClick={() => setEditingCell({ rowId: row.id, col: col.key })}>
        <span className={`text-xs ${value ? 'text-gray-700' : 'text-gray-300'} group-hover/cell:bg-orange-50 rounded px-1`}>
          {display()}
        </span>
      </td>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planilha de Recorrentes</h1>
          <p className="text-xs text-gray-400 mt-0.5">{MESES_FULL[mes]} {ano} · clique em qualquer célula para editar · salva automaticamente</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setModalImport(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm border border-gray-200">
            ↑ Importar
          </button>
          <button onClick={addRow}
            className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
            + Novo
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Recorrentes</p>
          <p className="text-3xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-400 mt-1">neste mês</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Agendou</p>
          <p className="text-3xl font-bold text-blue-600">{agendouCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {total > 0 ? `${((agendouCount / total) * 100).toFixed(1)}% do total` : 'nenhum ainda'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Vendeu</p>
          <p className="text-3xl font-bold text-green-600">{vendeuCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            {agendouCount > 0 ? `${((vendeuCount / agendouCount) * 100).toFixed(0)}% dos agendados` : 'nenhum ainda'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-orange-500">
            {valorTotal > 0 ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{vendeuCount} venda(s)</p>
        </div>
      </div>

      {/* Cards de agendamentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Agendou Mesmo Mês */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-blue-50">
            <div>
              <p className="text-sm font-bold text-blue-700">Agendou Mesmo Mês</p>
              <p className="text-xs text-gray-400 mt-0.5">confirmados para {MESES_FULL[mes]}</p>
            </div>
            <span className="text-3xl font-bold text-blue-600">{mesmoMes.length}</span>
          </div>
          {mesmoMes.length === 0 ? (
            <p className="px-5 py-4 text-xs text-gray-300">Nenhum agendado ainda</p>
          ) : (
            <ul className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
              {mesmoMes.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="text-[10px] text-gray-300 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm font-semibold text-gray-700 flex-1 truncate">{r.nome || '—'}</span>
                  {r.telefone && <span className="text-xs text-gray-400 shrink-0">{r.telefone}</span>}
                  {r.vendeu && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded shrink-0">VENDEU</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agendou Próximo Mês */}
        <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-yellow-50">
            <div>
              <p className="text-sm font-bold text-yellow-700">Agendou Próximo Mês</p>
              <p className="text-xs text-gray-400 mt-0.5">confirmados para {MESES_FULL[(mes + 1) % 12]}</p>
            </div>
            <span className="text-3xl font-bold text-yellow-600">{proximoMes.length}</span>
          </div>
          {proximoMes.length === 0 ? (
            <p className="px-5 py-4 text-xs text-gray-300">Nenhum agendado ainda</p>
          ) : (
            <ul className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
              {proximoMes.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="text-[10px] text-gray-300 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm font-semibold text-gray-700 flex-1 truncate">{r.nome || '—'}</span>
                  {r.telefone && <span className="text-xs text-gray-400 shrink-0">{r.telefone}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-gray-300 text-sm">Carregando...</div>
        ) : (
          <>
            <div className="overflow-auto max-h-[60vh]">
            <table className="text-left text-xs border-collapse w-full" style={{ minWidth: '900px' }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-300 uppercase w-8">#</th>
                  {COLS.map(col => (
                    <th key={col.key} style={{ width: col.width }} className={`px-2 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                      col.key === 'agendou' || col.key === 'vendeu' ? 'text-center' : ''
                    }`}>
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
                      Nenhum recorrente este mês · clique em "+ Novo" ou "Importar Planilha"
                    </td>
                  </tr>
                ) : rows.map((row, i) => (
                  <tr key={row.id}
                    className={`border-b border-gray-100 group ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50/40`}>
                    <td className="px-3 py-1.5 text-[10px] text-gray-300 select-none">{i + 1}</td>
                    {COLS.map(col => renderCell(row, col))}
                    <td className="px-2 py-1.5">
                      <button onClick={() => deleteRow(row.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all w-6 h-6 flex items-center justify-center rounded-md text-lg leading-none opacity-0 group-hover:opacity-100">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
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

      {/* Abas mensais — estilo Google Sheets */}
      <div className="fixed bottom-0 left-16 right-0 z-30 bg-white border-t border-gray-200 flex items-end gap-0 overflow-x-auto px-4 py-0 shadow-md">
        <div className="flex items-end gap-1 min-w-max py-1">
          {/* Seletor de ano */}
          <div className="flex items-center gap-1 mr-3 self-center">
            <button onClick={() => setAno(a => a - 1)} className="text-gray-400 hover:text-gray-600 text-sm px-1">‹</button>
            <span className="text-xs font-bold text-gray-500 w-10 text-center">{ano}</span>
            <button onClick={() => setAno(a => a + 1)} className="text-gray-400 hover:text-gray-600 text-sm px-1">›</button>
          </div>
          {MESES_ABREV.map((label, i) => (
            <button
              key={i}
              onClick={() => setMes(i)}
              className={`px-4 py-2 text-xs font-semibold border-t-2 transition-all whitespace-nowrap rounded-t-lg ${
                mes === i
                  ? 'border-orange-400 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Espaço para não ficar atrás das abas */}
      <div className="h-12" />
    </div>
  )
}
