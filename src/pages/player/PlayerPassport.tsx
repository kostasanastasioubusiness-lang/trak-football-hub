import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Download } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'

type BandKey = 'exceptional' | 'standout' | 'good' | 'steady' | 'mixed' | 'developing' | 'difficult'

type SeasonSummary = {
  label: string
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

const BAND_ORDER = ['exceptional','standout','good','steady','mixed','developing','difficult']

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
  const cardRef = useRef<HTMLDivElement>(null)

  const [details, setDetails] = useState<any>(null)
  const [seasons, setSeasons] = useState<SeasonSummary[]>([])
  const [career, setCareer] = useState<CareerStats | null>(null)
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  const loadData = async () => {
    const [{ data: det }, { data: rawMatches }] = await Promise.all([
      supabase.from('player_details').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('matches')
        .select('created_at, computed_rating, goals, assists')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true }),
    ])
    setDetails(det)

    const { data: squadRows } = await supabase
      .from('squad_players').select('id').eq('linked_player_id', user!.id)
    const squadIds = (squadRows ?? []).map(r => r.id)

    const awardsRes = squadIds.length > 0
      ? await supabase.from('recognition_awards')
          .select('id, award_type, awarded_for, created_at')
          .in('squad_player_id', squadIds)
          .order('created_at', { ascending: false })
      : { data: null }

    setAwards(awardsRes.data ?? [])

    // Group matches by academic season
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
          label, club: det?.current_club || 'Academy',
          ageGroup: det?.age_group || '',
          matches: ms!.length, goals, assists,
          avgBand: scoreToBand(avgRating) as BandKey,
          avgRating, dist,
        }
      })

    setSeasons(seasonRows)

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

  // ── Export: capture the card div as a PNG ──────────────────────────────────
  const captureCard = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,          // 3× for crisp retina output
        useCORS: true,
        logging: false,
      })
      return await new Promise(res => canvas.toBlob(blob => res(blob), 'image/png'))
    } catch {
      return null
    }
  }

  const handleShare = async () => {
    setExporting(true)
    try {
      const blob = await captureCard()
      if (!blob) throw new Error('capture failed')
      const file = new File([blob], 'trak-passport.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${profile?.full_name ?? 'Player'} · TRAK Passport` })
        return
      }
      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'trak-passport.png'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Passport saved as image')
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('Could not export passport')
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = async () => {
    setExporting(true)
    try {
      const blob = await captureCard()
      if (!blob) throw new Error('capture failed')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'trak-passport.png'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Passport downloaded')
    } catch {
      toast.error('Could not export passport')
    } finally {
      setExporting(false)
    }
  }

  const careerBandCfg = career ? getBand(career.careerBand) : null

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-[430px] px-5 pt-5 pb-20">

        {/* Topbar */}
        <div className="relative flex items-center justify-center mb-6 h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>Player Passport</span>
        </div>

        {/* ── SHAREABLE CARD (captured by html2canvas) ─────────────────── */}
        <div
          ref={cardRef}
          style={{
            width: 390,
            background: '#0D0D0F',
            borderRadius: 24,
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Card top: name + identity block with TRAK wordmark baked in */}
          <div style={{
            padding: '36px 32px 28px',
            background: 'linear-gradient(160deg, #131418 0%, #0D0D0F 60%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}>
            {/* Subtle watermark behind name */}
            <div style={{
              position: 'absolute', top: 20, right: 28,
              fontFamily: "'DM Mono', monospace",
              fontSize: 72, fontWeight: 700,
              color: 'rgba(200,242,90,0.04)',
              letterSpacing: '-0.05em',
              userSelect: 'none', pointerEvents: 'none',
              lineHeight: 1,
            }}>TRAK</div>

            {/* TRAK label top-left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#C8F25A',
              }}>TRAK</span>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.2)',
              }}>PLAYER PASSPORT</span>
            </div>

            {/* Name */}
            <div style={{ fontSize: 34, fontWeight: 300, letterSpacing: '-0.03em', color: '#FFFFFF', lineHeight: 1.05 }}>
              {profile?.full_name || '—'}
            </div>

            {/* Identity pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {details?.position    && <CardPill>{details.position}</CardPill>}
              {details?.current_club && <CardPill>{details.current_club}</CardPill>}
              {details?.age_group   && <CardPill>{details.age_group}</CardPill>}
              {details?.shirt_number && <CardPill>#{details.shirt_number}</CardPill>}
            </div>
          </div>

          {/* Career band + stats */}
          {career && careerBandCfg && (
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Band hero */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: 16,
                background: `${careerBandCfg.bg}`,
                border: `1px solid ${careerBandCfg.border}`,
                marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                    CAREER BAND
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: careerBandCfg.color, letterSpacing: '-0.02em' }}>
                    {careerBandCfg.word}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                    AVG RATING
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: careerBandCfg.color, letterSpacing: '-0.02em' }}>
                    {career.careerAvgRating.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <CardStat label="Matches" value={career.totalMatches} />
                <CardStat label="Goals"   value={career.totalGoals} />
                <CardStat label="Assists" value={career.totalAssists} />
              </div>
            </div>
          )}

          {/* Season history */}
          {seasons.length > 0 && (
            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
                SEASON HISTORY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {seasons.map(s => {
                  const bandCfg = getBand(s.avgBand)
                  const topBands = (Object.entries(s.dist) as [BandKey, number][])
                    .filter(([, c]) => c > 0)
                    .sort((a, b) => BAND_ORDER.indexOf(a[0]) - BAND_ORDER.indexOf(b[0]))
                  return (
                    <div key={s.label} style={{
                      padding: '12px 16px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', fontWeight: 400 }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {s.club}{s.ageGroup ? ` · ${s.ageGroup}` : ''}
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 10,
                          color: bandCfg.color, background: bandCfg.bg,
                          border: `1px solid ${bandCfg.border}`,
                        }}>{bandCfg.word}</span>
                      </div>
                      {/* Mini stats + dist */}
                      <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center' }}>
                        <MiniStat label="M" value={s.matches} />
                        <MiniStat label="G" value={s.goals} />
                        <MiniStat label="A" value={s.assists} />
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
                          {topBands.slice(0, 4).map(([band, count]) => {
                            const d = getBand(band)
                            return (
                              <span key={band} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '1px 7px', borderRadius: 999, fontSize: 9,
                                color: d.color, background: `${d.color}18`,
                                border: `1px solid ${d.color}30`,
                              }}>
                                {d.word[0]}<span style={{ opacity: 0.75 }}>{count}</span>
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recognition */}
          {awards.length > 0 && (
            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
                RECOGNITION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {awards.map(a => {
                  const info = AWARD_LABELS[a.award_type] || { label: a.award_type, emoji: '🏅' }
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 12,
                      background: 'rgba(200,242,90,0.04)',
                      border: '1px solid rgba(200,242,90,0.1)',
                    }}>
                      <span style={{ fontSize: 16 }}>{info.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)' }}>{info.label}</div>
                        {a.awarded_for && (
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{a.awarded_for}</div>
                        )}
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
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
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', lineHeight: 1.8 }}>
                Your passport is empty for now.<br />
                As your coach logs matches and assessments,<br />
                your career will build up here.
              </p>
            </div>
          )}

          {/* Footer — baked into the card, not croppable without losing content */}
          <div style={{
            padding: '16px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(200,242,90,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8F25A',
              }}>TRAK</span>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9,
                color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em',
              }}>· Verified Career Record</span>
            </div>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em',
            }}>trak.football</span>
          </div>
        </div>

        {/* Action buttons below card */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleShare}
            disabled={exporting || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] transition-opacity"
            style={{
              background: exporting ? 'rgba(200,242,90,0.5)' : '#C8F25A',
              color: '#000', fontSize: 14, fontWeight: 500,
              opacity: loading ? 0.4 : 1,
            }}
          >
            <Share2 size={14} />
            {exporting ? 'Exporting…' : 'Share'}
          </button>
          <button
            onClick={handleDownload}
            disabled={exporting || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] transition-opacity"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', fontSize: 14,
              opacity: loading ? 0.4 : 1,
            }}
          >
            <Download size={14} />
            Save Image
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 14, lineHeight: 1.6 }}>
          Exports as a PNG image you can share anywhere
        </p>

      </div>
    </div>
  )
}

// ── Inline sub-components (used inside cardRef — must use style not className) ──

function CardPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: 999,
      fontSize: 11, color: 'rgba(255,255,255,0.45)',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {children}
    </span>
  )
}

function CardStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 8px', borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ fontSize: 26, fontWeight: 300, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 8,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.28)', marginTop: 5,
      }}>
        {label}
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>{value}</span>
    </div>
  )
}
