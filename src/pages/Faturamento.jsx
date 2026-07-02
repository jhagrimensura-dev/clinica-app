import { useState, useEffect, useRef } from 'react'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useVendas } from '../context/VendasContext'
import { usePacientes } from '../context/PacientesContext'
import { useLeads } from '../context/LeadsContext'
import { useConfig } from '../context/ConfigContext'
import { useAuth } from '../context/AuthContext'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const FORMAS_PGTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência', 'Boleto']
const CORES_PROC = ['bg-brand-400','bg-purple-400','bg-blue-400','bg-cyan-400','bg-teal-400','bg-orange-400','bg-pink-400','bg-indigo-400']
const PROCS_DEFAULT = [
  { nome: 'Botox', preco: 0, precoPorMl: 0, unidade: 'ml', mostraQtd: false },
  { nome: 'Preenchimento', preco: 0, precoPorMl: 0, unidade: 'ml', mostraQtd: true },
  { nome: 'Skinbooster', preco: 0, precoPorMl: 0, unidade: 'ml', mostraQtd: true },
  { nome: 'Fio de PDO', preco: 0, precoPorMl: 0, unidade: 'fio', mostraQtd: false },
]

function parseLinhaProc(str, procs) {
  if (!str) return { nome: '', qtd: '', total: 0, precoPorMl: 0, unidade: 'ml', storedVal: 0 }
  // Extract per-procedure value encoded as @{cents}
  let storedVal = 0
  let s = str
  const atIdx = str.lastIndexOf('@')
  if (atIdx > 0 && /^\d+$/.test(str.slice(atIdx + 1))) {
    storedVal = parseInt(str.slice(atIdx + 1), 10) / 100
    s = str.slice(0, atIdx).trim()
  }
  const match = s.match(/^(.+?)\s*\((\d+(?:[.,]\d+)?)\s*(\w+)?\)$/)
  if (match) {
    const nome = match[1].trim()
    const qtd = match[2].replace(',', '.')
    const unidade = match[3]?.trim() || 'ml'
    const proc = procs.find(p => p.nome === nome)
    const precoPorMl = proc?.precoPorMl || 0
    const calcTotal = precoPorMl > 0 ? precoPorMl * parseFloat(qtd) : 0
    return { nome, qtd, total: storedVal || calcTotal, precoPorMl, unidade, storedVal }
  }
  const proc = procs.find(p => p.nome === s.trim())
  return { nome: s.trim(), qtd: '', total: storedVal, precoPorMl: proc?.precoPorMl || 0, unidade: proc?.unidade || 'ml', storedVal }
}

function displayProc(str) {
  if (!str) return ''
  return str.replace(/@\d+/g, '').replace(/\s+/g, ' ').trim()
}

function getProcedimentos(fromContext) {
  if (fromContext) return fromContext
  try { return JSON.parse(localStorage.getItem('procedimentos_cadastro')) || PROCS_DEFAULT }
  catch { return PROCS_DEFAULT }
}

