import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, GoalCard, MetadataLabel } from '@/components/trak'

export default function PlayerGoalsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('player_goals').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setGoals(data || []))
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <MetadataLabel text="MY GOALS" />
          <button onClick={() => navigate('/player/goals/add')}
            className="px-3 py-1.5 rounded-[10px] bg-[#C8F25A] text-black text-xs font-bold">
            Add Goal
          </button>
        </div>
        {goals.length === 0 ? (
          <p className="text-white/45 text-sm">No goals set yet. Add one to start tracking.</p>
        ) : goals.map(g => (
          <GoalCard key={g.id} title={g.goal_type} category="performance"
            targetNumber={g.target_value} currentNumber={0}
            progressLevel={null} isAutoTracked={false} />
        ))}
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
