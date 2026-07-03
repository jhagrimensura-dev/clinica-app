import { useState, useRef, useEffect } from 'react'
import { usePacientes } from '../context/PacientesContext'
import { useVendas } from '../context/VendasContext'

const FORMAS_PGT = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência', 'Boleto']
const TIPOS_LANC = ['Consulta', 'Recorrência', 'Pacote', 'Avaliação', 'Retorno', 'Procedimento']

function ModalPerfilPaciente({ paciente, onClose, onSalvar, onExcluir, lancamentosPaciente, onAddLancamento }) {
  const [aba, setAba] = useState('perfil')

  // Dados do paciente
  const [nome, setNome] = useState(paciente.nome)
  const [whatsapp, setWhatsapp] = useState(paciente.whatsapp || '')
  const [nascimento, setNascimento] = useState(paciente.nascimento || '')
  const [sexo, setSexo] = useState(paciente.sexo || '')
  const [status, setStatus] = useState(paciente.status || 'Ativo')
  const [anotacoes, setAnotacoes] = useState(paciente.anotacoes || '')
  const [confirmando, setConfirmando] = useState(false)

  // Campos do lançamento
  const hoje = new Date().toISOString().split('T')[0]
  const [lData, setLData] = useState(hoje)
  const [lTipo, setLTipo] = useState('Consulta')
  const [lResp, setLResp] = useState('')
  const [lProc, setLProc] = useState('')
  const [lTaxa, setLTaxa] = useState('')
  const [lValor, setLValor] = useState('')
  const [lFormas, setLFormas] = useState([])
  const [lParcelas, setLParcelas] = useState({})
  const [lObs, setLObs] = useState('')

  function toggleForma(f) {
    setLFormas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  function salvarLancamento() {
    onAddLancamento({
      paciente: nome,
      data: lData,
      tipo: lTipo,
      responsavel: lResp,
      procedimentos: lProc,
      valorTaxa: parseFloat(String(lTaxa).replace(',', '.')) || 0,
      valorTratamento: parseFloat(String(lValor).replace(',', '.')) || 0,
      formasPgto: lFormas,
      obs: lObs,
      mes: parseInt(lData.split('-')[1]) - 1,
      ano: parseInt(lData.split('-')[0]),
    })
    setLData(hoje); setLTipo('Consulta'); setLResp(''); setLProc('')
    setLTaxa(''); setLValor(''); setLFormas([]); setLParcelas({}); setLObs('')
    setAba('historico')
  }

  const fmt = v => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '—'

  const corStatus = status === 'Ativo' ? 'bg-green-100 text-green-700' : status === 'Inativo' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-700'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg flex-shrink-0">
              {(nome || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 leading-tight">{nome}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${corStatus}`}>{status}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {[['perfil','👤 Dados'], ['lancamento','➕ Lançamento'], ['historico','📋 Histórico']].map(([k, label]) => (
            <button key={k} onClick={() => setAba(k)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${aba === k ? 'border-b-2 border-brand-400 text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">

          {aba === 'perfil' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome *</label>
                  <input value={nome} onChange={e => setNome(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">WhatsApp</label>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Nascimento</label>
                  <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Sexo</label>
                  <select value={sexo} onChange={e => setSexo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 bg-white">
                    <option value="">Selecione</option>
                    <option>Feminino</option>
                    <option>Masculino</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 bg-white">
                    <option>Ativo</option>
                    <option>Inativo</option>
                    <option>Pendente</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Anotações</label>
                  <textarea value={anotacoes} onChange={e => setAnotacoes(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                {confirmando ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-500">Excluir paciente?</span>
                    <button onClick={() => { onExcluir(paciente.id); onClose() }} className="text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50">Sim</button>
                    <button onClick={() => setConfirmando(false)} className="text-sm text-gray-400 px-3 py-1 rounded-lg hover:bg-gray-50">Não</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmando(true)} className="text-sm text-red-400 hover:text-red-600 font-semibold">Excluir</button>
                )}
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                  <button onClick={() => { onSalvar(paciente.id, { nome, whatsapp, nascimento, sexo, status, anotacoes }); onClose() }}
                    disabled={!nome.trim()}
                    className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Salvar</button>
                </div>
              </div>
            </div>
          )}

          {aba === 'lancamento' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Data</label>
                  <input type="date" value={lData} onChange={e => setLData(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo</label>
                  <select value={lTipo} onChange={e => setLTipo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 bg-white">
                    {TIPOS_LANC.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Responsável</label>
                <select value={lResp} onChange={e => setLResp(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 bg-white">
                  <option value="">Selecione</option>
                  <option>Dra. Amanda</option>
                  <option>Fernanda</option>
                  <option>Adriele</option>
                  <option>Recepção</option>
                  <option>Equipe</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Procedimentos</label>
                <input value={lProc} onChange={e => setLProc(e.target.value)} placeholder="Ex: Botox, Preenchimento..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Valor Taxa (R$)</label>
                  <input type="number" value={lTaxa} onChange={e => setLTaxa(e.target.value)} placeholder="0,00" min="0" step="0.01"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Valor Tratamento (R$)</label>
                  <input type="number" value={lValor} onChange={e => setLValor(e.target.value)} placeholder="0,00" min="0" step="0.01"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Formas de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAS_PGT.map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={lFormas.includes(f)} onChange={() => toggleForma(f)} className="accent-brand-400 w-4 h-4" />
                      <span className="text-sm text-gray-700">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
              {lFormas.includes('Cartão de Crédito') && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Parcelas — Cartão de Crédito</label>
                  <select value={lParcelas['Cartão de Crédito'] || '1x'} onChange={e => setLParcelas(p => ({ ...p, 'Cartão de Crédito': e.target.value }))}
                    className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-300 bg-white">
                    {['1x','2x','3x','4x','5x','6x','7x','8x','9x','10x','11x','12x'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Observações</label>
                <textarea value={lObs} onChange={e => setLObs(e.target.value)} rows={2} placeholder="Observações adicionais"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button onClick={salvarLancamento} disabled={!lProc.trim() && !lValor}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Registrar</button>
              </div>
            </div>
          )}

          {aba === 'historico' && (
            <div className="p-6">
              {lancamentosPaciente.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm text-gray-400">Nenhum lançamento registrado</p>
                  <button onClick={() => setAba('lancamento')} className="mt-3 text-sm text-brand-500 hover:text-brand-700 font-semibold">+ Registrar primeiro lançamento</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...lancamentosPaciente].sort((a, b) => b.data?.localeCompare(a.data)).map(l => (
                    <div key={l.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{l.procedimentos || l.tipo || '—'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {l.data ? new Date(l.data + 'T12:00').toLocaleDateString('pt-BR') : '—'}
                            {l.responsavel ? ` · ${l.responsavel}` : ''}
                          </p>
                          {l.formasPgto?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">{l.formasPgto.join(', ')}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800">{fmt(l.valorTratamento)}</p>
                          {l.valorTaxa > 0 && <p className="text-xs text-gray-400">Taxa: {fmt(l.valorTaxa)}</p>}
                          {l.tipo && <span className="text-[10px] bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">{l.tipo}</span>}
                        </div>
                      </div>
                      {l.obs && <p className="text-xs text-gray-400 italic mt-2 border-t border-gray-50 pt-2">{l.obs}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModalNovoPaciente({ onClose, onSalvar }) {
  const [nome, setNome] = useState('')
  const [sexo, setSexo] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [anotacoes, setAnotacoes] = useState('')

  const handleSalvar = () => {
    if (!nome.trim()) return
    onSalvar({ nome: nome.trim(), sexo, whatsapp: whatsapp.trim(), nascimento, anotacoes: anotacoes.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Novo Paciente</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {/* Avatar placeholder */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome do paciente"
              className="w-full border border-amber-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Sexo <span className="text-red-400">*</span></label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="sexo" value="Feminino" checked={sexo === 'Feminino'} onChange={e => setSexo(e.target.value)} className="accent-amber-500" />
                <span className="text-sm text-gray-700">Feminino</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="sexo" value="Masculino" checked={sexo === 'Masculino'} onChange={e => setSexo(e.target.value)} className="accent-amber-500" />
                <span className="text-sm text-gray-700">Masculino</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data de Nascimento</label>
            <input
              type="date"
              value={nascimento}
              onChange={e => setNascimento(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Anotações</label>
            <textarea
              value={anotacoes}
              onChange={e => setAnotacoes(e.target.value)}
              placeholder="Anotações sobre o paciente"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={!nome.trim()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Pacientes() {
  const { pacientes, addPaciente, updatePaciente, removePaciente } = usePacientes()
  const { lancamentos, addLancamento } = useVendas()

  // LTV por paciente: soma de todos os lançamentos de cada paciente (histórico completo)
  const ltvPorPaciente = {}
  lancamentos.forEach(l => {
    if (l.paciente) {
      ltvPorPaciente[l.paciente] = (ltvPorPaciente[l.paciente] || 0) + (l.valorTratamento || 0) + (l.valorTaxa || 0)
    }
  })
  const getLTV = (nome) => ltvPorPaciente[nome] || 0
  const ltvValues = Object.values(ltvPorPaciente)
  const ltvMedio = ltvValues.length > 0 ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length : 0
  const fmtLTV = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const [modal, setModal] = useState(false)
  const [modalPerfil, setModalPerfil] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todos')
  const [sugestoes, setSugestoes] = useState([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const buscaRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (!buscaRef.current?.contains(e.target)) setMostrarSugestoes(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleBusca = (valor) => {
    setBusca(valor)
    if (valor.trim().length > 0) {
      const matches = pacientes.filter(p => p.nome.toLowerCase().includes(valor.toLowerCase())).slice(0, 6)
      setSugestoes(matches)
      setMostrarSugestoes(matches.length > 0)
    } else {
      setSugestoes([])
      setMostrarSugestoes(false)
    }
  }

  const selecionarSugestao = (nome) => {
    setBusca(nome)
    setMostrarSugestoes(false)
  }

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  const total = pacientes.length
  const ativos = pacientes.filter(p => p.status === 'Ativo').length
  const inativos = pacientes.filter(p => p.status === 'Inativo').length
  const novosMes = pacientes.filter(p => {
    const d = new Date(p.criadoEm)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
  }).length

  const filtrados = pacientes.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'Todos' || p.status === filtro
    return matchBusca && matchFiltro
  })

  const statusCor = (s) => {
    if (s === 'Ativo') return 'bg-green-100 text-green-700'
    if (s === 'Inativo') return 'bg-red-100 text-red-500'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
        </div>
        <button onClick={() => setModal(true)} className="bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          + Novo Paciente
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Total de Pacientes</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-400 mt-1">Base total</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Ativos</p>
          <p className="text-2xl font-bold text-green-500">{ativos}</p>
          <p className="text-xs text-gray-400 mt-1">{total > 0 ? `${((ativos/total)*100).toFixed(1)}% da base` : '—'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Inativos</p>
          <p className="text-2xl font-bold text-red-500">{inativos}</p>
          <p className="text-xs text-gray-400 mt-1">{inativos > 0 ? 'Precisam de reativação' : '—'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Novos no Mês</p>
          <p className="text-2xl font-bold text-brand-500">{novosMes}</p>
          <p className="text-xs text-gray-400 mt-1">Cadastros do mês</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="flex-1 relative" ref={buscaRef}>
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={busca}
            onChange={e => handleBusca(e.target.value)}
            onFocus={() => busca.trim() && sugestoes.length > 0 && setMostrarSugestoes(true)}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-brand-400 transition-colors"
          />
          {mostrarSugestoes && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {sugestoes.map(p => (
                <button
                  key={p.id}
                  onMouseDown={() => selecionarSugestao(p.nome)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 flex items-center gap-3 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-xs flex-shrink-0">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <span>{p.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {['Todos', 'Ativo', 'Inativo', 'Pendente'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${filtro === f ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Total de Pacientes</p>
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
          <p className="text-xs text-gray-400 mt-1">{total > 0 ? `${total} cadastrados` : 'Nenhum paciente ainda'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-500">LTV Médio</p>
              <div className="relative group">
                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center cursor-help leading-none">?</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-800 text-white text-xs rounded-xl p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <p className="font-semibold mb-1">LTV — Lifetime Value</p>
                  <p className="text-gray-300 leading-relaxed">Valor total que um paciente gera para a clínica ao longo do tempo. Quanto maior o LTV, mais fidelizado é o paciente.</p>
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-1">{fmtLTV(ltvMedio)}</p>
          <p className="text-xs text-gray-400 mt-1">{ltvValues.length > 0 ? `${ltvValues.length} paciente(s) com histórico` : 'Sem lançamentos ainda'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4">Lista de Pacientes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-semibold">Nome</th>
              <th className="pb-3 font-semibold">WhatsApp</th>
              <th className="pb-3 font-semibold">Nascimento</th>
              <th className="pb-3 font-semibold">LTV</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setModalPerfil(p)}>
                <td className="py-3 font-medium text-gray-800 hover:text-brand-600 transition-colors">{p.nome}</td>
                <td className="py-3 text-gray-500">{p.whatsapp || '—'}</td>
                <td className="py-3 text-gray-500">{p.nascimento ? new Date(p.nascimento).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="py-3 text-gray-500">{getLTV(p.nome) > 0 ? fmtLTV(getLTV(p.nome)) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhum paciente encontrado</p>
        )}
      </div>

      {modal && <ModalNovoPaciente onClose={() => setModal(false)} onSalvar={addPaciente} />}
      {modalPerfil && (
        <ModalPerfilPaciente
          paciente={modalPerfil}
          onClose={() => setModalPerfil(null)}
          onSalvar={updatePaciente}
          onExcluir={removePaciente}
          lancamentosPaciente={lancamentos.filter(l => l.paciente === modalPerfil.nome)}
          onAddLancamento={addLancamento}
        />
      )}
    </div>
  )
}
