import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'

interface Alert {
  id: string
  type: 'new_match' | 'coach_assessment'
  title: string
  description: string
  date: string
  isNew: boolean
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

      // Fetch recent matches
      const { data: matches } = await supabase.from('matches')
        .select('id, team_score, opponent_score, competition, computed_rating, created_at, opponent')
        .eq('user_id', childId).order('created_at', { ascending: false }).limit(20)

      if (matches) {
        matches.forEach(m => {
          const matchDate = new Date(m.created_at)
          generated.push({
            id: `match-${m.id}`,
            type: 'new_match',
            title: 'Match logged',
            description: `vs ${m.opponent || m.competition || 'Unknown'} \u00B7 ${m.team_score}\u2013${m.opponent_score}`,
            date: m.created_at,
            isNew: matchDate > cutoff,
          })
        })
      }

      // Fetch recent coach assessments via squad_players link
      const { data: squadRows } = await supabase.from('squad_players')
        .select('id').eq('linked_player_id', childId)
      if (squadRows?.length) {
        const { data: assessments } = await supabase.from('coach_assessments')
          .select('id, created_at, coach_user_id, work_rate, tactical, attitude, technical, physical, coachability')
          .in('squad_player_id', squadRows.map((r: any) => r.id))
          .order('created_at', { ascending: false })
          .limit(10)

        if (assessments) {
          for (const a of assessments) {
            const aDate = new Date(a.created_at)
            const avgScore = (a.work_rate + a.tactical + a.attitude + a.technical + a.physical + a.coachability) / 6
            const { data: coachProfile } = await supabase.from('profiles').select('full_name').eq('user_id', a.coach_user_id).single()
            generated.push({
              id: `assess-${a.id}`,
              type: 'coach_assessment',
              title: 'New coach assessment',
              description: `by ${coachProfile?.full_name || 'Coach'} \u00B7 ${scoreToBand(avgScore).charAt(0).toUpperCase() + scoreToBand(avgScore).slice(1)}`,
              date: a.created_at,
              isNew: aDate > cutoff,
            })
          }
        }
      }

      // Sort all alerts by date descending
      generated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setAlerts(generated)
      setLoading(false)
    })
  }, [user])

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffH < 1) return 'Just now'
    if (diffH < 24) return `${diffH}h ago`
    const diffD = Math.floor(diffH / 24)
    if (diffD === 1) return 'Yesterday'
    if (diffD < 7) return `${diffD}d ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <MobileShell>
      <div className="pt-3 pb-4">

        {/* ── Topbar ── */}
        <div className="flex items-center gap-2 mb-5 pt-1">
          <span
            className="text-[15px] font-medium text-white/88"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Alerts
          </span>
        </div>

        {/* ── Alert list ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-[10px] bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[28px] mb-2">&#128276;</p>
            <p
              className="text-sm text-white/45"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              No alerts yet
            </p>
            <p
              className="text-xs text-white/22 mt-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Match updates will appear here
            </p>
          </div>
        ) : (
          <div>
            {alerts.map(a => (
              <div
                key={a.id}
                className={`flex items-start gap-3 py-[14px] border-b border-white/[0.04] last:border-b-0${!a.isNew ? ' opacity-50' : ''}`}
              >
                {/* Status dot: amber for unread, gray for read */}
                <div className="mt-1.5 flex-shrink-0">
                  <div
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ backgroundColor: a.isNew ? '#fb923c' : 'rgba(255,255,255,0.2)' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <p
                    className="text-[13px] font-medium text-white/88"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {a.title}
                  </p>
                  {/* Description */}
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.45)' }}
                  >
                    {a.description}
                  </p>
                  {/* Timestamp in DM Mono 9px */}
                  <p
                    className="text-[9px] text-white/22 mt-1 tracking-[0.04em]"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {formatTimestamp(a.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
