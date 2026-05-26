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

  // Group assessments by player, sorted chronologically (oldest first)
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

  // ── Needs Attention ─────────────────────────────────────────────────────────
  // Only flag players who already have a track record — never flag someone just
  // because they are new to the squad. A player appears here only when:
  //
  //   1. They have ≥ 2 past assessments AND their last assessment was 30+ days ago
  //      → the coach has been active with them before, now quiet
  //
  //   2. They have ≥ 4 assessments AND their last 2 ratings average 1.5+ points
  //      lower than the 2 before — a clear, meaningful drop (not just one bad day)
  //
  // Maximum 3 players are shown, sorted by severity, to keep the list actionable.

  type Candidate = { name: string; playerId: string; reason: string; severity: number }
  const candidates: Candidate[] = []
  const now = Date.now()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000

  for (const player of players) {
    const entries = byPlayer.get(player.id)

    // Skip players with fewer than 2 assessments — they're still getting started
    if (!entries || entries.length < 2) continue

    const lastDate = new Date(entries[entries.length - 1].created_at).getTime()
    const daysSince = Math.floor((now - lastDate) / (24 * 60 * 60 * 1000))

    // Rule 1: previously active, now gone quiet for 30+ days
    if (now - lastDate >= thirtyDays) {
      candidates.push({
        name: player.player_name,
        playerId: player.id,
        reason: `Not assessed for ${daysSince} days`,
        severity: daysSince,
      })
      continue // don't double-flag the same player
    }

    // Rule 2: clear declining trend — needs at least 4 assessments
    if (entries.length >= 4) {
      const prev2 = entries.slice(-4, -2)
      const last2 = entries.slice(-2)
      const avgPrev = prev2.reduce((s, e) => s + e.rating, 0) / prev2.length
      const avgLast = last2.reduce((s, e) => s + e.rating, 0) / last2.length
      const drop = avgPrev - avgLast
      if (drop >= 1.5) {
        candidates.push({
          name: player.player_name,
          playerId: player.id,
          reason: `Rating dropped ${drop.toFixed(1)} pts recently`,
          severity: drop * 10, // larger drop = higher priority
        })
      }
    }
  }

  // Most urgent first, cap at 3
  candidates.sort((a, b) => b.severity - a.severity)
  const needsAttention = candidates.slice(0, 3).map(({ name, playerId, reason }) => ({
    name,
    playerId,
    reason,
  }))

  return {
    totalPlayers,
    totalAssessments,
    avgRating,
    bandDistribution,
    mostImproved,
    needsAttention,
  }
}
