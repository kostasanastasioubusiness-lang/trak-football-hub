import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, TrakCard, MetadataLabel } from '@/components/trak'
import { Plus } from 'lucide-react'

export default function CoachSquadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('squad_players').select('*').eq('coach_user_id', user.id)
      .order('player_name').then(({ data }) => setPlayers(data || []))
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <MetadataLabel text="SQUAD" />
          <button onClick={() => navigate('/coach/squad/add')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#C8F25A] text-black text-xs font-bold">
            <Plus size={14} /> Add Player
          </button>
        </div>
        {players.length === 0 ? (
          <p className="text-white/45 text-sm">No players in your squad yet.</p>
        ) : players.map(p => (
          <TrakCard key={p.id}>
            <button onClick={() => navigate(`/coach/player/${p.id}`)} className="w-full text-left flex items-center justify-between">
              <div>
                <p className="text-sm text-white/88">{p.player_name}</p>
                <span className="text-xs text-white/45">{p.position} {p.shirt_number ? `#${p.shirt_number}` : ''}</span>
              </div>
            </button>
          </TrakCard>
        ))}
      </div>
      <NavBar role="coach" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
