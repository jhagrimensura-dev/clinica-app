import { useState } from 'react'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'metas', label: 'Metas', icon: '🎯' },
  { id: 'social', label: 'Social Media', icon: '📱' },
  {
    id: 'comercial', label: 'WhatsApp', icon: '💬',
    sub: [
      { id: 'leads_novos', label: 'Leads Novos', icon: '🆕' },
      { id: 'leads_recorrentes', label: 'Leads Recorrentes', icon: '🔄' },
      { id: 'indicacao', label: 'Indicação', icon: '🤝' },
      { id: 'whatsapp_canal', label: 'WhatsApp', icon: '📲' },
    ],
  },
  { id: 'faturamento', label: 'Vendas', icon: '📋' },
  {
    id: 'financeiro', label: 'Financeiro', icon: '💹',
    sub: [
      { id: 'contas', label: 'Contas a Pagar', icon: '📌' },
    ],
  },
  { id: 'pacientes', label: 'Pacientes', icon: '👤' },
  { id: 'relatorios', label: 'Relatórios', icon: '📄' },
]

export default function Sidebar({ active, setActive }) {
  const [financeiroAberto, setFinanceiroAberto] = useState(
    active === 'financeiro' || active === 'contas'
  )
  const [whatsappAberto, setWhatsappAberto] = useState(
    ['comercial','leads_novos','leads_recorrentes','indicacao','whatsapp_canal'].includes(active)
  )

  const subStates = {
    financeiro: [financeiroAberto, setFinanceiroAberto],
    comercial: [whatsappAberto, setWhatsappAberto],
  }

  const handleClick = (item) => {
    if (item.sub) {
      const [, setter] = subStates[item.id] || [false, () => {}]
      setter(v => !v)
      setActive(item.id)
    } else {
      setActive(item.id)
    }
  }

  return (
    <div className="w-52 min-h-screen bg-white border-r border-pink-100 flex flex-col fixed left-0 top-0 bottom-0">
      <div className="p-4 flex items-center gap-3 border-b border-pink-100">
        <div className="w-9 h-9 bg-pink-200 rounded-xl flex items-center justify-center text-pink-600 font-bold text-sm">A</div>
        <div>
          <p className="font-bold text-gray-800 text-xs leading-tight">Dra. Amanda Lima</p>
          <p className="text-xs text-gray-400 leading-tight">Clinical Intelligence</p>
        </div>
      </div>
      <div className="px-3 pt-4 pb-1">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-2 mb-2">Navegação</p>
      </div>
      <nav className="flex-1 px-3">
        {menuItems.map(item => (
          <div key={item.id}>
            <button
              onClick={() => handleClick(item)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm flex items-center gap-3 transition-all ${
                active === item.id
                  ? 'bg-pink-100 text-pink-600 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.sub && (
                <span className="text-xs text-gray-300">{(subStates[item.id]?.[0]) ? '▲' : '▼'}</span>
              )}
            </button>

            {item.sub && subStates[item.id]?.[0] && (
              <div className="ml-4 mb-1">
                {item.sub.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActive(sub.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg mb-0.5 text-xs flex items-center gap-2 transition-all border-l-2 ${
                      active === sub.id
                        ? 'border-pink-400 bg-pink-50 text-pink-600 font-semibold'
                        : 'border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <button className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 text-gray-500 hover:bg-gray-50"><span>⚙️</span><span>Configurações</span></button>
        <button className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 text-gray-500 hover:bg-gray-50"><span>❓</span><span>Ajuda</span></button>
        <button className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 text-gray-500 hover:bg-gray-50"><span>💬</span><span>WhatsApp</span></button>
      </div>
    </div>
  )
}
