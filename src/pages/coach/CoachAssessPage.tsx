import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, BandPill, NavBar } from '@/components/trak'
import { SliderInput } from '@/components/trak/SliderInput'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'
import type { BandType, SelfRatingFlag } from '@/lib/types'
import { trackEvent } from '@/lib/telemetry'
import { ChevronLeft, ChevronDown } from 'lucide-react'

/* ---------- helpers ---------- */

function bandConfig(band: BandType) {
  return BANDS.find(b => b.word.toLowerCase() === band) ?? BANDS[BANDS.length - 1]
}

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/* ---------- option pill ---------- */

function OptPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[10px] p-[11px_8px] text-center text-[13px] font-medium transition-colors"
      style={{
        background: active ? 'rgba(200,242,90,0.12)' : '#0d0d0f',
        border: active ? '1.5px solid #C8F25A' : '1.5px solid rgba(255,255,255,0.06)',
        color: active ? '#C8F25A' : 'rgba(255,255,255,0.55)',
      }}
    >
      {label}
    </button>
  )
}

/* ========== main page ========== */

export default function CoachAssessPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  /* --- data --- */
  const [players, setPlayers] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [playerId, setPlayerId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [appearance, setAppearance] = useState<'started' | 'sub' | 'training'>('started')
  const [workRate, setWorkRate] = useState(5)
  const [tactical, setTactical] = useState(5)
  const [attitude, setAttitude] = useState(5)
  const [technical, setTechnical] = useState(5)
  const [physical, setPhysical] = useState(5)
  const [coachability, setCoachability] = useState(5)
  const [note, setNote] = useState('')
  const [selfRatingFlag, setSelfRatingFlag] = useState<SelfRatingFlag | ''>('')
  const [saving, setSaving] = useState(false)

  /* fetch squad players */
  useEffect(() => {
    if (!user) return
    supabase
      .from('squad_players')
      .select('*')
      .eq('coach_user_id', user.id)
      .order('player_name')
      .then(({ data }) => setPlayers(data || []))
  }, [user])

  /* fetch sessions/matches for the session dropdown */
  useEffect(() => {
    if (!user) return
    supabase
      .from('coach_sessions')
      .select('*')
      .eq('coach_user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(20)
      .then(({ data }) => setSessions(data || []))
  }, [user])

  /* --- computed --- */
  const avg = (workRate + tactical + attitude + technical + physical + coachability) / 6
  const band = scoreToBand(avg)
  const overallCfg = bandConfig(band)

  const selectedPlayer = useMemo(
    () => players.find(p => p.id === playerId),
    [players, playerId],
  )

  /* --- save --- */
  const handleSave = async () => {
    if (!user || !playerId || saving) return
    setSaving(true)
    await supabase.from('coach_assessments').insert({
      coach_user_id: user.id,
      squad_player_id: playerId,
      session_id: sessionId || null,
      appearance,
      work_rate: workRate,
      tactical,
      attitude,
      technical,
      physical,
      coachability,
      coach_rating: Math.round(avg * 10) / 10,
      private_note: note || null,
      self_rating_flag: selfRatingFlag || null,
    })
    trackEvent('assessment', { player_id: playerId, band })
    navigate('/coach/home')
  }

  /* ---- render ---- */
  return (
    <MobileShell>
      <div className="pb-24 space-y-5">
        {/* ---- 1. header: back + title ---- */}
        <div className="flex items-center gap-3 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#17171a] border border-white/[0.11]"
          >
            <ChevronLeft size={16} className="text-white/70" />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold text-white/90 -ml-[34px]">
            Assessment
          </h1>
        </div>

        {/* ---- 2. player card (sq-item) ---- */}
        {selectedPlayer ? (
          <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[#141416] border border-white/[0.06]">
            <div
              className="flex items-center justify-center w-[38px] h-[38px] rounded-full text-[13px] font-bold shrink-0"
              style={{ background: 'rgba(200,242,90,0.14)', color: '#C8F25A' }}
            >
              {initials(selectedPlayer.player_name)}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-white/90 truncate">
                {selectedPlayer.player_name}
              </p>
              <p className="text-[11px] text-white/40 truncate">
                {selectedPlayer.position?.toUpperCase() ?? 'Player'}
                {selectedPlayer.club ? ` \u00B7 ${selectedPlayer.club}` : ''}
                {selectedPlayer.age_group ? ` ${selectedPlayer.age_group}` : ''}
                {selectedPlayer.squad_number ? ` \u00B7 #${selectedPlayer.squad_number}` : ''}
              </p>
            </div>
          </div>
        ) : null}

        {/* player selector dropdown */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
            PLAYER
          </span>
          <div className="relative">
            <select
              value={playerId}
              onChange={e => setPlayerId(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-[10px] bg-[#0d0d0f] border border-white/[0.07] text-sm text-white/88 outline-none appearance-none"
            >
              <option value="">{selectedPlayer ? 'Change player...' : 'Select player...'}</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.player_name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* ---- 3. session selector ---- */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
            SESSION
          </span>
          <div className="relative">
            <select
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-[10px] bg-[#0d0d0f] border border-white/[0.07] text-sm text-white/88 outline-none appearance-none"
            >
              <option value="">Select session...</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title || s.session_date || s.id}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* ---- 4. appearance selector ---- */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
            APPEARANCE
          </span>
          <div className="grid grid-cols-3 gap-2">
            <OptPill label="Started" active={appearance === 'started'} onClick={() => setAppearance('started')} />
            <OptPill label="Sub" active={appearance === 'sub'} onClick={() => setAppearance('sub')} />
            <OptPill label="Training" active={appearance === 'training'} onClick={() => setAppearance('training')} />
          </div>
        </div>

        {/* ---- 5. sliders in dark container ---- */}
        <div className="rounded-[14px] bg-[rgba(0,0,0,0.25)] p-[14px_16px] space-y-5">
          <SliderInput label="Work Rate" value={workRate} onChange={setWorkRate} />
          <SliderInput label="Tactical" value={tactical} onChange={setTactical} />
          <SliderInput label="Attitude" value={attitude} onChange={setAttitude} />
          <SliderInput label="Technical" value={technical} onChange={setTechnical} />
          <SliderInput label="Physical" value={physical} onChange={setPhysical} />
          <SliderInput label="Coachability" value={coachability} onChange={setCoachability} />
        </div>

        {/* ---- 6. overall band card (amber glow) ---- */}
        <div
          className="flex flex-col items-center gap-2 py-5 rounded-[14px]"
          style={{
            background: overallCfg.bg,
            border: `1px solid ${overallCfg.border}`,
            boxShadow: `0 0 24px ${overallCfg.bg}`,
          }}
        >
          <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/40" style={{ fontFamily: "'DM Mono', monospace" }}>
            OVERALL BAND
          </span>
          <span
            className="inline-flex items-center justify-center px-5 rounded-full text-[16px] font-semibold"
            style={{
              height: 36,
              color: overallCfg.color,
              background: overallCfg.bg,
              border: `1.5px solid ${overallCfg.border}`,
            }}
          >
            {overallCfg.word}
          </span>
          <span className="text-[13px] text-white/50 font-medium">
            {(Math.round(avg * 10) / 10).toFixed(1)}
          </span>
        </div>

        {/* ---- 7. self-rating accuracy ---- */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
            DOES THE PLAYER'S SELF-RATING FEEL ACCURATE?
          </span>
          <div className="grid grid-cols-3 gap-2">
            <OptPill label="Fair" active={selfRatingFlag === 'fair'} onClick={() => setSelfRatingFlag('fair')} />
            <OptPill label="Generous" active={selfRatingFlag === 'generous'} onClick={() => setSelfRatingFlag('generous')} />
            <OptPill label="Way off" active={selfRatingFlag === 'way off'} onClick={() => setSelfRatingFlag('way off')} />
          </div>
        </div>

        {/* ---- 8. private note ---- */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
              PRIVATE NOTE
            </span>
            <span className="text-[10px] text-white/25">{note.length}/200</span>
          </div>
          <textarea
            value={note}
            onChange={e => {
              if (e.target.value.length <= 200) setNote(e.target.value)
            }}
            maxLength={200}
            rows={3}
            placeholder="Visible to player only, not parents"
            className="w-full px-4 py-3 rounded-[10px] bg-[#0d0d0f] border border-white/[0.07] text-sm text-white/88 outline-none resize-none placeholder:text-white/20"
          />
        </div>

        {/* ---- 9. save button ---- */}
        <button
          onClick={handleSave}
          disabled={!playerId || saving}
          className="w-full py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Saving...' : 'Save Assessment \u2192'}
        </button>
      </div>

      {/* ---- 10. bottom nav ---- */}
      <NavBar role="coach" activeTab="/coach/assess" onNavigate={p => navigate(p)} />
    </MobileShell>
  )
}
