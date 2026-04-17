import { ClubShell, ClubHeader, ClubCard, SectionLabel } from '@/components/club/ClubShell'
import { CLUB, SQUADS, BAND_COLORS } from '@/lib/clubMock'

export default function ClubHome() {
  const max = Math.max(...CLUB.trend)
  return (
    <ClubShell>
      <ClubHeader club={CLUB.name} coaches={3} />

      <ClubCard className="p-5 mb-5">
        <SectionLabel>Total Players</SectionLabel>
        <div className="mt-3 flex items-end justify-between">
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: 64,
              lineHeight: 1,
              color: '#C8F25A',
            }}
          >
            {CLUB.totalPlayers}
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {CLUB.trend.map((v, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: `${(v / max) * 100}%`,
                  background: i === CLUB.trend.length - 1 ? '#C8F25A' : 'rgba(200,242,90,0.3)',
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="mt-5 flex items-center justify-between px-4 py-3"
          style={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
        >
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Assessments this week</span>
          <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16 }}>{CLUB.assessmentsThisWeek}</span>
        </div>
      </ClubCard>

      <SectionLabel>Squads</SectionLabel>
      <div className="mt-3 space-y-3">
        {SQUADS.map(s => (
          <ClubCard key={s.ageGroup} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.88)' }}>{s.ageGroup}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{s.coach}</div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{s.players} players</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{s.assessments} assessments</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <BandTag color={BAND_COLORS.Exceptional} letter="E" count={s.dist.E} />
              <BandTag color={BAND_COLORS.Good} letter="G" count={s.dist.G} />
              <BandTag color={BAND_COLORS.Steady} letter="S" count={s.dist.S} />
            </div>
          </ClubCard>
        ))}
      </div>

      <div
        className="mt-6 px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          color: 'rgba(255,255,255,0.45)',
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        Read-only view. Performance data belongs to players and coaches. Club administrators can monitor activity
        but cannot edit player or coach records.
      </div>
    </ClubShell>
  )
}

function BandTag({ color, letter, count }: { color: string; letter: string; count: number }) {
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
