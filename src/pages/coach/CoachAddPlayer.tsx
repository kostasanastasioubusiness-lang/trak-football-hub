import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, PillSelector, MetadataLabel } from '@/components/trak'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { AGE_GROUPS } from '@/lib/constants'

export default function CoachAddPlayer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [shirtNumber, setShirtNumber] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user || !name || saving) return
    setSaving(true)
    const { error } = await supabase.from('squad_players').insert({
      coach_user_id: user.id,
      player_name: name,
      position: position || null,
      shirt_number: shirtNumber ? Number(shirtNumber) : null,
      age_group: ageGroup || null,
      status: 'active',
    } as any)
    setSaving(false)
    if (error) {
      toast.error(`Couldn't add player: ${error.message}`)
      return
    }
    toast.success(`${name} added to squad`)
    navigate('/coach/squad')
  }

  return (
    <MobileShell>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 py-3 -mx-5 px-5"
        style={{ background: 'rgba(10,10,11,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/coach/squad')}
          className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#17171a] border border-white/[0.11]">
          <ChevronLeft size={16} className="text-white/70" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-semibold text-white/90 -ml-[34px] pointer-events-none">Add Player</h1>
      </div>

      <div className="pt-6 pb-4 space-y-6">

        <div className="space-y-2">
          <MetadataLabel text="PLAYER NAME" />
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none focus:border-[#C8F25A]/30" />
        </div>

        <PillSelector label="Position" options={[
          { label: 'GK', value: 'Goalkeeper' }, { label: 'DEF', value: 'Defender' },
          { label: 'MID', value: 'Midfielder' }, { label: 'ATT', value: 'Attacker' },
        ]} value={position} onChange={setPosition} />

        {/* Age groups come from the shared constant. This screen used to carry
            its own U7–U19+ list, so a coach could add a U11 player that signup
            never offers — which is how U11 data exists in an app that starts
            at U13. */}
        <PillSelector label="Age Group" options={AGE_GROUPS.map(g => ({ label: g, value: g }))} value={ageGroup} onChange={setAgeGroup} />

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
