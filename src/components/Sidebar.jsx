import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function loadContas() {
  try { const s = localStorage.getItem('config_whatsapp_contas'); return s ? JSON.parse(s) : [] } catch { return [] }
}

/* ── SVG Icons ── */
const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  agenda:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  metas:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>,
  social:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  comercial: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  faturamento:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  financeiro:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  pacientes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  relatorios:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  instagram: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  config:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  sair:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  lembretes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  leads:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  indicacao: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  resgates:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  pos_tratamento: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><polyline points="20 6 9 17 4 12"/></svg>,
  contas:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  colaboradoras: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
}

const menuItems = [
  { id: 'dashboard',   label: 'Dashboard',        icon: 'dashboard'    },
  { id: 'agenda',      label: 'Agenda',            icon: 'agenda'       },
  { id: 'metas',       label: 'Metas',             icon: 'metas'        },
  { id: 'social',      label: 'Social Media',      icon: 'social'       },
  { id: 'instagram',   label: 'Análises Instagram', icon: 'instagram'    },
  {
    id: 'comercial', label: 'WhatsApp', icon: 'comercial',
    sub: [
      { id: 'agenda_lembretes',  label: 'Lembretes',        icon: 'lembretes' },
      { id: 'leads_novos',       label: 'Leads Novos',      icon: 'leads'     },
      { id: 'leads_recorrentes', label: 'Leads Recorrentes',icon: 'leads'     },
      { id: 'indicacao',         label: 'Indicação',        icon: 'indicacao' },
      { id: 'resgates',          label: 'Resgates',         icon: 'resgates'       },
      { id: 'pos_tratamento',    label: 'Pós Procedimento', icon: 'pos_tratamento' },
    ],
  },
  { id: 'faturamento', label: 'Vendas',            icon: 'faturamento'  },
  {
    id: 'financeiro', label: 'Financeiro', icon: 'financeiro',
    sub: [
      { id: 'contas',        label: 'Contas a Pagar', icon: 'contas'        },
      { id: 'colaboradoras', label: 'Colaboradoras',  icon: 'colaboradoras' },
    ],
  },
  { id: 'pacientes',   label: 'Pacientes',         icon: 'pacientes'    },
  { id: 'relatorios',  label: 'Relatórios',        icon: 'relatorios'   },
]

