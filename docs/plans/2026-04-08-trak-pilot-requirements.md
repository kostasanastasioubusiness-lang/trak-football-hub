# Requirements: Trak Football — Pilot Wedge
Generated: 2026-04-08
Source: /office-hours interview
Mode: Hold Scope
CEO Review: 2026-04-09
Scores: MF=2 D=3 F=4 ROI=2 Composite=11
Hard Gate: MF < 3 and ROI < 3 → Scope Expansion blocked

## Context

Trak is a player-first football career tracking app for 13–18 year old
academy/semi-pro players in Greece, Cyprus, and the Netherlands. A v4
prototype and partial Lovable codebase already exist, and the founder
arrived with a fully-specced MVP (37 screens, 3 roles, 6 medals, a hidden
rating algorithm, invite codes, goals, assessments, parent views).

This office-hours interview pressure-tested that MVP against demand,
status quo cost, wedge scope, a falsifiable metric, anti-requirements,
and kill criteria. The outcome is **not** a rejection of the MVP spec —
it is a narrower **pilot wedge** the founder will run *first* to decide
whether the full MVP scope is justified. Everything below governs the
pilot, not the eventual product.

The intended outcome: an 8-week closed pilot with 1 academy club
(~15 players, ~2 coaches, ~15 parents) that either validates the
player-first logging thesis or kills it.

---

## Interview Summary

### Q1 — Demand Reality
Demand signal is triangulated from three sources:
- **(B)** Coaches have explicitly asked the founder for a lightweight
  assessment tool.
- **(C)** The founder lives the pain personally (player/parent/coach context).
- **(D)** Indirect evidence: players currently use Notes apps, spreadsheets,
  and Instagram highlight reels as makeshift development records.

**Validation risk flagged:** no named 13–18 year old *player* has
described this pain in their own words. The strongest signal is
coach-side and founder-side. The product positions as player-first but
the demand evidence is not.

### Q2 — Status Quo Cost
- Parents pay **~€500/year per child** in academy fees across GR/CY/NL
  and receive zero persistent written progress record in return.
- Across the 500–800 player TAM this represents
  **~€250K–€400K/year** of parental spend producing no development data.
- Academy players change clubs or coaches **~2× per year**, meaning
  over a 5-year (13→18) window each player experiences ~10 transitions
  that fully reset their track record under the status quo.
- Capability gap: no tool today captures player-side performance
  self-monitoring or parent-side improvement visibility.

**Sharpest pain:** the rolling, structural loss of career history every
time a player changes coach or club — directly addressed by Trak's
"the player owns their career" positioning.

### Q3 — Narrowest Wedge
**(E) Full triangle, single pilot club.** Scope stays wide (all three
roles, match log, band, coach assessment, parent view), audience stays
narrow (one academy club, ~15 players, ~2 coaches, ~15 parents).

**Open risk:** the founder has not yet named the specific pilot club.
Without a named club, this wedge degrades into "build everything and
hope."

### Q4 — Falsifiable Hypothesis
**(A) Player logging retention.**

> ≥60% of pilot players log ≥1 match per week for 8 consecutive weeks,
> unprompted after week 2.

Measurement window: 8 weeks from pilot launch.
Unprompted = no founder nudge, no coach reminder, no push campaign
after the first 2 weeks of onboarding support.

This metric is deliberately chosen to test the player-first thesis
directly — the one thesis none of the Q1 demand signals actually
validated.

### Q5 — Anti-Requirements (Pilot Discipline)
The founder committed to **all** of the following for the 8-week
pilot window:
- **(A)** No second pilot club onboarded until the first hits the Q4 metric.
- **(B)** No marketing site, no ASO, no social content, no public landing.
  Pilot is invite-only; product is the marketing.
- **(C)** No algorithm tuning beyond v1 band mapping.
- **(D)** No new features requested by pilot users built during the window.
  Feedback captured, not shipped.
