import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MedalSlot, MetadataLabel } from '@/components/trak'
import type { MedalType } from '@/lib/types'

const ALL_MEDALS: MedalType[] = ['first_match', 'on_a_roll', 'first_star', 'ten_down', 'most_improved', 'self_aware']

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
          {ALL_MEDALS.map(m => (
            <MedalSlot key={m} medalType={m} earned={earned.has(m)} />
          ))}
        </div>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
