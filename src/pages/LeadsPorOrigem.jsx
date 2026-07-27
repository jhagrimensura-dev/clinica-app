import { useState, useEffect } from 'react'
import { useLeads } from '../context/LeadsContext'
import { supabase } from '../lib/supabase'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const COR_ORIGEM = {
  'Instagram Anúncio':  { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: '#ee2a7b' },
  'Instagram Orgânico': { bg: 'bg-purple-100',  text: 'text-purple-700', bar: '#6228d7' },
  'WhatsApp':           { bg: 'bg-green-100',   text: 'text-green-700',  bar: '#25d366' },
  'Indicação':          { bg: 'bg-yellow-100',  text: 'text-yellow-700', bar: '#f59e0b' },
  'Tráfego':            { bg: 'bg-blue-100',    text: 'text-blue-700',   bar: '#3b82f6' },
  'Instagram':          { bg: 'bg-pink-100',    text: 'text-pink-700',   bar: '#ee2a7b' },
}
const COR_MIDIA = {
  'Campanha de msg para Whatsapp': { bg: 'bg-green-100',  text: 'text-green-700',  bar: '#25d366' },
  'Link da BIO':                   { bg: 'bg-amber-100',  text: 'text-amber-700',  bar: '#f59e0b' },
  'Link dos Stories':              { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: '#ee2a7b' },
  'Indicação':                     { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: '#eab308' },
  'WhatsApp Direto':               { bg: 'bg-teal-100',   text: 'text-teal-700',   bar: '#14b8a6' },
}

function getCorOrigem(o) {
  return COR_ORIGEM[o] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#9ca3af' }
}
function getCorMidia(m) {
  return COR_MIDIA[m] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#9ca3af' }
}

function CardContagem({ label, count, pct, cor, thumbnail, permalink }) {
  return (
    <div className="text-left p-4 rounded-2xl border bg-white border-gray-100 shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        {thumbnail && (
          permalink
            ? <a href={permalink} target="_blank" rel="noreferrer">
                <img src={thumbnail} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
              </a>
            : <img src={thumbnail} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
        )}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cor.bg} ${cor.text} truncate max-w-[160px]`} title={label}>{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{count}</div>
      <div className="text-xs text-gray-400 mb-1">{pct.toFixed(0)}% do total</div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor.bar }} />
      </div>
    </div>
  )
}

function RowContagem({ label, count, pct, cor, thumbnail, permalink }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
      {thumbnail && (
        permalink
          ? <a href={permalink} target="_blank" rel="noreferrer">
              <img src={thumbnail} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
            </a>
          : <img src={thumbnail} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
      )}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cor.bg} ${cor.text}`} title={label}>{label}</span>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor.bar }} />
        </div>
      </div>
      <div className="text-xs text-gray-400 shrink-0 w-10 text-right">{pct.toFixed(0)}%</div>
      <div className="text-base font-bold text-gray-800 shrink-0 w-6 text-right">{count}</div>
    </div>
  )
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  )
}

function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="3" rx="1.5"/><rect x="1" y="6.5" width="14" height="3" rx="1.5"/>
      <rect x="1" y="11" width="14" height="3" rx="1.5"/>
    </svg>
  )
}

