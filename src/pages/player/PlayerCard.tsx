import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Share2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { NavBar } from '@/components/trak'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { scoreToBand } from '@/lib/rating-engine'
import { BANDS } from '@/lib/types'

type CardData = {
  initials: string
  fullName: string
  position: string
  club: string
  recognition: string
  bandWord: string
  bandColor: string
  season: string
  coachName: string
}

function getBandConfig(bandWord: string) {
  return BANDS.find(b => b.word.toLowerCase() === bandWord.toLowerCase()) || BANDS[4]
}

function getSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  // Academic year: Aug–Jul
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}–${String(startYear + 1).slice(2)}`
}

export default function PlayerCard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [card, setCard] = useState<CardData | null>(null)

  useEffect(() => {
    if (!user) return
    loadCard()
  }, [user])

  const loadCard = async () => {
    // Fetch profile + player details
    const [profileRes, detailsRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('user_id', user!.id).single(),
      supabase.from('player_details').select('position, current_club').eq('user_id', user!.id).single(),
    ])

    const fullName = profileRes.data?.full_name || 'Player'
    const nameParts = fullName.trim().split(' ')
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase()
    const position = detailsRes.data?.position || 'Midfielder'
    const club = detailsRes.data?.current_club || 'Academy'

    // Fetch latest coach assessment via squad_players link
    const squadRes = await supabase
      .from('squad_players')
      .select('id, coach_user_id')
      .eq('linked_player_id', user!.id)
      .maybeSingle()

    let bandWord = 'Good'
    let coachName = 'Coach'

    if (squadRes.data) {
      const [assessRes, coachRes] = await Promise.all([
        supabase.from('coach_assessments')
          .select('work_rate, tactical, attitude, technical, physical, coachability')
          .eq('squad_player_id', squadRes.data.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('profiles')
          .select('full_name')
          .eq('user_id', squadRes.data.coach_user_id)
          .maybeSingle(),
      ])

      if (assessRes.data) {
        const a = assessRes.data
        const scores = [a.work_rate, a.tactical, a.attitude, a.technical, a.physical, a.coachability].filter(Boolean) as number[]
        if (scores.length > 0) {
          const avg = scores.reduce((s, n) => s + n, 0) / scores.length
          bandWord = scoreToBand(avg)
          // Capitalize first letter
          bandWord = bandWord.charAt(0).toUpperCase() + bandWord.slice(1)
        }
      }

      if (coachRes.data?.full_name) {
        const parts = coachRes.data.full_name.trim().split(' ')
        coachName = parts.length >= 2
          ? `${parts[0][0]}. ${parts[parts.length - 1]}`
          : coachRes.data.full_name
      }
    }

    // Check for a recent recognition award (last 30 days)
    let recognition = bandWord
    if (squadRes.data) {
      const since = new Date(Date.now() - 30 * 86400000).toISOString()
      const awardRes = await supabase
        .from('recognition_awards')
        .select('award_type')
        .eq('squad_player_id', squadRes.data.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (awardRes.data) {
        const labels: Record<string, string> = {
          player_of_week: 'Player of the Week',
          player_of_month: 'Player of the Month',
          most_improved: 'Most Improved',
          top_scorer: 'Top Scorer',
        }
        recognition = labels[awardRes.data.award_type] || recognition
      }
    }

    const bandConfig = getBandConfig(bandWord)

    setCard({
      initials,
      fullName,
      position,
      club,
      recognition,
      bandWord,
      bandColor: bandConfig.color,
      season: getSeason(),
      coachName,
    })
  }

  const onShare = async () => {
    if (!card) return
    const text = `${card.fullName} · ${card.bandWord} · ${card.position} · ${card.club} — via TRAK football`
    if (navigator.share) {
      try { await navigator.share({ title: 'TRAK Card', text }); return } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard') }
    catch { toast.error('Could not share') }
  }

  const onDownload = () => {
    toast.success('Screenshot the card to save it', { description: 'Long-press on mobile to save' })
  }

  const bandConfig = card ? getBandConfig(card.bandWord) : null

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: '#0A0A0B', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6">

        {/* The shareable card */}
        <div
          id="trak-card"
          className="relative overflow-hidden flex flex-col"
          style={{
            width: 400, height: 400, maxWidth: '100%',
            background: '#101012', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 32,
          }}
        >
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 100%, ${card?.bandColor ? card.bandColor + '18' : 'rgba(200,242,90,0.08)'}, transparent 60%)` }} />

          {/* Brand */}
          <div className="relative flex items-baseline gap-1.5">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>TRAK</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 11, color: '#C8F25A' }}>football</span>
          </div>

          {/* Initials */}
          <div className="relative mt-5 flex items-center justify-center"
            style={{ width: 80, height: 80, borderRadius: 20, background: '#0A0A0B', border: `1px solid ${bandConfig?.border || 'rgba(200,242,90,0.2)'}`, fontWeight: 300, fontSize: 32, color: card?.bandColor || '#C8F25A' }}>
            {card ? card.initials : '—'}
          </div>

          {/* Name */}
          <h2 className="relative mt-4" style={{ fontWeight: 300, fontSize: 28, letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.1 }}>
            {card ? card.fullName : ' '}
          </h2>

          {/* Pills */}
          <div className="relative mt-2.5 flex gap-1.5">
            {card && <><Pill>{card.position}</Pill><Pill>{card.club}</Pill></>}
          </div>

          {/* Band + recognition */}
          <div className="relative mt-auto">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)' }}>
              {card?.recognition || ''}
            </div>
            <div className="mt-1" style={{ fontWeight: 300, fontSize: 48, lineHeight: 1, color: card?.bandColor || '#C8F25A', letterSpacing: '-0.02em' }}>
              {card?.bandWord || ''}
            </div>

            <div className="mt-4 flex justify-center">
              <div style={{ height: 1, width: '40%', background: card?.bandColor || '#C8F25A', opacity: 0.6 }} />
            </div>

            <div className="mt-3 flex items-center justify-between" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}>
              <span>{card?.season || ''}</span>
              <span>TRAK</span>
              <span>{card?.coachName || ''}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-[400px] space-y-2.5">
          <button onClick={onShare} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg" style={{ background: '#C8F25A', color: '#000', fontSize: 14, fontWeight: 500 }}>
            <Share2 size={14} /> Share
          </button>
          <button onClick={onDownload} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.88)', fontSize: 14, fontWeight: 400 }}>
            <Download size={14} /> Screenshot to save
          </button>
        </div>
      </div>
      <NavBar role="player" activeTab={location.pathname} onNavigate={navigate} />
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </span>
  )
}
