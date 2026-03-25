import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cookieId, latitude, longitude, accuracy, permissionState } = req.body

  if (!cookieId) {
    return res.status(400).json({ error: 'Missing cookieId' })
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'

  const userAgent = req.headers['user-agent'] || 'unknown'

  try {
    const supabase = getAdminClient()

    // Find session
    const { data: session } = await supabase
      .from('research_sessions')
      .select('id')
      .eq('cookie_id', cookieId)
      .single()

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Insert location entry
    const { error } = await supabase.from('location_entries').insert({
      session_id: session.id,
      cookie_id: cookieId,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      accuracy: accuracy ?? null,
      ip_address: ip,
      user_agent: userAgent,
      permission_state: permissionState || 'unknown',
    })

    if (error) {
      console.error('DB insert error:', error)
      return res.status(500).json({ error: 'Database error' })
    }

    // Update session permission state
    if (permissionState === 'granted') {
      await supabase
        .from('research_sessions')
        .update({ permission_granted: true, last_seen: new Date().toISOString() })
        .eq('cookie_id', cookieId)
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
