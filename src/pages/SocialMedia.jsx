import { useState } from 'react'

const posts = [
  { id: 1, dia: 1, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 1 },
  { id: 2, dia: 2, tipo: null, cor: '', alcance: null },
  { id: 3, dia: 3, tipo: null, cor: '', alcance: 2 },
  { id: 4, dia: 4, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 7 },
  { id: 5, dia: 5, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 3 },
  { id: 6, dia: 6, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 3 },
  { id: 7, dia: 7, tipo: null, cor: '', alcance: 2 },
  { id: 8, dia: 8, tipo: 'Trend', cor: 'bg-purple-100 text-purple-700', alcance: 7 },
  { id: 9, dia: 9, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: null },
  { id: 10, dia: 10, tipo: 'Respiro', cor: 'bg-green-100 text-green-700', alcance: 2 },
  { id: 11, dia: 11, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 2 },
  { id: 12, dia: 12, tipo: 'Experiência', cor: 'bg-blue-100 text-blue-700', alcance: 2 },
  { id: 13, dia: 13, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 2 },
  { id: 14, dia: 14, tipo: 'Trend', cor: 'bg-purple-100 text-purple-700', alcance: 6 },
  { id: 15, dia: 15, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 3 },
  { id: 16, dia: 16, tipo: 'Respiro', cor: 'bg-green-100 text-green-700', alcance: 2 },
  { id: 17, dia: 17, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 2 },
  { id: 18, dia: 18, tipo: 'Respiro', cor: 'bg-green-100 text-green-700', alcance: 5 },
  { id: 19, dia: 19, tipo: 'Caso', cor: 'bg-yellow-100 text-yellow-700', alcance: 4 },
]

const semanas = [
  [
    { dia: 26, mes: 'ant' }, { dia: 27, mes: 'ant' }, { dia: 28, mes: 'ant' }, { dia: 29, mes: 'ant' }, { dia: 30, mes: 'ant' }, { dia: 1 }, { dia: 2 }
  ],
  [
    { dia: 3 }, { dia: 4 }, { dia: 5 }, { dia: 6 }, { dia: 7 }, { dia: 8 }, { dia: 9 }
  ],
  [
    { dia: 10 }, { dia: 11 }, { dia: 12 }, { dia: 13 }, { dia: 14 }, { dia: 15 }, { dia: 16 }
  ],
  [
    { dia: 17 }, { dia: 18 }, { dia: 19 }, { dia: 20 }, { dia: 21 }, { dia: 22 }, { dia: 23 }
  ],
  [
    { dia: 24 }, { dia: 25 }, { dia: 26 }, { dia: 27 }, { dia: 28 }, { dia: 29 }, { dia: 30 }
  ],
  [
    { dia: 31 }, { dia: 1, mes: 'prox' }, { dia: 2, mes: 'prox' }, { dia: 3, mes: 'prox' }, { dia: 4, mes: 'prox' }, { dia: 5, mes: 'prox' }, { dia: 6, mes: 'prox' }
  ],
]

