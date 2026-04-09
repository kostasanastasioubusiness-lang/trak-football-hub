import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, GoalCard, MetadataLabel } from '@/components/trak'

export default function ParentGoals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) return
      const { data } = await supabase.from('player_goals').select('*').eq('user_id', links[0].player_user_id)
      setGoals(data || [])
    })
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <MetadataLabel text="GOALS" />
        {goals.length === 0 ? (
          <p className="text-white/45 text-sm">No goals set yet.</p>
        ) : goals.map(g => (
          <GoalCard key={g.id} title={g.goal_type} category="performance"
            targetNumber={g.target_value} currentNumber={0} progressLevel={null} isAutoTracked={false} />
        ))}
      </div>
      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