function FlyoutItem({ item, active, setActive, isFuncionario }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const timerRef = useRef(null)

  const isActive = active === item.id || item.sub?.some(s => s.id === active)

  const handleEnter = () => {
    clearTimeout(timerRef.current)
    setOpen(true)
  }
  const handleLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 150)
  }

  const handleClick = () => {
    if (item.sub) {
      setActive(item.sub[0].id)
    } else {
      setActive(item.id)
    }
  }

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        onClick={handleClick}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
          isActive
            ? 'bg-brand-400/30 text-brand-200'
            : 'text-brand-400/60 hover:text-brand-200 hover:bg-brand-400/15'
        }`}
      >
        {icons[item.icon]}
      </button>

      {/* Flyout */}
      {open && (
        <div className="absolute left-14 top-0 z-50 bg-white border border-brand-100 rounded-xl shadow-2xl min-w-[180px] py-2 overflow-hidden">
          <p className="px-4 py-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-widest">{item.label}</p>
          {item.sub ? item.sub.map(sub => (
            <button key={sub.id} onClick={() => { setActive(sub.id); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active === sub.id ? 'text-brand-600 bg-brand-100 font-semibold' : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
              }`}>
              {icons[sub.icon]}
              <span className="whitespace-nowrap">{sub.label}</span>
            </button>
          )) : (
            <button onClick={() => { setActive(item.id); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active === item.id ? 'text-brand-600 bg-brand-100 font-semibold' : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
              }`}>
              {icons[item.icon]}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function WhatsAppFlyout({ active, setActive }) {
  const [open, setOpen] = useState(false)
  const [contasWA, setContasWA] = useState(loadContas)
  const timerRef = useRef(null)

  useEffect(() => {
    const atualizar = () => setContasWA(loadContas())
    window.addEventListener('storage', atualizar)
    // Sincroniza do Supabase ao montar
    supabase.from('configuracoes').select('valor').eq('chave', 'config_whatsapp_contas').single()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valor)) {
          localStorage.setItem('config_whatsapp_contas', JSON.stringify(data.valor))
          setContasWA(data.valor)
        }
      })
    return () => window.removeEventListener('storage', atualizar)
  }, [])

  if (contasWA.length === 0) return null

  const isActive = contasWA.some(c => active === `inbox_${c.id}`)

  const handleEnter = () => { clearTimeout(timerRef.current); setOpen(true) }
  const handleLeave = () => { timerRef.current = setTimeout(() => setOpen(false), 150) }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
        isActive ? 'bg-brand-400/30 text-brand-200' : 'text-brand-400/60 hover:text-brand-200 hover:bg-brand-400/15'
      }`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill={isActive ? '#25D366' : 'currentColor'} opacity={isActive ? 1 : 0.5}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </button>
      {open && (
        <div className="absolute left-14 bottom-0 z-50 bg-white border border-brand-100 rounded-xl shadow-2xl min-w-[200px] py-2">
          <p className="px-4 py-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-widest">Inbox WhatsApp</p>
          {contasWA.map(conta => (
            <button key={conta.id} onClick={() => { setActive(`inbox_${conta.id}`); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active === `inbox_${conta.id}` ? 'text-brand-600 bg-brand-100 font-semibold' : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
              }`}>
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="truncate">{conta.nome}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ active, setActive }) {
  const { signOut, userRole, user, permissoes } = useAuth()
  const isFuncionario = userRole === 'Funcionário'
  const clinicaNome = (() => { try { return JSON.parse(localStorage.getItem('config_clinica') || '{}').nome || '' } catch { return '' } })()
  const inicial = (clinicaNome || user?.user_metadata?.nome || 'A').charAt(0).toUpperCase()

  const podeVerItem = (item) => {
    if (!isFuncionario) return true
    if (item.id === 'relatorios') return false
    if (item.id === 'instagram') return false
    if (permissoes) return permissoes.includes(item.id)
    return item.id !== 'financeiro'
  }

  return (
    <div className="w-16 min-h-screen bg-[#2D1409] flex flex-col fixed left-0 top-0 bottom-0 z-50 items-center py-4 gap-1">

      {/* Logo */}
      <div className="w-10 h-10 bg-brand-300/30 rounded-xl flex items-center justify-center text-brand-200 font-bold text-base mb-3 flex-shrink-0">
        {inicial}
      </div>

      {/* Divisor */}
      <div className="w-8 h-px bg-brand-600/40 mb-2" />

      {/* Nav principal */}
      <nav className="flex flex-col gap-1 flex-1 items-center">
        {menuItems.filter(podeVerItem).map(item => (
          <FlyoutItem key={item.id} item={item} active={active} setActive={setActive} isFuncionario={isFuncionario} />
        ))}

        {/* WhatsApp inbox accounts */}
        <WhatsAppFlyout active={active} setActive={setActive} />
      </nav>

      {/* Divisor */}
      <div className="w-8 h-px bg-brand-600/40 mb-2" />

      {/* Footer */}
      <div className="flex flex-col gap-1 items-center">
        {!isFuncionario && (
          <button onClick={() => setActive('configuracoes')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              active === 'configuracoes' ? 'bg-brand-400/30 text-brand-200' : 'text-brand-400/60 hover:text-brand-200 hover:bg-brand-400/15'
            }`} title="Configurações">
            {icons.config}
          </button>
        )}
        <button onClick={signOut}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-brand-500/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
          title="Sair">
          {icons.sair}
        </button>
      </div>
    </div>
  )
}
