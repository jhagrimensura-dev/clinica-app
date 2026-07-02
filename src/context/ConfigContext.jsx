import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const ConfigContext = createContext()

const KEYS = ['config_clinica', 'config_perfil', 'config_equipe', 'procedimentos_cadastro', 'lead_origens', 'lead_status', 'lead_midias', 'faturamento_responsaveis', 'ia_conhecimento', 'ia_exemplos', 'respostas_rapidas']

const DEFAULTS = {
  config_clinica: {},
  config_perfil: {},
  config_equipe: [],
  procedimentos_cadastro: null,
  lead_origens: null,
  lead_status: null,
  lead_midias: null,
  faturamento_responsaveis: null,
  ia_conhecimento: '',
  ia_exemplos: [],
  respostas_rapidas: [],
}

export function ConfigProvider({ children }) {
  const [cfg, setCfg] = useState(DEFAULTS)
  const [novaVersao, setNovaVersao] = useState(false)
  const saveTimers = useRef({})
  const loaded = useRef(false)

  const loadFromDB = async () => {
    const { data } = await supabase.from('configuracoes').select('chave,valor').in('chave', KEYS)
    if (data && data.length > 0) {
      const map = {}
      data.forEach(r => { map[r.chave] = r.valor })
      setCfg(prev => ({ ...prev, ...map }))
    }
    return data
  }

  useEffect(() => {
    // Carga inicial
    loadFromDB().then(async (data) => {
      if (!loaded.current) {
        loaded.current = true
        // Migra do localStorage se não tem dados no Supabase
        const faltando = KEYS.filter(k => !data?.find(r => r.chave === k))
        const rows = []
        for (const key of faltando) {
          const local = localStorage.getItem(key)
          if (local) {
            try {
              const valor = JSON.parse(local)
              rows.push({ chave: key, valor })
              setCfg(prev => ({ ...prev, [key]: valor }))
            } catch { }
          }
        }
        if (rows.length > 0) await supabase.from('configuracoes').upsert(rows, { onConflict: 'chave' })
      }
    })

    const onVisible = () => { if (document.visibilityState === 'visible') loadFromDB() }
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(loadFromDB, 10000)

    // Rastreia última atividade do usuário
    let ultimaAtividade = Date.now()
    const registrarAtividade = () => { ultimaAtividade = Date.now() }
    window.addEventListener('mousemove', registrarAtividade)
    window.addEventListener('keydown', registrarAtividade)
    window.addEventListener('click', registrarAtividade)

    // Detecta novo deploy: recarrega se inativo há 3+ min, senão mostra banner
    const currentScript = [...document.querySelectorAll('script[src]')]
      .find(s => s.src.includes('/assets/index-'))
    const currentSrc = currentScript ? new URL(currentScript.src).pathname : null
    const versionInterval = currentSrc ? setInterval(async () => {
      try {
        const res = await fetch('/?_v=' + Date.now(), { cache: 'no-store' })
        const html = await res.text()
        const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
        if (match && match[1] !== currentSrc) {
          const inativo = Date.now() - ultimaAtividade > 3 * 60 * 1000
          if (inativo) window.location.reload()
          else setNovaVersao(true)
        }
      } catch {}
    }, 30000) : null

    // Realtime: configs + canal de reload forçado
    const channel = supabase
      .channel('configuracoes_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, ({ new: n }) => {
        if (n && KEYS.includes(n.chave)) setCfg(prev => ({ ...prev, [n.chave]: n.valor }))
        if (n?.chave === 'app_force_reload') window.location.reload()
      })
      .subscribe()

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('mousemove', registrarAtividade)
      window.removeEventListener('keydown', registrarAtividade)
      window.removeEventListener('click', registrarAtividade)
      clearInterval(interval)
      if (versionInterval) clearInterval(versionInterval)
      supabase.removeChannel(channel)
    }
  }, [])

  const setKey = async (chave, valor) => {
    setCfg(prev => ({ ...prev, [chave]: valor }))
    // Salva imediatamente (sem debounce para listas)
    if (Array.isArray(valor)) {
      const { error } = await supabase.from('configuracoes').upsert({ chave, valor }, { onConflict: 'chave' })
      if (error) console.error('ConfigContext save error:', chave, error)
      return
    }
    if (saveTimers.current[chave]) clearTimeout(saveTimers.current[chave])
    saveTimers.current[chave] = setTimeout(async () => {
      const { error } = await supabase.from('configuracoes').upsert({ chave, valor }, { onConflict: 'chave' })
      if (error) console.error('ConfigContext save error:', chave, error)
    }, 600)
  }

  return (
    <>
    {novaVersao && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-brand-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
        <span>Nova versão disponível</span>
        <button onClick={() => window.location.reload()}
          className="bg-white text-brand-600 font-semibold text-xs px-3 py-1 rounded-full hover:bg-brand-50 transition-colors">
          Atualizar agora
        </button>
        <button onClick={() => setNovaVersao(false)} className="opacity-60 hover:opacity-100 text-white ml-1">✕</button>
      </div>
    )}
    <ConfigContext.Provider value={{
      clinicaDados: cfg.config_clinica,
      setClinicaDados: (v) => setKey('config_clinica', v),
      perfilDados: cfg.config_perfil,
      setPerfilDados: (v) => setKey('config_perfil', v),
      equipeDados: cfg.config_equipe,
      setEquipeDados: (v) => setKey('config_equipe', v),
      procedimentos: cfg.procedimentos_cadastro,
      setProcedimentos: (v) => setKey('procedimentos_cadastro', v),
      leadOrigens: cfg.lead_origens,
      setLeadOrigens: (v) => setKey('lead_origens', v),
      leadStatus: cfg.lead_status,
      setLeadStatus: (v) => setKey('lead_status', v),
      leadMidias: cfg.lead_midias,
      setLeadMidias: (v) => setKey('lead_midias', v),
      faturamentoResponsaveis: cfg.faturamento_responsaveis,
      setFaturamentoResponsaveis: (v) => setKey('faturamento_responsaveis', v),
      iaConhecimento: cfg.ia_conhecimento,
      setIaConhecimento: (v) => setKey('ia_conhecimento', v),
      iaExemplos: cfg.ia_exemplos,
      setIaExemplos: (v) => setKey('ia_exemplos', v),
      respostasRapidas: cfg.respostas_rapidas,
      setRespostasRapidas: (v) => setKey('respostas_rapidas', v),
    }}>
      {children}
    </ConfigContext.Provider>
    </>
  )
}

export const useConfig = () => useContext(ConfigContext)
