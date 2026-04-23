import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'
import { IconMatch } from '@/components/icons/TrakIcons'
import { ChevronRight } from 'lucide-react'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'
import { trackEvent } from '@/lib/telemetry'
import { calculateRecords, type PersonalRecords } from '@/lib/records'
import RatingTrendChart from '@/components/player/RatingTrendChart'

type TrendFilter = 'last5' | 'last10' | 'all'

export default function PlayerProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [details, setDetails] = useState<any>(null)
  const [stats, setStats] = useState({ matches: 0, goals: 0, assists: 0 })
  const [assessment, setAssessment] = useState<any>(null)
  const [matchHistory, setMatchHistory] = useState<{ created_at: string; computed_rating: number }[]>([])
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all')
  const [records, setRecords] = useState<PersonalRecords | null>(null)
  const [matchOpponents, setMatchOpponents] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    supabase.from('player_details').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => setDetails(data))
    supabase.from('matches').select('id, goals, assists, computed_rating, created_at, opponent').eq('user_id', user.id).order('created_at', { ascending: true }).then(({ data }) => {
      if (!data) return
      setStats({
        matches: data.length,
        goals: data.reduce((s, m) => s + (m.goals || 0), 0),
        assists: data.reduce((s, m) => s + (m.assists || 0), 0),
      })
      setMatchHistory(data.map((m) => ({ created_at: m.created_at, computed_rating: m.computed_rating })))

      // Build opponent lookup and calculate personal records
      const opMap: Record<string, string> = {}
      for (const m of data) {
        if (m.opponent) opMap[m.id] = m.opponent
      }
      setMatchOpponents(opMap)
      setRecords(calculateRecords(data))
      trackEvent('records_viewed', {})
    })
    // Get latest coach assessment
    supabase.from('coach_assessments').select('*')
      .eq('squad_player_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setAssessment(data) })
  }, [user])

  // Track chart view once we have enough data
  useEffect(() => {
    if (matchHistory.length >= 3) {
      trackEvent('chart_viewed', { type: 'trend' })
    }
  }, [matchHistory])

  const filteredMatches = (() => {
    if (trendFilter === 'last5') return matchHistory.slice(-5)
    if (trendFilter === 'last10') return matchHistory.slice(-10)
    return matchHistory
  })()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const assessmentCategories = assessment ? [
    { name: 'Work Rate', score: assessment.work_rate },
    { name: 'Tactical', score: assessment.tactical },
    { name: 'Attitude', score: assessment.attitude },
    { name: 'Technical', score: assessment.technical },
    { name: 'Physical', score: assessment.physical },
    { name: 'Coachability', score: assessment.coachability },
  ] : []

  const scoreToBandLabel = (score: number) => {
    if (score >= 9) return { word: 'Standout', color: '#86efac' }
    if (score >= 7) return { word: 'Good', color: '#4ade80' }
    if (score >= 5) return { word: 'Steady', color: '#60a5fa' }
    if (score >= 3) return { word: 'Mixed', color: '#fb923c' }
    return { word: 'Developing', color: '#a78bfa' }
  }

  const FILTER_OPTIONS: { key: TrendFilter; label: string }[] = [
    { key: 'last5', label: 'Last 5' },
    { key: 'last10', label: 'Last 10' },
    { key: 'all', label: 'All' },
  ]

  const getBandLabel = (score: number): { word: string; color: string } => {
    const band = scoreToBand(score)
    const cfg = BANDS.find(b => b.word.toLowerCase() === band)
    return cfg ? { word: cfg.word, color: cfg.color } : { word: 'Unknown', color: '#fff' }
  }

  const formatRecordDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const isWithinLastWeek = (dateStr: string): boolean => {
    const diff = Date.now() - new Date(dateStr).getTime()
    return diff <= 7 * 24 * 60 * 60 * 1000
  }

  const NewBadge = () => (
    <span
      className="ml-1.5 inline-flex items-center h-[14px] px-1.5 rounded-[4px] text-[7px] font-bold tracking-[0.08em] uppercase"
      style={{ fontFamily: "'DM Mono', monospace", background: 'rgba(200,242,90,0.18)', color: '#C8F25A', border: '1px solid rgba(200,242,90,0.25)' }}
    >
      NEW
    </span>
  )

  return (
    <MobileShell>
      <div className="flex items-center justify-between pt-3 pb-2 border-b border-white/[0.07]">
        <span className="text-[16px] font-medium text-white/88" style={{ fontFamily: "'DM Sans', sans-serif" }}>Profile</span>
      </div>

      <div className="pt-3.5 pb-4 space-y-2.5">
        {/* Avatar + Identity */}
        <div className="text-center mb-6">
          <div className="w-[72px] h-[72px] rounded-[22px] bg-[#202024] border border-[rgba(200,242,90,0.18)] mx-auto mb-3 flex items-center justify-center"><IconMatch size={32} color="#C8F25A" /></div>
          <p className="text-[20px] font-semibold text-white/88 tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
            {profile?.full_name}
          </p>
          <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
            {details?.position && (
              <span className="h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45 inline-flex items-center"
                style={{ fontFamily: "'DM Mono', monospace" }}>{details.position}</span>
            )}
            {details?.current_club && (
              <span className="h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45 inline-flex items-center"
                style={{ fontFamily: "'DM Mono', monospace" }}>{details.current_club} {details.age_group}</span>
            )}
            {details?.shirt_number && (
              <span className="h-5 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.07] text-[8px] font-medium tracking-[0.06em] uppercase text-white/45 inline-flex items-center"
                style={{ fontFamily: "'DM Mono', monospace" }}>#{details.shirt_number}</span>
            )}
          </div>
        </div>

        {/* How TRAK works link */}
        <button
          onClick={() => navigate('/how-it-works')}
          className="w-full flex items-center justify-between rounded-[18px] p-4 border border-white/[0.07] bg-[#101012] text-left hover:bg-[#141416] transition-colors"
        >
          <div>
            <MetadataLabel text="HOW TRAK WORKS" />
            <p className="text-[12px] text-white/55 mt-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Performance bands & rating engine
            </p>
          </div>
          <ChevronRight size={18} className="text-white/40" />
        </button>

        {/* Season Summary */}
        <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
          <MetadataLabel text="SEASON SUMMARY" />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-[10px] py-[11px] px-2 text-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <p className="text-[22px] font-normal text-white/88 leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>{stats.matches}</p>
              <span className="text-[8px] font-medium tracking-[0.1em] uppercase text-white/22 mt-[5px] block" style={{ fontFamily: "'DM Mono', monospace" }}>Matches</span>
            </div>
            <div className="rounded-[10px] py-[11px] px-2 text-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <p className="text-[22px] font-normal text-white/88 leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>{stats.goals}</p>
              <span className="text-[8px] font-medium tracking-[0.1em] uppercase text-white/22 mt-[5px] block" style={{ fontFamily: "'DM Mono', monospace" }}>Goals</span>
            </div>
            <div className="rounded-[10px] py-[11px] px-2 text-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <p className="text-[22px] font-normal text-white/88 leading-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>{stats.assists}</p>
              <span className="text-[8px] font-medium tracking-[0.1em] uppercase text-white/22 mt-[5px] block" style={{ fontFamily: "'DM Mono', monospace" }}>Assists</span>
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
          <MetadataLabel text="PERFORMANCE TREND" />
          {matchHistory.length < 3 ? (
            <p className="text-[12px] text-white/30 mt-4 text-center pb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Log at least 3 matches to see your trend
            </p>
          ) : (
            <>
              <div className="mt-3">
                <RatingTrendChart matches={filteredMatches} />
              </div>
              <div className="flex gap-1.5 mt-3">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTrendFilter(opt.key)}
                    className="h-[26px] px-3 rounded-full text-[9px] font-medium tracking-[0.06em] uppercase transition-colors"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      background: trendFilter === opt.key ? 'rgba(200,242,90,0.13)' : 'rgba(255,255,255,0.04)',
                      color: trendFilter === opt.key ? '#C8F25A' : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${trendFilter === opt.key ? 'rgba(200,242,90,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Personal Records */}
        {records && records.totalMatches > 0 && (
          <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
            <MetadataLabel text="PERSONAL RECORDS" />
            <div className="mt-3 space-y-[10px]">
              {/* Highest Rating */}
              {records.highestRating && (() => {
                const bl = getBandLabel(records.highestRating.value)
                return (
                  <div className="flex items-start gap-2.5">
                    <span className="text-[14px] leading-none mt-[1px]" aria-hidden>&#127942;</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-1">
                        <span className="text-[12px] text-white/88 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Highest Rating:
                        </span>
                        <span className="text-[12px] font-semibold" style={{ color: bl.color }}>
                          {records.highestRating.value.toFixed(1)} — {bl.word}
                        </span>
                        {isWithinLastWeek(records.highestRating.date) && <NewBadge />}
                      </div>
                      <span className="text-[9px] text-white/22 block mt-[2px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {formatRecordDate(records.highestRating.date)}
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* Most Goals in a Match */}
              {records.mostGoalsInMatch && (
                <div className="flex items-start gap-2.5">
                  <span className="text-[14px] leading-none mt-[1px]" aria-hidden>&#9917;</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-1">
                      <span className="text-[12px] text-white/88 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Most Goals in a Match:
                      </span>
                      <span className="text-[12px] font-semibold text-white/88">
                        {records.mostGoalsInMatch.value}
                        {matchOpponents[records.mostGoalsInMatch.matchId] && (
                          <span className="text-white/45 font-normal"> vs {matchOpponents[records.mostGoalsInMatch.matchId]}</span>
                        )}
                      </span>
                      {isWithinLastWeek(records.mostGoalsInMatch.date) && <NewBadge />}
                    </div>
                    <span className="text-[9px] text-white/22 block mt-[2px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {formatRecordDate(records.mostGoalsInMatch.date)}
                    </span>
                  </div>
                </div>
              )}

              {/* Longest Good+ Streak */}
              {records.longestGoodStreak > 0 && (
                <div className="flex items-start gap-2.5">
                  <span className="text-[14px] leading-none mt-[1px]" aria-hidden>&#128293;</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-1">
                      <span className="text-[12px] text-white/88 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Longest Good+ Streak:
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: '#4ade80' }}>
                        {records.longestGoodStreak} {records.longestGoodStreak === 1 ? 'match' : 'matches'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* First Match */}
              {records.firstMatchDate && (
                <div className="flex items-start gap-2.5">
                  <span className="text-[14px] leading-none mt-[1px]" aria-hidden>&#128197;</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-1">
                      <span className="text-[12px] text-white/88 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        First Match:
                      </span>
                      <span className="text-[12px] text-white/45">
                        {formatRecordDate(records.firstMatchDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coach Assessments */}
        {assessmentCategories.length > 0 && (
          <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
            <MetadataLabel text="COACH ASSESSMENTS" />
            <div className="mt-3 space-y-2">
              {assessmentCategories.map(cat => {
                const bandInfo = scoreToBandLabel(cat.score)
                const pct = (cat.score / 10) * 100
                return (
                  <div key={cat.name} className="flex items-center gap-2.5">
                    <span className="text-[11px] text-white/88 w-[110px] flex-shrink-0">{cat.name}</span>
                    <div className="flex-1 h-[5px] rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bandInfo.color }} />
                    </div>
                    <span className="text-[11px] font-semibold w-[68px] text-right flex-shrink-0" style={{ color: bandInfo.color }}>
                      {bandInfo.word}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button onClick={async () => { await signOut(); navigate('/') }}
          className="text-sm text-white/22 hover:text-white/45 transition-colors pt-4 block mx-auto">
          Sign Out
        </button>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
