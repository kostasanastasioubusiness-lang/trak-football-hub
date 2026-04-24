import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Download } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'
import { toast } from 'sonner'

type BandKey = 'exceptional' | 'standout' | 'good' | 'steady' | 'mixed' | 'developing' | 'difficult'

type SeasonSummary = {
  label: string          // e.g. "2025–26"
  club: string
  ageGroup: string
  matches: number
  goals: number
  assists: number
  avgBand: BandKey
  avgRating: number
  dist: Partial<Record<BandKey, number>>
}

type CareerStats = {
  totalMatches: number
  totalGoals: number
  totalAssists: number
  careerAvgRating: number
  careerBand: BandKey
}

type AssessmentProfile = {
  work_rate: number
  tactical: number
  attitude: number
  technical: number
  physical: number
  coachability: number
  count: number
}

type Award = {
  id: string
  award_type: string
  awarded_for: string | null
  created_at: string
}

const AWARD_LABELS: Record<string, { label: string; emoji: string }> = {
  player_of_week:   { label: 'Player of the Week',   emoji: '🏆' },
  player_of_month:  { label: 'Player of the Month',  emoji: '🥇' },
  most_improved:    { label: 'Most Improved',         emoji: '📈' },
  top_scorer:       { label: 'Top Scorer',            emoji: '⚽' },
  player_of_season: { label: 'Player of the Season', emoji: '🌟' },
}

const ASSESSMENT_LABELS = [
  { key: 'work_rate',    label: 'Work Rate'    },
  { key: 'tactical',     label: 'Tactical'     },
  { key: 'attitude',     label: 'Attitude'     },
  { key: 'technical',    label: 'Technical'    },
  { key: 'physical',     label: 'Physical'     },
  { key: 'coachability', label: 'Coachability' },
] as const

function getBand(key: BandKey) {
  return BANDS.find(b => b.word.toLowerCase() === key) || BANDS[4]
}

function seasonLabel(date: Date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const start = m >= 8 ? y : y - 1
  return `${start}–${String(start + 1).slice(2)}`
}

