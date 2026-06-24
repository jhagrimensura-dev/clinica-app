import { useState, useEffect } from 'react'
import { useClinica } from '../context/ClinicaContext'
import { useSocial } from '../context/SocialContext'

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
  { label: 'Colab',      cor: 'bg-brand-100 text-brand-700' },
]

const ROTINA_TIPOS = [
  { label: 'Caso',        cor: 'bg-yellow-100 text-yellow-700' },
  { label: 'Trend',       cor: 'bg-purple-100 text-purple-700' },
  { label: 'Experiência', cor: 'bg-blue-100 text-blue-700' },
  { label: 'Respiro',     cor: 'bg-green-100 text-green-700' },
  { label: 'Colab',       cor: 'bg-brand-100 text-brand-700' },
  { label: 'Produção',    cor: 'bg-orange-100 text-orange-700' },
  { label: 'Outro',       cor: 'bg-gray-100 text-gray-600' },
]

const ROTINA_FORMATOS = ['Reels', 'Foto', 'Carrossel', 'Stories']

const ETAPAS_FUNIL = ['Topo de Funil', 'Meio de Funil', 'Fundo de Funil']

const STATUS_ROTINA = [
  { label: 'A fazer',     cor: 'bg-gray-100 text-gray-600' },
  { label: 'Em criação',  cor: 'bg-yellow-100 text-yellow-700' },
  { label: 'Pronto',      cor: 'bg-blue-100 text-blue-700' },
  { label: 'Publicado',   cor: 'bg-green-100 text-green-700' },
]

const corDoStatus = (status) => STATUS_ROTINA.find(s => s.label === status)?.cor || 'bg-gray-100 text-gray-500'

const DIAS_SEMANA_FULL = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']

const corDoTipoRotina = (tipo) => ROTINA_TIPOS.find(t => t.label === tipo)?.cor || 'bg-gray-100 text-gray-600'

const FORMATOS = ['Reels', 'Foto', 'Carrossel', 'Stories']

const postsIniciais = []

const corDoTipo = (tipo) => TIPOS.find(t => t.label === tipo)?.cor || 'bg-gray-100 text-gray-600'

