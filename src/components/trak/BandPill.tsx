import { BANDS, type BandType } from '@/lib/types'

export function BandPill({ band }: { band: BandType }) {
  const config = BANDS.find(b => b.word.toLowerCase() === band) ?? BANDS[BANDS.length - 1]
  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full"
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        letterSpacing: '-0.03em',
      }}
    >
      {config.word}
    </span>
  )
}
