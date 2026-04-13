import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { MobileShell, MetadataLabel, TrakCard } from '@/components/trak'

const GOAL_TEMPLATES = [
  { title: 'Log 10 matches', description: 'Track your first 10 matches to build a picture of your game.', target_value: 10, goal_type: 'matches_logged' },
  { title: 'Reach Standout band', description: 'Push your average rating into the Standout performance band.', target_value: 1, goal_type: 'reach_band' },
  { title: 'Score 5 goals', description: 'Find the net 5 times across your logged matches.', target_value: 5, goal_type: 'goals_scored' },
  { title: 'Play 500 minutes', description: 'Accumulate 500 minutes of match time on the pitch.', target_value: 500, goal_type: 'minutes_played' },
  { title: 'Get 3 assists', description: 'Set up 3 goals for your teammates.', target_value: 3, goal_type: 'assists_made' },
]

export default function PlayerAddGoal() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleSelect(template: typeof GOAL_TEMPLATES[number]) {
    if (!user || loading) return
    setLoading(true)
    await supabase.from('player_goals').insert({
      user_id: user.id,
      goal_type: template.goal_type,
      target_value: template.target_value,
      status: 'active',
    })
    navigate('/player/goals')
  }

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <button onClick={() => navigate('/player/goals')} className="flex items-center gap-1 text-white/60 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <MetadataLabel text="ADD A GOAL" />
        <p className="text-white/45 text-sm">Pick a goal to start tracking your progress.</p>
        <div className="space-y-3">
          {GOAL_TEMPLATES.map(t => (
            <button key={t.goal_type} onClick={() => handleSelect(t)} disabled={loading}
              className="w-full text-left">
              <TrakCard>
                <h3 className="text-white/88 font-semibold text-sm">{t.title}</h3>
                <p className="text-white/45 text-xs mt-1">{t.description}</p>
              </TrakCard>
            </button>
          ))}
        </div>
      </div>
    </MobileShell>
  )
}
