import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AgendaContext = createContext()

export function AgendaProvider({ children }) {
  const { clinicaId } = useAuth()
  const [agendamentos, setAgendamentos] = useState([])
  const [lembretes, setLembretes] = useState([])

  useEffect(() => {
    if (!clinicaId) return
    let migratedAg = false
    let migratedLem = false

    const fetchAll = async () => {
      const [{ data: ag }, { data: lem }] = await Promise.all([
        supabase.from('agendamentos').select('*'),
        supabase.from('agenda_lembretes').select('*'),
      ])
      if (ag && ag.length > 0) {
        setAgendamentos(ag)
      } else if (!migratedAg) {
        migratedAg = true
        try {
          const local = JSON.parse(localStorage.getItem('agenda_agendamentos') || '[]')
          if (local.length > 0) {
            const rows = local.map(a => ({ id: String(a.id || Date.now()), clinica_id: clinicaId, date: a.date || '', time: a.time || '', paciente: a.paciente || '', procedimento: a.procedimento || '', status: a.status || 'agendado', duracao: a.duracao || 30, telefone: a.telefone || '' }))
            await supabase.from('agendamentos').upsert(rows, { onConflict: 'id' })
            setAgendamentos(local)
          }
        } catch (e) { console.error('Migração agendamentos:', e) }
      }
      if (lem && lem.length > 0) {
        setLembretes(lem.map(r => r.dados))
      } else if (!migratedLem) {
        migratedLem = true
        try {
          const local = JSON.parse(localStorage.getItem('agenda_lembretes') || '[]')
          if (local.length > 0) {
            const rows = local.map(l => ({ id: String(l.id), clinica_id: clinicaId, dados: l }))
            await supabase.from('agenda_lembretes').upsert(rows, { onConflict: 'id' })
            setLembretes(local)
          }
        } catch (e) { console.error('Migração lembretes:', e) }
      }
    }

    fetchAll()

    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(fetchAll, 15000)

    const channel = supabase
      .channel(`agenda:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n, old: o }) => {
        if (eventType === 'INSERT') setAgendamentos(prev => prev.find(a => a.id === n.id) ? prev : [...prev, n])
        else if (eventType === 'UPDATE') setAgendamentos(prev => prev.map(a => a.id === n.id ? n : a))
        else if (eventType === 'DELETE') setAgendamentos(prev => prev.filter(a => a.id !== o.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agenda_lembretes', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n, old: o }) => {
        if (eventType === 'INSERT') setLembretes(prev => prev.find(l => l.id === n.dados?.id) ? prev : [...prev, n.dados])
        else if (eventType === 'UPDATE') setLembretes(prev => prev.map(l => l.id === n.dados?.id ? n.dados : l))
        else if (eventType === 'DELETE') setLembretes(prev => prev.filter(l => l.id !== o.dados?.id))
      })
      .subscribe()

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [clinicaId])

  const saveAgendamento = async (ag) => {
    setAgendamentos(prev => prev.find(a => a.id === ag.id) ? prev.map(a => a.id === ag.id ? { ...a, ...ag } : a) : [...prev, ag])
    await supabase.from('agendamentos').upsert({
      id: String(ag.id), clinica_id: clinicaId,
      date: ag.date || '', time: ag.time || '',
      paciente: ag.paciente || '', procedimento: ag.procedimento || '',
      status: ag.status || 'agendado', duracao: ag.duracao || 30, telefone: ag.telefone || '',
    }, { onConflict: 'id' })
  }

  const deleteAgendamento = async (id) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id))
    await supabase.from('agendamentos').delete().eq('id', id)
  }

  const addLembrete = async (l) => {
    setLembretes(prev => [...prev, l])
    await supabase.from('agenda_lembretes').insert({ id: String(l.id), clinica_id: clinicaId, dados: l })
  }

  const updateLembrete = async (id, updates) => {
    setLembretes(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
    const atual = lembretes.find(l => l.id === id)
    if (atual) await supabase.from('agenda_lembretes').update({ dados: { ...atual, ...updates } }).eq('id', String(id))
  }

  const deleteLembrete = async (id) => {
    setLembretes(prev => prev.filter(l => l.id !== id))
    await supabase.from('agenda_lembretes').delete().eq('id', String(id))
  }

  return (
    <AgendaContext.Provider value={{ agendamentos, saveAgendamento, deleteAgendamento, lembretes, addLembrete, updateLembrete, deleteLembrete }}>
      {children}
    </AgendaContext.Provider>
  )
}

export const useAgenda = () => useContext(AgendaContext)
