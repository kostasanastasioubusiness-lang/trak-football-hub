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

const AWARD_LABELS: Record<string, string> = {
  player_of_week:   'Player of the Week',
  player_of_month:  'Player of the Month',
  most_improved:    'Most Improved',
  top_scorer:       'Top Scorer',
  player_of_season: 'Player of the Season',
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

// Card geometry — everything derived from these so nothing overflows
const CARD_W   = 390   // card pixel width
const CARD_PAD = 28    // horizontal padding inside sections
const CONTENT  = CARD_W - CARD_PAD * 2  // 334px
const COL3_GAP = 8
const COL3_W   = Math.floor((CONTENT - COL3_GAP * 2) / 3)  // 106px

const MONO: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

export default function PlayerPassport() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)

  const [details, setDetails]   = useState<any>(null)
  const [seasons, setSeasons]   = useState<SeasonSummary[]>([])
  const [career,  setCareer]    = useState<CareerStats | null>(null)
  const [awards,  setAwards]    = useState<Award[]>([])
  const [loading, setLoading]   = useState(true)
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
          label, club: det?.current_club || 'Academy', ageGroup: det?.age_group || '',
          matches: ms!.length, goals, assists,
          avgBand: scoreToBand(avgRating) as BandKey, avgRating, dist,
        }
      })
    setSeasons(seasonRows)

    const allMatches = rawMatches ?? []
    if (allMatches.length > 0) {
      const totalRating = allMatches.reduce((s, m) => s + (m.computed_rating ?? 6.5), 0)
      const avgRating   = totalRating / allMatches.length
      setCareer({
        totalMatches:     allMatches.length,
        totalGoals:       allMatches.reduce((s, m) => s + (m.goals ?? 0), 0),
        totalAssists:     allMatches.reduce((s, m) => s + (m.assists ?? 0), 0),
        careerAvgRating:  Math.round(avgRating * 10) / 10,
        careerBand:       scoreToBand(avgRating) as BandKey,
      })
    }
    setLoading(false)
  }

  // ── Capture ──────────────────────────────────────────────────────────────
  const captureCard = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    try {
      // Wait for all web fonts to be ready before capturing
      await document.fonts.ready
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0D0D0F',
        scale: 3,
        useCORS: true,
        logging: false,
        // Force html2canvas to see the current scroll position
        scrollX: 0,
        scrollY: -window.scrollY,
      })
      return await new Promise(res => canvas.toBlob(b => res(b), 'image/png'))
    } catch { return null }
  }

  const handleShare = async () => {
    setExporting(true)
    try {
      const blob = await captureCard()
      if (!blob) throw new Error('failed')
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
      if (!blob) throw new Error('failed')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'trak-passport.png'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Passport downloaded')
    } catch { toast.error('Could not export passport') }
    finally { setExporting(false) }
  }

  const bandCfg = career ? getBand(career.careerBand) : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', ...SANS }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 20px 80px' }}>

        {/* Nav bar — outside card, Tailwind OK here */}
        <div className="relative flex items-center justify-center mb-6 h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)' }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>Player Passport</span>
        </div>

        {/* ═════════════ PASSPORT CARD ═════════════
            Rules inside this div:
            · All widths are explicit px (no %, no calc)
            · No CSS gap / CSS grid
            · No inline-flex
            · No letterSpacing on text that lives inside a tight box
            · All multi-column rows use inline-block + explicit px widths
        ════════════════════════════════════════════ */}
        <div
          ref={cardRef}
          style={{
            width: CARD_W,
            background: '#0D0D0F',
            borderRadius: 24,
            overflow: 'hidden',
            position: 'relative',
            ...SANS,
          }}
        >
          {/* ── Centred watermark ── */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            ...MONO,
            fontSize: 120, fontWeight: 700,
            color: 'rgba(200,242,90,0.035)',
            userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap', lineHeight: 1,
            zIndex: 0,
          }}>
            TRAK
          </div>

          {/* All sections sit above the watermark */}
          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* ── Header ── */}
            <div style={{
              width: CARD_W, boxSizing: 'border-box',
              padding: `32px ${CARD_PAD}px 26px`,
              background: 'linear-gradient(160deg,#131418 0%,#0D0D0F 70%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {/* TRAK · PLAYER PASSPORT */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ ...MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8F25A' }}>TRAK</span>
                <span style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginLeft: 8 }}>PLAYER PASSPORT</span>
              </div>

              {/* Player name — capped so it never overflows */}
              <div style={{
                fontSize: 30, fontWeight: 300, color: '#FFFFFF', lineHeight: 1.1,
                marginBottom: 16, maxWidth: CONTENT, overflow: 'hidden',
                whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                {profile?.full_name || '—'}
              </div>

              {/* Identity pills */}
              <div style={{ fontSize: 0 /* kill inline-block gaps */ }}>
                {[
                  details?.position,
                  details?.current_club,
                  details?.age_group,
                  details?.shirt_number ? `#${details.shirt_number}` : null,
                ].filter(Boolean).map((text, i) => (
                  <span key={i} style={{
                    display: 'inline-block', verticalAlign: 'middle',
                    marginRight: 8, marginBottom: 6,
                    padding: '4px 11px', borderRadius: 999,
                    fontSize: 11, color: 'rgba(255,255,255,0.45)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    maxWidth: 150, overflow: 'hidden',
                    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Career band + stats ── */}
            {career && bandCfg && (
              <div style={{
                width: CARD_W, boxSizing: 'border-box',
                padding: `22px ${CARD_PAD}px`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {/* Band hero — two explicit-width columns */}
                <div style={{
                  width: CONTENT, boxSizing: 'border-box',
                  padding: '16px 18px', borderRadius: 16, marginBottom: 12,
                  background: bandCfg.bg, border: `1px solid ${bandCfg.border}`,
                }}>
                  <div style={{ display: 'inline-block', width: 140, verticalAlign: 'top' }}>
                    <div style={{ ...MONO, fontSize: 8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 7 }}>CAREER BAND</div>
                    <div style={{ fontSize: 26, fontWeight: 300, color: bandCfg.color }}>{bandCfg.word}</div>
                  </div>
                  <div style={{ display: 'inline-block', width: CONTENT - 140 - 36, verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ ...MONO, fontSize: 8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 7 }}>AVG RATING</div>
                    <div style={{ fontSize: 26, fontWeight: 300, color: bandCfg.color }}>{career.careerAvgRating.toFixed(1)}</div>
                  </div>
                </div>

                {/* 3 stat boxes with explicit pixel widths */}
                <div style={{ width: CONTENT, fontSize: 0 }}>
                  {[
                    { label: 'MATCHES', value: career.totalMatches },
                    { label: 'GOALS',   value: career.totalGoals   },
                    { label: 'ASSISTS', value: career.totalAssists  },
                  ].map(({ label, value }, i) => (
                    <div key={label} style={{
                      display: 'inline-block', verticalAlign: 'top',
                      width: COL3_W, marginRight: i < 2 ? COL3_GAP : 0,
                      padding: '12px 0', borderRadius: 12, textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxSizing: 'border-box',
                    }}>
                      <div style={{ fontSize: 24, fontWeight: 300, color: '#FFF', lineHeight: 1 }}>{value}</div>
                      <div style={{ ...MONO, fontSize: 8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginTop: 5 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Season History ── */}
            {seasons.length > 0 && (
              <div style={{
                width: CARD_W, boxSizing: 'border-box',
                padding: `20px ${CARD_PAD}px`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ ...MONO, fontSize: 8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
                  SEASON HISTORY
                </div>

                {seasons.map((s, si) => {
                  const sc = getBand(s.avgBand)
                  const topBands = (Object.entries(s.dist) as [BandKey, number][])
                    .filter(([, c]) => c > 0)
                    .sort((a, b) => BAND_ORDER.indexOf(a[0]) - BAND_ORDER.indexOf(b[0]))
                    .slice(0, 4)

                  // Band pill width: word length varies — give it a fixed slot
                  const PILL_W = 72

                  return (
                    <div key={s.label} style={{
                      width: CONTENT, boxSizing: 'border-box',
                      padding: '12px 14px', borderRadius: 14,
                      marginBottom: si < seasons.length - 1 ? 10 : 0,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {/* Year + band pill — two fixed-width blocks */}
                      <div style={{ width: CONTENT - 28, marginBottom: 4, fontSize: 0 }}>
                        <div style={{
                          display: 'inline-block', verticalAlign: 'middle',
                          width: CONTENT - 28 - PILL_W - 8,
                          fontSize: 15, color: 'rgba(255,255,255,0.88)', fontWeight: 400,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>
                          {s.label}
                        </div>
                        <div style={{ display: 'inline-block', verticalAlign: 'middle', width: PILL_W, textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px', borderRadius: 999, fontSize: 10,
                            color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                            whiteSpace: 'nowrap',
                          }}>
                            {sc.word}
                          </span>
                        </div>
                      </div>

                      {/* Club · age */}
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                        {s.club}{s.ageGroup ? ` · ${s.ageGroup}` : ''}
                      </div>

                      {/* Mini stats + band dist */}
                      <div style={{ width: CONTENT - 28, fontSize: 0 }}>
                        {/* Stats — fixed 32px each */}
                        {[
                          { lbl: 'M', val: s.matches },
                          { lbl: 'G', val: s.goals   },
                          { lbl: 'A', val: s.assists  },
                        ].map(({ lbl, val }) => (
                          <span key={lbl} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 14, width: 28 }}>
                            <span style={{ ...MONO, fontSize: 8, color: 'rgba(255,255,255,0.28)' }}>{lbl} </span>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{val}</span>
                          </span>
                        ))}

                        {/* Band dist pills — right-aligned */}
                        <span style={{ display: 'inline-block', verticalAlign: 'middle', textAlign: 'right', width: CONTENT - 28 - 3 * (28 + 14) }}>
                          {topBands.map(([band, count], bi) => {
                            const d = getBand(band)
                            return (
                              <span key={band} style={{
                                display: 'inline-block', verticalAlign: 'middle',
                                marginLeft: bi > 0 ? 4 : 0,
                                padding: '2px 7px', borderRadius: 999, fontSize: 9,
                                color: d.color, background: `${d.color}18`,
                                border: `1px solid ${d.color}30`,
                                whiteSpace: 'nowrap',
                              }}>
                                {d.word[0]}{count}
                              </span>
                            )
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Recognition ── */}
            {awards.length > 0 && (
              <div style={{
                width: CARD_W, boxSizing: 'border-box',
                padding: `20px ${CARD_PAD}px`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ ...MONO, fontSize: 8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
                  RECOGNITION
                </div>

                {awards.map((a, ai) => {
                  const label = AWARD_LABELS[a.award_type] || a.award_type
                  const DATE_W = 64
                  return (
                    <div key={a.id} style={{
                      width: CONTENT, boxSizing: 'border-box',
                      padding: '10px 14px', borderRadius: 12,
                      marginBottom: ai < awards.length - 1 ? 8 : 0,
                      background: 'rgba(200,242,90,0.04)',
                      border: '1px solid rgba(200,242,90,0.1)',
                      fontSize: 0,
                    }}>
                      {/* Award name + optional note */}
                      <div style={{
                        display: 'inline-block', verticalAlign: 'middle',
                        width: CONTENT - 28 - DATE_W - 8,
                      }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {label}
                        </div>
                        {a.awarded_for && (
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.awarded_for}
                          </div>
                        )}
                      </div>
                      {/* Date — right-aligned, fixed width */}
                      <div style={{
                        display: 'inline-block', verticalAlign: 'middle',
                        width: DATE_W, textAlign: 'right',
                        ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)',
                      }}>
                        {new Date(a.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && seasons.length === 0 && awards.length === 0 && (
              <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', lineHeight: 1.8, margin: 0 }}>
                  Your passport is empty for now.<br />
                  As your coach logs matches,<br />
                  your career will build up here.
                </p>
              </div>
            )}

            {/* ── Footer ── */}
            <div style={{
              width: CARD_W, boxSizing: 'border-box',
              padding: `14px ${CARD_PAD}px`,
              background: 'rgba(200,242,90,0.025)',
              fontSize: 0,
            }}>
              <span style={{ ...MONO, display: 'inline-block', verticalAlign: 'middle', fontSize: 11, textTransform: 'uppercase', color: '#C8F25A' }}>TRAK</span>
              <span style={{ ...MONO, display: 'inline-block', verticalAlign: 'middle', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 6 }}>· Verified Career Record</span>
              <span style={{ ...MONO, display: 'inline-block', verticalAlign: 'middle', fontSize: 9, color: 'rgba(255,255,255,0.18)', float: 'right' }}>trak.football</span>
            </div>

          </div>{/* /z-index wrapper */}
        </div>
        {/* ═════════════ END CARD ═════════════ */}

        {/* Action buttons */}
        <div style={{ marginTop: 20, display: 'flex' }}>
          <button
            onClick={handleShare}
            disabled={exporting || loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', borderRadius: 14, marginRight: 12, border: 'none', cursor: 'pointer',
              background: exporting ? 'rgba(200,242,90,0.5)' : '#C8F25A',
              color: '#000', fontSize: 14, fontWeight: 500, opacity: loading ? 0.4 : 1,
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
