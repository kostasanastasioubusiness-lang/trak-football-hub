import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, ShieldCheck, Trophy } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'

type BandKey = 'exceptional' | 'standout' | 'good' | 'steady' | 'mixed' | 'developing' | 'difficult'

type MatchRow = {
  id: string
  created_at: string
  computed_rating: number | null
  opponent: string | null
  team_score: number
  opponent_score: number
  competition: string | null
  band: BandKey
}

type SeasonRow = {
  label: string
  club: string
  ageGroup: string
  matches: number
  dist: Record<BandKey, number>
  avgRating: number
}

type Award = {
  id: string
  award_type: string
  awarded_for: string | null
  created_at: string
}

const BAND_DISPLAY: Record<BandKey, { letter: string; color: string }> = {
  exceptional: { letter: 'E',  color: '#C8F25A' },
  standout:    { letter: 'St', color: '#86efac' },
  good:        { letter: 'G',  color: '#4ade80' },
  steady:      { letter: 'S',  color: '#60a5fa' },
  mixed:       { letter: 'Mx', color: '#fb923c' },
  developing:  { letter: 'D',  color: '#a78bfa' },
  difficult:   { letter: '—',  color: 'rgba(255,255,255,0.4)' },
}

const AWARD_LABELS: Record<string, string> = {
  player_of_week:   '🏆 Player of the Week',
  player_of_month:  '🥇 Player of the Month',
  most_improved:    '📈 Most Improved',
  top_scorer:       '⚽ Top Scorer',
  player_of_season: '🌟 Player of the Season',
}

