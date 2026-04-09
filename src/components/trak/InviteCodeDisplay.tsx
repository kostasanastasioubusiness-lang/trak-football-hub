import { useState } from 'react'

interface InviteCodeDisplayProps {
  code: string
  label?: string
}

export function InviteCodeDisplay({ code, label }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {label && (
        <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "'DM Mono', monospace" }}>
          {label}
        </span>
      )}
      <p
        className="text-[32px] tracking-wider text-[rgba(255,255,255,0.88)]"
        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
      >
        {code}
      </p>
      <button
        onClick={handleCopy}
        className="px-6 py-2 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-[rgba(255,255,255,0.45)] transition-colors hover:text-[rgba(255,255,255,0.88)]"
      >
        {copied ? 'Copied!' : 'Copy Code'}
      </button>
    </div>
  )
}
