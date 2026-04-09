# Plan: Milestone 6 — Goals, Medals, Telemetry, Profiles (REQ-005 + remaining)

## Header
- **Goal:** Complete goals system, medal triggers, telemetry instrumentation, player/coach profiles, and end-to-end verification
- **Architecture:** Client-heavy — medal checks and goal updates run client-side after match save; telemetry fires silently
- **Tech Stack:** React, TypeScript, Supabase client, Vitest

## Tasks

### Task 6.1: Goals CRUD + auto-tracking logic
**Files:** `src/hooks/useGoals.ts` (create), `src/lib/goals.ts` (create)

**Steps:**
1. Create `src/lib/goals.ts`:
   ```typescript
   import { supabase } from './supabase'
   import type { Goal, Match } from './types'

   export async function checkAutoGoals(playerId: string, match: Match): Promise<Goal[]> {
     const { data: goals } = await supabase
       .from('goals')
       .select('*')
       .eq('player_id', playerId)
       .eq('is_auto_tracked', true)
       .eq('completed', false)

     if (!goals || goals.length === 0) return []

     const updatedGoals: Goal[] = []

     for (const goal of goals as Goal[]) {
       let newValue = goal.current_number

       if (goal.tracking_field === 'goals_scored') {
         const matchGoals = parseInt(String(match.position_inputs.goals ?? '0').replace('+', '')) || 0
         newValue += matchGoals
       } else if (goal.tracking_field === 'matches_played') {
         newValue += 1
       } else if (goal.tracking_field === 'standout_bands') {
         if (match.band === 'exceptional' || match.band === 'standout') {
           newValue += 1
         }
       }

       if (newValue !== goal.current_number) {
         const completed = goal.target_number !== null && newValue >= goal.target_number
         await supabase
           .from('goals')
           .update({
             current_number: completed ? goal.target_number : newValue,
             completed,
           })
           .eq('id', goal.id)

         updatedGoals.push({ ...goal, current_number: newValue, completed })
       }
     }

     return updatedGoals
   }
   ```
2. Create `src/hooks/useGoals.ts` with CRUD operations:
   - `addGoal(goal)` — INSERT into goals
   - `updateGoalProgress(goalId, progressLevel, note)` — UPDATE for manual goals
   - `getGoals(playerId)` — SELECT all goals
3. Verify: `npx tsc --noEmit`

---

### Task 6.2: Goals screens
**Files:** `src/pages/player/Goals.tsx` (create), `src/pages/player/AddGoal.tsx` (create), `src/pages/player/UpdateGoal.tsx` (create)

**Steps:**
1. Goals list screen:
   - Auto-tracked goals: progress bar (current / target)
   - Manual goals: progress level badge (Just Started / Making Progress / Nearly There / Achieved)
   - "Add Goal" button
2. AddGoal screen:
   - Title: text input
   - Category: PillSelector (Performance / Consistency / Development / Personal)
   - Target number: number input (optional, for numeric goals)
   - Target date: date input (optional)
   - Auto-tracked toggle: if true, show tracking_field selector (goals_scored / matches_played / standout_bands)
3. UpdateGoal screen (manual goals only):
   - Progress level: PillSelector (Just Started / Making Progress / Nearly There / Achieved)
   - Note: textarea
   - Save → UPDATE goals row
4. GoalCard component (`src/components/ui/GoalCard.tsx`):
   ```tsx
   import { Card } from './Card'
   import { MetadataLabel } from './MetadataLabel'
   import type { Goal } from '../../lib/types'

   export function GoalCard({ goal, onTap }: { goal: Goal; onTap?: () => void }) {
     const progress = goal.target_number
       ? Math.min((goal.current_number / goal.target_number) * 100, 100)
       : null

     return (
       <Card>
         <button onClick={onTap} className="w-full text-left space-y-2">
           <p className="text-sm text-[rgba(255,255,255,0.88)]">{goal.title}</p>
           <MetadataLabel text={goal.category} />
           {progress !== null && (
             <div className="h-1.5 rounded-full bg-[#202024] overflow-hidden">
               <div
                 className="h-full rounded-full bg-[#C8F25A] transition-all"
                 style={{ width: `${progress}%` }}
               />
             </div>
           )}
           {goal.progress_level && !goal.is_auto_tracked && (
             <span className="text-xs text-[rgba(255,255,255,0.45)]">
               {goal.progress_level.replace(/_/g, ' ')}
             </span>
           )}
         </button>
       </Card>
     )
   }
   ```
