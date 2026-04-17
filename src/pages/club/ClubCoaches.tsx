import { useState } from 'react'
import { ClubShell, ClubHeader, ClubCard, SectionLabel } from '@/components/club/ClubShell'
import { COACHES, initials } from '@/lib/clubMock'

export default function ClubCoaches() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <ClubShell>
      <ClubHeader />
      <SectionLabel>Connected Coaches</SectionLabel>
      <div className="mt-3 mb-6 space-y-2">
        {COACHES.map(c => (
          <ClubCard key={c.id} className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: 'rgba(200,242,90,0.1)',
                  color: '#C8F25A',
                  fontSize: 14,
                }}
              >
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                  {c.role} · {c.ageGroup}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Players" value={c.players} />
              <Stat label="Assessments" value={c.assessments} />
            </div>
          </ClubCard>
        ))}
      </div>

      <SectionLabel>Invite a coach</SectionLabel>
      <ClubCard className="p-4 mt-3">
        <input
          type="email"
          placeholder="coach@club.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setSent(false) }}
          className="w-full px-3 py-2.5 rounded-lg outline-none"
          style={{
            background: '#202024',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.88)',
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          onClick={() => { if (email) setSent(true) }}
          className="mt-3 w-full py-2.5 rounded-lg"
          style={{ background: '#C8F25A', color: '#000', fontSize: 14, fontWeight: 500 }}
        >
          {sent ? 'Invite Sent' : 'Send Invite'}
        </button>
      </ClubCard>
    </ClubShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="px-3 py-2"
      style={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>{value}</div>
    </div>
  )
}
