import { BANDS } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

interface SliderInputProps {
  label: string
  value: number
  onChange: (value: number) => void
}

export function SliderInput({ label, value, onChange }: SliderInputProps) {
  const band = scoreToBand(value)
  const config = BANDS.find(b => b.word.toLowerCase() === band)!

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "'DM Mono', monospace" }}>
          {label}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${config.color} ${(value - 1) * 11.1}%, #202024 ${(value - 1) * 11.1}%)`,
        }}
      />
    </div>
  )
}
