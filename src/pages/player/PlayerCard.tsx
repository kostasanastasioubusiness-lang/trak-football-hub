import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { BAND_COLORS, type Band } from '@/lib/clubMock'

const CARD = {
  initials: 'AK',
  fullName: 'Andreas Kostas',
  position: 'Midfielder',
  club: 'Panetolikos FC',
  recognition: 'Player of the Week',
  band: 'Exceptional' as Band,
  season: '2025–26',
  week: 'Week 28',
  coach: 'D. Karras',
}

export default function PlayerCard() {
  const navigate = useNavigate()
  const bandColor = BAND_COLORS[CARD.band]

  const onShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: 'TRAK Recognition', text: `${CARD.fullName} — ${CARD.recognition}`, url })
        return
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not share')
    }
  }

  const onDownload = () => {
    toast.success('Download started', { description: 'Screenshot the card to share for now' })
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Back button */}
      <div className="mx-auto w-full max-w-[430px] px-5 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: '#101012', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.88)',
          }}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      {/* Centered card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6">
        {/* The shareable card — 400x400 */}
        <div
          id="trak-card"
          className="relative overflow-hidden flex flex-col"
          style={{
            width: 400,
            height: 400,
            maxWidth: '100%',
            background: '#101012',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 24,
            padding: 32,
          }}
        >
          {/* Volt glow bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 100%, rgba(200,242,90,0.08), transparent 60%)',
            }}
          />

          {/* Brand row */}
          <div className="relative flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.2)',
              }}
            >
              TRAK
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: 'italic',
                fontSize: 11,
                color: '#C8F25A',
              }}
            >
              football
            </span>
          </div>

          {/* Initials block */}
          <div
            className="relative mt-5 flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: '#0A0A0B',
              border: '1px solid rgba(200,242,90,0.2)',
              fontWeight: 300,
              fontSize: 32,
              color: '#C8F25A',
            }}
          >
            {CARD.initials}
          </div>

          {/* Name */}
          <h2
            className="relative mt-4"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: 28,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            {CARD.fullName}
          </h2>

          {/* Pills */}
          <div className="relative mt-2.5 flex gap-1.5">
            <Pill>{CARD.position}</Pill>
            <Pill>{CARD.club}</Pill>
          </div>

          {/* Recognition + band */}
          <div className="relative mt-auto">
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {CARD.recognition}
            </div>
            <div
              className="mt-1"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: 48,
                lineHeight: 1,
                color: bandColor,
                letterSpacing: '-0.02em',
              }}
            >
              {CARD.band}
            </div>

            {/* Divider */}
            <div className="mt-4 flex justify-center">
              <div style={{ height: 1, width: '40%', background: '#C8F25A', opacity: 0.6 }} />
            </div>

            {/* Bottom row */}
            <div
              className="mt-3 flex items-center justify-between"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              <span>{CARD.season}</span>
              <span>{CARD.week}</span>
              <span>{CARD.coach}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-[400px] space-y-2.5">
          <button
            onClick={onShare}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg"
            style={{ background: '#C8F25A', color: '#000', fontSize: 14, fontWeight: 500 }}
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.88)',
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full"
      style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.55)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {children}
    </span>
  )
}
