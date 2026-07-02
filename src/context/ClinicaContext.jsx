import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ClinicaContext = createContext()

const DEFAULTS = { metaValor: 200000, superMetaValor: null, recordeValor: 142500 }

// Serialize Set → array for Supabase storage
const serSet = (s) => [...(s instanceof Set ? s : new Set())]
const desSet = (a) => new Set(Array.isArray(a) ? a : [])

export function ClinicaProvider({ children }) {
  const { clinicaId } = useAuth()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())

  // dadosPorMes: { '2026-4': { diasSelecionados: Set, diasValores: {}, metaValor, superMetaValor, recordeValor } }
  const [dadosPorMes, setDadosPorMes] = useState({})
  const [postsPorMes, setPostsPorMes] = useState({})
  const [loadedMonths, setLoadedMonths] = useState(new Set())
  const saveTimers = useRef({})

  const mesKey = `${ano}-${mes}`

  // Migração única: localStorage → Supabase (roda uma vez por clinicaId)
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('clinica_metas').select('id').limit(1).then(async ({ data }) => {
      if (data && data.length > 0) return // já tem dados no Supabase
      try {
        const raw = localStorage.getItem('clinica_dadosPorMes')
        if (!raw) return
        const localDados = JSON.parse(raw)
        if (Object.keys(localDados).length === 0) return

        const localPosts = JSON.parse(localStorage.getItem('clinica_postsPorMes') || '{}')

        const metasRows = Object.entries(localDados).map(([key, v]) => {
          const [anoStr, mesStr] = key.split('-')
          return {
            clinica_id: clinicaId,
            ano: parseInt(anoStr),
            mes: parseInt(mesStr),
            meta_valor: v.metaValor ?? null,
            super_meta_valor: v.superMetaValor ?? null,
            recorde_valor: v.recordeValor ?? null,
            dias_selecionados: v.diasSelecionados || [],
            dias_valores: v.diasValores || {},
          }
        })
        const postsRows = Object.entries(localPosts).map(([key, posts]) => {
          const [anoStr, mesStr] = key.split('-')
          return { clinica_id: clinicaId, ano: parseInt(anoStr), mes: parseInt(mesStr), posts: posts || [] }
        })

        if (metasRows.length > 0) await supabase.from('clinica_metas').upsert(metasRows, { onConflict: 'clinica_id,ano,mes' })
        if (postsRows.length > 0) await supabase.from('clinica_posts').upsert(postsRows, { onConflict: 'clinica_id,ano,mes' })

        const newDados = {}
        Object.entries(localDados).forEach(([key, v]) => {
          newDados[key] = {
            diasSelecionados: new Set(v.diasSelecionados || []),
            diasValores: v.diasValores || {},
            metaValor: v.metaValor,
            superMetaValor: v.superMetaValor,
            recordeValor: v.recordeValor,
          }
        })
        setDadosPorMes(newDados)
        setPostsPorMes(localPosts)
        setLoadedMonths(new Set(Object.keys(localDados)))
      } catch (e) { console.error('Migração metas:', e) }
    })
  }, [clinicaId])

  // Load current month + polling
  useEffect(() => {
    if (!clinicaId) return

    const loadMes = async () => {
      const [{ data: meta }, { data: postsData }] = await Promise.all([
        supabase.from('clinica_metas').select('*').eq('clinica_id', clinicaId).eq('ano', ano).eq('mes', mes).maybeSingle(),
        supabase.from('clinica_posts').select('*').eq('clinica_id', clinicaId).eq('ano', ano).eq('mes', mes).maybeSingle(),
      ])
      setDadosPorMes(prev => ({
        ...prev,
        [mesKey]: {
          diasSelecionados: desSet(meta?.dias_selecionados),
          diasValores: meta?.dias_valores || {},
          metaValor: meta?.meta_valor ?? undefined,
          superMetaValor: meta?.super_meta_valor ?? undefined,
          recordeValor: meta?.recorde_valor ?? undefined,
        },
      }))
      setPostsPorMes(prev => ({ ...prev, [mesKey]: postsData?.posts || [] }))
      setLoadedMonths(prev => new Set([...prev, mesKey]))
    }

    loadMes()
    const onVisible = () => { if (document.visibilityState === 'visible') loadMes() }
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(loadMes, 15000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [clinicaId, mesKey])

  // Realtime subscriptions
  useEffect(() => {
    if (!clinicaId) return
    const channel = supabase
      .channel(`clinica:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinica_metas', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n }) => {
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const key = `${n.ano}-${n.mes}`
          setDadosPorMes(prev => ({
            ...prev,
            [key]: {
              diasSelecionados: desSet(n.dias_selecionados),
              diasValores: n.dias_valores || {},
              metaValor: n.meta_valor ?? undefined,
              superMetaValor: n.super_meta_valor ?? undefined,
              recordeValor: n.recorde_valor ?? undefined,
            }
          }))
          setLoadedMonths(prev => new Set([...prev, key]))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinica_posts', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n }) => {
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const key = `${n.ano}-${n.mes}`
          setPostsPorMes(prev => ({ ...prev, [key]: n.posts || [] }))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [clinicaId])

  // Debounced save for current month's meta data
  const scheduleSave = (key, anof, mesf, dados) => {
    if (!clinicaId) return
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(async () => {
      const { error } = await supabase.from('clinica_metas').upsert({
        clinica_id: clinicaId,
        ano: anof,
        mes: mesf,
        meta_valor: dados.metaValor ?? DEFAULTS.metaValor,
        super_meta_valor: dados.superMetaValor ?? null,
        recorde_valor: dados.recordeValor ?? DEFAULTS.recordeValor,
        dias_selecionados: serSet(dados.diasSelecionados),
        dias_valores: dados.diasValores || {},
      }, { onConflict: 'clinica_id,ano,mes' })
    }, 400)
  }

  const updateMes = (updater) => {
    setDadosPorMes(prev => {
      const atual = prev[mesKey] || { diasSelecionados: new Set(), diasValores: {} }
      const next = { ...atual, ...updater(atual) }
      const updated = { ...prev, [mesKey]: next }
      scheduleSave(mesKey, ano, mes, next)
      return updated
    })
  }

  const setMetaValor = (valor) => updateMes(() => ({ metaValor: valor }))
  const setSuperMetaValor = (valor) => updateMes(() => ({ superMetaValor: valor }))
  const setRecordeValor = (valor) => updateMes(() => ({ recordeValor: valor }))

  const setDiasSelecionados = (updater) => updateMes(atual => ({
    diasSelecionados: typeof updater === 'function' ? updater(atual.diasSelecionados) : updater,
  }))

  const setDiasValores = (updater) => updateMes(atual => ({
    diasValores: typeof updater === 'function' ? updater(atual.diasValores) : updater,
  }))

  const setPosts = (updater) => {
    setPostsPorMes(prev => {
      const atual = prev[mesKey] || []
      const next = typeof updater === 'function' ? updater(atual) : updater
      if (clinicaId) {
        supabase.from('clinica_posts').upsert(
          { clinica_id: clinicaId, ano, mes, posts: next },
          { onConflict: 'clinica_id,ano,mes' }
        ).then(({ error }) => { if (error) console.error('setPosts error:', error) })
      }
      return { ...prev, [mesKey]: next }
    })
  }

  const dadosAtual = dadosPorMes[mesKey] || { diasSelecionados: new Set(), diasValores: {} }
  const diasSelecionados = dadosAtual.diasSelecionados instanceof Set ? dadosAtual.diasSelecionados : new Set()
  const diasValores = dadosAtual.diasValores || {}
  const metaValor = dadosAtual.metaValor ?? DEFAULTS.metaValor
  const superMetaValorRaw = dadosAtual.superMetaValor
  const recordeValor = dadosAtual.recordeValor ?? DEFAULTS.recordeValor
  const posts = postsPorMes[mesKey] || []

  const superMeta = superMetaValorRaw ?? metaValor * 1.1
  const diasAtendimento = diasSelecionados.size
  const metaDiaria = diasAtendimento > 0 ? metaValor / diasAtendimento : 0
  const faturamentoTotal = Object.values(diasValores).reduce((acc, v) => acc + (v || 0), 0)
  const porcentagemMeta = metaValor > 0 ? (faturamentoTotal / metaValor) * 100 : 0

  return (
    <ClinicaContext.Provider value={{
      ano, setAno,
      mes, setMes,
      metaValor, setMetaValor,
      superMetaValor: superMetaValorRaw, setSuperMetaValor,
      recordeValor, setRecordeValor,
      diasSelecionados, setDiasSelecionados,
      diasValores, setDiasValores,
      posts, setPosts,
      superMeta,
      diasAtendimento,
      metaDiaria,
      faturamentoTotal,
      porcentagemMeta,
    }}>
      {children}
    </ClinicaContext.Provider>
  )
}

export const useClinica = () => useContext(ClinicaContext)
