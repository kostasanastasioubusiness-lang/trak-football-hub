import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { MobileShell, BandPill, MetadataLabel, NavBar } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'
import { ChevronLeft } from 'lucide-react'

export default function PlayerMatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [match, setMatch] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    supabase.from('matches').select('*').eq('id', id).single().then(({ data }) => setMatch(data))
  }, [id])

  if (!match) return (
    <MobileShell>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#C8F25A] border-t-transparent rounded-full animate-spin" />
      </div>
    </MobileShell>
  )

  const band = scoreToBand(match.computed_rating || 6.5)
  const bandConfig = BANDS.find(b => b.word.toLowerCase() === band)!
  const resultLabel = match.team_score > match.opponent_score ? 'W'
    : match.team_score < match.opponent_score ? 'L' : 'D'
  const resultColor = resultLabel === 'W' ? '#4ade80' : resultLabel === 'L' ? '#f87171' : '#60a5fa'
  const formattedDate = new Date(match.created_at).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <MobileShell>
      <div className="pt-6 pb-24 space-y-3">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#17171a] border border-white/[0.11] mb-2">
          <ChevronLeft size={16} className="text-white/70" />
        </button>

        {/* Hero card: result + band */}
        <div className="relative rounded-[24px] p-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #101012 0%, #0f0f12 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="absolute -bottom-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,242,90,0.08) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <MetadataLabel text={formattedDate} />
            <div className="flex items-start justify-between mt-2">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[48px] font-light text-white/88 leading-none"
                    style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.04em' }}>
                    {match.team_score}–{match.opponent_score}
                  </span>
                  <span className="text-[20px] font-semibold" style={{ color: resultColor }}>{resultLabel}</span>
                </div>
                {match.opponent && (
                  <p className="text-[11px] text-white/35 mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                    vs {match.opponent}
                  </p>
                )}
              </div>
              <BandPill band={band} />
            </div>
          </div>
        </div>

        {/* Match info */}
        <div className="rounded-[18px] p-4 space-y-3"
          style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MetadataLabel text="MATCH INFO" />
          {[
            { label: 'Competition', value: match.competition },
            { label: 'Venue', value: match.venue },
            { label: 'Position', value: match.position },
            { label: 'Age Group', value: match.age_group },
            { label: 'Minutes', value: `${match.minutes_played}'` },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[11px] text-white/35" style={{ fontFamily: "'DM Mono', monospace" }}>
                {row.label}
              </span>
              <span className="text-[13px] text-white/88">{row.value || '—'}</span>
            </div>
          ))}
        </div>

        {/* Goal contributions */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Goals', value: match.goals ?? 0 },
            { label: 'Assists', value: match.assists ?? 0 },
          ].map(stat => (
            <div key={stat.label} className="rounded-[14px] py-4 px-3 text-center"
              style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[28px] font-light text-white/88 leading-none"
                style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.03em' }}>{stat.value}</p>
              <span className="text-[9px] text-white/35 mt-1.5 block"
                style={{ fontFamily: "'DM Mono', monospace" }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div className="rounded-[18px] p-4"
          style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MetadataLabel text="RATING" />
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-[36px] font-light leading-none"
                style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.04em' }}>
                <span style={{ color: bandConfig.color }}>
                  {(match.computed_rating || 6.5).toFixed(1)}
                </span>
              </p>
              <p className="text-[11px] text-white/35 mt-1"
                style={{ fontFamily: "'DM Mono', monospace" }}>Computed rating</p>
            </div>
            <div className="text-right">
              <BandPill band={band} />
              {match.self_rating && (
                <p className="text-[9px] text-white/22 mt-2 tracking-[0.04em]"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  Self: {match.self_rating}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Condition */}
        {(match.body_condition || (match.card_received && match.card_received !== 'None')) && (
          <div className="rounded-[18px] p-4 space-y-2.5"
            style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>
            <MetadataLabel text="CONDITION" />
            {match.body_condition && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-white/35" style={{ fontFamily: "'DM Mono', monospace" }}>Body</span>
                <span className="text-[13px] text-white/88 capitalize">{match.body_condition}</span>
              </div>
            )}
            {match.card_received && match.card_received !== 'None' && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/35" style={{ fontFamily: "'DM Mono', monospace" }}>Card</span>
                <span className="text-[13px] font-medium"
                  style={{ color: match.card_received === 'Red' ? '#f87171' : '#fbbf24' }}>
                  {match.card_received} card
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </MobileShell>
  )
}