export default function SocialMedia() {
  const [trafego, setTrafego] = useState(4905.66)
  const [editandoTrafego, setEditandoTrafego] = useState(false)
  const [inputTrafego, setInputTrafego] = useState('')

  const [seguidores, setSeguidores] = useState(458)
  const [editandoSeguidores, setEditandoSeguidores] = useState(false)
  const [inputSeguidores, setInputSeguidores] = useState('')

  const porSeguidor = seguidores > 0 ? (trafego / seguidores).toFixed(2).replace('.', ',') : '—'
  const leads = 59
  const porLead = leads > 0 ? (trafego / leads).toFixed(2).replace('.', ',') : '—'

  const salvarTrafego = () => {
    const v = parseFloat(inputTrafego.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(v) && v >= 0) setTrafego(v)
    setEditandoTrafego(false)
  }

  const salvarSeguidores = () => {
    const v = parseInt(inputSeguidores.replace(/\D/g, ''))
    if (!isNaN(v) && v >= 0) setSeguidores(v)
    setEditandoSeguidores(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Social Media</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie métricas de redes sociais e posts</p>
        </div>
        <button className="flex items-center gap-2 bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          + Novo Post
        </button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-4 gap-4">
        {/* Tráfego Investido */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Tráfego Investido</p>
            {!editandoTrafego && <button onClick={() => { setInputTrafego(String(trafego)); setEditandoTrafego(true) }} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>}
          </div>
          {editandoTrafego ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-gray-400">R$</span>
                <input autoFocus type="text" value={inputTrafego} onChange={e => setInputTrafego(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') salvarTrafego(); if (e.key === 'Escape') setEditandoTrafego(false) }}
                  className="flex-1 text-2xl font-bold text-gray-900 border-b-2 border-pink-400 outline-none bg-transparent" />
              </div>
              <div className="flex gap-2">
                <button onClick={salvarTrafego} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
                <button onClick={() => setEditandoTrafego(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">R$ {trafego.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Investimento do mês</p>
        </div>

        {/* Seguidores */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Seguidores</p>
            {!editandoSeguidores && <button onClick={() => { setInputSeguidores(String(seguidores)); setEditandoSeguidores(true) }} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>}
          </div>
          {editandoSeguidores ? (
            <div className="space-y-2">
              <input autoFocus type="text" value={inputSeguidores} onChange={e => setInputSeguidores(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') salvarSeguidores(); if (e.key === 'Escape') setEditandoSeguidores(false) }}
                className="w-full text-2xl font-bold text-gray-900 border-b-2 border-pink-400 outline-none bg-transparent" />
              <div className="flex gap-2">
                <button onClick={salvarSeguidores} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
                <button onClick={() => setEditandoSeguidores(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{seguidores.toLocaleString('pt-BR')}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">R$ {porSeguidor} por seguidor</p>
        </div>

        {/* Leads */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Leads</p>
            <span className="text-pink-400">🔗</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">59</p>
          <p className="text-xs text-gray-400 mt-1">59 leads recebidos</p>
          <p className="text-xs text-gray-400">R$ {porLead} por lead</p>
        </div>

        {/* Posts */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-medium">Posts</p>
            <span className="text-pink-400">📊</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-3">15</p>
          <div className="space-y-1">
            {[
              { tipo: 'Casos', qtd: 8, cor: 'bg-yellow-400' },
              { tipo: 'Trends', qtd: 2, cor: 'bg-purple-400' },
              { tipo: 'Experiências', qtd: 1, cor: 'bg-blue-400' },
              { tipo: 'Respiros', qtd: 4, cor: 'bg-green-400' },
              { tipo: 'Colabs', qtd: 0, cor: 'bg-gray-300' },
              { tipo: 'Impulsionados', qtd: 0, cor: 'bg-orange-300' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.cor}`}></div>
                  <span className="text-gray-500">{item.tipo}</span>
                </div>
                <span className="font-semibold text-gray-700">{item.qtd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendário de Posts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-800">Calendário de Posts</h2>
          <p className="text-xs text-gray-400 mt-1">Clique em um dia para adicionar um post · Clique em um post para editar</p>
        </div>

        {/* Cabeçalho dias */}
        <div className="grid grid-cols-7 mb-2">
          {['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Semanas */}
        {semanas.map((semana, si) => (
          <div key={si} className="grid grid-cols-7 border-t border-gray-100">
            {semana.map((celula, ci) => {
              const isMesAtual = !celula.mes
              const postsDoDia = posts.filter(p => p.dia === celula.dia && isMesAtual)
              const totalAlcance = postsDoDia.reduce((acc, p) => acc + (p.alcance || 0), 0)

              return (
                <div
                  key={ci}
                  className={`min-h-[80px] p-2 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-pink-50 transition-colors ${!isMesAtual ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isMesAtual ? 'text-gray-700' : 'text-gray-300'}`}>
                      {celula.dia}
                    </span>
                    {totalAlcance > 0 && (
                      <span className="text-xs bg-pink-100 text-pink-500 font-bold px-1.5 py-0.5 rounded-full">
                        ×{totalAlcance}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {postsDoDia.map((post, pi) => (
                      <div key={pi} className={`text-xs px-2 py-0.5 rounded-md font-medium ${post.cor}`}>
                        + {post.tipo}
                      </div>
                    ))}
                    {isMesAtual && postsDoDia.length === 0 && (
                      <div className="text-xs text-gray-200 mt-2 text-center">+</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
