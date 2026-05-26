import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MatchCard } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'

const FILTERS = ['All', 'League', 'Cup', 'Friendly']

export default function PlayerMatches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('matches').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const groups = new Map<string, any>()
        for (const m of (data || [])) {
          const key = `${(m.opponent || '').toLowerCase()}|${m.team_score}|${m.opponent_score}`
          const existing = groups.get(key)
          if (!existing || (m.computed_rating ?? 0) > (existing.computed_rating ?? 0)) {
            groups.set(key, m)
          }
        }
        const deduped = Array.from(groups.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setMatches(deduped)
      })
  }, [user])

  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All' ? matches : matches.filter(m => m.competition === filter)

  return (
    <MobileShell>
      <div className="pt-3 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] tracking-[0.12em] uppercase text-white/35 mb-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}>Player</p>
            <h1 className="text-[22px] font-light text-white/88 leading-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>Matches</h1>
          </div>
          <span className="text-[10px] text-white/30" style={{ fontFamily: "'DM Mono', monospace" }}>
            {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-colors flex-shrink-0"
              style={{
                background: filter === f ? 'rgba(200,242,90,0.12)' : 'rgba(255,255,255,0.04)',
                border: filter === f ? '1px solid rgba(200,242,90,0.3)' : '1px solid rgba(255,255,255,0.07)',
                color: filter === f ? '#C8F25A' : 'rgba(255,255,255,0.45)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Match list */}
        {filtered.length === 0 ? (
          <p className="text-white/35 text-sm mt-4">No matches found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <MatchCard
                key={m.id}
                opponent={m.opponent ? `vs ${m.opponent}` : m.competition || 'Match'}
                date={m.created_at}
                scoreUs={m.team_score}
                scoreThem={m.opponent_score}
                competition={m.competition}
                band={scoreToBand(m.computed_rating || 6.5)}
                onClick={() => navigate(`/player/match/${m.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
