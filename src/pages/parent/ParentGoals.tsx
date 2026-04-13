import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar } from '@/components/trak'

export default function ParentGoals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<any[]>([])
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('player_parent_links').select('player_user_id').eq('parent_user_id', user.id).then(async ({ data: links }) => {
      if (!links?.length) { setLoading(false); return }
      const childId = links[0].player_user_id

      // Fetch child name (first name only)
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', childId).single()
      if (profile) setChildName(profile.full_name?.split(' ')[0] || 'Child')

      const { data } = await supabase.from('player_goals').select('*').eq('user_id', childId)
      setGoals(data || [])
      setLoading(false)
    })
  }, [user])

  const getCategoryStyle = (category: string) => {
    if (category === 'performance') return { color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)' }
    if (category === 'consistency') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)' }
    if (category === 'development') return { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' }
    return { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)' }
  }

  return (
    <MobileShell>
      <div className="pt-3 pb-4">

        {/* ── Topbar ── */}
        <div className="flex items-center gap-2 mb-5 pt-1">
          <button
            onClick={() => navigate('/parent/home')}
            className="text-white/45 text-sm"
          >
            &larr;
          </button>
          <span
            className="text-[15px] font-medium text-white/88"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {childName || 'Child'} &middot; Goals
          </span>
        </div>

        {/* ── Read-only notice card ── */}
        <div
          className="rounded-[14px] p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p
            className="text-[11px] text-white/35 leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            You can view {childName || 'your child'}&apos;s goals. Only {childName ? `${childName}` : 'they'} can create or edit them.
          </p>
        </div>

        {/* ── Goal cards ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 rounded-[14px] bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[28px] mb-2">&#127919;</p>
            <p
              className="text-sm text-white/45"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              No goals set yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {goals.map(g => {
              const cat = g.category || 'personal'
              const style = getCategoryStyle(cat)
              const progress = g.target_value ? Math.min(((g.current_value || 0) / g.target_value) * 100, 100) : 0

              return (
                <div
                  key={g.id}
                  className="rounded-[14px] p-4"
                  style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  {/* Category badge */}
                  <span
                    className="inline-flex items-center h-4 px-2 rounded-full text-[8px] font-medium tracking-[0.06em] uppercase mb-2"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      background: style.bg,
                      color: style.color,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {cat}
                  </span>

                  {/* Title */}
                  <p
                    className="text-[13px] font-medium text-white/88 mb-2"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {g.goal_type || g.title || 'Goal'}
                  </p>

                  {/* Progress bar + percentage */}
                  {g.target_value && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[9px] text-white/22"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {Math.round(progress)}%
                        </span>
                        <span
                          className="text-[9px] text-white/22"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          Target: {g.target_value}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#202024] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C8F25A] transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  )}

                  {/* Target date */}
                  {g.target_date && (
                    <p
                      className="text-[9px] text-white/22 mt-2 tracking-[0.04em]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      Due: {new Date(g.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NavBar role="parent" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
