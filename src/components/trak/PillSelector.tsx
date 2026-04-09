interface PillSelectorProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export function PillSelector({ options, value, onChange, label }: PillSelectorProps) {
  return (
    <div className="space-y-2">
      {label && (
        <span
          className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-[10px] text-sm transition-colors ${
              value === opt.value
                ? 'border-[#C8F25A] bg-[rgba(200,242,90,0.08)] text-[rgba(255,255,255,0.88)]'
                : 'border-white/[0.07] bg-[#202024] text-[rgba(255,255,255,0.45)]'
            } border`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
