import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar } from '@/components/trak'
import { BANDS, type BandType } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

const SERIF = "'Fraunces', Georgia, serif"
const SANS = "'DM Sans', sans-serif"
const MONO = "'DM Mono', monospace"

export default function ParentHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [childName, setChildName] = useState('')
  const [childDetails, setChildDetails] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [assessment, setAssessment] = useState<any>(null)
  const [coachName, setCoachName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) { setLoading(false); return }
      const childId = links[0].player_user_id

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', childId).single()
      if (profile) setChildName(profile.full_name)

      const { data: details } = await supabase.from('player_details').select('position, current_club, age_group').eq('user_id', childId).maybeSingle()
      if (details) setChildDetails(details)

      const { data: matchData } = await supabase.from('matches')
        .select('id, team_score, opponent_score, competition, venue, minutes_played, computed_rating, created_at, position, goals, assists, opponent, body_condition')
        .eq('user_id', childId).order('created_at', { ascending: false })
      if (matchData) setMatches(matchData)

      const { data: squadRows } = await supabase.from('squad_players').select('id').eq('linked_player_id', childId)
      if (squadRows?.length) {
        const { data: assessments } = await supabase.from('coach_assessments')
          .select('*')
          .in('squad_player_id', squadRows.map((r: any) => r.id))
          .order('created_at', { ascending: false }).limit(1)
        if (assessments?.length) {
          setAssessment(assessments[0])
          const { data: coachProfile } = await supabase.from('profiles').select('full_name').eq('user_id', assessments[0].coach_user_id).single()
          if (coachProfile) setCoachName(coachProfile.full_name)
        }
      }

      setLoading(false)
    })
  }, [user])

  const firstName = childName?.split(' ')[0] || 'Your child'
  const lastMatch = matches[0]
  const lastBand: BandType = lastMatch ? (scoreToBand(lastMatch.computed_rating || 6.5) as BandType) : 'steady'
  const lastBandConfig = BANDS.find(b => b.word.toLowerCase() === lastBand)

  const seasonAvg = matches.length
    ? matches.reduce((s, m) => s + (m.computed_rating || 6.5), 0) / matches.length
    : 0
  const seasonBand: BandType = (matches.length ? scoreToBand(seasonAvg) : 'steady') as BandType
  const seasonBandConfig = BANDS.find(b => b.word.toLowerCase() === seasonBand)

  const wins = matches.filter(m => m.team_score > m.opponent_score).length
  const draws = matches.filter(m => m.team_score === m.opponent_score).length
  const losses = matches.filter(m => m.team_score < m.opponent_score).length
  const totalGoals = matches.reduce((s, m) => s + (m.goals || 0), 0)
  const totalAssists = matches.reduce((s, m) => s + (m.assists || 0), 0)

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  // Headline writer
  const headline = (() => {
    if (!lastMatch) return `${firstName}'s season is about to begin`
    const result = lastMatch.team_score > lastMatch.opponent_score ? 'win'
      : lastMatch.team_score < lastMatch.opponent_score ? 'loss' : 'draw'
    if (lastMatch.goals >= 2) return `${firstName} stars with brace in ${lastMatch.team_score}\u2013${lastMatch.opponent_score} ${result}`
    if (lastMatch.goals === 1) return `${firstName} on the scoresheet as side ${result === 'win' ? 'edge past' : result === 'draw' ? 'share spoils with' : 'fall to'} ${lastMatch.opponent || 'rivals'}`
    if (lastBand === 'exceptional' || lastBand === 'standout') return `${firstName} delivers a ${lastBandConfig?.word.toLowerCase()} display`
    if (result === 'win') return `${firstName}'s side claim ${lastMatch.team_score}\u2013${lastMatch.opponent_score} victory`
    if (result === 'draw') return `Honours even as ${firstName}'s side draw ${lastMatch.team_score}\u2013${lastMatch.opponent_score}`
    return `${firstName}'s side fall ${lastMatch.team_score}\u2013${lastMatch.opponent_score} to ${lastMatch.opponent || 'opponents'}`
  })()

  const dek = lastMatch
    ? `Coaches rated the performance ${lastBandConfig?.word.toLowerCase()}. ${firstName} played ${lastMatch.minutes_played || 90} minutes${lastMatch.position ? ` at ${lastMatch.position}` : ''}${lastMatch.goals ? `, scoring ${lastMatch.goals}` : ''}${lastMatch.assists ? ` and assisting ${lastMatch.assists}` : ''}.`
    : `When ${firstName} logs their first match, the full report will run here on the front page.`

  if (loading) return (
    <MobileShell>
      <div className="pt-6 pb-4 space-y-6">
        <div className="h-3 w-40 bg-white/[0.06] animate-pulse rounded" />
        <div className="h-12 w-3/4 bg-white/[0.06] animate-pulse rounded" />
        <div className="h-40 w-full bg-white/[0.04] animate-pulse rounded" />
      </div>
      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )

  return (
    <MobileShell>
      <div className="pt-4 pb-6">

        {/* ── MASTHEAD ── */}
        <div className="border-b-2 border-white/[0.88] pb-2.5 mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] tracking-[0.18em] uppercase text-white/45" style={{ fontFamily: MONO }}>
              Vol. 1 &middot; No. {matches.length || 1}
            </span>
            <button
              onClick={() => {/* switch child */}}
              className="text-[9px] tracking-[0.18em] uppercase text-white/45 underline-offset-2 hover:underline"
              style={{ fontFamily: MONO }}
            >
              Switch desk
            </button>
          </div>
          <h1
            className="text-[44px] leading-[0.9] text-white/95"
            style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.03em', fontStyle: 'italic' }}
          >
            The Trak Times
          </h1>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] tracking-[0.18em] uppercase text-white/45" style={{ fontFamily: MONO }}>
              {dateStr}
            </span>
            <span className="text-[9px] tracking-[0.18em] uppercase text-white/45" style={{ fontFamily: MONO }}>
              {firstName} desk
            </span>
          </div>
        </div>

        {/* ── KICKER ── */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-1.5 h-1.5 bg-[#C8F25A]" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-[#C8F25A]" style={{ fontFamily: MONO, fontWeight: 500 }}>
            {lastMatch ? 'Top story' : 'Coming soon'}
          </span>
        </div>

        {/* ── HEADLINE ── */}
        <h2
          className="text-[30px] leading-[1.05] text-white/95 mb-3"
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          {headline}
        </h2>

        {/* ── DEK ── */}
        <p
          className="text-[15px] leading-[1.45] text-white/65 mb-3"
          style={{ fontFamily: SERIF, fontWeight: 300 }}
        >
          {dek}
        </p>

        {/* ── BYLINE ── */}
        {lastMatch && (
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.08]">
            <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] text-white/45" style={{ fontFamily: SERIF }}>
              T
            </div>
            <div>
              <p className="text-[10px] tracking-[0.14em] uppercase text-white/45" style={{ fontFamily: MONO }}>
                By Trak Match Desk
              </p>
              <p className="text-[10px] tracking-[0.14em] uppercase text-white/30" style={{ fontFamily: MONO }}>
                Filed {new Date(lastMatch.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {lastMatch.venue ? ` \u00B7 ${lastMatch.venue}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* ── SCOREBOX (pull-quote style) ── */}
        {lastMatch && (
          <div className="mb-6 px-4 py-4 border-l-2 border-[#C8F25A] bg-white/[0.02]">
            <p className="text-[9px] tracking-[0.18em] uppercase text-white/45 mb-2" style={{ fontFamily: MONO }}>
              Final score &middot; {lastMatch.competition || 'Match'}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-[36px] leading-none text-white/95" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.03em' }}>
                {lastMatch.team_score}
              </span>
              <span className="text-[14px] text-white/45" style={{ fontFamily: SERIF, fontStyle: 'italic' }}>vs</span>
              <span className="text-[36px] leading-none text-white/95" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.03em' }}>
                {lastMatch.opponent_score}
              </span>
              <span className="text-[12px] text-white/45 ml-2" style={{ fontFamily: SANS }}>
                {lastMatch.opponent || 'Opponent'}
              </span>
            </div>
            <div className="mt-2 inline-block px-2 py-0.5 rounded-sm" style={{ background: `${lastBandConfig?.color}22`, color: lastBandConfig?.color }}>
              <span className="text-[10px] tracking-[0.14em] uppercase" style={{ fontFamily: MONO, fontWeight: 500 }}>
                Rated: {lastBandConfig?.word}
              </span>
            </div>
          </div>
        )}

        {/* ── SECTION: SEASON IN NUMBERS ── */}
        {matches.length > 0 && (
          <section className="mb-6">
            <SectionRule label="Season in numbers" />
            <div className="grid grid-cols-3 gap-4 mt-3">
              <Stat label="Form" value={seasonBandConfig?.word || '—'} valueColor={seasonBandConfig?.color} small />
              <Stat label="Played" value={String(matches.length)} />
              <Stat label="Record" value={`${wins}-${draws}-${losses}`} />
              <Stat label="Goals" value={String(totalGoals)} />
              <Stat label="Assists" value={String(totalAssists)} />
              <Stat label="Position" value={childDetails?.position || '—'} small />
            </div>
          </section>
        )}

        {/* ── SECTION: COACH'S CORNER ── */}
        {assessment && (
          <section className="mb-6">
            <SectionRule label="Coach's corner" />
            <div className="mt-3">
              <p className="text-[10px] tracking-[0.18em] uppercase text-white/45 mb-1.5" style={{ fontFamily: MONO }}>
                Filed by {coachName || 'Coach'} &middot; {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
              </p>
              <h3
                className="text-[20px] leading-[1.15] text-white/90 mb-3"
                style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                Latest assessment scores {firstName} across six pillars
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Work Rate', score: assessment.work_rate },
                  { label: 'Tactical', score: assessment.tactical },
                  { label: 'Attitude', score: assessment.attitude },
                  { label: 'Technical', score: assessment.technical },
                  { label: 'Physical', score: assessment.physical },
                  { label: 'Coachability', score: assessment.coachability },
                ].map(cat => {
                  const band = scoreToBand(cat.score || 6.5)
                  const cfg = BANDS.find(b => b.word.toLowerCase() === band)!
                  return (
                    <div key={cat.label} className="flex items-center gap-3 py-1 border-b border-white/[0.05]">
                      <span className="text-[11px] text-white/65 w-[100px] flex-shrink-0" style={{ fontFamily: SERIF, fontStyle: 'italic' }}>
                        {cat.label}
                      </span>
                      <div className="flex-1 h-[3px] bg-white/[0.06] overflow-hidden">
                        <div className="h-full" style={{ width: `${((cat.score || 6.5) / 10) * 100}%`, backgroundColor: cfg.color }} />
                      </div>
                      <span className="text-[10px] tracking-[0.12em] uppercase w-[80px] text-right flex-shrink-0" style={{ fontFamily: MONO, color: cfg.color }}>
                        {cfg.word}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION: ALSO IN THIS EDITION (recent matches mini-feed) ── */}
        {matches.length > 1 && (
          <section className="mb-6">
            <SectionRule label="Also in this edition" />
            <div className="mt-3 space-y-4">
              {matches.slice(1, 4).map((m, i) => {
                const band = scoreToBand(m.computed_rating || 6.5)
                const cfg = BANDS.find(b => b.word.toLowerCase() === band)!
                const result = m.team_score > m.opponent_score ? 'Won' : m.team_score < m.opponent_score ? 'Lost' : 'Drew'
                return (
                  <button
                    key={m.id}
                    onClick={() => navigate('/parent/matches')}
                    className="w-full text-left flex gap-3 pb-4 border-b border-white/[0.06] last:border-b-0"
                  >
                    <span className="text-[28px] leading-none text-white/30 flex-shrink-0 w-7 pt-0.5" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                      {String(i + 2).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] tracking-[0.18em] uppercase mb-1" style={{ fontFamily: MONO, color: cfg.color }}>
                        {cfg.word} &middot; {m.competition || 'Match'}
                      </p>
                      <p className="text-[15px] leading-[1.2] text-white/85" style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: '-0.01em' }}>
                        {result} {m.team_score}&ndash;{m.opponent_score} {result === 'Drew' ? 'with' : result === 'Won' ? 'against' : 'to'} {m.opponent || 'opponents'}
                      </p>
                      <p className="text-[10px] tracking-[0.14em] uppercase text-white/30 mt-1" style={{ fontFamily: MONO }}>
                        {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => navigate('/parent/matches')}
              className="mt-3 text-[11px] tracking-[0.16em] uppercase text-[#C8F25A] hover:underline underline-offset-2"
              style={{ fontFamily: MONO, fontWeight: 500 }}
            >
              Read all match reports &rarr;
            </button>
          </section>
        )}

        {/* ── EMPTY STATE ── */}
        {!childName && matches.length === 0 && (
          <div className="mt-8 text-center py-10 border-y border-white/[0.08]">
            <p className="text-[10px] tracking-[0.18em] uppercase text-white/45 mb-2" style={{ fontFamily: MONO }}>
              Newsroom empty
            </p>
            <p className="text-[18px] leading-[1.3] text-white/75" style={{ fontFamily: SERIF, fontStyle: 'italic' }}>
              Awaiting first dispatch from your child's invite
            </p>
          </div>
        )}

        {/* ── FOOTER colophon ── */}
        <div className="mt-10 pt-4 border-t border-white/[0.08] text-center">
          <p className="text-[9px] tracking-[0.18em] uppercase text-white/22" style={{ fontFamily: MONO }}>
            The Trak Times &middot; Parent Edition
          </p>
        </div>

      </div>

      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-[0.22em] uppercase text-white/65 whitespace-nowrap" style={{ fontFamily: MONO, fontWeight: 500 }}>
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.12]" />
    </div>
  )
}

function Stat({ label, value, valueColor, small }: { label: string; value: string; valueColor?: string; small?: boolean }) {
  return (
    <div className="border-l border-white/[0.1] pl-2.5">
      <p className="text-[9px] tracking-[0.16em] uppercase text-white/45 mb-1" style={{ fontFamily: MONO }}>
        {label}
      </p>
      <p
        className={small ? 'text-[15px]' : 'text-[22px]'}
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: valueColor || 'rgba(255,255,255,0.9)',
        }}
      >
        {value}
      </p>
    </div>
  )
}
