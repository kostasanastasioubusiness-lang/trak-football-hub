import { TrakCard } from './TrakCard'
import { MetadataLabel } from './MetadataLabel'
import type { GoalCategory, ProgressLevel } from '@/lib/types'

interface GoalCardProps {
  title: string
  category: GoalCategory
  targetNumber: number | null
  currentNumber: number
  progressLevel: ProgressLevel | null
  isAutoTracked: boolean
  onTap?: () => void
}

export function GoalCard({ title, category, targetNumber, currentNumber, progressLevel, isAutoTracked, onTap }: GoalCardProps) {
  const progress = targetNumber ? Math.min((currentNumber / targetNumber) * 100, 100) : null

  return (
    <TrakCard>
      <button onClick={onTap} className="w-full text-left space-y-2">
        <p className="text-sm text-[rgba(255,255,255,0.88)]">{title}</p>
        <MetadataLabel text={category} />
        {progress !== null && (
          <div className="h-1.5 rounded-full bg-[#202024] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C8F25A] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {progressLevel && !isAutoTracked && (
          <span className="text-xs text-[rgba(255,255,255,0.45)]">
            {progressLevel.replace(/_/g, ' ')}
          </span>
        )}
      </button>
    </TrakCard>
  )
}
