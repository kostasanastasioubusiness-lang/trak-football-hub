# Plan: Milestone 2 — Auth + Onboarding

## Header
- **Goal:** Set up Supabase schema, auth flow, role routing, and all 3 onboarding flows including invite code system
- **Architecture:** ARCHITECTURE.md — Supabase Auth, RLS policies, client-side invite code validation
- **Tech Stack:** Supabase (PostgreSQL, Auth), React Router v6, TypeScript

## Tasks

### Task 2.1: Supabase schema migration
**Files:** `supabase/migrations/001_initial_schema.sql` (create)

**Steps:**
1. Create `supabase/migrations/001_initial_schema.sql` containing all CREATE TABLE statements from PRD Section 7.1 (profiles, players, coaches, parents, player_coach, player_parent, matches, assessments, goals, medals, previous_clubs, telemetry_events)
2. Include all RLS policies from PRD Section 8
3. Enable RLS on every table: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
4. Run migration via Supabase dashboard SQL editor or CLI: `npx supabase db push`
5. Verify: query each table in Supabase dashboard — all exist, RLS enabled

---

### Task 2.2: Auth context + hooks
**Files:** `src/lib/auth.tsx` (create)

**Steps:**
1. Create `src/lib/auth.tsx`:
   ```tsx
   import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
   import { supabase } from './supabase'
   import type { Role, Profile, Player, Coach, Parent } from './types'
   import type { User } from '@supabase/supabase-js'

   interface AuthState {
     user: User | null
     profile: Profile | null
     playerData: Player | null
     coachData: Coach | null
     parentData: Parent | null
     loading: boolean
     role: Role | null
     onboardingComplete: boolean
   }

   interface AuthContextType extends AuthState {
     signUp: (email: string, password: string) => Promise<{ error: Error | null }>
     signIn: (email: string, password: string) => Promise<{ error: Error | null }>
     signOut: () => Promise<void>
     refreshProfile: () => Promise<void>
   }

   const AuthContext = createContext<AuthContextType | null>(null)

   export function AuthProvider({ children }: { children: ReactNode }) {
     const [state, setState] = useState<AuthState>({
       user: null, profile: null, playerData: null,
       coachData: null, parentData: null, loading: true,
       role: null, onboardingComplete: false,
     })

     const loadProfile = async (userId: string) => {
       const { data: profile } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', userId)
         .single()

       if (!profile) {
         setState(s => ({ ...s, loading: false, profile: null, role: null }))
         return
       }

       let playerData = null
       let coachData = null
       let parentData = null
       let onboardingComplete = false

       if (profile.role === 'player') {
         const { data } = await supabase.from('players').select('*').eq('profile_id', userId).single()
         playerData = data
         onboardingComplete = !!data
       } else if (profile.role === 'coach') {
         const { data } = await supabase.from('coaches').select('*').eq('profile_id', userId).single()
         coachData = data
         onboardingComplete = !!data
       } else if (profile.role === 'parent') {
         const { data } = await supabase.from('parents').select('*').eq('profile_id', userId).single()
         parentData = data
         onboardingComplete = !!data
       }

       setState({
         user: (await supabase.auth.getUser()).data.user,
         profile, playerData, coachData, parentData,
         loading: false, role: profile.role as Role,
         onboardingComplete,
       })
     }

     useEffect(() => {
       supabase.auth.getSession().then(({ data: { session } }) => {
         if (session?.user) loadProfile(session.user.id)
         else setState(s => ({ ...s, loading: false }))
       })

       const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
         if (session?.user) loadProfile(session.user.id)
         else setState({ user: null, profile: null, playerData: null, coachData: null, parentData: null, loading: false, role: null, onboardingComplete: false })
       })

       return () => subscription.unsubscribe()
     }, [])

     const signUp = async (email: string, password: string) => {
       const { error } = await supabase.auth.signUp({ email, password })
       return { error: error as Error | null }
     }

     const signIn = async (email: string, password: string) => {
       const { error } = await supabase.auth.signInWithPassword({ email, password })
       return { error: error as Error | null }
     }

     const signOut = async () => {
       await supabase.auth.signOut()
     }

     const refreshProfile = async () => {
       const { data: { user } } = await supabase.auth.getUser()
       if (user) await loadProfile(user.id)
     }

     return (
       <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, refreshProfile }}>
         {children}
       </AuthContext.Provider>
     )
   }

   export function useAuth() {
     const ctx = useContext(AuthContext)
     if (!ctx) throw new Error('useAuth must be used within AuthProvider')
     return ctx
   }
   ```
2. Verify: `npx tsc --noEmit` — no type errors

---

### Task 2.3: Route guard
**Files:** `src/components/layout/RouteGuard.tsx` (create)

**Steps:**
1. Create `RouteGuard.tsx`:
   ```tsx
   import { Navigate } from 'react-router-dom'
   import { useAuth } from '../../lib/auth'

   export function RouteGuard({ allowedRole, children }: { allowedRole: string; children: React.ReactNode }) {
     const { user, role, onboardingComplete, loading } = useAuth()

     if (loading) return <div className="min-h-screen bg-[#0A0A0B]" />

     if (!user) return <Navigate to="/" replace />

     if (role && role !== allowedRole) return <Navigate to={`/${role}/home`} replace />

     if (role && !onboardingComplete) return <Navigate to={`/onboarding/${role}/1`} replace />

     return <>{children}</>
   }
   ```
