import { useState } from 'react'
import { ClubShell, ClubHeader, ClubCard, SectionLabel } from '@/components/club/ClubShell'
import { PLAYERS, BAND_COLORS, initials, type AgeGroup } from '@/lib/clubMock'

const GROUPS: ('All' | AgeGroup)[] = ['All', 'U19', 'U17', 'U15']

export default function ClubSquads() {
  const [filter, setFilter] = useState<'All' | AgeGroup>('All')
  const list = filter === 'All' ? PLAYERS : PLAYERS.filter(p => p.ageGroup === filter)

  return (
    <ClubShell>
      <ClubHeader />
      <SectionLabel>Filter by age group</SectionLabel>
      <div className="mt-3 mb-5 flex gap-2 flex-wrap">
        {GROUPS.map(g => {
          const active = filter === g
          return (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className="px-3 py-1.5 rounded-full text-xs"
              style={
                active
                  ? { color: '#000', background: '#C8F25A', border: '1px solid #C8F25A' }
                  : { color: 'rgba(255,255,255,0.45)', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              {g}
            </button>
          )
        })}
      </div>

      <SectionLabel>{list.length} Players</SectionLabel>
      <div className="mt-3 space-y-2">
        {list.map(p => (
          <ClubCard key={p.id} className="p-3 flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: 'rgba(200,242,90,0.1)',
                color: '#C8F25A',
                fontSize: 13,
              }}
            >
              {initials(p.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {p.position} · {p.ageGroup} · {p.matches} matches
              </div>
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
          </ClubCard>
        ))}
      </div>
    </ClubShell>
  )
}
