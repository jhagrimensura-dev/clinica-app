import { getFeriado } from '../lib/feriados'

export default function FeriadoAviso({ data }) {
  const nome = getFeriado(data)
  if (!nome) return null
  return (
    <p className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1">
      🔴 Feriado Nacional: {nome}
    </p>
  )
}
