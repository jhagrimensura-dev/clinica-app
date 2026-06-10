import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function loadConta() {
  try { const s = localStorage.getItem('config_whatsapp_contas'); return s ? JSON.parse(s)[0] : null } catch { return null }
}

function tocarSom() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

const TITULO_BASE = document.title || 'Clínica'

export default function WhatsAppFAB({ onOpen }) {
  const [naoLidas, setNaoLidas] = useState(0)
  const [pulsar, setPulsar] = useState(false)
  const ultimoTsRef = useRef(Date.now()) // ignora msgs antigas no load
  const jaInteragiuRef = useRef(false)

  useEffect(() => {
    const handler = () => { jaInteragiuRef.current = true }
    window.addEventListener('click', handler, { once: true })
    return () => window.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    if (naoLidas > 0) {
      document.title = `(${naoLidas}) 💬 ${TITULO_BASE}`
    } else {
      document.title = TITULO_BASE
    }
  }, [naoLidas])

  useEffect(() => {
    const conta = loadConta()
    if (!conta?.instanciaId) return

    async function checar() {
      const agora = Date.now()
      const { data } = await supabase
        .from('whatsapp_mensagens')
        .select('id, nome_contato, texto, timestamp_ms')
        .eq('instancia_id', conta.instanciaId)
        .eq('de_mim', false)
        .gt('timestamp_ms', ultimoTsRef.current)
        .order('timestamp_ms', { ascending: false })
        .limit(10)

      if (data && data.length > 0) {
        ultimoTsRef.current = data[0].timestamp_ms
        setNaoLidas(prev => prev + data.length)
        setPulsar(true)
        setTimeout(() => setPulsar(false), 3000)
        if (jaInteragiuRef.current) tocarSom()
      }
    }

    const interval = setInterval(checar, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <button
      onClick={() => { onOpen(); setNaoLidas(0); document.title = TITULO_BASE }}
      title="WhatsApp Inbox"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center"
    >
      {pulsar && (
        <>
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
          <span className="absolute inset-0 rounded-full bg-green-300 animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
        </>
      )}

      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white relative z-10">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.532 5.858L.057 23.57a.75.75 0 00.918.919l5.82-1.49A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.5-5.24-1.375l-.374-.214-3.88.994.995-3.792-.228-.382A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>

      {naoLidas > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow z-10">
          {naoLidas > 99 ? '99+' : naoLidas}
        </span>
      )}
    </button>
  )
}
