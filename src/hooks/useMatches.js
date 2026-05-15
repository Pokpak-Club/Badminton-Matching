import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useMatches(limit = 200) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:players!matches_player1_id_fkey(id, name, emoji),
          player2:players!matches_player2_id_fkey(id, name, emoji)
        `)
        .order('played_at', { ascending: false })
        .limit(limit)
      if (!mounted) return
      if (error) console.error(error)
      else setMatches(data || [])
      setLoading(false)
    }
    load()

    const ch = supabase
      .channel('matches-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe()
    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [limit])

  return { matches, loading }
}
