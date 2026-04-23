import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ArrowLeft, Pencil, Check, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

type PassportVisibility = 'coach_only' | 'link'

const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Name is too short' })
  .max(80, { message: 'Name must be under 80 characters' })

const STORAGE_KEY = 'trak.settings.v1'

interface LocalSettings {
  notifyAssessment: boolean
  notifyRecognition: boolean
  notifyWeeklyTip: boolean
  notifyMeetingRequest: boolean
  notifyPlayerNeedsAttention: boolean
  notifyChildAssessment: boolean
  notifyChildRecognition: boolean
  notifyChildAlert: boolean
  passportVisibility: PassportVisibility
  showInClubOverview: boolean
}

const DEFAULTS: LocalSettings = {
  notifyAssessment: true,
  notifyRecognition: true,
  notifyWeeklyTip: true,
  notifyMeetingRequest: true,
  notifyPlayerNeedsAttention: true,
  notifyChildAssessment: true,
  notifyChildRecognition: true,
  notifyChildAlert: true,
  passportVisibility: 'coach_only',
  showInClubOverview: true,
}

function loadLocal(): LocalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<LocalSettings>(loadLocal)

  useEffect(() => {
    if (profile?.full_name) setNameDraft(profile.full_name)
  }, [profile?.full_name])

  const persist = (next: LocalSettings) => {
    setSettings(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const saveName = async () => {
    if (!user || !profile) return
    const parsed = nameSchema.safeParse(nameDraft)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: parsed.data })
      .eq('user_id', user.id)
    setSaving(false)
    if (error) {
      toast.error('Could not save name')
      return
    }
    toast.success('Name updated')
    setEditingName(false)
  }

  const changePassword = async () => {
    if (!user?.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email)
    if (error) toast.error('Could not send reset email')
    else toast.success('Password reset email sent')
  }

  const deleteAccount = () => {
    toast('Contact support to permanently delete your account', {
      description: 'For your safety, account deletion is handled manually.',
    })
  }

  const role = profile?.role

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-[430px] px-5 pt-5 pb-12">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6 h-10">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: '#101012', border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.88)',
            }}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.88)' }}>
            Settings
          </h1>
        </div>

        {/* Account */}
        <Section label="Account">
          <Row
            label="Display name"
            right={
              editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                    style={{
                      background: '#202024',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.88)',
                      width: 160,
                    }}
                  />
                  <button onClick={saveName} disabled={saving} aria-label="Save" style={{ color: '#C8F25A' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => { setEditingName(false); setNameDraft(profile?.full_name || '') }} aria-label="Cancel" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex items-center gap-2"
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}
                >
                  {profile?.full_name || '—'}
                  <Pencil size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                </button>
              )
            }
          />
          <Row label="Email" right={<Value>{user?.email || '—'}</Value>} />
          <Row
            label="Password"
            right={
              <button onClick={changePassword} style={{ fontSize: 13, color: '#C8F25A' }}>
                Send reset email
              </button>
            }
          />
        </Section>

        {/* Connections (player only) */}
        {role === 'player' && (
          <Section label="Connections">
            <Row
              label="Connected coach"
              right={
                <ConnectionPill name="Not connected" onRemove={() => toast('No connection to remove')} />
              }
            />
            <Row
              label="Connected parent"
              right={
                <ConnectionPill name="Not connected" onRemove={() => toast('No connection to remove')} />
              }
            />
            <button
              onClick={() => toast('Open the relevant invite flow from your profile')}
              className="mt-1 flex items-center gap-1.5"
              style={{ fontSize: 13, color: '#C8F25A' }}
            >
              <Plus size={12} /> Add connection
            </button>
          </Section>
        )}

        {/* Notifications */}
        <Section label="Notifications">
          <ToggleRow
            label="New coach assessment"
            value={settings.notifyAssessment}
            onChange={v => persist({ ...settings, notifyAssessment: v })}
          />
          <ToggleRow
            label="Recognition awarded"
            value={settings.notifyRecognition}
            onChange={v => persist({ ...settings, notifyRecognition: v })}
          />
          <ToggleRow
            label="Weekly tip"
            value={settings.notifyWeeklyTip}
            onChange={v => persist({ ...settings, notifyWeeklyTip: v })}
          />
        </Section>

        {/* Privacy */}
        <Section label="Privacy">
          <Row
            label="Who can see my passport"
            right={
              <Segmented
                value={settings.passportVisibility}
                options={[
                  { value: 'coach_only', label: 'Coach only' },
                  { value: 'link', label: 'Anyone with link' },
                ]}
                onChange={v => persist({ ...settings, passportVisibility: v as PassportVisibility })}
              />
            }
            stack
          />
          <ToggleRow
            label="Show my name in club overview"
            value={settings.showInClubOverview}
            onChange={v => persist({ ...settings, showInClubOverview: v })}
          />
        </Section>

        {/* Sign out */}
        <button
          onClick={async () => {
            await signOut()
            navigate('/', { replace: true })
          }}
          className="w-full py-3 rounded-lg mt-2"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.78)',
            fontSize: 13,
          }}
        >
          Sign out
        </button>

        {/* Danger zone */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={deleteAccount}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(220,80,80,0.55)',
            }}
          >
            Delete my account
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------- atoms ------- */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.22)',
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        className="px-4"
        style={{
          background: '#101012',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Row({ label, right, stack = false }: { label: string; right: React.ReactNode; stack?: boolean }) {
  return (
    <div
      className={`py-3.5 ${stack ? 'flex flex-col gap-2' : 'flex items-center justify-between gap-3'}`}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        {label}
      </div>
      <div className={stack ? '' : 'flex items-center'}>{right}</div>
    </div>
  )
}

function Value({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>{children}</span>
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row
      label={label}
      right={
        <button
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          style={{
            position: 'relative',
            width: 38,
            height: 22,
            borderRadius: 999,
            background: value ? '#C8F25A' : 'rgba(255,255,255,0.1)',
            transition: 'background 150ms ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: value ? 18 : 2,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: value ? '#000' : '#0A0A0B',
              transition: 'left 150ms ease',
            }}
          />
        </button>
      }
    />
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div
      className="inline-flex p-1 rounded-full"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="px-3 py-1 rounded-full"
            style={{
              fontSize: 11,
              color: active ? '#000' : 'rgba(255,255,255,0.55)',
              background: active ? '#C8F25A' : 'transparent',
              transition: 'all 150ms ease',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function ConnectionPill({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>{name}</span>
      <button
        onClick={onRemove}
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        Remove
      </button>
    </div>
  )
}
