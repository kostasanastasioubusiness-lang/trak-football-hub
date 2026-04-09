import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, PillSelector, MetadataLabel } from '@/components/trak'
import { ChevronLeft } from 'lucide-react'

export default function CoachAddPlayer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [shirtNumber, setShirtNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user || !name || saving) return
    setSaving(true)
    await supabase.from('squad_players').insert({
      coach_user_id: user.id,
      player_name: name,
      position: position || null,
      shirt_number: shirtNumber ? Number(shirtNumber) : null,
    })
    navigate('/coach/squad')
  }

  return (
    <MobileShell>
      <div className="pt-8 pb-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/45 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-light text-white/88">Add Player</h1>

        <div className="space-y-2">
          <MetadataLabel text="PLAYER NAME" />
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none focus:border-[#C8F25A]/30" />
        </div>

        <PillSelector label="Position" options={[
          { label: 'GK', value: 'Goalkeeper' }, { label: 'DEF', value: 'Defender' },
          { label: 'MID', value: 'Midfielder' }, { label: 'ATT', value: 'Attacker' },
        ]} value={position} onChange={setPosition} />

        <div className="space-y-2">
          <MetadataLabel text="SHIRT NUMBER" />
          <input type="number" min={1} max={99} value={shirtNumber} onChange={e => setShirtNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none focus:border-[#C8F25A]/30" />
        </div>

        <button onClick={handleSave} disabled={!name || saving}
          className="w-full py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm disabled:opacity-50">
          {saving ? 'Adding...' : 'Add to Squad'}
        </button>
      </div>
    </MobileShell>
  )
}
