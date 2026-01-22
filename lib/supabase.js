import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Para desarrollo local
let supabaseClient

if (typeof window !== 'undefined') {
  // Solo en el cliente
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    // Puedes crear un cliente con valores dummy para desarrollo
    supabaseClient = createClient(
      supabaseUrl || 'https://dummy.supabase.co',
      supabaseAnonKey || 'dummy-key'
    )
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
}

export const supabase = supabaseClient

// También exporta la función getSupabase por si acaso
export const getSupabase = () => {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  return createClient(supabaseUrl, supabaseAnonKey || '')
}
