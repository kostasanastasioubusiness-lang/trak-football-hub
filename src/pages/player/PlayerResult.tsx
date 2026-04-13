import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MobileShell, BandPill } from '@/components/trak'
import { BANDS, type BandType } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

export default function PlayerResult() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { match, band: bandOverride, score } = (location.state || {}) as any
  const band: BandType = bandOverride || (match ? scoreToBand(match.computed_rating || 6.5) : 'steady')
  const config = BANDS.find(b => b.word.toLowerCase() === band)!
  const numericScore = score || match?.computed_rating || 6.5
  const [bandCount, setBandCount] = useState(0)
  const [avgRating, setAvgRating] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('matches').select('computed_rating').eq('user_id', user.id).then(({ data }) => {
      if (!data) return
      const sameBand = data.filter(m => scoreToBand(m.computed_rating || 6.5) === band)
      setBandCount(sameBand.length)
      if (data.length > 1) {
        const avg = data.slice(0, -1).reduce((sum, m) => sum + (m.computed_rating || 6.5), 0) / (data.length - 1)
        setAvgRating(Math.round(avg * 10) / 10)
      }
    })
  }, [user, band])

  const isAboveAvg = avgRating > 0 && numericScore > avgRating

  return (
    <MobileShell>
      <div className="pt-16 flex flex-col items-center gap-6 animate-[fadeIn_0.6s_ease-out]">
        {/* Numeric score */}
        <div className="relative">
          <div className="absolute -inset-8 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: config.color }} />
          <p className="relative text-[72px] leading-none font-light tabular-nums" style={{
            fontFamily: "'DM Sans', sans-serif",
            color: config.color,
          }}>
            {numericScore.toFixed(1)}
          </p>
        </div>

        {/* Band word */}
        <p className="text-[40px] leading-none font-light" style={{
          fontFamily: "'DM Sans', sans-serif",
          color: config.color,
        }}>
          {config.word}
        </p>

        <BandPill band={band} />

        {/* Context */}
        <div className="text-center space-y-1 mt-2">
          {bandCount > 0 && (
            <p className="text-xs text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
              Your {bandCount === 1 ? '1st' : bandCount === 2 ? '2nd' : bandCount === 3 ? '3rd' : `${bandCount}th`} {config.word} this season
            </p>
          )}
          {avgRating > 0 && (
            <p className="text-xs text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
              {isAboveAvg ? '↑' : '↓'} {isAboveAvg ? 'Above' : 'Below'} your {avgRating.toFixed(1)} average
            </p>
          )}
        </div>

        {/* Match summary card */}
        {match && (
          <div className="w-full rounded-[14px] bg-[#101012] border border-white/[0.07] p-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-lg text-white/88 font-light">{match.team_score} - {match.opponent_score}</p>
                <p className="text-xs text-white/45" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {match.competition} {match.venue ? `· ${match.venue}` : ''} {match.position ? `· ${match.position}` : ''}
                </p>
              </div>
              {match.goals > 0 && (
                <div className="text-right">
                  <p className="text-sm text-white/88">{match.goals}G {match.assists > 0 ? `${match.assists}A` : ''}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="w-full space-y-3 pt-4">
          <button onClick={() => navigate('/player/log')}
            className="w-full py-3.5 rounded-[10px] border border-white/[0.07] bg-[#202024] text-sm text-white/45 active:scale-[0.97] transition-transform">
            Log Another Match
          </button>
          <button onClick={() => navigate('/player/home')}
            className="w-full py-3.5 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm active:scale-[0.97] transition-transform">
            Done
          </button>
        </div>
      </div>
    </MobileShell>
  )
}
