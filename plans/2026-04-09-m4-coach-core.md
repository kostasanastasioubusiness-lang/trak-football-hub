# Plan: Milestone 4 — Coach Core (REQ-002)

## Header
- **Goal:** Build coach assessment form, squad management, session log, invite code display, and coach home/profile
- **Architecture:** Client-heavy — assessment band computed client-side from average of 6 sliders
- **Tech Stack:** React, TypeScript, Supabase client, Vitest

## Tasks

### Task 4.1: SliderInput component
**Files:** `src/components/ui/SliderInput.tsx` (create)

**Steps:**
1. Create `SliderInput.tsx`:
   ```tsx
   import { BANDS } from '../../lib/types'
   import { scoreToBand } from '../../lib/rating'

   interface SliderInputProps {
     label: string
     value: number
     onChange: (value: number) => void
   }

   export function SliderInput({ label, value, onChange }: SliderInputProps) {
     const band = scoreToBand(value)
     const config = BANDS.find(b => b.word.toLowerCase() === band)!

     return (
       <div className="space-y-2">
         <div className="flex justify-between items-center">
           <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "'DM Mono', monospace" }}>
             {label}
           </span>
         </div>
         <input
           type="range"
           min={1}
           max={10}
           step={1}
           value={value}
           onChange={e => onChange(Number(e.target.value))}
           className="w-full h-2 rounded-full appearance-none cursor-pointer"
           style={{
             background: `linear-gradient(to right, ${config.color} ${(value - 1) * 11.1}%, #202024 ${(value - 1) * 11.1}%)`,
           }}
         />
       </div>
     )
   }
   ```
2. No number displayed on the slider — coach sees position only
3. Verify: renders, dragging changes value, colour gradient follows band

---

### Task 4.2: Assessment form (6 sliders + band output)
**Files:** `src/pages/coach/Assess.tsx` (create)

**Steps:**
1. Create form with:
   - Player selector (from connected squad, dropdown)
   - Appearance: PillSelector (Started / Sub / Training)
   - 6 sliders: Work Rate, Tactical, Attitude, Technical, Physical, Coachability
   - Note: textarea (optional, visible to player only)
   - Match link: optional selector (list connected player's recent matches)
   - Overall band display: computed from `average(6 scores)` → `scoreToBand` → BandPill
2. Live band preview: recalculates on every slider change
3. Save button: full width, accent style
4. No number displayed — only band word in colour pill below all 6 sliders
5. Verify: move sliders, band changes. All 10s = Exceptional. All 1s = Difficult.

---

### Task 4.3: Assessment save handler
**Files:** `src/hooks/useAssessments.ts` (create)

**Steps:**
1. Create `useAssessments.ts`:
   ```typescript
   import { supabase } from '../lib/supabase'
   import { scoreToBand } from '../lib/rating'
   import { trackEvent } from '../lib/telemetry'
   import type { Assessment, BandType } from '../lib/types'

   export function useAssessments(coachId: string) {
     const saveAssessment = async (input: {
       player_id: string
       match_id: string | null
       appearance: string
       work_rate: number
       tactical: number
       attitude: number
       technical: number
       physical: number
       coachability: number
       note: string | null
     }): Promise<{ assessment: Assessment | null; error: Error | null }> => {
       const avg = (input.work_rate + input.tactical + input.attitude + input.technical + input.physical + input.coachability) / 6
       const overall_band: BandType = scoreToBand(avg)

       const { data, error } = await supabase
         .from('assessments')
         .insert({
           coach_id: coachId,
           player_id: input.player_id,
           match_id: input.match_id,
           appearance: input.appearance,
           work_rate: input.work_rate,
           tactical: input.tactical,
           attitude: input.attitude,
           technical: input.technical,
           physical: input.physical,
           coachability: input.coachability,
           overall_band,
           note: input.note,
         })
         .select()
         .single()

       if (data) {
         trackEvent('assessment', { player_id: input.player_id, overall_band })
       }

       return { assessment: data as Assessment | null, error: error as Error | null }
     }

     const getAssessmentsForPlayer = async (playerId: string): Promise<Assessment[]> => {
       const { data } = await supabase
         .from('assessments')
         .select('*')
         .eq('player_id', playerId)
         .order('assessed_at', { ascending: false })
       return (data ?? []) as Assessment[]
     }

     return { saveAssessment, getAssessmentsForPlayer }
   }
   ```
2. Verify: `npx tsc --noEmit`

---

### Task 4.4: Squad management
**Files:** `src/pages/coach/Squad.tsx` (create), `src/pages/coach/AddPlayer.tsx` (create)

**Steps:**
1. Squad screen: list all connected players, each showing name + latest band pill
2. Query: join `player_coach` → `players` → `profiles`, fetch latest match band
3. AddPlayer screen: manual add form (first name, last name, position, age group)
   - This creates a player profile + player row without an auth account
   - For pilot, the primary connection method is the invite code (player enters coach's TRK-XXXX)
4. Tapping a player navigates to `/coach/squad/:id` (PlayerProfile)
5. Verify: coach sees connected players in squad list

---

### Task 4.5: Player profile view (coach perspective)
**Files:** `src/pages/coach/PlayerProfile.tsx` (create)

**Steps:**
1. Show player's:
   - Name, position, club, age group
   - Band history (list of match bands, most recent first)
   - Assessment history (list of coach's own assessments for this player)
   - "Assess" button → navigates to assessment form pre-filled with this player
2. Verify: navigate from squad → player profile → assess

---

### Task 4.6: Session log
**Files:** `src/pages/coach/Sessions.tsx` (create), `src/pages/coach/AddSession.tsx` (create)

**Steps:**
1. Sessions screen: list of logged sessions (date, type, notes)
2. AddSession form: 3 fields only — date picker, type selector (Training / Match / Other), notes textarea
3. Save to a `sessions` table (add to schema if not present, or store as simple JSONB in coach profile)
4. Verify: add session, appears in list

**Note:** Sessions table was not in the original schema. Add a simple table:
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('training', 'match', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own sessions" ON sessions
  FOR ALL USING (coach_id IN (SELECT id FROM coaches WHERE profile_id = auth.uid()));
```

