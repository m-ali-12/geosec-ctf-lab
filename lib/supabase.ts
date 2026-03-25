import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (only use in API routes)
export const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

export type LocationEntry = {
  id: string
  session_id: string
  latitude: number
  longitude: number
  accuracy: number
  ip_address: string
  user_agent: string
  permission_state: 'granted' | 'denied' | 'prompt'
  cookie_id: string
  timestamp: string
  country?: string
  city?: string
  notes?: string
}

export type ResearchSession = {
  id: string
  cookie_id: string
  first_seen: string
  last_seen: string
  visit_count: number
  permission_granted: boolean
  ip_address: string
  user_agent: string
}