5. Verify: add a goal, see it in list, update progress

---

### Task 6.3: Medal checker (TDD)
**Files:** `src/lib/medals.ts` (create), `src/lib/__tests__/medals.test.ts` (create)

**Steps:**
1. Create test file `src/lib/__tests__/medals.test.ts`:
   ```typescript
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
     score_us: 1,
     score_them: 0,
     minutes_played: 80,
     card: 'none',
     body_condition: 'good',
     self_rating: 'good',
     position_inputs: {},
     computed_score: 7.5,
     band: 'good',
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
   ```
2. Run test: `npx vitest --run src/lib/__tests__/medals.test.ts` — expect FAIL
3. Create `src/lib/medals.ts`:
   ```typescript
   import { supabase } from './supabase'
   import type { Match, Medal, MedalType } from './types'

   export function checkMedalEligibility(matches: Match[], existingMedals: Medal[]): MedalType[] {
     const earned = new Set(existingMedals.map(m => m.medal_type))
     const newMedals: MedalType[] = []

     // First Match
     if (!earned.has('first_match') && matches.length >= 1) {
       newMedals.push('first_match')
     }

     // Ten Down
     if (!earned.has('ten_down') && matches.length >= 10) {
       newMedals.push('ten_down')
     }

     // First Star
     if (!earned.has('first_star') && matches.some(m => m.band === 'exceptional' || m.band === 'standout')) {
       newMedals.push('first_star')
     }

     // On a Roll: 5 consecutive calendar weeks with at least 1 match
     if (!earned.has('on_a_roll')) {
       const weeks = [...new Set(matches.map(m => {
         const d = new Date(m.logged_at)
         const jan1 = new Date(d.getFullYear(), 0, 1)
         const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
         return `${d.getFullYear()}-W${weekNum}`
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

     // Most Improved: average score of matches 11-20 > average of matches 1-10
     if (!earned.has('most_improved') && matches.length >= 20) {
       const sorted = [...matches].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
       const first10Avg = sorted.slice(0, 10).reduce((s, m) => s + m.computed_score, 0) / 10
       const second10Avg = sorted.slice(10, 20).reduce((s, m) => s + m.computed_score, 0) / 10
       if (second10Avg > first10Avg) {
         newMedals.push('most_improved')
       }
     }

     // Self Aware: handled separately (requires assessment data, not just matches)

     return newMedals
   }

   export async function awardMedals(playerId: string, medalTypes: MedalType[]): Promise<Medal[]> {
     if (medalTypes.length === 0) return []

     const rows = medalTypes.map(t => ({ player_id: playerId, medal_type: t }))
     const { data } = await supabase
       .from('medals')
       .insert(rows)
       .select()

     return (data ?? []) as Medal[]
   }
   ```
4. Run test: `npx vitest --run src/lib/__tests__/medals.test.ts` — expect PASS

---

### Task 6.4: Medals screen
**Files:** `src/pages/player/Medals.tsx` (create), `src/components/ui/MedalSlot.tsx` (create)

