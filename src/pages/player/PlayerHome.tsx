import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, BandPill, MetadataLabel } from '@/components/trak'
import { IconMatch } from '@/components/icons/TrakIcons'
import { CardSkeleton, MatchCardSkeleton, Skeleton } from '@/components/trak'
import { BANDS, type BandType } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'
import { trackEvent } from '@/lib/telemetry'

export default function PlayerHome() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<any>(null)
  const [coachAssessment, setCoachAssessment] = useState<any>(null)
  const [coachName, setCoachName] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('matches').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setMatches(data || []); setLoading(false) })
    supabase.from('player_details').select('position, current_club, age_group').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setDetails(data))
    // Fetch latest coach assessment via squad_players link
    supabase.from('squad_players').select('id').eq('linked_player_id', user.id)
      .then(async ({ data: squadRows }) => {
        if (!squadRows?.length) return
        const ids = squadRows.map((r: any) => r.id)
        const { data: assessments } = await supabase.from('coach_assessments')
          .select('*')
          .in('squad_player_id', ids)
          .order('created_at', { ascending: false })
          .limit(1)
        if (assessments?.length) {
          setCoachAssessment(assessments[0])
          const { data: cp } = await supabase.from('profiles').select('full_name').eq('user_id', assessments[0].coach_user_id).maybeSingle()
          if (cp) setCoachName(cp.full_name)
        }
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
  const totalGoals = matches.reduce((s, m) => s + (m.goals || 0), 0)
  const totalAssists = matches.reduce((s, m) => s + (m.assists || 0), 0)
  const recentMatches = matches.slice(0, 5)
  const lastMatch = matches[0]

  // Trend: calculate last 5 match ratings normalized to bar heights
  const trendMatches = matches.slice(0, 5).reverse()
  const trendHeights = trendMatches.map((m, i) => {
    const r = m.computed_rating || 6.5
    return Math.max(20, Math.min(100, ((r - 4) / 6) * 100))
  })
  const isImproving = trendMatches.length >= 2 &&
    (trendMatches[trendMatches.length - 1]?.computed_rating || 0) > (trendMatches[0]?.computed_rating || 0)

  // Band summary abbreviations
  const bandAbbrev = [
    { key: 'exceptional', abbr: 'E', color: '#C8F25A' },
    { key: 'standout', abbr: 'St', color: '#86efac' },
    { key: 'good', abbr: 'G', color: '#4ade80' },
    { key: 'steady', abbr: 'Sy', color: '#60a5fa' },
    { key: 'mixed', abbr: 'M', color: '#fb923c' },
    { key: 'developing', abbr: 'D', color: '#a78bfa' },
  ]

  if (loading) return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-6">
        <CardSkeleton />
        <div className="space-y-3"><Skeleton className="h-3 w-28" /><MatchCardSkeleton /><MatchCardSkeleton /></div>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )

  return (
    <MobileShell>
      <div className="pt-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-white/20"
            style={{ fontFamily: "'DM Mono', monospace" }}>TRAK</span>
        </div>

        {/* Identity */}
        <div className="py-2.5 pb-4">
          <p className="text-xs text-white/22 mb-1">Good morning,</p>
          <p className="text-[28px] font-semibold text-white/88 leading-tight tracking-tight"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.03em' }}>
            {profile?.full_name || 'Player'}
          </p>
          {details && (
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                <span className="w-1 h-1 rounded-full bg-[#C8F25A]" />Active
              </span>
              {details.position && (
                <span className="h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45 inline-flex items-center"
                  style={{ fontFamily: "'DM Mono', monospace" }}>{details.position}</span>
              )}
              {details.current_club && details.age_group && (
                <span className="h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45 inline-flex items-center"
                  style={{ fontFamily: "'DM Mono', monospace" }}>{details.current_club} {details.age_group}</span>
              )}
            </div>
          )}
        </div>

        {/* Hero Card */}
        <div className="relative rounded-[24px] p-5 mb-3.5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #101012 0%, #0f0f12 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="absolute -bottom-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,242,90,0.08) 0%, transparent 70%)' }} />

          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <MetadataLabel text="THIS SEASON" />
              {matches.length > 0 ? (
                <>
                  <p className="text-[52px] leading-none mt-2" style={{
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 300, letterSpacing: '-0.04em',
                    color: BANDS.find(b => b.word.toLowerCase() === seasonBand)?.color
                  }}>
                    {BANDS.find(b => b.word.toLowerCase() === seasonBand)?.word}
                  </p>
                  {lastMatch && (
                    <p className="text-[9px] text-white/22 mt-1.5 tracking-[0.04em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      Last match · {lastMatch.competition || 'Match'}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-white/45 text-sm mt-2">No matches logged yet.</p>
              )}
            </div>

            {/* Trend mini-chart */}
            {trendHeights.length > 0 && (
              <div className="text-right">
                <p className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/22 mb-2"
                  style={{ fontFamily: "'DM Mono', monospace" }}>Trend</p>
                <div className="flex items-end gap-[3px] h-8 justify-end">
                  {trendHeights.map((h, i) => (
                    <div key={i} className="w-2.5 rounded-t" style={{
                      height: `${h}%`,
                      background: i >= trendHeights.length - 2
                        ? (i === trendHeights.length - 1 ? '#C8F25A' : 'rgba(200,242,90,0.35)')
                        : 'rgba(255,255,255,0.08)',
                    }} />
                  ))}
                </div>
                {isImproving && (
                  <p className="text-[10px] font-medium text-[#C8F25A] mt-1.5"
                    style={{ fontFamily: "'DM Mono', monospace" }}>↑ improving</p>
                )}
              </div>
            )}
          </div>

          {/* Band summary strip */}
          {matches.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-[10px] relative z-10"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-[7px]">
                <div className="w-[5px] h-[5px] rounded-full bg-white/20" />
                <span className="text-[9px] font-medium tracking-[0.08em] uppercase text-white/22"
                  style={{ fontFamily: "'DM Mono', monospace" }}>Season bands</span>
              </div>
              <div className="flex items-center gap-2.5">
                {bandAbbrev.filter(b => distribution[b.key] > 0).map(b => (
                  <span key={b.key} className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: b.color }}>
                    {distribution[b.key]} {b.abbr}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats grid */}
        {matches.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3.5">
            <div className="rounded-[10px] py-[11px] px-2 text-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <p className="text-[22px] font-normal text-white/88 leading-none" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>{matches.length}</p>
              <span className="text-[8px] font-medium tracking-[0.1em] uppercase text-white/22 mt-[5px] block" style={{ fontFamily: "'DM Mono', monospace" }}>Matches</span>
            </div>
            <div className="rounded-[10px] py-[11px] px-2 text-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <p className="text-[22px] font-normal text-white/88 leading-none" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>{totalGoals}</p>
              <span className="text-[8px] font-medium tracking-[0.1em] uppercase text-white/22 mt-[5px] block" style={{ fontFamily: "'DM Mono', monospace" }}>Goals</span>
            </div>
            <div className="rounded-[10px] py-[11px] px-2 text-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <p className="text-[22px] font-normal text-white/88 leading-none" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>{totalAssists}</p>
              <span className="text-[8px] font-medium tracking-[0.1em] uppercase text-white/22 mt-[5px] block" style={{ fontFamily: "'DM Mono', monospace" }}>Assists</span>
            </div>
          </div>
        )}

        {/* Coach Assessment */}
        {coachAssessment && (
          <div className="mt-5">
            <MetadataLabel text="LATEST COACH ASSESSMENT" />
            <div className="relative rounded-[24px] p-5 mt-2.5 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #101012 0%, #0f0f12 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="absolute -bottom-[40px] -right-[40px] w-[160px] h-[160px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(200,242,90,0.06) 0%, transparent 70%)' }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-medium text-white/88">{coachName || 'Coach'}</p>
                    <p className="text-[9px] text-white/22 mt-0.5 tracking-[0.04em]"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      {new Date(coachAssessment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <BandPill band={scoreToBand(
                    (coachAssessment.work_rate + coachAssessment.tactical + coachAssessment.attitude +
                     coachAssessment.technical + coachAssessment.physical + coachAssessment.coachability) / 6
                  )} />
                </div>
                <div className="space-y-3 mt-4">
                  {[
                    { label: 'Work Rate', score: coachAssessment.work_rate },
                    { label: 'Tactical', score: coachAssessment.tactical },
                    { label: 'Attitude', score: coachAssessment.attitude },
                    { label: 'Technical', score: coachAssessment.technical },
                    { label: 'Physical', score: coachAssessment.physical },
                    { label: 'Coachability', score: coachAssessment.coachability },
                  ].map(cat => (
                    <div key={cat.label} className="flex items-center gap-2">
                      <span className="w-[90px] flex-shrink-0 text-[9px] font-medium tracking-[0.12em] uppercase text-white/45"
                        style={{ fontFamily: "'DM Mono', monospace" }}>{cat.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#202024] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${((cat.score || 5) / 10) * 100}%`,
                            backgroundColor: BANDS.find(b => b.word.toLowerCase() === scoreToBand(cat.score || 5))?.color,
                          }} />
                      </div>
                      <span className="text-[11px] flex-shrink-0 w-[72px] text-right"
                        style={{ color: BANDS.find(b => b.word.toLowerCase() === scoreToBand(cat.score || 5))?.color }}>
                        {BANDS.find(b => b.word.toLowerCase() === scoreToBand(cat.score || 5))?.word}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Private coach notes are coach-only */}
              </div>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="mt-5">
            <MetadataLabel text="RECENT MATCHES" />
            <div className="mt-2.5">
              {recentMatches.map(m => {
                const band = scoreToBand(m.computed_rating || 6.5)
                const formattedDate = new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                const resultLabel = m.team_score > m.opponent_score ? 'W' : m.team_score < m.opponent_score ? 'L' : 'D'
                return (
                  <button key={m.id} onClick={() => navigate(`/player/match/${m.id}`)}
                    className="flex items-center gap-3 py-[13px] w-full border-b border-white/[0.04] last:border-b-0">
                    <div className="w-[34px] h-[34px] rounded-[10px] bg-white/[0.04] flex items-center justify-center flex-shrink-0"><IconMatch size={18} /></div>
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-medium text-white/88">{m.competition || 'Match'}</p>
                      <p className="text-[9px] text-white/22 mt-[3px] tracking-[0.04em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {formattedDate} · {m.competition} · {m.venue || 'Home'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-auto">
                      <BandPill band={band} />
                      <p className="text-[9px] text-white/22 mt-1 tracking-[0.04em] text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {resultLabel} {m.team_score}–{m.opponent_score}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
