import { describe, it, expect } from 'vitest'
import { checkMedalEligibility } from '../medals'
import type { Match, Medal } from '../types'

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: crypto.randomUUID(),
  player_id: 'p1',
  position: 'att',
  competition: 'league',
  venue: 'home',
  opponent: 'Test',
  score_us: 1, score_them: 0,
  minutes_played: 80, card: 'none',
  body_condition: 'good', self_rating: 'good',
  position_inputs: {},
  computed_score: 7.5, band: 'good',
  is_friendly: false,
  logged_at: new Date().toISOString(),
  ...overrides,
})

describe('medal eligibility', () => {
  it('first_match triggers on 1 match', () => {
    const result = checkMedalEligibility([makeMatch()], [])
    expect(result).toContain('first_match')
  })

  it('first_match does not trigger if already earned', () => {
    const existing: Medal[] = [{ id: '1', player_id: 'p1', medal_type: 'first_match', unlocked_at: '' }]
    const result = checkMedalEligibility([makeMatch()], existing)
    expect(result).not.toContain('first_match')
  })

  it('ten_down triggers on 10 matches', () => {
    const matches = Array.from({ length: 10 }, () => makeMatch())
    const result = checkMedalEligibility(matches, [])
    expect(result).toContain('ten_down')
  })

  it('ten_down does not trigger on 9 matches', () => {
    const matches = Array.from({ length: 9 }, () => makeMatch())
    const result = checkMedalEligibility(matches, [])
    expect(result).not.toContain('ten_down')
  })

  it('first_star triggers on first exceptional band', () => {
    const matches = [makeMatch({ band: 'exceptional' })]
    const result = checkMedalEligibility(matches, [])
    expect(result).toContain('first_star')
  })

  it('first_star triggers on first standout band', () => {
    const matches = [makeMatch({ band: 'standout' })]
    const result = checkMedalEligibility(matches, [])
    expect(result).toContain('first_star')
  })

  it('first_star does not trigger on good band', () => {
    const matches = [makeMatch({ band: 'good' })]
    const result = checkMedalEligibility(matches, [])
    expect(result).not.toContain('first_star')
  })
})