**Steps:**
1. Create `MedalSlot.tsx`:
   ```tsx
   import type { MedalType, Medal } from '../../lib/types'

   const MEDAL_INFO: Record<MedalType, { name: string; description: string }> = {
     first_match: { name: 'First Match', description: 'Log your first match' },
     on_a_roll: { name: 'On a Roll', description: 'Log matches in 5 consecutive weeks' },
     first_star: { name: 'First Star', description: 'Earn Exceptional or Standout' },
     ten_down: { name: 'Ten Down', description: 'Log 10 matches' },
     most_improved: { name: 'Most Improved', description: 'Improve over a 10-match window' },
     self_aware: { name: 'Self Aware', description: 'Self-rating aligns with coach 5 times' },
   }

   export function MedalSlot({ medalType, earned }: { medalType: MedalType; earned: Medal | null }) {
     const info = MEDAL_INFO[medalType]
     return (
       <div className={`flex flex-col items-center gap-2 p-4 rounded-[14px] border ${
         earned
           ? 'bg-[rgba(200,242,90,0.08)] border-[rgba(200,242,90,0.2)]'
           : 'bg-[#101012] border-white/[0.07] opacity-40'
       }`}>
         <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
           earned ? 'bg-[rgba(200,242,90,0.15)]' : 'bg-[#202024]'
         }`}>
           <span className="text-xl">{earned ? '★' : '○'}</span>
         </div>
         <span className="text-xs text-center text-[rgba(255,255,255,0.88)]">{info.name}</span>
         <span className="text-[9px] text-center text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "'DM Mono', monospace" }}>
           {info.description}
         </span>
         {earned && (
           <span className="text-[9px] text-[#C8F25A]" style={{ fontFamily: "'DM Mono', monospace" }}>
             {new Date(earned.unlocked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
           </span>
         )}
       </div>
     )
   }
   ```
2. Medals screen: 6 MedalSlot components in a 2×3 grid
3. Query `medals` for player, match earned medals to slots
4. Verify: unlocked medals show coloured, locked show grey

---

### Task 6.5: Telemetry client (TDD)
**Files:** `src/lib/telemetry.ts` (create), `src/lib/__tests__/telemetry.test.ts` (create)

**Steps:**
1. Create test file:
   ```typescript
   import { describe, it, expect, vi } from 'vitest'
   import { trackEvent } from '../telemetry'

   // Mock supabase
   vi.mock('../supabase', () => ({
     supabase: {
       from: () => ({
         insert: vi.fn().mockResolvedValue({ error: null }),
       }),
       auth: {
         getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-uid' } } }),
       },
     },
   }))

   describe('telemetry', () => {
     it('trackEvent does not throw on success', async () => {
       await expect(trackEvent('match_log', { band: 'good' })).resolves.not.toThrow()
     })

     it('trackEvent does not throw on failure', async () => {
       // Even if insert fails, should not throw
       const { supabase } = await import('../supabase')
       vi.mocked(supabase.from).mockReturnValueOnce({
         insert: vi.fn().mockResolvedValue({ error: new Error('network') }),
       } as any)
       await expect(trackEvent('match_log', {})).resolves.not.toThrow()
     })

     it('trackEvent accepts valid event types', async () => {
       const types = ['form_start', 'form_submit', 'match_log', 'assessment', 'parent_open']
       for (const t of types) {
         await expect(trackEvent(t, {})).resolves.not.toThrow()
       }
     })
   })
   ```
2. Run test: expect FAIL
3. Create `src/lib/telemetry.ts`:
   ```typescript
   import { supabase } from './supabase'

   export async function trackEvent(eventType: string, metadata: Record<string, unknown> = {}): Promise<void> {
     try {
       const { data: { user } } = await supabase.auth.getUser()
       if (!user) return

       await supabase.from('telemetry_events').insert({
         user_id: user.id,
         event_type: eventType,
         metadata,
       })
     } catch {
       // Telemetry must never block the user's flow — swallow all errors
     }
   }
   ```
4. Run test: expect PASS

---

### Task 6.6: Player profile
**Files:** `src/pages/player/Profile.tsx` (create), `src/components/ui/InviteCodeDisplay.tsx` (create)

**Steps:**
1. InviteCodeDisplay component:
   - Large code text (DM Sans 300, 32px)
   - Copy button with "Copied!" feedback
   - Works for both TRK-XXXX and PAR-XXXX formats
2. Player profile screen:
   - Name, position, club, age group, shirt number
   - Season stats: matches played, goals scored (from match data)
   - Coach assessment bars (6 categories from latest assessment)
   - Connections: coach name, parent invite code (with copy)
   - Previous clubs section
3. Verify: profile renders with correct data

---

### Task 6.7: Log choose screen
**Files:** `src/pages/player/LogChoose.tsx` (create)

**Steps:**
1. Simple screen: "Log a Match" button navigating to `/player/log/form`
2. If player has multiple positions (future), could show position chooser
3. For pilot: single action → navigate to LogForm with profile position pre-filled
4. Verify: tapping "Log a Match" navigates to form

---

### Task 6.8: Telemetry SQL views
**Files:** `supabase/migrations/002_telemetry_views.sql` (create)

**Steps:**
1. Create migration with views from PRD Section 7.2:
   ```sql
   CREATE OR REPLACE VIEW pilot_weekly_summary AS
   SELECT
     date_trunc('week', te.created_at) AS week_start,
     te.event_type,
     COUNT(DISTINCT te.user_id) AS unique_users,
     COUNT(*) AS total_events
   FROM telemetry_events te
   GROUP BY 1, 2
   ORDER BY 1 DESC, 2;

   CREATE OR REPLACE VIEW pilot_player_logging AS
   SELECT
     p.id AS player_id,
     pr.first_name,
     date_trunc('week', m.logged_at) AS week_start,
     COUNT(*) AS matches_logged
   FROM players p
   JOIN profiles pr ON p.profile_id = pr.id
   LEFT JOIN matches m ON m.player_id = p.id
   GROUP BY 1, 2, 3
   ORDER BY 3 DESC, 2;
   ```
2. Run migration
3. Verify: query `pilot_weekly_summary` in Supabase SQL editor — returns rows

---

### Task 6.9: End-to-end pilot verification
**Files:** `src/__tests__/pilot-e2e.test.ts` (create)

**Steps:**
1. Create verification checklist test:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { computeMatchScore, scoreToBand } from '../lib/rating'
   import { checkMedalEligibility } from '../lib/medals'
   import { BANDS } from '../lib/types'

   describe('pilot readiness checks', () => {
     it('all 7 bands have display config', () => {
       const bands = ['exceptional', 'standout', 'good', 'steady', 'mixed', 'developing', 'difficult']
       bands.forEach(b => {
         const config = BANDS.find(c => c.word.toLowerCase() === b)
         expect(config).toBeDefined()
         expect(config!.color).toBeTruthy()
         expect(config!.bg).toBeTruthy()
         expect(config!.border).toBeTruthy()
       })
     })

     it('scoreToBand covers full range without gaps', () => {
       for (let s = 4.0; s <= 10.0; s += 0.01) {
         const band = scoreToBand(parseFloat(s.toFixed(2)))
         expect(typeof band).toBe('string')
         expect(band.length).toBeGreaterThan(0)
       }
     })

     it('all 4 positions produce valid scores', () => {
       const positions = ['gk', 'def', 'mid', 'att'] as const
       positions.forEach(pos => {
         const score = computeMatchScore({
           position: pos,
           competition: 'league',
           venue: 'home',
           opponent: 'Test',
           score_us: 1,
           score_them: 1,
           minutes_played: 80,
           card: 'none',
           body_condition: 'good',
           self_rating: 'average',
           position_inputs: {},
           is_friendly: false,
         })
         expect(score).toBeGreaterThanOrEqual(4.0)
         expect(score).toBeLessThanOrEqual(10.0)
       })
     })

     it('medal checker returns array of valid medal types', () => {
       const result = checkMedalEligibility([], [])
       expect(Array.isArray(result)).toBe(true)
     })
   })
   ```
