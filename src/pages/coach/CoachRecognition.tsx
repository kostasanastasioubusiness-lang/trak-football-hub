import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PLAYERS, BAND_COLORS, initials } from '@/lib/clubMock'

export default function CoachRecognition() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const award = () => {
    const p = PLAYERS.find(x => x.id === selectedId)
    if (!p) return
    toast.success('Player of the Week awarded', {
      description: `${p.name} — recognition added to passport`,
    })
    setTimeout(() => navigate('/coach/home'), 600)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-[430px] px-5 pt-5 pb-12">
        <div className="relative flex items-center justify-center mb-2 h-10">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: '#101012',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.88)',
            }}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>
            Give Recognition
          </h1>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
          Recognition is permanent — it lives on a player's passport forever.
        </p>

        {/* Section 1 — Player of the Week */}
        <section
          className="p-5 mb-4"
          style={{
            background: 'rgba(200,242,90,0.06)',
            border: '1px solid rgba(200,242,90,0.18)',
            borderRadius: 18,
          }}
        >
          <Label color="#C8F25A">Player of the Week</Label>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
            Recognise one player whose performance stood out this week.
          </p>

          <div className="mt-4 space-y-2">
            {PLAYERS.slice(0, 6).map(p => {
              const sel = selectedId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="w-full flex items-center gap-3 p-3 text-left transition"
                  style={{
                    background: sel ? 'rgba(200,242,90,0.1)' : '#101012',
                    border: sel ? '1px solid #C8F25A' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14,
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: '#0A0A0B',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.88)',
                      fontSize: 13,
                    }}
                  >
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{p.position}</div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px]"
                    style={{
                      color: BAND_COLORS[p.band],
                      background: `${BAND_COLORS[p.band]}1F`,
                      border: `1px solid ${BAND_COLORS[p.band]}40`,
                    }}
                  >
                    {p.band}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={award}
            disabled={!selectedId}
            className="mt-5 w-full py-3 rounded-lg transition"
            style={{
              background: selectedId ? '#C8F25A' : 'rgba(200,242,90,0.2)',
              color: '#000',
              fontSize: 14,
              fontWeight: 500,
              opacity: selectedId ? 1 : 0.5,
              cursor: selectedId ? 'pointer' : 'not-allowed',
            }}
          >
            Award Player of the Week
          </button>
        </section>

        {/* Section 2 — Player of the Month (locked) */}
        <LockedSection
          opacity={0.6}
          title="Player of the Month"
          description="Awarded once per month to recognise sustained performance across multiple matches."
          unlock="Unlocks in 14 days"
        />

        {/* Section 3 — Player of the Season (locked) */}
        <LockedSection
          opacity={0.4}
          title="Player of the Season"
          description="The highest honour. Awarded once at the end of the season to one outstanding player."
          unlock="Unlocks June 2026"
        />
      </div>
    </div>
  )
}

function Label({ children, color = 'rgba(255,255,255,0.22)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color,
      }}
    >
      {children}
    </div>
  )
}

function LockedSection({
  opacity,
  title,
  description,
  unlock,
}: {
  opacity: number
  title: string
  description: string
  unlock: string
}) {
  return (
    <section
      className="p-5 mb-4"
      style={{
        background: '#101012',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        opacity,
      }}
    >
      <Label>{title}</Label>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{description}</p>
      <div className="mt-4">
        <Label color="rgba(255,255,255,0.45)">{unlock}</Label>
      </div>
    </section>
  )
}
