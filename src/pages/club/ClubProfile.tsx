import { useNavigate } from 'react-router-dom'
import { ChevronRight, Settings as SettingsIcon } from 'lucide-react'
import { ClubShell, ClubCard, SectionLabel } from '@/components/club/ClubShell'
import { useAuth } from '@/contexts/AuthContext'
import { IconHowItWorks } from '@/components/icons/TrakIcons'

export default function ClubProfile() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <ClubShell>
      {/* Identity */}
      <div className="text-center mb-8 pt-2">
        <div
          className="w-[72px] h-[72px] rounded-[22px] mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(200,242,90,0.08)', border: '1px solid rgba(200,242,90,0.18)' }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 600, color: '#C8F25A' }}>
            {(profile?.full_name || 'A').charAt(0).toUpperCase()}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          {profile?.full_name || '—'}
        </p>
        <span
          className="inline-flex items-center mt-2 h-5 px-2.5 rounded-full"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#C8F25A',
            background: 'rgba(200,242,90,0.08)',
            border: '1px solid rgba(200,242,90,0.2)',
          }}
        >
          Administrator
        </span>
      </div>

      {/* Nav rows */}
      <div className="space-y-2.5 mb-8">
        <button
          onClick={() => navigate('/how-it-works')}
          className="w-full flex items-center justify-between rounded-[18px] p-4 text-left transition-colors"
          style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(200,242,90,0.08)', border: '1px solid rgba(200,242,90,0.18)' }}
            >
              <IconHowItWorks size={16} color="#C8F25A" />
            </div>
            <div>
              <SectionLabel>HOW TRAK WORKS</SectionLabel>
              <p className="text-[12px] text-white/55 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Performance bands &amp; rating engine
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/40" />
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center justify-between rounded-[18px] p-4 text-left transition-colors"
          style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <SettingsIcon size={16} className="text-white/55" />
            </div>
            <div>
              <SectionLabel>SETTINGS</SectionLabel>
              <p className="text-[12px] text-white/55 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Account, password, access
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/40" />
        </button>
      </div>

    </ClubShell>
  )
}
