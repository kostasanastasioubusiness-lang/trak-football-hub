import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, MetadataLabel } from '@/components/trak'
import { computeMatchScore } from '@/lib/rating-engine'

type SquadPlayer = {
  id: string
  player_name: string
  linked_player_id: string | null
  position: string | null
  age: string | null
}

type Competition = 'League' | 'Cup' | 'Friendly'
type Venue = 'Home' | 'Away'

function mapPosition(raw: string | null) {
  const p = (raw || '').toLowerCase()
  if (p.includes('goalkeeper') || p === 'gk') return 'gk'
  if (p.includes('defender') || p === 'def' || p === 'cb' || p === 'lb' || p === 'rb') return 'def'
  if (p.includes('attacker') || p === 'att' || p === 'cf' || p === 'st' || p === 'lw' || p === 'rw') return 'att'
  return 'mid'
}

export default function CoachAddSession() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Common fields
  const [type,  setType]  = useState<'training' | 'match' | 'other'>('training')
  const [title, setTitle] = useState('')
  const [date,  setDate]  = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  // Match-only fields
  const [opponent,    setOpponent]    = useState('')
  const [scoreUs,     setScoreUs]     = useState('')
  const [scoreThem,   setScoreThem]   = useState('')
  const [competition, setCompetition] = useState<Competition>('League')
  const [venue,       setVenue]       = useState<Venue>('Home')

  // Attendance (shown for all types, drives matches rows for 'match')
  const [squad,    setSquad]    = useState<SquadPlayer[]>([])
  const [attended, setAttended] = useState<Set<string>>(new Set())
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('squad_players')
      .select('id, player_name, linked_player_id, position, age')
      .eq('coach_user_id', user.id)
      .order('player_name')
      .then(({ data }) => setSquad(data || []))
  }, [user])

  const togglePlayer = (id: string) =>
    setAttended(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const isMatch = type === 'match'
  const result =
    scoreUs === '' || scoreThem === '' ? null
    : Number(scoreUs) > Number(scoreThem) ? 'W'
    : Number(scoreUs) < Number(scoreThem) ? 'L' : 'D'

  const canSave =
    !saving &&
    (isMatch ? opponent.trim().length > 0 && scoreUs !== '' && scoreThem !== '' : title.trim().length > 0)

  const handleSave = async () => {
    if (!user || !canSave) return
    setSaving(true)

    const sessionTitle = isMatch ? `vs ${opponent.trim()}` : title.trim()

    const { data: session, error } = await supabase
      .from('coach_sessions')
      .insert({
        coach_user_id: user.id,
        title:         sessionTitle,
        session_type:  type,
        session_date:  date,
        notes:         notes || null,
        // match-specific columns (ignored by DB if not a match type)
        ...(isMatch && {
          opponent:    opponent.trim(),
          competition,
          venue,
          notes:       `${scoreUs}-${scoreThem}${notes ? ' · ' + notes : ''}`,
        }),
      })
      .select()
      .single()

    if (error || !session) {
      toast.error('Could not save session')
      setSaving(false)
      return
    }

    // Attendance rows (all session types)
    if (attended.size > 0) {
      await supabase.from('session_attendance').insert(
        [...attended].map(squad_player_id => ({
          session_id: session.id,
          squad_player_id,
          status: 'present',
        }))
      )

      // matches rows — only for match sessions with linked players
      if (isMatch) {
        const attendedPlayers = squad.filter(p => attended.has(p.id))
        const linked = attendedPlayers.filter(p => p.linked_player_id)

        if (linked.length > 0) {
          const matchRows = linked.map(p => {
            const pos = mapPosition(p.position)
            const computed_rating = computeMatchScore({
              position:        pos,
              competition:     competition.toLowerCase() as 'league' | 'cup' | 'friendly',
              venue:           venue.toLowerCase() as 'home' | 'away',
              opponent:        opponent.trim(),
              score_us:        Number(scoreUs) || 0,
              score_them:      Number(scoreThem) || 0,
              minutes_played:  90,
              card:            'none',
              body_condition:  'good',
              self_rating:     'average',
              position_inputs: {},
              is_friendly:     competition === 'Friendly',
            })
            return {
              user_id:        p.linked_player_id!,
              opponent:       opponent.trim(),
              team_score:     Number(scoreUs)   || 0,
              opponent_score: Number(scoreThem) || 0,
              competition,
              venue,
              position:       p.position  || 'Midfielder',
              age_group:      p.age       || 'U19+',
              minutes_played: 90,
              goals:          0,
              assists:        0,
              card_received:  'None',
              body_condition: 'Average',
              self_rating:    'Average',
              computed_rating,
              created_at:     new Date(date + 'T12:00:00Z').toISOString(),
            }
          })
          await supabase.from('matches').insert(matchRows)
        }
      }
    }

    toast.success(isMatch ? 'Match saved' : 'Session saved')
    setSaving(false)
    navigate('/coach/sessions/list')
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <MobileShell>
      {/* Topbar */}
      <div className="flex items-center justify-between pt-3 pb-2 border-b border-white/[0.07]">
        <button
          onClick={() => navigate(-1)}
          className="w-[34px] h-[34px] bg-[#17171A] border border-white/[0.11] rounded-[10px] flex items-center justify-center"
        >
          <ChevronLeft size={14} className="text-white/88" />
        </button>
        <span className="text-[16px] font-medium text-white/88" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Add Session
        </span>
        <div className="w-[34px]" />
      </div>

      <div className="pt-5 pb-32 space-y-5">

        {/* Session type */}
        <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
          <MetadataLabel text="TYPE" />
          <div className="flex gap-2 mt-3">
            {(['training', 'match', 'other'] as const).map(t => (
              <Chip key={t} active={type === t} onClick={() => setType(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Chip>
            ))}
          </div>
        </div>

        {/* Match fields */}
        {isMatch ? (
          <>
            <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
              <MetadataLabel text="OPPONENT" />
              <input
                value={opponent}
                onChange={e => setOpponent(e.target.value)}
                placeholder="Opponent name"
                className="w-full bg-transparent text-[20px] text-white/88 placeholder-white/20 outline-none mt-2"
                style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}
              />

              <div className="grid grid-cols-3 items-center gap-3 mt-5">
                <div className="text-center">
                  <span className="block text-[9px] font-medium tracking-[0.14em] uppercase text-white/45 mb-2"
                    style={{ fontFamily: "'DM Mono', monospace" }}>US</span>
                  <input inputMode="numeric" value={scoreUs}
                    onChange={e => setScoreUs(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="0"
                    className="w-full bg-[#0A0A0B] border border-white/[0.07] rounded-[12px] py-3 text-center text-[28px] text-white/88 placeholder-white/20 outline-none"
                    style={{ fontFamily: "'DM Sans', sans-serif" }} />
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-medium tracking-[0.14em] uppercase text-white/30 mb-2"
                    style={{ fontFamily: "'DM Mono', monospace" }}>RESULT</span>
                  <div className="w-full py-3 rounded-[12px] text-center text-[28px]"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: result === 'W' ? '#C8F25A' : result === 'L' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)',
                    }}>
                    {result || '–'}
                  </div>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-medium tracking-[0.14em] uppercase text-white/45 mb-2"
                    style={{ fontFamily: "'DM Mono', monospace" }}>THEM</span>
                  <input inputMode="numeric" value={scoreThem}
                    onChange={e => setScoreThem(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="0"
                    className="w-full bg-[#0A0A0B] border border-white/[0.07] rounded-[12px] py-3 text-center text-[28px] text-white/88 placeholder-white/20 outline-none"
                    style={{ fontFamily: "'DM Sans', sans-serif" }} />
                </div>
              </div>
            </div>

            <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012] space-y-4">
              <div>
                <MetadataLabel text="COMPETITION" />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {(['League', 'Cup', 'Friendly'] as const).map(c => (
                    <Chip key={c} active={competition === c} onClick={() => setCompetition(c)}>{c}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <MetadataLabel text="VENUE" />
                <div className="flex gap-2 mt-2">
                  {(['Home', 'Away'] as const).map(v => (
                    <Chip key={v} active={venue === v} onClick={() => setVenue(v)}>{v}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Training / Other: just title */
          <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
            <MetadataLabel text="TITLE" />
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'other' ? 'e.g. Gym, Video Analysis…' : 'e.g. Passing & Movement'}
              className="w-full bg-transparent text-[16px] text-white/88 placeholder-white/20 outline-none mt-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
        )}

        {/* Date */}
        <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
          <MetadataLabel text="DATE" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-transparent text-[15px] text-white/88 outline-none mt-2"
            style={{ fontFamily: "'DM Sans', sans-serif", colorScheme: 'dark' }} />
        </div>

        {/* Attendance */}
        <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-white/45"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              {isMatch ? 'PLAYED' : 'ATTENDED'} · {attended.size}/{squad.length}
            </span>
            <div className="flex gap-3">
              <button onClick={() => setAttended(new Set(squad.map(p => p.id)))}
                className="text-[10px] tracking-[0.12em] uppercase text-[#C8F25A]"
                style={{ fontFamily: "'DM Mono', monospace" }}>ALL</button>
              <button onClick={() => setAttended(new Set())}
                className="text-[10px] tracking-[0.12em] uppercase text-white/35"
                style={{ fontFamily: "'DM Mono', monospace" }}>NONE</button>
            </div>
          </div>

          {squad.length === 0 ? (
            <p className="text-[12px] text-white/40 py-2">
              No squad yet. Add players from the Squad tab first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {squad.map(p => {
                const on = attended.has(p.id)
                return (
                  <button key={p.id} onClick={() => togglePlayer(p.id)}
                    className="text-left px-3 py-2.5 rounded-[10px] transition-colors"
                    style={{
                      background: on ? 'rgba(200,242,90,0.08)' : 'rgba(0,0,0,0.35)',
                      border: `1px solid ${on ? 'rgba(200,242,90,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      color: on ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    }}>
                    {p.player_name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-[18px] p-4 border border-white/[0.07] bg-[#101012]">
          <MetadataLabel text="NOTES" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Optional…"
            className="w-full bg-transparent text-[14px] text-white/88 placeholder-white/20 outline-none resize-none mt-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }} />
        </div>

      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-5 pt-3"
        style={{ background: 'linear-gradient(180deg,rgba(10,10,11,0) 0%,#0A0A0B 35%)' }}>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-3.5 rounded-[12px] text-[14px] font-medium transition-opacity"
          style={{
            background: canSave ? '#C8F25A' : 'rgba(255,255,255,0.06)',
            color: canSave ? '#000' : 'rgba(255,255,255,0.3)',
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? 'Saving…' : isMatch ? 'Save match' : 'Save session'}
        </button>
      </div>
    </MobileShell>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors"
      style={{
        background: active ? 'rgba(200,242,90,0.12)' : '#202024',
        color: active ? '#C8F25A' : 'rgba(255,255,255,0.45)',
        border: `1px solid ${active ? 'rgba(200,242,90,0.3)' : 'rgba(255,255,255,0.07)'}`,
        fontFamily: "'DM Sans', sans-serif",
      }}>
      {children}
    </button>
  )
}
