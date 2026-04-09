import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, TrakCard, MetadataLabel, InviteCodeDisplay } from '@/components/trak'
import { formatCoachCode } from '@/lib/invite-codes'

export default function CoachProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [details, setDetails] = useState<any>(null)
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('coach_details').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setDetails(data)
      // Generate a deterministic invite code from coach id
      const code = (data?.id || user.id).substring(0, 4).toUpperCase()
      setInviteCode(formatCoachCode(code))
    })
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-6">
        <MetadataLabel text="PROFILE" />
        <TrakCard elevated>
          <div className="space-y-3">
            <p className="text-xl font-light text-white/88">{profile?.full_name}</p>
            {details && (
              <div className="flex gap-4 text-sm text-white/45">
                {details.current_club && <span>{details.current_club}</span>}
                {details.team && <span>{details.team}</span>}
                {details.coach_role && <span>{details.coach_role}</span>}
              </div>
            )}
          </div>
        </TrakCard>

        <TrakCard>
          <InviteCodeDisplay code={inviteCode} label="YOUR INVITE CODE" />
          <p className="text-xs text-white/45 text-center mt-2">Share this code with your players so they can connect with you.</p>
        </TrakCard>

        <button onClick={async () => { await signOut(); navigate('/') }}
          className="w-full py-3 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-white/45">
          Sign Out
        </button>
      </div>
      <NavBar role="coach" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
