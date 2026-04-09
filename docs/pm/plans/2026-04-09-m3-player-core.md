# Plan: Milestone 3 — Player Core (REQ-001)

## Header
- **Goal:** Build the match log form, rating computation, result screen, player home, and match history
- **Architecture:** Client-heavy — rating engine runs in browser, live preview + final save use same `computeMatchScore`
- **Tech Stack:** React, TypeScript, Supabase client, Vitest

## Tasks

### Task 3.1: Match log form (universal + position-specific fields)
**Files:** `src/pages/player/LogForm.tsx` (create)

**Steps:**
1. Build single scrollable form with 10 universal fields (PRD Section 10.1):
   - Position: PillSelector (pre-filled from player profile, changeable)
   - Competition: PillSelector (League / Cup / Tournament / Friendly)
   - Venue: PillSelector (Home / Away)
   - Opponent: text input
   - Score (us): number input
   - Score (them): number input
   - Minutes played: number input (0–120)
   - Card: PillSelector (None / Yellow / Red)
   - Body condition: PillSelector (Fresh / Good / Tired / Knock)
   - Self-rating: PillSelector (Poor / Average / Good / Excellent)
2. Below universal fields, render position-specific section based on selected position:
   - **GK:** Clean sheet, Saves, Distribution, Commanding presence, Errors (5 fields)
   - **DEF:** Duels won, Clearances, Aerial, Positioning, Goals conceded, Assists (6 fields)
   - **MID:** Passes, Chances created, Pressing, Assists, Goals, Tempo (6 fields)
   - **ATT:** Goals, Assists, Shots on target, Attacking threat, Hold-up play, Pressing (6 fields)
3. All position-specific fields use PillSelector with options from PRD Section 10.2
4. `is_friendly` derived from `competition === 'friendly'`
5. Store position inputs as `position_inputs` JSONB with snake_case keys matching the rating engine
6. Style: `--s3` input backgrounds, `--border` borders, `--accent` selected state
7. Save button: full width, `--accent` bg, black text, weight 700, radius-md
8. Verify: form renders for each position, switching position changes the position-specific section

---

### Task 3.2: Live band preview component
**Files:** `src/components/ui/BandPreview.tsx` (create)

**Steps:**
1. Create `BandPreview.tsx`:
   ```tsx
   import { computeMatchScore, scoreToBand } from '../../lib/rating'
   import { BandPill } from './BandPill'
   import { BANDS } from '../../lib/types'
   import type { MatchInput } from '../../lib/types'

   interface BandPreviewProps {
     matchInput: Partial<MatchInput>
     visible: boolean  // show only when enough fields are filled
   }

   export function BandPreview({ matchInput, visible }: BandPreviewProps) {
     if (!visible) return null

     const score = computeMatchScore(matchInput as MatchInput)
     const band = scoreToBand(score)
     const config = BANDS.find(b => b.word.toLowerCase() === band)!

     return (
       <div
         className="fixed bottom-20 left-0 right-0 mx-auto max-w-[430px] px-5"
       >
         <div
           className="flex items-center justify-center gap-3 py-3 rounded-[14px] border"
           style={{
             background: config.bg,
             borderColor: config.border,
           }}
         >
           <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "'DM Mono', monospace" }}>
             CURRENT BAND
           </span>
           <BandPill band={band} />
         </div>
       </div>
     )
   }
   ```
2. Integrate into LogForm: pass current form state as `matchInput`, show when ≥3 fields filled
3. Verify: change form values, preview updates in real time. No decimal number visible anywhere.

---

### Task 3.3: Match save handler
**Files:** `src/hooks/useMatches.ts` (create)

