import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, AlertCard, MetadataLabel } from '@/components/trak'

interface Alert {
  type: 'match_logged' | 'assessment' | 'medal'
  detail: string
  timestamp: string
}

export default function ParentAlerts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [childName, setChildName] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) return
      const childId = links[0].player_user_id
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', childId).single()
      if (profile) setChildName(profile.full_name)

      const { data: matchData } = await supabase.from('matches')
        .select('id, created_at, competition').eq('user_id', childId)
        .order('created_at', { ascending: false }).limit(10)

      const matchAlerts: Alert[] = (matchData || []).map(m => ({
        type: 'match_logged' as const,
        detail: `logged a ${m.competition} match`,
        timestamp: m.created_at,
      }))
      setAlerts(matchAlerts)
    })
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <MetadataLabel text="ALERTS" />
        {alerts.length === 0 ? (
          <p className="text-white/45 text-sm">No alerts yet.</p>
        ) : alerts.map((a, i) => (
          <AlertCard key={i} type={a.type} childName={childName} detail={a.detail} timestamp={a.timestamp} />
        ))}
      </div>
      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
