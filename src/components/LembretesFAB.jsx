import { useAgenda } from '../context/AgendaContext'

export default function LembretesFAB({ onOpen }) {
  const { lembretes } = useAgenda()

  const hoje = new Date().toISOString().slice(0, 10)

  const count = lembretes.filter(l => !l.concluido && l.data && l.data <= hoje).length

  return (
    <button
      onClick={onOpen}
      title="Lembretes"
      className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-amber-400 hover:bg-amber-500 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>

      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow z-10">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
