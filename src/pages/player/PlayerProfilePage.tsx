import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'

interface SeasonStats {
  played: number
  goals: number
  assists: number
  wins: number
}

export default function PlayerProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [details, setDetails] = useState<any>(null)
  const [stats, setStats] = useState<SeasonStats>({ played: 0, goals: 0, assists: 0, wins: 0 })

  useEffect(() => {
    if (!user) return
    supabase
      .from('player_details')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setDetails(data))
    supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const matches = data || []
        setStats({
          played: matches.length,
          goals: matches.reduce((s, m) => s + (m.goals || 0), 0),
          assists: matches.reduce((s, m) => s + (m.assists || 0), 0),
          wins: matches.filter((m) => (m.team_score || 0) > (m.opponent_score || 0)).length,
        })
      })
  }, [user])

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??'

  const pills = [details?.position, details?.current_club, details?.age_group].filter(Boolean) as string[]

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-8">
        <MetadataLabel text="PROFILE" />

        {/* Identity */}
        <div className="space-y-4">
          <div
            className="w-20 h-20 flex items-center justify-center bg-[#202024] border border-white/10"
            style={{ borderRadius: '16px' }}
          >
            <span
              className="text-[28px] leading-none text-[#C8F25A]"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {initials}
            </span>
          </div>

          <h1
            className="text-[28px] leading-tight text-[rgba(255,255,255,0.92)]"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, letterSpacing: '-0.02em' }}
          >
            {profile?.full_name || 'Player'}
          </h1>

          {pills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pills.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 text-white/70"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Season stats */}
        <div className="space-y-3">
          <MetadataLabel text="SEASON STATS" />
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Played" value={stats.played} />
            <StatCard label="Goals" value={stats.goals} />
            <StatCard label="Assists" value={stats.assists} />
            <StatCard label="Wins" value={stats.wins} />
          </div>
        </div>

        <button
          onClick={async () => {
            await signOut()
            navigate('/')
          }}
          className="w-full py-3 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-white/45"
        >
          Sign Out
        </button>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="bg-[#101012] border border-white/[0.07] px-3 py-4 flex flex-col gap-2"
      style={{ borderRadius: '14px' }}
    >
      <span
        className="text-[32px] leading-none text-[rgba(255,255,255,0.92)]"
        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
      >
        {value}
      </span>
      <span
        className="text-[9px] uppercase tracking-wider text-white/45"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {label}
      </span>
    </div>
  )
}
