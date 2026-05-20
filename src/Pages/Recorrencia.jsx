export default function Recorrencia() {
  const pacientes = [
    { nome: 'Maria Silva', ultimo: '05/05', proximo: '02/06', status: 'Agendado', cor: 'bg-green-100 text-green-700' },
    { nome: 'João Pedro', ultimo: '10/05', proximo: '07/06', status: 'Agendado', cor: 'bg-green-100 text-green-700' },
    { nome: 'Ana Lima', ultimo: '01/04', proximo: '-', status: 'Em atraso', cor: 'bg-red-100 text-red-700' },
    { nome: 'Carlos Melo', ultimo: '15/05', proximo: '12/06', status: 'Agendado', cor: 'bg-green-100 text-green-700' },
    { nome: 'Paula Ramos', ultimo: '20/03', proximo: '-', status: 'Em atraso', cor: 'bg-red-100 text-red-700' },
    { nome: 'Lucas Torres', ultimo: '18/05', proximo: '15/06', status: 'Agendado', cor: 'bg-green-100 text-green-700' },
    { nome: 'Fernanda K.', ultimo: '02/05', proximo: '-', status: 'Pendente', cor: 'bg-yellow-100 text-yellow-700' },
    { nome: 'Bruno Alves', ultimo: '22/05', proximo: '19/06', status: 'Agendado', cor: 'bg-green-100 text-green-700' },
    { nome: 'Camila Faria', ultimo: '08/04', proximo: '-', status: 'Em atraso', cor: 'bg-red-100 text-red-700' },
    { nome: 'Rafael Nunes', ultimo: '25/05', proximo: '22/06', status: 'Agendado', cor: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recorrência</h1>
          <p className="text-sm text-gray-400 mt-1">Acompanhe retornos e fidelização de pacientes</p>
        </div>
        <button className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          + Novo Contato
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Pacientes Ativos</p>
          <p className="text-2xl font-bold text-gray-900">87</p>
          <p className="text-xs text-gray-400 mt-1">Em acompanhamento</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Retornos no Mês</p>
          <p className="text-2xl font-bold text-gray-900">34</p>
          <p className="text-xs text-gray-400 mt-1">39,1% dos ativos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Em Atraso</p>
          <p className="text-2xl font-bold text-red-500">12</p>
          <p className="text-xs text-gray-400 mt-1">Precisam de contato</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Taxa de Retorno</p>
          <p className="text-2xl font-bold text-pink-500">72,4%</p>
          <p className="text-xs text-gray-400 mt-1">Meta: 80%</p>
        </div>
      </div>

      {/* Barra de progresso meta */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-bold text-gray-800">Meta de Retorno</h2>
          <span className="text-sm font-semibold text-pink-500">72,4% / 80%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4">
          <div className="bg-pink-400 h-4 rounded-full" style={{ width: '72.4%' }}></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Faltam 7,6% para atingir a meta do mês</p>
      </div>

      {/* Tabela de pacientes */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4">Acompanhamento de Pacientes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-semibold">Paciente</th>
              <th className="pb-3 font-semibold">Última Consulta</th>
              <th className="pb-3 font-semibold">Próximo Retorno</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 font-medium text-gray-800">{p.nome}</td>
                <td className="py-3 text-gray-500">{p.ultimo}</td>
                <td className="py-3 text-gray-500">{p.proximo}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.cor}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
