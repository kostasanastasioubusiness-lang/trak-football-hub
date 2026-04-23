import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'

const SERIF = "'Fraunces', Georgia, serif"
const MONO = "'DM Mono', monospace"

interface Alert {
  id: string
  type: 'new_match' | 'coach_assessment'
  kicker: string
  headline: string
  summary: string
  date: string
  isNew: boolean
  accent: string
}

export default function ParentAlerts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) { setLoading(false); return }
      const childId = links[0].player_user_id

      const now = new Date()
      const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
      const generated: Alert[] = []

      const { data: childProfile } = await supabase.from('profiles').select('full_name').eq('user_id', childId).single()
      const firstName = childProfile?.full_name?.split(' ')[0] || 'Player'

      const { data: matches } = await supabase.from('matches')
        .select('id, team_score, opponent_score, competition, computed_rating, created_at, opponent, goals, assists')
        .eq('user_id', childId).order('created_at', { ascending: false }).limit(20)

      if (matches) {
        matches.forEach(m => {
          const matchDate = new Date(m.created_at)
          const r = m.team_score > m.opponent_score ? 'win' : m.team_score < m.opponent_score ? 'defeat' : 'draw'
          const band = scoreToBand(m.computed_rating || 6.5)
          const cfg = BANDS.find(b => b.word.toLowerCase() === band)!
          generated.push({
            id: `match-${m.id}`,
            type: 'new_match',
            kicker: 'Match desk',
            headline: m.goals >= 1
              ? `${firstName} on scoresheet in ${m.team_score}\u2013${m.opponent_score} ${r}`
              : `${firstName}'s side ${r === 'win' ? 'beat' : r === 'draw' ? 'draw with' : 'fall to'} ${m.opponent || 'opponents'}`,
            summary: `${cfg.word} performance against ${m.opponent || m.competition || 'opponents'}.`,
            date: m.created_at,
            isNew: matchDate > cutoff,
            accent: cfg.color,
          })
        })
      }

      const { data: squadRows } = await supabase.from('squad_players').select('id').eq('linked_player_id', childId)
      if (squadRows?.length) {
        const { data: assessments } = await supabase.from('coach_assessments')
          .select('id, created_at, coach_user_id, work_rate, tactical, attitude, technical, physical, coachability')
          .in('squad_player_id', squadRows.map((r: any) => r.id))
          .order('created_at', { ascending: false }).limit(10)

        if (assessments) {
          for (const a of assessments) {
            const aDate = new Date(a.created_at)
            const avg = (a.work_rate + a.tactical + a.attitude + a.technical + a.physical + a.coachability) / 6
            const band = scoreToBand(avg)
            const cfg = BANDS.find(b => b.word.toLowerCase() === band)!
            const { data: coachProfile } = await supabase.from('profiles').select('full_name').eq('user_id', a.coach_user_id).single()
            generated.push({
              id: `assess-${a.id}`,
              type: 'coach_assessment',
              kicker: "Coach's corner",
              headline: `${coachProfile?.full_name || 'Coach'} files new assessment`,
              summary: `Overall rating: ${cfg.word}. Six-pillar review now in the parent edition.`,
              date: a.created_at,
              isNew: aDate > cutoff,
              accent: cfg.color,
            })
          }
        }
      }

      generated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setAlerts(generated)
      setLoading(false)
    })
  }, [user])

  const formatTimestamp = (d: string) => {
    const dt = new Date(d)
    const now = new Date()
    const diffH = Math.floor((now.getTime() - dt.getTime()) / 3.6e6)
    if (diffH < 1) return 'Just in'
    if (diffH < 24) return `${diffH}h ago`
    const diffD = Math.floor(diffH / 24)
    if (diffD === 1) return 'Yesterday'
    if (diffD < 7) return `${diffD}d ago`
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const breakingCount = alerts.filter(a => a.isNew).length

  return (
    <MobileShell>
      <div className="pt-4 pb-6">

        {/* ── Masthead ── */}
        <div className="border-b-2 border-white/[0.88] pb-2 mb-3">
          <p className="text-[9px] tracking-[0.22em] uppercase text-white/45 mb-1" style={{ fontFamily: MONO }}>
            The Trak Times &middot; Newswire
          </p>
          <h1
            className="text-[34px] leading-[0.95] text-white/95"
            style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.03em', fontStyle: 'italic' }}
          >
            Breaking
          </h1>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] tracking-[0.16em] uppercase text-white/45" style={{ fontFamily: MONO }}>
              Live wire &middot; rolling updates
            </p>
            {breakingCount > 0 && (
              <span className="px-2 py-0.5 bg-[#fb923c] text-[#0A0A0B] text-[9px] tracking-[0.18em] uppercase" style={{ fontFamily: MONO, fontWeight: 600 }}>
                {breakingCount} new
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/[0.04] animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 border-y border-white/[0.08]">
            <p className="text-[10px] tracking-[0.18em] uppercase text-white/45 mb-2" style={{ fontFamily: MONO }}>
              Wire silent
            </p>
            <p className="text-[18px] leading-[1.3] text-white/75" style={{ fontFamily: SERIF, fontStyle: 'italic' }}>
              No bulletins to report
            </p>
          </div>
        ) : (
          <div>
            {alerts.map((a, i) => (
              <article
                key={a.id}
                className={`py-4 ${i < alerts.length - 1 ? 'border-b border-white/[0.08]' : ''} ${!a.isNew ? 'opacity-65' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {a.isNew && (
                    <span className="px-1.5 py-0.5 bg-[#fb923c] text-[#0A0A0B] text-[8px] tracking-[0.2em] uppercase" style={{ fontFamily: MONO, fontWeight: 700 }}>
                      Breaking
                    </span>
                  )}
                  <span className="text-[9px] tracking-[0.22em] uppercase" style={{ fontFamily: MONO, fontWeight: 500, color: a.accent }}>
                    {a.kicker}
                  </span>
                  <span className="text-white/22 text-[9px]">&middot;</span>
                  <span className="text-[9px] tracking-[0.16em] uppercase text-white/45" style={{ fontFamily: MONO }}>
                    {formatTimestamp(a.date)}
                  </span>
                </div>
                <h2 className="text-[17px] leading-[1.2] text-white/95 mb-1" style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {a.headline}
                </h2>
                <p className="text-[12px] leading-[1.4] text-white/55" style={{ fontFamily: SERIF, fontWeight: 300 }}>
                  {a.summary}
                </p>
              </article>
            ))}
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
              <p className="text-[9px] tracking-[0.22em] uppercase text-white/22" style={{ fontFamily: MONO }}>
                End of wire &middot; updated continuously
              </p>
            </div>
          </div>
        )}
      </div>

      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
