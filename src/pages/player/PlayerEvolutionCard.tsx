import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Sprout, Target, Lock, Check } from 'lucide-react'
import { MobileShell } from '@/components/trak'

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

// Sample player
const PLAYER = {
  initials: 'AK',
  name: 'Andreas Kostas',
  position: 'MID',
  club: 'Panetolikos FC',
  age: 'U16',
  tier: 'Gold' as Tier,
  ovr: 78,
  stats: [
    { key: 'CONSISTENCY', value: 82 },
    { key: 'IMPACT',      value: 74 },
    { key: 'WORKRATE',    value: 81 },
    { key: 'TECHNIQUE',   value: 76 },
    { key: 'SPIRIT',      value: 79 },
  ],
}

const EVOLUTIONS = [
  {
    icon: Flame,
    title: 'On Fire',
    desc: 'Earn 3 high bands in a row',
    progress: 2, target: 3,
    deadline: '4 matches left',
    reward: '+2 CONSISTENCY · Tier nudge',
    state: 'active' as const,
  },
  {
    icon: Sprout,
    title: 'Comeback Kid',
    desc: 'Bounce back from a low band',
    progress: 0, target: 1,
    deadline: 'Next match',
    reward: '+3 SPIRIT',
    state: 'active' as const,
  },
  {
    icon: Target,
    title: "Coach's Pick",
    desc: 'Earn a Standout from your coach',
    progress: 1, target: 1,
    deadline: 'Completed',
    reward: 'Animated tier ring',
    state: 'done' as const,
  },
]

export default function PlayerEvolutionCard() {
  const navigate = useNavigate()
  const tier = TIERS[PLAYER.tier]

  return (
    <MobileShell>
      {/* Top bar */}
      <div className="pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: '#101012', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.88)',
          }}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
          }}
        >
          EVOLUTION CARD
        </span>
        <div style={{ width: 36 }} />
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
                  {PLAYER.ovr}
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  {PLAYER.position} · {PLAYER.age}
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
                  {PLAYER.tier} TIER
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
                {PLAYER.initials}
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
                  {PLAYER.name}
                </div>
                <div
                  className="truncate"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {PLAYER.club}
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
              {PLAYER.stats.map((s) => (
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
              <span>· EVOLVING ·</span>
              <span>NO. 047</span>
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
          {EVOLUTIONS.map((e) => (
            <EvoRow key={e.title} {...e} />
          ))}
        </div>
      </div>
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