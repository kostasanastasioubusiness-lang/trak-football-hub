# Roadmap: Trak Football — Pilot Wedge

Mode: Hold Scope
Created: 2026-04-09

> 6 milestones, 31 tasks, strict phase isolation.
> Each milestone must pass its test suite before the next begins.

---

## Milestone 1: Foundation
Plan: `docs/pm/plans/2026-04-09-m1-foundation.md`
Dependencies: None
REQs covered: Prereq for all REQs

- [ ] Task 1.1: Scaffold React + Vite + TypeScript project — `package.json`, `vite.config.ts`, `tsconfig.json`
- [ ] Task 1.2: Configure Tailwind with design tokens — `tailwind.config.ts`, `src/styles/globals.css`
- [ ] Task 1.3: Load fonts (DM Sans + DM Mono) — `index.html`
- [ ] Task 1.4: Initialize Supabase client — `src/lib/supabase.ts`
- [ ] Task 1.5: Build TypeScript types — `src/lib/types.ts`
- [ ] Task 1.6: Build rating engine (computeScore + scoreToBand) — `src/lib/rating.ts`, `src/lib/__tests__/rating.test.ts`
- [ ] Task 1.7: Build shared UI components — `src/components/ui/BandPill.tsx`, `Card.tsx`, `PillSelector.tsx`, `MetadataLabel.tsx`, `MobileShell.tsx`
- [ ] Task 1.8: Build NavBar component (glassmorphism, role-aware) — `src/components/ui/NavBar.tsx`

**Gate:** `rating.test.ts` passes all 17 Nyquist assertions for REQ-001 algorithm. Components render without errors.

---

## Milestone 2: Auth + Onboarding (REQ-003 partial)
Plan: `docs/pm/plans/2026-04-09-m2-auth-onboarding.md`
Dependencies: Milestone 1
REQs covered: REQ-003 (invite codes), prereq for REQ-001/002/004

- [ ] Task 2.1: Supabase schema migration (all tables + RLS) — `supabase/migrations/001_initial_schema.sql`
- [ ] Task 2.2: Auth context + hooks — `src/lib/auth.tsx`
- [ ] Task 2.3: Route guard (role + onboarding check) — `src/components/layout/RouteGuard.tsx`
- [ ] Task 2.4: Landing page (role selection) — `src/pages/Landing.tsx`
- [ ] Task 2.5: Player onboarding (4 steps) — `src/pages/player/Onboarding.tsx`
- [ ] Task 2.6: Coach onboarding (2 steps + TRK-XXXX generation) — `src/pages/coach/Onboarding.tsx`
- [ ] Task 2.7: Invite code utilities (generate + validate) — `src/lib/invite-codes.ts`, `src/lib/__tests__/invite-codes.test.ts`
- [ ] Task 2.8: Parent onboarding (PAR-XXXX entry + child confirm) — `src/pages/parent/Onboarding.tsx`
- [ ] Task 2.9: App router setup — `src/App.tsx`

**Gate:** `invite-codes.test.ts` passes all 4 Nyquist assertions for REQ-003. Full onboarding flow works for all 3 roles end-to-end in browser. RLS policies block cross-role access.

---

## Milestone 3: Player Core (REQ-001)
Plan: `docs/pm/plans/2026-04-09-m3-player-core.md`
Dependencies: Milestone 2
REQs covered: REQ-001

- [ ] Task 3.1: Match log form (10 universal fields + position-specific) — `src/pages/player/LogForm.tsx`
- [ ] Task 3.2: Live band preview component — `src/components/ui/BandPreview.tsx`
- [ ] Task 3.3: Match save handler (compute score, insert, fire telemetry) — `src/hooks/useMatches.ts`
- [ ] Task 3.4: Match result screen (band reveal + goal/medal cards) — `src/pages/player/Result.tsx`
- [ ] Task 3.5: Player home (hero card, band distribution, recent matches) — `src/pages/player/Home.tsx`
- [ ] Task 3.6: Match history + match detail — `src/pages/player/Matches.tsx`, `src/pages/player/MatchDetail.tsx`
- [ ] Task 3.7: Integration tests for match log flow — `src/__tests__/match-log.test.ts`

**Gate:** `match-log.test.ts` passes. Save a match as each of the 4 positions, verify `computed_score` and `band` in DB, verify no decimal in rendered output. Worked examples from algorithm doc produce correct bands.

---

## Milestone 4: Coach Core (REQ-002)
Plan: `docs/pm/plans/2026-04-09-m4-coach-core.md`
Dependencies: Milestone 2
REQs covered: REQ-002

