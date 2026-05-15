import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useScheduledMatches() {
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data, error } = await supabase
        .from('scheduled_matches')
        .select(`
          *,
          player1:players!scheduled_matches_player1_id_fkey(id, name, emoji, rating),
          player2:players!scheduled_matches_player2_id_fkey(id, name, emoji, rating)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (!mounted) return
      if (error) console.error(error)
      else setScheduled(data || [])
      setLoading(false)
    }
    load()

    const ch = supabase
      .channel('scheduled-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_matches' }, load)
      .subscribe()
    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [])

  return { scheduled, loading }
}