**Steps:**
1. Create `useMatches.ts`:
   ```typescript
   import { supabase } from '../lib/supabase'
   import { computeMatchScore, scoreToBand } from '../lib/rating'
   import { trackEvent } from '../lib/telemetry'
   import type { MatchInput, Match } from '../lib/types'

   export function useMatches(playerId: string) {
     const saveMatch = async (input: MatchInput): Promise<{ match: Match; error: Error | null }> => {
       const computed_score = computeMatchScore(input)
       const band = scoreToBand(computed_score)

       const { data, error } = await supabase
         .from('matches')
         .insert({
           player_id: playerId,
           opponent: input.opponent,
           score_us: input.score_us,
           score_them: input.score_them,
           competition: input.competition,
           venue: input.venue,
           minutes_played: input.minutes_played,
           card: input.card,
           body_condition: input.body_condition,
           self_rating: input.self_rating,
           position: input.position,
           position_inputs: input.position_inputs,
           computed_score,
           band,
           is_friendly: input.is_friendly,
         })
         .select()
         .single()

       if (data) {
         trackEvent('form_submit', { form: 'match_log' })
         trackEvent('match_log', { match_id: data.id, band })
       }

       return { match: data as Match, error: error as Error | null }
     }

     const getMatches = async (): Promise<Match[]> => {
       const { data } = await supabase
         .from('matches')
         .select('*')
         .eq('player_id', playerId)
         .order('logged_at', { ascending: false })
       return (data ?? []) as Match[]
     }

     const getMatch = async (matchId: string): Promise<Match | null> => {
       const { data } = await supabase
         .from('matches')
         .select('*')
         .eq('id', matchId)
         .single()
       return data as Match | null
     }

     return { saveMatch, getMatches, getMatch }
   }
   ```
2. Verify: `npx tsc --noEmit`

---

### Task 3.4: Match result screen (band reveal)
**Files:** `src/pages/player/Result.tsx` (create)

**Steps:**
1. Create result screen receiving match data + newGoals + newMedals via router state
2. Layout:
   - Band word: DM Sans 300, 48px, band colour, fade-in animation (CSS transition)
   - Match summary card: opponent, score, competition, venue, minutes
   - Goal update card (conditional): goal title, progress change, progress bar
   - Medal card (conditional): medal name, "Just unlocked!"
   - "Log Another" button (secondary)
   - "Done" button (primary, navigates to `/player/home`)
3. No decimal number anywhere
4. Verify: navigate to result with mock data, band renders correctly

---

### Task 3.5: Player home (hero card, distribution, recent matches)
**Files:** `src/pages/player/Home.tsx` (create)

**Steps:**
1. Hero card:
   - "THIS SEASON" MetadataLabel
   - Large season band word (DM Sans 300, 48px) — computed as the mode of all match bands this season
   - Band distribution bars (7 horizontal bars, one per band, width proportional to count)
   - Match count
2. Recent matches section:
   - Last 5 matches as MatchCard components
   - Each shows: opponent, date, band pill
3. MatchCard component (`src/components/ui/MatchCard.tsx`):
   ```tsx
   import { BandPill } from './BandPill'
   import { MetadataLabel } from './MetadataLabel'
   import { Card } from './Card'
   import type { Match } from '../../lib/types'

   export function MatchCard({ match }: { match: Match }) {
     const date = new Date(match.logged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
     return (
       <Card>
         <div className="flex items-center justify-between">
           <div>
             <p className="text-sm text-[rgba(255,255,255,0.88)]">vs {match.opponent}</p>
             <MetadataLabel text={`${date} \u00b7 ${match.score_us}-${match.score_them}`} />
           </div>
           <BandPill band={match.band} />
         </div>
       </Card>
     )
   }
   ```
4. Verify: seed 3 matches in DB, load home screen, verify hero card + distribution + recent

---

### Task 3.6: Match history + match detail
**Files:** `src/pages/player/Matches.tsx` (create), `src/pages/player/MatchDetail.tsx` (create)

**Steps:**
1. Matches screen: scrollable list of all matches using MatchCard, tappable to navigate to detail
2. MatchDetail screen: full breakdown:
   - Band pill (large)
   - All universal fields displayed
   - Position-specific inputs displayed
   - Coach assessment section (if assessment exists for this match)
   - No computed_score, no decimal anywhere
