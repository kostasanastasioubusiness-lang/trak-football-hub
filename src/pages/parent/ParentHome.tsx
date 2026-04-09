import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, TrakCard, MetadataLabel, BandPill, CategoryBar } from '@/components/trak'
import { BANDS, type BandType } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

export default function ParentHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [childName, setChildName] = useState('')
  const [matches, setMatches] = useState<any[]>([])
  const [latestAssessment, setLatestAssessment] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    // Find linked child
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) return
      const childId = links[0].player_user_id
      // Get child profile
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', childId).single()
      if (profile) setChildName(profile.full_name)
      // Get child matches (filtered columns)
      const { data: matchData } = await supabase.from('matches')
        .select('id, team_score, opponent_score, competition, venue, minutes_played, computed_rating, created_at, position')
        .eq('user_id', childId).order('created_at', { ascending: false })
      setMatches(matchData || [])
    })
  }, [user])

  const getSeasonBand = (): BandType => {
    if (matches.length === 0) return 'steady'
    const bands = matches.map(m => scoreToBand(m.computed_rating || 6.5))
    const counts: Record<string, number> = {}
    bands.forEach(b => { counts[b] = (counts[b] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as BandType
  }

  const seasonBand = getSeasonBand()

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-6">
        {childName && <p className="text-lg font-light text-white/88">{childName}'s Dashboard</p>}
        <TrakCard elevated>
          <div className="space-y-3">
            <MetadataLabel text="THIS SEASON" />
            {matches.length > 0 ? (
              <>
                <p className="text-[40px] leading-none" style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
                  color: BANDS.find(b => b.word.toLowerCase() === seasonBand)?.color
                }}>
                  {BANDS.find(b => b.word.toLowerCase() === seasonBand)?.word}
                </p>
                <MetadataLabel text={`${matches.length} MATCHES LOGGED`} />
              </>
            ) : (
              <p className="text-white/45 text-sm">No matches yet. When {childName || 'your child'} logs a match, you'll see it here.</p>
            )}
          </div>
        </TrakCard>
      </div>
      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
