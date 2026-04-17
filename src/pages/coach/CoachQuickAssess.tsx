import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { PLAYERS, BAND_COLORS, initials, type Band } from '@/lib/clubMock'

const QUICK_BANDS: Band[] = ['Exceptional', 'Good', 'Steady', 'Mixed']
const SESSION = { name: 'vs AEK Athens', date: '12 Apr 2026' }

export default function CoachQuickAssess() {
  const navigate = useNavigate()
  const [picks, setPicks] = useState<Record<string, Band>>({})

  const setBand = (playerId: string, band: Band) =>
    setPicks(p => ({ ...p, [playerId]: band }))

  const save = () => {
    const count = Object.keys(picks).length
    toast.success('Assessments saved', {
      description: `${count} player${count === 1 ? '' : 's'} assessed for ${SESSION.name}`,
    })
    setTimeout(() => navigate('/coach/home'), 600)
  }

  const players = PLAYERS.slice(0, 8)

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-[430px] px-5 pt-5 pb-32">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-5 h-10">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: '#101012', border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.88)',
            }}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>
            Quick Assessment
          </h1>
        </div>

        {/* Info card */}
        <div
          className="p-4 mb-5"
          style={{
            background: '#101012',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18,
          }}
        >
          <SectionLabel>Current Session</SectionLabel>
          <div className="mt-2 flex items-baseline gap-2">
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.88)' }}>{SESSION.name}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{SESSION.date}</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.5 }}>
            Tap a band for each player. Takes about 2 minutes.
          </p>
        </div>

        {/* Player list */}
        <div className="space-y-3">
          {players.map(p => {
            const selected = picks[p.id]
            const isTop = p.band === 'Exceptional' || p.band === 'Standout'
            return (
              <div
                key={p.id}
                className="p-4"
                style={{
                  background: '#101012',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 18,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: isTop ? 'rgba(200,242,90,0.12)' : '#0A0A0B',
                      border: isTop
                        ? '1px solid rgba(200,242,90,0.3)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: isTop ? '#C8F25A' : 'rgba(255,255,255,0.45)',
                      fontSize: 13,
                    }}
                  >
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{p.position}</div>
                  </div>
                  <button
                    onClick={() => navigate('/coach/assess')}
                    className="flex items-center gap-1"
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}
                  >
                    Full <ArrowRight size={12} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {QUICK_BANDS.map(b => {
                    const sel = selected === b
                    const c = BAND_COLORS[b]
                    return (
                      <button
                        key={b}
                        onClick={() => setBand(p.id, b)}
                        style={{
                          height: 28,
                          borderRadius: 999,
                          fontSize: 11,
                          color: c,
                          background: sel ? `${c}26` : 'transparent',
                          border: sel ? `1px solid ${c}` : `1px solid ${c}40`,
                          fontWeight: sel ? 500 : 400,
                          transition: 'all 120ms ease',
                        }}
                      >
                        {b}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky save bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pt-3 pb-5"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,11,0) 0%, #0A0A0B 40%)',
        }}
      >
        <button
          onClick={save}
          disabled={Object.keys(picks).length === 0}
          className="w-full py-3 rounded-lg transition"
          style={{
            background: Object.keys(picks).length > 0 ? '#C8F25A' : 'rgba(200,242,90,0.2)',
            color: '#000',
            fontSize: 14,
            fontWeight: 500,
            opacity: Object.keys(picks).length > 0 ? 1 : 0.5,
            cursor: Object.keys(picks).length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Save All ({Object.keys(picks).length})
        </button>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.22)',
      }}
    >
      {children}
    </div>
  )
}
