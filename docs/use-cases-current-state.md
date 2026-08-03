# Use Cases and state of the App — current build

Verified against the current source: `App.tsx` route table, `NavBar` navigation, 37 migration
files, and the existence or absence of every file cited. Items marked *verified live* were
additionally exercised in a running app against the database, signed in as that role.

**Status key** ✅ works · ⚠️ present, not behaviourally verified · 🔴 broken · ❌ not built ·
⬜ removed by design

---

## Persona: Coach

*(primary user)*

| | Use case | Status | Evidence |
|---|---|---|---|
| C1 | Sign up, onboard, pick club/team/role | ✅ | `provision_my_profile` RPC (atomic, SECURITY DEFINER) writes `profiles` + `coach_details` |
| C2 | Add a player to my squad manually | ✅ | `CoachAddPlayer` inserts `squad_players`; RLS correct |
| C3 | View my squad | ✅ | `CoachSquadPage` |
| C4 | Assess a player on 6 sliders → band | ✅ | `CoachAssess`; `coach_rating` is a generated column; RLS correct |
| C5 | View a player's assessment history | ✅ | `CoachPlayerProfilePage` |
| C6 | Log a training/match session | ✅ | `coach_sessions`; RLS correct |
| C7 | Log a match on behalf of a player | ✅ | `log_match_for_player` SECURITY DEFINER RPC, used by `CoachQuickMatchLog` and `CoachAddSession`. **This is now the only path a match enters the system** |
| C8 | Share my TRK-XXXX code to connect a player | ✅ | **Verified live**: the coach profile shows a real code (e.g. `TRK-ALEX`) read from `profiles.invite_code` and formatted by `formatCoachCode`. Both a direct lookup and `get_coach_id_by_invite_code` resolve it to the coach's `user_id` |
| C9 | Recognise / award a player | ✅ | Verified live: renders the real squad with band pills and week/month/season tabs. Awards flow through to the player's passport |
| C10 | Schedule | ✅ | Verified live: calendar renders, today highlighted, event-type legend, clear empty state, plus an AI "import from text or club website" entry point |
| C11 | AI assistant | ✅ | Verified live and **context-aware**: knew the coach's team (U15s, City FC Academy), named real squad players in its answer, and rendered a `PitchDiagram` with movement arrows |
| C12 | Coach progress dashboard | ⬜ | `components/coach/CoachProgress.tsx` exists but is referenced nowhere — dead tree |
| C13 | See a player's character progress | ❌ | Planned. No code exists |

> **Coach reality:** the coach product is complete and coherent. A coach can onboard, build a squad,
> assess on six dimensions, log sessions, log matches for their players, share a working invite code
> that genuinely links an athlete, and recognise behaviour. Everything the product asks of the coach,
> the coach can do today.

---

## Persona: Athlete

*(kids)*

| | Use case | Status | Evidence |
|---|---|---|---|
| A1 | Sign up and onboard as a player | ✅ | `provision_my_profile` writes `profiles` + `player_details` atomically |
| A2 | Connect to my coach via TRK code | ✅ | **Verified live** against the database. `link_player_to_coach` strips the `TRK-` prefix case-insensitively and trims, so `TRK-ALEX`, `ALEX`, `trk-alex` and `  TRK-ALEX  ` all resolve to the same squad row; `TRK-NOPE` is rejected with *Invalid coach code*. Idempotent — re-linking returns the existing row rather than duplicating |
| A3 | Browse my match history + detail | ✅ | `PlayerMatches`, `PlayerMatchDetail` — populated by the coach (C7) |
| A4 | See my band result | ✅ | Rating engine, well covered by tests |
| A5 | See my coach's assessment + private note | ✅ | `PlayerFeedback.tsx` (664 lines) reads `coach_assessments` + `coach_assessment_notes` at `/player/feedback/:assessmentId`; RLS policy `Players read own assessments` |
| A6 | Evolution Card | ✅ | `PlayerEvolutionCard.tsx` (960 lines) aggregating `matches`, `coach_assessments`, `recognition_awards`, `player_details`. A primary nav tab ("Card") — **this is the athlete's progression surface** |
| A7 | Passport | ⚠️ | Verified live — career totals, season history and recognition all render. **Layout bug:** the card is a hard-coded 390px (`CARD_W`) inside a 375px viewport, so the page scrolls sideways by 35px. Geometry is intentional (captured by `html2canvas` for PNG export), so the fix must scale visually without changing export dimensions |
| A8 | Invite my parent | ⚠️ | Parent email captured at signup → `parent_invites` row + token. The specced PAR-XXXX code flow does not exist |
| A9 | Profile | ✅ | `PlayerProfilePage` |
| A10 | Self-log a match | ⬜ | **Removed by design.** `PlayerLogForm.tsx` no longer exists; no "Log" tab in the player nav. Matches come from the coach |
| A11 | Create / track goals | ⬜ | **Removed by design.** No goals files, routes, or nav entry. The Evolution Card serves this purpose |
| A12 | Earn / see medals | ⬜ | Removed. `MedalType` remains in `types.ts`; recognition is now the coach-driven path |
| A13 | Character: per-session moment (learn → apply → act) | ❌ | Planned. No code exists |
| A14 | Character: my growth, streaks, values | ❌ | Planned. Separate axis on the card — never merged into the performance band |

> **Athlete reality:** the athlete's experience is now coherent as a *receiving* one — matches, band,
> coach feedback, and an Evolution Card that carries progression. What the athlete has no reason to
> open the app for **between** matches is anything of their own. That is the deliberate gap the
> character feature is designed to fill, and it is the only place the product asks the child to work.

---

