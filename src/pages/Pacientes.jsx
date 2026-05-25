import { useState } from 'react'

const pacientes = [
  { nome: 'Maria Silva', telefone: '(11) 99999-1111', ultimo: '05/05/2025', procedimento: 'Botox', status: 'Ativo', cor: 'bg-green-100 text-green-700' },
  { nome: 'João Pedro', telefone: '(11) 99999-2222', ultimo: '10/05/2025', procedimento: 'Preenchimento', status: 'Ativo', cor: 'bg-green-100 text-green-700' },
  { nome: 'Ana Lima', telefone: '(11) 99999-3333', ultimo: '01/04/2025', procedimento: 'Skinbooster', status: 'Inativo', cor: 'bg-red-100 text-red-700' },
  { nome: 'Carlos Melo', telefone: '(11) 99999-4444', ultimo: '15/05/2025', procedimento: 'Botox', status: 'Ativo', cor: 'bg-green-100 text-green-700' },
  { nome: 'Paula Ramos', telefone: '(11) 99999-5555', ultimo: '20/03/2025', procedimento: 'Fio de PDO', status: 'Inativo', cor: 'bg-red-100 text-red-700' },
  { nome: 'Lucas Torres', telefone: '(11) 99999-6666', ultimo: '18/05/2025', procedimento: 'Preenchimento', status: 'Ativo', cor: 'bg-green-100 text-green-700' },
  { nome: 'Fernanda K.', telefone: '(11) 99999-7777', ultimo: '02/05/2025', procedimento: 'Botox', status: 'Pendente', cor: 'bg-yellow-100 text-yellow-700' },
  { nome: 'Bruno Alves', telefone: '(11) 99999-8888', ultimo: '22/05/2025', procedimento: 'Skinbooster', status: 'Ativo', cor: 'bg-green-100 text-green-700' },
  { nome: 'Camila Faria', telefone: '(11) 99999-9999', ultimo: '08/04/2025', procedimento: 'Preenchimento', status: 'Inativo', cor: 'bg-red-100 text-red-700' },
  { nome: 'Rafael Nunes', telefone: '(11) 99999-0000', ultimo: '25/05/2025', procedimento: 'Fio de PDO', status: 'Ativo', cor: 'bg-green-100 text-green-700' },
  { nome: 'Juliana Costa', telefone: '(11) 98888-1111', ultimo: '28/05/2025', procedimento: 'Botox', status: 'Ativo', cor: 'bg-green-100 text-green-700' },
  { nome: 'Marcos Lima', telefone: '(11) 98888-2222', ultimo: '12/04/2025', procedimento: 'Skinbooster', status: 'Pendente', cor: 'bg-yellow-100 text-yellow-700' },
]

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
          <p className="text-2xl font-bold text-gray-900">124</p>
          <p className="text-xs text-gray-400 mt-1">Base total</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Ativos</p>
          <p className="text-2xl font-bold text-green-500">87</p>
          <p className="text-xs text-gray-400 mt-1">70,2% da base</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Inativos</p>
          <p className="text-2xl font-bold text-red-500">25</p>
          <p className="text-xs text-gray-400 mt-1">Precisam de reativação</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Novos no Mês</p>
          <p className="text-2xl font-bold text-pink-500">23</p>
          <p className="text-xs text-gray-400 mt-1">Fechamentos do mês</p>
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
