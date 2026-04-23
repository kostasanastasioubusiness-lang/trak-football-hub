import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Image as ImageIcon, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'

type ParsedEvent = {
  title: string
  event_type: 'match' | 'training' | 'tournament' | 'other'
  starts_at: string
  ends_at?: string
  venue?: string
  opponent?: string
  notes?: string
}

type SavedEvent = ParsedEvent & {
  id: string
  published: boolean
}

const EVENT_LABELS: Record<string, string> = {
  match: 'Match', training: 'Training', tournament: 'Tournament', other: 'Other',
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

async function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return { base64: btoa(binary), mime: file.type || 'image/jpeg' }
}

export default function CoachSchedule() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [drafts, setDrafts] = useState<ParsedEvent[]>([])
  const [events, setEvents] = useState<SavedEvent[]>([])

  const loadEvents = async () => {
    if (!user) return
    const { data } = await supabase
      .from('coach_calendar_events')
      .select('*')
      .eq('coach_user_id', user.id)
      .order('starts_at', { ascending: true })
    setEvents((data as any) || [])
  }

  useEffect(() => { loadEvents() }, [user])

  const parse = async () => {
    if (!text.trim() && !imageFile) {
      toast.error('Paste schedule text or attach an image')
      return
    }
    setParsing(true)
    try {
      const body: any = { text, todayISO: new Date().toISOString().slice(0, 10) }
      if (imageFile) {
        const { base64, mime } = await fileToBase64(imageFile)
        body.imageBase64 = base64
        body.imageMimeType = mime
      }
      const { data, error } = await supabase.functions.invoke('parse-schedule', { body })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const list = (data?.events || []) as ParsedEvent[]
      if (!list.length) {
        toast.error('No events found. Try clearer dates/times.')
      } else {
        setDrafts(list)
        toast.success(`Found ${list.length} event${list.length === 1 ? '' : 's'}`)
      }
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Could not parse schedule')
    } finally {
      setParsing(false)
    }
  }

  const saveDraft = async (idx: number) => {
    if (!user) return
    const ev = drafts[idx]
    const { error } = await supabase.from('coach_calendar_events').insert({
      coach_user_id: user.id,
      title: ev.title,
      event_type: ev.event_type,
      starts_at: ev.starts_at,
      ends_at: ev.ends_at || null,
      venue: ev.venue || null,
      opponent: ev.opponent || null,
      notes: ev.notes || null,
      published: false,
      source: imageFile ? 'ai_image' : 'ai_text',
    })
    if (error) { toast.error('Could not save'); return }
    setDrafts(d => d.filter((_, i) => i !== idx))
    loadEvents()
    toast.success('Saved (unpublished)')
  }

  const saveAllDrafts = async () => {
    if (!user || !drafts.length) return
    const rows = drafts.map(ev => ({
      coach_user_id: user.id,
      title: ev.title,
      event_type: ev.event_type,
      starts_at: ev.starts_at,
      ends_at: ev.ends_at || null,
      venue: ev.venue || null,
      opponent: ev.opponent || null,
      notes: ev.notes || null,
      published: false,
      source: imageFile ? 'ai_image' : 'ai_text',
    }))
    const { error } = await supabase.from('coach_calendar_events').insert(rows)
    if (error) { toast.error('Could not save'); return }
    setDrafts([])
    setText('')
    setImageFile(null)
    loadEvents()
    toast.success(`Saved ${rows.length} events`)
  }

  const togglePublish = async (ev: SavedEvent) => {
    const { error } = await supabase
      .from('coach_calendar_events')
      .update({ published: !ev.published })
      .eq('id', ev.id)
    if (error) { toast.error('Could not update'); return }
    loadEvents()
    toast.success(!ev.published ? 'Published to squad' : 'Unpublished')
  }

  const removeEvent = async (id: string) => {
    const { error } = await supabase.from('coach_calendar_events').delete().eq('id', id)
    if (error) { toast.error('Could not delete'); return }
    loadEvents()
  }

  return (
    <MobileShell>
      <div className="pt-3 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label="Back"
          >
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
          </button>
          <div>
            <p className="text-[9px] tracking-[0.12em] uppercase" style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
              AI · Schedule
            </p>
            <h1 className="text-[22px] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: 'rgba(255,255,255,0.88)' }}>
              Smart Calendar
            </h1>
          </div>
        </div>

        <div className="rounded-[18px] border border-white/[0.07] p-4 mb-4" style={{ background: '#101012' }}>
          <MetadataLabel text="PASTE OR UPLOAD" />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"e.g.\nTraining Tue 6pm at the academy\nMatch vs PAOK Sat 4pm at Stadio Panetolikos\nTournament next weekend in Athens"}
            rows={6}
            className="w-full mt-2 rounded-[12px] p-3 text-[13px] outline-none"
            style={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)', fontFamily: "'DM Sans', sans-serif" }}
          />

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <label
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <ImageIcon size={12} color="rgba(255,255,255,0.6)" />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {imageFile ? imageFile.name.slice(0, 24) : 'Add photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
              />
            </label>
            {imageFile && (
              <button
                onClick={() => setImageFile(null)}
                className="text-[10px] px-2 py-1 rounded-full"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Remove
              </button>
            )}
            <button
              onClick={parse}
              disabled={parsing}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full"
              style={{
                background: parsing ? 'rgba(200,242,90,0.4)' : '#C8F25A',
                color: '#000',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Sparkles size={12} />
              {parsing ? 'Parsing…' : 'Parse with AI'}
            </button>
          </div>
        </div>

        {drafts.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <MetadataLabel text={`DRAFTS · ${drafts.length}`} />
              <button
                onClick={saveAllDrafts}
                className="text-[10px] tracking-[0.1em] uppercase"
                style={{ fontFamily: "'DM Mono', monospace", color: '#C8F25A' }}
              >
                Save all
              </button>
            </div>
            <div className="space-y-2">
              {drafts.map((ev, i) => (
                <div
                  key={i}
                  className="rounded-[14px] p-3.5 border"
                  style={{ background: 'rgba(200,242,90,0.04)', borderColor: 'rgba(200,242,90,0.18)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>{ev.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {formatWhen(ev.starts_at)} · {EVENT_LABELS[ev.event_type] || ev.event_type}
                      </p>
                      {(ev.venue || ev.opponent) && (
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {ev.opponent ? `vs ${ev.opponent}` : ''}{ev.opponent && ev.venue ? ' · ' : ''}{ev.venue || ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => saveDraft(i)} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: '#C8F25A', color: '#000', fontWeight: 600 }}>
                        Save
                      </button>
                      <button onClick={() => setDrafts(d => d.filter((_, idx) => idx !== i))} aria-label="Discard">
                        <Trash2 size={14} color="rgba(255,255,255,0.4)" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <MetadataLabel text={`CALENDAR · ${events.length}`} />
        <div className="mt-2 space-y-2">
          {events.length === 0 && (
            <div className="rounded-[14px] border border-white/[0.07] p-6 text-center" style={{ background: '#101012' }}>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>No events yet. Paste a schedule above.</p>
            </div>
          )}
          {events.map(ev => (
            <div key={ev.id} className="rounded-[14px] p-3.5 border border-white/[0.07]" style={{ background: '#101012' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>{ev.title}</p>
                    <span
                      className="text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        background: ev.published ? 'rgba(200,242,90,0.1)' : 'rgba(255,255,255,0.05)',
                        color: ev.published ? '#C8F25A' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {ev.published ? 'Published' : 'Private'}
                    </span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {formatWhen(ev.starts_at)} · {EVENT_LABELS[ev.event_type] || ev.event_type}
                  </p>
                  {(ev.venue || ev.opponent) && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {ev.opponent ? `vs ${ev.opponent}` : ''}{ev.opponent && ev.venue ? ' · ' : ''}{ev.venue || ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(ev)} aria-label={ev.published ? 'Unpublish' : 'Publish'}>
                    {ev.published ? <EyeOff size={14} color="rgba(255,255,255,0.5)" /> : <Eye size={14} color="#C8F25A" />}
                  </button>
                  <button onClick={() => removeEvent(ev.id)} aria-label="Delete">
                    <Trash2 size={14} color="rgba(255,255,255,0.4)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <NavBar role="coach" activeTab="/coach/home" onNavigate={p => navigate(p)} />
    </MobileShell>
  )
}