import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cookieId, visits, firstSeen } = req.body

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

    // Upsert session
    const { error } = await supabase
      .from('research_sessions')
      .upsert(
        {
          cookie_id: cookieId,
          ip_address: ip,
          user_agent: userAgent,
          visit_count: visits || 1,
          first_seen: firstSeen || new Date().toISOString(),
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'cookie_id' }
      )

    if (error) {
      console.error('Session upsert error:', error)
      return res.status(500).json({ error: 'Database error' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Session handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
