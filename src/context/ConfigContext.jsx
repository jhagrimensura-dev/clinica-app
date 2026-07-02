import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

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
  const { clinicaId } = useAuth()
  const [cfg, setCfg] = useState(DEFAULTS)
  const saveTimers = useRef({})

  useEffect(() => {
    if (!clinicaId) return
    // Carrega todas as chaves do Supabase
    supabase.from('configuracoes').select('chave,valor').in('chave', KEYS).then(async ({ data }) => {
      if (data && data.length > 0) {
        const map = {}
        data.forEach(r => { map[r.chave] = r.valor })
        setCfg(prev => ({ ...prev, ...map }))
      }

      // Migra chaves ausentes do localStorage
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
      if (rows.length > 0) {
        await supabase.from('configuracoes').upsert(rows, { onConflict: 'chave' })
      }
    })

    // Realtime
    const channel = supabase
      .channel(`configuracoes:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, ({ new: n }) => {
        console.log('[ConfigContext] evento recebido:', n?.chave)
        if (n && KEYS.includes(n.chave)) {
          setCfg(prev => ({ ...prev, [n.chave]: n.valor }))
        }
      })
      .subscribe((status, err) => {
        console.log('[ConfigContext] realtime status:', status, err || '')
      })

    return () => supabase.removeChannel(channel)
  }, [clinicaId])

  const setKey = (chave, valor) => {
    setCfg(prev => ({ ...prev, [chave]: valor }))
    // Listas: salva imediatamente no Supabase para não perder no refresh
    if (Array.isArray(valor)) {
      supabase.from('configuracoes').upsert({ chave, valor }, { onConflict: 'chave' })
      return
    }
    // Textos/objetos: debounce para não sobrecarregar com digitação
    if (saveTimers.current[chave]) clearTimeout(saveTimers.current[chave])
    saveTimers.current[chave] = setTimeout(() => {
      supabase.from('configuracoes').upsert({ chave, valor }, { onConflict: 'chave' })
    }, 600)
  }

  return (
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
  )
}

export const useConfig = () => useContext(ConfigContext)
