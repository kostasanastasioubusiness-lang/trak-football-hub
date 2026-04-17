import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, ShieldCheck } from 'lucide-react'
import { BAND_COLORS, type Band } from '@/lib/clubMock'

const PLAYER = {
  name: 'Andreas Kostas',
  position: 'Midfielder',
  club: 'Panetolikos FC',
  currentBand: 'Standout' as Band,
  last5: ['Good', 'Steady', 'Standout', 'Good', 'Standout'] as Band[],
  seasonDist: { E: 2, G: 7, S: 4, Mx: 2, D: 1 },
}

const SEASONS = [
  { id: 's1', label: '2025–26', club: 'Panetolikos FC', ageGroup: 'U19', matches: 16, verified: 11, dist: { E: 2, G: 7, S: 4, Mx: 2, D: 1 } },
  { id: 's2', label: '2024–25', club: 'Panetolikos FC', ageGroup: 'U17', matches: 22, verified: 14, dist: { E: 1, G: 9, S: 7, Mx: 3, D: 2 } },
  { id: 's3', label: '2023–24', club: 'Olympiakos Academy', ageGroup: 'U17', matches: 18, verified: 0, dist: { E: 0, G: 5, S: 8, Mx: 4, D: 1 } },
]

const RECENT = [
  { id: 'm1', opponent: 'AEK Athens', date: '12 Apr', band: 'Standout' as Band, verified: true },
  { id: 'm2', opponent: 'PAOK', date: '5 Apr', band: 'Good' as Band, verified: true },
  { id: 'm3', opponent: 'Aris', date: '29 Mar', band: 'Steady' as Band, verified: false },
  { id: 'm4', opponent: 'Olympiakos', date: '22 Mar', band: 'Standout' as Band, verified: true },
  { id: 'm5', opponent: 'Panathinaikos', date: '15 Mar', band: 'Good' as Band, verified: false },
]

export default function PlayerPassport() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-[430px] px-5 pt-5 pb-12">
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
          <h1 style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>My Passport</h1>
          <button
            className="absolute right-0 flex items-center gap-1.5 px-3 h-8 rounded-full"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.88)',
              fontSize: 12,
            }}
          >
            <Share2 size={12} /> Share
          </button>
        </div>

        {/* Identity */}
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 28, color: 'rgba(255,255,255,0.88)' }}>
          {PLAYER.name}
        </h2>
        <div className="mt-3 flex gap-2">
          <Pill>{PLAYER.position}</Pill>
          <Pill>{PLAYER.club}</Pill>
        </div>

        {/* Hero — This season summary */}
        <div
          className="mt-6 p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #101012 0%, #0E1208 100%)',
            border: '1px solid rgba(200,242,90,0.18)',
            borderRadius: 18,
            boxShadow: '0 0 60px -20px rgba(200,242,90,0.25) inset',
          }}
        >
          <SectionLabel>This Season</SectionLabel>
          <div className="mt-3 flex items-end justify-between">
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: 52,
                lineHeight: 1,
                color: BAND_COLORS[PLAYER.currentBand],
              }}
            >
              {PLAYER.currentBand}
            </div>
            <div className="flex items-end gap-1.5 h-14">
              {PLAYER.last5.map((b, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: `${30 + i * 14}%`,
                    background: BAND_COLORS[b],
                    borderRadius: 2,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </div>

          <div
            className="mt-5 px-4 py-3"
            style={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
          >
            <SectionLabel>Season Distribution</SectionLabel>
            <div className="mt-2.5 flex gap-2 flex-wrap">
              <DistTag color={BAND_COLORS.Exceptional} letter="E" count={PLAYER.seasonDist.E} />
              <DistTag color={BAND_COLORS.Good} letter="G" count={PLAYER.seasonDist.G} />
              <DistTag color={BAND_COLORS.Steady} letter="S" count={PLAYER.seasonDist.S} />
              <DistTag color={BAND_COLORS.Mixed} letter="Mx" count={PLAYER.seasonDist.Mx} />
              <DistTag color={BAND_COLORS.Developing} letter="D" count={PLAYER.seasonDist.D} />
            </div>
          </div>
        </div>

        {/* Season history */}
        <div className="mt-6">
          <SectionLabel>Season History</SectionLabel>
          <div className="mt-3 space-y-3">
            {SEASONS.map(s => (
              <div
                key={s.id}
                className="p-4"
                style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.88)' }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      {s.club} · {s.ageGroup}
                    </div>
                  </div>
                  {s.verified > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                      style={{
                        color: '#C8F25A',
                        background: 'rgba(200,242,90,0.1)',
                        border: '1px solid rgba(200,242,90,0.25)',
                      }}
                    >
                      <ShieldCheck size={10} /> Verified
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-1.5 flex-wrap">
                  <DistTag color={BAND_COLORS.Exceptional} letter="E" count={s.dist.E} />
                  <DistTag color={BAND_COLORS.Good} letter="G" count={s.dist.G} />
                  <DistTag color={BAND_COLORS.Steady} letter="S" count={s.dist.S} />
                  <DistTag color={BAND_COLORS.Mixed} letter="Mx" count={s.dist.Mx} />
                  <DistTag color={BAND_COLORS.Developing} letter="D" count={s.dist.D} />
                </div>

                <div
                  className="mt-3 flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <Stat label="Matches" value={s.matches} />
                  <Stat label="Coach Verified" value={s.verified} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent verified entries */}
        <div className="mt-6">
          <SectionLabel>Recent Entries</SectionLabel>
          <div className="mt-3 space-y-2">
            {RECENT.map(m => (
              <div
                key={m.id}
                className="p-3 flex items-center gap-3"
                style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}
              >
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>vs {m.opponent}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{m.date}</span>
                    {m.verified && (
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ fontSize: 11, color: '#C8F25A' }}
                      >
                        <ShieldCheck size={10} /> Coach verified
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px]"
                  style={{
                    color: BAND_COLORS[m.band],
                    background: `${BAND_COLORS[m.band]}1F`,
                    border: `1px solid ${BAND_COLORS[m.band]}40`,
                  }}
                >
                  {m.band}
                </span>
              </div>
            ))}
          </div>
        </div>
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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs"
      style={{
        color: 'rgba(255,255,255,0.45)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {children}
    </span>
  )
}

function DistTag({ color, letter, count }: { color: string; letter: string; count: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        color,
        background: `${color}1F`,
        border: `1px solid ${color}40`,
        fontSize: 11,
      }}
    >
      <span style={{ fontWeight: 500 }}>{letter}</span>
      <span style={{ opacity: 0.85 }}>{count}</span>
    </span>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>{value}</div>
    </div>
  )
}
