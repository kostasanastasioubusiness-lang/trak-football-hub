import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MatchCard, MetadataLabel } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'

export default function PlayerMatches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('matches').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setMatches(data || []))
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <MetadataLabel text="MATCH HISTORY" />
        {matches.length === 0 ? (
          <p className="text-white/45 text-sm">No matches yet.</p>
        ) : matches.map(m => (
          <MatchCard key={m.id}
            opponent={`${m.team_score}-${m.opponent_score}`}
            date={m.created_at} scoreUs={m.team_score} scoreThem={m.opponent_score}
            band={scoreToBand(m.computed_rating || 6.5)}
            onClick={() => navigate(`/player/match/${m.id}`)} />
        ))}
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
