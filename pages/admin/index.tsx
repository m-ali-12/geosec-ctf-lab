import { useState, useEffect } from 'react'
import Head from 'next/head'

interface Stats {
  totalSessions: number
  totalLocations: number
  grantedCount: number
  correctSubmissions: number
}

interface Session {
  id: string
  cookie_id: string
  first_seen: string
  last_seen: string
  visit_count: number
  permission_granted: boolean
  ip_address: string
  user_agent: string
}

interface LocationEntry {
  id: string
  cookie_id: string
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  ip_address: string
  permission_state: string
  created_at: string
}

interface FlagSubmission {
  id: string
  cookie_id: string
  flag_attempted: string
  is_correct: boolean
  submitted_at: string
}

interface AdminData {
  sessions: Session[]
  locations: LocationEntry[]
  submissions: FlagSubmission[]
  stats: Stats
}

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'locations' | 'flags'>('overview')
  const [adminKey, setAdminKey] = useState('')

  const login = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-key': keyInput },
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setAdminKey(keyInput)
        setAuthenticated(true)
      } else {
        setError('Invalid admin key. Access denied.')
      }
    } catch {
      setError('Connection failed.')
    }
    setLoading(false)
  }

  const refresh = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-key': adminKey },
      })
      if (res.ok) {
        setData(await res.json())
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(refresh, 30000)
      return () => clearInterval(interval)
    }
  }, [authenticated, adminKey])

  if (!authenticated) {
    return (
      <>
        <Head><title>Admin — GeoSec CTF Lab</title></Head>
        <div className="min-h-screen grid-bg flex items-center justify-center">
          <div className="cyber-panel rounded-lg p-8 w-full max-w-md">
            <div className="font-display text-cyber-green text-xl tracking-widest mb-2 glow-green">
              ADMIN ACCESS
            </div>
            <div className="text-cyber-muted text-xs mb-8">GeoSec CTF Research Platform</div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-cyber-muted mb-2 uppercase tracking-widest">Admin Secret Key</div>
                <input
                  type="password"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                  placeholder="Enter ADMIN_SECRET_KEY..."
                  className="w-full bg-cyber-black border border-cyber-border text-cyber-lime font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-cyber-green"
                />
              </div>
              {error && (
                <div className="text-cyber-red text-xs font-mono p-3 border border-cyber-red rounded bg-red-950/30">
                  ✗ {error}
                </div>
              )}
              <button
                onClick={login}
                disabled={loading || !keyInput}
                className="w-full py-3 border border-cyber-green text-cyber-green font-display text-sm tracking-widest hover:bg-green-900/20 transition-colors disabled:opacity-50"
              >
                {loading ? 'AUTHENTICATING...' : 'ACCESS PANEL'}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'sessions', label: `SESSIONS (${data?.sessions.length || 0})` },
    { id: 'locations', label: `LOCATIONS (${data?.locations.length || 0})` },
    { id: 'flags', label: `SUBMISSIONS (${data?.submissions.length || 0})` },
  ] as const

  return (
    <>
      <Head><title>Admin Panel — GeoSec CTF Lab</title></Head>
      <div className="min-h-screen grid-bg">

        {/* Header */}
        <header className="border-b border-cyber-border bg-cyber-dark/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-display text-cyber-green text-lg tracking-widest">
                ADMIN PANEL
              </div>
              <div className="text-cyber-muted text-xs font-mono">GeoSec CTF Lab — Research Dashboard</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                disabled={loading}
                className="badge-safe hover:bg-green-900/20 cursor-pointer transition-colors"
              >
                {loading ? 'REFRESHING...' : '⟳ REFRESH'}
              </button>
              <a href="/" className="badge-warn hover:bg-orange-900/20 transition-colors">
                ← BACK TO LAB
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Sessions', value: data?.stats.totalSessions || 0, color: 'text-cyber-green' },
              { label: 'Location Logs', value: data?.stats.totalLocations || 0, color: 'text-cyber-blue' },
              { label: 'Permission Grants', value: data?.stats.grantedCount || 0, color: 'text-cyber-lime' },
              { label: 'Correct Flags', value: data?.stats.correctSubmissions || 0, color: 'text-cyber-orange' },
            ].map(stat => (
              <div key={stat.label} className="cyber-panel rounded-lg p-5">
                <div className="text-cyber-muted text-xs uppercase tracking-widest mb-2">{stat.label}</div>
                <div className={`font-display text-3xl ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-cyber-border">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-mono tracking-widest transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyber-green border-b-2 border-cyber-green'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sessions tab */}
          {activeTab === 'sessions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-cyber-border text-cyber-muted">
                    <th className="text-left py-3 pr-4">COOKIE ID</th>
                    <th className="text-left py-3 pr-4">IP</th>
                    <th className="text-left py-3 pr-4">VISITS</th>
                    <th className="text-left py-3 pr-4">PERMISSION</th>
                    <th className="text-left py-3 pr-4">FIRST SEEN</th>
                    <th className="text-left py-3">LAST SEEN</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.sessions.map(s => (
                    <tr key={s.id} className="border-b border-cyber-border/30 hover:bg-white/5">
                      <td className="py-3 pr-4 text-cyber-lime">{s.cookie_id.slice(0, 20)}...</td>
                      <td className="py-3 pr-4 text-cyber-text">{s.ip_address}</td>
                      <td className="py-3 pr-4 text-cyber-text">{s.visit_count}</td>
                      <td className="py-3 pr-4">
                        {s.permission_granted
                          ? <span className="badge-safe">GRANTED</span>
                          : <span className="badge-danger">DENIED</span>
                        }
                      </td>
                      <td className="py-3 pr-4 text-cyber-muted">{new Date(s.first_seen).toLocaleString()}</td>
                      <td className="py-3 text-cyber-muted">{new Date(s.last_seen).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Locations tab */}
          {activeTab === 'locations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-cyber-border text-cyber-muted">
                    <th className="text-left py-3 pr-4">COOKIE ID</th>
                    <th className="text-left py-3 pr-4">LAT</th>
                    <th className="text-left py-3 pr-4">LNG</th>
                    <th className="text-left py-3 pr-4">ACCURACY</th>
                    <th className="text-left py-3 pr-4">PERMISSION</th>
                    <th className="text-left py-3 pr-4">IP</th>
                    <th className="text-left py-3">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.locations.map(l => (
                    <tr key={l.id} className="border-b border-cyber-border/30 hover:bg-white/5">
                      <td className="py-3 pr-4 text-cyber-lime">{l.cookie_id.slice(0, 16)}...</td>
                      <td className="py-3 pr-4 text-cyber-text">{l.latitude?.toFixed(5) ?? '—'}</td>
                      <td className="py-3 pr-4 text-cyber-text">{l.longitude?.toFixed(5) ?? '—'}</td>
                      <td className="py-3 pr-4 text-cyber-text">{l.accuracy ? `${l.accuracy.toFixed(0)}m` : '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={l.permission_state === 'granted' ? 'badge-safe' : 'badge-danger'}>
                          {l.permission_state.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-cyber-muted">{l.ip_address}</td>
                      <td className="py-3 text-cyber-muted">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Flag submissions tab */}
          {activeTab === 'flags' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-cyber-border text-cyber-muted">
                    <th className="text-left py-3 pr-4">COOKIE ID</th>
                    <th className="text-left py-3 pr-4">FLAG ATTEMPTED</th>
                    <th className="text-left py-3 pr-4">RESULT</th>
                    <th className="text-left py-3">SUBMITTED AT</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.submissions.map(s => (
                    <tr key={s.id} className="border-b border-cyber-border/30 hover:bg-white/5">
                      <td className="py-3 pr-4 text-cyber-lime">{s.cookie_id.slice(0, 16)}...</td>
                      <td className="py-3 pr-4 text-cyber-text font-mono">{s.flag_attempted}</td>
                      <td className="py-3 pr-4">
                        {s.is_correct
                          ? <span className="badge-safe">CORRECT</span>
                          : <span className="badge-danger">WRONG</span>
                        }
                      </td>
                      <td className="py-3 text-cyber-muted">{new Date(s.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="cyber-panel rounded-lg p-6">
                <div className="font-display text-sm text-cyber-green tracking-widest mb-4">RECENT SESSIONS</div>
                <div className="space-y-3">
                  {data?.sessions.slice(0, 8).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-cyber-lime">{s.cookie_id.slice(0, 18)}...</div>
                        <div className="text-cyber-muted">{s.ip_address} · {s.visit_count} visits</div>
                      </div>
                      <div className="text-right">
                        {s.permission_granted
                          ? <span className="badge-safe">GPS</span>
                          : <span className="badge-danger">NO GPS</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cyber-panel rounded-lg p-6">
                <div className="font-display text-sm text-cyber-green tracking-widest mb-4">PERMISSION STATS</div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-cyber-muted">GRANTED</span>
                      <span className="text-cyber-green">
                        {data?.stats.grantedCount} / {data?.stats.totalSessions}
                      </span>
                    </div>
                    <div className="w-full bg-cyber-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-cyber-green"
                        style={{
                          width: `${data?.stats.totalSessions
                            ? ((data.stats.grantedCount / data.stats.totalSessions) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-cyber-muted">DENIED</span>
                      <span className="text-cyber-red">
                        {(data?.stats.totalSessions || 0) - (data?.stats.grantedCount || 0)} / {data?.stats.totalSessions}
                      </span>
                    </div>
                    <div className="w-full bg-cyber-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-cyber-red"
                        style={{
                          width: `${data?.stats.totalSessions
                            ? (((data.stats.totalSessions - data.stats.grantedCount) / data.stats.totalSessions) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}