function mascaraMoeda(valor) {
  const nums = valor.replace(/\D/g, '')
  if (!nums) return ''
  const num = parseInt(nums, 10) / 100
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMoeda(valor) {
  return parseFloat(valor.replace(/\D/g, '')) / 100 || 0
}

function SelectProcedimento({ value, onChange, procs, onProcsChange }) {
  const { userRole } = useAuth()
  const isAdmin = userRole !== 'Funcionário'
  const [adicionando, setAdicionando] = useState(false)
  const [editandoLista, setEditandoLista] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoPrecoPorMl, setNovoPrecoPorMl] = useState('')
  const [novoUnidade, setNovoUnidade] = useState('ml')

  const salvar = () => {
    if (!novoNome.trim()) return
    const precoPorMl = parseMoeda(novoPrecoPorMl)
    const novos = [...procs, { nome: novoNome.trim(), preco: 0, precoPorMl, unidade: novoUnidade, mostraQtd: precoPorMl > 0 }]
    onProcsChange(novos)
    onChange(novoNome.trim(), 0, precoPorMl, novoUnidade, precoPorMl > 0)
    setAdicionando(false)
    setNovoNome('')
    setNovoPrecoPorMl('')
    setNovoUnidade('ml')
  }

  const cancelar = () => { setAdicionando(false); setNovoNome(''); setNovoPrecoPorMl(''); setNovoUnidade('ml') }

  const remover = (nome) => {
    const novos = procs.filter(p => p.nome !== nome)
    onProcsChange(novos)
    if (value === nome) onChange('', 0, 0, 'ml')
  }

  const toggleMostraQtd = (nome) => {
    const novos = procs.map(p => p.nome === nome ? { ...p, mostraQtd: !p.mostraQtd } : p)
    onProcsChange(novos)
    if (value === nome) {
      const p = novos.find(x => x.nome === nome)
      onChange(nome, p.preco ?? 0, p.precoPorMl ?? 0, p.unidade ?? 'ml')
    }
  }

  const valorForaDaLista = value && value !== '__novo__' && !procs.find(p => p.nome === value)

  if (adicionando) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)}
            placeholder="Nome do procedimento" autoFocus
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
          <select value={novoUnidade} onChange={e => setNovoUnidade(e.target.value)}
            className="w-24 border border-gray-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
            <option value="ml">ml</option>
            <option value="sessão">sessão</option>
            <option value="fio">fio</option>
            <option value="ampola">ampola</option>
            <option value="unidade">unidade</option>
          </select>
          <input type="text" inputMode="numeric" value={novoPrecoPorMl}
            onChange={e => setNovoPrecoPorMl(mascaraMoeda(e.target.value))}
            placeholder={`R$ por ${novoUnidade}`}
            className="w-36 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={salvar} disabled={!novoNome.trim()}
            className="px-4 py-1.5 bg-brand-400 text-white text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-brand-500">
            Salvar procedimento
          </button>
          <button type="button" onClick={cancelar}
            className="px-4 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {isAdmin && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setEditandoLista(v => !v)}
            className="text-[11px] text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
            ✎ {editandoLista ? 'Fechar' : 'Editar lista'}
          </button>
        </div>
      )}
      {editandoLista && isAdmin ? (
        <div className="border border-gray-200 rounded-xl p-2 space-y-1 bg-gray-50 max-h-48 overflow-y-auto">
          <p className="text-[10px] text-gray-400 px-1 pb-0.5">Ative "ml" para mostrar campo de quantidade</p>
          {procs.map(p => (
            <div key={p.nome} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-white border border-gray-100">
              <span className="text-sm text-gray-700 truncate flex-1">{p.nome}</span>
              <button type="button" onClick={() => toggleMostraQtd(p.nome)}
                title="Ativar/desativar campo de ML"
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors flex-shrink-0 ${p.mostraQtd ? 'bg-brand-400 text-white border-brand-400' : 'bg-white text-gray-400 border-gray-200 hover:border-brand-300'}`}>
                ml
              </button>
              <button type="button" onClick={() => remover(p.nome)}
                className="text-red-400 hover:text-red-600 text-xs font-bold flex-shrink-0">✕</button>
            </div>
          ))}
          {procs.length === 0 && <p className="text-xs text-gray-400 text-center py-1">Nenhum procedimento</p>}
        </div>
      ) : (
        <select value={value}
          onChange={e => {
            if (e.target.value === '__novo__') { setAdicionando(true); return }
            const proc = procs.find(p => p.nome === e.target.value)
            onChange(e.target.value, proc?.preco ?? 0, proc?.precoPorMl ?? 0, proc?.unidade ?? 'ml', proc?.mostraQtd ?? false)
          }}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
          <option value="">Selecione um procedimento</option>
          {valorForaDaLista && <option value={value}>{value}</option>}
          {procs.map(p => (
            <option key={p.nome} value={p.nome}>
              {p.nome}{p.precoPorMl > 0 ? ` — R$ ${p.precoPorMl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/${p.unidade || 'ml'}` : ''}
            </option>
          ))}
          <option value="__novo__">+ Adicionar novo procedimento...</option>
        </select>
      )}
    </div>
  )
}

const RESPONSAVEIS_PADRAO = ['Dra. Amanda', 'Recepção', 'Equipe']

function ResponsavelSelect({ value, onChange }) {
  const { faturamentoResponsaveis, setFaturamentoResponsaveis } = useConfig()
  const [lista, setLista] = useState(faturamentoResponsaveis || RESPONSAVEIS_PADRAO)
  const [editando, setEditando] = useState(false)
  const [novoNome, setNovoNome] = useState('')

  useEffect(() => { if (faturamentoResponsaveis) setLista(faturamentoResponsaveis) }, [faturamentoResponsaveis])

  function adicionar() {
    const v = novoNome.trim()
    if (!v || lista.includes(v)) return
    const nova = [...lista, v]
    setLista(nova); setFaturamentoResponsaveis(nova); setNovoNome('')
  }
  function remover(nome) {
    const nova = lista.filter(x => x !== nome)
    setLista(nova); setFaturamentoResponsaveis(nova)
    if (value === nome) onChange('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">Responsável</label>
        <button type="button" onClick={() => setEditando(v => !v)}
          className="text-[10px] text-brand-500 hover:text-brand-700 font-semibold">
          {editando ? 'Fechar' : '✎ Editar lista'}
        </button>
      </div>
      {editando ? (
        <div className="border border-gray-200 rounded-xl p-3 space-y-1.5 bg-gray-50">
          {lista.map((nome, i) => (
            <div key={nome} className="flex items-center gap-1">
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button type="button" onClick={() => { if (i === 0) return; const n = [...lista]; [n[i-1],n[i]]=[n[i],n[i-1]]; setLista(n); setFaturamentoResponsaveis(n) }}
                  disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[10px]">▲</button>
                <button type="button" onClick={() => { if (i === lista.length-1) return; const n = [...lista]; [n[i],n[i+1]]=[n[i+1],n[i]]; setLista(n); setFaturamentoResponsaveis(n) }}
                  disabled={i === lista.length-1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[10px]">▼</button>
              </div>
              <span className="flex-1 text-sm text-gray-700">{nome}</span>
              <button type="button" onClick={() => remover(nome)}
                className="text-gray-300 hover:text-red-400 text-xs font-bold flex-shrink-0">✕</button>
            </div>
          ))}
          <div className="flex gap-2 pt-1 border-t border-gray-200">
            <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionar()}
              placeholder="Novo responsável..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-brand-400 bg-white" />
            <button type="button" onClick={adicionar}
              className="text-xs bg-brand-400 hover:bg-brand-500 text-white px-3 py-1 rounded-lg font-semibold">+ Add</button>
          </div>
        </div>
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
          <option value="">Selecione o responsável</option>
          {lista.map(nome => <option key={nome} value={nome}>{nome}</option>)}
        </select>
      )}
    </div>
  )
}

function PacienteCombobox({ value, onChange, pacientes, leads }) {
  const [busca, setBusca] = useState(value || '')
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  useEffect(() => { setBusca(value || '') }, [value])

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const nomesPackientes = new Set(pacientes.map(p => p.nome.toLowerCase()))
  const leadsUnicos = (leads || [])
    .filter(l => l.nome && !nomesPackientes.has(l.nome.toLowerCase()))
    .reduce((acc, l) => { if (!acc.find(x => x.nome.toLowerCase() === l.nome.toLowerCase())) acc.push(l); return acc }, [])

  const todasSugestoes = [
    ...pacientes.map(p => ({ nome: p.nome, tipo: 'paciente' })),
    ...leadsUnicos.map(l => ({ nome: l.nome, tipo: 'lead' })),
  ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const filtrados = busca.trim()
    ? todasSugestoes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : todasSugestoes

  const selecionar = (nome) => {
    onChange(nome)
    setBusca(nome)
    setAberto(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={busca}
        onChange={e => { setBusca(e.target.value); onChange(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        placeholder="Digite o nome..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400"
      />
      {aberto && filtrados.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtrados.map((p, i) => (
            <button key={i} type="button" onMouseDown={() => selecionar(p.nome)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center justify-between">
              <span>{p.nome}</span>
              {p.tipo === 'lead' && <span className="text-[10px] text-gray-400 font-medium ml-2 flex-shrink-0">lead</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ModalNovoLancamento({ onClose, onSalvar, ano, mes, pacientes, leads, procs, onProcsChange }) {
  const hoje = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const [data, setData] = useState(hoje)
  const [paciente, setPaciente] = useState('')
  const [tipo, setTipo] = useState('Novo')
  const [responsavel, setResponsavel] = useState('')
  const [listaProcs, setListaProcs] = useState([{ nome: '', qtd: '', total: 0, precoPorMl: 0, unidade: 'ml', valorStr: '' }])
  const [valorTaxa, setValorTaxa] = useState('')
  const [valorTratamento, setValorTratamento] = useState('')
  const [desconto, setDesconto] = useState('')
  const [formasPgto, setFormasPgto] = useState([])
  const [agendado, setAgendado] = useState(false)
  const [obs, setObs] = useState('')

  useEffect(() => {
    const soma = listaProcs.reduce((acc, p) => acc + (p.total || 0), 0)
    if (soma > 0) setValorTratamento(mascaraMoeda(String(Math.round(soma * 100))))
  }, [listaProcs])

  const handleProcNome = (idx, nome, preco, precoPorMl, unidade, mostraQtd) => {
    setListaProcs(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const total = precoPorMl > 0 && p.qtd ? precoPorMl * parseFloat(p.qtd) : 0
      const valorStr = total > 0 ? mascaraMoeda(String(Math.round(total * 100))) : ''
      return { ...p, nome, precoPorMl: precoPorMl || 0, unidade: unidade || 'ml', mostraQtd: mostraQtd ?? false, total, valorStr }
    }))
  }

  const handleProcQtd = (idx, qtd) => {
    setListaProcs(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const total = (p.precoPorMl || 0) > 0 && qtd ? p.precoPorMl * parseFloat(qtd || 0) : p.total
      const valorStr = (p.precoPorMl || 0) > 0 && qtd ? mascaraMoeda(String(Math.round(total * 100))) : p.valorStr
      return { ...p, qtd, total, valorStr }
    }))
  }

  const handleProcValor = (idx, valor) => {
    const formatted = mascaraMoeda(valor)
    setListaProcs(prev => prev.map((p, i) => i !== idx ? p : { ...p, total: parseMoeda(formatted), valorStr: formatted }))
  }

  const toggleForma = (forma) => {
    setFormasPgto(prev => prev.includes(forma) ? prev.filter(f => f !== forma) : [...prev, forma])
  }

  const handleCriar = () => {
    if (!paciente) return
    const procedimentos = listaProcs
      .filter(p => p.nome)
      .map(p => {
        let s = p.qtd ? `${p.nome} (${p.qtd}${p.unidade || 'ml'})` : p.nome
        if (p.total > 0) s += `@${Math.round(p.total * 100)}`
        return s
      })
      .join(' e ')
    const valorFinal = Math.max(0, parseMoeda(valorTratamento) - parseMoeda(desconto))
    onSalvar({ data, paciente, tipo, responsavel, procedimentos, valorTaxa: parseMoeda(valorTaxa), valorTratamento: valorFinal, formasPgto, agendado, obs })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Novo Lançamento</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome do Paciente</label>
              <PacienteCombobox value={paciente} onChange={setPaciente} pacientes={pacientes} leads={leads} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
                <option value="Novo">Novo</option>
                <option value="Recorrência">Recorrência</option>
                <option value="Indicação">Indicação</option>
                <option value="Paciente Modelo">Paciente Modelo</option>
              </select>
            </div>
            <div>
              <ResponsavelSelect value={responsavel} onChange={setResponsavel} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Procedimentos</label>
              <button type="button" onClick={() => setListaProcs(prev => [...prev, { nome: '', qtd: '', total: 0, precoPorMl: 0, unidade: 'ml' }])}
                className="text-xs text-brand-400 hover:text-brand-500 font-semibold">+ Adicionar</button>
            </div>
            <div className="space-y-2">
              {listaProcs.map((proc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SelectProcedimento value={proc.nome} onChange={(nome, preco, precoPorMl, unidade, mostraQtd) => handleProcNome(idx, nome, preco, precoPorMl, unidade, mostraQtd)} procs={procs} onProcsChange={onProcsChange} />
                    </div>
                    {listaProcs.length > 1 && (
                      <button type="button" onClick={() => setListaProcs(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-300 hover:text-red-400 text-xl leading-none flex-shrink-0 transition-colors">×</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    {(proc.mostraQtd || proc.precoPorMl > 0) && (
                      <>
                        <input type="number" value={proc.qtd} onChange={e => handleProcQtd(idx, e.target.value)}
                          placeholder="0" min="0" step="0.5"
                          className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
                        <span className="text-sm text-gray-400">{proc.unidade || 'ml'}</span>
                      </>
                    )}
                    <input type="text" inputMode="numeric" value={proc.valorStr}
                      onChange={e => handleProcValor(idx, e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-36 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400" />
                    <span className="text-xs text-gray-400">valor</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Consultas (R$)</label>
              <input type="text" inputMode="numeric" value={valorTaxa} onChange={e => setValorTaxa(mascaraMoeda(e.target.value))}
                placeholder="R$ 0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Total Tratamento (R$)</label>
              <input type="text" value={valorTratamento} readOnly placeholder="R$ 0,00"
                className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-default" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Desconto (R$)</label>
              <input type="text" inputMode="numeric" value={desconto} onChange={e => setDesconto(mascaraMoeda(e.target.value))}
                placeholder="R$ 0,00"
                className="w-full border border-red-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor Final (R$)</label>
              <input type="text" value={(() => { const v = Math.max(0, parseMoeda(valorTratamento) - parseMoeda(desconto)); return v > 0 ? mascaraMoeda(String(Math.round(v * 100))) : 'R$ 0,00' })()} readOnly
                className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm bg-green-50 text-green-700 font-semibold cursor-default" />
            </div>
          </div>

          <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="checkbox" checked={agendado} onChange={e => setAgendado(e.target.checked)}
              className="accent-brand-400 w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Paciente veio por agendamento</span>
          </label>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Formas de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PGTO.map(forma => (
                <label key={forma} className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={formasPgto.includes(forma)} onChange={() => toggleForma(forma)}
                    className="accent-amber-500 w-4 h-4" />
                  <span className="text-sm text-gray-700">{forma}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Observações adicionais (opcional)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleCriar} disabled={!paciente}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40">
            Criar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEditarLancamento({ lancamento, onClose, onAtualizar, onExcluir, pacientes, leads, procs, onProcsChange }) {
  const [data, setData] = useState(lancamento.data)
  const [paciente, setPaciente] = useState(lancamento.paciente)
  const [tipo, setTipo] = useState(lancamento.tipo)
  const [responsavel, setResponsavel] = useState(lancamento.responsavel || '')
  const [listaProcs, setListaProcs] = useState(() => {
    if (!lancamento.procedimentos) return [{ nome: '', qtd: '', total: 0, precoPorMl: 0, unidade: 'ml', valorStr: '' }]
    const parsed = lancamento.procedimentos.split(' e ').filter(Boolean).map(s => parseLinhaProc(s, procs))
    const hasStored = parsed.some(p => p.storedVal > 0)
    return parsed.map(p => {
      let total = p.storedVal || p.total || 0
      if (!hasStored && parsed.length === 1 && lancamento.valorTratamento > 0) total = lancamento.valorTratamento
      return { ...p, total, valorStr: total > 0 ? mascaraMoeda(String(Math.round(total * 100))) : '' }
    })
  })
  const [valorTaxa, setValorTaxa] = useState(lancamento.valorTaxa ? mascaraMoeda(String(Math.round(lancamento.valorTaxa * 100))) : '')
  const [valorTratamento, setValorTratamento] = useState(lancamento.valorTratamento ? mascaraMoeda(String(Math.round(lancamento.valorTratamento * 100))) : '')
  const [desconto, setDesconto] = useState('')
  const [formasPgto, setFormasPgto] = useState(lancamento.formasPgto || [])
  const [agendado, setAgendado] = useState(lancamento.agendado || false)
  const [obs, setObs] = useState(lancamento.obs || '')
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)

  useEffect(() => {
    const soma = listaProcs.reduce((acc, p) => acc + (p.total || 0), 0)
    if (soma > 0) setValorTratamento(mascaraMoeda(String(Math.round(soma * 100))))
  }, [listaProcs])

  const handleProcNome = (idx, nome, preco, precoPorMl, unidade, mostraQtd) => {
    setListaProcs(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const total = precoPorMl > 0 && p.qtd ? precoPorMl * parseFloat(p.qtd) : 0
      const valorStr = total > 0 ? mascaraMoeda(String(Math.round(total * 100))) : ''
      return { ...p, nome, precoPorMl: precoPorMl || 0, unidade: unidade || 'ml', mostraQtd: mostraQtd ?? false, total, valorStr }
    }))
  }

  const handleProcQtd = (idx, qtd) => {
    setListaProcs(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const total = (p.precoPorMl || 0) > 0 && qtd ? p.precoPorMl * parseFloat(qtd || 0) : p.total
      const valorStr = (p.precoPorMl || 0) > 0 && qtd ? mascaraMoeda(String(Math.round(total * 100))) : p.valorStr
      return { ...p, qtd, total, valorStr }
    }))
  }

  const handleProcValor = (idx, valor) => {
    const formatted = mascaraMoeda(valor)
    setListaProcs(prev => prev.map((p, i) => i !== idx ? p : { ...p, total: parseMoeda(formatted), valorStr: formatted }))
  }

  const toggleForma = (forma) =>
    setFormasPgto(prev => prev.includes(forma) ? prev.filter(f => f !== forma) : [...prev, forma])

  const handleAtualizar = () => {
    if (!paciente) return
    const procedimentos = listaProcs
      .filter(p => p.nome)
      .map(p => {
        let s = p.qtd ? `${p.nome} (${p.qtd}${p.unidade || 'ml'})` : p.nome
        if (p.total > 0) s += `@${Math.round(p.total * 100)}`
        return s
      })
      .join(' e ')
    const valorFinal = Math.max(0, parseMoeda(valorTratamento) - parseMoeda(desconto))
    onAtualizar(lancamento.id, { data, paciente, tipo, responsavel, procedimentos, valorTaxa: parseMoeda(valorTaxa), valorTratamento: valorFinal, formasPgto, agendado, obs })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Editar Lançamento</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome do Paciente</label>
              <PacienteCombobox value={paciente} onChange={setPaciente} pacientes={pacientes} leads={leads} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
                <option value="Novo">Novo</option>
                <option value="Recorrência">Recorrência</option>
                <option value="Indicação">Indicação</option>
                <option value="Paciente Modelo">Paciente Modelo</option>
              </select>
            </div>
            <div>
              <ResponsavelSelect value={responsavel} onChange={setResponsavel} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Procedimentos</label>
              <button type="button" onClick={() => setListaProcs(prev => [...prev, { nome: '', qtd: '', total: 0, precoPorMl: 0, unidade: 'ml', valorStr: '' }])}
                className="text-xs text-brand-400 hover:text-brand-500 font-semibold">+ Adicionar</button>
            </div>
            <div className="space-y-2">
              {listaProcs.map((proc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SelectProcedimento value={proc.nome} onChange={(nome, preco, precoPorMl, unidade, mostraQtd) => handleProcNome(idx, nome, preco, precoPorMl, unidade, mostraQtd)} procs={procs} onProcsChange={onProcsChange} />
                    </div>
                    {listaProcs.length > 1 && (
                      <button type="button" onClick={() => setListaProcs(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-300 hover:text-red-400 text-xl leading-none flex-shrink-0 transition-colors">×</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    {(proc.mostraQtd || proc.precoPorMl > 0) && (
                      <>
                        <input type="number" value={proc.qtd} onChange={e => handleProcQtd(idx, e.target.value)}
                          placeholder="0" min="0" step="0.5"
                          className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
                        <span className="text-sm text-gray-400">{proc.unidade || 'ml'}</span>
                      </>
                    )}
                    <input type="text" inputMode="numeric" value={proc.valorStr}
                      onChange={e => handleProcValor(idx, e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-36 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400" />
                    <span className="text-xs text-gray-400">valor</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Consultas (R$)</label>
              <input type="text" inputMode="numeric" value={valorTaxa} onChange={e => setValorTaxa(mascaraMoeda(e.target.value))}
                placeholder="R$ 0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Total Tratamento (R$)</label>
              <input type="text" value={valorTratamento} readOnly placeholder="R$ 0,00"
                className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-default" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Desconto (R$)</label>
              <input type="text" inputMode="numeric" value={desconto} onChange={e => setDesconto(mascaraMoeda(e.target.value))}
                placeholder="R$ 0,00"
                className="w-full border border-red-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor Final (R$)</label>
              <input type="text" value={(() => { const v = Math.max(0, parseMoeda(valorTratamento) - parseMoeda(desconto)); return v > 0 ? mascaraMoeda(String(Math.round(v * 100))) : 'R$ 0,00' })()} readOnly
                className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm bg-green-50 text-green-700 font-semibold cursor-default" />
            </div>
          </div>

          <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="checkbox" checked={agendado} onChange={e => setAgendado(e.target.checked)}
              className="accent-brand-400 w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Paciente veio por agendamento</span>
          </label>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Formas de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PGTO.map(forma => (
                <label key={forma} className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={formasPgto.includes(forma)} onChange={() => toggleForma(forma)}
                    className="accent-amber-500 w-4 h-4" />
                  <span className="text-sm text-gray-700">{forma}</span>
                </label>
              ))}
            </div>
          </div>

          {formasPgto.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Configurações de Pagamento</label>
              <div className="space-y-2">
                {formasPgto.map(forma => (
                  <div key={forma} className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5">
                    <span className="text-sm font-medium text-gray-700 flex-1">{forma}</span>
                    <span className="text-xs text-gray-400">À vista</span>
                    <button type="button" onClick={() => toggleForma(forma)} className="text-red-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Observações adicionais (opcional)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          {confirmarExcluir ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500 font-medium">Confirmar exclusão?</span>
              <button onClick={() => { onExcluir(lancamento.id); onClose() }}
                className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600">Sim, excluir</button>
              <button onClick={() => setConfirmarExcluir(false)}
                className="px-3 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50">Não</button>
            </div>
          ) : (
            <button onClick={() => setConfirmarExcluir(true)}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
              Excluir Lançamento
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleAtualizar} disabled={!paciente}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
              Atualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Faturamento() {
  const { ano, setAno, mes, setMes } = useFinanceiro()
  const { lancamentos, addLancamento, removeLancamento, updateLancamento } = useVendas()
  const { pacientes } = usePacientes()
  const { leads } = useLeads()
  const { procedimentos: procsFromDB, setProcedimentos } = useConfig()
  const { userRole } = useAuth()
  const procs = (procsFromDB || PROCS_DEFAULT).map(p =>
    p.mostraQtd !== undefined ? p : { ...p, mostraQtd: PROCS_DEFAULT.find(d => d.nome === p.nome)?.mostraQtd ?? (p.precoPorMl > 0) }
  )
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const handleProcsChange = (novos) => setProcedimentos(novos)

  const navMes = (delta) => {
    const novo = mes + delta
    if (novo < 0) { setMes(11); setAno(a => a - 1) }
    else if (novo > 11) { setMes(0); setAno(a => a + 1) }
    else setMes(novo)
  }

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const lancamentosMesAll = lancamentos.filter(l => l.data.startsWith(prefix))
  const lancamentosModelo = lancamentosMesAll.filter(l => l.tipo === 'Paciente Modelo')
  const lancamentosMes = lancamentosMesAll.filter(l => l.tipo !== 'Paciente Modelo')

  const totalTratamentos = lancamentosMes.reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalTaxas = lancamentosMes.reduce((acc, l) => acc + (l.valorTaxa || 0), 0)
  const totalGeral = totalTratamentos + totalTaxas
  const totalModelo = lancamentosModelo.reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
  const mlModelo = lancamentosModelo.reduce((acc, l) => {
    if (!l.procedimentos) return acc
    l.procedimentos.split(' e ').forEach(s => {
      const parsed = parseLinhaProc(s, procs)
      const proc = procs.find(p => p.nome === parsed.nome)
      if (proc?.mostraQtd && parsed.qtd) acc += parseFloat(parsed.qtd) || 0
    })
    return acc
  }, 0)

  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  // Receita agrupada por procedimento
  const receitaPorProc = procs.map((p, i) => {
    let total = 0
    let totalMl = 0
    let count = 0
    lancamentosMes.forEach(l => {
      if (!l.procedimentos) return
      const partes = l.procedimentos.split(' e ')
      const matching = partes.filter(s => parseLinhaProc(s, procs).nome === p.nome)
      if (matching.length === 0) return
      count++
      const hasStored = partes.some(s => parseLinhaProc(s, procs).storedVal > 0)
      if (hasStored) {
        matching.forEach(s => {
          const parsed = parseLinhaProc(s, procs)
          total += parsed.storedVal
          if (p.mostraQtd && parsed.qtd) totalMl += parseFloat(parsed.qtd) || 0
        })
      } else if (partes.length === 1) {
        total += (l.valorTaxa || 0) + (l.valorTratamento || 0)
        if (p.mostraQtd && matching[0]) {
          const parsed = parseLinhaProc(matching[0], procs)
          if (parsed.qtd) totalMl += parseFloat(parsed.qtd) || 0
        }
      } else {
        // Dados antigos sem valores por procedimento: divide igualmente
        total += (l.valorTratamento || 0) / partes.length
        matching.forEach(s => {
          const parsed = parseLinhaProc(s, procs)
          if (p.mostraQtd && parsed.qtd) totalMl += parseFloat(parsed.qtd) || 0
        })
      }
    })
    return { ...p, total, totalMl, count, cor: CORES_PROC[i % CORES_PROC.length] }
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const maxReceita = Math.max(...receitaPorProc.map(p => p.total), 1)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-24 text-center">{MESES_FULL[mes].slice(0,3)} {ano}</span>
            <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            + Novo Lançamento
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Vendas Total</p>
          <p className="text-2xl font-bold text-gray-900">R$ {fmt(totalGeral)}</p>
          <p className="text-xs text-gray-400 mt-1">{lancamentosMes.length} lançamentos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Tratamentos</p>
          <p className="text-2xl font-bold text-green-500">R$ {fmt(totalTratamentos)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {lancamentosMes.filter(l => l.tipo === 'Novo' && (l.valorTratamento || 0) > 0).length} novos ·{' '}
            {lancamentosMes.filter(l => l.tipo === 'Recorrência' && (l.valorTratamento || 0) > 0).length} recorrentes
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Consultas (R$)</p>
          <p className="text-2xl font-bold text-yellow-500">R$ {fmt(totalTaxas)}</p>
          <p className="text-xs text-gray-400 mt-1">{lancamentosMes.filter(l => (l.valorTaxa || 0) > 0).length} consulta(s) paga(s)</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Paciente Modelo</p>
          <p className="text-2xl font-bold text-purple-500">R$ {fmt(totalModelo)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {lancamentosModelo.length} lançamento(s){mlModelo > 0 ? ` · ${mlModelo % 1 === 0 ? mlModelo : mlModelo.toFixed(1)}ml` : ''} — não contabilizado(s)
          </p>
        </div>
      </div>

      {/* Procedimentos */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">Receita por Procedimento</h2>
          <div className="space-y-3">
            {receitaPorProc.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    {p.nome}
                    {p.count > 0 && (
                      <span className="text-xs font-semibold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-md">{p.count}x</span>
                    )}
                    {p.mostraQtd && p.totalMl > 0 && (
                      <span className="text-xs font-semibold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-md">{p.totalMl}ml</span>
                    )}
                  </span>
                  <span className="font-semibold text-gray-800">R$ {fmt(p.total)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${p.cor} h-2 rounded-full transition-all`}
                    style={{ width: `${(p.total / maxReceita) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">Lançamentos de Vendas</h2>
          <button
            onClick={() => {
              const headers = ['Data','Paciente','Tipo','Responsável','Procedimentos','Consultas (R$)','Tratamento','Total','Pagamento']
              const rows = lancamentosMesAll.map(l => [
                new Date(l.data).toLocaleDateString('pt-BR'),
                l.paciente, l.tipo,
                l.responsavel || '',
                displayProc(l.procedimentos) || '',
                (l.valorTaxa || 0).toFixed(2),
                (l.valorTratamento || 0).toFixed(2),
                ((l.valorTaxa || 0) + (l.valorTratamento || 0)).toFixed(2),
                l.formasPgto?.join('; ') || '',
              ])
              const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
              const a = document.createElement('a')
              a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
              a.download = `faturamento_${MESES_FULL[mes]}_${ano}.csv`
              a.click()
            }}
            className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 px-3 font-semibold">Data</th>
                <th className="pb-3 px-3 font-semibold">Paciente</th>
                <th className="pb-3 px-3 font-semibold">Tipo</th>
                <th className="pb-3 px-3 font-semibold">Responsável</th>
                <th className="pb-3 px-3 font-semibold">Procedimentos</th>
                <th className="pb-3 px-3 font-semibold text-right">Consultas (R$)</th>
                <th className="pb-3 px-3 font-semibold text-right">Trat.</th>
                <th className="pb-3 px-3 font-semibold text-right">Total</th>
                <th className="pb-3 px-3 font-semibold">Pagto</th>
              </tr>
            </thead>
            <tbody>
              {lancamentosMesAll.map(l => {
                const total = (l.valorTaxa || 0) + (l.valorTratamento || 0)
                return (
                  <tr key={l.id} onClick={() => setEditando(l)}
                    className="border-b border-gray-50 hover:bg-brand-50 cursor-pointer transition-colors">
                    <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-3 font-medium text-gray-800">{l.paciente}</td>
                    <td className="py-3 px-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${l.tipo === 'Novo' ? 'bg-green-100 text-green-600' : l.tipo === 'Recorrência' ? 'bg-blue-100 text-blue-600' : l.tipo === 'Paciente Modelo' ? 'bg-purple-100 text-purple-600' : 'bg-brand-100 text-brand-600'}`}>{l.tipo}</span></td>
                    <td className="py-3 px-3 text-gray-600 text-sm">{l.responsavel || '—'}</td>
                    <td className="py-3 px-3 text-gray-500 max-w-[180px] truncate">{displayProc(l.procedimentos) || '—'}</td>
                    <td className="py-3 px-3 text-gray-600 text-right whitespace-nowrap">R$ {fmt(l.valorTaxa || 0)}</td>
                    <td className="py-3 px-3 text-gray-600 text-right whitespace-nowrap">R$ {fmt(l.valorTratamento || 0)}</td>
                    <td className="py-3 px-3 font-semibold text-gray-800 text-right whitespace-nowrap">R$ {fmt(total)}</td>
                    <td className="py-3 px-3 text-gray-500 max-w-[120px] truncate">{l.formasPgto?.join(', ') || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {lancamentosMesAll.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhum lançamento em {MESES_FULL[mes]}</p>
        )}
      </div>

      {modal && <ModalNovoLancamento onClose={() => setModal(false)} onSalvar={addLancamento} ano={ano} mes={mes} pacientes={pacientes} leads={leads} procs={procs} onProcsChange={handleProcsChange} />}
      {editando && <ModalEditarLancamento lancamento={editando} onClose={() => setEditando(null)} onAtualizar={updateLancamento} onExcluir={removeLancamento} pacientes={pacientes} leads={leads} procs={procs} onProcsChange={handleProcsChange} />}
    </div>
  )
}