- **(E)** No payment, pricing, or paywall surface. WTP tested via exit survey only.
- **(F)** No additional parent engagement mechanics beyond the 3 specced alerts.
- **(G)** No native iOS/Android app. Mobile web only, max width 430px.

### Q6 — Kill Criteria
- **(A)** If fewer than **30%** of pilot players log weekly by end of week 8,
  **kill the player-first thesis.** Pivot to coach-first wedge or abandon.
- **(D)** If **≥50%** of pilot coaches stop assessing after week 4,
  **kill the triangle thesis.** The product cannot sustain on player
  logging alone.
- **(E)** If **<20%** of invited pilot parents ever open the app during
  the 8-week window, **retire the parent role from the roadmap.** The
  €500/year parent-pain hypothesis from Q2 is considered falsified and
  parent features are removed from MVP scope.

**Gap deliberately left open by the founder (flagged, not blocking):**
- No onboarding deadline — if a pilot club isn't secured, the project
  may drift indefinitely. Recommendation: add "pilot must start within
  6 weeks of product readiness or reassess."

---

## Requirements

All requirements below scope the **pilot build**, not the full MVP.
Each must be live before pilot week 1.

### REQ-001: Player match log with hidden-score banding
- **Description:** A player can log a completed match via a single form
  capturing position, competition, venue, score, minutes, card, body
  condition, self-rating, and position-specific inputs. The rating
  algorithm computes a hidden score in the database and maps to one of
  7 band words (Exceptional → Difficult). The player sees only the
  band word and its colour.
- **Falsifiable Hypothesis:** If the log form is too long or the band
  feedback is not motivating, Q4 logging retention will fall below 60%.
- **Test-for-Truth:** Instrument form-start and form-submit events;
  measure completion rate and median time-to-complete per submission.
- **Acceptance:** GIVEN a signed-in pilot player on mobile web
  WHEN they complete the match log form and tap save
  THEN a `matches` row is persisted with `computed_score` and `band`,
  AND the result screen shows the band word with correct band colour,
  AND no decimal number is rendered anywhere in the UI.

### REQ-002: Coach assessment across 6 categories with band output
- **Description:** A coach connected to a pilot player can submit an
  assessment scoring the player 1–10 across work rate, tactical,
  attitude, technical, physical, and coachability. The average maps to
  an `overall_band`. Coach sees only the band word; underlying scores
  live in the database.
- **Falsifiable Hypothesis:** If coaches will not assess weekly, the
  Q6(D) kill criterion triggers and the triangle thesis dies.
- **Test-for-Truth:** Weekly count of assessments per active pilot
  coach; tracked in a simple ops dashboard.
- **Acceptance:** GIVEN a coach connected to a player via invite code
  WHEN they submit all 6 sliders and tap save
  THEN an `assessments` row is persisted with `overall_band`,
  AND the connected player sees the new assessment on their profile,
  AND the connected parent (if any) sees the 6 category band bars.

### REQ-003: Invite-code connection (coach → player, player → parent)
- **Description:** Coaches are issued a unique `TRK-XXXX` code on
  signup. Players generate a `PAR-XXXX` code for their parent. All
  connections in the pilot happen via code entry only — no search,
  no email-based invites required for pilot launch.
- **Falsifiable Hypothesis:** If invite-code onboarding is high-friction,
  pilot activation will fall below the triangle threshold.
- **Test-for-Truth:** Funnel measurement from code entry to successful
  connection; target ≥90% completion for pilot cohort.
- **Acceptance:** GIVEN a player on onboarding step 3
  WHEN they enter a valid `TRK-XXXX` code
  THEN a `player_coach` row is created instantly with no approval step,
  AND the coach's squad view shows the new player within the same session.

### REQ-004: Parent read-only view of child band history
- **Description:** A parent connected via `PAR-XXXX` sees their child's
  match feed (bands only, no private inputs), the latest coach
  assessment (6 band bars), and goals (read-only). Parent cannot write
  to any table.
- **Falsifiable Hypothesis:** If parents do not open the app, the
  €500/year parent-pain hypothesis from Q2 is wrong.