2. Run: `npx vitest --run` — ALL tests across all milestones pass
3. Manual verification checklist:
   - [ ] Coach onboards → gets TRK-XXXX
   - [ ] Player onboards → enters TRK-XXXX → connected
   - [ ] Player generates PAR-XXXX
   - [ ] Parent onboards → enters PAR-XXXX → sees child
   - [ ] Player logs match as GK → correct band
   - [ ] Player logs match as DEF → correct band
   - [ ] Player logs match as MID → correct band
   - [ ] Player logs match as ATT → correct band
   - [ ] Live preview updates during form fill
   - [ ] No decimal number on any screen
   - [ ] Coach assesses player → band appears
   - [ ] Parent sees match feed (no private fields)
   - [ ] Parent sees assessment bars (no note)
   - [ ] Medal unlocks on first match
   - [ ] Goals update after match save
   - [ ] Telemetry view returns correct counts
   - [ ] Total triangle time < 10 minutes

---

## Gate Verification
1. `npx vitest --run` — all test suites pass (rating, invite-codes, match-log, assessment, parent-access, medals, telemetry, pilot-e2e)
2. Manual E2E walkthrough for all 3 roles on mobile web (≤430px)
3. Query `pilot_weekly_summary` — returns correct data
4. No TBD, TODO, or placeholder values anywhere in the codebase