export default function LeadsPorOrigem() {
  const { leads } = useLeads()
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [adsEngajamento, setAdsEngajamento] = useState([])
  const [viewCriativo, setViewCriativo] = useState('grid')

  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', 'ads_engajamento').maybeSingle()
      .then(({ data }) => { if (data?.valor) setAdsEngajamento(data.valor) })
  }, [])

  function navMes(dir) {
    if (dir === -1) {
      if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1)
    } else {
      if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1)
    }
  }

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`

  const ORIGENS_EXCLUIDAS = ['Fornecedores', 'Outros', 'WhatsApp']

  const filtrados = leads.filter(l => {
    const d = l.data || l.criadoEm?.slice(0, 10) || ''
    const origem = l.origemCustom || l.fonte || ''
    return d.startsWith(prefix) && !ORIGENS_EXCLUIDAS.includes(origem)
  })

  const total = filtrados.length

  // Contagem por origem
  const contagemOrigem = {}
  filtrados.forEach(l => {
    const o = l.origemCustom || l.fonte || 'Não informado'
    contagemOrigem[o] = (contagemOrigem[o] || 0) + 1
  })
  const sortedOrigem = Object.entries(contagemOrigem).sort((a, b) => b[1] - a[1])

  // Contagem por mídia (só leads que têm mídia)
  const contagemMidia = {}
  filtrados.forEach(l => {
    if (!l.midia) return
    contagemMidia[l.midia] = (contagemMidia[l.midia] || 0) + 1
  })
  const sortedMidia = Object.entries(contagemMidia).sort((a, b) => b[1] - a[1])

  // Contagem por criativo — mostra TODOS os criativos cadastrados, mesmo com 0 leads
  const contagemCriativo = {}
  filtrados.forEach(l => {
    if (!l.criativo) return
    contagemCriativo[l.criativo] = (contagemCriativo[l.criativo] || 0) + 1
  })

  const adMap = {}
  adsEngajamento.forEach(a => { adMap[a.nome] = a })

  const todosCreativos = new Set([...Object.keys(contagemCriativo), ...adsEngajamento.map(a => a.nome)])
  const sortedCriativo = Array.from(todosCreativos)
    .map(nome => [nome, contagemCriativo[nome] || 0])
    .sort((a, b) => b[1] - a[1])
  const totalCriativos = sortedCriativo.reduce((s, [, c]) => s + c, 0)

  const corCriativo = { bg: 'bg-brand-50', text: 'text-brand-700', bar: '#a855f7' }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">📊</div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Leads por Origem</h1>
            <p className="text-sm text-gray-400">{total} leads em {MESES[mes].toLowerCase()} de {ano}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
          <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none">‹</button>
          <span className="text-sm font-bold text-gray-700 w-36 text-center">{MESES[mes]} {ano}</span>
          <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none">›</button>
        </div>
      </div>

      {total === 0 && sortedCriativo.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-100/60 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-400">Nenhum lead registrado em {MESES[mes]} de {ano}.</p>
        </div>
      ) : (
        <>
          {/* Origem */}
          {total > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Por Origem</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedOrigem.map(([origem, count]) => (
                  <CardContagem
                    key={origem}
                    label={origem}
                    count={count}
                    pct={total > 0 ? (count / total) * 100 : 0}
                    cor={getCorOrigem(origem)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Mídia */}
          {sortedMidia.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Por Mídia</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedMidia.map(([midia, count]) => (
                  <CardContagem
                    key={midia}
                    label={midia}
                    count={count}
                    pct={total > 0 ? (count / total) * 100 : 0}
                    cor={getCorMidia(midia)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Criativo */}
          {sortedCriativo.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Por Criativo</h2>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewCriativo('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${viewCriativo === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Grade"
                  >
                    <IconGrid />
                  </button>
                  <button
                    onClick={() => setViewCriativo('list')}
                    className={`p-1.5 rounded-lg transition-colors ${viewCriativo === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Lista"
                  >
                    <IconList />
                  </button>
                </div>
              </div>

              {viewCriativo === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sortedCriativo.map(([criativo, count]) => {
                    const ad = adMap[criativo]
                    return (
                      <CardContagem
                        key={criativo}
                        label={criativo}
                        count={count}
                        pct={totalCriativos > 0 ? (count / totalCriativos) * 100 : 0}
                        cor={corCriativo}
                        thumbnail={ad?.thumbnail || ''}
                        permalink={ad?.permalink || ''}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedCriativo.map(([criativo, count]) => {
                    const ad = adMap[criativo]
                    return (
                      <RowContagem
                        key={criativo}
                        label={criativo}
                        count={count}
                        pct={totalCriativos > 0 ? (count / totalCriativos) * 100 : 0}
                        cor={corCriativo}
                        thumbnail={ad?.thumbnail || ''}
                        permalink={ad?.permalink || ''}
                      />
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
