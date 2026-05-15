import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
      if (!mounted) return
      if (!error) setSettings(data)
      setLoading(false)
    }
    load()

    const ch = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, load)
      .subscribe()
    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [])

  return { settings, loading }
}
