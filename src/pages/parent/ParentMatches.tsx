import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar } from '@/components/trak'
import { BANDS } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

const SERIF = "'Fraunces', Georgia, serif"
const SANS = "'DM Sans', sans-serif"
const MONO = "'DM Mono', monospace"

export default function ParentMatches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState<any[]>([])
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'W' | 'L' | 'D'>('all')

  useEffect(() => {
    if (!user) return
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) { setLoading(false); return }
      const childId = links[0].player_user_id

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', childId).single()
      if (profile) setChildName(profile.full_name?.split(' ')[0] || 'Child')

      const { data } = await supabase.from('matches')
        .select('id, team_score, opponent_score, competition, venue, minutes_played, computed_rating, created_at, position, opponent, goals, assists')
        .eq('user_id', childId).order('created_at', { ascending: false })
      setMatches(data || [])
      setLoading(false)
    })
  }, [user])

  const filtered = matches.filter(m => {
    if (filter === 'all') return true
    const r = m.team_score > m.opponent_score ? 'W' : m.team_score < m.opponent_score ? 'L' : 'D'
    return r === filter
  })

  const lead = filtered[0]
  const rest = filtered.slice(1)

  return (
    <MobileShell>
      <div className="pt-4 pb-6">

        {/* ── Section masthead ── */}
        <div className="border-b-2 border-white/[0.88] pb-2 mb-3">
          <p className="text-[9px] tracking-[0.22em] uppercase text-white/45 mb-1" style={{ fontFamily: MONO }}>
            The Trak Times &middot; Section B
          </p>
          <h1
            className="text-[34px] leading-[0.95] text-white/95"
            style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.03em', fontStyle: 'italic' }}
          >
            Match Desk
          </h1>
          <p className="text-[10px] tracking-[0.16em] uppercase text-white/45 mt-1.5" style={{ fontFamily: MONO }}>
            {childName ? `${childName}'s reports` : 'Match reports'} &middot; {matches.length} filed
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-1 mb-5">
          {(['all', 'W', 'D', 'L'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 text-[10px] tracking-[0.14em] uppercase border transition-colors"
              style={{
                fontFamily: MONO,
                fontWeight: 500,
                color: filter === f ? '#0A0A0B' : 'rgba(255,255,255,0.55)',
                background: filter === f ? '#C8F25A' : 'transparent',
                borderColor: filter === f ? '#C8F25A' : 'rgba(255,255,255,0.12)',
              }}
            >
              {f === 'all' ? 'All' : f === 'W' ? 'Wins' : f === 'D' ? 'Draws' : 'Losses'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/[0.04] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border-y border-white/[0.08]">
            <p className="text-[10px] tracking-[0.18em] uppercase text-white/45 mb-2" style={{ fontFamily: MONO }}>
              Press Quiet
            </p>
            <p className="text-[18px] leading-[1.3] text-white/75" style={{ fontFamily: SERIF, fontStyle: 'italic' }}>
              No reports filed in this section
            </p>
          </div>
        ) : (
          <>
            {/* Lead story */}
            {lead && <LeadStory match={lead} childName={childName} />}

            {/* Rest as feed */}
            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-3 mt-6 mb-3">
                  <span className="text-[10px] tracking-[0.22em] uppercase text-white/65" style={{ fontFamily: MONO, fontWeight: 500 }}>
                    Earlier reports
                  </span>
                  <div className="flex-1 h-px bg-white/[0.12]" />
                </div>
                <div className="space-y-5">
                  {rest.map(m => <FeedStory key={m.id} match={m} childName={childName} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}

function buildHeadline(m: any, childName: string) {
  const r = m.team_score > m.opponent_score ? 'win' : m.team_score < m.opponent_score ? 'loss' : 'draw'
  if (m.goals >= 2) return `${childName} bags brace in ${m.team_score}\u2013${m.opponent_score} ${r}`
  if (m.goals === 1 && r === 'win') return `${childName} on target in ${m.team_score}\u2013${m.opponent_score} victory`
  if (r === 'win') return `Side claim ${m.team_score}\u2013${m.opponent_score} win over ${m.opponent || 'opponents'}`
  if (r === 'draw') return `${m.team_score}\u2013${m.opponent_score} stalemate with ${m.opponent || 'opponents'}`
  return `${m.team_score}\u2013${m.opponent_score} reverse against ${m.opponent || 'opponents'}`
}

function LeadStory({ match: m, childName }: { match: any; childName: string }) {
  const band = scoreToBand(m.computed_rating || 6.5)
  const cfg = BANDS.find(b => b.word.toLowerCase() === band)!
  const date = new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <article className="pb-6 border-b border-white/[0.12]">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-1.5 h-1.5 bg-[#C8F25A]" />
        <span className="text-[10px] tracking-[0.22em] uppercase text-[#C8F25A]" style={{ fontFamily: MONO, fontWeight: 500 }}>
          Lead report
        </span>
      </div>
      <h2 className="text-[26px] leading-[1.05] text-white/95 mb-2" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {buildHeadline(m, childName || 'Player')}
      </h2>
      <p className="text-[14px] leading-[1.45] text-white/65 mb-3" style={{ fontFamily: SERIF, fontWeight: 300 }}>
        Played {m.minutes_played || 90} minutes{m.position ? ` at ${m.position}` : ''}{m.goals ? `, scoring ${m.goals}` : ''}{m.assists ? ` with ${m.assists} assist${m.assists > 1 ? 's' : ''}` : ''}.
        Coaches rated the showing <span style={{ color: cfg.color }}>{cfg.word.toLowerCase()}</span>.
      </p>
      <p className="text-[10px] tracking-[0.14em] uppercase text-white/45" style={{ fontFamily: MONO }}>
        {date} &middot; {m.competition || 'Match'} &middot; {m.venue || 'Venue'}
      </p>
    </article>
  )
}

function FeedStory({ match: m, childName }: { match: any; childName: string }) {
  const band = scoreToBand(m.computed_rating || 6.5)
  const cfg = BANDS.find(b => b.word.toLowerCase() === band)!
  const r = m.team_score > m.opponent_score ? 'W' : m.team_score < m.opponent_score ? 'L' : 'D'
  return (
    <article className="flex gap-3">
      <div className="flex-shrink-0 w-12 text-center pt-0.5">
        <p className="text-[24px] leading-none text-white/85" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {m.team_score}
        </p>
        <p className="text-[10px] tracking-[0.14em] uppercase mt-0.5" style={{ fontFamily: MONO, color: r === 'W' ? '#C8F25A' : r === 'L' ? '#fb923c' : 'rgba(255,255,255,0.45)' }}>
          {r}
        </p>
        <p className="text-[24px] leading-none text-white/45 mt-0.5" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {m.opponent_score}
        </p>
      </div>
      <div className="flex-1 min-w-0 border-l border-white/[0.1] pl-3">
        <p className="text-[9px] tracking-[0.18em] uppercase mb-1" style={{ fontFamily: MONO, color: cfg.color }}>
          {cfg.word}
        </p>
        <h3 className="text-[15px] leading-[1.25] text-white/85 mb-1.5" style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: '-0.01em' }}>
          {buildHeadline(m, childName || 'Player')}
        </h3>
        <p className="text-[10px] tracking-[0.14em] uppercase text-white/30" style={{ fontFamily: MONO }}>
          {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} &middot; {m.competition || 'Match'}
          {m.goals ? ` \u00B7 ${m.goals}G` : ''}
          {m.assists ? ` ${m.assists}A` : ''}
        </p>
      </div>
    </article>
  )
}
