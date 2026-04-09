import type { Match, Medal, MedalType } from './types'

export function checkMedalEligibility(matches: Match[], existingMedals: Medal[]): MedalType[] {
  const earned = new Set(existingMedals.map(m => m.medal_type))
  const newMedals: MedalType[] = []

  if (!earned.has('first_match') && matches.length >= 1) {
    newMedals.push('first_match')
  }

  if (!earned.has('ten_down') && matches.length >= 10) {
    newMedals.push('ten_down')
  }

  if (!earned.has('first_star') && matches.some(m => m.band === 'exceptional' || m.band === 'standout')) {
    newMedals.push('first_star')
  }

  if (!earned.has('on_a_roll')) {
    const weeks = [...new Set(matches.map(m => {
      const d = new Date(m.logged_at)
      const jan1 = new Date(d.getFullYear(), 0, 1)
      const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
      return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    }))].sort()

    let consecutive = 1
    for (let i = 1; i < weeks.length; i++) {
      const [y1, w1] = weeks[i - 1].split('-W').map(Number)
      const [y2, w2] = weeks[i].split('-W').map(Number)
      if ((y1 === y2 && w2 === w1 + 1) || (y2 === y1 + 1 && w1 >= 52 && w2 === 1)) {
        consecutive++
        if (consecutive >= 5) { newMedals.push('on_a_roll'); break }
      } else {
        consecutive = 1
      }
    }
  }

  if (!earned.has('most_improved') && matches.length >= 20) {
    const sorted = [...matches].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
    const first10Avg = sorted.slice(0, 10).reduce((s, m) => s + m.computed_score, 0) / 10
    const second10Avg = sorted.slice(10, 20).reduce((s, m) => s + m.computed_score, 0) / 10
    if (second10Avg > first10Avg) {
      newMedals.push('most_improved')
    }
  }

  return newMedals
}
