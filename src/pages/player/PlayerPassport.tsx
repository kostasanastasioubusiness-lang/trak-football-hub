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

// ─── html2canvas-safe primitives ───────────────────────────────────────────
// Rule: no CSS gap, no CSS grid, no inline-flex, no baseline alignment.
// Use margin-right / margin-bottom on siblings instead of gap.
// Use display:inline-block with vertical-align:middle for horizontal rows.
// Use explicit widths (w/3 = 33.333%) for columns.

const MONO: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const SECTION_LABEL: React.CSSProperties = {
  ...MONO, fontSize: 8, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)',
  marginBottom: 14,
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

  const captureCard = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0D0D0F',
        scale: 3,
        useCORS: true,
        logging: false,
      })
      return await new Promise(res => canvas.toBlob(blob => res(blob), 'image/png'))
    } catch { return null }
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
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'trak-passport.png'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Passport saved as image')
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('Could not export passport')
    } finally { setExporting(false) }
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
    } catch { toast.error('Could not export passport') }
    finally { setExporting(false) }
  }

  const careerBandCfg = career ? getBand(career.careerBand) : null

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', ...SANS }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 20px 80px' }}>

        {/* Topbar — outside the card, uses Tailwind fine */}
        <div className="relative flex items-center justify-center mb-6 h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>Player Passport</span>
        </div>

        {/* ═══ PASSPORT CARD — everything inside uses only style props ═══ */}
        <div ref={cardRef} style={{ width: 390, background: '#0D0D0F', borderRadius: 24, overflow: 'hidden', ...SANS }}>

          {/* ── Header: TRAK label + name + pills ── */}
          <div style={{ padding: '32px 32px 26px', background: 'linear-gradient(160deg,#131418 0%,#0D0D0F 70%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

            {/* TRAK · PLAYER PASSPORT row */}
            <div style={{ marginBottom: 22 }}>
              <span style={{ ...MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8F25A' }}>
                TRAK
              </span>
              <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginLeft: 8 }}>
                PLAYER PASSPORT
              </span>
            </div>

            {/* Name */}
            <div style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.025em', color: '#FFFFFF', lineHeight: 1.05, marginBottom: 16 }}>
              {profile?.full_name || '—'}
            </div>

            {/* Identity pills — inline-block with margin-right */}
            <div>
              {[
                details?.position,
                details?.current_club,
                details?.age_group,
                details?.shirt_number ? `#${details.shirt_number}` : null,
              ].filter(Boolean).map((text, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  padding: '4px 12px', borderRadius: 999, marginRight: 8, marginBottom: 6,
                  fontSize: 11, color: 'rgba(255,255,255,0.45)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  verticalAlign: 'middle',
                }}>
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Career Band + Stats ── */}
          {career && careerBandCfg && (
            <div style={{ padding: '22px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Band hero row */}
              <div style={{
                padding: '16px 20px', borderRadius: 16, marginBottom: 14,
                background: careerBandCfg.bg, border: `1px solid ${careerBandCfg.border}`,
              }}>
                {/* Two columns via inline-block */}
                <div style={{ display: 'inline-block', width: '50%', verticalAlign: 'top' }}>
                  <div style={{ ...MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 7 }}>CAREER BAND</div>
                  <div style={{ fontSize: 26, fontWeight: 300, color: careerBandCfg.color, letterSpacing: '-0.02em' }}>{careerBandCfg.word}</div>
                </div>
                <div style={{ display: 'inline-block', width: '50%', verticalAlign: 'top', textAlign: 'right' }}>
                  <div style={{ ...MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 7 }}>AVG RATING</div>
                  <div style={{ fontSize: 26, fontWeight: 300, color: careerBandCfg.color, letterSpacing: '-0.02em' }}>{career.careerAvgRating.toFixed(1)}</div>
                </div>
              </div>

              {/* 3 stat boxes — 3 equal inline-blocks */}
              {[
                { label: 'MATCHES', value: career.totalMatches },
                { label: 'GOALS',   value: career.totalGoals },
                { label: 'ASSISTS', value: career.totalAssists },
              ].map(({ label, value }, i) => (
                <div key={label} style={{
                  display: 'inline-block',
                  width: 'calc(33.333% - 6px)',
                  marginRight: i < 2 ? 9 : 0,
                  verticalAlign: 'top',
                  padding: '12px 0', borderRadius: 12,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxSizing: 'border-box',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 300, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                  <div style={{ ...MONO, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.28)', marginTop: 5 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Season History ── */}
          {seasons.length > 0 && (
            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={SECTION_LABEL}>SEASON HISTORY</div>

              {seasons.map((s, si) => {
                const bandCfg = getBand(s.avgBand)
                const topBands = (Object.entries(s.dist) as [BandKey, number][])
                  .filter(([, c]) => c > 0)
                  .sort((a, b) => BAND_ORDER.indexOf(a[0]) - BAND_ORDER.indexOf(b[0]))
                  .slice(0, 4)
                return (
                  <div key={s.label} style={{
                    padding: '12px 16px', borderRadius: 14, marginBottom: si < seasons.length - 1 ? 10 : 0,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {/* Season year + band pill */}
                    <div>
                      <span style={{ display: 'inline-block', fontSize: 15, color: 'rgba(255,255,255,0.88)', fontWeight: 400, verticalAlign: 'middle' }}>
                        {s.label}
                      </span>
                      <span style={{
                        display: 'inline-block', verticalAlign: 'middle',
                        float: 'right',
                        padding: '3px 10px', borderRadius: 999, fontSize: 10,
                        color: bandCfg.color, background: bandCfg.bg, border: `1px solid ${bandCfg.border}`,
                      }}>
                        {bandCfg.word}
                      </span>
                    </div>
                    <div style={{ clear: 'both' }} />

                    {/* Club · age group */}
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, marginBottom: 10 }}>
                      {s.club}{s.ageGroup ? ` · ${s.ageGroup}` : ''}
                    </div>

                    {/* Stats + band dist on one line */}
                    <div>
                      {/* Mini stats */}
                      {[
                        { lbl: 'M', val: s.matches },
                        { lbl: 'G', val: s.goals },
                        { lbl: 'A', val: s.assists },
                      ].map(({ lbl, val }) => (
                        <span key={lbl} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 16 }}>
                          <span style={{ ...MONO, fontSize: 8, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>{lbl} </span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>{val}</span>
                        </span>
                      ))}

                      {/* Band dist pills — right-aligned */}
                      <span style={{ float: 'right' }}>
                        {topBands.map(([band, count], bi) => {
                          const d = getBand(band)
                          return (
                            <span key={band} style={{
                              display: 'inline-block', verticalAlign: 'middle',
                              marginLeft: bi > 0 ? 4 : 0,
                              padding: '2px 7px', borderRadius: 999, fontSize: 9,
                              color: d.color, background: `${d.color}18`, border: `1px solid ${d.color}30`,
                            }}>
                              {d.word[0]}{count}
                            </span>
                          )
                        })}
                      </span>
                      <div style={{ clear: 'both' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Recognition ── */}
          {awards.length > 0 && (
            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={SECTION_LABEL}>RECOGNITION</div>

              {awards.map((a, ai) => {
                const info = AWARD_LABELS[a.award_type] || { label: a.award_type, emoji: '🏅' }
                return (
                  <div key={a.id} style={{
                    padding: '10px 14px', borderRadius: 12, marginBottom: ai < awards.length - 1 ? 8 : 0,
                    background: 'rgba(200,242,90,0.04)', border: '1px solid rgba(200,242,90,0.1)',
                  }}>
                    <span style={{ display: 'inline-block', fontSize: 16, verticalAlign: 'middle', marginRight: 10 }}>{info.emoji}</span>
                    <span style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: 200 }}>
                      <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.88)' }}>{info.label}</span>
                      {a.awarded_for && (
                        <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{a.awarded_for}</span>
                      )}
                    </span>
                    <span style={{ ...MONO, display: 'inline-block', float: 'right', fontSize: 8, color: 'rgba(255,255,255,0.25)', verticalAlign: 'middle', marginTop: 4 }}>
                      {new Date(a.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                    <div style={{ clear: 'both' }} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && seasons.length === 0 && awards.length === 0 && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', lineHeight: 1.8 }}>
                Your passport is empty for now.<br />
                As your coach logs matches,<br />
                your career will build up here.
              </p>
            </div>
          )}

          {/* ── Footer: baked inside card ── */}
          <div style={{ padding: '16px 32px', background: 'rgba(200,242,90,0.025)' }}>
            <span style={{ ...MONO, display: 'inline-block', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8F25A', verticalAlign: 'middle' }}>
              TRAK
            </span>
            <span style={{ ...MONO, display: 'inline-block', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', marginLeft: 6, verticalAlign: 'middle' }}>
              · Verified Career Record
            </span>
            <span style={{ ...MONO, display: 'inline-block', float: 'right', fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em', verticalAlign: 'middle' }}>
              trak.football
            </span>
            <div style={{ clear: 'both' }} />
          </div>

        </div>
        {/* ═══ END PASSPORT CARD ═══ */}

        {/* Action buttons */}
        <div style={{ marginTop: 20, display: 'flex' }}>
          <button
            onClick={handleShare}
            disabled={exporting || loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', borderRadius: 14, marginRight: 12, border: 'none', cursor: 'pointer',
              background: exporting ? 'rgba(200,242,90,0.5)' : '#C8F25A',
              color: '#000', fontSize: 14, fontWeight: 500,
              opacity: loading ? 0.4 : 1,
              ...SANS,
            }}
          >
            <Share2 size={14} style={{ marginRight: 6 }} />
            {exporting ? 'Exporting…' : 'Share'}
          </button>
          <button
            onClick={handleDownload}
            disabled={exporting || loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', borderRadius: 14, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', fontSize: 14, opacity: loading ? 0.4 : 1,
              ...SANS,
            }}
          >
            <Download size={14} style={{ marginRight: 6 }} />
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
