import { useState, useEffect } from 'react'
import { useClinica } from '../context/ClinicaContext'
import { useSocial } from '../context/SocialContext'
import { useLeads } from '../context/LeadsContext'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const DIAS_SEMANA_ABREV = ['DOM','SEG','TER','QUA','QUI','SEX','SAB']

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
  { label: 'Caso',        cor: 'bg-yellow-100 text-yellow-700' },
  { label: 'Trend',       cor: 'bg-purple-100 text-purple-700' },
  { label: 'Experiência', cor: 'bg-blue-100 text-blue-700' },
  { label: 'Respiro',     cor: 'bg-green-100 text-green-700' },
  { label: 'Colab',       cor: 'bg-brand-100 text-brand-700' },
]

const ROTINA_TIPOS = [
  { label: 'Caso',        cor: 'bg-yellow-100 text-yellow-700' },
  { label: 'Trend',       cor: 'bg-purple-100 text-purple-700' },
  { label: 'Experiência', cor: 'bg-blue-100 text-blue-700' },
  { label: 'Respiro',     cor: 'bg-green-100 text-green-700' },
  { label: 'Colab',       cor: 'bg-brand-100 text-brand-700' },
  { label: 'Produção',    cor: 'bg-orange-100 text-orange-700' },
  { label: 'Checklist',   cor: 'bg-gray-100 text-gray-600' },
  { label: 'Outro',       cor: 'bg-gray-100 text-gray-600' },
]

const ROTINA_FORMATOS = ['Reels', 'Foto', 'Carrossel', 'Stories']
const ETAPAS_FUNIL = ['Topo de Funil', 'Meio de Funil', 'Fundo de Funil']
const FORMATOS = ['Reels', 'Foto', 'Carrossel', 'Stories']

