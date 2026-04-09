# Plan: Milestone 1 — Foundation

## Header
- **Goal:** Scaffold the project, configure the design system, build the rating engine and shared UI components
- **Architecture:** ARCHITECTURE.md — Client-Heavy approach, React + Vite + TypeScript
- **Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Vitest, DM Sans + DM Mono fonts

## Tasks

### Task 1.1: Scaffold React + Vite + TypeScript project
**Files:** `package.json` (create), `vite.config.ts` (create), `tsconfig.json` (create), `index.html` (create), `src/main.tsx` (create)

**Steps:**
1. Run `npm create vite@latest . -- --template react-ts` in the project root
2. Run `npm install`
3. Run `npm install @supabase/supabase-js react-router-dom`
4. Run `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
5. Add vitest config to `vite.config.ts`:
   ```typescript
   /// <reference types="vitest" />
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './src/test-setup.ts',
     },
   })
   ```
6. Create `src/test-setup.ts`:
   ```typescript
   import '@testing-library/jest-dom'
   ```
7. Verify: `npx vitest --run` — expect 0 tests, no errors

---

### Task 1.2: Configure Tailwind with design tokens
**Files:** `tailwind.config.ts` (create), `src/styles/globals.css` (create), `postcss.config.js` (create)

**Steps:**
1. Run `npm install -D tailwindcss @tailwindcss/vite`
2. Create `src/styles/globals.css`:
   ```css
   @import "tailwindcss";

   :root {
     --bg: #0A0A0B;
     --s1: #101012;
     --s2: #17171A;
     --s3: #202024;
     --border: rgba(255, 255, 255, 0.07);
     --border-md: rgba(255, 255, 255, 0.11);
     --accent: #C8F25A;
     --t1: rgba(255, 255, 255, 0.88);
     --t2: rgba(255, 255, 255, 0.45);
     --t3: rgba(255, 255, 255, 0.22);
   }

   body {
     background-color: var(--bg);
     color: var(--t1);
     font-family: 'DM Sans', sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
   }

   /* Band pill classes */
   .band-exceptional { background: rgba(200,242,90,0.15); color: #C8F25A; border: 1px solid rgba(200,242,90,0.3); }
   .band-standout    { background: rgba(134,239,172,0.13); color: #86efac; border: 1px solid rgba(134,239,172,0.26); }
   .band-good        { background: rgba(74,222,128,0.13);  color: #4ade80; border: 1px solid rgba(74,222,128,0.24); }
   .band-steady      { background: rgba(96,165,250,0.13);  color: #60a5fa; border: 1px solid rgba(96,165,250,0.24); }
   .band-mixed       { background: rgba(251,146,60,0.13);  color: #fb923c; border: 1px solid rgba(251,146,60,0.24); }
   .band-developing  { background: rgba(167,139,250,0.13); color: #a78bfa; border: 1px solid rgba(167,139,250,0.24); }
   .band-difficult   { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }
   ```
3. Import `globals.css` in `src/main.tsx`
4. Verify: `npm run dev` — app loads with dark background (#0A0A0B)

---

### Task 1.3: Load fonts (DM Sans + DM Mono)
**Files:** `index.html` (modify)

**Steps:**
1. Add to `<head>` in `index.html`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
   ```
2. Add viewport meta for mobile:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```
3. Verify: inspect element in browser, confirm `font-family: 'DM Sans'` applied to body

---

### Task 1.4: Initialize Supabase client
**Files:** `src/lib/supabase.ts` (create)

**Steps:**
1. Create `src/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   if (!supabaseUrl || !supabaseAnonKey) {
     throw new Error('Missing Supabase environment variables')
   }

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```
2. Create `.env.local` (gitignored):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Add `.env.local` to `.gitignore`
4. Verify: TypeScript compiles without errors

---

### Task 1.5: Build TypeScript types
**Files:** `src/lib/types.ts` (create)

**Steps:**
1. Create `src/lib/types.ts` with all types from PRD Section 17.2:
   ```typescript
   export type Role = 'player' | 'coach' | 'parent'
   export type Position = 'gk' | 'def' | 'mid' | 'att'
   export type Competition = 'league' | 'cup' | 'tournament' | 'friendly'
   export type Venue = 'home' | 'away'
   export type CardType = 'none' | 'yellow' | 'red'
   export type BodyCondition = 'fresh' | 'good' | 'tired' | 'knock'
   export type SelfRating = 'poor' | 'average' | 'good' | 'excellent'
   export type BandType = 'exceptional' | 'standout' | 'good' | 'steady' | 'mixed' | 'developing' | 'difficult'
   export type MedalType = 'first_match' | 'on_a_roll' | 'first_star' | 'ten_down' | 'most_improved' | 'self_aware'
   export type GoalCategory = 'performance' | 'consistency' | 'development' | 'personal'
   export type ProgressLevel = 'just_started' | 'making_progress' | 'nearly_there' | 'achieved'
   export type Appearance = 'started' | 'sub' | 'training'
   export type SelfRatingFlag = 'fair' | 'generous' | 'way off'

   export interface BandConfig {
     word: string
     color: string
     bg: string
     border: string
     minScore: number
   }

   export const BANDS: BandConfig[] = [
     { word: 'Exceptional', color: '#C8F25A', bg: 'rgba(200,242,90,0.15)', border: 'rgba(200,242,90,0.3)', minScore: 9.2 },
     { word: 'Standout', color: '#86efac', bg: 'rgba(134,239,172,0.13)', border: 'rgba(134,239,172,0.26)', minScore: 8.2 },
     { word: 'Good', color: '#4ade80', bg: 'rgba(74,222,128,0.13)', border: 'rgba(74,222,128,0.24)', minScore: 7.2 },
     { word: 'Steady', color: '#60a5fa', bg: 'rgba(96,165,250,0.13)', border: 'rgba(96,165,250,0.24)', minScore: 6.4 },
     { word: 'Mixed', color: '#fb923c', bg: 'rgba(251,146,60,0.13)', border: 'rgba(251,146,60,0.24)', minScore: 5.6 },
     { word: 'Developing', color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.24)', minScore: 4.8 },
     { word: 'Difficult', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', minScore: 0 },
   ]

   export interface MatchInput {
     position: Position
     competition: Competition
     venue: Venue
     opponent: string
     score_us: number
     score_them: number
     minutes_played: number
     card: CardType
     body_condition: BodyCondition
     self_rating: SelfRating
     position_inputs: Record<string, string | number>
     is_friendly: boolean
   }

   export interface Match extends MatchInput {
     id: string
     player_id: string
     computed_score: number
     band: BandType
     logged_at: string
   }

   export interface Assessment {
     id: string
     coach_id: string
     player_id: string
     match_id: string | null
     appearance: Appearance
     work_rate: number
     tactical: number
     attitude: number
     technical: number
     physical: number
     coachability: number
     overall_band: BandType
     self_rating_flag: SelfRatingFlag | null
     note: string | null
     assessed_at: string
   }

   export interface Goal {
     id: string
     player_id: string
     title: string
     category: GoalCategory
     target_number: number | null
     current_number: number
     is_auto_tracked: boolean
     tracking_field: string | null
     progress_level: ProgressLevel | null
     progress_note: string | null
     target_date: string | null
     completed: boolean
     created_at: string
   }

   export interface Medal {
     id: string
     player_id: string
     medal_type: MedalType
     unlocked_at: string
   }

   export interface Profile {
     id: string
     role: Role
     first_name: string
     last_name: string
     nationality: string | null
     created_at: string
   }

   export interface Player {
     id: string
     profile_id: string
     position: Position
     club: string | null
     age_group: string | null
     shirt_number: number | null
     coach_invite_code: string | null
     parent_invite_code: string | null
     created_at: string
   }

   export interface Coach {
     id: string
     profile_id: string
     club: string | null
     age_group: string | null
     role: string | null
     invite_code: string
     created_at: string
   }

   export interface Parent {
     id: string
     profile_id: string
     created_at: string
   }
   ```
2. Verify: `npx tsc --noEmit` — no type errors

---

### Task 1.6: Build rating engine (TDD)
**Files:** `src/lib/rating.ts` (create), `src/lib/__tests__/rating.test.ts` (create)

**Steps:**
1. Create test file `src/lib/__tests__/rating.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { computeMatchScore, scoreToBand } from '../rating'
   import type { MatchInput } from '../types'

   const baseMatch: MatchInput = {
     position: 'att',
     competition: 'league',
     venue: 'home',
     opponent: 'Test FC',
     score_us: 1,
     score_them: 1,
     minutes_played: 80,
     card: 'none',
     body_condition: 'good',
     self_rating: 'average',
     position_inputs: {},
     is_friendly: false,
   }

   describe('scoreToBand', () => {
     it('maps 9.2+ to exceptional', () => {
       expect(scoreToBand(9.5)).toBe('exceptional')
       expect(scoreToBand(9.2)).toBe('exceptional')
     })
     it('maps 8.2-9.1 to standout', () => {
       expect(scoreToBand(8.5)).toBe('standout')
       expect(scoreToBand(9.19)).toBe('standout')
     })
     it('maps 7.2-8.1 to good', () => {
       expect(scoreToBand(7.5)).toBe('good')
     })
     it('maps 6.4-7.1 to steady', () => {
       expect(scoreToBand(6.5)).toBe('steady')
     })
     it('maps 5.6-6.3 to mixed', () => {
       expect(scoreToBand(6.0)).toBe('mixed')
     })
     it('maps 4.8-5.5 to developing', () => {
       expect(scoreToBand(5.0)).toBe('developing')
     })
     it('maps below 4.8 to difficult', () => {
       expect(scoreToBand(4.0)).toBe('difficult')
       expect(scoreToBand(4.79)).toBe('difficult')
     })
     it('returns a string, never a number', () => {
       const result = scoreToBand(7.5)
       expect(typeof result).toBe('string')
     })
   })

   describe('computeMatchScore', () => {
     it('returns baseline 6.5 for neutral inputs', () => {
       const score = computeMatchScore(baseMatch)
       // draw (0) + average (0) + no card (0) + good body (0) + 80 min (+0.1)
       expect(score).toBeCloseTo(6.6, 1)
     })

     it('adds +0.3 for team win', () => {
       const score = computeMatchScore({ ...baseMatch, score_us: 2, score_them: 1 })
       expect(score).toBeCloseTo(6.9, 1)
     })

     it('subtracts -0.2 for team loss', () => {
       const score = computeMatchScore({ ...baseMatch, score_us: 0, score_them: 2 })
       expect(score).toBeCloseTo(6.4, 1)
     })

     it('applies friendly multiplier 0.8 to modifiers only', () => {
       const nonFriendly = computeMatchScore({
         ...baseMatch,
         score_us: 3,
         score_them: 0,
         self_rating: 'excellent',
         body_condition: 'fresh',
       })
       const friendly = computeMatchScore({
         ...baseMatch,
         score_us: 3,
         score_them: 0,
         self_rating: 'excellent',
         body_condition: 'fresh',
         is_friendly: true,
       })
       // Friendly should be closer to baseline
       const nonFriendlyDelta = nonFriendly - 6.5
       const friendlyDelta = friendly - 6.5
       expect(friendlyDelta).toBeCloseTo(nonFriendlyDelta * 0.8, 1)
     })

     it('clamps score at minimum 4.0', () => {
       const score = computeMatchScore({
         ...baseMatch,
         score_us: 0,
         score_them: 5,
         self_rating: 'poor',
         card: 'red',
         body_condition: 'knock',
         minutes_played: 30,
         position_inputs: { goals: '0', assists: '0', shots_on_target: '0', attacking_threat: 'quiet', holdup_play: 'poor', pressing: 'low' },
       })
       expect(score).toBeGreaterThanOrEqual(4.0)
     })

     it('clamps score at maximum 10.0', () => {
       const score = computeMatchScore({
         ...baseMatch,
         score_us: 5,
         score_them: 0,
         self_rating: 'excellent',
         body_condition: 'fresh',
         position_inputs: { goals: '3+', assists: '2+', shots_on_target: '5+', attacking_threat: 'dominant', holdup_play: 'good', pressing: 'high' },
       })
       expect(score).toBeLessThanOrEqual(10.0)
     })

     // Worked example 1 from algorithm doc: GK, league, won 1-0
     it('produces Standout for worked example 1 (GK)', () => {
       const score = computeMatchScore({
         ...baseMatch,
         position: 'gk',
         score_us: 1,
         score_them: 0,
         self_rating: 'good',
         body_condition: 'fresh',
         minutes_played: 80,
         position_inputs: {
           clean_sheet: 'yes',
           saves: '3-4',
           distribution: 'good',
           commanding: 'yes',
           errors: 'none',
         },
       })
       expect(score).toBeCloseTo(8.25, 1)
       expect(scoreToBand(score)).toBe('standout')
     })

     // Worked example 2: ATT, friendly, drew 1-1
     it('produces Good for worked example 2 (ATT friendly)', () => {
       const score = computeMatchScore({
         ...baseMatch,
         position: 'att',
         competition: 'friendly',
         score_us: 1,
         score_them: 1,
         self_rating: 'excellent',
         card: 'yellow',
         body_condition: 'good',
         minutes_played: 75,
         is_friendly: true,
         position_inputs: {
           goals: '1',
           assists: '0',
           shots_on_target: '3-4',
           attacking_threat: 'dangerous',
           holdup_play: 'average',
           pressing: 'medium',
         },
       })
       expect(score).toBeCloseTo(7.3, 1)
       expect(scoreToBand(score)).toBe('good')
     })

     // Worked example 3: DEF, league, lost 0-3
     it('produces Mixed for worked example 3 (DEF loss)', () => {
       const score = computeMatchScore({
         ...baseMatch,
         position: 'def',
         score_us: 0,
         score_them: 3,
         self_rating: 'average',
         body_condition: 'tired',
         minutes_played: 80,
         position_inputs: {
           duels: 'few',
           clearances: 'some',
           aerial: 'lost_most',
           positioning: 'no',
           goals_conceded: '3+',
           assists: '0',
         },
       })
       expect(score).toBeCloseTo(5.6, 1)
       expect(scoreToBand(score)).toBe('mixed')
     })
   })
   ```
2. Run test: `npx vitest --run src/lib/__tests__/rating.test.ts` — expect ALL FAIL
3. Create `src/lib/rating.ts` implementing `computeMatchScore` and `scoreToBand` per PRD Sections 6.1–6.8
4. Run test: `npx vitest --run src/lib/__tests__/rating.test.ts` — expect ALL PASS
5. Verify: all 17 assertions green

---

### Task 1.7: Build shared UI components
**Files:** `src/components/ui/BandPill.tsx`, `Card.tsx`, `PillSelector.tsx`, `MetadataLabel.tsx`, `src/components/layout/MobileShell.tsx`

**Steps:**
1. Create `BandPill.tsx`:
   ```tsx
   import { BANDS, type BandType } from '../../lib/types'

   export function BandPill({ band }: { band: BandType }) {
     const config = BANDS.find(b => b.word.toLowerCase() === band) ?? BANDS[BANDS.length - 1]
     return (
       <span
         className={`band-${band} inline-flex items-center px-3 py-1 text-xs font-medium rounded-full`}
         style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, letterSpacing: '-0.03em' }}
       >
         {config.word}
       </span>
     )
   }
   ```
2. Create `Card.tsx`:
   ```tsx
   import type { ReactNode } from 'react'

   export function Card({ children, elevated = false }: { children: ReactNode; elevated?: boolean }) {
     return (
       <div
         className={`${elevated ? 'bg-[#17171A]' : 'bg-[#101012]'} rounded-[14px] p-4 border border-white/[0.07]`}
       >
         {children}
       </div>
     )
   }
   ```
3. Create `PillSelector.tsx`:
   ```tsx
   interface PillSelectorProps {
     options: { label: string; value: string }[]
     value: string
     onChange: (value: string) => void
   }

   export function PillSelector({ options, value, onChange }: PillSelectorProps) {
     return (
       <div className="flex flex-wrap gap-2">
         {options.map(opt => (
           <button
             key={opt.value}
             type="button"
             onClick={() => onChange(opt.value)}
             className={`px-4 py-2 rounded-[10px] text-sm transition-colors ${
               value === opt.value
                 ? 'border-[#C8F25A] bg-[rgba(200,242,90,0.08)] text-[rgba(255,255,255,0.88)]'
                 : 'border-white/[0.07] bg-[#202024] text-[rgba(255,255,255,0.45)]'
             } border`}
           >
             {opt.label}
           </button>
         ))}
       </div>
     )
   }
   ```
4. Create `MetadataLabel.tsx`:
   ```tsx
   export function MetadataLabel({ text }: { text: string }) {
     return (
       <span
         className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]"
         style={{ fontFamily: "'DM Mono', monospace" }}
       >
         {text}
       </span>
     )
   }
   ```
5. Create `MobileShell.tsx`:
   ```tsx
   import type { ReactNode } from 'react'

   export function MobileShell({ children }: { children: ReactNode }) {
     return (
       <div className="mx-auto max-w-[430px] min-h-screen bg-[#0A0A0B] px-5 pb-24">
         {children}
       </div>
     )
   }
   ```
6. Verify: `npx tsc --noEmit` — no type errors

---

### Task 1.8: Build NavBar component
**Files:** `src/components/ui/NavBar.tsx` (create)

**Steps:**
1. Create `NavBar.tsx`:
   ```tsx
   import type { Role } from '../../lib/types'

   interface NavItem {
     label: string
     path: string
     icon: string
   }

   const NAV_ITEMS: Record<Role, NavItem[]> = {
     player: [
       { label: 'Home', path: '/player/home', icon: 'home' },
       { label: 'Log', path: '/player/log', icon: 'plus-circle' },
       { label: 'Goals', path: '/player/goals', icon: 'target' },
       { label: 'Medals', path: '/player/medals', icon: 'award' },
       { label: 'Profile', path: '/player/profile', icon: 'user' },
     ],
     coach: [
       { label: 'Home', path: '/coach/home', icon: 'home' },
       { label: 'Squad', path: '/coach/squad', icon: 'users' },
       { label: 'Sessions', path: '/coach/sessions', icon: 'calendar' },
       { label: 'Profile', path: '/coach/profile', icon: 'user' },
     ],
     parent: [
       { label: 'Home', path: '/parent/home', icon: 'home' },
       { label: 'Matches', path: '/parent/matches', icon: 'activity' },
       { label: 'Goals', path: '/parent/goals', icon: 'target' },
       { label: 'Alerts', path: '/parent/alerts', icon: 'bell' },
     ],
   }

   interface NavBarProps {
     role: Role
     activeTab: string
     onNavigate: (path: string) => void
   }

   export function NavBar({ role, activeTab, onNavigate }: NavBarProps) {
     const items = NAV_ITEMS[role]
     return (
       <nav
         className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 py-2 border-t border-white/[0.07]"
         style={{
           background: 'rgba(10, 10, 11, 0.92)',
           backdropFilter: 'blur(24px)',
           WebkitBackdropFilter: 'blur(24px)',
           paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
         }}
       >
         {items.map(item => {
           const isActive = activeTab === item.path
           return (
             <button
               key={item.path}
               onClick={() => onNavigate(item.path)}
               className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                 isActive
                   ? 'bg-[rgba(200,242,90,0.06)] text-[#C8F25A]'
                   : 'text-white/35'
               }`}
             >
               <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                 {item.label}
               </span>
             </button>
           )
         })}
       </nav>
     )
   }
   ```
2. Verify: `npx tsc --noEmit` — no type errors

---

## Gate Verification
After all 8 tasks:
1. Run `npx vitest --run` — all rating engine tests pass
2. Run `npx tsc --noEmit` — zero type errors
3. Run `npm run dev` — app loads with dark background, DM Sans font, components render
