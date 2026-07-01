import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const SocialContext = createContext()

export function SocialProvider({ children }) {
  const { clinicaId } = useAuth()
  const [metricas, setMetricas] = useState({}) // { '2026-3': { trafego, seguidores } }
  const metricasRef = useRef({})
  const [rotina, setRotina] = useState({})
  const [loadedMonths, setLoadedMonths] = useState(new Set())
  const saveTimers = useRef({})

  // Migração única: localStorage → Supabase
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('social_metricas').select('id').limit(1).then(async ({ data }) => {
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
          metricasRef.current = { ...metricasRef.current, ...newMap }
          setMetricas(prev => ({ ...prev, ...newMap }))
          setLoadedMonths(prev => new Set([...prev, ...rows.map(r => `${r.ano}-${r.mes}`)]))
        }
      } catch (e) { console.error('Migração social_metricas:', e) }
    })

    // Migra rotina
    supabase.from('social_rotina').select('id').limit(1).then(async ({ data }) => {
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
    setLoadedMonths(prev => new Set([...prev, key])) // mark immediately to avoid duplicate fetches
    supabase.from('social_metricas').select('*').eq('ano', ano).eq('mes', mes).maybeSingle()
      .then(({ data }) => {
        const val = { trafego: data?.trafego ?? 0, seguidores: data?.seguidores ?? 0 }
        metricasRef.current = { ...metricasRef.current, [key]: val }
        setMetricas(prev => ({ ...prev, [key]: val }))
      })
  }

  // Carrega rotina uma vez
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('social_rotina').select('*').maybeSingle()
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
          const val = { trafego: n.trafego ?? 0, seguidores: n.seguidores ?? 0 }
          metricasRef.current = { ...metricasRef.current, [key]: val }
          setMetricas(prev => ({ ...prev, [key]: val }))
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
    const cur = metricasRef.current[key] || {}
    const next = { ...cur, trafego: valor }
    metricasRef.current = { ...metricasRef.current, [key]: next }
    setMetricas(prev => ({ ...prev, [key]: next }))
    if (saveTimers.current[key + '_t']) clearTimeout(saveTimers.current[key + '_t'])
    saveTimers.current[key + '_t'] = setTimeout(() => {
      const latest = metricasRef.current[key] || {}
      supabase.from('social_metricas').upsert(
        { clinica_id: clinicaId, ano, mes, trafego: valor, seguidores: latest.seguidores ?? 0 },
        { onConflict: 'clinica_id,ano,mes' }
      )
    }, 300)
  }

  const setSeguidores = (ano, mes, valor) => {
    const key = `${ano}-${mes}`
    const cur = metricasRef.current[key] || {}
    const next = { ...cur, seguidores: valor }
    metricasRef.current = { ...metricasRef.current, [key]: next }
    setMetricas(prev => ({ ...prev, [key]: next }))
    if (saveTimers.current[key + '_s']) clearTimeout(saveTimers.current[key + '_s'])
    saveTimers.current[key + '_s'] = setTimeout(() => {
      const latest = metricasRef.current[key] || {}
      supabase.from('social_metricas').upsert(
        { clinica_id: clinicaId, ano, mes, trafego: latest.trafego ?? 0, seguidores: valor },
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
