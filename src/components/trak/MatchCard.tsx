import { BandPill } from './BandPill'
import { MetadataLabel } from './MetadataLabel'
import { TrakCard } from './TrakCard'
import type { BandType } from '@/lib/types'

interface MatchCardProps {
  opponent: string
  date: string
  scoreUs: number
  scoreThem: number
  band: BandType
  onClick?: () => void
}

export function MatchCard({ opponent, date, scoreUs, scoreThem, band, onClick }: MatchCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return (
    <TrakCard>
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[rgba(255,255,255,0.88)]">vs {opponent}</p>
            <MetadataLabel text={`${formattedDate} \u00b7 ${scoreUs}-${scoreThem}`} />
          </div>
          <BandPill band={band} />
        </div>
      </button>
    </TrakCard>
  )
}
