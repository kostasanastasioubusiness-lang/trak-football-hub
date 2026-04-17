import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'
import type { MedalType } from '@/lib/types'

interface MedalDef {
  type: MedalType
  name: string
  description: string
}

const ALL_MEDALS: MedalDef[] = [
  { type: 'first_match', name: 'First Match', description: 'Logged your first match' },
  { type: 'on_a_roll', name: 'On a Roll', description: 'Logged 5 weeks in a row' },
  { type: 'first_star', name: 'First Star', description: 'Earned an Exceptional band' },
  { type: 'ten_down', name: 'Ten Down', description: 'Logged 10 matches' },
  { type: 'most_improved', name: 'Most Improved', description: 'Avg rose over 20 matches' },
  { type: 'self_aware', name: 'Self Aware', description: 'Self-rating matched coach' },
]

export default function PlayerMedals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [earned, setEarned] = useState<Set<MedalType>>(new Set())

  useEffect(() => {
    // Medals table may not exist yet - gracefully handle
    // For now, show all as unearned
  }, [user])

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-4">
        <MetadataLabel text="MEDALS" />
        <div className="grid grid-cols-2 gap-3">
          {ALL_MEDALS.map((m) => {
            const isEarned = earned.has(m.type)
            return (
              <div
                key={m.type}
                className="relative bg-[#101012] p-4 transition-all"
                style={{
                  borderRadius: '14px',
                  border: `1px solid ${isEarned ? 'rgba(200,242,90,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  opacity: isEarned ? 1 : 0.4,
                }}
              >
                {isEarned && (
                  <span
                    className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#C8F25A]"
                    aria-label="Unlocked"
                  />
                )}
                <p
                  className="text-[13px] text-[rgba(255,255,255,0.92)] leading-tight"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {m.name}
                </p>
                <p
                  className="text-[9px] uppercase tracking-wider text-white/45 mt-2 leading-snug"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {m.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
