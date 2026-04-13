import type { MedalType } from '@/lib/types'

const MEDAL_INFO: Record<MedalType, { name: string; description: string; icon: string }> = {
  first_match: { name: 'First Match', description: 'Log your first match', icon: '⚡' },
  on_a_roll: { name: 'On a Roll', description: 'Log 5 consecutive weeks', icon: '🔥' },
  first_star: { name: 'First Star', description: 'Earn Exceptional or Standout', icon: '⭐' },
  ten_down: { name: 'Ten Down', description: 'Log 10 matches', icon: '🔟' },
  most_improved: { name: 'Most Improved', description: 'Improve over 10 matches', icon: '📈' },
  self_aware: { name: 'Self Aware', description: 'Align with coach 5 times', icon: '🎯' },
}

interface MedalSlotProps {
  medalType: MedalType
  earned: boolean
  progress?: { current: number; target: number } | null
}

export function MedalSlot({ medalType, earned, progress }: MedalSlotProps) {
  const info = MEDAL_INFO[medalType]
  const progressPct = progress ? Math.min(100, (progress.current / progress.target) * 100) : 0

  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-[14px] border transition-all ${
      earned
        ? 'bg-[rgba(200,242,90,0.08)] border-[rgba(200,242,90,0.2)]'
        : 'bg-[#101012] border-white/[0.07]'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
        earned ? 'bg-[rgba(200,242,90,0.15)]' : 'bg-[#202024]'
      }`}>
        {earned ? info.icon : <span className="opacity-30">{info.icon}</span>}
      </div>
      <span className={`text-xs text-center ${earned ? 'text-white/88' : 'text-white/45'}`}>{info.name}</span>
      {!earned && progress && progress.target > 0 && (
        <div className="w-full space-y-1">
          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-[#C8F25A]/40 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[8px] text-white/30 text-center block" style={{ fontFamily: "'DM Mono', monospace" }}>
            {progress.current}/{progress.target}
          </span>
        </div>
      )}
      {earned && (
        <span className="text-[8px] text-[#C8F25A]/60" style={{ fontFamily: "'DM Mono', monospace" }}>EARNED</span>
      )}
      {!earned && !progress && (
        <span className="text-[9px] text-center text-white/22" style={{ fontFamily: "'DM Mono', monospace" }}>
          {info.description}
        </span>
      )}
    </div>
  )
}
