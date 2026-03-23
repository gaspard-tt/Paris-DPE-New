import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

let supabase: ReturnType<typeof createClient> | null = null

try {
  supabase = createClient(supabaseUrl, supabaseKey)
} catch (e) {
  console.warn('[Supabase] client init failed:', e)
}

export { supabase }