- **Test-for-Truth:** Weekly active parent count vs. invited parent count.
- **Acceptance:** GIVEN a parent account connected to a child
  WHEN they open the parent home screen
  THEN they see the child's season band distribution and latest matches,
  AND every mutation attempt is rejected by RLS policy.

### REQ-005: Pilot telemetry for the Q4 metric
- **Description:** The pilot must instrument, at minimum: match logs
  per player per week, assessments per coach per week, parent app
  opens per week. Data available to the founder in a simple read-only
  dashboard or SQL view — not a user-facing feature.
- **Falsifiable Hypothesis:** Without telemetry, the pilot cannot be
  adjudicated and the Q6 kill criteria are unenforceable.
- **Test-for-Truth:** On day 1 of the pilot, the founder can answer
  "how many players logged this week?" in under 1 minute.
- **Acceptance:** GIVEN the pilot is live
  WHEN the founder queries the telemetry view for week N
  THEN weekly active loggers, weekly assessments, and weekly parent
  opens are returned per pilot user.

---

## Anti-Requirements (Pilot Window)
The pilot build will **not** include:
- A second pilot club or parallel pilots.
- Public marketing, landing page, or App Store/Play Store presence.
- Algorithm tuning beyond v1 band mapping.
- Any feature requested by a pilot user during the 8-week window.
- Payment, pricing, or paywall surface.
- Parent engagement mechanics beyond the 3 specced alert types.
- A native iOS or Android app — mobile web only, max width 430px.
- Any feature explicitly excluded from MVP in the brief (training log,
  standalone wellness, highlights, CV export, 1-on-1 requests,
  attendance, coach progress dashboard, child switcher UI).
- Decimal rating numbers anywhere in the UI for any role.

## Kill Criteria
- **Player-first thesis killed:** <30% of pilot players log weekly by
  end of week 8 → pivot to coach-first wedge or abandon Trak.
- **Triangle thesis killed:** ≥50% of pilot coaches stop assessing after
  week 4 → the product cannot sustain on player logging alone.
- **Parent role retired:** <20% of invited pilot parents ever open the
  app during the 8-week window → remove parent role from MVP scope and
  retire the €500/year parent-pain hypothesis.

## Open Risks (Flagged, Not Blocking)
1. **No named pilot club.** Wedge (E) is unsafe until a specific
   academy is committed. Recommend blocking pilot launch on this.
2. **No onboarding deadline.** Without a "pilot must start by date X"
   guardrail, the project can drift. Recommend 6 weeks from product
   readiness.
3. **Demand signal is coach- and founder-sided, not player-sided.**
   The Q4 metric is specifically designed to test the missing signal,
   but the founder should expect a higher-than-comfortable risk of
   the metric missing.
4. **Status quo cost is quantified on the parent side (€500/year) but
   not on the player or coach side.** Plan first 30 days of post-launch
   interviews to close this.

---

## Verification
How to verify the pilot build before launch:
1. End-to-end manual walkthrough on mobile web (≤430px) as each of the
   three roles, using three real devices or three browser profiles.
2. Confirm no decimal number renders in any screen for any role
   (spot-check match result, coach assessment result, parent home,
   player profile).
3. Seed one test player, one test coach, one test parent; verify RLS
   policies reject cross-tenant reads (test player B cannot read test
   player A's matches; parent cannot write anywhere).
4. Query the REQ-005 telemetry view and confirm the founder can answer
   the three pilot questions (loggers/week, assessments/week, parent
   opens/week) from a single SQL statement or dashboard.
5. Dry-run the onboarding flow for coach → player → parent using real
   `TRK-XXXX` and `PAR-XXXX` codes end to end; measure total time from
   first app open to fully-connected triangle. Target: under 10 minutes
   for all three roles combined.

## Next Step
After founder approval of these requirements, run `/plan-ceo-review` to
evaluate the strategic merit of this pilot wedge and assign an
execution mode.
