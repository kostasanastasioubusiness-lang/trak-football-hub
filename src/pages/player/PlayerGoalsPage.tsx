import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  performance: { bg: 'rgba(200,242,90,0.12)', text: '#C8F25A' },
  consistency: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
  development: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.45)' },
  personal: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa' },
}

export default function PlayerGoalsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<any[]>([])
  const [matchStats, setMatchStats] = useState({ matches: 0, goals: 0, assists: 0, minutes: 0 })

  useEffect(() => {
    if (!user) return
    supabase.from('player_goals').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setGoals(data || []))
    supabase.from('matches').select('goals, assists, minutes_played').eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return
        setMatchStats({
          matches: data.length,
          goals: data.reduce((s, m) => s + (m.goals || 0), 0),
          assists: data.reduce((s, m) => s + (m.assists || 0), 0),
          minutes: data.reduce((s, m) => s + (m.minutes_played || 0), 0),
        })
      })
  }, [user])

  const getProgress = (goal: any) => {
    const target = goal.target_value || 1
    let current = 0
    switch (goal.goal_type) {
      case 'matches_logged': current = matchStats.matches; break
      case 'goals_scored': current = matchStats.goals; break
      case 'assists_made': current = matchStats.assists; break
      case 'minutes_played': current = matchStats.minutes; break
      case 'reach_band': current = 0; break
      default: current = 0
    }
    const pct = Math.min(100, Math.round((current / target) * 100))
    return { current, target, pct }
  }

  const getCategoryLabel = (goalType: string) => {
    if (goalType === 'goals_scored' || goalType === 'assists_made') return 'performance'
    if (goalType === 'matches_logged' || goalType === 'minutes_played') return 'consistency'
    if (goalType === 'reach_band') return 'development'
    return 'personal'
  }

  const getGoalTitle = (goal: any) => {
    switch (goal.goal_type) {
      case 'matches_logged': return `Log ${goal.target_value} matches`
      case 'goals_scored': return `Score ${goal.target_value} goals`
      case 'assists_made': return `Get ${goal.target_value} assists`
      case 'minutes_played': return `Play ${goal.target_value} minutes`
      case 'reach_band': return 'Reach Standout band'
      default: return goal.goal_type
    }
  }

  return (
    <MobileShell>
      {/* Topbar */}
      <div className="flex items-center justify-between pt-3 pb-2 border-b border-white/[0.07]">
        <span className="text-[16px] font-medium text-white/88" style={{ fontFamily: "'DM Sans', sans-serif" }}>Goals</span>
        <button onClick={() => navigate('/player/goals/add')}
          className="w-8 h-8 rounded-[9px] bg-[#C8F25A] flex items-center justify-center text-black text-lg font-bold"
          style={{ boxShadow: '0 2px 8px rgba(200,242,90,0.2)' }}>+</button>
      </div>

      <div className="pt-3.5 pb-4 space-y-2.5">
        {goals.map(g => {
          const { current, target, pct } = getProgress(g)
          const cat = getCategoryLabel(g.goal_type)
          const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.personal
          const isAutoTracked = ['matches_logged', 'goals_scored', 'assists_made', 'minutes_played'].includes(g.goal_type)

          return (
            <div key={g.id} className="rounded-[18px] p-[14px_16px] border border-white/[0.07]" style={{ background: '#101012' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="inline-flex items-center h-5 px-2 rounded-[5px] text-[9px] font-medium tracking-[0.05em] uppercase mb-1.5"
                    style={{ fontFamily: "'DM Mono', monospace", background: colors.bg, color: colors.text }}>
                    {cat}
                  </span>
                  <p className="text-[13px] font-medium text-white/88">{getGoalTitle(g)}</p>
                </div>
                <span className="text-[10px] font-medium text-[#C8F25A]" style={{ fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
              </div>
              <div className="h-[2px] rounded-full bg-white/[0.07] overflow-hidden my-2.5">
                <div className="h-full rounded-full bg-[#C8F25A] transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/22 tracking-[0.04em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {current} of {target}
                </span>
                {isAutoTracked && (
                  <span className="text-[9px] text-[#4ade80] tracking-[0.04em]" style={{ fontFamily: "'DM Mono', monospace" }}>↑ auto-tracked</span>
                )}
              </div>
            </div>
          )
        })}

        {/* Add goal CTA */}
        <button onClick={() => navigate('/player/goals/add')}
          className="w-full rounded-[18px] py-6 border border-dashed border-white/[0.08] bg-white/[0.02] text-center active:scale-[0.98] transition-transform">
          <span className="text-2xl block mb-2">🎯</span>
          <span className="text-[13px] font-medium text-white/45 block">Add a goal</span>
          <span className="text-[11px] text-white/22 block mt-1">What do you want to achieve this season?</span>
        </button>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
