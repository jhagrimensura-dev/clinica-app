import { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const TIPO_LABELS = {
  preco:      { label: 'Preço',       color: 'bg-red-100 text-red-700'      },
  tempo:      { label: 'Tempo',       color: 'bg-orange-100 text-orange-700' },
  medo:       { label: 'Medo/Dor',   color: 'bg-yellow-100 text-yellow-700' },
  duvida:     { label: 'Dúvida',     color: 'bg-blue-100 text-blue-700'     },
  comparacao: { label: 'Comparação', color: 'bg-purple-100 text-purple-700' },
  outro:      { label: 'Outro',       color: 'bg-gray-100 text-gray-700'    },
}

const TEMP_CONFIG = {
  frio:   { label: 'Frio',   dot: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  morno:  { label: 'Morno',  dot: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  quente: { label: 'Quente', dot: 'bg-green-400',  bg: 'bg-green-50',  text: 'text-green-700'  },
}

const PESO_COLOR = { alto: 'bg-red-100 text-red-700', médio: 'bg-yellow-100 text-yellow-700', baixo: 'bg-gray-100 text-gray-500' }
const FORMATO_ICON = { 'Reels': '🎬', 'Carrossel': '🖼️', 'Stories': '📱', 'Post estático': '📸', 'Vídeo longo': '🎥' }

function formatData(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function analiseParaTexto(nome, a) {
  const objs = (a.objecoes || []).map(o => `- ${o.objecao}: ${o.como_responder}`).join('\n')
  const passos = (a.proximos_passos || []).map((p, i) => `${i+1}. ${p}`).join('\n')
  return `=== ${nome} (${a.temperatura || ''}) ===\nResumo: ${a.resumo || ''}\nPerfil: ${a.perfil_lead || ''}\n\nObjeções:\n${objs}\n\nPróximos passos:\n${passos}`
}

/* ── Card de resultado ── */
function ResultadoCard({ analise, nomeLead, onNova, onCopiarParaEstrategia }) {
  const temp = TEMP_CONFIG[analise.temperatura] || TEMP_CONFIG.frio
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-semibold text-gray-800">{nomeLead}</p>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${temp.bg} ${temp.text}`}>
            <span className={`w-2 h-2 rounded-full ${temp.dot}`} />
            {temp.label}
          </span>
        </div>
        <div className="flex gap-2">
          {onCopiarParaEstrategia && (
            <button onClick={onCopiarParaEstrategia}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-semibold">
              Usar na estratégia
            </button>
          )}
          <button onClick={onNova} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            Nova análise
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{analise.resumo}</p>
        {analise.perfil_lead && <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">{analise.perfil_lead}</p>}
      </div>

      {analise.temperatura_motivo && (
        <div className={`rounded-2xl px-5 py-4 ${temp.bg}`}>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-1 ${temp.text}`}>Por que {temp.label.toLowerCase()}?</h2>
          <p className={`text-sm ${temp.text}`}>{analise.temperatura_motivo}</p>
        </div>
      )}

      {analise.objecoes?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Objeções ({analise.objecoes.length})</h2>
          <div className="space-y-4">
            {analise.objecoes.map((obj, i) => {
              const tipo = TIPO_LABELS[obj.tipo] || TIPO_LABELS.outro
              return (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${tipo.color}`}>{tipo.label}</span>
                    <p className="text-sm font-semibold text-gray-800">{obj.objecao}</p>
                  </div>
                  {obj.trecho && (
                    <blockquote className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2 mb-3 border-l-2 border-gray-200">"{obj.trecho}"</blockquote>
                  )}
                  <div className="bg-green-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-bold text-green-600 mb-1">Como responder</p>
                    <p className="text-sm text-green-800">{obj.como_responder}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {analise.proximos_passos?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Próximos passos</h2>
          <ul className="space-y-2">
            {analise.proximos_passos.map((passo, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                {passo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── ABA 1: Analisador individual ── */
function AbaAnalisar({ onCopiarParaEstrategia }) {
  const { clinicaId } = useAuth()
  const [texto, setTexto] = useState('')
  const [nomeLead, setNomeLead] = useState('')
  const [analise, setAnalise] = useState(null)
  const [nomeAtual, setNomeAtual] = useState('')
  const [nomeSalvar, setNomeSalvar] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvoId, setSalvoId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [drag, setDrag] = useState(false)
  const [historico, setHistorico] = useState([])
  const [loadingHist, setLoadingHist] = useState(true)
  const [histAberto, setHistAberto] = useState(false)
  const [excluindo, setExcluindo] = useState(null)
  const inputRef = useRef(null)

  const carregarHistorico = useCallback(async () => {
    if (!clinicaId) return
    setLoadingHist(true)
    const { data } = await supabase
      .from('analises_conversas')
      .select('id, nome_lead, resultado, criado_em')
      .order('criado_em', { ascending: false })
      .limit(50)
    setHistorico(data || [])
    setLoadingHist(false)
  }, [clinicaId])

  useEffect(() => { carregarHistorico() }, [carregarHistorico])

  function lerArquivo(file) {
    if (!file) return
    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    const isTxt = file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md')
    if (!isPdf && !isTxt) { setErro('Apenas .txt ou .pdf são suportados.'); return }
    setNomeArquivo(file.name); setErro(''); setAnalise(null)
    if (isTxt) {
      const reader = new FileReader()
      reader.onload = e => setTexto(e.target.result)
      reader.readAsText(file, 'UTF-8')
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const typedArray = new Uint8Array(e.target.result)
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise
        let fullText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          fullText += content.items.map(item => item.str).join(' ') + '\n'
        }
        setTexto(fullText.trim())
      } catch { setErro('Não foi possível ler o PDF. Tente converter para .txt.') }
      finally { setLoading(false) }
    }
    reader.readAsArrayBuffer(file)
  }

  async function analisar() {
    if (!texto.trim()) { setErro('Cole ou envie um arquivo com a transcrição.'); return }
    setLoading(true); setErro(''); setAnalise(null); setSalvoId(null)
    try {
      const res = await fetch('/api/analisar-transcricao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao analisar'); return }
      setAnalise(data)
      const nome = nomeLead.trim() || nomeArquivo.replace(/\.(txt|pdf|md)$/i, '') || ''
      setNomeAtual(nome)
      setNomeSalvar(nome)
    } catch (e) { setErro(e.message) }
    finally { setLoading(false) }
  }

  async function salvar() {
    if (!clinicaId || !analise) return
    const nome = nomeSalvar.trim() || 'Sem nome'
    setSalvando(true)
    const { data } = await supabase.from('analises_conversas').insert({ clinica_id: clinicaId, nome_lead: nome, resultado: analise }).select('id').single()
    setSalvoId(data?.id || true)
    setNomeAtual(nome)
    carregarHistorico()
    setSalvando(false)
  }

  async function excluir(id) {
    setExcluindo(id)
    await supabase.from('analises_conversas').delete().eq('id', id)
    setHistorico(prev => prev.filter(h => h.id !== id))
    setExcluindo(null)
  }

  function limpar() {
    setTexto(''); setAnalise(null); setErro(''); setNomeArquivo(''); setNomeLead(''); setNomeAtual(''); setNomeSalvar(''); setSalvoId(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function verSalvo(item) {
    setAnalise(item.resultado)
    setNomeAtual(item.nome_lead)
    setHistAberto(false)
  }

  return (
    <div className="space-y-4">
      {/* Histórico */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => setHistAberto(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <span className="flex items-center gap-2">
            🗂️ Análises salvas
            {historico.length > 0 && <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-bold">{historico.length}</span>}
          </span>
          <span className="text-gray-400 text-xs">{histAberto ? '▲' : '▼'}</span>
        </button>
        {histAberto && (
          <div className="border-t border-gray-100">
            {loadingHist ? (
              <p className="text-sm text-gray-400 px-5 py-4">Carregando...</p>
            ) : historico.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-4">Nenhuma análise salva ainda.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {historico.map(item => {
                  const temp = TEMP_CONFIG[item.resultado?.temperatura] || TEMP_CONFIG.frio
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.nome_lead}</p>
                        <p className="text-xs text-gray-400">{formatData(item.criado_em)}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${temp.bg} ${temp.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${temp.dot}`} />
                        {temp.label}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => verSalvo(item)}
                          className="text-xs px-2 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-semibold whitespace-nowrap">
                          Ver
                        </button>
                        <button onClick={() => onCopiarParaEstrategia(analiseParaTexto(item.nome_lead, item.resultado))}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold whitespace-nowrap">
                          Estratégia
                        </button>
                        <button onClick={() => excluir(item.id)} disabled={excluindo === item.id}
                          className="text-xs px-2 py-1 rounded-lg text-red-400 hover:bg-red-50 font-semibold">
                          {excluindo === item.id ? '...' : '✕'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload / Resultado */}
      {/* Painel de salvar (após análise) */}
      {analise && !salvoId && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-brand-700 block mb-1.5">Salvar esta análise como:</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white text-gray-800"
              placeholder="Nome do lead / paciente..."
              value={nomeSalvar}
              onChange={e => setNomeSalvar(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvar()}
              autoFocus
            />
          </div>
          <button onClick={salvar} disabled={salvando}
            className="w-full sm:w-auto flex-shrink-0 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all whitespace-nowrap">
            {salvando ? 'Salvando...' : '💾 Salvar'}
          </button>
        </div>
      )}
      {analise && salvoId && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-green-700 font-semibold">
          ✓ Análise salva como "{nomeAtual}"
        </div>
      )}

      {!analise ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Nome do lead / paciente</label>
            <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 text-gray-800"
              placeholder="ex: Maria Silva" value={nomeLead} onChange={e => setNomeLead(e.target.value)} />
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${drag ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); lerArquivo(e.dataTransfer.files[0]) }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".txt,.md,.pdf" className="hidden" onChange={e => lerArquivo(e.target.files[0])} />
            <div className="text-3xl mb-2">📄</div>
            {nomeArquivo
              ? <p className="text-sm font-medium text-brand-600">{nomeArquivo}</p>
              : <><p className="text-sm font-medium text-gray-700">Arraste o arquivo ou clique para selecionar</p><p className="text-xs text-gray-400 mt-1">.txt ou .pdf</p></>
            }
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ou cole a transcrição</p>
            <textarea className="w-full h-36 text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-200 text-gray-700"
              placeholder="Cole aqui o texto da conversa..." value={texto}
              onChange={e => { setTexto(e.target.value); setNomeArquivo('') }} />
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex gap-3">
            <button onClick={analisar} disabled={loading || !texto.trim()}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all text-sm">
              {loading ? 'Analisando...' : 'Analisar Conversa'}
            </button>
            {(texto || nomeArquivo) && (
              <button onClick={limpar} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">Limpar</button>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-brand-500">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              A IA está analisando...
            </div>
          )}
        </div>
      ) : (
        <ResultadoCard
          analise={analise}
          nomeLead={nomeAtual}
          onNova={limpar}
          onCopiarParaEstrategia={() => onCopiarParaEstrategia(analiseParaTexto(nomeAtual, analise))}
        />
      )}
    </div>
  )
}

/* ── ABA 2: Estratégia de conteúdo ── */
function AbaEstrategia({ analisesCopadas, onLimparCopadas }) {
  const [analises, setAnalises] = useState(analisesCopadas || '')
  const [especialidade, setEspecialidade] = useState('')
  const [canais, setCanais] = useState('')
  const [frequencia, setFrequencia] = useState('')
  const [conselho, setConselho] = useState('')
  const [estrategia, setEstrategia] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [secaoAberta, setSecaoAberta] = useState(null)

  useEffect(() => {
    if (analisesCopadas) {
      setAnalises(prev => prev ? prev + '\n---\n' + analisesCopadas : analisesCopadas)
      onLimparCopadas()
    }
  }, [analisesCopadas])

  async function gerar() {
    if (!analises.trim()) { setErro('Cole as análises das consultas.'); return }
    setLoading(true); setErro(''); setEstrategia(null)
    try {
      const res = await fetch('/api/estrategia-conteudo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analises, especialidade, canais, frequencia, conselho }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao gerar estratégia'); return }
      setEstrategia(data)
      setSecaoAberta('mapa')
    } catch (e) { setErro(e.message) }
    finally { setLoading(false) }
  }

  const secoes = estrategia ? [
    { id: 'mapa',       label: 'Mapa de Objeções',       icon: '🗺️', count: estrategia.mapa_objecoes?.length },
    { id: 'ranking',    label: 'Ranking',                 icon: '📊', count: estrategia.ranking?.length },
    { id: 'calendario', label: 'Calendário 30 dias',      icon: '📅', count: estrategia.calendario?.length },
    { id: 'whatsapp',   label: 'Mensagens WhatsApp',      icon: '💬', count: estrategia.whatsapp?.length },
    { id: 'faq',        label: 'FAQ',                     icon: '❓', count: estrategia.faq?.length },
    { id: 'lacunas',    label: 'Lacunas (só na consulta)', icon: '🔒', count: estrategia.lacunas?.length },
  ] : []

  return (
    <div className="space-y-4">
      {!estrategia && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Contexto da clínica</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Especialidade / serviço</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="ex: harmonização facial" value={especialidade} onChange={e => setEspecialidade(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Canais que usa</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="ex: Instagram, WhatsApp" value={canais} onChange={e => setCanais(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Frequência de posts</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="ex: 4 posts por semana" value={frequencia} onChange={e => setFrequencia(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Conselho profissional</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="ex: CFM, CFO, CFBM" value={conselho} onChange={e => setConselho(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">
                Análises das consultas
                <span className="text-gray-400 font-normal ml-1">(separe cada uma com ---)</span>
              </label>
              {analises && <button onClick={() => setAnalises('')} className="text-xs text-red-400 hover:text-red-600">Limpar</button>}
            </div>
            <textarea className="w-full h-48 text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-200 text-gray-700 font-mono"
              placeholder={'Cole aqui as análises ou use o botão "Usar na estratégia" na aba anterior'}
              value={analises} onChange={e => setAnalises(e.target.value)} />
            {analises && (
              <p className="text-xs text-gray-400 mt-1">
                {(analises.match(/===/g) || []).length} consulta(s) detectada(s)
              </p>
            )}
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

          <button onClick={gerar} disabled={loading || !analises.trim()}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all text-sm">
            {loading ? 'Gerando estratégia...' : 'Gerar Estratégia de Conteúdo'}
          </button>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-brand-500">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              Isso pode levar até 30 segundos...
            </div>
          )}
        </div>
      )}

      {estrategia && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Estratégia gerada</p>
            <button onClick={() => setEstrategia(null)} className="text-sm text-brand-500 hover:text-brand-700 font-medium">Gerar nova</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {secoes.map(s => (
              <button key={s.id} onClick={() => setSecaoAberta(secaoAberta === s.id ? null : s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${secaoAberta === s.id ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                {s.icon} {s.label} {s.count != null && <span className={`ml-0.5 ${secaoAberta === s.id ? 'text-brand-100' : 'text-gray-400'}`}>({s.count})</span>}
              </button>
            ))}
          </div>

          {secaoAberta === 'mapa' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mapa de Objeções</h2>
              {estrategia.mapa_objecoes?.map((obj, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PESO_COLOR[obj.peso] || PESO_COLOR['baixo']}`}>{obj.peso}</span>
                    <p className="text-sm font-bold text-gray-800">{obj.tema}</p>
                    <span className="text-xs text-gray-400 ml-auto">{obj.frequencia}× nas consultas</span>
                  </div>
                  <p className="text-sm text-gray-600">{obj.descricao}</p>
                  {obj.subtemas?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {obj.subtemas.map((s, j) => <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {secaoAberta === 'ranking' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ranking — o que mais trava a decisão</h2>
              {estrategia.ranking?.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 font-bold text-sm flex items-center justify-center flex-shrink-0">{r.posicao}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.tema}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.motivo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {secaoAberta === 'calendario' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Calendário de 30 dias</h2>
              {estrategia.calendario?.map((dia, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 font-bold text-xs flex items-center justify-center flex-shrink-0">D{dia.dia}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{FORMATO_ICON[dia.formato] || '📌'} {dia.formato}</span>
                    <span className="text-xs text-gray-400">{dia.tema_objecao}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">"{dia.gancho}"</p>
                  <p className="text-xs text-gray-600 mb-2">{dia.roteiro}</p>
                  <p className="text-xs font-semibold text-brand-600">CTA: {dia.cta}</p>
                </div>
              ))}
            </div>
          )}

          {secaoAberta === 'whatsapp' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mensagens para WhatsApp</h2>
              {estrategia.whatsapp?.map((msg, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">{msg.tipo}</span>
                    <p className="text-xs text-gray-500">Responde: {msg.objecao}</p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{msg.mensagem}</p>
                </div>
              ))}
            </div>
          )}

          {secaoAberta === 'faq' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">FAQ</h2>
              {estrategia.faq?.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1">❓ {item.pergunta}</p>
                  <p className="text-sm text-gray-600">{item.resposta}</p>
                </div>
              ))}
            </div>
          )}

          {secaoAberta === 'lacunas' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-2">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lacunas — só resolvem dentro da consulta</h2>
              {estrategia.lacunas?.map((lacuna, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl">
                  <span className="text-orange-400 mt-0.5">🔒</span>
                  <p className="text-sm text-orange-800">{lacuna}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Página principal ── */
export default function AnalisadorTranscricoes() {
  const [aba, setAba] = useState('analisar')
  const [analiseParaEstrategia, setAnaliseParaEstrategia] = useState(null)

  function copiarParaEstrategia(texto) {
    setAnaliseParaEstrategia(texto)
    setAba('estrategia')
  }

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Análise de Conversas</h1>
        <p className="text-sm text-gray-500 mt-1">Identifique objeções e transforme em estratégia de conteúdo</p>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setAba('analisar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${aba === 'analisar' ? 'bg-brand-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
          📄 Analisar conversa
        </button>
        <button onClick={() => setAba('estrategia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${aba === 'estrategia' ? 'bg-brand-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
          📅 Estratégia de conteúdo
        </button>
      </div>

      {aba === 'analisar'
        ? <AbaAnalisar onCopiarParaEstrategia={copiarParaEstrategia} />
        : <AbaEstrategia analisesCopadas={analiseParaEstrategia} onLimparCopadas={() => setAnaliseParaEstrategia(null)} />
      }
    </div>
  )
}
