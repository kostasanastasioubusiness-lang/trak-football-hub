import { useLocation, useNavigate } from 'react-router-dom'
import { MobileShell, BandPill } from '@/components/trak'
import { BANDS, type BandType } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

export default function PlayerResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const { match, band: bandOverride, score } = (location.state || {}) as any
  const band: BandType = bandOverride || (match ? scoreToBand(match.computed_rating || 6.5) : 'steady')
  const config = BANDS.find(b => b.word.toLowerCase() === band)!

  return (
    <MobileShell>
      <div className="pt-20 flex flex-col items-center gap-8">
        <p className="text-[56px] leading-none animate-fade-in" style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: config.color,
        }}>
          {config.word}
        </p>
        <BandPill band={band} />

        {match && (
          <div className="w-full rounded-[14px] bg-[#101012] border border-white/[0.07] p-4 space-y-2">
            <p className="text-sm text-white/88">{match.team_score} - {match.opponent_score}</p>
            <p className="text-xs text-white/45">{match.competition} {match.venue && `\u00b7 ${match.venue}`}</p>
          </div>
        )}

        <div className="w-full space-y-3 pt-4">
          <button onClick={() => navigate('/player/log')}
            className="w-full py-3 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-white/45">
            Log Another
          </button>
          <button onClick={() => navigate('/player/home')}
            className="w-full py-3 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm">
            Done
          </button>
        </div>
      </div>
    </MobileShell>
  )
}
