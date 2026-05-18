import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePlayers({ all = false } = {}) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      let query = supabase.from('players').select('*').order('rating', { ascending: false })
      if (!all) query = query.neq('role', 'manager')
      const { data, error } = await query
      if (!mounted) return
      if (error) console.error(error)
      else setPlayers(data || [])
      setLoading(false)
    }
    load()

    const ch = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, load)
      .subscribe()
    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [all])

  return { players, loading }
}
