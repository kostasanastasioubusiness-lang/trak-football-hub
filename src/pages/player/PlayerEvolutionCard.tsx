import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Flame, Sprout, Target, Lock, Check } from 'lucide-react'
import { MobileShell, NavBar } from '@/components/trak'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

/**
 * TRAK Player Evolution Card — visual mock (sample data)
 * Style: Minimal Volt base + Hologram tier accents
 * Stats: CONSISTENCY · IMPACT · WORKRATE · TECHNIQUE · SPIRIT
 */

type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Volt' | 'Icon'

const TIERS: Record<Tier, { ring: string; label: string; glow: string }> = {
  Bronze: { ring: 'rgba(205,127,50,0.55)', label: 'rgba(205,127,50,0.85)', glow: 'rgba(205,127,50,0.18)' },
  Silver: { ring: 'rgba(220,220,230,0.55)', label: 'rgba(220,220,230,0.85)', glow: 'rgba(220,220,230,0.16)' },
  Gold:   { ring: 'rgba(245,200,80,0.65)', label: 'rgba(245,200,80,0.95)', glow: 'rgba(245,200,80,0.20)' },
  Volt:   { ring: 'rgba(200,242,90,0.75)', label: '#C8F25A', glow: 'rgba(200,242,90,0.28)' },
  Icon:   { ring: 'rgba(255,255,255,0.85)', label: '#FFFFFF', glow: 'rgba(200,242,90,0.35)' },
}

function tierFromOvr(ovr: number): Tier {
  // OVR is 0..10 averaged then ×10, so 0..100.
  if (ovr >= 92) return 'Icon'
  if (ovr >= 85) return 'Volt'
  if (ovr >= 75) return 'Gold'
  if (ovr >= 65) return 'Silver'
  return 'Bronze'
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Fallback when player has no assessments yet
const FALLBACK_STATS = [
  { key: 'CONSISTENCY', value: 50 },
  { key: 'IMPACT',      value: 50 },
  { key: 'WORKRATE',    value: 50 },
  { key: 'TECHNIQUE',   value: 50 },
  { key: 'SPIRIT',      value: 50 },
]

type EvoState = 'active' | 'done' | 'locked'
type EvoQuest = {
  icon: typeof Flame
  title: string
  desc: string
  progress: number
  target: number
  deadline: string
  reward: string
  state: EvoState
}

/** Derive quest progress from real match + award data */
function computeQuests(
  matches: { computed_rating: number | null; created_at: string }[],
  awardCount: number,
): EvoQuest[] {
  // Sort matches oldest→newest
  const sorted = [...matches].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Quest 1 — On Fire: 3 consecutive matches with computed_rating ≥ 7.0
  let streak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    const r = sorted[i].computed_rating ?? 0
    if (r >= 7.0) streak++
    else break
  }
  const onFireProgress = Math.min(streak, 3)
  const onFireDone = onFireProgress >= 3

  // Quest 2 — Comeback Kid: a match ≥ 8.0 immediately after one ≤ 5.0
  let comebackDone = false
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].computed_rating ?? 0
    const curr = sorted[i].computed_rating ?? 0
    if (prev <= 5.0 && curr >= 8.0) { comebackDone = true; break }
  }
  // Progress: check if previous match was ≤ 5.0 (setup for next match)
  const lastRating = sorted.length > 0 ? (sorted[sorted.length - 1].computed_rating ?? 0) : 0
  const comebackSetup = !comebackDone && lastRating <= 5.0

  // Quest 3 — Coach's Pick: at least 1 recognition award
  const coachPickDone = awardCount > 0

  return [
    {
      icon: Flame,
      title: 'On Fire',
      desc: 'Earn 3 high bands in a row',
      progress: onFireProgress,
      target: 3,
      deadline: onFireDone ? 'Completed' : `${3 - onFireProgress} matches to go`,
      reward: '+2 CONSISTENCY · Tier nudge',
      state: onFireDone ? 'done' : 'active',
    },
    {
      icon: Sprout,
      title: 'Comeback Kid',
      desc: 'Bounce back from a tough match',
      progress: comebackDone ? 1 : 0,
      target: 1,
      deadline: comebackDone ? 'Completed' : comebackSetup ? 'Next match — go for it!' : 'Waiting for setup',
      reward: '+3 SPIRIT',
      state: comebackDone ? 'done' : 'active',
    },
    {
      icon: Target,
      title: "Coach's Pick",
      desc: 'Earn a recognition award from your coach',
      progress: coachPickDone ? 1 : 0,
      target: 1,
      deadline: coachPickDone ? 'Completed' : 'Keep impressing',
      reward: 'Animated tier ring',
      state: coachPickDone ? 'done' : 'active',
    },
  ]
}

