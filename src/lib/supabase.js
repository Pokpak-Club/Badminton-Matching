import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'ขาด environment variables. สร้างไฟล์ .env.local แล้วใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(url, key)
