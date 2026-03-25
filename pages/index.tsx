import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Cookies from 'js-cookie'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface SessionData {
  cookieId: string
  visits: number
  firstSeen: string
  permissionGranted: boolean
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function generateCookieId(): string {
  return 'ctf_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9)
}

function formatCoord(n: number, decimals = 6): string {
  return n.toFixed(decimals)
}

// ─── Components ───────────────────────────────────────────────────────────────
function TerminalLine({ text, delay = 0, color = 'text-cyber-lime' }: { text: string; delay?: number; color?: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div className={`font-mono text-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${color}`}>
      <span className="text-cyber-green mr-2">$</span>{text}
    </div>
  )
}

function StatusBadge({ state }: { state: 'granted' | 'denied' | 'prompt' | 'unknown' }) {
  const map = {
    granted: { label: 'GRANTED', cls: 'badge-safe' },
    denied:  { label: 'DENIED',  cls: 'badge-danger' },
    prompt:  { label: 'AWAITING', cls: 'badge-warn' },
    unknown: { label: 'UNKNOWN', cls: 'badge-warn' },
  }
  const { label, cls } = map[state]
  return <span className={cls}>{label}</span>
}

// ─── Permission Demo Section ───────────────────────────────────────────────────
function PermissionDemo({ session }: { session: SessionData | null }) {
  const [permState, setPermState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [logLines, setLogLines] = useState<string[]>([])
  const [unlocked, setUnlocked] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = (line: string) => {
    setLogLines(prev => [...prev.slice(-20), `[${new Date().toISOString()}] ${line}`])
    setTimeout(() => logRef.current?.scrollTo(0, 99999), 50)
  }

  const requestLocation = async () => {
    setLoading(true)
    addLog('Requesting navigator.geolocation.getCurrentPosition()...')

    if (!navigator.geolocation) {
      addLog('ERROR: Geolocation API not supported in this browser.')
      setPermState('denied')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }
        setLocation(loc)
        setPermState('granted')
        setUnlocked(true)
        addLog(`SUCCESS: Position acquired. Lat=${formatCoord(loc.latitude)} Lng=${formatCoord(loc.longitude)} Acc=${loc.accuracy.toFixed(0)}m`)
        addLog('Logging to research database...')

        // Save to DB via API
        try {
          await fetch('/api/log-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cookieId: session?.cookieId,
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy,
              permissionState: 'granted',
            }),
          })
          addLog('Database write: OK')
        } catch {
          addLog('Database write: FAILED (check Supabase config)')
        }

        setLoading(false)
      },
      (err) => {
        setPermState('denied')
        setUnlocked(false)
        addLog(`ERROR: Permission denied. Code=${err.code} Message="${err.message}"`)
        addLog('ANALYSIS: Browser enforced permission boundary. Cannot bypass via JS API.')
        addLog('NOTE: This is expected behavior - demonstrating the security model.')

        // Log denied attempt
        fetch('/api/log-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookieId: session?.cookieId,
            permissionState: 'denied',
          }),
        }).catch(() => {})

        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <section className="cyber-panel rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-cyber-green tracking-widest">
          [ PERMISSION MODEL DEMO ]
        </h2>
        <StatusBadge state={permState} />
      </div>

      <p className="text-cyber-muted text-sm mb-6 leading-relaxed">
        This demo shows how the browser&apos;s geolocation permission model works in practice.
        The content below is blurred until permission is granted — demonstrating a
        <strong className="text-cyber-orange"> legitimate</strong> (user-initiated, transparent)
        pattern vs coercive bypass attempts.
      </p>

      {/* Blurred content area */}
      <div className={`relative mb-6 ${!unlocked ? 'pointer-events-none' : ''}`}>
        <div className={`code-block rounded transition-all duration-700 ${!unlocked ? 'blur-md select-none' : ''}`}>
          {location ? (
            <>
              <div className="text-cyber-green mb-2">// Location data acquired</div>
              <div>latitude  = <span className="text-cyber-lime">{formatCoord(location.latitude)}</span></div>
              <div>longitude = <span className="text-cyber-lime">{formatCoord(location.longitude)}</span></div>
              <div>accuracy  = <span className="text-cyber-lime">{location.accuracy.toFixed(1)}m</span></div>
              <div>timestamp = <span className="text-cyber-lime">{new Date(location.timestamp).toISOString()}</span></div>
              <div className="mt-2">
                maps_url = <span className="text-cyber-blue">
                  https://maps.google.com/?q={formatCoord(location.latitude)},{formatCoord(location.longitude)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-cyber-muted">// Awaiting permission grant...</div>
              <div className="text-cyber-muted">latitude  = <span className="text-cyber-red">███████████</span></div>
              <div className="text-cyber-muted">longitude = <span className="text-cyber-red">███████████</span></div>
              <div className="text-cyber-muted">accuracy  = <span className="text-cyber-red">██████</span></div>
            </>
          )}
        </div>

        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">🔒</div>
              <div className="text-cyber-red font-display text-sm tracking-widest">ACCESS RESTRICTED</div>
              <div className="text-cyber-muted text-xs mt-1">Grant location permission to unlock</div>
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={requestLocation}
        disabled={loading || permState === 'granted'}
        className={`w-full py-3 px-6 font-display text-sm tracking-widest transition-all duration-300 border ${
          permState === 'granted'
            ? 'border-cyber-green text-cyber-green bg-green-950/30 cursor-default'
            : loading
            ? 'border-cyber-orange text-cyber-orange animate-pulse cursor-wait'
            : 'border-cyber-green text-cyber-green hover:bg-green-900/20 cursor-pointer box-glow-green'
        }`}
      >
        {permState === 'granted' ? '✓ PERMISSION GRANTED — DATA UNLOCKED' : loading ? '⟳ REQUESTING...' : '▶ REQUEST GEOLOCATION PERMISSION'}
      </button>

      {/* Live log terminal */}
      <div className="mt-4">
        <div className="text-xs text-cyber-muted mb-2 uppercase tracking-widest">// Research Log</div>
        <div
          ref={logRef}
          className="code-block rounded h-32 overflow-y-auto text-xs"
        >
          {logLines.length === 0 ? (
            <span className="text-cyber-muted">Awaiting interaction<span className="cursor"></span></span>
          ) : (
            logLines.map((line, i) => (
              <div key={i} className="text-cyber-text leading-6">{line}</div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Research Modules ──────────────────────────────────────────────────────────
function ResearchModule({ title, category, points, content }: {
  title: string; category: string; points: number; content: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cyber-panel rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="badge-warn">{category}</span>
          <span className="font-display text-sm text-cyber-text tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyber-green text-sm font-mono">{points} pts</span>
          <span className="text-cyber-muted">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-cyber-border pt-4">
          {content}
        </div>
      )}
    </div>
  )
}

// ─── Flag Submission ───────────────────────────────────────────────────────────
function FlagSubmission({ cookieId }: { cookieId: string }) {
  const [flag, setFlag] = useState('')
  const [result, setResult] = useState<null | { correct: boolean; message: string }>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!flag.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/submit-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag: flag.trim(), cookieId }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ correct: false, message: 'Network error. Check connection.' })
    }
    setLoading(false)
  }

  return (
    <div className="cyber-panel rounded-lg p-6 mb-8">
      <h2 className="font-display text-lg text-cyber-green tracking-widest mb-4">[ FLAG SUBMISSION ]</h2>
      <p className="text-cyber-muted text-sm mb-4">
        Submit CTF flags discovered through the research challenges. Format: <code className="text-cyber-lime">CTF&#123;...&#125;</code>
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={flag}
          onChange={e => setFlag(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="CTF{your_flag_here}"
          className="flex-1 bg-cyber-black border border-cyber-border text-cyber-lime font-mono text-sm px-4 py-2.5 rounded focus:outline-none focus:border-cyber-green"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="px-6 py-2.5 border border-cyber-green text-cyber-green font-display text-sm tracking-widest hover:bg-green-900/20 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'SUBMIT'}
        </button>
      </div>
      {result && (
        <div className={`mt-3 p-3 rounded text-sm font-mono ${result.correct ? 'bg-green-950/50 border border-cyber-green text-cyber-green' : 'bg-red-950/50 border border-cyber-red text-cyber-red'}`}>
          {result.correct ? '✓ CORRECT FLAG: ' : '✗ INCORRECT: '}{result.message}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    // Initialize or restore cookie session
    let cookieId = Cookies.get('ctf_session_id')
    if (!cookieId) {
      cookieId = generateCookieId()
      Cookies.set('ctf_session_id', cookieId, { expires: 365, sameSite: 'lax' })
    }

    const visits = parseInt(Cookies.get('ctf_visits') || '0') + 1
    const firstSeen = Cookies.get('ctf_first_seen') || new Date().toISOString()
    const permGranted = Cookies.get('ctf_perm_granted') === 'true'

    Cookies.set('ctf_visits', visits.toString(), { expires: 365 })
    Cookies.set('ctf_first_seen', firstSeen, { expires: 365 })

    const sessionData: SessionData = {
      cookieId,
      visits,
      firstSeen,
      permissionGranted: permGranted,
    }
    setSession(sessionData)

    // Register session with backend
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    }).catch(() => {})

    setTimeout(() => setBooting(false), 1200)
  }, [])

  if (booting) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="font-display text-2xl text-cyber-green glow-green tracking-widest animate-pulse">
            INITIALIZING
          </div>
          <div className="font-mono text-xs text-cyber-muted space-y-1">
            <TerminalLine text="Loading security research platform..." delay={100} />
            <TerminalLine text="Checking cookie session..." delay={400} />
            <TerminalLine text="Connecting to Supabase DB..." delay={700} />
            <TerminalLine text="Ready." delay={1000} color="text-cyber-green" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>GeoSec CTF Lab — Cybersecurity Research Platform</title>
      </Head>

      <div className="scan-line" />

      <div className="min-h-screen grid-bg">
        {/* Header */}
        <header className="border-b border-cyber-border bg-cyber-dark/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-display text-cyber-green text-xl tracking-widest glow-green">
                GeoSec CTF Lab
              </div>
              <div className="text-cyber-muted text-xs font-mono mt-0.5">
                Geolocation Security Research &amp; CTF Documentation
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              {session && (
                <div className="text-cyber-muted hidden md:block">
                  SESSION: <span className="text-cyber-lime">{session.cookieId.slice(0, 16)}...</span>
                  {' | '}VISIT: <span className="text-cyber-lime">#{session.visits}</span>
                </div>
              )}
              <a href="/admin" className="badge-warn hover:bg-orange-900/20 transition-colors cursor-pointer">
                ADMIN PANEL
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">

          {/* Hero */}
          <div className="mb-12 fade-in-up">
            <div className="badge-danger mb-4 inline-block">FOR EDUCATIONAL USE ONLY</div>
            <h1 className="font-display text-3xl md:text-4xl text-cyber-green glow-green tracking-widest mb-4 leading-tight">
              BROWSER GEOLOCATION<br />SECURITY RESEARCH
            </h1>
            <p className="text-cyber-text text-sm md:text-base leading-relaxed max-w-3xl">
              Academic documentation of the Web Geolocation API, browser permission models, consent frameworks,
              tracking mechanisms, and attack surface analysis for cybersecurity professionals and CTF participants.
            </p>
            <div className="flex gap-3 mt-6 flex-wrap">
              <span className="badge-safe">ACADEMIC RESEARCH</span>
              <span className="badge-warn">CTF CHALLENGES</span>
              <span className="badge-safe">ETHICAL HACKING</span>
            </div>
          </div>

          {/* Session Info */}
          {session && (
            <div className="cyber-panel rounded-lg p-5 mb-8 fade-in-up delay-100">
              <div className="font-display text-xs text-cyber-muted tracking-widest mb-3">// YOUR RESEARCH SESSION</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
                <div>
                  <div className="text-cyber-muted text-xs mb-1">COOKIE ID</div>
                  <div className="text-cyber-lime text-xs truncate">{session.cookieId}</div>
                </div>
                <div>
                  <div className="text-cyber-muted text-xs mb-1">VISIT COUNT</div>
                  <div className="text-cyber-green">#{session.visits}</div>
                </div>
                <div>
                  <div className="text-cyber-muted text-xs mb-1">FIRST SEEN</div>
                  <div className="text-cyber-text text-xs">{new Date(session.firstSeen).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-cyber-muted text-xs mb-1">PERSISTENCE</div>
                  <div className="text-cyber-green text-xs">Cookie (365d)</div>
                </div>
              </div>
            </div>
          )}

          {/* Permission Demo */}
          <div className="fade-in-up delay-200">
            <PermissionDemo session={session} />
          </div>

          {/* Research Modules */}
          <div className="mb-8 fade-in-up delay-300">
            <h2 className="font-display text-lg text-cyber-green tracking-widest mb-6">
              [ RESEARCH MODULES ]
            </h2>

            <ResearchModule
              title="Browser Geolocation API — Permission Architecture"
              category="WEB"
              points={100}
              content={
                <div className="space-y-4 text-sm">
                  <p className="text-cyber-text leading-relaxed">
                    The Web Geolocation API (<code className="text-cyber-lime">navigator.geolocation</code>) is governed
                    by the <strong className="text-cyber-green">Permissions API</strong>. Browsers enforce this at the
                    engine level — JavaScript cannot bypass it.
                  </p>
                  <div className="code-block rounded text-xs">
                    <div className="text-cyber-green mb-2">// How permission is CORRECTLY requested</div>
                    <div>navigator.geolocation.getCurrentPosition(</div>
                    <div className="pl-4">successCallback,  <span className="text-cyber-muted">// only fires if granted</span></div>
                    <div className="pl-4">errorCallback,    <span className="text-cyber-muted">// fires on deny/error</span></div>
                    <div className="pl-4">options           <span className="text-cyber-muted">// accuracy, timeout, maxAge</span></div>
                    <div>);</div>
                    <div className="mt-3 text-cyber-green">// Check permission state without requesting</div>
                    <div>const result = await navigator.permissions.query({'{'}</div>
                    <div className="pl-4">name: &quot;geolocation&quot;</div>
                    <div>{'}'});</div>
                    <div>console.log(result.state); <span className="text-cyber-muted">// "granted"|"denied"|"prompt"</span></div>
                  </div>
                  <div className="p-3 bg-red-950/30 border border-cyber-red rounded text-xs text-cyber-red">
                    ⚠ FINDING: There is NO JavaScript method to bypass this permission model.
                    Any tool claiming to do so either uses social engineering or exploits
                    unpatched browser vulnerabilities (CVEs).
                  </div>
                  <p className="text-cyber-muted text-xs">
                    CTF Flag for this module: Analyze the permission states and identify what value
                    <code className="text-cyber-lime"> result.state </code> returns when a user has never been asked.
                  </p>
                </div>
              }
            />

            <ResearchModule
              title="Cookie-Based Persistent Session Tracking"
              category="TRACKING"
              points={150}
              content={
                <div className="space-y-4 text-sm">
                  <p className="text-cyber-text leading-relaxed">
                    This platform demonstrates how persistent cookies enable cross-session tracking without
                    re-authentication. The session cookie assigned to you persists for 365 days.
                  </p>
                  <div className="code-block rounded text-xs">
                    <div className="text-cyber-green mb-2">// Cookie creation pattern used in this app</div>
                    <div>document.cookie = [</div>
                    <div className="pl-4">&quot;ctf_session_id=&quot; + uniqueId,</div>
                    <div className="pl-4">&quot;max-age=31536000&quot;,   <span className="text-cyber-muted">// 365 days</span></div>
                    <div className="pl-4">&quot;SameSite=Lax&quot;,       <span className="text-cyber-muted">// CSRF protection</span></div>
                    <div className="pl-4">&quot;Secure&quot;             <span className="text-cyber-muted">// HTTPS only</span></div>
                    <div>].join(&apos;; &apos;);</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-green-950/30 border border-cyber-green rounded text-xs">
                      <div className="text-cyber-green font-bold mb-2">✓ ETHICAL USE</div>
                      <ul className="text-cyber-text space-y-1">
                        <li>• Disclosed in privacy policy</li>
                        <li>• User can clear cookies</li>
                        <li>• Used for session continuity</li>
                        <li>• No PII stored in cookie</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-red-950/30 border border-cyber-red rounded text-xs">
                      <div className="text-cyber-red font-bold mb-2">✗ MALICIOUS USE</div>
                      <ul className="text-cyber-text space-y-1">
                        <li>• No disclosure to user</li>
                        <li>• Cross-site tracking</li>
                        <li>• Fingerprint reconstruction</li>
                        <li>• Third-party exfiltration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              }
            />

            <ResearchModule
              title="IP Geolocation vs GPS — Precision Analysis"
              category="NETWORK"
              points={200}
              content={
                <div className="space-y-4 text-sm">
                  <p className="text-cyber-text leading-relaxed">
                    IP-based geolocation works without any user permission but is significantly less precise.
                    Understanding the difference is critical for threat modeling.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-cyber-border">
                          <th className="text-left text-cyber-green py-2 pr-4">METHOD</th>
                          <th className="text-left text-cyber-muted py-2 pr-4">ACCURACY</th>
                          <th className="text-left text-cyber-muted py-2 pr-4">PERMISSION</th>
                          <th className="text-left text-cyber-muted py-2">USE CASE</th>
                        </tr>
                      </thead>
                      <tbody className="text-cyber-text">
                        <tr className="border-b border-cyber-border/50">
                          <td className="py-2 pr-4 text-cyber-lime">GPS (Browser API)</td>
                          <td className="py-2 pr-4">3–10m</td>
                          <td className="py-2 pr-4 text-cyber-green">Required</td>
                          <td className="py-2">Navigation, precise tracking</td>
                        </tr>
                        <tr className="border-b border-cyber-border/50">
                          <td className="py-2 pr-4 text-cyber-lime">WiFi Triangulation</td>
                          <td className="py-2 pr-4">15–50m</td>
                          <td className="py-2 pr-4 text-cyber-green">Required</td>
                          <td className="py-2">Indoor location</td>
                        </tr>
                        <tr className="border-b border-cyber-border/50">
                          <td className="py-2 pr-4 text-cyber-lime">Cell Tower</td>
                          <td className="py-2 pr-4">100m–5km</td>
                          <td className="py-2 pr-4 text-cyber-green">Required</td>
                          <td className="py-2">Mobile fallback</td>
                        </tr>
                        <tr className="border-b border-cyber-border/50">
                          <td className="py-2 pr-4 text-cyber-lime">IP Geolocation</td>
                          <td className="py-2 pr-4">City-level</td>
                          <td className="py-2 pr-4 text-cyber-red">None</td>
                          <td className="py-2">Rough region detection</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 text-cyber-lime">VPN/Tor exit node</td>
                          <td className="py-2 pr-4">Country-level</td>
                          <td className="py-2 pr-4 text-cyber-red">None</td>
                          <td className="py-2">Circumvention detection</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="code-block rounded text-xs">
                    <div className="text-cyber-green mb-2">// Server-side IP geolocation (no consent needed)</div>
                    <div>const ip = req.headers[&apos;x-forwarded-for&apos;] || req.socket.remoteAddress;</div>
                    <div>const geo = await fetch(`https://ipapi.co/${'{'}ip{'}'}/json/`);</div>
                    <div className="text-cyber-muted">// Returns: city, region, country, lat/lng (approximate)</div>
                  </div>
                </div>
              }
            />

            <ResearchModule
              title="Dark Patterns — Coercive Permission UI (Anti-Pattern Docs)"
              category="ETHICS"
              points={250}
              content={
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-red-950/30 border border-cyber-red rounded text-xs text-cyber-red mb-4">
                    ⚠ DOCUMENTATION ONLY — These patterns are illegal under GDPR/CCPA and unethical. Documented here for recognition and defense.
                  </div>
                  <p className="text-cyber-text leading-relaxed">
                    Dark patterns in permission UIs manipulate users into granting access they wouldn&apos;t otherwise grant.
                    Security researchers must recognize these to build defenses and report violations.
                  </p>
                  <div className="space-y-3">
                    {[
                      { name: 'Blur Gate', desc: 'Blurring content and demanding permission to view it — coercive, not consent-based. Violates informed consent principles.', severity: 'HIGH' },
                      { name: 'Permission Laundering', desc: 'Requesting permission via an iframe from a third party to bypass same-origin permission caching.', severity: 'HIGH' },
                      { name: 'Fake System Dialogs', desc: 'Overlaying fake OS-style permission dialogs to confuse users into clicking "Allow".', severity: 'CRITICAL' },
                      { name: 'Re-prompt Loops', desc: 'Continuously re-requesting permission after denial, exploiting permission prompt quotas.', severity: 'MEDIUM' },
                      { name: 'Misdirection Buttons', desc: 'Labeling "Deny" as "Later" or "Allow" as "Continue" to obscure the actual permission choice.', severity: 'MEDIUM' },
                    ].map(item => (
                      <div key={item.name} className="flex gap-3 p-3 border border-cyber-border rounded">
                        <span className={`badge-danger shrink-0 self-start`}>{item.severity}</span>
                        <div>
                          <div className="text-cyber-orange font-bold text-xs mb-1">{item.name}</div>
                          <div className="text-cyber-muted text-xs">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />

            <ResearchModule
              title="Defensive Countermeasures & Detection"
              category="DEFENSE"
              points={300}
              content={
                <div className="space-y-4 text-sm">
                  <p className="text-cyber-text leading-relaxed">
                    How to detect, block, and report malicious location tracking patterns.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-cyber-green font-bold mb-2 uppercase tracking-wide">Browser Defenses</div>
                      <ul className="text-cyber-text space-y-2">
                        <li className="flex gap-2"><span className="text-cyber-green">▸</span> Use uBlock Origin + Privacy Badger</li>
                        <li className="flex gap-2"><span className="text-cyber-green">▸</span> Firefox: Enhanced Tracking Protection</li>
                        <li className="flex gap-2"><span className="text-cyber-green">▸</span> Spoof geolocation via browser extensions</li>
                        <li className="flex gap-2"><span className="text-cyber-green">▸</span> Regularly clear site cookies/permissions</li>
                        <li className="flex gap-2"><span className="text-cyber-green">▸</span> Check chrome://settings/content/location</li>
                      </ul>
                    </div>
                    <div>
                      <div className="text-cyber-green font-bold mb-2 uppercase tracking-wide">Legal Reporting</div>
                      <ul className="text-cyber-text space-y-2">
                        <li className="flex gap-2"><span className="text-cyber-blue">▸</span> EU: Report to your national DPA (GDPR Art. 77)</li>
                        <li className="flex gap-2"><span className="text-cyber-blue">▸</span> US: FTC complaint at ftc.gov/complaint</li>
                        <li className="flex gap-2"><span className="text-cyber-blue">▸</span> PK: PTA complaint portal (PPDP Act 2023)</li>
                        <li className="flex gap-2"><span className="text-cyber-blue">▸</span> Browser vendors: Chrome/Firefox bug trackers</li>
                      </ul>
                    </div>
                  </div>
                  <div className="code-block rounded text-xs">
                    <div className="text-cyber-green mb-2">// Detecting consent violations programmatically</div>
                    <div>const perm = await navigator.permissions.query({'{'} name: &apos;geolocation&apos; {'}'});</div>
                    <div>if (perm.state === &apos;granted&apos; &amp;&amp; !userExplicitlyConsented) {'{'}</div>
                    <div className="pl-4 text-cyber-red">// RED FLAG: Permission granted without explicit UI interaction</div>
                    <div className="pl-4">reportViolation(window.location.href);</div>
                    <div>{'}'}</div>
                  </div>
                </div>
              }
            />
          </div>

          {/* Flag Submission */}
          {session && (
            <div className="fade-in-up delay-400">
              <FlagSubmission cookieId={session.cookieId} />
            </div>
          )}

          {/* Disclaimer */}
          <div className="cyber-panel rounded-lg p-6 mb-8 border-cyber-orange/50 fade-in-up delay-500">
            <div className="font-display text-xs text-cyber-orange tracking-widest mb-3">// LEGAL DISCLAIMER</div>
            <p className="text-cyber-muted text-xs leading-relaxed">
              This platform is designed exclusively for academic cybersecurity research and CTF (Capture The Flag) education.
              All techniques documented here are for defensive understanding only. Implementing coercive tracking patterns
              against real users without explicit informed consent violates GDPR, CCPA, Pakistan&apos;s Personal Data Protection Act 2023,
              and may constitute criminal computer fraud in most jurisdictions. Researchers must obtain proper ethics approval
              before conducting any live testing involving real users.
            </p>
          </div>

        </main>

        <footer className="border-t border-cyber-border py-6">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs font-mono text-cyber-muted">
            <span>GeoSec CTF Lab — Academic Research Platform</span>
            <span>Built for cybersecurity education</span>
          </div>
        </footer>
      </div>
    </>
  )
}
