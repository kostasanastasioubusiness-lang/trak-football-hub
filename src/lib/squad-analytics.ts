import { BandType, BANDS } from '@/lib/types'
import { scoreToBand } from '@/lib/rating-engine'

export interface SquadAnalytics {
  totalPlayers: number
  totalAssessments: number
  avgRating: number
  bandDistribution: Record<string, number>
  mostImproved: { name: string; playerId: string; improvement: number } | null
  needsAttention: { name: string; playerId: string; reason: string }[]
}

export function calculateSquadAnalytics(
  players: { id: string; player_name: string }[],
  assessments: { id: string; squad_player_id: string; coach_rating: number; created_at: string }[],
): SquadAnalytics {
  const totalPlayers = players.length
  const totalAssessments = assessments.length

  // Average rating
  const avgRating =
    totalAssessments > 0
      ? Math.round(
          (assessments.reduce((sum, a) => sum + (a.coach_rating || 0), 0) / totalAssessments) * 100,
        ) / 100
      : 0

  // Band distribution — initialize all bands to 0
  const bandDistribution: Record<string, number> = {}
  for (const b of BANDS) {
    bandDistribution[b.word.toLowerCase()] = 0
  }
  for (const a of assessments) {
    const band = scoreToBand(a.coach_rating || 5)
    bandDistribution[band] = (bandDistribution[band] || 0) + 1
  }

  // Group assessments by player, sorted chronologically
  const byPlayer = new Map<string, { rating: number; created_at: string }[]>()
  for (const a of assessments) {
    if (!byPlayer.has(a.squad_player_id)) byPlayer.set(a.squad_player_id, [])
    byPlayer.get(a.squad_player_id)!.push({ rating: a.coach_rating || 0, created_at: a.created_at })
  }
  for (const entries of byPlayer.values()) {
    entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  // Player name lookup
  const playerMap = new Map(players.map(p => [p.id, p.player_name]))

  // Most improved: player whose avg rating improved most between first half and second half
  let mostImproved: SquadAnalytics['mostImproved'] = null
  let bestImprovement = 0
  for (const [playerId, entries] of byPlayer) {
    if (entries.length < 2) continue
    const mid = Math.floor(entries.length / 2)
    const firstHalf = entries.slice(0, mid)
    const secondHalf = entries.slice(mid)
    const avgFirst = firstHalf.reduce((s, e) => s + e.rating, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((s, e) => s + e.rating, 0) / secondHalf.length
    const improvement = Math.round((avgSecond - avgFirst) * 100) / 100
    if (improvement > bestImprovement) {
      bestImprovement = improvement
      mostImproved = {
        name: playerMap.get(playerId) || 'Unknown',
        playerId,
        improvement,
      }
    }
  }

  // Needs attention: declining trend or no recent assessment
  const needsAttention: SquadAnalytics['needsAttention'] = []
  const now = Date.now()
  const fourteenDays = 14 * 24 * 60 * 60 * 1000

  for (const player of players) {
    const entries = byPlayer.get(player.id)

    // No assessment in 14+ days
    if (!entries || entries.length === 0) {
      needsAttention.push({
        name: player.player_name,
        playerId: player.id,
        reason: 'No assessments recorded',
      })
      continue
    }

    const lastDate = new Date(entries[entries.length - 1].created_at).getTime()
    if (now - lastDate >= fourteenDays) {
      needsAttention.push({
        name: player.player_name,
        playerId: player.id,
        reason: 'No assessment in 14+ days',
      })
    }

    // Declining trend: last 3 avg < previous 3 avg
    if (entries.length >= 6) {
      const prev3 = entries.slice(-6, -3)
      const last3 = entries.slice(-3)
      const avgPrev = prev3.reduce((s, e) => s + e.rating, 0) / prev3.length
      const avgLast = last3.reduce((s, e) => s + e.rating, 0) / last3.length
      if (avgLast < avgPrev) {
        // Check not already added
        const alreadyAdded = needsAttention.some(n => n.playerId === player.id)
        if (!alreadyAdded) {
          needsAttention.push({
            name: player.player_name,
            playerId: player.id,
            reason: 'Declining trend',
          })
        }
      }
    }
  }

  return {
    totalPlayers,
    totalAssessments,
    avgRating,
    bandDistribution,
    mostImproved,
    needsAttention,
  }
}