- [ ] Task 4.1: SliderInput component — `src/components/ui/SliderInput.tsx`
- [ ] Task 4.2: Assessment form (6 sliders + band output) — `src/pages/coach/Assess.tsx`
- [ ] Task 4.3: Assessment save handler — `src/hooks/useAssessments.ts`
- [ ] Task 4.4: Squad management (list + add player) — `src/pages/coach/Squad.tsx`, `src/pages/coach/AddPlayer.tsx`
- [ ] Task 4.5: Player profile view (coach perspective) — `src/pages/coach/PlayerProfile.tsx`
- [ ] Task 4.6: Session log (add + list) — `src/pages/coach/Sessions.tsx`, `src/pages/coach/AddSession.tsx`
- [ ] Task 4.7: Invite code display screen — `src/pages/coach/InviteCode.tsx`
- [ ] Task 4.8: Coach home + profile — `src/pages/coach/Home.tsx`, `src/pages/coach/Profile.tsx`
- [ ] Task 4.9: Integration tests for assessment flow — `src/__tests__/assessment.test.ts`

**Gate:** `assessment.test.ts` passes all 3 Nyquist assertions for REQ-002. Coach can assess a connected player, band computes correctly, unconnected player is blocked.

---

## Milestone 5: Parent Core (REQ-004)
Plan: `docs/pm/plans/2026-04-09-m5-parent-core.md`
Dependencies: Milestone 3, Milestone 4
REQs covered: REQ-004

- [ ] Task 5.1: CategoryBar component — `src/components/ui/CategoryBar.tsx`
- [ ] Task 5.2: AlertCard component — `src/components/ui/AlertCard.tsx`
- [ ] Task 5.3: Parent home (child hero card, assessment bars) — `src/pages/parent/Home.tsx`
- [ ] Task 5.4: Parent match feed (filtered — no private fields) — `src/pages/parent/Matches.tsx`
- [ ] Task 5.5: Parent goals view (read-only) — `src/pages/parent/Goals.tsx`
- [ ] Task 5.6: Parent alerts (3 types) — `src/pages/parent/Alerts.tsx`, `src/hooks/useAlerts.ts`
- [ ] Task 5.7: Integration tests for parent access — `src/__tests__/parent-access.test.ts`

**Gate:** `parent-access.test.ts` passes all 3 Nyquist assertions for REQ-004. Parent sees bands, cannot see private fields, cannot write. Empty state renders cleanly.

---

## Milestone 6: Goals, Medals, Telemetry, Profiles (REQ-005 + remaining)
Plan: `docs/pm/plans/2026-04-09-m6-goals-medals-telemetry.md`
Dependencies: Milestone 3, Milestone 4, Milestone 5
REQs covered: REQ-005, remaining screens

- [ ] Task 6.1: Goals CRUD + auto-tracking logic — `src/hooks/useGoals.ts`, `src/lib/goals.ts`
- [ ] Task 6.2: Goals screens (list, add, update) — `src/pages/player/Goals.tsx`, `AddGoal.tsx`, `UpdateGoal.tsx`
- [ ] Task 6.3: Medal checker (6 triggers) — `src/lib/medals.ts`, `src/lib/__tests__/medals.test.ts`
- [ ] Task 6.4: Medals screen — `src/pages/player/Medals.tsx`, `src/components/ui/MedalSlot.tsx`
- [ ] Task 6.5: Telemetry client — `src/lib/telemetry.ts`, `src/lib/__tests__/telemetry.test.ts`
- [ ] Task 6.6: Player profile — `src/pages/player/Profile.tsx`, `src/components/ui/InviteCodeDisplay.tsx`
- [ ] Task 6.7: Log choose screen — `src/pages/player/LogChoose.tsx`
- [ ] Task 6.8: Telemetry SQL views — `supabase/migrations/002_telemetry_views.sql`
- [ ] Task 6.9: End-to-end pilot verification — `src/__tests__/pilot-e2e.test.ts`

**Gate:** `medals.test.ts` and `telemetry.test.ts` pass all Nyquist assertions. Founder can query pilot_weekly_summary and get correct counts. All 37 screens render. Full triangle walkthrough (coach → player → parent) completes in under 10 minutes.

---

## Milestone Dependencies

```
M1 Foundation
 └─→ M2 Auth + Onboarding
      ├─→ M3 Player Core ──────┐
      └─→ M4 Coach Core ───────┤
                                ├─→ M5 Parent Core
                                └─→ M6 Goals, Medals, Telemetry
```

Milestones 3 and 4 can run in parallel (independent REQs). Milestone 5 depends on both. Milestone 6 depends on all prior.
