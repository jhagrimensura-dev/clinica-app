import { useState } from 'react'
import { usePacientes } from '../context/PacientesContext'

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
  const { pacientes, addPaciente } = usePacientes()
  const [modal, setModal] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todos')

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
          <p className="text-sm text-gray-400 mt-1">Gerencie sua base de pacientes</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
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
          <p className="text-2xl font-bold text-pink-500">{novosMes}</p>
          <p className="text-xs text-gray-400 mt-1">Cadastros do mês</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-pink-400 transition-colors"
        />
        <div className="flex gap-2">
          {['Todos', 'Ativo', 'Inativo', 'Pendente'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${filtro === f ? 'bg-pink-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
          <p className="text-3xl font-bold text-gray-900 mt-1">R$ 0</p>
          <p className="text-xs text-gray-400 mt-1">{total > 0 ? `${total} pacientes` : '—'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-semibold">Paciente</th>
              <th className="pb-3 font-semibold">WhatsApp</th>
              <th className="pb-3 font-semibold">Sexo</th>
              <th className="pb-3 font-semibold">Nascimento</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="py-3 font-medium text-gray-800">{p.nome}</td>
                <td className="py-3 text-gray-500">{p.whatsapp || '—'}</td>
                <td className="py-3 text-gray-500">{p.sexo || '—'}</td>
                <td className="py-3 text-gray-500">{p.nascimento ? new Date(p.nascimento).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusCor(p.status)}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhum paciente encontrado</p>
        )}
      </div>

      {modal && <ModalNovoPaciente onClose={() => setModal(false)} onSalvar={addPaciente} />}
    </div>
  )
}
