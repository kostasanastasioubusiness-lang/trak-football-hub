// Computed rating engine — universal modifiers only (Phase 2)

export interface MatchInputs {
  position: string;
  competition: string;
  venue: string;
  teamScore: number | '';
  opponentScore: number | '';
  ageGroup: string;
  minutesPlayed: number | '';
  cardReceived: string;
  bodyCondition: string;
  selfRating: string;
  goals: number | '';
  assists: number | '';
}

export const AGE_GROUP_MAX_MINUTES: Record<string, number> = {
  'U13': 60,
  'U14': 70,
  'U15/U16': 70,
  'U17/U18': 80,
  'U19+': 90,
};

export const MATCH_AGE_GROUPS = ['U13', 'U14', 'U15/U16', 'U17/U18', 'U19+'] as const;
export const COMPETITIONS = ['League', 'Cup', 'Tournament', 'Friendly'] as const;
export const VENUES = ['Home', 'Away'] as const;
export const CARDS = ['None', 'Yellow', 'Red'] as const;
export const BODY_CONDITIONS = [
  { label: 'Fresh', emoji: '💪' },
  { label: 'Good', emoji: '👍' },
  { label: 'Tired', emoji: '😮‍💨' },
  { label: 'Knock', emoji: '🤕' },
] as const;
export const SELF_RATINGS = ['Poor', 'Average', 'Good', 'Excellent'] as const;

export function hasAnyInput(inputs: MatchInputs): boolean {
  return !!(
    inputs.position || inputs.competition || inputs.venue ||
    inputs.ageGroup || inputs.cardReceived !== 'None' ||
    inputs.bodyCondition || inputs.selfRating ||
    inputs.teamScore !== '' || inputs.opponentScore !== '' ||
    inputs.minutesPlayed !== '' || inputs.goals !== '' || inputs.assists !== ''
  );
}

export function computeRating(inputs: MatchInputs): number | null {
  if (!hasAnyInput(inputs)) return null;

  let rating = 6.5;
  let modifiers = 0;

  // Result modifier
  if (inputs.teamScore !== '' && inputs.opponentScore !== '') {
    const ts = Number(inputs.teamScore);
    const os = Number(inputs.opponentScore);
    if (ts > os) modifiers += 0.2;
    else if (ts < os) modifiers -= 0.1;
    // draw: 0
  }

  // Venue
  if (inputs.venue === 'Away') modifiers += 0.1;

  // Minutes played
  if (inputs.minutesPlayed !== '' && inputs.ageGroup) {
    const max = AGE_GROUP_MAX_MINUTES[inputs.ageGroup] || 90;
    const pct = Number(inputs.minutesPlayed) / max;
    if (pct >= 1) modifiers += 0.3;
    else if (pct >= 0.75) modifiers += 0.1;
    else if (pct < 0.5) modifiers -= 0.1;
  }

  // Card
  if (inputs.cardReceived === 'Yellow') modifiers -= 0.2;
  if (inputs.cardReceived === 'Red') modifiers -= 0.6;

  // Self-rating
  if (inputs.selfRating === 'Excellent') modifiers += 0.2;
  else if (inputs.selfRating === 'Good') modifiers += 0.1;
  else if (inputs.selfRating === 'Poor') modifiers -= 0.2;

  // Body condition
  if (inputs.bodyCondition === 'Fresh') modifiers += 0.05;
  else if (inputs.bodyCondition === 'Knock') modifiers -= 0.05;

  // Friendly multiplier
  if (inputs.competition === 'Friendly') modifiers *= 0.8;

  rating += modifiers;

  // Red card hard cap
  if (inputs.cardReceived === 'Red' && rating > 6.0) rating = 6.0;

  // Clamp 4.0–10.0
  rating = Math.max(4.0, Math.min(10.0, rating));

  return Math.round(rating * 10) / 10;
}
