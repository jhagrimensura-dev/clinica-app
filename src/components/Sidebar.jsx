import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

function loadContas() {
  try { const s = localStorage.getItem('config_whatsapp_contas'); return s ? JSON.parse(s) : [] } catch { return [] }
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'agenda', label: 'Agenda', icon: '📅' },
  { id: 'metas', label: 'Metas', icon: '🎯' },
  { id: 'social', label: 'Social Media', icon: '📱' },
  {
    id: 'comercial', label: 'WhatsApp', icon: '💬',
    sub: [
      { id: 'inbox', label: 'Conversas', icon: '📥' },
      { id: 'leads_novos', label: 'Leads Novos', icon: '🆕' },
      { id: 'leads_recorrentes', label: 'Leads Recorrentes', icon: '🔄' },
      { id: 'indicacao', label: 'Indicação', icon: '🤝' },
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

export default function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const { signOut, userRole } = useAuth()
  const isFuncionario = userRole === 'Funcionário'
  const [waAberto, setWaAberto] = useState(false)
  const [contasWA, setContasWA] = useState(loadContas)

  useEffect(() => {
    const atualizar = () => setContasWA(loadContas())
    window.addEventListener('storage', atualizar)
    // atualiza ao montar caso localStorage já tenha dados
    setContasWA(loadContas())
    return () => window.removeEventListener('storage', atualizar)
  }, [])
  const [financeiroAberto, setFinanceiroAberto] = useState(
    active === 'financeiro' || active === 'contas'
  )
  const [whatsappAberto, setWhatsappAberto] = useState(
    ['comercial','leads_novos','leads_recorrentes','indicacao'].includes(active)
  )

  const subStates = {
    financeiro: [financeiroAberto, setFinanceiroAberto],
    comercial: [whatsappAberto, setWhatsappAberto],
  }

  const handleClick = (item) => {
    if (collapsed) { setCollapsed(false); return }
    if (item.sub) {
      const [, setter] = subStates[item.id] || [false, () => {}]
      setter(v => !v)
      setActive(item.id)
    } else {
      setActive(item.id)
    }
  }

  return (
    <div className={`${collapsed ? 'w-14' : 'w-52'} min-h-screen bg-white border-r border-brand-100 flex flex-col fixed left-0 top-0 bottom-0 transition-all duration-200 z-50`}>

      {/* Header */}
      <div className={`p-3 flex items-center border-b border-brand-100 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 bg-brand-200 rounded-xl flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">A</div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-xs leading-tight truncate">Dra. Amanda Lima</p>
          </div>
        )}
      </div>

      {/* Botão recolher */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -right-4 top-6 w-8 h-8 bg-brand-400 hover:bg-brand-500 border-2 border-white rounded-full flex items-center justify-center text-white transition-colors shadow-md z-50"
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <svg className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Label Navegação */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-1">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-2 mb-2">Navegação</p>
        </div>
      )}
      {collapsed && <div className="pt-3" />}

      {/* Menu */}
      <nav className="flex-1 px-2">
        {menuItems.filter(item => !(isFuncionario && item.id === 'financeiro')).map(item => (
          <div key={item.id}>
            <button
              onClick={() => handleClick(item)}
              title={collapsed ? item.label : ''}
              className={`w-full text-left px-2 py-2 rounded-lg mb-1 text-sm flex items-center transition-all ${collapsed ? 'justify-center' : 'gap-3'} ${
                active === item.id
                  ? 'bg-brand-100 text-brand-600 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.sub && (
                <span className="text-xs text-gray-300">{(subStates[item.id]?.[0]) ? '▲' : '▼'}</span>
              )}
            </button>

            {!collapsed && item.sub && subStates[item.id]?.[0] && (
              <div className="ml-4 mb-1">
                {item.sub.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActive(sub.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg mb-0.5 text-xs flex items-center gap-2 transition-all border-l-2 ${
                      active === sub.id
                        ? 'border-brand-400 bg-brand-50 text-brand-600 font-semibold'
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

      {/* Footer */}
      <div className={`px-2 pb-4 border-t border-gray-100 pt-3 space-y-0.5`}>
        {!isFuncionario && (
          <button onClick={() => setActive('configuracoes')} title={collapsed ? 'Configurações' : ''} className={`w-full text-left px-2 py-2 rounded-lg text-sm flex items-center transition-colors ${collapsed ? 'justify-center' : 'gap-3'} ${active === 'configuracoes' ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span>⚙️</span>{!collapsed && <span>Configurações</span>}
          </button>
        )}
        <button onClick={() => setActive('ajuda')} title={collapsed ? 'Ajuda' : ''} className={`w-full text-left px-2 py-2 rounded-lg text-sm flex items-center transition-colors ${collapsed ? 'justify-center' : 'gap-3'} ${active === 'ajuda' ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}>
          <span>❓</span>{!collapsed && <span>Ajuda</span>}
        </button>
        {/* WhatsApp Inboxes */}
        <div>
          <button onClick={() => setWaAberto(v => !v)} title={collapsed ? 'WhatsApp' : ''}
            className={`w-full text-left px-2 py-2 rounded-lg text-sm flex items-center text-gray-500 hover:bg-gray-50 ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <span>💬</span>
            {!collapsed && (
              <>
                <span className="flex-1">WhatsApp</span>
                <span className="text-xs text-gray-300">{waAberto ? '▲' : '▼'}</span>
              </>
            )}
          </button>
          {!collapsed && waAberto && (
            <div className="ml-4 space-y-0.5 mb-1">
              {contasWA.length === 0 ? (
                <button onClick={() => setActive('configuracoes')}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-50 border-l-2 border-gray-100">
                  + Adicionar conta
                </button>
              ) : (
                <>
                  {contasWA.map(conta => {
                    const tipoColor = {
                      'Leads Novos':       'bg-brand-100 text-brand-700',
                      'Leads Recorrentes': 'bg-blue-100 text-blue-700',
                      'Indicação':         'bg-purple-100 text-purple-700',
                      'Suporte':           'bg-yellow-100 text-yellow-700',
                    }[conta.tipo] || 'bg-gray-100 text-gray-500'
                    return (
                      <button key={conta.id} onClick={() => setActive(`inbox_${conta.id}`)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col gap-0.5 transition-all border-l-2 ${
                          active === `inbox_${conta.id}`
                            ? 'border-green-400 bg-green-50 text-green-700 font-semibold'
                            : 'border-gray-100 text-gray-500 hover:bg-gray-50'
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                          <span className="truncate">{conta.nome}</span>
                        </div>
                        {conta.tipo && (
                          <span className={`ml-4 self-start text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tipoColor}`}>
                            {conta.tipo}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  <button onClick={() => setActive('configuracoes')}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-50 border-l-2 border-gray-100">
                    + Adicionar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <button onClick={signOut} title={collapsed ? 'Sair' : ''} className={`w-full text-left px-2 py-2 rounded-lg text-sm flex items-center text-red-400 hover:bg-red-50 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <span>🚪</span>{!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  )
}
