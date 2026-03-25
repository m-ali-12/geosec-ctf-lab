import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { flag, cookieId } = req.body

  if (!flag || !cookieId) {
    return res.status(400).json({ error: 'Missing flag or cookieId' })
  }

  try {
    const supabase = getAdminClient()

    // Find session
    const { data: session } = await supabase
      .from('research_sessions')
      .select('id')
      .eq('cookie_id', cookieId)
      .single()

    // Check flag against database
    const { data: flags } = await supabase
      .from('ctf_flags')
      .select('*')
      .eq('is_active', true)

    const matchedFlag = flags?.find(f => f.flag_value === flag.trim())
    const isCorrect = !!matchedFlag

    // Log submission
    if (session) {
      await supabase.from('flag_submissions').insert({
        session_id: session.id,
        cookie_id: cookieId,
        flag_attempted: flag,
        is_correct: isCorrect,
      })
    }

    if (isCorrect) {
      return res.status(200).json({
        correct: true,
        message: `${matchedFlag.flag_name} — ${matchedFlag.points} points! ${matchedFlag.description}`,
      })
    } else {
      return res.status(200).json({
        correct: false,
        message: 'Flag not recognized. Check the format: CTF{...}',
      })
    }
  } catch (err) {
    console.error('Flag submission error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
