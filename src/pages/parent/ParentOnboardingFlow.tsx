import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ArrowRight, Check, X } from 'lucide-react'
import { toast } from 'sonner'

const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^PAR-[A-Z0-9]{4}$/, { message: 'Code must look like PAR-XXXX' })

// Mock lookup — in production this would query parent_invites by code
const MOCK_INVITES: Record<string, { name: string; position: string; club: string }> = {
  'PAR-7X3M': { name: 'Nikos Kostas', position: 'Midfielder', club: 'Panetolikos FC' },
  'PAR-9K2L': { name: 'Andreas Papadakis', position: 'Forward', club: 'PAOK Academy' },
}

type Step = 'code' | 'confirmed'

export default function ParentOnboardingFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [child, setChild] = useState<{ name: string; position: string; club: string } | null>(null)

  const submitCode = () => {
    const parsed = codeSchema.safeParse(code)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    const found = MOCK_INVITES[parsed.data]
    if (!found) {
      toast.error('That code was not recognised')
      return
    }
    setChild(found)
    setStep('confirmed')
  }

  const createAccount = () => {
    // Hand off to existing parent onboarding so we don't touch auth logic
    navigate(`/parent-invite?code=${encodeURIComponent(code.trim().toUpperCase())}`)
  }

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full max-w-[430px] px-6 pt-12 pb-12 flex flex-col">
        {step === 'code' ? (
          <CodeStep
            code={code}
            setCode={setCode}
            onSubmit={submitCode}
          />
        ) : (
          <ConfirmedStep
            childName={child?.name ?? ''}
            position={child?.position ?? ''}
            club={child?.club ?? ''}
            onCreate={createAccount}
            onChangeCode={() => { setStep('code'); setChild(null) }}
          />
        )}
      </div>
    </div>
  )
}

/* ----- Step 1 ----- */

function CodeStep({
  code,
  setCode,
  onSubmit,
}: {
  code: string
  setCode: (v: string) => void
  onSubmit: () => void
}) {
  const [focused, setFocused] = useState(false)

  return (
    <>
      <Label>Parent access</Label>

      <h1
        className="mt-3"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          fontSize: 40,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'rgba(255,255,255,0.88)',
        }}
      >
        You've been invited.
      </h1>

      <Divider />

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        Your child shared a 6-character invite code with you. Enter it below to connect to their profile.
      </p>

      <input
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase().slice(0, 8))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit() }}
        maxLength={8}
        placeholder="PAR-7X3M"
        spellCheck={false}
        autoComplete="off"
        className="mt-8 w-full outline-none transition-colors"
        style={{
          background: '#202024',
          border: focused
            ? '1px solid #C8F25A'
            : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '20px 16px',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          fontSize: 22,
          textAlign: 'center',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.88)',
        }}
      />

      <button
        onClick={onSubmit}
        disabled={code.length < 4}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg transition"
        style={{
          background: code.length >= 4 ? '#C8F25A' : 'rgba(200,242,90,0.2)',
          color: '#000',
          fontSize: 14,
          fontWeight: 500,
          padding: '14px 20px',
          opacity: code.length >= 4 ? 1 : 0.5,
          cursor: code.length >= 4 ? 'pointer' : 'not-allowed',
        }}
      >
        Continue <ArrowRight size={14} />
      </button>

      <p
        className="mt-4 text-center"
        style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.35)' }}
      >
        Don't have a code? Ask your child to send you one from their Trak profile.
      </p>
    </>
  )
}

/* ----- Step 2 ----- */

function ConfirmedStep({
  childName,
  position,
  club,
  onCreate,
  onChangeCode,
}: {
  childName: string
  position: string
  club: string
  onCreate: () => void
  onChangeCode: () => void
}) {
  const firstName = childName.split(' ')[0]
  return (
    <>
      <Label>Code confirmed</Label>

      <h1
        className="mt-3"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          fontSize: 40,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'rgba(255,255,255,0.88)',
        }}
      >
        Follow {firstName}.
      </h1>

      <Divider />

      <div
        className="p-4"
        style={{
          background: '#101012',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
        }}
      >
        <Label>Connecting to</Label>
        <div className="mt-2" style={{ fontSize: 18, color: 'rgba(255,255,255,0.88)' }}>
          {childName}
        </div>
        <div className="mt-1" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          {position} · {club}
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        <Permission allowed text="Match results and performance bands" />
        <Permission allowed text="Coach assessments" />
        <Permission allowed text="Goals and progress" />
        <Permission allowed={false} text="Private match inputs" />
      </div>

      <button
        onClick={onCreate}
        className="mt-8 w-full flex items-center justify-center gap-2 rounded-lg"
        style={{
          background: '#C8F25A',
          color: '#000',
          fontSize: 14,
          fontWeight: 500,
          padding: '14px 20px',
        }}
      >
        Create account <ArrowRight size={14} />
      </button>

      <button
        onClick={onChangeCode}
        className="mt-3 mx-auto"
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.45)',
          textDecoration: 'underline',
          textUnderlineOffset: 4,
        }}
      >
        Use a different code
      </button>
    </>
  )
}

/* ----- Shared atoms ----- */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.22)',
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return <div className="my-5" style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
}

function Permission({ allowed, text }: { allowed: boolean; text: string }) {
  const color = allowed ? '#C8F25A' : 'rgba(255,255,255,0.3)'
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: allowed ? 'rgba(200,242,90,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${allowed ? 'rgba(200,242,90,0.3)' : 'rgba(255,255,255,0.07)'}`,
          color,
        }}
      >
        {allowed ? <Check size={12} /> : <X size={12} />}
      </div>
      <span
        style={{
          fontSize: 13,
          color: allowed ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.4)',
        }}
      >
        {text}
      </span>
    </div>
  )
}
