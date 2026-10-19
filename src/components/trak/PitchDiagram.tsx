import type { FC } from 'react'
import type { DiagramData } from './pitch-diagrams'

export type { DiagramArrow, DiagramCone, DiagramData, DiagramPlayer } from './pitch-diagrams'

// ── SVG constants ─────────────────────────────────────────────────────────────

const W  = 240, H  = 158
const PX = 18,  PY = 16
const PW = W - PX * 2   // 204
const PH = H - PY * 2   // 126
const R  = 11            // player circle radius

const TEAM: Record<string, { bg: string; text: string }> = {
  A: { bg: '#C8F25A',              text: '#000' },
  B: { bg: '#fb923c',              text: '#000' },
  N: { bg: 'rgba(255,255,255,.84)', text: '#000' },
}
const ARROW: Record<string, { color: string; dash?: string; mid: string }> = {
  pass:  { color: 'rgba(200,242,90,.75)',  dash: '5 3', mid: 'arr-pass'  },
  run:   { color: 'rgba(255,255,255,.50)', dash: undefined, mid: 'arr-run'  },
  press: { color: 'rgba(251,146,60,.75)',  dash: '3 3', mid: 'arr-press' },
}

const tx = (x: number) => PX + Math.max(0, Math.min(1, x)) * PW
const ty = (y: number) => PY + Math.max(0, Math.min(1, y)) * PH

function arrowPath(from: [number, number], to: [number, number]) {
  const x1 = tx(from[0]), y1 = ty(from[1]), x2 = tx(to[0]), y2 = ty(to[1])
  const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1
  const m = (R + 1) / len
  return `M ${(x1 + dx * m).toFixed(1)},${(y1 + dy * m).toFixed(1)} L ${(x2 - dx * m).toFixed(1)},${(y2 - dy * m).toFixed(1)}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PitchDiagram: FC<{ data: DiagramData }> = ({ data }) => {
  const players = data.players ?? []
  const cones   = data.cones   ?? []
  const arrows  = data.arrows  ?? []
  const isHalf  = data.pitch === 'half'

  return (
    <div className="mt-3 rounded-[14px] overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.09)' }}>

      {/* Title bar */}
      {data.title && (
        <div className="px-3 py-1.5"
          style={{ background: '#0d0d0f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
          }}>
            {data.title}
          </span>
        </div>
      )}

      {/* SVG pitch */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ background: '#0c160c', display: 'block' }}>
        <defs>
          {Object.entries(ARROW).map(([key, s]) => (
            <marker key={key} id={s.mid} markerWidth="6" markerHeight="6"
              refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={s.color} />
            </marker>
          ))}
        </defs>

        {/* Pitch rectangle */}
        <rect x={PX} y={PY} width={PW} height={PH} rx="2"
          fill="rgba(255,255,255,0.016)"
          stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        {isHalf ? (
          <>
            {/* Goal */}
            <rect x={PX + PW * 0.35} y={PY + PH - 2} width={PW * 0.3} height={9}
              fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
            {/* Penalty area */}
            <rect x={PX + PW * 0.18} y={PY + PH * 0.52}
              width={PW * 0.64} height={PH * 0.48}
              fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Penalty spot */}
            <circle cx={PX + PW * 0.5} cy={PY + PH * 0.76} r="2"
              fill="rgba(255,255,255,0.28)" />
            {/* D arc */}
            <path d={`M ${PX + PW * 0.30},${PY + PH * 0.52} A ${PW * 0.20} ${PW * 0.20} 0 0 0 ${PX + PW * 0.70},${PY + PH * 0.52}`}
              fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          </>
        ) : (
          <>
            {/* Grid dashes */}
            <line x1={PX + PW * 0.5} y1={PY} x2={PX + PW * 0.5} y2={PY + PH}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={PX} y1={PY + PH * 0.5} x2={PX + PW} y2={PY + PH * 0.5}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 4" />
          </>
        )}

        {/* Cones */}
        {cones.map((c, i) => (
          <polygon key={i}
            points={`${tx(c.x)},${ty(c.y) - 7} ${tx(c.x) + 5.5},${ty(c.y) + 4} ${tx(c.x) - 5.5},${ty(c.y) + 4}`}
            fill="#fbbf24" opacity="0.9" />
        ))}

        {/* Arrows */}
        {arrows.map((a, i) => {
          const s = ARROW[a.style ?? 'pass'] ?? ARROW.pass
          return (
            <path key={i} d={arrowPath(a.from, a.to)}
              stroke={s.color} strokeWidth="1.6"
              strokeDasharray={s.dash} fill="none"
              markerEnd={`url(#${s.mid})`} />
          )
        })}

        {/* Players */}
        {players.map((p, i) => {
          const cx = tx(p.x), cy = ty(p.y)
          const s = TEAM[p.team] ?? TEAM.A
          const lbl = (p.label ?? '').slice(0, 2)
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={R} fill={s.bg}
                stroke="rgba(0,0,0,0.22)" strokeWidth="1" />
              <text x={cx} y={cy + 3.8} textAnchor="middle"
                style={{ fontSize: lbl.length > 1 ? 7.5 : 9, fontWeight: 700,
                  fontFamily: 'monospace', fill: s.text, userSelect: 'none' }}>
                {lbl}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      {(players.some(p => p.team === 'A') || players.some(p => p.team === 'B') ||
        players.some(p => p.team === 'N') || cones.length > 0 ||
        arrows.some(a => a.style === 'pass') || arrows.some(a => a.style === 'run') ||
        arrows.some(a => a.style === 'press')) && (
        <div className="flex items-center gap-4 px-3 py-2 flex-wrap"
          style={{ background: '#0d0d0f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {players.some(p => p.team === 'A') && <Dot color="#C8F25A" label="Attacking" />}
          {players.some(p => p.team === 'B') && <Dot color="#fb923c" label="Defending" />}
          {players.some(p => p.team === 'N') && <Dot color="rgba(255,255,255,0.75)" label="Neutral / Joker" />}
          {cones.length > 0 && <Dot color="#fbbf24" cone label="Cone" />}
          {arrows.some(a => a.style === 'pass') && <ArrowKey color="rgba(200,242,90,.75)" label="Pass" dash />}
          {arrows.some(a => a.style === 'run') && <ArrowKey color="rgba(255,255,255,.50)" label="Run" />}
          {arrows.some(a => a.style === 'press') && <ArrowKey color="rgba(251,146,60,.75)" label="Press" dash />}
        </div>
      )}
    </div>
  )
}

function Dot({ color, label, cone }: { color: string; label: string; cone?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {cone
        ? <svg width="9" height="8"><polygon points="4.5,0 9,8 0,8" fill={color} /></svg>
        : <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      }
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 8,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)',
      }}>{label}</span>
    </div>
  )
}

function ArrowKey({ color, label, dash }: { color: string; label: string; dash?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="18" height="8">
        <line x1="1" y1="4" x2="13" y2="4"
          stroke={color} strokeWidth="1.5"
          strokeDasharray={dash ? '4 2' : undefined} />
        <path d="M11,1 L17,4 L11,7 Z" fill={color} />
      </svg>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 8,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)',
      }}>{label}</span>
    </div>
  )
}
