import type { MedalType } from '@/lib/types'

const MEDAL_INFO: Record<MedalType, { name: string; description: string }> = {
  first_match: { name: 'First Match', description: 'Log your first match' },
  on_a_roll: { name: 'On a Roll', description: 'Log matches in 5 consecutive weeks' },
  first_star: { name: 'First Star', description: 'Earn Exceptional or Standout' },
  ten_down: { name: 'Ten Down', description: 'Log 10 matches' },
  most_improved: { name: 'Most Improved', description: 'Improve over a 10-match window' },
  self_aware: { name: 'Self Aware', description: 'Self-rating aligns with coach 5 times' },
}

export function MedalSlot({ medalType, earned }: { medalType: MedalType; earned: boolean; unlockedAt?: string }) {
  const info = MEDAL_INFO[medalType]
  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-[14px] border ${
      earned
        ? 'bg-[rgba(200,242,90,0.08)] border-[rgba(200,242,90,0.2)]'
        : 'bg-[#101012] border-white/[0.07] opacity-40'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        earned ? 'bg-[rgba(200,242,90,0.15)]' : 'bg-[#202024]'
      }`}>
        <span className="text-xl">{earned ? '\u2605' : '\u25CB'}</span>
      </div>
      <span className="text-xs text-center text-[rgba(255,255,255,0.88)]">{info.name}</span>
      <span className="text-[9px] text-center text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "'DM Mono', monospace" }}>
        {info.description}
      </span>
    </div>
  )
}
