import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, TrakCard, MetadataLabel } from '@/components/trak'
import { Plus } from 'lucide-react'

export default function CoachSessionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('coach_sessions').select('*').eq('coach_user_id', user.id)
      .order('session_date', { ascending: false }).then(({ data }) => setSessions(data || []))
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <MetadataLabel text="SESSIONS" />
          <button onClick={() => navigate('/coach/sessions/add')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#C8F25A] text-black text-xs font-bold">
            <Plus size={14} /> Add
          </button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-white/45 text-sm">No sessions logged yet.</p>
        ) : sessions.map(s => (
          <TrakCard key={s.id}>
            <div className="space-y-1">
              <p className="text-sm text-white/88">{s.title}</p>
              <MetadataLabel text={`${s.session_type} \u00b7 ${s.session_date ? new Date(s.session_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}`} />
            </div>
          </TrakCard>
        ))}
      </div>
      <NavBar role="coach" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
