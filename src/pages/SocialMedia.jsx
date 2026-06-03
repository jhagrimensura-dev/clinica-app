import { useState, useEffect } from 'react'
import { useClinica } from '../context/ClinicaContext'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function gerarCalendario(ano, mes) {
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const diasMesAnterior = new Date(ano, mes, 0).getDate()
  const semanas = []
  let semana = []
  for (let i = primeiroDia - 1; i >= 0; i--) semana.push({ dia: diasMesAnterior - i, mes: 'ant' })
  for (let dia = 1; dia <= diasNoMes; dia++) {
    semana.push({ dia })
    if (semana.length === 7) { semanas.push(semana); semana = [] }
  }
  if (semana.length > 0) {
    let prox = 1
    while (semana.length < 7) semana.push({ dia: prox++, mes: 'prox' })
    semanas.push(semana)
  }
  return semanas
}

const TIPOS = [
  { label: 'Caso',       cor: 'bg-yellow-100 text-yellow-700' },
  { label: 'Trend',      cor: 'bg-purple-100 text-purple-700' },
  { label: 'Experiência',cor: 'bg-blue-100 text-blue-700' },
  { label: 'Respiro',    cor: 'bg-green-100 text-green-700' },
  { label: 'Colab',      cor: 'bg-pink-100 text-pink-700' },
]

const FORMATOS = ['Reels', 'Foto', 'Carrossel', 'Stories']

const postsIniciais = []

const corDoTipo = (tipo) => TIPOS.find(t => t.label === tipo)?.cor || 'bg-gray-100 text-gray-600'