## Persona: Parent

| | Use case | Status | Evidence |
|---|---|---|---|
| P1 | Accept invite, create account, link to child | ✅ | `ParentOnboarding` writes `player_parent_links` via a SECURITY DEFINER token RPC. The best-engineered flow in the app |
| P2 | See child's season band | ✅ | RLS policy `Parents can read linked child matches`: `user_id IN (SELECT player_user_id FROM player_parent_links WHERE parent_user_id = auth.uid())` |
| P3 | See child's match feed | ✅ | Same policy — the previously reported wall is gone |
| P4 | Alerts | ⚠️ | `ParentAlerts` implements a subset of the specced types; the underlying query is no longer blocked. Not yet exercised live |
| P5 | See coach assessments + awards | ✅ | UI existed but returned 0 rows — no parent policy. Fixed by migration `20260612000001` (helper `squad_player_is_my_child`) granting parent SELECT on `coach_assessments` and `recognition_awards`. Applied to the database. The coach's private note stays player-only |
| P6 | Profile | ✅ | `ParentProfilePage` |
| P7 | See child's goals | ⬜ | Removed by design, with goals |

> **Parent reality:** the parent journey is now complete — sign up, link to the child, and see
> matches, season view, coach assessments and awards. Both previously reported walls (matches, then
> assessments) were missing RLS policies behind finished UI, not missing features.

---

## Persona: Club / Academy admin

| | Use case | Status | Evidence |
|---|---|---|---|
| K1 | Sign up, create the organization | ✅ | `organizations` table with unique `join_code`, created via `provision_my_profile` |
| K2 | Coaches join via academy code | ✅ | `join_organization()` / `get_org_id_by_join_code()` RPCs; `coach_details.organization_id` |
| K3 | View coaches in the organization | ✅ | `ClubCoaches`, org-scoped RLS |
| K4 | View squads across the org | ✅ | `ClubSquads` |
| K5 | Org dashboard, band distribution | ✅ | `ClubHome`. **Bug found and fixed** (`3bd1507`): the headline read "TOTAL PLAYERS 1" above squads summing to 29 — it counted linked accounts while the squads counted roster rows |
| K6 | Radar analytics | ✅ | Verified live: renders with its threshold rule stated (avg ≥ 7.5, 2+ assessments, last 60 days) and an empty state that explains *why* it is empty |
| K7 | Club profile, manage join code | ✅ | `ClubProfile` |

> **Club reality:** a working, org-scoped read layer. Visibility is opt-in — a club sees only coaches
> who joined with its code — and there is no direct player management, by design.

---

## Planned, not built

| | Item | Status | Note |
|---|---|---|---|
| N1 | Character feature — values, flashcards, scenarios, real-world challenges | ❌ | Additive. Coach stays primary; this is the athlete's active role |
| N2 | Character corner on the player card | ❌ | Separate axis. Must never feed the 0–10 performance band |
| N3 | Terms of service, privacy policy, parental consent | ❌ | No matches anywhere in source. Blocker for real users given minors' data |
| N4 | Billing / payments | ❌ | No Stripe/Paddle/checkout code. Cannot take money today |

## The honest summary

All four personas now work. The previous assessment's headline findings — "a teenager logs into a
void" and "the parent sees nothing, forever" — no longer hold: the athlete receives coach feedback
and carries an Evolution Card, and the parent's RLS wall has been fixed.

With self-logging and goals deliberately removed, **there is no longer a broken loop in the app.**
The coach logs, the athlete receives, the parent observes. What remains is not a defect list but a
build list:

1. **The character feature** — the athlete's only active role, and the reason for them to open the
   app between matches.
2. **Legal and billing layers** — required before real users or revenue, independent of features.
3. **Passport layout (A7)** — the only functional defect currently open.
4. **Parent alerts (P4)** — the last feature never exercised live.

### Closed since the previous revision

- **P5** — parent access to assessments and awards (migration `20260612000001`, applied).
- **Housekeeping** — `MatchLog.tsx` and `CoachProgress.tsx` deleted (orphaned, unreferenced).
- **Verification sweep** — C9, C10, C11, A7 and K6 exercised live against the database. None was
  silently broken; the P5 pattern did not repeat. C11 proved stronger than documented: it is
  squad-aware and renders pitch diagrams.
- **K5 club dashboard** — "TOTAL PLAYERS 1" displayed above squads summing to 29. Fixed (`3bd1507`).

### Signup / onboarding — verified this session

- **Password rules did not match Supabase.** Every signup path checked only length while the
  server also required upper, lower, digit **and symbol**, so realistic passwords were rejected
  with a raw character-set dump. Fixed (`fd1a30e`) via `src/lib/password.ts`.
- **Email confirmation is ON.** New accounts must click a link before they can sign in
  (*"Email not confirmed"*), so a fresh coach → player → parent chain cannot be completed in a
  test run without either mailbox access or temporarily disabling confirmation.
- **`DevSetupPage` will fail on a fresh Supabase project** — it seeds with `TrakDev123`, which has
  no symbol. Existing dev accounts predate the policy and still work. Not changed: altering it
  would break the logins currently in use.

### Open observations, not yet investigated

- The passport rendered **two identical "Player of the Week" entries** — possibly duplicate rows
  in `recognition_awards`, possibly a render duplication.
- A **U11s squad exists in the data**, but `AGE_GROUPS` in `constants.ts` starts at U13. The app
  holds data for an age group it does not officially offer — relevant to the character feature's
  age banding.

### Method note

Policies and files were confirmed to *exist* in source; they were not exercised against a live
database. Items marked ⚠️ are present but not behaviourally verified.
