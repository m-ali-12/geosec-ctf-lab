import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminClient } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin key
  const adminKey = req.headers['x-admin-key'] || req.query.key
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const supabase = getAdminClient()

    const [sessions, locations, flags, submissions] = await Promise.all([
      supabase
        .from('research_sessions')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(100),
      supabase
        .from('location_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('ctf_flags')
        .select('*')
        .order('points'),
      supabase
        .from('flag_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(100),
    ])

    return res.status(200).json({
      sessions: sessions.data || [],
      locations: locations.data || [],
      flags: flags.data || [],
      submissions: submissions.data || [],
      stats: {
        totalSessions: sessions.data?.length || 0,
        totalLocations: locations.data?.length || 0,
        grantedCount: sessions.data?.filter(s => s.permission_granted).length || 0,
        correctSubmissions: submissions.data?.filter(s => s.is_correct).length || 0,
      },
    })
  } catch (err) {
    console.error('Admin data error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