const hoje = new Date()
const dataHoje = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`

export default function SocialMedia() {
  const { mes, ano, posts, setPosts } = useClinica()
  const semanas = gerarCalendario(ano, mes)

  const [trafego, setTrafego] = useState(0)
  const [editandoTrafego, setEditandoTrafego] = useState(false)
  const [inputTrafego, setInputTrafego] = useState('')

  const [seguidores, setSeguidores] = useState(0)
  const [editandoSeguidores, setEditandoSeguidores] = useState(false)
  const [inputSeguidores, setInputSeguidores] = useState('')

  useEffect(() => {
    try {
      const t = localStorage.getItem(`social_trafego_${ano}_${mes}`)
      setTrafego(t !== null ? parseFloat(t) : 0)
      const s = localStorage.getItem(`social_seguidores_${ano}_${mes}`)
      setSeguidores(s !== null ? parseInt(s) : 0)
    } catch {}
  }, [ano, mes])

  const [modal, setModal] = useState(null) // null | { dia }
  const [form, setForm] = useState({ data: '', formato: '', tipo: '', link: '', impulsionado: false })

  const porSeguidor = seguidores > 0 ? (trafego / seguidores).toFixed(2).replace('.', ',') : '—'
  const leads = 0
  const porLead = leads > 0 ? (trafego / leads).toFixed(2).replace('.', ',') : '—'

  const salvarTrafego = () => {
    const v = parseFloat(inputTrafego.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(v) && v >= 0) {
      setTrafego(v)
      try { localStorage.setItem(`social_trafego_${ano}_${mes}`, v) } catch {}
    }
    setEditandoTrafego(false)
  }

  const salvarSeguidores = () => {
    const v = parseInt(inputSeguidores.replace(/\D/g, ''))
    if (!isNaN(v) && v >= 0) {
      setSeguidores(v)
      try { localStorage.setItem(`social_seguidores_${ano}_${mes}`, v) } catch {}
    }
    setEditandoSeguidores(false)
  }

  const abrirModal = (dia) => {
    const dd = String(dia).padStart(2, '0')
    const mm = String(mes + 1).padStart(2, '0')
    setForm({ data: `${dd}/${mm}/${ano}`, formato: '', tipo: '', link: '', impulsionado: false })
    setModal({ dia })
  }

  const salvarPost = () => {
    if (!form.tipo) return
    setPosts(prev => [...prev, { id: Date.now(), dia: modal.dia, tipo: form.tipo, formato: form.formato, link: form.link, impulsionado: form.impulsionado }])
    setModal(null)
  }

  const removerPost = (id, e) => {
    e.stopPropagation()
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const totalPorTipo = (tipo) => posts.filter(p => p.tipo === tipo).length
  const totalImpulsionados = posts.filter(p => p.impulsionado).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Social Media</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie métricas de redes sociais e posts</p>
        </div>
        <button onClick={() => abrirModal(hoje.getDate())} className="flex items-center gap-2 bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
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
          <p className="text-2xl font-bold text-gray-900">{leads}</p>
          <p className="text-xs text-gray-400 mt-1">{leads} leads recebidos</p>
          <p className="text-xs text-gray-400">R$ {porLead} por lead</p>
        </div>

        {/* Posts */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-medium">Posts</p>
            <span className="text-pink-400">📊</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-3">{posts.length}</p>
          <div className="space-y-1">
            {[
              { tipo: 'Casos', key: 'Caso', cor: 'bg-yellow-400' },
              { tipo: 'Trends', key: 'Trend', cor: 'bg-purple-400' },
              { tipo: 'Experiências', key: 'Experiência', cor: 'bg-blue-400' },
              { tipo: 'Respiros', key: 'Respiro', cor: 'bg-green-400' },
              { tipo: 'Colabs', key: 'Colab', cor: 'bg-pink-400' },
              { tipo: 'Impulsionados', key: '_imp', cor: 'bg-orange-300' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.cor}`}></div>
                  <span className="text-gray-500">{item.tipo}</span>
                </div>
                <span className="font-semibold text-gray-700">{item.key === '_imp' ? totalImpulsionados : totalPorTipo(item.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendário de Posts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-800">Calendário de Posts — {MESES[mes]} {ano}</h2>
          <p className="text-xs text-gray-400 mt-1">Clique em um dia para adicionar um post</p>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {semanas.map((semana, si) => (
          <div key={si} className="grid grid-cols-7 border-t border-gray-100">
            {semana.map((celula, ci) => {
              const isMesAtual = !celula.mes
              const postsDoDia = posts.filter(p => p.dia === celula.dia && isMesAtual)

              return (
                <div
                  key={ci}
                  onClick={() => isMesAtual && abrirModal(celula.dia)}
                  className={`min-h-[80px] p-2 border-r border-gray-100 last:border-r-0 transition-colors ${isMesAtual ? 'cursor-pointer hover:bg-pink-50' : 'bg-gray-50'}`}
                >
                  <span className={`text-xs font-bold ${isMesAtual ? 'text-gray-700' : 'text-gray-300'}`}>{celula.dia}</span>
                  <div className="space-y-1 mt-1">
                    {postsDoDia.map((post) => (
                      <div key={post.id} className={`text-xs px-1.5 py-0.5 rounded-md font-medium flex items-center justify-between gap-1 ${corDoTipo(post.tipo)}`}>
                        <span>+ {post.tipo}{post.impulsionado ? ' 🚀' : ''}</span>
                        <button onClick={e => removerPost(post.id, e)} className="opacity-40 hover:opacity-100 text-xs leading-none">×</button>
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

      {/* Modal Novo Post */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Novo Post</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Data do Post</label>
                <input type="text" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-400" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Formato <span className="text-red-400">*</span></label>
                <select value={form.formato} onChange={e => setForm(f => ({ ...f, formato: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white">
                  <option value="">Selecione o formato</option>
                  {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo <span className="text-red-400">*</span></label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white">
                  <option value="">Selecione o tipo</option>
                  {TIPOS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Link do Post</label>
                <input type="text" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="https://instagram.com/p/..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-400" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.impulsionado} onChange={e => setForm(f => ({ ...f, impulsionado: e.target.checked }))}
                  className="w-4 h-4 accent-pink-400" />
                <span className="text-sm text-gray-600">Post Impulsionado</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">Cancelar</button>
              <button onClick={salvarPost} disabled={!form.tipo}
                className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
