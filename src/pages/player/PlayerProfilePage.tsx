import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, TrakCard, MetadataLabel, InviteCodeDisplay } from '@/components/trak'

export default function PlayerProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [details, setDetails] = useState<any>(null)
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('player_details').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => setDetails(data))
    supabase.from('matches').select('id', { count: 'exact' }).eq('user_id', user.id).then(({ count }) => setMatchCount(count || 0))
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-6">
        <MetadataLabel text="PROFILE" />
        <TrakCard elevated>
          <div className="space-y-3">
            <p className="text-xl font-light text-white/88">{profile?.full_name}</p>
            {details && (
              <>
                <div className="flex gap-4 text-sm text-white/45">
                  {details.position && <span>{details.position}</span>}
                  {details.current_club && <span>{details.current_club}</span>}
                  {details.age_group && <span>{details.age_group}</span>}
                </div>
                {details.shirt_number && <p className="text-sm text-white/45">#{details.shirt_number}</p>}
              </>
            )}
            {profile?.nationality && <p className="text-sm text-white/45">{profile.nationality}</p>}
          </div>
        </TrakCard>

        <TrakCard>
          <div className="space-y-2">
            <MetadataLabel text="SEASON STATS" />
            <p className="text-sm text-white/88">{matchCount} matches played</p>
          </div>
        </TrakCard>

        <button onClick={async () => { await signOut(); navigate('/') }}
          className="w-full py-3 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-white/45">
          Sign Out
        </button>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
