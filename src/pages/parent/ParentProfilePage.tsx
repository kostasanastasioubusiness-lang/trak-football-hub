import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, Settings as SettingsIcon } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'
import { IconProfile } from '@/components/icons/TrakIcons'

export default function ParentProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [childName, setChildName] = useState<string>('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('player_parent_links')
      .select('player_user_id')
      .eq('parent_user_id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data?.player_user_id) return
        const { data: childProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', data.player_user_id)
          .maybeSingle()
        if (childProfile?.full_name) setChildName(childProfile.full_name)
      })
  }, [user])

  return (
    <MobileShell>
      <div className="border-b-2 border-white/[0.88] pt-4 pb-2 mb-3">
        <p className="text-[9px] tracking-[0.22em] uppercase text-white/45 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
          The Trak Times &middot; Subscriber
        </p>
        <h1 className="text-[34px] leading-[0.95] text-white/95" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, letterSpacing: '-0.03em', fontStyle: 'italic' }}>
          Your Desk
        </h1>
      </div>

      <div className="pt-2 pb-4 space-y-2.5">
        {/* Subscriber card */}
        <div className="text-center mb-6 py-4 border-b border-white/[0.08]">
          <div className="w-[64px] h-[64px] rounded-full bg-white/[0.04] border border-white/[0.1] mx-auto mb-3 flex items-center justify-center">
            <IconProfile size={28} color="#C8F25A" />
          </div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-white/45 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
            Subscriber
          </p>
          <p className="text-[24px] text-white/95 leading-tight" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, letterSpacing: '-0.02em' }}>
            {profile?.full_name || 'Parent'}
          </p>
          <p className="text-[12px] text-white/55 mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
            {childName ? `Following the ${childName} desk` : 'No desk subscribed yet'}
          </p>
        </div>

        {/* Account info */}
        <Section label="ACCOUNT">
          <Row label="Name" value={profile?.full_name || '—'} />
          <Row label="Email" value={user?.email || '—'} last />
        </Section>

        {/* Settings entry */}
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center justify-between rounded-[18px] p-4 border border-white/[0.07] bg-[#101012] text-left hover:bg-[#141416] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
              <SettingsIcon size={16} className="text-white/55" />
            </div>
            <div>
              <MetadataLabel text="SETTINGS" />
              <p className="text-[12px] text-white/55 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Notifications, privacy, account
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/40" />
        </button>
      </div>
      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-1 mb-2">
        <MetadataLabel text={label} />
      </div>
      <div className="px-4 rounded-[18px] border border-white/[0.07] bg-[#101012]">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="py-3.5 flex items-center justify-between gap-3"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        {label}
      </span>
      <span className="text-[13px] text-white/78 truncate max-w-[200px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {value}
      </span>
    </div>
  )
}