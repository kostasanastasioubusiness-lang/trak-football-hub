import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, BandPill } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'
import { Plus } from 'lucide-react'

const POSITIONS = ['All', 'Attack', 'Midfield', 'Defence', 'GK'] as const

export default function CoachSquadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [players, setPlayers] = useState<any[]>([])
  const [assessments, setAssessments] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<string>('All')

  useEffect(() => {
    if (!user) return

    // Fetch squad players
    supabase
      .from('squad_players')
      .select('*')
      .eq('coach_user_id', user.id)
      .order('player_name')
      .then(({ data }) => setPlayers(data || []))

    // Fetch latest assessment per player for band display
    supabase
      .from('coach_assessments')
      .select('player_id, overall_score, created_at')
      .eq('coach_user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        const latest: Record<string, number> = {}
        for (const a of data) {
          if (!latest[a.player_id]) {
            latest[a.player_id] = a.overall_score
          }
        }
        setAssessments(latest)
      })
  }, [user])

  const filtered =
    filter === 'All'
      ? players
      : players.filter(
          (p) => p.position?.toLowerCase() === filter.toLowerCase()
        )

  const initials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <MobileShell>
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-[10px] border-b border-white/[0.07] shrink-0">
        <h1 className="text-[15px] font-semibold text-white/90">Squad</h1>
        <button
          onClick={() => navigate('/coach/squad/add')}
          className="flex items-center justify-center w-8 h-8 rounded-[9px] bg-[#C8F25A] active:scale-95 transition-transform"
        >
          <Plus size={16} className="text-black" strokeWidth={2.5} />
        </button>
      </div>

      {/* Position filter chips */}
      <div className="flex items-center gap-2 px-5 py-3">
        {POSITIONS.map((pos) => {
          const active = filter === pos
          return (
            <button
              key={pos}
              onClick={() => setFilter(pos)}
              className={`inline-flex items-center h-5 px-2 rounded-[5px] text-[9px] font-medium uppercase tracking-[0.05em] transition-colors ${
                active
                  ? 'bg-[rgba(251,191,36,0.12)] text-amber-400'
                  : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.45)]'
              }`}
            >
              {pos}
            </button>
          )
        })}
      </div>

      {/* Squad list */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {filtered.length === 0 ? (
          <p className="text-white/45 text-sm mt-4">No players found.</p>
        ) : (
          <div className="space-y-0">
            {filtered.map((p, idx) => {
              const score =
                assessments[p.id] ?? p.overall_score ?? null
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/coach/player/${p.id}`)}
                  className="w-full flex items-center gap-3 py-3 border-b border-white/[0.05] active:bg-white/[0.03] transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-[11px] bg-[#202024] flex items-center justify-center shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <span
                      className={`text-[11px] font-semibold ${
                        idx === 0 ? 'text-amber-400' : 'text-white/45'
                      }`}
                    >
                      {initials(p.player_name || '??')}
                    </span>
                  </div>

                  {/* Name + metadata */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-medium text-white/[0.88] truncate">
                      {p.player_name}
                    </p>
                    <p
                      className="text-[9px] text-white/[0.22] mt-0.5 truncate"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {p.position || 'N/A'}
                      {p.shirt_number ? ` · #${p.shirt_number}` : ''}
                      {p.age ? ` · Age ${p.age}` : ''}
                    </p>
                  </div>

                  {/* Band pill */}
                  {score !== null && (
                    <BandPill band={scoreToBand(score)} />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <NavBar role="coach" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
