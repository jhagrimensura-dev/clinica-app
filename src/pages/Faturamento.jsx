import { useState } from 'react'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useVendas } from '../context/VendasContext'
import { usePacientes } from '../context/PacientesContext'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const FORMAS_PGTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência', 'Boleto']

function mascaraMoeda(valor) {
  const nums = valor.replace(/\D/g, '')
  if (!nums) return ''
  const num = parseInt(nums, 10) / 100
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMoeda(valor) {
  return parseFloat(valor.replace(/\D/g, '')) / 100 || 0
}

function ModalNovoLancamento({ onClose, onSalvar, ano, mes, pacientes }) {
  const hoje = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const [data, setData] = useState(hoje)
  const [paciente, setPaciente] = useState('')
  const [tipo, setTipo] = useState('Novo')
  const [responsavel, setResponsavel] = useState('')
  const [procedimentos, setProcedimentos] = useState('')
  const [valorTaxa, setValorTaxa] = useState('')
  const [valorTratamento, setValorTratamento] = useState('')

  const handleValorTaxa = (e) => setValorTaxa(mascaraMoeda(e.target.value))
  const handleValorTratamento = (e) => setValorTratamento(mascaraMoeda(e.target.value))
  const [formasPgto, setFormasPgto] = useState([])
  const [agendado, setAgendado] = useState(false)
  const [obs, setObs] = useState('')

  const toggleForma = (forma) => {
    setFormasPgto(prev => prev.includes(forma) ? prev.filter(f => f !== forma) : [...prev, forma])
  }

  const handleCriar = () => {
    if (!paciente) return
    onSalvar({ data, paciente, tipo, responsavel, procedimentos, valorTaxa: parseMoeda(valorTaxa), valorTratamento: parseMoeda(valorTratamento), formasPgto, agendado, obs })
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
          {/* Data + Paciente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome do Paciente</label>
              <select value={paciente} onChange={e => setPaciente(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 bg-white">
                <option value="">Selecione um paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Tipo + Responsável */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 bg-white">
                <option value="Novo">Novo</option>
                <option value="Recorrente">Recorrente</option>
                <option value="Indicação">Indicação</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
              <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 bg-white">
                <option value="">Selecione o responsável</option>
                <option value="Dra. Amanda">Dra. Amanda</option>
                <option value="Recepção">Recepção</option>
                <option value="Equipe">Equipe</option>
              </select>
            </div>
          </div>

          {/* Procedimentos */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Procedimentos</label>
            <input type="text" value={procedimentos} onChange={e => setProcedimentos(e.target.value)}
              placeholder="Digite ou selecione os procedimentos"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
          </div>

          {/* Valor Taxa + Valor Tratamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor Taxa (R$)</label>
              <input type="text" inputMode="numeric" value={valorTaxa} onChange={handleValorTaxa}
                placeholder="R$ 0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor Tratamento (R$)</label>
              <input type="text" inputMode="numeric" value={valorTratamento} onChange={handleValorTratamento}
                placeholder="R$ 0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
            </div>
          </div>

          {/* Agendado */}
          <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="checkbox" checked={agendado} onChange={e => setAgendado(e.target.checked)}
              className="accent-pink-400 w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Paciente veio por agendamento</span>
          </label>

          {/* Formas de Pagamento */}
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

          {/* Observações */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Observações adicionais (opcional)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 resize-none" />
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

function ModalEditarLancamento({ lancamento, onClose, onAtualizar, onExcluir, pacientes }) {
  const [data, setData] = useState(lancamento.data)
  const [paciente, setPaciente] = useState(lancamento.paciente)
  const [tipo, setTipo] = useState(lancamento.tipo)
  const [responsavel, setResponsavel] = useState(lancamento.responsavel || '')
  const [procedimentos, setProcedimentos] = useState(lancamento.procedimentos || '')
  const [valorTaxa, setValorTaxa] = useState(lancamento.valorTaxa ? mascaraMoeda(String(Math.round(lancamento.valorTaxa * 100))) : '')
  const [valorTratamento, setValorTratamento] = useState(lancamento.valorTratamento ? mascaraMoeda(String(Math.round(lancamento.valorTratamento * 100))) : '')
  const [formasPgto, setFormasPgto] = useState(lancamento.formasPgto || [])
  const [agendado, setAgendado] = useState(lancamento.agendado || false)
  const [obs, setObs] = useState(lancamento.obs || '')
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)

  const toggleForma = (forma) =>
    setFormasPgto(prev => prev.includes(forma) ? prev.filter(f => f !== forma) : [...prev, forma])

  const handleAtualizar = () => {
    if (!paciente) return
    onAtualizar(lancamento.id, { data, paciente, tipo, responsavel, procedimentos, valorTaxa: parseMoeda(valorTaxa), valorTratamento: parseMoeda(valorTratamento), formasPgto, agendado, obs })
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
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome do Paciente</label>
              <select value={paciente} onChange={e => setPaciente(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 bg-white">
                <option value="">Selecione um paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 bg-white">
                <option value="Novo">Novo</option>
                <option value="Recorrente">Recorrente</option>
                <option value="Indicação">Indicação</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Responsável</label>
              <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 bg-white">
                <option value="">Selecione o responsável</option>
                <option value="Dra. Amanda">Dra. Amanda</option>
                <option value="Recepção">Recepção</option>
                <option value="Equipe">Equipe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Procedimentos</label>
            <input type="text" value={procedimentos} onChange={e => setProcedimentos(e.target.value)}
              placeholder="Digite ou selecione os procedimentos"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor Taxa (R$)</label>
              <input type="text" inputMode="numeric" value={valorTaxa} onChange={e => setValorTaxa(mascaraMoeda(e.target.value))}
                placeholder="R$ 0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor Tratamento (R$)</label>
              <input type="text" inputMode="numeric" value={valorTratamento} onChange={e => setValorTratamento(mascaraMoeda(e.target.value))}
                placeholder="R$ 0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" />
            </div>
          </div>

          <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="checkbox" checked={agendado} onChange={e => setAgendado(e.target.checked)}
              className="accent-pink-400 w-4 h-4" />
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400 resize-none" />
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
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)

  const navMes = (delta) => {
    const novo = mes + delta
    if (novo < 0) { setMes(11); setAno(a => a - 1) }
    else if (novo > 11) { setMes(0); setAno(a => a + 1) }
    else setMes(novo)
  }

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const lancamentosMes = lancamentos.filter(l => l.data.startsWith(prefix))

  const totalTratamentos = lancamentosMes.reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalTaxas = lancamentosMes.reduce((acc, l) => acc + (l.valorTaxa || 0), 0)
  const totalGeral = totalTratamentos + totalTaxas
  const ticketMedio = lancamentosMes.length > 0 ? totalGeral / lancamentosMes.length : 0

  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  const servicos = [
    { nome: 'Botox', valor: 0, cor: 'bg-pink-400' },
    { nome: 'Preenchimento', valor: 0, cor: 'bg-purple-400' },
    { nome: 'Skinbooster', valor: 0, cor: 'bg-blue-400' },
    { nome: 'Fio de PDO', valor: 0, cor: 'bg-cyan-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Faturamento</h1>
          <p className="text-sm text-gray-400 mt-1">Controle de agendamentos e procedimentos realizados</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
            <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-600 px-1">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-24 text-center">{MESES_FULL[mes].slice(0,3)} {ano}</span>
            <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-600 px-1">›</button>
          </div>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            + Novo Lançamento
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Faturamento Total</p>
          <p className="text-2xl font-bold text-gray-900">R$ {fmt(totalGeral)}</p>
          <p className="text-xs text-gray-400 mt-1">{lancamentosMes.length} lançamentos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Tratamentos</p>
          <p className="text-2xl font-bold text-green-500">R$ {fmt(totalTratamentos)}</p>
          <p className="text-xs text-gray-400 mt-1">Valor dos procedimentos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Taxas</p>
          <p className="text-2xl font-bold text-yellow-500">R$ {fmt(totalTaxas)}</p>
          <p className="text-xs text-gray-400 mt-1">Total de taxas</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-pink-500">R$ {fmt(ticketMedio)}</p>
          <p className="text-xs text-gray-400 mt-1">Por lançamento</p>
        </div>
      </div>

      {/* Meta + Serviços */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">Meta do Mês</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">R$ {fmt(totalGeral)} de R$ 0</span>
            <span className="font-semibold text-pink-500">0%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
            <div className="bg-pink-400 h-4 rounded-full" style={{ width: '0%' }}></div>
          </div>
          <p className="text-xs text-gray-400">{lancamentosMes.length === 0 ? 'Nenhuma transação registrada' : `${lancamentosMes.length} lançamento(s) no mês`}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">Receita por Serviço</h2>
          <div className="space-y-3">
            {servicos.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{s.nome}</span>
                  <span className="font-semibold text-gray-800">R$ {s.valor.toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${s.cor} h-2 rounded-full`} style={{ width: '0%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">Lançamentos de Faturamento</h2>
          <button
            onClick={() => {
              const headers = ['Data','Paciente','Tipo','Responsável','Procedimentos','Taxa','Tratamento','Total','Pagamento']
              const rows = lancamentosMes.map(l => [
                new Date(l.data).toLocaleDateString('pt-BR'),
                l.paciente, l.tipo,
                l.responsavel || '',
                l.procedimentos || '',
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
                <th className="pb-3 font-semibold">Data</th>
                <th className="pb-3 font-semibold">Paciente</th>
                <th className="pb-3 font-semibold">Tipo</th>
                <th className="pb-3 font-semibold">Responsável</th>
                <th className="pb-3 font-semibold">Procedimentos</th>
                <th className="pb-3 font-semibold text-right">Taxa</th>
                <th className="pb-3 font-semibold text-right">Trat.</th>
                <th className="pb-3 font-semibold text-right">Total</th>
                <th className="pb-3 font-semibold">Pagto</th>
              </tr>
            </thead>
            <tbody>
              {lancamentosMes.map(l => {
                const total = (l.valorTaxa || 0) + (l.valorTratamento || 0)
                return (
                  <tr key={l.id} onClick={() => setEditando(l)}
                    className="border-b border-gray-50 hover:bg-pink-50 cursor-pointer transition-colors">
                    <td className="py-3 text-gray-500 whitespace-nowrap">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 font-medium text-gray-800">{l.paciente}</td>
                    <td className="py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-600">{l.tipo}</span></td>
                    <td className="py-3 text-gray-600 text-sm">{l.responsavel || '—'}</td>
                    <td className="py-3 text-gray-500 max-w-[180px] truncate">{l.procedimentos || '—'}</td>
                    <td className="py-3 text-gray-600 text-right whitespace-nowrap">R$ {fmt(l.valorTaxa || 0)}</td>
                    <td className="py-3 text-gray-600 text-right whitespace-nowrap">R$ {fmt(l.valorTratamento || 0)}</td>
                    <td className="py-3 font-semibold text-gray-800 text-right whitespace-nowrap">R$ {fmt(total)}</td>
                    <td className="py-3 text-gray-500 max-w-[120px] truncate">{l.formasPgto?.join(', ') || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {lancamentosMes.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhum lançamento em {MESES_FULL[mes]}</p>
        )}
      </div>

      {modal && <ModalNovoLancamento onClose={() => setModal(false)} onSalvar={addLancamento} ano={ano} mes={mes} pacientes={pacientes} />}
      {editando && <ModalEditarLancamento lancamento={editando} onClose={() => setEditando(null)} onAtualizar={updateLancamento} onExcluir={removeLancamento} pacientes={pacientes} />}
    </div>
  )
}