export default function PlayerPassport() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const passportRef = useRef<HTMLDivElement>(null)

  const [details, setDetails] = useState<any>(null)
  const [seasons, setSeasons] = useState<SeasonSummary[]>([])
  const [career, setCareer] = useState<CareerStats | null>(null)
  const [assessment, setAssessment] = useState<AssessmentProfile | null>(null)
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadData() }, [user])

  const loadData = async () => {
    const [{ data: det }, { data: rawMatches }] = await Promise.all([
      supabase.from('player_details').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('matches')
        .select('created_at, computed_rating, goals, assists, competition')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true }),
    ])
    setDetails(det)

    // Squad IDs for assessment + awards
    const { data: squadRows } = await supabase
      .from('squad_players').select('id').eq('linked_player_id', user!.id)
    const squadIds = (squadRows ?? []).map(r => r.id)

    const [assessmentsRes, awardsRes] = await Promise.all([
      squadIds.length > 0
        ? supabase.from('coach_assessments')
            .select('work_rate, tactical, attitude, technical, physical, coachability')
            .in('squad_player_id', squadIds)
        : Promise.resolve({ data: null }),
      squadIds.length > 0
        ? supabase.from('recognition_awards')
            .select('id, award_type, awarded_for, created_at')
            .in('squad_player_id', squadIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: null }),
    ])

    setAwards(awardsRes.data ?? [])

    // Average assessment profile across all assessments
    const allAssessments = assessmentsRes.data ?? []
    if (allAssessments.length > 0) {
      const sums = { work_rate: 0, tactical: 0, attitude: 0, technical: 0, physical: 0, coachability: 0 }
      for (const a of allAssessments as any[]) {
        sums.work_rate    += a.work_rate ?? 5
        sums.tactical     += a.tactical ?? 5
        sums.attitude     += a.attitude ?? 5
        sums.technical    += a.technical ?? 5
        sums.physical     += a.physical ?? 5
        sums.coachability += a.coachability ?? 5
      }
      const n = allAssessments.length
      setAssessment({
        work_rate:    Math.round((sums.work_rate / n) * 10) / 10,
        tactical:     Math.round((sums.tactical / n) * 10) / 10,
        attitude:     Math.round((sums.attitude / n) * 10) / 10,
        technical:    Math.round((sums.technical / n) * 10) / 10,
        physical:     Math.round((sums.physical / n) * 10) / 10,
        coachability: Math.round((sums.coachability / n) * 10) / 10,
        count: n,
      })
    }

    // Group matches by season
    const seasonMap: Record<string, typeof rawMatches> = {}
    for (const m of rawMatches ?? []) {
      const lbl = seasonLabel(new Date(m.created_at))
      if (!seasonMap[lbl]) seasonMap[lbl] = []
      seasonMap[lbl]!.push(m)
    }

    const seasonRows: SeasonSummary[] = Object.entries(seasonMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([label, ms]) => {
        const dist: Partial<Record<BandKey, number>> = {}
        let ratingSum = 0, goals = 0, assists = 0
        for (const m of ms!) {
          const r = m.computed_rating ?? 6.5
          const band = scoreToBand(r) as BandKey
          dist[band] = (dist[band] || 0) + 1
          ratingSum += r
          goals += m.goals ?? 0
          assists += m.assists ?? 0
        }
        const avgRating = ratingSum / ms!.length
        return {
          label,
          club: det?.current_club || 'Academy',
          ageGroup: det?.age_group || '',
          matches: ms!.length,
          goals,
          assists,
          avgBand: scoreToBand(avgRating) as BandKey,
          avgRating,
          dist,
        }
      })

    setSeasons(seasonRows)

    // Career totals
    const allMatches = rawMatches ?? []
    if (allMatches.length > 0) {
      const totalRating = allMatches.reduce((s, m) => s + (m.computed_rating ?? 6.5), 0)
      const avgRating = totalRating / allMatches.length
      setCareer({
        totalMatches: allMatches.length,
        totalGoals: allMatches.reduce((s, m) => s + (m.goals ?? 0), 0),
        totalAssists: allMatches.reduce((s, m) => s + (m.assists ?? 0), 0),
        careerAvgRating: Math.round(avgRating * 10) / 10,
        careerBand: scoreToBand(avgRating) as BandKey,
      })
    }

    setLoading(false)
  }

  const handleShare = async () => {
    const name = profile?.full_name || 'Player'
    const pos = details?.position || ''
    const club = details?.current_club || ''
    const band = career ? getBand(career.careerBand).word : ''
    const text = [
      `${name} · ${pos} · ${club}`,
      career ? `${career.totalMatches} matches · ${career.totalGoals} goals · Career band: ${band}` : '',
      seasons.length > 0 ? `${seasons.length} season${seasons.length > 1 ? 's' : ''} tracked on TRAK` : '',
      '— TRAK football',
    ].filter(Boolean).join('\n')

    if (navigator.share) {
      try { await navigator.share({ title: `${name} · TRAK Passport`, text }); return }
      catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Passport summary copied to clipboard')
    } catch {
      toast.error('Could not share')
    }
  }

  const handleDownload = () => {
    toast.success('Screenshot to save', { description: 'Long-press on mobile or use your browser\'s screenshot tool' })
  }

  const careerBandCfg = career ? getBand(career.careerBand) : null

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-[430px] px-5 pt-5 pb-16">

        {/* Topbar */}
        <div className="relative flex items-center justify-center mb-6 h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>Player Passport</span>
          <div className="absolute right-0 flex gap-2">
            <button onClick={handleShare} className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}>
              <Share2 size={15} />
            </button>
            <button onClick={handleDownload} className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}>
              <Download size={15} />
            </button>
          </div>
        </div>

        {/* ── PASSPORT DOCUMENT ── */}
        <div ref={passportRef} className="rounded-[22px] overflow-hidden"
          style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* TRAK Header band */}
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ background: 'rgba(200,242,90,0.06)', borderBottom: '1px solid rgba(200,242,90,0.12)' }}>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>TRAK</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 12, color: '#C8F25A' }}>football</span>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>PLAYER PASSPORT</span>
          </div>

          <div className="px-6 py-6 space-y-7">

            {/* Identity */}
            <div>
              <h1 style={{ fontWeight: 300, fontSize: 30, letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.1 }}>
                {profile?.full_name || '—'}
              </h1>
              <div className="mt-3 flex gap-2 flex-wrap">
                {details?.position    && <Pill>{details.position}</Pill>}
                {details?.current_club && <Pill>{details.current_club}</Pill>}
                {details?.age_group   && <Pill>{details.age_group}</Pill>}
                {details?.shirt_number && <Pill>#{details.shirt_number}</Pill>}
              </div>
            </div>

            {/* Career at a Glance */}
            {career && (
              <div>
                <Label>Career at a Glance</Label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <StatBox label="Matches" value={career.totalMatches} />
                  <StatBox label="Goals" value={career.totalGoals} />
                  <StatBox label="Assists" value={career.totalAssists} />
                </div>
                {/* Career band */}
                <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-[14px]"
                  style={{ background: `${careerBandCfg!.bg}`, border: `1px solid ${careerBandCfg!.border}` }}>
                  <div className="flex-1">
                    <Label>Career Band</Label>
                    <div className="mt-1" style={{ fontSize: 22, fontWeight: 300, color: careerBandCfg!.color, letterSpacing: '-0.01em' }}>
                      {careerBandCfg!.word}
                    </div>
                  </div>
                  <div className="text-right">
                    <Label>Avg Rating</Label>
                    <div className="mt-1" style={{ fontSize: 22, fontWeight: 300, color: careerBandCfg!.color }}>
                      {career.careerAvgRating.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coach Assessment Profile */}
            {assessment && assessment.count > 0 && (
              <div>
                <div className="flex items-baseline justify-between">
                  <Label>Coach Assessment Profile</Label>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                    {assessment.count} assessment{assessment.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {ASSESSMENT_LABELS.map(({ key, label }) => {
                    const val = assessment[key]
                    const pct = (val / 10) * 100
                    const band = scoreToBand(val) as BandKey
                    const cfg = getBand(band)
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', width: 96, flexShrink: 0 }}>{label}</span>
                        <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                        </div>
                        <span style={{ fontSize: 12, color: cfg.color, width: 56, textAlign: 'right', flexShrink: 0 }}>
                          {cfg.word}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Seasons / Career Timeline */}
            {seasons.length > 0 && (
              <div>
                <Label>Season History</Label>
                <div className="mt-3 space-y-2.5">
                  {seasons.map(s => {
                    const bandCfg = getBand(s.avgBand)
                    const topBands = (Object.entries(s.dist) as [BandKey, number][])
                      .filter(([, c]) => c > 0)
                      .sort((a, b) => {
                        const order = ['exceptional','standout','good','steady','mixed','developing','difficult']
                        return order.indexOf(a[0]) - order.indexOf(b[0])
                      })
                    return (
                      <div key={s.label} className="p-4 rounded-[16px]"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.88)', fontWeight: 400 }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                              {s.club}{s.ageGroup ? ` · ${s.ageGroup}` : ''}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[11px]"
                            style={{ color: bandCfg.color, background: bandCfg.bg, border: `1px solid ${bandCfg.border}` }}>
                            {bandCfg.word}
                          </span>
                        </div>
                        {/* Season stats row */}
                        <div className="mt-3 flex gap-4">
                          <SeasonStat label="Matches" value={s.matches} />
                          <SeasonStat label="Goals" value={s.goals} />
                          <SeasonStat label="Assists" value={s.assists} />
                        </div>
                        {/* Band distribution */}
                        {topBands.length > 0 && (
                          <div className="mt-3 flex gap-1.5 flex-wrap">
                            {topBands.map(([band, count]) => {
                              const d = getBand(band)
                              return (
                                <span key={band} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                                  style={{ color: d.color, background: `${d.color}1A`, border: `1px solid ${d.color}35`, fontSize: 10 }}>
                                  <span style={{ fontWeight: 500 }}>{d.word[0]}</span>
                                  <span style={{ opacity: 0.8 }}>{count}</span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Awards */}
            {awards.length > 0 && (
              <div>
                <Label>Recognition</Label>
                <div className="mt-3 space-y-2">
                  {awards.map(a => {
                    const info = AWARD_LABELS[a.award_type] || { label: a.award_type, emoji: '🏅' }
                    return (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-[14px]"
                        style={{ background: 'rgba(200,242,90,0.04)', border: '1px solid rgba(200,242,90,0.12)' }}>
                        <span style={{ fontSize: 18 }}>{info.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{info.label}</div>
                          {a.awarded_for && (
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{a.awarded_for}</div>
                          )}
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                          {new Date(a.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && seasons.length === 0 && awards.length === 0 && (
              <div className="py-8 text-center">
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
                  Your passport is empty for now.<br />
                  As your coach logs matches and assessments,<br />
                  your career will build up here.
                </p>
              </div>
            )}

          </div>

          {/* TRAK Footer */}
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>
              TRAK · Verified Career Record
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>
              trak.football
            </span>
          </div>
        </div>

        {/* Share / Download buttons below document */}
        <div className="mt-4 flex gap-3">
          <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px]"
            style={{ background: '#C8F25A', color: '#000', fontSize: 14, fontWeight: 500 }}>
            <Share2 size={14} /> Share
          </button>
          <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px]"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            <Download size={14} /> Save
          </button>
        </div>

      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)' }}>
      {children}
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full"
      style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </span>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center py-3 rounded-[12px]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ fontSize: 24, fontWeight: 300, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{label}</div>
    </div>
  )
}

function SeasonStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{label}</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', marginTop: 1 }}>{value}</div>
    </div>
  )
}