3. Verify: tap a match in history, detail loads with correct data

---

### Task 3.7: Integration tests for match log flow
**Files:** `src/__tests__/match-log.test.ts` (create)

**Steps:**
1. Create integration test file:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { computeMatchScore, scoreToBand } from '../lib/rating'
   import type { MatchInput } from '../lib/types'

   // Worked example 1: GK, league, won 1-0
   const gkMatch: MatchInput = {
     position: 'gk', competition: 'league', venue: 'home', opponent: 'Test FC',
     score_us: 1, score_them: 0, minutes_played: 80, card: 'none',
     body_condition: 'fresh', self_rating: 'good', is_friendly: false,
     position_inputs: { clean_sheet: 'yes', saves: '3-4', distribution: 'good', commanding: 'yes', errors: 'none' },
   }

   // Worked example 2: ATT, friendly, drew 1-1
   const attFriendly: MatchInput = {
     position: 'att', competition: 'friendly', venue: 'away', opponent: 'Rival FC',
     score_us: 1, score_them: 1, minutes_played: 75, card: 'yellow',
     body_condition: 'good', self_rating: 'excellent', is_friendly: true,
     position_inputs: { goals: '1', assists: '0', shots_on_target: '3-4', attacking_threat: 'dangerous', holdup_play: 'average', pressing: 'medium' },
   }

   // Worked example 3: DEF, league, lost 0-3
   const defLoss: MatchInput = {
     position: 'def', competition: 'league', venue: 'home', opponent: 'Strong FC',
     score_us: 0, score_them: 3, minutes_played: 80, card: 'none',
     body_condition: 'tired', self_rating: 'average', is_friendly: false,
     position_inputs: { duels: 'few', clearances: 'some', aerial: 'lost_most', positioning: 'no', goals_conceded: '3+', assists: '0' },
   }

   describe('match log integration', () => {
     it('GK worked example: score=8.25, band=standout', () => {
       const score = computeMatchScore(gkMatch)
       expect(score).toBeCloseTo(8.25, 1)
       expect(scoreToBand(score)).toBe('standout')
     })

     it('ATT friendly worked example: score=7.3, band=good', () => {
       const score = computeMatchScore(attFriendly)
       expect(score).toBeCloseTo(7.3, 1)
       expect(scoreToBand(score)).toBe('good')
     })

     it('DEF loss worked example: score=5.6, band=mixed', () => {
       const score = computeMatchScore(defLoss)
       expect(score).toBeCloseTo(5.6, 1)
       expect(scoreToBand(score)).toBe('mixed')
     })

     it('MID with dominant performance: high band', () => {
       const score = computeMatchScore({
         position: 'mid', competition: 'league', venue: 'home', opponent: 'Test',
         score_us: 3, score_them: 0, minutes_played: 90, card: 'none',
         body_condition: 'fresh', self_rating: 'excellent', is_friendly: false,
         position_inputs: { passes: 'most', chances_created: '2+', pressing: 'high', assists: '2+', goals: '1', tempo: 'yes' },
       })
       expect(score).toBeGreaterThan(8.5)
       expect(scoreToBand(score)).toBe('standout')
     })

     it('no decimal number in scoreToBand output', () => {
       for (let s = 4.0; s <= 10.0; s += 0.1) {
         const band = scoreToBand(s)
         expect(typeof band).toBe('string')
         expect(band).not.toMatch(/\d+\.\d+/)
       }
     })
   })
   ```
2. Run: `npx vitest --run src/__tests__/match-log.test.ts` — all pass

---

## Gate Verification
1. `npx vitest --run` — all tests green (rating + invite-codes + match-log integration)
2. Manual: log match as GK, DEF, MID, ATT — each produces correct band
3. Manual: verify no decimal number on any player screen
4. Manual: player home shows correct hero band distribution
