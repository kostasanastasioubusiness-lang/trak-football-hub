import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { MobileShell, BandPill, MetadataLabel, TrakCard } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'
import { ChevronLeft } from 'lucide-react'
import { MatchDetailExtras } from '@/components/player/MatchDetailExtras'

export default function PlayerMatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    supabase.from('matches').select('*').eq('id', id).single().then(({ data }) => setMatch(data))
  }, [id])

  if (!match) return <MobileShell><div className="pt-12 text-center text-white/45">Loading...</div></MobileShell>

  const band = scoreToBand(match.computed_rating || 6.5)

  return (
    <MobileShell>
      <div className="pt-8 pb-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/45 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-light text-white/88">{match.team_score} - {match.opponent_score}</h1>
          <BandPill band={band} />
        </div>
        <TrakCard>
          <div className="space-y-2">
            <div className="flex justify-between"><MetadataLabel text="Competition" /><span className="text-sm text-white/88">{match.competition}</span></div>
            <div className="flex justify-between"><MetadataLabel text="Venue" /><span className="text-sm text-white/88">{match.venue}</span></div>
            <div className="flex justify-between"><MetadataLabel text="Position" /><span className="text-sm text-white/88">{match.position}</span></div>
            <div className="flex justify-between"><MetadataLabel text="Minutes" /><span className="text-sm text-white/88">{match.minutes_played}</span></div>
            <div className="flex justify-between"><MetadataLabel text="Goals" /><span className="text-sm text-white/88">{match.goals}</span></div>
            <div className="flex justify-between"><MetadataLabel text="Assists" /><span className="text-sm text-white/88">{match.assists}</span></div>
          </div>
        </TrakCard>

        <MatchDetailExtras
          matchId={match.id}
          selfRating={match.self_rating}
          note={(match as any).private_note}
        />
      </div>
    </MobileShell>
  )
}
