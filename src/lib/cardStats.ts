/**
 * Maps the 6 coach assessment dimensions (0..10) into the 5 player Card stats (0..10).
 *
 * Coach evaluates real, observable inputs. The Card derives from them so the
 * coach UX is grounded while the player UX is simple & gamified.
 */
export interface CoachInputs {
  workRate: number
  tactical: number
  attitude: number
  technical: number
  physical: number
  coachability: number
}

export interface CardStats {
  consistency: number
  impact: number
  workrate: number
  technique: number
  spirit: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function deriveCardStats(c: CoachInputs): CardStats {
  return {
    consistency: round1(c.attitude),
    impact:      round1(c.technical),
    workrate:    round1(c.workRate),
    technique:   round1((c.technical + c.tactical) / 2),
    spirit:      round1((c.attitude + c.coachability) / 2),
  }
}