---

### Task 4.7: Invite code display screen
**Files:** `src/pages/coach/InviteCode.tsx` (create)

**Steps:**
1. Large display of TRK-XXXX code (DM Sans 300, 40px, center-aligned)
2. Copy button: taps copies code to clipboard, shows "Copied!" toast
3. Instructions text: "Share this code with your players. They'll enter it during signup to connect with you."
4. Verify: code matches DB, copy works

---

### Task 4.8: Coach home + profile
**Files:** `src/pages/coach/Home.tsx` (create), `src/pages/coach/Profile.tsx` (create)

**Steps:**
1. Coach home:
   - Squad overview: player count, recent assessments
   - Quick action buttons: "Assess a Player", "Log Session", "View Squad"
2. Coach profile:
   - Name, club, age group, role
   - Invite code (small display with copy)
   - Season stats: total assessments, players connected
   - Previous clubs section (if any)
3. Verify: home renders with correct counts

---

### Task 4.9: Integration tests for assessment flow
**Files:** `src/__tests__/assessment.test.ts` (create)

**Steps:**
1. Create test file:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { scoreToBand } from '../lib/rating'

   describe('assessment band computation', () => {
     it('computes overall band from average of 6 scores', () => {
       // All 8s: average = 8.0 → good (7.2–8.1)
       const avg = (8 + 8 + 8 + 8 + 8 + 8) / 6
       expect(scoreToBand(avg)).toBe('good')
     })

     it('all 1s maps to difficult', () => {
       const avg = (1 + 1 + 1 + 1 + 1 + 1) / 6
       expect(scoreToBand(avg)).toBe('difficult')
     })

     it('all 10s maps to exceptional', () => {
       const avg = (10 + 10 + 10 + 10 + 10 + 10) / 6
       expect(scoreToBand(avg)).toBe('exceptional')
     })

     it('mixed scores produce correct band', () => {
       // 7+6+8+7+6+8 = 42/6 = 7.0 → steady (6.4–7.1)
       const avg = (7 + 6 + 8 + 7 + 6 + 8) / 6
       expect(scoreToBand(avg)).toBe('steady')
     })

     it('band output is string, not number', () => {
       for (let i = 1; i <= 10; i++) {
         const band = scoreToBand(i)
         expect(typeof band).toBe('string')
       }
     })
   })
   ```
2. Run: `npx vitest --run src/__tests__/assessment.test.ts` — all pass

---

## Gate Verification
1. `npx vitest --run` — all tests green
2. Manual: coach assesses connected player, band appears correctly
3. Manual: coach cannot assess unconnected player (player not in dropdown)
4. Manual: no decimal visible on any coach screen
