import { useState } from 'react'

const pacientes = []

export default function Pacientes() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todos')

  const filtrados = pacientes.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'Todos' || p.status === filtro
    return matchBusca && matchFiltro
  })

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie sua base de pacientes</p>
        </div>
        <button className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          + Novo Paciente
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Total de Pacientes</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-400 mt-1">Base total</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Ativos</p>
          <p className="text-2xl font-bold text-green-500">0</p>
          <p className="text-xs text-gray-400 mt-1">—</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Inativos</p>
          <p className="text-2xl font-bold text-red-500">0</p>
          <p className="text-xs text-gray-400 mt-1">—</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Novos no Mês</p>
          <p className="text-2xl font-bold text-pink-500">0</p>
          <p className="text-xs text-gray-400 mt-1">—</p>
        </div>
      </div>

      {/* Busca e filtros */}
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

      {/* Tabela */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-semibold">Paciente</th>
              <th className="pb-3 font-semibold">Telefone</th>
              <th className="pb-3 font-semibold">Última Consulta</th>
              <th className="pb-3 font-semibold">Procedimento</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="py-3 font-medium text-gray-800">{p.nome}</td>
                <td className="py-3 text-gray-500">{p.telefone}</td>
                <td className="py-3 text-gray-500">{p.ultimo}</td>
                <td className="py-3 text-gray-500">{p.procedimento}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.cor}`}>
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
    </div>
  )
}
