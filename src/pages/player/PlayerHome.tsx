import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MatchCard, MetadataLabel, BandPill, TrakCard } from '@/components/trak'
import { BANDS, type BandType } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

export default function PlayerHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMatches(data || [])
        setLoading(false)
      })
  }, [user])

  const getBandDistribution = () => {
    const dist: Record<string, number> = {}
    BANDS.forEach(b => { dist[b.word.toLowerCase()] = 0 })
    matches.forEach(m => {
      const band = scoreToBand(m.computed_rating || 6.5)
      dist[band] = (dist[band] || 0) + 1
    })
    return dist
  }

  const getSeasonBand = (): BandType => {
    if (matches.length === 0) return 'steady'
    const dist = getBandDistribution()
    let maxBand: BandType = 'steady'
    let maxCount = 0
    Object.entries(dist).forEach(([band, count]) => {
      if (count > maxCount) { maxCount = count; maxBand = band as BandType }
    })
    return maxBand
  }

  const seasonBand = getSeasonBand()
  const distribution = getBandDistribution()
  const maxDist = Math.max(...Object.values(distribution), 1)
  const recentMatches = matches.slice(0, 5)

  if (loading) return <MobileShell><div className="pt-12 text-center text-white/45">Loading...</div></MobileShell>

  return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-6">
        <TrakCard elevated>
          <div className="space-y-4">
            <MetadataLabel text="THIS SEASON" />
            {matches.length > 0 ? (
              <>
                <p className="text-[48px] leading-none" style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
                  color: BANDS.find(b => b.word.toLowerCase() === seasonBand)?.color
                }}>
                  {BANDS.find(b => b.word.toLowerCase() === seasonBand)?.word}
                </p>
                <div className="space-y-1.5">
                  {BANDS.map(b => (
                    <div key={b.word} className="flex items-center gap-2">
                      <span className="w-16 text-[9px] text-right" style={{ color: b.color, fontFamily: "'DM Mono', monospace" }}>
                        {b.word}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#202024] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${(distribution[b.word.toLowerCase()] / maxDist) * 100}%`,
                          backgroundColor: b.color,
                        }} />
                      </div>
                      <span className="w-4 text-[9px] text-white/45">{distribution[b.word.toLowerCase()]}</span>
                    </div>
                  ))}
                </div>
                <MetadataLabel text={`${matches.length} MATCHES LOGGED`} />
              </>
            ) : (
              <p className="text-white/45 text-sm">No matches logged yet. Tap Log to get started.</p>
            )}
          </div>
        </TrakCard>

        {recentMatches.length > 0 && (
          <div className="space-y-3">
            <MetadataLabel text="RECENT MATCHES" />
            {recentMatches.map(m => (
              <MatchCard
                key={m.id}
                opponent={m.opponent_score !== undefined ? `${m.team_score}-${m.opponent_score}` : 'Match'}
                date={m.created_at}
                scoreUs={m.team_score}
                scoreThem={m.opponent_score}
                band={scoreToBand(m.computed_rating || 6.5)}
                onClick={() => navigate(`/player/match/${m.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
