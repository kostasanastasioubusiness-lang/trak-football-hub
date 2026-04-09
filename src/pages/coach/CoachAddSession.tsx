import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, PillSelector, MetadataLabel } from '@/components/trak'
import { ChevronLeft } from 'lucide-react'

export default function CoachAddSession() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('training')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user || !title || saving) return
    setSaving(true)
    await supabase.from('coach_sessions').insert({
      coach_user_id: user.id,
      title,
      session_type: type,
      session_date: date,
      notes: notes || null,
    })
    navigate('/coach/sessions')
  }

  return (
    <MobileShell>
      <div className="pt-8 pb-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/45 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-light text-white/88">Add Session</h1>

        <div className="space-y-2">
          <MetadataLabel text="TITLE" />
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none" />
        </div>

        <PillSelector label="Type" options={[
          { label: 'Training', value: 'training' }, { label: 'Match', value: 'match' }, { label: 'Other', value: 'other' },
        ]} value={type} onChange={setType} />

        <div className="space-y-2">
          <MetadataLabel text="DATE" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none" />
        </div>

        <div className="space-y-2">
          <MetadataLabel text="NOTES" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full px-4 py-3 rounded-[10px] bg-[#202024] border border-white/[0.07] text-sm text-white/88 outline-none resize-none" />
        </div>

        <button onClick={handleSave} disabled={!title || saving}
          className="w-full py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Session'}
        </button>
      </div>
    </MobileShell>
  )
}
