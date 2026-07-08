// Feriados nacionais brasileiros

function calcularPascoa(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDias(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmt(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const FIXOS = {
  '01-01': 'Ano Novo',
  '21-04': 'Tiradentes',
  '01-05': 'Dia do Trabalho',
  '07-09': 'Independência do Brasil',
  '12-10': 'N. Sra. Aparecida',
  '02-11': 'Finados',
  '15-11': 'Proclamação da República',
  '20-11': 'Consciência Negra',
  '25-12': 'Natal',
}

function getFeriadosAno(year) {
  const mapa = {}

  // Fixos
  for (const [ddmm, nome] of Object.entries(FIXOS)) {
    const [d, m] = ddmm.split('-').map(Number)
    const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    mapa[key] = nome
  }

  // Variáveis baseadas na Páscoa
  const pascoa = calcularPascoa(year)
  mapa[fmt(addDias(pascoa, -48))] = 'Carnaval'
  mapa[fmt(addDias(pascoa, -47))] = 'Carnaval'
  mapa[fmt(addDias(pascoa, -2))]  = 'Sexta-feira Santa'
  mapa[fmt(pascoa)]               = 'Páscoa'
  mapa[fmt(addDias(pascoa, 60))]  = 'Corpus Christi'

  return mapa
}

const cache = {}

export function getFeriado(dateStr) {
  if (!dateStr) return null
  const year = parseInt(dateStr.slice(0, 4))
  if (!cache[year]) cache[year] = getFeriadosAno(year)
  return cache[year][dateStr] || null
}
