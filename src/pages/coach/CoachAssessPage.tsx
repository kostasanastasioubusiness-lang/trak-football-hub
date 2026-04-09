import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, PillSelector, SliderInput, BandPill, MetadataLabel } from '@/components/trak'
import { scoreToBand } from '@/lib/rating-engine'
import { trackEvent } from '@/lib/telemetry'
import { ChevronLeft } from 'lucide-react'

export default function CoachAssessPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<any[]>([])
  const [playerId, setPlayerId] = useState('')
  const [appearance, setAppearance] = useState('started')
  const [workRate, setWorkRate] = useState(5)
  const [tactical, setTactical] = useState(5)
  const [attitude, setAttitude] = useState(5)
  const [technical, setTechnical] = useState(5)
  const [physical, setPhysical] = useState(5)
  const [coachability, setCoachability] = useState(5)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('squad_players').select('*').eq('coach_user_id', user.id)
      .order('player_name').then(({ data }) => setPlayers(data || []))
  }, [user])

  const avg = (workRate + tactical + attitude + technical + physical + coachability) / 6
  const band = scoreToBand(avg)

  const handleSave = async () => {
    if (!user || !playerId || saving) return
    setSaving(true)
    await supabase.from('coach_assessments').insert({
      coach_user_id: user.id,
      squad_player_id: playerId,
      appearance,
      work_rate: workRate,
      tactical,
      attitude,
      technical,
      physical,
      coachability,
      coach_rating: Math.round(avg * 10) / 10,
      private_note: note || null,
    })
    trackEvent('assessment', { player_id: playerId, band })
    navigate('/coach/home')
  }

  return (
    <MobileShell>
      <div className="pt-8 pb-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/45 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-light text-white/88">Assess Player</h1>

        <div className="space-y-2">
          <MetadataLabel text="PLAYER" />
          <select value={playerId} onChange={e => setPlayerId(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none">
            <option value="">Select player...</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.player_name}</option>)}
          </select>
        </div>

        <PillSelector label="Appearance" options={[
          { label: 'Started', value: 'started' }, { label: 'Sub', value: 'sub' }, { label: 'Training', value: 'training' },
        ]} value={appearance} onChange={setAppearance} />

        <div className="space-y-4">
          <SliderInput label="Work Rate" value={workRate} onChange={setWorkRate} />
          <SliderInput label="Tactical" value={tactical} onChange={setTactical} />
          <SliderInput label="Attitude" value={attitude} onChange={setAttitude} />
          <SliderInput label="Technical" value={technical} onChange={setTechnical} />
          <SliderInput label="Physical" value={physical} onChange={setPhysical} />
          <SliderInput label="Coachability" value={coachability} onChange={setCoachability} />
        </div>

        <div className="flex items-center justify-center py-2">
          <BandPill band={band} />
        </div>

        <div className="space-y-2">
          <MetadataLabel text="NOTE (PRIVATE)" />
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none resize-none" />
        </div>

        <button onClick={handleSave} disabled={!playerId || saving}
          className="w-full py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Submit Assessment'}
        </button>
      </div>
    </MobileShell>
  )
}
