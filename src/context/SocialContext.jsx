import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const SocialContext = createContext()

export function SocialProvider({ children }) {
  const { clinicaId } = useAuth()
  const [metricas, setMetricas] = useState({}) // { '2026-3': { trafego, seguidores } }
  const [rotina, setRotina] = useState({})
  const [loadedMonths, setLoadedMonths] = useState(new Set())
  const saveTimers = useRef({})

  // Migração única: localStorage → Supabase
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('social_metricas').select('id').eq('clinica_id', clinicaId).limit(1).then(async ({ data }) => {
      if (data && data.length > 0) return

      try {
        // Migra métricas de todos os meses encontrados no localStorage
        const rows = []
        for (let ano = 2024; ano <= new Date().getFullYear() + 1; ano++) {
          for (let mes = 0; mes < 12; mes++) {
            const t = localStorage.getItem(`social_trafego_${ano}_${mes}`)
            const s = localStorage.getItem(`social_seguidores_${ano}_${mes}`)
            if (t !== null || s !== null) {
              rows.push({
                clinica_id: clinicaId,
                ano,
                mes,
                trafego: t !== null ? parseFloat(t) : 0,
                seguidores: s !== null ? parseInt(s) : 0,
              })
            }
          }
        }
        if (rows.length > 0) {
          await supabase.from('social_metricas').upsert(rows, { onConflict: 'clinica_id,ano,mes' })
          const newMap = {}
          rows.forEach(r => { newMap[`${r.ano}-${r.mes}`] = { trafego: r.trafego, seguidores: r.seguidores } })
          setMetricas(prev => ({ ...prev, ...newMap }))
          setLoadedMonths(prev => new Set([...prev, ...rows.map(r => `${r.ano}-${r.mes}`)]))
        }
      } catch (e) { console.error('Migração social_metricas:', e) }
    })

    // Migra rotina
    supabase.from('social_rotina').select('id').eq('clinica_id', clinicaId).limit(1).then(async ({ data }) => {
      if (data && data.length > 0) return
      try {
        const raw = localStorage.getItem('social_rotina')
        if (!raw) return
        const dados = JSON.parse(raw)
        if (Object.keys(dados).length === 0) return
        await supabase.from('social_rotina').upsert({ clinica_id: clinicaId, dados }, { onConflict: 'clinica_id' })
        setRotina(dados)
      } catch (e) { console.error('Migração social_rotina:', e) }
    })
  }, [clinicaId])

  // Carrega métricas do mês atual
  const carregarMes = (ano, mes) => {
    if (!clinicaId) return
    const key = `${ano}-${mes}`
    if (loadedMonths.has(key)) return
    supabase.from('social_metricas').select('*').eq('clinica_id', clinicaId).eq('ano', ano).eq('mes', mes).maybeSingle()
      .then(({ data }) => {
        setMetricas(prev => ({ ...prev, [key]: { trafego: data?.trafego ?? 0, seguidores: data?.seguidores ?? 0 } }))
        setLoadedMonths(prev => new Set([...prev, key]))
      })
  }

  // Carrega rotina uma vez
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('social_rotina').select('*').eq('clinica_id', clinicaId).maybeSingle()
      .then(({ data }) => { if (data?.dados) setRotina(data.dados) })
  }, [clinicaId])

  // Realtime
  useEffect(() => {
    if (!clinicaId) return
    const channel = supabase
      .channel(`social:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_metricas', filter: `clinica_id=eq.${clinicaId}` }, ({ new: n }) => {
        if (n) {
          const key = `${n.ano}-${n.mes}`
          setMetricas(prev => ({ ...prev, [key]: { trafego: n.trafego ?? 0, seguidores: n.seguidores ?? 0 } }))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_rotina', filter: `clinica_id=eq.${clinicaId}` }, ({ new: n }) => {
        if (n?.dados) setRotina(n.dados)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [clinicaId])

  const setTrafego = (ano, mes, valor) => {
    const key = `${ano}-${mes}`
    setMetricas(prev => ({ ...prev, [key]: { ...(prev[key] || {}), trafego: valor } }))
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(() => {
      supabase.from('social_metricas').upsert(
        { clinica_id: clinicaId, ano, mes, trafego: valor, seguidores: metricas[key]?.seguidores ?? 0 },
        { onConflict: 'clinica_id,ano,mes' }
      )
    }, 300)
  }

  const setSeguidores = (ano, mes, valor) => {
    const key = `${ano}-${mes}`
    setMetricas(prev => ({ ...prev, [key]: { ...(prev[key] || {}), seguidores: valor } }))
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(() => {
      supabase.from('social_metricas').upsert(
        { clinica_id: clinicaId, ano, mes, trafego: metricas[key]?.trafego ?? 0, seguidores: valor },
        { onConflict: 'clinica_id,ano,mes' }
      )
    }, 300)
  }

  const salvarRotina = (nova) => {
    setRotina(nova)
    if (saveTimers.current['rotina']) clearTimeout(saveTimers.current['rotina'])
    saveTimers.current['rotina'] = setTimeout(() => {
      supabase.from('social_rotina').upsert({ clinica_id: clinicaId, dados: nova }, { onConflict: 'clinica_id' })
    }, 300)
  }

  const getMes = (ano, mes) => metricas[`${ano}-${mes}`] || { trafego: 0, seguidores: 0 }

  return (
    <SocialContext.Provider value={{ getMes, setTrafego, setSeguidores, rotina, salvarRotina, carregarMes }}>
      {children}
    </SocialContext.Provider>
  )
}

export const useSocial = () => useContext(SocialContext)
