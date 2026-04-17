import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, PillSelector, BandPreview, MetadataLabel, NavBar } from '@/components/trak'
import { computeMatchScore, scoreToBand } from '@/lib/rating-engine'
import { trackEvent } from '@/lib/telemetry'
import type { MatchInput, Position, Competition, Venue, CardType, BodyCondition, SelfRating } from '@/lib/types'

const GK_FIELDS = [
  { id: 'clean_sheet', label: 'Clean Sheet', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
  { id: 'saves', label: 'Saves Made', options: [{ label: '0', value: '0' }, { label: '1-2', value: '1-2' }, { label: '3-4', value: '3-4' }, { label: '5+', value: '5+' }] },
  { id: 'distribution', label: 'Distribution', options: [{ label: 'Excellent', value: 'excellent' }, { label: 'Good', value: 'good' }, { label: 'Average', value: 'average' }, { label: 'Poor', value: 'poor' }] },
  { id: 'commanding', label: 'Commanding Presence', options: [{ label: 'Yes', value: 'yes' }, { label: 'Mostly', value: 'mostly' }, { label: 'No', value: 'no' }] },
  { id: 'errors', label: 'Errors Leading to Goal', options: [{ label: 'None', value: 'none' }, { label: '1', value: '1' }, { label: '2+', value: '2+' }] },
]

const DEF_FIELDS = [
  { id: 'duels', label: 'Duels Won', options: [{ label: 'Most', value: 'most' }, { label: 'About Half', value: 'about_half' }, { label: 'Few', value: 'few' }, { label: 'None', value: 'none' }] },
  { id: 'clearances', label: 'Clearances & Blocks', options: [{ label: 'Several', value: 'several' }, { label: 'Some', value: 'some' }, { label: 'None', value: 'none' }] },
  { id: 'aerial', label: 'Aerial Dominance', options: [{ label: 'Won Most', value: 'won_most' }, { label: 'Mixed', value: 'mixed' }, { label: 'Lost Most', value: 'lost_most' }] },
  { id: 'positioning', label: 'Held Position Well', options: [{ label: 'Yes', value: 'yes' }, { label: 'Mostly', value: 'mostly' }, { label: 'No', value: 'no' }] },
  { id: 'goals_conceded', label: 'Goals Conceded', options: [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3+', value: '3+' }] },
  { id: 'assists', label: 'Assists / Key Passes', options: [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2+', value: '2+' }] },
]

const MID_FIELDS = [
  { id: 'passes', label: 'Passes Completed', options: [{ label: 'Most', value: 'most' }, { label: 'About Half', value: 'about_half' }, { label: 'Few', value: 'few' }] },
  { id: 'chances_created', label: 'Chances Created', options: [{ label: '2+', value: '2+' }, { label: '1', value: '1' }, { label: 'None', value: 'none' }] },
  { id: 'pressing', label: 'Pressing & Recovery', options: [{ label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' }] },
  { id: 'assists', label: 'Assists', options: [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2+', value: '2+' }] },
  { id: 'goals', label: 'Goals', options: [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2+', value: '2+' }] },
  { id: 'tempo', label: 'Controlled Tempo', options: [{ label: 'Yes', value: 'yes' }, { label: 'Partly', value: 'partly' }, { label: 'No', value: 'no' }] },
]

const ATT_FIELDS = [
  { id: 'goals', label: 'Goals Scored', options: [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3+', value: '3+' }] },
  { id: 'assists', label: 'Assists', options: [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2+', value: '2+' }] },
  { id: 'shots_on_target', label: 'Shots on Target', options: [{ label: '0', value: '0' }, { label: '1-2', value: '1-2' }, { label: '3-4', value: '3-4' }, { label: '5+', value: '5+' }] },
  { id: 'attacking_threat', label: 'Attacking Threat', options: [{ label: 'Quiet', value: 'quiet' }, { label: 'Dangerous', value: 'dangerous' }, { label: 'Dominant', value: 'dominant' }] },
  { id: 'holdup_play', label: 'Hold-up & Link-up', options: [{ label: 'Good', value: 'good' }, { label: 'Average', value: 'average' }, { label: 'Poor', value: 'poor' }] },
  { id: 'pressing', label: 'Pressing', options: [{ label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' }] },
]

const POSITION_FIELDS: Record<string, typeof GK_FIELDS> = { gk: GK_FIELDS, def: DEF_FIELDS, mid: MID_FIELDS, att: ATT_FIELDS }

export default function PlayerLogForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [saving, setSaving] = useState(false)
  const [position, setPosition] = useState<Position>('att')
  const [competition, setCompetition] = useState<Competition>('league')
  const [venue, setVenue] = useState<Venue>('home')
  const [opponent, setOpponent] = useState('')
  const [scoreUs, setScoreUs] = useState('')
  const [scoreThem, setScoreThem] = useState('')
  const [minutes, setMinutes] = useState('')
  const [card, setCard] = useState<CardType>('none')
  const [body, setBody] = useState<BodyCondition>('good')
  const [selfRating, setSelfRating] = useState<SelfRating>('average')
  const [posInputs, setPosInputs] = useState<Record<string, string>>({})

  const isFriendly = competition === 'friendly'
  const filledCount = [position, competition, venue, opponent, scoreUs, scoreThem].filter(Boolean).length

  const buildMatchInput = (): MatchInput => ({
    position, competition, venue, opponent,
    score_us: Number(scoreUs) || 0, score_them: Number(scoreThem) || 0,
    minutes_played: Number(minutes) || 0, card, body_condition: body,
    self_rating: selfRating, position_inputs: posInputs, is_friendly: isFriendly,
  })

  const handleSave = async () => {
    if (!user || saving) return
    setSaving(true)
    const input = buildMatchInput()
    const computed = computeMatchScore(input)
    const band = scoreToBand(computed)

    const { data, error } = await supabase.from('matches').insert({
      user_id: user.id,
      position: position === 'gk' ? 'Goalkeeper' : position === 'def' ? 'Defender' : position === 'mid' ? 'Midfielder' : 'Attacker',
      competition: competition.charAt(0).toUpperCase() + competition.slice(1),
      venue: venue.charAt(0).toUpperCase() + venue.slice(1),
      team_score: Number(scoreUs) || 0,
      opponent_score: Number(scoreThem) || 0,
      age_group: 'U19+',
      minutes_played: Number(minutes) || 0,
      card_received: card === 'none' ? 'None' : card === 'yellow' ? 'Yellow' : 'Red',
      body_condition: body.charAt(0).toUpperCase() + body.slice(1),
      self_rating: selfRating.charAt(0).toUpperCase() + selfRating.slice(1),
      goals: Number(posInputs.goals?.replace('+', '')) || 0,
      assists: Number(posInputs.assists?.replace('+', '')) || 0,
      computed_rating: computed,
    }).select().single()

    if (data) {
      trackEvent('match_log', { match_id: data.id, band })
      navigate('/player/result', { state: { match: data, band, score: computed } })
    } else {
      console.error('Save error:', error)
      setSaving(false)
    }
  }

  const posFields = POSITION_FIELDS[position] || []

  return (
    <MobileShell>
      <div className="pt-8 pb-32 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/player/home')}
            className="p-2 -ml-2 rounded-full text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
            aria-label="Back to home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-2xl font-light text-[rgba(255,255,255,0.88)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Log Match</h1>
        </div>

        <PillSelector label="Position" options={[
          { label: 'GK', value: 'gk' }, { label: 'DEF', value: 'def' },
          { label: 'MID', value: 'mid' }, { label: 'ATT', value: 'att' },
        ]} value={position} onChange={v => { setPosition(v as Position); setPosInputs({}) }} />

        <PillSelector label="Competition" options={[
          { label: 'League', value: 'league' }, { label: 'Cup', value: 'cup' },
          { label: 'Tournament', value: 'tournament' }, { label: 'Friendly', value: 'friendly' },
        ]} value={competition} onChange={v => setCompetition(v as Competition)} />

        <PillSelector label="Venue" options={[
          { label: 'Home', value: 'home' }, { label: 'Away', value: 'away' },
        ]} value={venue} onChange={v => setVenue(v as Venue)} />

        <div className="space-y-2">
          <MetadataLabel text="OPPONENT" />
          <input type="text" value={opponent} onChange={e => setOpponent(e.target.value)}
            placeholder="e.g. Arsenal U18"
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-[rgba(255,255,255,0.88)] placeholder:text-white/22 outline-none focus:border-[#C8F25A]/30" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <MetadataLabel text="OUR SCORE" />
            <input type="number" min={0} max={20} value={scoreUs} onChange={e => setScoreUs(e.target.value)}
              className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-[rgba(255,255,255,0.88)] outline-none focus:border-[#C8F25A]/30" />
          </div>
          <div className="space-y-2">
            <MetadataLabel text="THEIR SCORE" />
            <input type="number" min={0} max={20} value={scoreThem} onChange={e => setScoreThem(e.target.value)}
              className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-[rgba(255,255,255,0.88)] outline-none focus:border-[#C8F25A]/30" />
          </div>
        </div>

        <div className="space-y-2">
          <MetadataLabel text="MINUTES PLAYED" />
          <input type="number" min={0} max={120} value={minutes} onChange={e => setMinutes(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-[rgba(255,255,255,0.88)] outline-none focus:border-[#C8F25A]/30" />
        </div>

        <PillSelector label="Card" options={[
          { label: 'None', value: 'none' }, { label: 'Yellow', value: 'yellow' }, { label: 'Red', value: 'red' },
        ]} value={card} onChange={v => setCard(v as CardType)} />

        <PillSelector label="Body Condition" options={[
          { label: 'Fresh', value: 'fresh' }, { label: 'Good', value: 'good' },
          { label: 'Tired', value: 'tired' }, { label: 'Knock', value: 'knock' },
        ]} value={body} onChange={v => setBody(v as BodyCondition)} />

        <PillSelector label="Self Rating" options={[
          { label: 'Poor', value: 'poor' }, { label: 'Average', value: 'average' },
          { label: 'Good', value: 'good' }, { label: 'Excellent', value: 'excellent' },
        ]} value={selfRating} onChange={v => setSelfRating(v as SelfRating)} />

        {posFields.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/[0.07]">
            <MetadataLabel text={`${position.toUpperCase()} SPECIFICS`} />
            {posFields.map(field => (
              <PillSelector key={field.id} label={field.label} options={field.options}
                value={posInputs[field.id] || ''} onChange={v => setPosInputs(prev => ({ ...prev, [field.id]: v }))} />
            ))}
          </div>
        )}

        <button onClick={handleSave} disabled={saving || !opponent}
          className="w-full py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm disabled:opacity-50 transition-opacity">
          {saving ? 'Saving...' : 'Save Match'}
        </button>
      </div>

      <BandPreview matchInput={buildMatchInput()} visible={filledCount >= 3} />
    </MobileShell>
  )
}
