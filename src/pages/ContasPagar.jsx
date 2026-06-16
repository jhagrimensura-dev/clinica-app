import { useState } from 'react'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useContas } from '../context/ContasContext'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_CONFIG = {
  pago:     { label: 'Pago',     bg: 'bg-green-100',  text: 'text-green-700'  },
  pendente: { label: 'Pendente', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  atrasado: { label: 'Atrasado', bg: 'bg-red-100',    text: 'text-red-600'    },
}

const GRUPO_CONFIG = {
  atrasado: { titulo: 'Atrasadas', bar: 'bg-red-50 border-red-100 text-red-600' },
  pendente:  { titulo: 'Pendentes', bar: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
  pago:      { titulo: 'Pagas',    bar: 'bg-green-50 border-green-100 text-green-700' },
}

function getStatus(conta) {
  if (conta.pago) return 'pago'
  const hoje = new Date().toISOString().split('T')[0]
  return conta.vencimento < hoje ? 'atrasado' : 'pendente'
}

function ContaItem({ conta, onPagar, onRemover }) {
  const [confirmando, setConfirmando] = useState(false)
  const status = getStatus(conta)
  const s = STATUS_CONFIG[status]
  const data = new Date(conta.vencimento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group ${conta.pago ? 'opacity-60' : ''}`}>
      <button
        onClick={() => onPagar(conta)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          conta.pago ? 'bg-green-400 border-green-400 text-white' : 'border-gray-300 hover:border-brand-400'
        }`}
      >
        {conta.pago && <span className="text-[10px] font-bold">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${conta.pago ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {conta.nome}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">vence {data}</span>
          {conta.campoKey && (
            <span className="text-xs text-brand-400 font-medium">→ preenche financeiro</span>
          )}
        </div>
      </div>

      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>
        {s.label}
      </span>

      <span className="text-sm font-bold text-gray-800 flex-shrink-0 w-28 text-right">{fmt(conta.valor)}</span>

      {confirmando ? (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onRemover(conta.id)} className="text-xs text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50">Sim</button>
          <button onClick={() => setConfirmando(false)} className="text-xs text-gray-400 px-2 py-1 rounded hover:bg-gray-100">Não</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmando(true)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-all flex-shrink-0 w-4"
          title="Remover"
        >✕</button>
      )}
    </div>
  )
}

function GrupoConta({ statusKey, contas, onPagar, onRemover }) {
  const cfg = GRUPO_CONFIG[statusKey]
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`px-5 py-2.5 border-b text-xs font-bold uppercase tracking-wider ${cfg.bar}`}>
        {cfg.titulo} · {contas.length} {contas.length === 1 ? 'conta' : 'contas'}
      </div>
      <div className="divide-y divide-gray-50">
        {contas.map(c => (
          <ContaItem key={c.id} conta={c} onPagar={onPagar} onRemover={onRemover} />
        ))}
      </div>
    </div>
  )
}

