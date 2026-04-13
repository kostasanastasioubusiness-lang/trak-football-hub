import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, BandPill, MetadataLabel, CategoryBar } from '@/components/trak'
import { CardSkeleton, Skeleton } from '@/components/trak'
import { BANDS, type BandType } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

export default function ParentHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [childName, setChildName] = useState('')
  const [childDetails, setChildDetails] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [assessment, setAssessment] = useState<any>(null)
  const [coachName, setCoachName] = useState('')
  const [loading, setLoading] = useState(true)
  const [wellnessToday, setWellnessToday] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) { setLoading(false); return }
      const childId = links[0].player_user_id

      // Fetch child profile
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', childId).single()
      if (profile) setChildName(profile.full_name)

      // Fetch child player details
      const { data: details } = await supabase.from('player_details').select('position, current_club, age_group').eq('user_id', childId).maybeSingle()
      if (details) setChildDetails(details)

      // Fetch matches
      const { data: matchData } = await supabase.from('matches')
        .select('id, team_score, opponent_score, competition, venue, minutes_played, computed_rating, created_at, position, goals, assists, opponent, body_condition')
        .eq('user_id', childId).order('created_at', { ascending: false })
      if (matchData) {
        setMatches(matchData)
        if (matchData[0]?.body_condition) {
          setWellnessToday(matchData[0].body_condition)
        }
      }

      // Fetch goals
      const { data: goalData } = await supabase.from('player_goals').select('*').eq('user_id', childId).eq('completed', false)
      if (goalData) setGoals(goalData)

      // Fetch latest coach assessment
      const { data: assessments } = await supabase.from('coach_assessments')
        .select('*')
        .eq('player_user_id', childId)
        .order('assessed_at', { ascending: false })
        .limit(1)
      if (assessments?.length) {
        setAssessment(assessments[0])
        const { data: coachProfile } = await supabase.from('profiles').select('full_name').eq('user_id', assessments[0].coach_user_id).single()
        if (coachProfile) setCoachName(coachProfile.full_name)
      }

      setLoading(false)
    })
  }, [user])

  /* ---------- derived data ---------- */

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
  const lastMatch = matches[0]

  // Trend: last 5 match ratings
  const trendMatches = matches.slice(0, 5).reverse()
  const trendHeights = trendMatches.map(m => {
    const r = m.computed_rating || 6.5
    return Math.max(20, Math.min(100, ((r - 4) / 6) * 100))
  })
  const isImproving = trendMatches.length >= 2 &&
    (trendMatches[trendMatches.length - 1]?.computed_rating || 0) > (trendMatches[0]?.computed_rating || 0)

  const bandAbbrev = [
    { key: 'exceptional', abbr: 'E', color: '#C8F25A' },
    { key: 'standout', abbr: 'St', color: '#86efac' },
    { key: 'good', abbr: 'G', color: '#4ade80' },
    { key: 'steady', abbr: 'Sy', color: '#60a5fa' },
    { key: 'mixed', abbr: 'M', color: '#fb923c' },
    { key: 'developing', abbr: 'D', color: '#a78bfa' },
  ]

  const wellnessLabel = wellnessToday === 'fresh' ? 'Feeling great'
    : wellnessToday === 'good' ? 'Feeling good'
    : wellnessToday === 'tired' ? 'Feeling tired'
    : wellnessToday === 'knock' ? 'Carrying a knock'
    : 'Not logged'

  const wellnessEmoji = wellnessToday === 'fresh' || wellnessToday === 'good' ? '\uD83D\uDC9A'
    : wellnessToday === 'tired' ? '\uD83D\uDFE1'
    : wellnessToday === 'knock' ? '\uD83D\uDFE0'
    : '\u2B1C'

  const assessmentCategories = assessment ? [
    { label: 'Work Rate', score: assessment.work_rate },
    { label: 'Tactical', score: assessment.tactical },
    { label: 'Attitude', score: assessment.attitude },
    { label: 'Technical', score: assessment.technical },
    { label: 'Physical', score: assessment.physical },
    { label: 'Coachability', score: assessment.coachability },
  ] : []

  /* ---------- loading skeleton ---------- */

  if (loading) return (
    <MobileShell>
      <div className="pt-12 pb-4 space-y-6">
        <CardSkeleton />
        <Skeleton className="h-3 w-28" />
        <CardSkeleton />
      </div>
      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )

  /* ---------- render ---------- */

  return (
    <MobileShell>
      <div className="pt-3 pb-4">

        {/* ── TRAK header row + Switch pill ── */}
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[11px] font-medium tracking-[0.14em] uppercase text-white/20"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            TRAK
          </span>
          <button
            onClick={() => {/* TODO: switch child */}}
            className="h-6 px-3 rounded-full bg-white/[0.06] border border-white/[0.07] text-[9px] font-medium tracking-[0.06em] uppercase text-white/45"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Switch
          </button>
        </div>

        {/* ── Identity block: Following label + child name + pills ── */}
        <div className="py-2.5 pb-4">
          <p
            className="text-[12px] mb-1"
            style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.22)' }}
          >
            Following &#9660;
          </p>
          <p
            className="text-[28px] text-white/88 leading-tight"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, letterSpacing: '-0.03em' }}
          >
            {childName || 'No child linked'}
          </p>
          {childDetails && (
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              {childDetails.position && (
                <span
                  className="h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45 inline-flex items-center"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {childDetails.position}
                </span>
              )}
              {childDetails.current_club && (
                <span
                  className="h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45 inline-flex items-center"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {childDetails.current_club}{childDetails.age_group ? ` ${childDetails.age_group}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Hero card: This season ── */}
        <div
          className="relative rounded-[24px] p-5 mb-3.5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #101012 0%, #0f0f12 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Glow accent */}
          <div
            className="absolute -bottom-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,242,90,0.08) 0%, transparent 70%)' }}
          />

          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <MetadataLabel text="THIS SEASON" />
              {matches.length > 0 ? (
                <>
                  <p
                    className="text-[52px] leading-none mt-2"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 300,
                      letterSpacing: '-0.04em',
                      color: BANDS.find(b => b.word.toLowerCase() === seasonBand)?.color,
                    }}
                  >
                    {BANDS.find(b => b.word.toLowerCase() === seasonBand)?.word}
                  </p>
                  {lastMatch && (
                    <p
                      className="text-[9px] text-white/22 mt-1.5 tracking-[0.04em]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      Last match &middot; vs {lastMatch.opponent || lastMatch.competition || 'Unknown'}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-white/45 text-sm mt-2">No matches logged yet.</p>
              )}
            </div>

            {/* Trend mini-chart (5 bars) */}
            {trendHeights.length > 0 && (
              <div className="text-right">
                <p
                  className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/22 mb-2"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Trend
                </p>
                <div className="flex items-end gap-[3px] h-8 justify-end">
                  {trendHeights.map((h, i) => (
                    <div
                      key={i}
                      className="w-2.5 rounded-t"
                      style={{
                        height: `${h}%`,
                        background: i >= trendHeights.length - 2
                          ? (i === trendHeights.length - 1 ? '#C8F25A' : 'rgba(200,242,90,0.35)')
                          : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>
                {isImproving && (
                  <p
                    className="text-[10px] font-medium text-[#C8F25A] mt-1.5"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    &uarr; improving
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Season bands summary strip */}
          {matches.length > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-[10px] relative z-10"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-center gap-[7px]">
                <div className="w-[5px] h-[5px] rounded-full bg-white/20" />
                <span
                  className="text-[9px] font-medium tracking-[0.08em] uppercase text-white/22"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Season bands
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {bandAbbrev.filter(b => distribution[b.key] > 0).map(b => (
                  <span
                    key={b.key}
                    className="text-xs"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: b.color }}
                  >
                    {distribution[b.key]} {b.abbr}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Wellness strip ── */}
        <div
          className="rounded-[14px] p-4 mb-3.5 flex items-center gap-3"
          style={{ background: 'rgba(0,0,0,0.35)', borderLeft: '3px solid #fb923c' }}
        >
          <span className="text-xl">{wellnessEmoji}</span>
          <div>
            <p
              className="text-[13px] font-medium text-white/88"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Wellness today
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.45)' }}
            >
              {wellnessLabel}
            </p>
          </div>
        </div>

        {/* ── Latest Coach Assessment ── */}
        {assessment && (
          <div className="mt-5">
            <MetadataLabel text="LATEST COACH ASSESSMENT" />
            <div
              className="relative rounded-[24px] p-5 mt-2.5 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #101012 0%, #0f0f12 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="absolute -bottom-[40px] -right-[40px] w-[160px] h-[160px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(200,242,90,0.06) 0%, transparent 70%)' }}
              />

              <div className="relative z-10">
                {/* Coach name + date + overall band */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p
                      className="text-[13px] font-medium text-white/88"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {coachName || 'Coach'}
                    </p>
                    <p
                      className="text-[9px] text-white/22 mt-0.5 tracking-[0.04em]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {assessment.assessed_at
                        ? new Date(assessment.assessed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : ''}
                    </p>
                  </div>
                  <BandPill band={assessment.overall_band || scoreToBand(
                    ((assessment.work_rate || 0) + (assessment.tactical || 0) + (assessment.attitude || 0) +
                     (assessment.technical || 0) + (assessment.physical || 0) + (assessment.coachability || 0)) / 6
                  )} />
                </div>

                {/* 6 category bar rows */}
                <div className="space-y-3 mt-4">
                  {assessmentCategories.map(cat => (
                    <div key={cat.label} className="flex items-center gap-2">
                      <span
                        className="w-[90px] flex-shrink-0 text-[9px] font-medium tracking-[0.12em] uppercase text-white/45"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {cat.label}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#202024] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${((cat.score || 6.5) / 10) * 100}%`,
                            backgroundColor: BANDS.find(b => b.word.toLowerCase() === scoreToBand(cat.score || 6.5))?.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] flex-shrink-0 w-[72px] text-right"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          color: BANDS.find(b => b.word.toLowerCase() === scoreToBand(cat.score || 6.5))?.color,
                        }}
                      >
                        {BANDS.find(b => b.word.toLowerCase() === scoreToBand(cat.score || 6.5))?.word}
                      </span>
                    </div>
                  ))}
                </div>

                {assessment.note && (
                  <p
                    className="text-[11px] text-white/45 mt-4 italic leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    "{assessment.note}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Active Goals ── */}
        {goals.length > 0 && (
          <div className="mt-5">
            <MetadataLabel text="ACTIVE GOALS" />
            <div className="mt-2.5 space-y-2">
              {goals.map(g => {
                const progress = g.target_value ? Math.min((g.current_value || 0) / g.target_value * 100, 100) : 0
                const catColor = g.category === 'performance' ? '#fb923c'
                  : g.category === 'consistency' ? '#60a5fa'
                  : g.category === 'development' ? 'rgba(255,255,255,0.45)'
                  : '#a78bfa'
                return (
                  <div
                    key={g.id}
                    className="rounded-[14px] p-4"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <p
                      className="text-[13px] font-medium text-white/88 mb-1.5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {g.goal_type || g.title || 'Goal'}
                    </p>
                    {g.target_value && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[9px] text-white/22"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {Math.round(progress)}%
                          </span>
                          <span
                            className="text-[9px] text-white/22"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {g.current_value || 0}/{g.target_value}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#202024] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: catColor }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!childName && matches.length === 0 && (
          <div className="rounded-[14px] p-5 text-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <p className="text-sm text-white/45" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              No child linked yet. Ask your child to send you a parent invite code.
            </p>
          </div>
        )}
      </div>

      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