const STATUS_ROTINA = [
  { label: 'A fazer',              cor: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-300' },
  { label: 'Em criação',           cor: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  { label: 'Pronto',               cor: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  { label: 'Aguardando aprovação', cor: 'bg-orange-100 text-orange-600', dot: 'bg-orange-400' },
  { label: 'Aprovado',             cor: 'bg-green-100 text-green-700',   dot: 'bg-green-400' },
  { label: 'Publicado',            cor: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
]

const STATUS_NEXT = {
  'A fazer': 'Em criação',
  'Em criação': 'Pronto',
  'Pronto': 'Aguardando aprovação',
  'Aguardando aprovação': 'Aprovado',
  'Aprovado': 'Publicado',
  'Publicado': 'A fazer',
}

const corDoStatus = (s) => STATUS_ROTINA.find(x => x.label === s)?.cor || 'bg-gray-100 text-gray-500'
const corDoTipoRotina = (t) => ROTINA_TIPOS.find(x => x.label === t)?.cor || 'bg-gray-100 text-gray-600'
const corDoTipo = (t) => TIPOS.find(x => x.label === t)?.cor || 'bg-gray-100 text-gray-600'

// Helpers para template semanal (guardado como rotina._template e rotina._tplStatus)
const getTemplate = (rotina) => rotina._template || {}
const getTplStatus = (rotina) => rotina._tplStatus || {}
const templateDoDia = (rotina, dow) => (getTemplate(rotina)[String(dow)] || [])
const statusTpl = (rotina, dateKey, taskId) => ((getTplStatus(rotina)[dateKey] || {})[taskId] || 'A fazer')

const hoje = new Date()

export default function SocialMedia() {
  const { mes, ano, setMes, setAno, posts, setPosts } = useClinica()
  const { getMes, setTrafego: saveTrafego, setSeguidores: saveSeguidores, rotina, salvarRotina, carregarMes } = useSocial()
  const { getLeadsPorOrigem, leads } = useLeads()

  const mesAnterior = () => { if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1) }
  const proximoMes  = () => { if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1) }
  const semanas = gerarCalendario(ano, mes)

  const mesMes = getMes(ano, mes)
  const trafego = mesMes.trafego
  const seguidores = mesMes.seguidores

  useEffect(() => { carregarMes(ano, mes) }, [ano, mes])

  const [editandoTrafego, setEditandoTrafego] = useState(false)
  const [inputTrafego, setInputTrafego] = useState('')
  const [editandoSeguidores, setEditandoSeguidores] = useState(false)
  const [inputSeguidores, setInputSeguidores] = useState('')

  // Modal posts
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ data: '', formato: '', tipo: '', link: '', impulsionado: false })

  // Modal rotina (tarefas específicas do dia)
  const [modalRotina, setModalRotina] = useState(null) // { dateKey, dow, label }
  const FORM_ROTINA_VAZIO = { texto: '', tipo: '', formato: '', etapaFunil: '', status: 'A fazer', paciente: '', inspiracao: '', horario: '', comentario: '' }
  const [formRotina, setFormRotina] = useState(FORM_ROTINA_VAZIO)

  // Modal template semanal
  const [modalTpl, setModalTpl] = useState(null) // { dow }
  const FORM_TPL_VAZIO = { texto: '', tipo: 'Checklist', formato: '' }
  const [formTpl, setFormTpl] = useState(FORM_TPL_VAZIO)

  // Leads
  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const leadsNovos = getLeadsPorOrigem('leads_novos', ano, mes)
  const isFollow = l => {
    const dataRef = l.dataOrigem || l.data || ''
    if (dataRef && !dataRef.startsWith(prefix)) return true
    return String(l.fonte || '').toLowerCase().includes('follow') || String(l.origemCustom || '').toLowerCase().includes('follow')
  }
  const totalLeadsNovos = leadsNovos.filter(l => !isFollow(l)).length
  const totalFollowUp = leadsNovos.filter(l => isFollow(l)).length
  const totalLeads = totalLeadsNovos + totalFollowUp
  const porLead = totalLeadsNovos > 0 && trafego > 0 ? (trafego / totalLeadsNovos).toFixed(2).replace('.', ',') : '—'
  const porSeguidor = seguidores > 0 ? (trafego / seguidores).toFixed(2).replace('.', ',') : '—'

  const leadsPorDia = {}
  const leadsDetalhadosPorDia = {}
  leads.filter(l => {
    if (l.origem !== 'leads_novos') return false
    const d = l.dataOrigem || l.data || ''
    return d.startsWith(prefix) && !isFollow(l)
  }).forEach(l => {
    const dia = parseInt((l.dataOrigem || l.data || '').split('-')[2], 10)
    if (!isNaN(dia)) {
      leadsPorDia[dia] = (leadsPorDia[dia] || 0) + 1
      if (!leadsDetalhadosPorDia[dia]) leadsDetalhadosPorDia[dia] = []
      leadsDetalhadosPorDia[dia].push(l)
    }
  })
  const [modalLeadsDia, setModalLeadsDia] = useState(null)

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
  const removerPost = (id, e) => { e.stopPropagation(); setPosts(prev => prev.filter(p => p.id !== id)) }

  // Tarefas específicas do dia
  const adicionarTarefaRotina = () => {
    if (!formRotina.texto.trim() || !formRotina.tipo) return
    const dk = modalRotina.dateKey
    const nova = { id: Date.now(), texto: formRotina.texto.trim(), tipo: formRotina.tipo, formato: formRotina.formato, etapaFunil: formRotina.etapaFunil, status: formRotina.status || 'A fazer', paciente: formRotina.paciente.trim(), inspiracao: formRotina.inspiracao.trim(), horario: formRotina.horario, comentario: formRotina.comentario.trim() }
    salvarRotina({ ...rotina, [dk]: [...(rotina[dk] || []), nova] })
    setFormRotina(FORM_ROTINA_VAZIO)
  }
  const removerTarefaRotina = (dateKey, id, e) => {
    e.stopPropagation()
    salvarRotina({ ...rotina, [dateKey]: (rotina[dateKey] || []).filter(t => t.id !== id) })
  }
  const avancarStatusTarefa = (dateKey, id, e) => {
    e.stopPropagation()
    const tarefas = (rotina[dateKey] || []).map(t =>
      t.id === id ? { ...t, status: STATUS_NEXT[t.status || 'A fazer'] || 'A fazer' } : t
    )
    salvarRotina({ ...rotina, [dateKey]: tarefas })
  }

  // Template semanal
  const adicionarTplTask = () => {
    if (!formTpl.texto.trim()) return
    const dow = String(modalTpl.dow)
    const tpl = getTemplate(rotina)
    const nova = { id: Date.now(), texto: formTpl.texto.trim(), tipo: formTpl.tipo, formato: formTpl.formato }
    salvarRotina({ ...rotina, _template: { ...tpl, [dow]: [...(tpl[dow] || []), nova] } })
    setFormTpl(FORM_TPL_VAZIO)
  }
  const removerTplTask = (dow, id) => {
    const tpl = getTemplate(rotina)
    const key = String(dow)
    salvarRotina({ ...rotina, _template: { ...tpl, [key]: (tpl[key] || []).filter(t => t.id !== id) } })
  }
  const avancarStatusTpl = (dateKey, taskId, e) => {
    e.stopPropagation()
    const tplStatus = getTplStatus(rotina)
    const cur = statusTpl(rotina, dateKey, taskId)
    const proximo = STATUS_NEXT[cur] || 'A fazer'
    salvarRotina({
      ...rotina,
      _tplStatus: { ...tplStatus, [dateKey]: { ...(tplStatus[dateKey] || {}), [taskId]: proximo } }
    })
  }

  // Conta pendências de aprovação no mês
  const aprovacoesPendentes = (() => {
    const tplStatus = getTplStatus(rotina)
    let count = 0
    Object.entries(tplStatus).forEach(([dk, statusMap]) => {
      if (!dk.startsWith('_') && dk.startsWith(`${ano}-${mes}-`)) {
        Object.values(statusMap).forEach(s => { if (s === 'Aguardando aprovação') count++ })
      }
    })
    ;(Object.entries(rotina) || []).forEach(([dk, tasks]) => {
      if (!dk.startsWith('_') && dk.startsWith(`${ano}-${mes}-`) && Array.isArray(tasks)) {
        tasks.forEach(t => { if (t.status === 'Aguardando aprovação') count++ })
      }
    })
    return count
  })()

  const totalPorTipo = (tipo) => posts.filter(p => p.tipo === tipo).length
  const totalImpulsionados = posts.filter(p => p.impulsionado).length

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Social Media</h1>
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

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Leads</p>
            <span className="text-brand-400">🔗</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-green-600 font-medium">{totalLeadsNovos} novos</span>
            <span className="text-xs text-orange-500 font-medium">{totalFollowUp} follow-up</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">R$ {porLead} por lead novo</p>
        </div>

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
                  <div className={`w-2 h-2 rounded-full ${item.cor}`} />
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
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0">📋</div>
          <div>
            <h2 className="text-base font-bold text-blue-900">Calendário de Posts — {MESES[mes]} {ano}</h2>
            <p className="text-xs text-blue-400 mt-0.5">Registre os posts publicados clicando em um dia</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA_ABREV.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-blue-300 py-2">{d}</div>
            ))}
          </div>
          {semanas.map((semana, si) => (
            <div key={si} className="grid grid-cols-7 border-t border-blue-50">
              {semana.map((celula, ci) => {
                const isMesAtual = !celula.mes
                const postsDoDia = posts.filter(p => p.dia === celula.dia && isMesAtual)
                return (
                  <div key={ci} onClick={() => isMesAtual && abrirModal(celula.dia)}
                    className={`min-h-[80px] p-2 border-r border-blue-50 last:border-r-0 transition-colors ${isMesAtual ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-50/50'}`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold ${isMesAtual ? 'text-gray-700' : 'text-gray-300'}`}>{celula.dia}</span>
                      {isMesAtual && leadsPorDia[celula.dia] > 0 && (
                        <span onClick={e => { e.stopPropagation(); setModalLeadsDia({ dia: celula.dia, leads: leadsDetalhadosPorDia[celula.dia] || [] }) }}
                          className="inline-flex items-center gap-0.5 bg-amber-400 hover:bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none cursor-pointer transition-colors">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                          {leadsPorDia[celula.dia]}
                        </span>
                      )}
                    </div>
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

      {/* ===== ROTINA SEMANAL (template) ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        <div className="bg-brand-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0">📌</div>
            <div>
              <h2 className="text-base font-bold text-white">Rotina Semanal</h2>
              <p className="text-xs text-brand-100 mt-0.5">Configure as tarefas recorrentes por dia da semana</p>
            </div>
          </div>
          {aprovacoesPendentes > 0 && (
            <span className="bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
              {aprovacoesPendentes} aguardando aprovação
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {[0,1,2,3,4,5,6].map(dow => {
              const tasks = templateDoDia(rotina, dow)
              return (
                <div key={dow} className="min-h-[100px]">
                  <p className="text-xs font-semibold text-brand-500 text-center mb-2">{DIAS_SEMANA_ABREV[dow]}</p>
                  <div className="space-y-1">
                    {tasks.map(t => (
                      <div key={t.id} className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium flex items-center justify-between gap-0.5 ${corDoTipoRotina(t.tipo)}`}>
                        <span className="truncate min-w-0">{t.texto}</span>
                        <button onClick={() => removerTplTask(dow, t.id)} className="opacity-40 hover:opacity-100 text-xs leading-none flex-shrink-0">×</button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setModalTpl({ dow }); setFormTpl(FORM_TPL_VAZIO) }}
                    className="mt-1.5 w-full text-xs text-brand-300 hover:text-brand-500 hover:bg-brand-50 rounded-lg py-1 transition-colors text-center"
                  >+ adicionar</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ===== ROTINA DO MÊS (calendário) ===== */}
      <div className="bg-brand-50 rounded-2xl shadow-sm border border-brand-200 overflow-hidden">
        <div className="bg-brand-400 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0">🗓️</div>
          <div>
            <h2 className="text-base font-bold text-white">Rotina da Social Media — {MESES[mes]} {ano}</h2>
            <p className="text-xs text-brand-100 mt-0.5">Clique em um dia para ver e atualizar as tarefas</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA_ABREV.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-brand-400 py-2">{d}</div>
            ))}
          </div>
          {semanas.map((semana, si) => (
            <div key={si} className="grid grid-cols-7 border-t border-gray-100">
              {semana.map((celula, ci) => {
                const isMesAtual = !celula.mes
                const dateKey = `${ano}-${mes}-${celula.dia}`
                const tarefas = isMesAtual ? (rotina[dateKey] || []) : []
                const tplTasks = isMesAtual ? templateDoDia(rotina, ci) : []
                const temAprovacao = tarefas.some(t => t.status === 'Aguardando aprovação') ||
                  tplTasks.some(t => statusTpl(rotina, dateKey, t.id) === 'Aguardando aprovação')
                return (
                  <div key={ci}
                    onClick={() => isMesAtual && (setModalRotina({ dateKey, dow: ci, label: `${celula.dia} de ${MESES[mes]} — ${DIAS_SEMANA_FULL[ci]}` }), setFormRotina(FORM_ROTINA_VAZIO))}
                    className={`min-h-[80px] p-2 border-r border-brand-100 last:border-r-0 transition-colors relative ${isMesAtual ? 'cursor-pointer hover:bg-brand-100' : 'bg-brand-50/50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isMesAtual ? 'text-brand-700' : 'text-brand-200'}`}>{celula.dia}</span>
                      {temAprovacao && <span className="w-2 h-2 bg-orange-400 rounded-full" title="Aguardando aprovação" />}
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {tplTasks.slice(0, 2).map(t => {
                        const st = statusTpl(rotina, dateKey, t.id)
                        const cor = corDoStatus(st)
                        return (
                          <div key={t.id} className={`text-[10px] px-1 py-0.5 rounded font-medium truncate ${cor} opacity-80`}>
                            {t.texto}
                          </div>
                        )
                      })}
                      {tarefas.slice(0, 2).map(t => (
                        <div key={t.id} className={`text-[10px] px-1 py-0.5 rounded font-medium truncate ${corDoStatus(t.status || 'A fazer')}`}>
                          {t.texto}
                        </div>
                      ))}
                      {(tplTasks.length + tarefas.length) > 4 && (
                        <div className="text-[10px] text-brand-300 text-center">+{tplTasks.length + tarefas.length - 4}</div>
                      )}
                      {isMesAtual && tplTasks.length === 0 && tarefas.length === 0 && (
                        <div className="text-xs text-brand-200 mt-2 text-center">+</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legenda status */}
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {STATUS_ROTINA.map(s => (
            <span key={s.label} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.cor}`}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* ===== MODAL DIA (rotina + template) ===== */}
      {modalRotina && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setModalRotina(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-800">📅 {modalRotina.label}</h2>
              <button onClick={() => setModalRotina(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

              {/* Rotina do dia (template) */}
              {templateDoDia(rotina, modalRotina.dow).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Rotina do dia</p>
                  <div className="space-y-2">
                    {templateDoDia(rotina, modalRotina.dow).map(t => {
                      const st = statusTpl(rotina, modalRotina.dateKey, t.id)
                      const corInfo = STATUS_ROTINA.find(s => s.label === st) || STATUS_ROTINA[0]
                      return (
                        <div key={t.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{t.texto}</p>
                            {t.formato && <p className="text-xs text-gray-400">{t.formato}</p>}
                          </div>
                          <button
                            onClick={(e) => avancarStatusTpl(modalRotina.dateKey, t.id, e)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors hover:opacity-80 ${corInfo.cor}`}
                            title="Clique para avançar status"
                          >
                            {st}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tarefas específicas do dia */}
              {(rotina[modalRotina.dateKey] || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Tarefas específicas</p>
                  <div className="space-y-2">
                    {(rotina[modalRotina.dateKey] || []).map(t => {
                      const corInfo = STATUS_ROTINA.find(s => s.label === (t.status || 'A fazer')) || STATUS_ROTINA[0]
                      return (
                        <div key={t.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{t.texto}</p>
                            {t.horario && <p className="text-xs text-gray-400">🕐 {t.horario}</p>}
                          </div>
                          <button
                            onClick={(e) => avancarStatusTarefa(modalRotina.dateKey, t.id, e)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap hover:opacity-80 transition-colors ${corInfo.cor}`}
                            title="Clique para avançar status"
                          >
                            {t.status || 'A fazer'}
                          </button>
                          <button onClick={e => removerTarefaRotina(modalRotina.dateKey, t.id, e)} className="text-gray-300 hover:text-red-400 text-sm leading-none">×</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Adicionar tarefa específica */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">+ Tarefa específica</p>
                <div className="space-y-3 border border-gray-100 rounded-xl p-4">
                  <input type="text" value={formRotina.texto}
                    onChange={e => setFormRotina(f => ({ ...f, texto: e.target.value }))}
                    placeholder="Ex: Criar post de aniversário da clínica"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={formRotina.tipo} onChange={e => setFormRotina(f => ({ ...f, tipo: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
                      <option value="">Tipo *</option>
                      {ROTINA_TIPOS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                    </select>
                    <select value={formRotina.formato} onChange={e => setFormRotina(f => ({ ...f, formato: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
                      <option value="">Formato</option>
                      {ROTINA_FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={formRotina.horario}
                      onChange={e => setFormRotina(f => ({ ...f, horario: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white" />
                    <select value={formRotina.status} onChange={e => setFormRotina(f => ({ ...f, status: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
                      {STATUS_ROTINA.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                    </select>
                  </div>
                  <textarea value={formRotina.comentario}
                    onChange={e => setFormRotina(f => ({ ...f, comentario: e.target.value }))}
                    placeholder="Observações..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 resize-none" />
                  <button onClick={adicionarTarefaRotina} disabled={!formRotina.texto.trim() || !formRotina.tipo}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                    Adicionar tarefa
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModalRotina(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL TEMPLATE SEMANAL ===== */}
      {modalTpl && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setModalTpl(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">📌 Rotina de {DIAS_SEMANA_FULL[modalTpl.dow]}</h2>
              <button onClick={() => setModalTpl(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {/* Lista atual */}
              {templateDoDia(rotina, modalTpl.dow).length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {templateDoDia(rotina, modalTpl.dow).map(t => (
                    <div key={t.id} className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${corDoTipoRotina(t.tipo)}`}>
                      <span className="truncate">{t.texto}{t.formato ? ` · ${t.formato}` : ''}</span>
                      <button onClick={() => removerTplTask(modalTpl.dow, t.id)} className="opacity-40 hover:opacity-100 flex-shrink-0">×</button>
                    </div>
                  ))}
                </div>
              )}
              {/* Adicionar */}
              <input autoFocus type="text" value={formTpl.texto}
                onChange={e => setFormTpl(f => ({ ...f, texto: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') adicionarTplTask() }}
                placeholder="Ex: Postar Reels, Responder DMs..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
              <div className="grid grid-cols-2 gap-2">
                <select value={formTpl.tipo} onChange={e => setFormTpl(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
                  {ROTINA_TIPOS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                </select>
                <select value={formTpl.formato} onChange={e => setFormTpl(f => ({ ...f, formato: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
                  <option value="">Formato</option>
                  {ROTINA_FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <button onClick={adicionarTplTask} disabled={!formTpl.texto.trim()}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                Adicionar à rotina
              </button>
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
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Formato</label>
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
                    <a href={form.link.startsWith('http') ? form.link : `https://${form.link}`} target="_blank" rel="noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.impulsionado} onChange={e => setForm(f => ({ ...f, impulsionado: e.target.checked }))} className="w-4 h-4 accent-brand-400" />
                <span className="text-sm text-gray-600">Post Impulsionado</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">Cancelar</button>
              <button onClick={salvarPost} disabled={!form.tipo} className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal leads do dia */}
      {modalLeadsDia && (() => {
        const STATUS_LEAD = [
          { key: 'pendente',    label: 'Pendente',    bg: 'bg-gray-100',   text: 'text-gray-500' },
          { key: 'tentativa',   label: 'Tentativa',   bg: 'bg-yellow-100', text: 'text-yellow-600' },
          { key: 'conversando', label: 'Conversando', bg: 'bg-blue-100',   text: 'text-blue-600' },
          { key: 'follow1',     label: 'Follow #1',   bg: 'bg-orange-100', text: 'text-orange-500' },
          { key: 'follow2',     label: 'Follow #2',   bg: 'bg-yellow-100', text: 'text-yellow-600' },
          { key: 'agendado',    label: 'Agendou',     bg: 'bg-green-100',  text: 'text-green-600' },
          { key: 'perdido',     label: 'Perdido',     bg: 'bg-red-100',    text: 'text-red-500' },
        ]
        const agendados = modalLeadsDia.leads.filter(l => l.status === 'agendado').length
        const conversao = modalLeadsDia.leads.length > 0 ? Math.round((agendados / modalLeadsDia.leads.length) * 100) : 0
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalLeadsDia(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-400 flex-shrink-0"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  <h2 className="text-base font-bold text-gray-800">Leads do dia {String(modalLeadsDia.dia).padStart(2,'0')}/{String(mes+1).padStart(2,'0')}</h2>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{conversao}% de conversão</span>
                </div>
                <button onClick={() => setModalLeadsDia(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none flex-shrink-0">×</button>
              </div>
              <div className="space-y-2">
                {modalLeadsDia.leads.map(lead => {
                  const s = STATUS_LEAD.find(x => x.key === lead.status) || { label: lead.status || '—', bg: 'bg-gray-100', text: 'text-gray-500' }
                  const temTelefone = !!lead.telefone
                  return (
                    <div key={lead.id}
                      onClick={() => { if (temTelefone) { window.dispatchEvent(new CustomEvent('navegarInbox', { detail: { telefone: lead.telefone, contaTipo: 'Leads Novos' } })); setModalLeadsDia(null) } }}
                      className={`border rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-colors ${temTelefone ? 'border-gray-200 cursor-pointer hover:border-brand-300 hover:bg-brand-50' : 'border-gray-100 opacity-60'}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.nome}</p>
                        <p className="text-xs text-gray-400">{lead.fonte || lead.origemCustom || '—'}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                    </div>
                  )
                })}
                {modalLeadsDia.leads.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum lead neste dia</p>}
              </div>
              {modalLeadsDia.leads.some(l => l.telefone) && (
                <p className="text-xs text-gray-400 text-center mt-4">Clique no lead para abrir a conversa no inbox</p>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