function ModalNovaConta({ onClose, onSalvar, ano, mes, categorias }) {
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    vencimento: `${ano}-${String(mes + 1).padStart(2, '0')}-05`,
    categoria: 'despesas',
    campoKey: '',
    recorrente: false,
    mesesRepetir: 3,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const camposOptions = categorias[form.categoria] || []

  const handleSalvar = () => {
    if (!form.nome.trim() || !form.valor) return
    const base = {
      nome: form.nome.trim(),
      valor: parseFloat(String(form.valor).replace(',', '.')) || 0,
      categoria: form.categoria,
      campoKey: form.campoKey,
    }

    if (form.recorrente) {
      const [y, m, d] = form.vencimento.split('-').map(Number)
      const datas = Array.from({ length: form.mesesRepetir }, (_, i) => {
        const dt = new Date(y, m - 1 + i, d)
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      })
      onSalvar(base, datas)
    } else {
      onSalvar(base, [form.vencimento])
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Nova Conta a Pagar</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome da conta *</label>
            <input
              autoFocus
              type="text"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSalvar()}
              placeholder="Ex: Aluguel, Salário Bárbara..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Valor *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={e => set('valor', e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Vencimento *</label>
              <input
                type="date"
                value={form.vencimento}
                onChange={e => set('vencimento', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Categoria no Financeiro</label>
            <select
              value={form.categoria}
              onChange={e => { set('categoria', e.target.value); set('campoKey', '') }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white"
            >
              <option value="receitas">Receitas</option>
              <option value="custos">Custos</option>
              <option value="despesas">Despesas Operacionais</option>
              <option value="investimentos">Investimentos</option>
              <option value="emprestimos">Empréstimos</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Campo específico <span className="text-gray-400 font-normal">(ao pagar, preenche automaticamente no Financeiro)</span>
            </label>
            <select
              value={form.campoKey}
              onChange={e => set('campoKey', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white"
            >
              <option value="">Não vincular</option>
              {camposOptions.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => set('recorrente', !form.recorrente)}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.recorrente ? 'bg-brand-400' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.recorrente ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-600">Recorrente (repete todo mês)</span>
          </div>

          {form.recorrente && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Repetir por quantos meses?</label>
              <input
                type="number"
                min="1"
                max="24"
                value={form.mesesRepetir}
                onChange={e => set('mesesRepetir', parseInt(e.target.value) || 1)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
              <p className="text-xs text-gray-400 mt-1">Serão criadas {form.mesesRepetir} contas, uma por mês a partir de {MESES_FULL[mes]}.</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSalvar}
            disabled={!form.nome.trim() || !form.valor}
            className="flex-1 bg-brand-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {form.recorrente ? `Criar ${form.mesesRepetir} meses` : 'Adicionar conta'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContasPagar() {
  const { ano, setAno, mes, setMes, categorias, setValor, MESES } = useFinanceiro()
  const { getContasMes, addConta, addContasRecorrentes, marcarPago, removeConta } = useContas()
  const [modalAberto, setModalAberto] = useState(false)

  const contas = getContasMes(ano, mes)
  const hoje = new Date().toISOString().split('T')[0]

  const totais = {
    total:    contas.reduce((acc, c) => acc + c.valor, 0),
    pago:     contas.filter(c => c.pago).reduce((acc, c) => acc + c.valor, 0),
    pendente: contas.filter(c => !c.pago && c.vencimento >= hoje).reduce((acc, c) => acc + c.valor, 0),
    atrasado: contas.filter(c => !c.pago && c.vencimento < hoje).reduce((acc, c) => acc + c.valor, 0),
  }

  const handlePagar = (conta) => {
    const novoEstado = !conta.pago
    marcarPago(conta.id, novoEstado)
    if (novoEstado && conta.campoKey && conta.categoria) {
      setValor(conta.categoria, conta.campoKey, conta.valor)
    }
  }

  const handleSalvar = (base, datas) => {
    if (datas.length === 1) {
      addConta({ ...base, vencimento: datas[0], pago: false, pagoEm: null })
    } else {
      addContasRecorrentes(base, datas)
    }
  }

  const contasOrdenadas = [...contas].sort((a, b) => a.vencimento.localeCompare(b.vencimento))
  const atrasadas = contasOrdenadas.filter(c => getStatus(c) === 'atrasado')
  const pendentes  = contasOrdenadas.filter(c => getStatus(c) === 'pendente')
  const pagas      = contasOrdenadas.filter(c => getStatus(c) === 'pago')

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contas a Pagar</h1>
          <p className="text-sm text-gray-400 mt-1">Vencimentos, status e integração automática com o Financeiro</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setAno(a => a - 1)} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center text-sm">←</button>
            <span className="text-sm font-bold text-gray-700 w-12 text-center">{ano}</span>
            <button onClick={() => setAno(a => a + 1)} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center text-sm">→</button>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm"
          >
            + Nova Conta
          </button>
        </div>
      </div>

      {/* Seletor de mês */}
      <div className="flex gap-1 flex-wrap">
        {MESES.map((m, i) => (
          <button key={i} onClick={() => setMes(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mes === i ? 'bg-brand-400 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
          >{m}</button>
        ))}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total do Mês',  value: totais.total,    color: 'text-gray-800',   bg: 'bg-white',       icon: '📋' },
          { label: 'Pago',         value: totais.pago,     color: 'text-green-600',  bg: 'bg-green-50',    icon: '✅' },
          { label: 'Pendente',     value: totais.pendente, color: 'text-yellow-600', bg: 'bg-yellow-50',   icon: '⏳' },
          { label: 'Atrasado',     value: totais.atrasado, color: 'text-red-500',    bg: 'bg-red-50',      icon: '⚠️' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} rounded-2xl p-4 border border-gray-100`}>
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <span className="text-base">{c.icon}</span>
            </div>
            <p className={`text-xl font-bold ${c.color}`}>{fmt(c.value)}</p>
            {c.label === 'Total do Mês' && contas.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{contas.length} {contas.length === 1 ? 'conta' : 'contas'}</p>
            )}
          </div>
        ))}
      </div>

      {/* Barra de progresso pago/total */}
      {totais.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span className="font-semibold">Progresso de pagamento — {MESES_FULL[mes]}</span>
            <span>{Math.round((totais.pago / totais.total) * 100)}% pago</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totais.pago / totais.total) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-green-600 font-medium">{fmt(totais.pago)} pago</span>
            <span className="text-gray-400">{fmt(totais.total - totais.pago)} restante</span>
          </div>
        </div>
      )}

      {/* Lista de contas */}
      {contas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-gray-500 font-semibold">Nenhuma conta em {MESES_FULL[mes]}</p>
          <p className="text-gray-400 text-sm mt-1">Adicione contas fixas ou avulsas para controlar os pagamentos.</p>
          <button
            onClick={() => setModalAberto(true)}
            className="mt-5 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
          >
            + Adicionar primeira conta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {atrasadas.length > 0 && <GrupoConta statusKey="atrasado" contas={atrasadas} onPagar={handlePagar} onRemover={removeConta} />}
          {pendentes.length  > 0 && <GrupoConta statusKey="pendente" contas={pendentes}  onPagar={handlePagar} onRemover={removeConta} />}
          {pagas.length      > 0 && <GrupoConta statusKey="pago"     contas={pagas}      onPagar={handlePagar} onRemover={removeConta} />}
        </div>
      )}

      {modalAberto && (
        <ModalNovaConta
          onClose={() => setModalAberto(false)}
          onSalvar={handleSalvar}
          ano={ano}
          mes={mes}
          categorias={categorias}
        />
      )}
    </div>
  )
}
