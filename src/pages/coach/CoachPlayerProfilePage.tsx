import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, TrakCard, MetadataLabel, CategoryBar, BandPill } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'
import { ChevronLeft } from 'lucide-react'

export default function CoachPlayerProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [player, setPlayer] = useState<any>(null)
  const [assessments, setAssessments] = useState<any[]>([])

  useEffect(() => {
    if (!id || !user) return
    supabase.from('squad_players').select('*').eq('id', id).single().then(({ data }) => setPlayer(data))
    supabase.from('coach_assessments').select('*').eq('squad_player_id', id).eq('coach_user_id', user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setAssessments(data || []))
  }, [id, user])

  if (!player) return <MobileShell><div className="pt-12 text-center text-white/45">Loading...</div></MobileShell>

  const latest = assessments[0]

  return (
    <MobileShell>
      <div className="pt-8 pb-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/45 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-light text-white/88">{player.player_name}</h1>
        <p className="text-sm text-white/45">{player.position} {player.shirt_number ? `#${player.shirt_number}` : ''}</p>

        {latest && (
          <TrakCard elevated>
            <div className="space-y-3">
              <MetadataLabel text="LATEST ASSESSMENT" />
              <CategoryBar label="Work Rate" score={latest.work_rate} />
              <CategoryBar label="Tactical" score={latest.tactical} />
              <CategoryBar label="Attitude" score={latest.attitude} />
              <CategoryBar label="Technical" score={latest.technical} />
              <CategoryBar label="Physical" score={latest.physical} />
              <CategoryBar label="Coachability" score={latest.coachability} />
              <div className="flex justify-center pt-2">
                <BandPill band={scoreToBand((latest.work_rate + latest.tactical + latest.attitude + latest.technical + latest.physical + latest.coachability) / 6)} />
              </div>
            </div>
          </TrakCard>
        )}

        <button onClick={() => navigate('/coach/assess')}
          className="w-full py-3 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm">
          Assess {player.player_name}
        </button>
      </div>
    </MobileShell>
  )
}