const hoje = new Date()
const dataHoje = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`

export default function SocialMedia() {
  const { mes, ano, setMes, setAno, posts, setPosts } = useClinica()
  const { getMes, setTrafego: saveTrafego, setSeguidores: saveSeguidores, rotina, salvarRotina, carregarMes } = useSocial()

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAno(a => a - 1) }
    else setMes(m => m - 1)
  }
  const proximoMes = () => {
    if (mes === 11) { setMes(0); setAno(a => a + 1) }
    else setMes(m => m + 1)
  }
  const semanas = gerarCalendario(ano, mes)

  const mesMes = getMes(ano, mes)
  const trafego = mesMes.trafego
  const seguidores = mesMes.seguidores

  const [editandoTrafego, setEditandoTrafego] = useState(false)
  const [inputTrafego, setInputTrafego] = useState('')

  const [editandoSeguidores, setEditandoSeguidores] = useState(false)
  const [inputSeguidores, setInputSeguidores] = useState('')

  useEffect(() => { carregarMes(ano, mes) }, [ano, mes])

  const [modal, setModal] = useState(null) // null | { dia }
  const [form, setForm] = useState({ data: '', formato: '', tipo: '', link: '', impulsionado: false })

  const [modalRotina, setModalRotina] = useState(null) // null | { dateKey, label }
  const FORM_ROTINA_VAZIO = { texto: '', tipo: '', formato: '', etapaFunil: '', status: 'A fazer', paciente: '', inspiracao: '', horario: '', comentario: '' }
  const [formRotina, setFormRotina] = useState(FORM_ROTINA_VAZIO)

  const adicionarTarefaRotina = () => {
    if (!formRotina.texto.trim() || !formRotina.tipo) return
    const dk = modalRotina.dateKey
    const nova = {
      id: Date.now(),
      texto: formRotina.texto.trim(),
      tipo: formRotina.tipo,
      formato: formRotina.formato,
      etapaFunil: formRotina.etapaFunil,
      status: formRotina.status || 'A fazer',
      paciente: formRotina.paciente.trim(),
      inspiracao: formRotina.inspiracao.trim(),
      horario: formRotina.horario,
      comentario: formRotina.comentario.trim(),
    }
    salvarRotina({ ...rotina, [dk]: [...(rotina[dk] || []), nova] })
    setFormRotina(FORM_ROTINA_VAZIO)
  }

  const removerTarefaRotina = (dateKey, id, e) => {
    e.stopPropagation()
    salvarRotina({ ...rotina, [dateKey]: (rotina[dateKey] || []).filter(t => t.id !== id) })
  }

  const porSeguidor = seguidores > 0 ? (trafego / seguidores).toFixed(2).replace('.', ',') : '—'
  const leads = 0
  const porLead = leads > 0 ? (trafego / leads).toFixed(2).replace('.', ',') : '—'

  const salvarTrafego = () => {
    const v = parseFloat(inputTrafego.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(v) && v >= 0) saveTrafego(ano, mes, v)
    setEditandoTrafego(false)
  }

  const salvarSeguidores = () => {
    const v = parseInt(inputSeguidores.replace(/\D/g, ''))
    if (!isNaN(v) && v >= 0) saveSeguidores(ano, mes, v)
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
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
            <button onClick={mesAnterior} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">{MESES[mes]} {ano}</span>
            <button onClick={proximoMes} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <button onClick={() => abrirModal(hoje.getDate())} className="flex items-center gap-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            + Novo Post
          </button>
        </div>
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
                  className="flex-1 text-2xl font-bold text-gray-900 border-b-2 border-brand-400 outline-none bg-transparent" />
              </div>
              <div className="flex gap-2">
                <button onClick={salvarTrafego} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
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
                className="w-full text-2xl font-bold text-gray-900 border-b-2 border-brand-400 outline-none bg-transparent" />
              <div className="flex gap-2">
                <button onClick={salvarSeguidores} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
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
            <span className="text-brand-400">🔗</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{leads}</p>
          <p className="text-xs text-gray-400 mt-1">{leads} leads recebidos</p>
          <p className="text-xs text-gray-400">R$ {porLead} por lead</p>
        </div>

        {/* Posts */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500 font-medium">Posts</p>
            <span className="text-brand-400">📊</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-3">{posts.length}</p>
          <div className="space-y-1">
            {[
              { tipo: 'Casos', key: 'Caso', cor: 'bg-yellow-400' },
              { tipo: 'Trends', key: 'Trend', cor: 'bg-purple-400' },
              { tipo: 'Experiências', key: 'Experiência', cor: 'bg-blue-400' },
              { tipo: 'Respiros', key: 'Respiro', cor: 'bg-green-400' },
              { tipo: 'Colabs', key: 'Colab', cor: 'bg-brand-400' },
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
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        {/* Header azul */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0">📋</div>
          <div>
            <h2 className="text-base font-bold text-blue-900">Calendário de Posts — {MESES[mes]} {ano}</h2>
            <p className="text-xs text-blue-400 mt-0.5">Registre os posts publicados clicando em um dia</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 mb-2">
            {['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-blue-300 py-2">{d}</div>
            ))}
          </div>

          {semanas.map((semana, si) => (
            <div key={si} className="grid grid-cols-7 border-t border-blue-50">
              {semana.map((celula, ci) => {
                const isMesAtual = !celula.mes
                const postsDoDia = posts.filter(p => p.dia === celula.dia && isMesAtual)

                return (
                  <div
                    key={ci}
                    onClick={() => isMesAtual && abrirModal(celula.dia)}
                    className={`min-h-[80px] p-2 border-r border-blue-50 last:border-r-0 transition-colors ${isMesAtual ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-50/50'}`}
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
      </div>

      {/* Calendário de Rotina */}
      <div className="bg-brand-50 rounded-2xl shadow-sm border border-brand-200 overflow-hidden">
        {/* Header brand */}
        <div className="bg-brand-400 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0">🗓️</div>
          <div>
            <h2 className="text-base font-bold text-white">Rotina da Social Media — {MESES[mes]} {ano}</h2>
            <p className="text-xs text-brand-100 mt-0.5">Planejamento de conteúdo por dia • clique em um dia para adicionar</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 mb-2">
            {['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-brand-400 py-2">{d}</div>
            ))}
          </div>

        {semanas.map((semana, si) => (
          <div key={si} className="grid grid-cols-7 border-t border-gray-100">
            {semana.map((celula, ci) => {
              const isMesAtual = !celula.mes
              const dateKey = `${ano}-${mes}-${celula.dia}`
              const tarefas = isMesAtual ? (rotina[dateKey] || []) : []
              return (
                <div
                  key={ci}
                  onClick={() => isMesAtual && (setModalRotina({ dateKey, label: `${celula.dia} de ${MESES[mes]} — ${DIAS_SEMANA_FULL[ci]}` }), setFormRotina(FORM_ROTINA_VAZIO))}
                  className={`min-h-[80px] p-2 border-r border-brand-100 last:border-r-0 transition-colors ${isMesAtual ? 'cursor-pointer hover:bg-brand-100' : 'bg-brand-50/50'}`}
                >
                  <span className={`text-xs font-bold ${isMesAtual ? 'text-brand-700' : 'text-brand-200'}`}>{celula.dia}</span>
                  <div className="space-y-1 mt-1">
                    {tarefas.map(tarefa => (
                      <div key={tarefa.id} className={`text-xs px-1.5 py-0.5 rounded-md font-medium flex items-center justify-between gap-1 ${corDoTipoRotina(tarefa.tipo)}`}>
                        <div className="min-w-0">
                          <p className="truncate">{tarefa.texto}</p>
                          {tarefa.horario && <p className="text-[10px] opacity-60">🕐 {tarefa.horario}</p>}
                        </div>
                        <button onClick={e => removerTarefaRotina(dateKey, tarefa.id, e)} className="opacity-40 hover:opacity-100 text-xs leading-none flex-shrink-0">×</button>
                      </div>
                    ))}
                    {isMesAtual && tarefas.length === 0 && (
                      <div className="text-xs text-brand-200 mt-2 text-center">+</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        </div>
      </div>

      {/* Modal Rotina */}
      {modalRotina && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setModalRotina(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800">📅 {modalRotina.label}</h2>
              </div>
              <button onClick={() => setModalRotina(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Corpo scrollável */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

              {/* Tarefas existentes */}
              {(rotina[modalRotina.dateKey] || []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cadastradas</p>
                  {(rotina[modalRotina.dateKey] || []).map(tarefa => (
                    <div key={tarefa.id} className={`flex items-start justify-between px-3 py-2 rounded-xl text-xs font-medium ${corDoTipoRotina(tarefa.tipo)}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{tarefa.texto}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tarefa.formato && <span className="bg-white/60 px-1.5 py-0.5 rounded-md">{tarefa.formato}</span>}
                          {tarefa.etapaFunil && <span className="bg-white/60 px-1.5 py-0.5 rounded-md">{tarefa.etapaFunil}</span>}
                          {tarefa.status && tarefa.status !== 'A fazer' && <span className={`px-1.5 py-0.5 rounded-md ${corDoStatus(tarefa.status)}`}>{tarefa.status}</span>}
                          {tarefa.paciente && <span className="bg-white/60 px-1.5 py-0.5 rounded-md">👤 {tarefa.paciente}</span>}
                          {tarefa.horario && <span className="bg-white/60 px-1.5 py-0.5 rounded-md">🕐 {tarefa.horario}</span>}
                        </div>
                        {tarefa.inspiracao && (
                          <a href={tarefa.inspiracao.startsWith('http') ? tarefa.inspiracao : `https://${tarefa.inspiracao}`}
                            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            className="text-[11px] mt-0.5 flex items-center gap-1 opacity-70 hover:opacity-100 underline">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            Abrir inspiração
                          </a>
                        )}
                        {tarefa.comentario && <p className="text-[11px] mt-1 opacity-70 italic">"{tarefa.comentario}"</p>}
                      </div>
                      <button onClick={e => removerTarefaRotina(modalRotina.dateKey, tarefa.id, e)} className="opacity-40 hover:opacity-100 ml-2 text-sm leading-none flex-shrink-0">×</button>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nova entrada</p>
                  </div>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Título <span className="text-red-400">*</span></label>
                <input autoFocus type="text" value={formRotina.texto}
                  onChange={e => setFormRotina(f => ({ ...f, texto: e.target.value }))}
                  placeholder="Ex: Criar conteúdo para Reels"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
              </div>

              {/* Formato + Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Formato</label>
                  <select value={formRotina.formato} onChange={e => setFormRotina(f => ({ ...f, formato: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="">Selecione</option>
                    {ROTINA_FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo <span className="text-red-400">*</span></label>
                  <select value={formRotina.tipo} onChange={e => setFormRotina(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="">Selecione</option>
                    {ROTINA_TIPOS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Etapa do Funil + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Etapa do Funil</label>
                  <select value={formRotina.etapaFunil} onChange={e => setFormRotina(f => ({ ...f, etapaFunil: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="">Selecione</option>
                    {ETAPAS_FUNIL.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                  <select value={formRotina.status} onChange={e => setFormRotina(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
                    {STATUS_ROTINA.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Paciente + Inspiração */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Paciente</label>
                  <input type="text" value={formRotina.paciente}
                    onChange={e => setFormRotina(f => ({ ...f, paciente: e.target.value }))}
                    placeholder="Nome do paciente"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Inspiração</label>
                  <div className="relative">
                    <input type="text" value={formRotina.inspiracao}
                      onChange={e => setFormRotina(f => ({ ...f, inspiracao: e.target.value }))}
                      placeholder="Link ou referência"
                      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 ${formRotina.inspiracao ? 'pr-9' : ''}`} />
                    {formRotina.inspiracao && (
                      <a href={formRotina.inspiracao.startsWith('http') ? formRotina.inspiracao : `https://${formRotina.inspiracao}`}
                        target="_blank" rel="noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 transition-colors"
                        title="Abrir link">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Horário */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Horário do post</label>
                <input type="time" value={formRotina.horario}
                  onChange={e => setFormRotina(f => ({ ...f, horario: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white" />
              </div>

              {/* Comentário */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Comentário</label>
                <textarea value={formRotina.comentario}
                  onChange={e => setFormRotina(f => ({ ...f, comentario: e.target.value }))}
                  placeholder="Observações, ideias, referências..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 resize-none" />
              </div>
            </div>

            {/* Footer fixo */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModalRotina(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">Fechar</button>
              <button onClick={adicionarTarefaRotina} disabled={!formRotina.texto.trim() || !formRotina.tipo}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Adicionar</button>
            </div>
          </div>
        </div>
      )}

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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Formato <span className="text-red-400">*</span></label>
                <select value={form.formato} onChange={e => setForm(f => ({ ...f, formato: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
                  <option value="">Selecione o formato</option>
                  {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo <span className="text-red-400">*</span></label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
                  <option value="">Selecione o tipo</option>
                  {TIPOS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Link do Post</label>
                <div className="relative">
                  <input type="text" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                    placeholder="https://instagram.com/p/..."
                    className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 ${form.link ? 'pr-9' : ''}`} />
                  {form.link && (
                    <a href={form.link.startsWith('http') ? form.link : `https://${form.link}`}
                      target="_blank" rel="noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 transition-colors"
                      title="Abrir link">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.impulsionado} onChange={e => setForm(f => ({ ...f, impulsionado: e.target.checked }))}
                  className="w-4 h-4 accent-brand-400" />
                <span className="text-sm text-gray-600">Post Impulsionado</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">Cancelar</button>
              <button onClick={salvarPost} disabled={!form.tipo}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