2. Verify: `npx tsc --noEmit`

---

### Task 2.4: Landing page
**Files:** `src/pages/Landing.tsx` (create)

**Steps:**
1. Create `Landing.tsx` with role selection (Player / Coach / Parent), sign-up form (email + password), and sign-in toggle
2. On role select + signup: create auth user, then insert profile with selected role, redirect to onboarding
3. Style per design system: `--bg` background, `--accent` buttons, DM Sans headings
4. Verify: manual test — create account, lands on onboarding

---

### Task 2.5: Player onboarding (4 steps)
**Files:** `src/pages/player/Onboarding.tsx` (create)

**Steps:**
1. Create multi-step form:
   - Step 1: First name, last name, nationality
   - Step 2: Position (GK/DEF/MID/ATT pill selector), club, age group, shirt number
   - Step 3: Coach code entry (TRK-XXXX) — optional, skippable
   - Step 4: Generate PAR-XXXX code — display with copy button, skippable
   - Done: welcome message, navigate to `/player/home`
2. On step 1 complete: UPDATE `profiles` with name + nationality
3. On step 2 complete: INSERT `players` row
4. On step 3 (if code entered): validate code via `invite-codes.ts`, INSERT `player_coach`
5. On step 4: generate PAR-XXXX, UPDATE `players.parent_invite_code`
6. Verify: manual test — complete all 4 steps, check DB for profile + player rows

---

### Task 2.6: Coach onboarding (2 steps + TRK-XXXX)
**Files:** `src/pages/coach/Onboarding.tsx` (create)

**Steps:**
1. Create multi-step form:
   - Step 1: First name, last name, nationality
   - Step 2: Club, age group, coaching role
   - Done: large TRK-XXXX code display with copy button
2. On step 1: UPDATE `profiles`
3. On step 2: generate TRK-XXXX, INSERT `coaches` row with invite_code
4. Verify: manual test — complete onboarding, check `coaches.invite_code` in DB

---

### Task 2.7: Invite code utilities (TDD)
**Files:** `src/lib/invite-codes.ts` (create), `src/lib/__tests__/invite-codes.test.ts` (create)

**Steps:**
1. Create test file `src/lib/__tests__/invite-codes.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { generateCode, formatCoachCode, formatParentCode } from '../invite-codes'

   describe('generateCode', () => {
     it('generates a 4-character alphanumeric string', () => {
       const code = generateCode()
       expect(code).toMatch(/^[A-Z0-9]{4}$/)
       expect(code.length).toBe(4)
     })

     it('generates unique codes on consecutive calls', () => {
       const codes = new Set(Array.from({ length: 100 }, () => generateCode()))
       expect(codes.size).toBeGreaterThan(90) // allow some collisions at small scale
     })
   })

   describe('formatCoachCode', () => {
     it('formats as TRK-XXXX', () => {
       expect(formatCoachCode('AB12')).toBe('TRK-AB12')
     })
   })

   describe('formatParentCode', () => {
     it('formats as PAR-XXXX', () => {
       expect(formatParentCode('XY99')).toBe('PAR-XY99')
     })
   })
   ```
2. Run test: `npx vitest --run src/lib/__tests__/invite-codes.test.ts` — expect FAIL
3. Create `src/lib/invite-codes.ts`:
   ```typescript
   export function generateCode(): string {
     const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I confusion
     let code = ''
     const array = new Uint8Array(4)
     crypto.getRandomValues(array)
     for (const byte of array) {
       code += chars[byte % chars.length]
     }
     return code
   }

   export function formatCoachCode(code: string): string {
     return `TRK-${code.toUpperCase()}`
   }

   export function formatParentCode(code: string): string {
     return `PAR-${code.toUpperCase()}`
   }

   export function parseInviteCode(input: string): { prefix: string; code: string } | null {
     const match = input.trim().toUpperCase().match(/^(TRK|PAR)-([A-Z0-9]{4})$/)
     if (!match) return null
     return { prefix: match[1], code: match[2] }
   }
   ```
4. Run test: `npx vitest --run src/lib/__tests__/invite-codes.test.ts` — expect PASS

---

### Task 2.8: Parent onboarding
**Files:** `src/pages/parent/Onboarding.tsx` (create)

**Steps:**
1. Create multi-step form:
   - Step 1: Enter PAR-XXXX code
   - Step 1b: Confirm child — show child's first name + last initial
   - Step 2: First name, last name
   - Done: welcome message, navigate to `/parent/home`
2. On code entry: query `players` for matching `parent_invite_code`, show child name
3. On confirm: UPDATE `profiles`, INSERT `parents`, INSERT `player_parent`
4. Verify: manual test — enter a real PAR-XXXX code, see child name, complete onboarding

---

### Task 2.9: App router setup
**Files:** `src/App.tsx` (modify)

**Steps:**
1. Set up React Router v6 with all routes from PRD Section 15.2
2. Wrap each role's routes in `<RouteGuard allowedRole="player|coach|parent">`
3. Root `/` renders Landing if not authenticated
4. Verify: navigate to `/player/home` while unauthenticated — redirects to `/`

---

## Gate Verification
After all 9 tasks:
1. Run `npx vitest --run` — invite-codes tests + rating tests all pass
2. Complete onboarding for all 3 roles in browser
3. Verify RLS: player A cannot query player B's data via Supabase dashboard
4. Verify coach TRK-XXXX code appears in DB after onboarding
5. Verify player → coach connection works via code entry
