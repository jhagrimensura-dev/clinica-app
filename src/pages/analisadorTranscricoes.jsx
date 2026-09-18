import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const TIPO_LABELS = {
  preco:      { label: 'Preço',      color: 'bg-red-100 text-red-700'      },
  tempo:      { label: 'Tempo',      color: 'bg-orange-100 text-orange-700' },
  medo:       { label: 'Medo/Dor',  color: 'bg-yellow-100 text-yellow-700' },
  duvida:     { label: 'Dúvida',    color: 'bg-blue-100 text-blue-700'     },
  comparacao: { label: 'Comparação',color: 'bg-purple-100 text-purple-700' },
  outro:      { label: 'Outro',      color: 'bg-gray-100 text-gray-700'    },
}

const TEMP_CONFIG = {
  frio:   { label: 'Lead Frio',   dot: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  morno:  { label: 'Lead Morno',  dot: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  quente: { label: 'Lead Quente', dot: 'bg-green-400',  bg: 'bg-green-50',  text: 'text-green-700'  },
}

export default function AnalisadorTranscricoes() {
  const [texto, setTexto] = useState('')
  const [analise, setAnalise] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  function lerArquivo(file) {
    if (!file) return
    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    const isTxt = file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md')
    if (!isPdf && !isTxt) {
      setErro('Apenas arquivos .txt ou .pdf são suportados.')
      return
    }
    setNomeArquivo(file.name)
    setErro('')
    setAnalise(null)

    if (isTxt) {
      const reader = new FileReader()
      reader.onload = e => setTexto(e.target.result)
      reader.readAsText(file, 'UTF-8')
      return
    }

    // PDF: extrai texto via pdf.js
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
          const pageText = content.items.map(item => item.str).join(' ')
          fullText += pageText + '\n'
        }
        setTexto(fullText.trim())
      } catch {
        setErro('Não foi possível ler o PDF. Tente converter para .txt.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function onFileChange(e) { lerArquivo(e.target.files[0]) }

  function onDrop(e) {
    e.preventDefault()
    setDrag(false)
    lerArquivo(e.dataTransfer.files[0])
  }

  async function analisar() {
    if (!texto.trim()) { setErro('Cole ou envie um arquivo com a transcrição.'); return }
    setLoading(true)
    setErro('')
    setAnalise(null)
    try {
      const res = await fetch('/api/analisar-transcricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao analisar'); return }
      setAnalise(data)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  function limpar() {
    setTexto('')
    setAnalise(null)
    setErro('')
    setNomeArquivo('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const temp = analise ? TEMP_CONFIG[analise.temperatura] || TEMP_CONFIG.frio : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analisador de Transcrições</h1>
        <p className="text-sm text-gray-500 mt-1">Envie a transcrição de uma conversa para identificar objeções e insights comerciais</p>
      </div>

      {/* Upload area */}
      {!analise && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              drag ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
            }`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".txt,.md,.pdf" className="hidden" onChange={onFileChange} />
            <div className="text-4xl mb-3">📄</div>
            {nomeArquivo ? (
              <p className="text-sm font-medium text-brand-600">{nomeArquivo}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-gray-400 mt-1">Formatos: .txt ou .pdf</p>
              </>
            )}
          </div>

          {/* Ou cole o texto */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ou cole a transcrição</p>
            <textarea
              className="w-full h-40 text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-200 text-gray-700"
              placeholder="Cole aqui o texto da conversa..."
              value={texto}
              onChange={e => { setTexto(e.target.value); setNomeArquivo('') }}
            />
          </div>

          {erro && <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

          <div className="mt-4 flex gap-3">
            <button
              onClick={analisar}
              disabled={loading || !texto.trim()}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all text-sm"
            >
              {loading ? 'Analisando...' : 'Analisar Conversa'}
            </button>
            {(texto || nomeArquivo) && (
              <button onClick={limpar} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">
                Limpar
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-brand-500">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              A IA está analisando a conversa...
            </div>
          )}
        </div>
      )}

      {/* Resultado */}
      {analise && (
        <div className="space-y-4">
          {/* Header resultado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {nomeArquivo && <p className="text-sm text-gray-500">{nomeArquivo}</p>}
              {temp && (
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${temp.bg} ${temp.text}`}>
                  <span className={`w-2 h-2 rounded-full ${temp.dot}`} />
                  {temp.label}
                </span>
              )}
            </div>
            <button
              onClick={limpar}
              className="text-sm text-brand-500 hover:text-brand-700 font-medium"
            >
              Nova análise
            </button>
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{analise.resumo}</p>
            {analise.perfil_lead && (
              <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">{analise.perfil_lead}</p>
            )}
          </div>

          {/* Temperatura — motivo */}
          {analise.temperatura_motivo && temp && (
            <div className={`rounded-2xl px-5 py-4 ${temp.bg} border border-opacity-30`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-1 ${temp.text}`}>
                Por que {temp.label.toLowerCase()}?
              </h2>
              <p className={`text-sm ${temp.text}`}>{analise.temperatura_motivo}</p>
            </div>
          )}

          {/* Objeções */}
          {analise.objecoes?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Objeções identificadas ({analise.objecoes.length})
              </h2>
              <div className="space-y-4">
                {analise.objecoes.map((obj, i) => {
                  const tipo = TIPO_LABELS[obj.tipo] || TIPO_LABELS.outro
                  return (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${tipo.color}`}>
                          {tipo.label}
                        </span>
                        <p className="text-sm font-semibold text-gray-800">{obj.objecao}</p>
                      </div>
                      {obj.trecho && (
                        <blockquote className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2 mb-3 border-l-2 border-gray-200">
                          "{obj.trecho}"
                        </blockquote>
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

          {/* Próximos passos */}
          {analise.proximos_passos?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Próximos passos</h2>
              <ul className="space-y-2">
                {analise.proximos_passos.map((passo, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {passo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
