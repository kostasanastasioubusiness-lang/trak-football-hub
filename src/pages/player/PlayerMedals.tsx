import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'
import { checkMedalEligibility } from '@/lib/medals'
import { scoreToBand } from '@/lib/rating-engine'
import type { MedalType } from '@/lib/types'

const ALL_MEDALS: { type: MedalType; name: string; icon: string; desc: string }[] = [
  { type: 'first_match', name: 'First Match', icon: '⚽', desc: 'Log your first match' },
  { type: 'on_a_roll', name: 'On a Roll', icon: '🔥', desc: '5 consecutive weeks with a match' },
  { type: 'first_star', name: 'First Star', icon: '⭐', desc: 'First Standout performance' },
  { type: 'ten_down', name: 'Ten Down', icon: '🔟', desc: '10 matches logged' },
  { type: 'most_improved', name: 'Most Improved', icon: '📈', desc: 'Band distribution improves over 10 matches' },
  { type: 'self_aware', name: 'Self Aware', icon: '🪞', desc: 'Your self-rating aligns with coach assessment 5 times' },
]

const AWARD_LABELS: Record<string, { label: string; emoji: string }> = {
  player_of_week:  { label: 'Player of the Week',  emoji: '🏆' },
  player_of_month: { label: 'Player of the Month', emoji: '🥇' },
  most_improved:   { label: 'Most Improved',        emoji: '📈' },
  top_scorer:      { label: 'Top Scorer',           emoji: '⚽' },
}

export default function PlayerMedals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [earned, setEarned] = useState<Set<MedalType>>(new Set())
  const [latestMedal, setLatestMedal] = useState<string | null>(null)
  const [awards, setAwards] = useState<any[]>([])
  const [awardCoachNames, setAwardCoachNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    supabase.from('matches').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        // Map DB fields to what checkMedalEligibility expects
        const mapped = data.map(m => ({
          ...m,
          band: scoreToBand(m.computed_rating || 6.5),
          logged_at: m.created_at,
        }))
        const eligible = checkMedalEligibility(mapped as any, [])
        setEarned(new Set(eligible))
        if (eligible.length > 0) {
          const latest = ALL_MEDALS.find(m => m.type === eligible[eligible.length - 1])
          if (latest) setLatestMedal(latest.name)
        }
      })
    // Fetch coach recognition awards
    supabase.from('squad_players').select('id').eq('linked_player_id', user.id)
      .then(async ({ data: squadRows }) => {
        if (!squadRows?.length) return
        const { data: awardData } = await supabase.from('recognition_awards')
          .select('*').in('squad_player_id', squadRows.map((r: any) => r.id))
          .select('*')
          .in('squad_player_id', squadRows.map((r: any) => r.id))
          .order('created_at', { ascending: false })
        if (awardData?.length) {
          setAwards(awardData)
          const coachIds = [...new Set(awardData.map((a: any) => a.coach_user_id))]
          const { data: coaches } = await supabase.from('profiles').select('user_id, full_name').in('user_id', coachIds as string[])
          if (coaches) {
            const map: Record<string, string> = {}
            coaches.forEach((c: any) => { map[c.user_id] = c.full_name })
            setAwardCoachNames(map)
          }
        }
      })
  }, [user])

  return (
    <MobileShell>
      <div className="flex items-center justify-between pt-3 pb-2 border-b border-white/[0.07]">
        <span className="text-[16px] font-medium text-white/88" style={{ fontFamily: "'DM Sans', sans-serif" }}>Medals</span>
      </div>

      <div className="pt-3.5 pb-4 space-y-4">
        {/* Coach awards */}
        {awards.length > 0 && (
          <div className="space-y-2">
            <MetadataLabel text="COACH AWARDS" />
            {awards.map(a => {
              const awardInfo = AWARD_LABELS[a.award_type] || { label: a.award_type, emoji: '🏆' }
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-[14px] p-4"
                  style={{ background: 'rgba(200,242,90,0.06)', border: '1px solid rgba(200,242,90,0.18)' }}>
                  <span className="text-2xl flex-shrink-0">{awardInfo.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#C8F25A]">{awardInfo.label}</p>
                    {a.awarded_for && <p className="text-[10px] text-white/45 mt-0.5">{a.awarded_for}</p>}
                    <p className="text-[9px] text-white/22 mt-0.5 tracking-[0.04em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      From {awardCoachNames[a.coach_user_id] || 'Coach'}
                    </p>
                    {a.note && <p className="text-[11px] text-white/45 mt-1 italic">"{a.note}"</p>}
                  </div>
                  <span className="text-[9px] text-white/22 flex-shrink-0"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Latest medal banner */}
        {latestMedal && (
          <div className="flex items-center gap-3.5 p-4 rounded-[18px]"
            style={{ background: 'rgba(200,242,90,0.06)', border: '1px solid rgba(200,242,90,0.18)' }}>
            <span className="text-[32px]">⭐</span>
            <div>
              <p className="text-[15px] font-semibold text-[#C8F25A]">{latestMedal} unlocked!</p>
              <p className="text-[11px] text-white/45 mt-[3px]">Keep it up.</p>
            </div>
          </div>
        )}

        {/* Medal grid — 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          {ALL_MEDALS.map(m => {
            const isEarned = earned.has(m.type)
            return (
              <div key={m.type} className={`rounded-[14px] p-3.5 pt-4 text-center border ${
                isEarned
                  ? 'bg-[rgba(200,242,90,0.06)] border-[rgba(200,242,90,0.18)]'
                  : 'bg-[#101012] border-white/[0.07]'
              }`}>
                <span className={`text-2xl block mb-1.5 ${!isEarned ? 'grayscale opacity-25' : ''}`}>{m.icon}</span>
                <span className={`text-[10px] font-medium leading-tight block ${isEarned ? 'text-[#C8F25A]' : 'text-white/22'}`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.name}</span>
              </div>
            )
          })}
        </div>

        {/* About medals card */}
        <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
          <MetadataLabel text="ABOUT MEDALS" />
          <div className="mt-2.5 space-y-1.5 text-[11px] text-white/45 leading-relaxed">
            {ALL_MEDALS.map(m => (
              <p key={m.type}>
                <span className="font-medium text-white/88">{m.name}</span> — {m.desc}
              </p>
            ))}
          </div>
        </div>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
