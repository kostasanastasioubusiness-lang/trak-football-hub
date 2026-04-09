import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, TrakCard, MetadataLabel } from '@/components/trak'

export default function CoachHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [playerCount, setPlayerCount] = useState(0)
  const [assessmentCount, setAssessmentCount] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('squad_players').select('id', { count: 'exact' }).eq('coach_user_id', user.id).then(({ count }) => setPlayerCount(count || 0))
    supabase.from('coach_assessments').select('id', { count: 'exact' }).eq('coach_user_id', user.id).then(({ count }) => setAssessmentCount(count || 0))
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-6">
        <MetadataLabel text="COACH DASHBOARD" />
        <TrakCard elevated>
          <div className="space-y-3">
            <p className="text-lg font-light text-white/88">{playerCount} Players</p>
            <p className="text-sm text-white/45">{assessmentCount} assessments this season</p>
          </div>
        </TrakCard>

        <div className="space-y-3">
          <button onClick={() => navigate('/coach/assess')}
            className="w-full py-3 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm">
            Assess a Player
          </button>
          <button onClick={() => navigate('/coach/sessions')}
            className="w-full py-3 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-white/45">
            Log Session
          </button>
          <button onClick={() => navigate('/coach/squad')}
            className="w-full py-3 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-white/45">
            View Squad
          </button>
        </div>
      </div>
      <NavBar role="coach" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
