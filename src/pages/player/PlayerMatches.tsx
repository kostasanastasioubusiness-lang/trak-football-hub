import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MatchCard, MetadataLabel } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'
import type { BandType } from '@/lib/types'

const COMPETITION_FILTERS = ['All', 'League', 'Cup', 'Tournament', 'Friendly']

export default function PlayerMatches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState<any[]>([])
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    if (!user) return
    supabase.from('matches').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setMatches(data || []))
  }, [user])

  const filtered = filter === 'All' ? matches : matches.filter(m => m.competition === filter)

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <MetadataLabel text="MATCH HISTORY" />

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {COMPETITION_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-[#C8F25A]/15 text-[#C8F25A] border border-[#C8F25A]/30'
                  : 'bg-[#202024] text-white/45 border border-white/[0.07]'
              }`}>
              {f}
            </button>
          ))}
        </div>

        <p className="text-xs text-white/30">{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</p>

        {filtered.length === 0 ? (
          <p className="text-white/45 text-sm">No matches found.</p>
        ) : filtered.map(m => (
          <MatchCard key={m.id}
            opponent={m.competition || 'Match'}
            date={m.created_at} scoreUs={m.team_score} scoreThem={m.opponent_score}
            band={scoreToBand(m.computed_rating || 6.5)}
            onClick={() => navigate(`/player/match/${m.id}`)} />
        ))}
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
