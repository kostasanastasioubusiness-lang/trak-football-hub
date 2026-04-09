# Plan: Milestone 5 — Parent Core (REQ-004)

## Header
- **Goal:** Build parent home, match feed (filtered), goals view, and alerts — all read-only
- **Architecture:** Client-heavy — parent queries Supabase with explicit column selection to exclude private fields; RLS enforces row-level, app enforces column-level
- **Tech Stack:** React, TypeScript, Supabase client, Vitest

## Tasks

### Task 5.1: CategoryBar component
**Files:** `src/components/ui/CategoryBar.tsx` (create)

**Steps:**
1. Create `CategoryBar.tsx`:
   ```tsx
   import { BANDS } from '../../lib/types'
   import { scoreToBand } from '../../lib/rating'

   interface CategoryBarProps {
     label: string
     score: number  // 1-10, used internally to derive band colour
   }

   export function CategoryBar({ label, score }: CategoryBarProps) {
     const band = scoreToBand(score)
     const config = BANDS.find(b => b.word.toLowerCase() === band)!
     const widthPercent = (score / 10) * 100

     return (
       <div className="space-y-1">
         <div className="flex justify-between items-center">
           <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "'DM Mono', monospace" }}>
             {label}
           </span>
           <span className="text-xs" style={{ color: config.color }}>
             {config.word}
           </span>
         </div>
         <div className="h-1.5 rounded-full bg-[#202024] overflow-hidden">
           <div
             className="h-full rounded-full transition-all duration-500"
             style={{ width: `${widthPercent}%`, backgroundColor: config.color }}
           />
         </div>
       </div>
     )
   }
   ```
2. Note: parent sees the bar width + band word + colour, but NOT the underlying score number
3. Verify: renders with correct colour and width for various scores

---

### Task 5.2: AlertCard component
**Files:** `src/components/ui/AlertCard.tsx` (create)

**Steps:**
1. Create `AlertCard.tsx`:
   ```tsx
   import { Card } from './Card'
   import { MetadataLabel } from './MetadataLabel'

   interface AlertCardProps {
     type: 'match_logged' | 'assessment' | 'medal'
     childName: string
     detail: string
     timestamp: string
   }

   export function AlertCard({ type, childName, detail, timestamp }: AlertCardProps) {
     const icons: Record<string, string> = {
       match_logged: 'Match logged',
       assessment: 'New assessment',
       medal: 'Medal unlocked',
     }

     return (
       <Card>
         <div className="space-y-1">
           <MetadataLabel text={`${icons[type]} \u00b7 ${new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`} />
           <p className="text-sm text-[rgba(255,255,255,0.88)]">{childName} {detail}</p>
         </div>
       </Card>
     )
   }
   ```
2. Verify: renders 3 alert types correctly

---

### Task 5.3: Parent home
**Files:** `src/pages/parent/Home.tsx` (create)

**Steps:**
1. Query child's data:
   - Profile info (name) via `player_parent` → `players` → `profiles`
   - All matches: `SELECT id, opponent, score_us, score_them, competition, venue, band, logged_at FROM matches WHERE player_id = childId` (no private columns)
   - Latest assessment: `SELECT * FROM assessments WHERE player_id = childId ORDER BY assessed_at DESC LIMIT 1`
2. Hero card:
   - "THIS SEASON" MetadataLabel
   - Large season band word (mode of all bands)
   - Band distribution bars
   - Match count
3. Latest assessment section:
   - 6 CategoryBar components (work_rate, tactical, attitude, technical, physical, coachability)
   - Overall band pill
   - No `note` field displayed (filtered at app layer)
4. Empty state: "No matches yet. When [Child] logs a match, you'll see it here."
5. Verify: parent sees child's data, no private fields visible

---

### Task 5.4: Parent match feed (filtered)
**Files:** `src/pages/parent/Matches.tsx` (create)

**Steps:**
1. Query: explicit column list excluding `body_condition`, `self_rating`, `position_inputs`, `computed_score`
   ```typescript
   const { data } = await supabase
     .from('matches')
     .select('id, opponent, score_us, score_them, competition, venue, age_group, minutes_played, band, logged_at, position')
     .eq('player_id', childPlayerId)
     .order('logged_at', { ascending: false })
   ```
2. Render as MatchCard list (opponent, date, score, band pill)
3. Tapping a match shows basic detail (no private inputs)
4. Verify: parent match feed shows bands but NOT body_condition, self_rating, or position_inputs

---

### Task 5.5: Parent goals view
**Files:** `src/pages/parent/Goals.tsx` (create)

**Steps:**
1. Query child's goals: `SELECT * FROM goals WHERE player_id = childId ORDER BY created_at DESC`
2. Render as GoalCard list (read-only, no edit buttons)
3. Show progress bars for auto-tracked goals, progress level for manual goals
4. Verify: parent sees goals, cannot interact/edit

---

### Task 5.6: Parent alerts
**Files:** `src/pages/parent/Alerts.tsx` (create), `src/hooks/useAlerts.ts` (create)

**Steps:**
1. Alerts are derived from data, not a separate alerts table (for pilot simplicity):
   - Match logged: query recent matches, format as alerts
   - Assessment: query recent assessments, format as alerts
   - Medal: query medals, format as alerts
2. Merge and sort by timestamp, most recent first
3. Render as AlertCard list
4. Verify: parent sees 3 alert types

---

### Task 5.7: Integration tests for parent access
**Files:** `src/__tests__/parent-access.test.ts` (create)

**Steps:**
1. Create test file:
   ```typescript
   import { describe, it, expect } from 'vitest'

   describe('parent data filtering', () => {
     const PARENT_MATCH_COLUMNS = [
       'id', 'opponent', 'score_us', 'score_them', 'competition',
       'venue', 'age_group', 'minutes_played', 'band', 'logged_at', 'position',
     ]
     const PRIVATE_COLUMNS = ['body_condition', 'self_rating', 'position_inputs', 'computed_score']

     it('parent match query includes only safe columns', () => {
       PARENT_MATCH_COLUMNS.forEach(col => {
         expect(PARENT_MATCH_COLUMNS).toContain(col)
       })
     })

     it('parent match query excludes private columns', () => {
       PRIVATE_COLUMNS.forEach(col => {
         expect(PARENT_MATCH_COLUMNS).not.toContain(col)
       })
     })

     it('parent assessment view excludes note field', () => {
       const PARENT_ASSESSMENT_FIELDS = [
         'work_rate', 'tactical', 'attitude', 'technical',
         'physical', 'coachability', 'overall_band', 'assessed_at',
       ]
       expect(PARENT_ASSESSMENT_FIELDS).not.toContain('note')
     })
   })
   ```
2. Run: `npx vitest --run src/__tests__/parent-access.test.ts` — all pass

---

## Gate Verification
1. `npx vitest --run` — all tests green
2. Manual: parent sees child bands + assessment bars, no private fields
3. Manual: parent tries to navigate to `/player/*` routes — RouteGuard redirects
4. Manual: empty state renders when child has zero matches