/** Returns the academic season label for a given date (Aug–Jul) */
function seasonLabel(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}–${String(startYear + 1).slice(2)}`
}

function getBandConfig(key: BandKey) {
  return BANDS.find(b => b.word.toLowerCase() === key) || BANDS[4]
}

export default function PlayerPassport() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [details, setDetails] = useState<{ position: string; current_club: string; age_group: string } | null>(null)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [seasons, setSeasons] = useState<SeasonRow[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    // 1. Player details
    const { data: det } = await supabase
      .from('player_details')
      .select('position, current_club, age_group')
      .eq('user_id', user!.id)
      .maybeSingle()
    setDetails(det)

    // 2. All matches
    const { data: rawMatches } = await supabase
      .from('matches')
      .select('id, created_at, computed_rating, opponent, team_score, opponent_score, competition')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    // 3. Squad player IDs (for awards)
    const { data: squadRows } = await supabase
      .from('squad_players')
      .select('id')
      .eq('linked_player_id', user!.id)
    const squadIds = (squadRows ?? []).map(r => r.id)

    // 4. Recognition awards
    if (squadIds.length > 0) {
      const { data: awardData } = await supabase
        .from('recognition_awards')
        .select('id, award_type, awarded_for, created_at')
        .in('squad_player_id', squadIds)
        .order('created_at', { ascending: false })
      setAwards(awardData ?? [])
    }

    // Process matches — all entries are coach-logged by definition
    const processed: MatchRow[] = (rawMatches ?? []).map(m => {
      const rating = m.computed_rating ?? 6.5
      const band = scoreToBand(rating) as BandKey
      return { ...m, band }
    })
    setMatches(processed)

    // Group into seasons
    const seasonMap: Record<string, MatchRow[]> = {}
    for (const m of processed) {
      const label = seasonLabel(new Date(m.created_at))
      if (!seasonMap[label]) seasonMap[label] = []
      seasonMap[label].push(m)
    }

    const seasonRows: SeasonRow[] = Object.entries(seasonMap)
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
      .map(([label, ms]) => {
        const dist: Record<BandKey, number> = {
          exceptional: 0, standout: 0, good: 0, steady: 0,
          mixed: 0, developing: 0, difficult: 0,
        }
        let ratingSum = 0
        for (const m of ms) {
          dist[m.band] = (dist[m.band] || 0) + 1
          ratingSum += m.computed_rating ?? 6.5
        }
        return {
          label,
          club: det?.current_club || 'Academy',
          ageGroup: det?.age_group || '',
          matches: ms.length,
          dist,
          avgRating: ms.length > 0 ? ratingSum / ms.length : 6.5,
        }
      })

    setSeasons(seasonRows)
    setLoading(false)
  }

  const currentSeason = seasons[0]
  const currentBand = currentSeason
    ? scoreToBand(currentSeason.avgRating) as BandKey
    : 'steady'
  const currentBandCfg = getBandConfig(currentBand)
  const last5 = matches.slice(0, 5).reverse()

  const handleShare = async () => {
    const text = `${profile?.full_name} · ${details?.position || ''} · ${details?.current_club || ''} — TRAK Football Passport`
    if (navigator.share) {
      try { await navigator.share({ title: 'TRAK Passport', text }); return } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-[430px] px-5 pt-5 pb-16">

        {/* Header */}
        <div className="relative flex items-center justify-center mb-5 h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>My Passport</h1>
          <button onClick={handleShare} className="absolute right-0 flex items-center gap-1.5 px-3 h-8 rounded-full"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.88)', fontSize: 12 }}>
            <Share2 size={12} /> Share
          </button>
        </div>

        {/* Identity */}
        <h2 style={{ fontWeight: 300, fontSize: 28, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em' }}>
          {profile?.full_name || '—'}
        </h2>
        <div className="mt-3 flex gap-2 flex-wrap">
          {details?.position && <Pill>{details.position}</Pill>}
          {details?.current_club && <Pill>{details.current_club}</Pill>}
          {details?.age_group && <Pill>{details.age_group}</Pill>}
        </div>

        {/* Hero — This season */}
        {loading ? (
          <div className="mt-6 p-5 rounded-[18px]" style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)', minHeight: 120 }} />
        ) : currentSeason ? (
          <div className="mt-6 p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #101012 0%, #0E1208 100%)', border: `1px solid ${currentBandCfg.border}`, borderRadius: 18, boxShadow: `0 0 60px -20px ${currentBandCfg.color}40 inset` }}>
            <SectionLabel>This Season · {currentSeason.label}</SectionLabel>
            <div className="mt-3 flex items-end justify-between">
              <div style={{ fontWeight: 300, fontSize: 52, lineHeight: 1, color: currentBandCfg.color, letterSpacing: '-0.02em' }}>
                {currentBandCfg.word}
              </div>
              {/* Last 5 mini bars */}
              <div className="flex items-end gap-1.5 h-14">
                {last5.map((m, i) => {
                  const cfg = getBandConfig(m.band)
                  const heights = [30, 45, 55, 70, 85]
                  return (
                    <div key={i} style={{ width: 8, height: `${heights[i]}%`, background: cfg.color, borderRadius: 2, opacity: 0.85 }} />
                  )
                })}
              </div>
            </div>
            <div className="mt-5 px-4 py-3" style={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
              <SectionLabel>Season Distribution · {currentSeason.matches} matches</SectionLabel>
              <div className="mt-2.5 flex gap-2 flex-wrap">
                {(Object.entries(currentSeason.dist) as [BandKey, number][])
                  .filter(([, count]) => count > 0)
                  .map(([band, count]) => {
                    const d = BAND_DISPLAY[band]
                    return <DistTag key={band} color={d.color} letter={d.letter} count={count} />
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-5 rounded-[18px] text-center" style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No matches logged yet.<br />Your passport builds as you play.</p>
          </div>
        )}

        {/* Coach Awards */}
        {awards.length > 0 && (
          <div className="mt-6">
            <SectionLabel>Coach Recognition</SectionLabel>
            <div className="mt-3 space-y-2">
              {awards.slice(0, 5).map(a => (
                <div key={a.id} className="p-3 flex items-center gap-3"
                  style={{ background: 'rgba(200,242,90,0.04)', border: '1px solid rgba(200,242,90,0.15)', borderRadius: 14 }}>
                  <Trophy size={16} className="text-[#C8F25A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>
                      {AWARD_LABELS[a.award_type] || a.award_type}
                    </div>
                    {a.awarded_for && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{a.awarded_for}</div>
                    )}
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Season History */}
        {seasons.length > 0 && (
          <div className="mt-6">
            <SectionLabel>Season History</SectionLabel>
            <div className="mt-3 space-y-3">
              {seasons.map(s => {
                const avgBand = scoreToBand(s.avgRating) as BandKey
                const avgBandCfg = getBandConfig(avgBand)
                return (
                  <div key={s.label} className="p-4" style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18 }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.88)' }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                          {s.club}{s.ageGroup ? ` · ${s.ageGroup}` : ''}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px]"
                        style={{ color: avgBandCfg.color, background: `${avgBandCfg.color}1F`, border: `1px solid ${avgBandCfg.color}40` }}>
                        {avgBandCfg.word}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {(Object.entries(s.dist) as [BandKey, number][])
                        .filter(([, count]) => count > 0)
                        .map(([band, count]) => {
                          const d = BAND_DISPLAY[band]
                          return <DistTag key={band} color={d.color} letter={d.letter} count={count} />
                        })}
                    </div>

                    <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <StatItem label="Matches" value={s.matches} />
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                        style={{ color: '#C8F25A', background: 'rgba(200,242,90,0.08)', border: '1px solid rgba(200,242,90,0.2)' }}>
                        <ShieldCheck size={10} /> Coach logged
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Entries */}
        {matches.length > 0 && (
          <div className="mt-6">
            <SectionLabel>Recent Entries</SectionLabel>
            <div className="mt-3 space-y-2">
              {matches.slice(0, 10).map(m => {
                const d = BAND_DISPLAY[m.band]
                const result = m.team_score > m.opponent_score ? 'W' : m.team_score < m.opponent_score ? 'L' : 'D'
                const resultColor = result === 'W' ? '#C8F25A' : result === 'L' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)'
                return (
                  <div key={m.id} className="p-3 flex items-center gap-3"
                    style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                    {/* Result */}
                    <div className="flex items-center justify-center shrink-0"
                      style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontWeight: 600, fontSize: 13, color: resultColor }}>
                      {result}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>
                        {m.opponent ? `vs ${m.opponent}` : m.competition || 'Match'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                          {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                          {m.team_score}–{m.opponent_score}
                        </span>
                        <span className="inline-flex items-center gap-1" style={{ fontSize: 11, color: '#C8F25A' }}>
                          <ShieldCheck size={10} /> Coach logged
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] shrink-0"
                      style={{ color: d.color, background: `${d.color}1F`, border: `1px solid ${d.color}40` }}>
                      {getBandConfig(m.band).word}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && matches.length === 0 && awards.length === 0 && (
          <div className="mt-10 text-center">
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              Your passport is empty for now.<br />
              Matches logged by your coach will appear here.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)' }}>
      {children}
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs"
      style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </span>
  )
}

function DistTag({ color, letter, count }: { color: string; letter: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ color, background: `${color}1F`, border: `1px solid ${color}40`, fontSize: 11 }}>
      <span style={{ fontWeight: 500 }}>{letter}</span>
      <span style={{ opacity: 0.85 }}>{count}</span>
    </span>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>{value}</div>
    </div>
  )
}
