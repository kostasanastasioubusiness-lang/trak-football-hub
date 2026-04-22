import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell } from '@/components/trak'
import { SliderInput } from '@/components/trak/SliderInput'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'
import type { BandType } from '@/lib/types'
import { trackEvent } from '@/lib/telemetry'
import { ChevronLeft, Check, MessageSquare } from 'lucide-react'

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

/* ========== main page ========== */

export default function CoachQuickAssess() {
  const { user } = useAuth()
  const navigate = useNavigate()

  /* --- squad data --- */
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  /* --- current index + tracking --- */
  const [currentIdx, setCurrentIdx] = useState(0)
  const [assessedIds, setAssessedIds] = useState<Set<string>>(new Set())
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())

  /* --- slider state --- */
  const [consistency, setConsistency] = useState(5)
  const [impact, setImpact] = useState(5)
  const [workrate, setWorkrate] = useState(5)
  const [technique, setTechnique] = useState(5)
  const [spirit, setSpirit] = useState(5)

  /* --- note --- */
  const [note, setNote] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)

  /* --- saving --- */
  const [saving, setSaving] = useState(false)

  /* --- completion --- */
  const isComplete = currentIdx >= players.length && players.length > 0

  /* fetch squad players sorted by oldest assessment first, unassessed at top */
  useEffect(() => {
    if (!user) return
    ;(async () => {
      setLoading(true)
      // Get all squad players
      const { data: squadPlayers } = await supabase
        .from('squad_players')
        .select('*')
        .eq('coach_user_id', user.id)
        .order('player_name')

      if (!squadPlayers || squadPlayers.length === 0) {
        setPlayers([])
        setLoading(false)
        return
      }

      // Get latest assessment date per player
      const { data: latestAssessments } = await supabase
        .from('coach_assessments')
        .select('squad_player_id, created_at')
        .eq('coach_user_id', user.id)
        .order('created_at', { ascending: false })

      // Build a map: squad_player_id -> latest assessment date
      const lastAssessedMap = new Map<string, string>()
      latestAssessments?.forEach(a => {
        if (!lastAssessedMap.has(a.squad_player_id)) {
          lastAssessedMap.set(a.squad_player_id, a.created_at)
        }
      })

      // Sort: unassessed first, then by oldest assessment
      const sorted = [...squadPlayers].sort((a, b) => {
        const dateA = lastAssessedMap.get(a.id)
        const dateB = lastAssessedMap.get(b.id)
        if (!dateA && !dateB) return a.player_name.localeCompare(b.player_name)
        if (!dateA) return -1
        if (!dateB) return 1
        return new Date(dateA).getTime() - new Date(dateB).getTime()
      })

      setPlayers(sorted)
      setLoading(false)
    })()
  }, [user])

  /* --- computed --- */
  const avg = (consistency + impact + workrate + technique + spirit) / 5
  const band = scoreToBand(avg)
  const overallCfg = bandConfig(band)
  const currentPlayer = players[currentIdx] ?? null
  const total = players.length
  const displayIdx = Math.min(currentIdx + 1, total)

  /* --- reset sliders for new player --- */
  const resetSliders = () => {
    setConsistency(5)
    setImpact(5)
    setWorkrate(5)
    setTechnique(5)
    setSpirit(5)
    setNote('')
    setNoteOpen(false)
  }

  /* --- advance to next player --- */
  const advance = () => {
    resetSliders()
    setCurrentIdx(prev => prev + 1)
  }

  /* --- save assessment --- */
  const handleNext = async () => {
    if (!user || !currentPlayer || saving) return
    setSaving(true)

    await supabase.from('coach_assessments').insert([{
      coach_user_id: user.id,
      squad_player_id: currentPlayer.id,
      session_id: null,
      appearance: 'training',
      consistency,
      impact,
      workrate,
      technique,
      spirit,
      coach_rating: Math.round(avg * 10) / 10,
      private_note: note || null,
    } as any])

    setAssessedIds(prev => new Set(prev).add(currentPlayer.id))
    setSaving(false)
    advance()
  }

  /* --- skip --- */
  const handleSkip = () => {
    if (!currentPlayer) return
    setSkippedIds(prev => new Set(prev).add(currentPlayer.id))
    advance()
  }

  /* --- fire telemetry on completion --- */
  useEffect(() => {
    if (isComplete && players.length > 0) {
      trackEvent('quick_assess_completed', {
        assessed: assessedIds.size,
        skipped: skippedIds.size,
      })
    }
  }, [isComplete])

  /* --- progress bar width --- */
  const progressPct = total > 0 ? (currentIdx / total) * 100 : 0

  /* ---- render ---- */
  if (loading) {
    return (
      <MobileShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-6 h-6 border-2 border-[#C8F25A] border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    )
  }

  if (players.length === 0) {
    return (
      <MobileShell>
        <div className="pt-6 space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#17171a] border border-white/[0.11]"
            >
              <ChevronLeft size={16} className="text-white/70" />
            </button>
            <h1 className="flex-1 text-center text-[17px] font-semibold text-white/90 -ml-[34px]">
              Quick Assess
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[15px] text-white/60">No players in your squad yet.</p>
            <button
              onClick={() => navigate('/coach/squad/add')}
              className="px-5 py-2.5 rounded-[10px] bg-[#C8F25A] text-black text-sm font-bold"
            >
              Add Players
            </button>
          </div>
        </div>
      </MobileShell>
    )
  }

  /* ---- completion screen ---- */
  if (isComplete) {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-5 px-4">
          {/* Checkmark */}
          <div
            className="flex items-center justify-center w-[72px] h-[72px] rounded-full"
            style={{
              background: 'rgba(200,242,90,0.12)',
              border: '2px solid rgba(200,242,90,0.3)',
            }}
          >
            <Check size={36} style={{ color: '#C8F25A' }} />
          </div>

          <h2
            className="text-[24px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'DM Sans', sans-serif" }}
          >
            All done!
          </h2>

          <p
            className="text-[14px] text-center"
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif" }}
          >
            {assessedIds.size} assessed, {skippedIds.size} skipped
          </p>

          <button
            onClick={() => navigate('/coach/home')}
            className="w-full max-w-[280px] py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </MobileShell>
    )
  }

  /* ---- main assessment flow ---- */
  return (
    <MobileShell>
      <div className="pb-10 space-y-4">
        {/* ---- 1. Top bar ---- */}
        <div className="flex items-center gap-3 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#17171a] border border-white/[0.11]"
          >
            <ChevronLeft size={16} className="text-white/70" />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold text-white/90">
            Quick Assess
          </h1>
          <span
            className="text-[13px] font-medium w-[34px] text-right"
            style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.35)' }}
          >
            {displayIdx}/{total}
          </span>
        </div>

        {/* ---- 2. Progress bar ---- */}
        <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: '#C8F25A' }}
          />
        </div>

        {/* ---- 3. Player card ---- */}
        {currentPlayer && (
          <div
            className="flex items-center gap-3.5 p-4 rounded-[14px] border border-white/[0.06]"
            style={{ background: '#101012' }}
          >
            {/* Initials avatar */}
            <div
              className="flex items-center justify-center w-[48px] h-[48px] rounded-[14px] text-[15px] font-bold shrink-0"
              style={{ background: '#202024', color: '#C8F25A' }}
            >
              {initials(currentPlayer.player_name)}
            </div>
            <div className="min-w-0">
              <p
                className="text-[18px] font-medium truncate"
                style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'DM Sans', sans-serif" }}
              >
                {currentPlayer.player_name}
              </p>
              <p
                className="text-[11px] mt-0.5 truncate"
                style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.35)' }}
              >
                {currentPlayer.position?.toUpperCase() ?? 'Player'}
                {currentPlayer.squad_number ? ` \u00B7 #${currentPlayer.squad_number}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* ---- 4. Sliders ---- */}
        <div className="rounded-[14px] bg-[rgba(0,0,0,0.25)] p-[14px_16px] space-y-5">
          <SliderInput label="Consistency" value={consistency} onChange={setConsistency} />
          <SliderInput label="Impact"      value={impact}      onChange={setImpact} />
          <SliderInput label="Workrate"    value={workrate}    onChange={setWorkrate} />
          <SliderInput label="Technique"   value={technique}   onChange={setTechnique} />
          <SliderInput label="Spirit"      value={spirit}      onChange={setSpirit} />
        </div>

        {/* ---- 5. Overall band preview ---- */}
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-[12px]"
          style={{
            background: overallCfg.bg,
            border: `1px solid ${overallCfg.border}`,
            boxShadow: `0 0 20px ${overallCfg.bg}`,
          }}
        >
          <span
            className="text-[9px] font-medium tracking-[0.12em] uppercase"
            style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.4)' }}
          >
            OVERALL
          </span>
          <div className="flex items-center gap-2.5">
            <span
              className="text-[14px] font-semibold"
              style={{ color: overallCfg.color }}
            >
              {overallCfg.word}
            </span>
            <span className="text-[13px] text-white/40 font-medium">
              {(Math.round(avg * 10) / 10).toFixed(1)}
            </span>
          </div>
        </div>

        {/* ---- 6. Optional note ---- */}
        {!noteOpen ? (
          <button
            onClick={() => setNoteOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-white/[0.06] text-white/35 text-[12px] font-medium w-full"
            style={{ background: 'transparent' }}
          >
            <MessageSquare size={14} className="text-white/25" />
            Add note
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span
                className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/45"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                NOTE
              </span>
              <span className="text-[10px] text-white/25">{note.length}/200</span>
            </div>
            <textarea
              value={note}
              onChange={e => {
                if (e.target.value.length <= 200) setNote(e.target.value)
              }}
              maxLength={200}
              rows={2}
              autoFocus
              placeholder="Quick note about this player..."
              className="w-full px-4 py-3 rounded-[10px] bg-[#0d0d0f] border border-white/[0.07] text-sm text-white/88 outline-none resize-none placeholder:text-white/20"
            />
          </div>
        )}

        {/* ---- 7. Action buttons ---- */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSkip}
            className="flex-1 py-3.5 rounded-[10px] text-sm font-semibold transition-opacity active:scale-[0.97]"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-[2] py-3.5 rounded-[10px] text-sm font-bold transition-opacity active:scale-[0.97] disabled:opacity-40"
            style={{ background: '#C8F25A', color: '#000' }}
          >
            {saving ? 'Saving...' : 'Next \u2192'}
          </button>
        </div>
      </div>
    </MobileShell>
  )
}