export default function PlayerEvolutionCard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [name, setName] = useState('Player')
  const [position, setPosition] = useState('—')
  const [club, setClub] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [stats, setStats] = useState(FALLBACK_STATS)
  const [hasAssessment, setHasAssessment] = useState(false)
  const [evolutions, setEvolutions] = useState<EvoQuest[]>([])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      // 1. Profile + player details + matches (all in parallel)
      const [{ data: profile }, { data: details }, { data: matches }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
        supabase.from('player_details').select('position, current_club, age_group').eq('user_id', user.id).maybeSingle(),
        supabase.from('matches').select('computed_rating, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      if (profile?.full_name) setName(profile.full_name)
      if (details?.position) setPosition(details.position.toUpperCase())
      if (details?.current_club) setClub(details.current_club)
      if (details?.age_group) setAgeGroup(details.age_group)

      // 2. Find this player's squad_player rows (coaches who linked them)
      const { data: squadRows } = await supabase
        .from('squad_players')
        .select('id')
        .eq('linked_player_id', user.id)
      const squadIds = (squadRows ?? []).map(r => r.id)

      // 3. Pull assessments + recognition awards in parallel
      const [assessmentsRes, awardsRes] = await Promise.all([
        squadIds.length > 0
          ? supabase.from('coach_assessments')
              .select('work_rate, tactical, attitude, technical, physical, coachability, created_at')
              .in('squad_player_id', squadIds)
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: null }),
        squadIds.length > 0
          ? supabase.from('recognition_awards')
              .select('id')
              .in('squad_player_id', squadIds)
          : Promise.resolve({ data: null }),
      ])

      const assessments = assessmentsRes.data
      const awardCount = awardsRes.data?.length ?? 0

      // Compute quests from real match + award data
      setEvolutions(computeQuests(matches ?? [], awardCount))

      if (!assessments || assessments.length === 0) return

      // Map coach dimensions → 5 card stats, then scale 1–10 → 0–100
      const n = assessments.length
      const sums = { consistency: 0, impact: 0, workrate: 0, technique: 0, spirit: 0 }
      for (const a of assessments as any[]) {
        const wr = a.work_rate ?? 5
        const tac = a.tactical ?? 5
        const att = a.attitude ?? 5
        const tech = a.technical ?? 5
        const phys = a.physical ?? 5
        const coach = a.coachability ?? 5
        sums.consistency += att
        sums.impact      += tech
        sums.workrate    += wr
        sums.technique   += (tech + tac) / 2
        sums.spirit      += (att + coach) / 2
      }
      const toOvr = (v: number) => Math.round((v / n) * 10)
      setStats([
        { key: 'CONSISTENCY', value: toOvr(sums.consistency) },
        { key: 'IMPACT',      value: toOvr(sums.impact) },
        { key: 'WORKRATE',    value: toOvr(sums.workrate) },
        { key: 'TECHNIQUE',   value: toOvr(sums.technique) },
        { key: 'SPIRIT',      value: toOvr(sums.spirit) },
      ])
      setHasAssessment(true)
    })()
  }, [user])

  const ovr = Math.round(stats.reduce((s, x) => s + x.value, 0) / stats.length)
  const tierName: Tier = hasAssessment ? tierFromOvr(ovr) : 'Bronze'
  const tier = TIERS[tierName]
  const initials = initialsOf(name)

  return (
    <MobileShell>
      {/* Top bar */}
      <div className="pt-5 pb-3 flex items-center justify-center">
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
          }}
        >
          EVOLUTION CARD
        </span>
      </div>

      {/* THE CARD */}
      <div className="flex justify-center mt-2">
        <div
          className="relative"
          style={{
            width: '100%',
            maxWidth: 360,
            aspectRatio: '3 / 4',
            borderRadius: 24,
            padding: 2,
            background: `conic-gradient(from 140deg, ${tier.ring}, rgba(255,255,255,0.04) 35%, ${tier.ring} 65%, rgba(255,255,255,0.04) 95%)`,
            boxShadow: `0 0 60px ${tier.glow}, 0 20px 60px rgba(0,0,0,0.6)`,
          }}
        >
          <div
            className="relative w-full h-full overflow-hidden flex flex-col"
            style={{
              borderRadius: 22,
              background:
                'radial-gradient(120% 80% at 50% 0%, #18181C 0%, #101012 55%, #0A0A0B 100%)',
              padding: 22,
            }}
          >
            {/* Volt corner glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: 0,
                background:
                  'radial-gradient(circle at 100% 100%, rgba(200,242,90,0.10), transparent 55%)',
              }}
            />

            {/* Top row: OVR + Tier */}
            <div className="relative flex items-start justify-between">
              <div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 200, fontSize: 64, lineHeight: 0.9,
                    letterSpacing: '-0.04em', color: '#FFFFFF',
                  }}
                >
                  {ovr}
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  {position}{ageGroup ? ` · ${ageGroup}` : ''}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span
                  className="inline-flex items-center px-2 py-0.5"
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${tier.ring}`,
                    background: 'rgba(255,255,255,0.02)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: tier.label,
                  }}
                >
                  {tierName} TIER
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 8, letterSpacing: '0.22em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                  }}
                >
                  TRAK · 25/26
                </span>
              </div>
            </div>

            {/* Initials block */}
            <div className="relative mt-5 flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: '#0A0A0B',
                  border: '1px solid rgba(200,242,90,0.18)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300, fontSize: 22, color: '#C8F25A',
                }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div
                  className="truncate"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400, fontSize: 18,
                    letterSpacing: '-0.02em', color: '#FFFFFF',
                  }}
                >
                  {name}
                </div>
                <div
                  className="truncate"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {club || 'Unaffiliated'}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div
              className="relative my-4"
              style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,242,90,0.35), transparent)' }}
            />

            {/* Stats */}
            <div className="relative flex-1 flex flex-col gap-2.5">
              {stats.map((s) => (
                <StatRow key={s.key} label={s.key} value={s.value} />
              ))}
            </div>

            {/* Footer */}
            <div
              className="relative mt-4 flex items-center justify-between"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
              }}
            >
              <span>SERIES 01</span>
              <span>{evolutions.some(e => e.state === 'done') ? '· EVOLVING ·' : '· ACTIVE ·'}</span>
              <span>TRAK · 25/26</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evolutions */}
      <div className="mt-7 mb-6">
        <div className="flex items-end justify-between mb-3">
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.02em', color: '#FFFFFF',
            }}
          >
            Active Evolutions
          </h2>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            }}
          >
            SERIES 01
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {evolutions.map((e) => (
            <EvoRow key={e.title} {...e} />
          ))}
        </div>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  // Volt gradient bar with subtle stop
  const bar = `linear-gradient(90deg, rgba(200,242,90,0.7), #C8F25A)`
  return (
    <div className="flex items-center gap-3">
      <div
        style={{
          width: 84,
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        {label}
      </div>
      <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bar }} />
      </div>
      <div
        style={{
          width: 28, textAlign: 'right',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400, fontSize: 14,
          color: '#FFFFFF',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function EvoRow({
  icon: Icon, title, desc, progress, target, deadline, reward, state,
}: {
  icon: typeof Flame
  title: string
  desc: string
  progress: number
  target: number
  deadline: string
  reward: string
  state: 'active' | 'done' | 'locked'
}) {
  const pct = Math.round((progress / target) * 100)
  const done = state === 'done'
  const locked = state === 'locked'

  return (
    <div
      className="relative p-4"
      style={{
        borderRadius: 14,
        background: '#101012',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: done ? 'rgba(200,242,90,0.12)' : '#0A0A0B',
            border: `1px solid ${done ? 'rgba(200,242,90,0.35)' : 'rgba(255,255,255,0.08)'}`,
            color: done ? '#C8F25A' : locked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
          }}
        >
          {locked ? <Lock size={15} /> : done ? <Check size={16} /> : <Icon size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500, fontSize: 14,
                color: '#FFFFFF', letterSpacing: '-0.01em',
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: done ? '#C8F25A' : 'rgba(255,255,255,0.4)',
              }}
            >
              {deadline}
            </span>
          </div>

          <p
            className="mt-0.5"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, color: 'rgba(255,255,255,0.55)',
              letterSpacing: '-0.01em',
            }}
          >
            {desc}
          </p>

          {/* Progress */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: done
                    ? 'linear-gradient(90deg, rgba(200,242,90,0.6), #C8F25A)'
                    : 'linear-gradient(90deg, rgba(200,242,90,0.4), rgba(200,242,90,0.85))',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.45)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {progress}/{target}
            </span>
          </div>

          {/* Reward */}
          <div
            className="mt-2"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(200,242,90,0.75)',
            }}
          >
            REWARD · {reward}
          </div>
        </div>
      </div>
    </div>
  )
}