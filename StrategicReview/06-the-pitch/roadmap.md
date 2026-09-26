# Roadmap from the Backlog

*Session: 26 September 2026. Built in five steps from the strategic review
[README](../README.md) and a backlog assembled in [backlog.csv](backlog.csv). It maps each initiative
to a strategy component and a horizon, then evaluates the strategy against what the team is actually
building.*

**Horizons**

| Horizon | Window | Gate to enter it |
|---|---|---|
| **H1** | Now → end of the first pilot (start moved to Monday 5 October, provisional; 8 weeks) | Launch gate in `MVP Requirements` |
| **H2** | Season 1 after the pilot, December 2026 → June 2027 | Pilot passes; founder majority admits real children |
| **H3** | Season 2 onwards, July 2027 → | A second academy and a second country |

---

## The five steps, and how each went

| # | Step | What happened | Caveat |
|---|---|---|---|
| 1 | Load README | The README now has the five component sections the loader looks for: The Bet, The Moat, The Margin, The Contract, The Guardrails. | Before 26 September the loader found none. The README was a folder index. |
| 2 | Drop the backlog | Trak's backlog lives in Linear, which was not reachable, and GitHub has one issue. [backlog.csv](backlog.csv) was built instead, 74 rows: 43 TRAK issues named in PR titles, 18 parked or cut items from `MVP Requirements`, and 13 new items from the guardrails fix plan. | TRAK numbers run to 79, so about 36 Linear issues that never reached a PR are missing. Export from Linear and re-run. |
| 3 | Override the auto-guess | A keyword guess maps "AI", "assessment" and "message" to The Contract, and "academy" to The Moat. Five overrides, listed below. | — |
| 4 | Run | Run in this session, not in the tool page. | Re-run in the tool on the Linear export to compare. |
| 5 | Commit | This file, plus `backlog.csv`. | — |

### Step 3 overrides

| Initiative | Keyword guess | Override | Why |
|---|---|---|---|
| Coach-signed record (J4, J5) | The Contract ("assessment") | **The Bet** | Pilot assessments are written by coaches, with no AI anywhere. This is the Leader's core record. |
| Child and parent see it (J6, G4) | The Contract ("message") | **The Bet** | It delivers the signed record to the family: the product, not a trust layer. |
| AI, photo and passport boundary (G7) | The Contract ("AI") | **The Guardrails** | It switches AI off; it doesn't make AI trustworthy. |
| Academy console (`/club/*`) | The Moat ("academy") | **The Margin** | The academy is the buyer that collects the season pass. The console is where that relationship lives. |
| Correction capture (fix plan 1–3) | The Contract ("draft") | **The Guardrails** | It exists to stop corrections being trashed, and it runs with AI off. |

---

## Roadmap

### H1: now → end of the first pilot

| Initiative | Component | Backlog items | Status |
|---|---|---|---|
| Coach logs, assesses and publishes a signed message (J4, J5) | The Bet | TRAK-7, 50, 57, 64, 66, 67, 68, 69, 72, 75, 79 | 8 done, 3 in progress |
| Child and parent see it; parents never see the message (J6, G4) | The Bet | TRAK-6, 15, 56, 63, 70, 71, 73, 76 | 6 done, 2 in progress |
| Measure opens from real UI events (J7) | The Bet | TRAK-10 | Done |
| Roster-only admission, consent on every write, no self-join (J1–J3, G1, G2, G3, G5, G6) | The Moat | TRAK-11, 12, 13, 14, 18, 19, 48, 49, 52, 53, 54, 59, 60 | 10 done, 3 in progress |
| AI, photo and passport boundary (G7) | The Guardrails | TRAK-17, 42, 47 | Done |
| Keep every correction: revision history, discard instead of delete, `prompt_version` and band fields | The Guardrails | NEW-1, NEW-2, NEW-3 | To do, due 3 Oct |
| Safeguarding lead per academy; coach no-paste rule; remove the UEFA claim; revoke the Lovable key | The Guardrails | NEW-6, NEW-7, NEW-9, NEW-12 | To do |
| Model-improvement consent purpose and DPIA section | The Guardrails | NEW-5 | To do, due 17 Oct |
| Launch-gate docs, restore rehearsal, tooling | Enabler, not mapped to strategy | TRAK-23, 24, 39, 40, 43, 45, 61; NEW-13 | Done except NEW-13 |

### H2: season 1, December 2026 → June 2027

| Initiative | Component | Backlog items |
|---|---|---|
| Player passport and evolution card return | The Bet | PARKED-1 |
| Passport export and sharing; an export screen for `export_my_account()` | The Moat | PARKED-2, PARKED-18 |
| Processor agreement with the model vendor (G7's exit for AI) | The Contract | NEW-11 |
| AI feedback drafting behind coach review, then the schedule parser and the coach assistant | The Contract | PARKED-3, PARKED-5, PARKED-4, NEW-8 |
| Safety Sentinel with block log and commitment-language trigger | The Guardrails | NEW-4, NEW-10 |
| Season pass on the academy invoice | The Margin | PARKED-17 |
| Academy console | The Margin | PARKED-8 |

### H3: season 2 onwards, July 2027 →

| Initiative | Component | Backlog items |
|---|---|---|
| Transfers between academies: the record travels with the child | The Moat | PARKED-15 |
| Anonymised calibration priors across academies (L3) | The Guardrails | *none; not in the backlog* |
| Institutions accept the certificate (the Network half of the moat) | The Moat | *none; not in the backlog* |

### Unmapped

These serve no strategy component. Keep them parked, or drop them.

| Item | Backlog key |
|---|---|
| Recognition and awards | PARKED-6 |
| Parent alerts | PARKED-7 |
| Child photos and avatars | PARKED-9 |
| Parent goals | PARKED-10 |
| Player-entered match logging. It also works against the coach-signed record. | PARKED-11 |
| Lead guardian invites another adult | PARKED-12 |
| Household entity | PARKED-13 |
| Per-child training notes | PARKED-14 |
| Automatic retry | PARKED-16 |

---

## Evaluation: does the backlog execute the strategy?

**Where the 43 TRAK issues go**

| Component | TRAK issues | Share |
|---|---:|---:|
| The Bet | 20 | 47% |
| The Moat | 13 | 30% |
| The Guardrails | 3 | 7% |
| The Contract | 0 | 0% |
| The Margin | 0 | 0% |
| Enablers | 7 | 16% |

**What the team executes well**

- **The Moat's regulatory half.** Roster-only admission, consent on every write, and isolation
  between academies. This is the "record a school can lawfully hold" half of Regulatory × Network,
  and it is built to a high standard.
- **The Bet's coach-signed record.** The coach writes, publishes, and the child reads, without AI.
  That tests the Touchline idea with the risky part removed.

**What the pilot cannot prove**

The strategy names three sources of value, and none has an H1 item:

1. **The Leader is cut.** The passport, the thing "customers come for", is out of the pilot (G7).
   The pilot proves the record, not the passport.
2. **The Margin has no work at all.** Billing is out of scope, and nothing tests whether an academy
   will collect $100 per child on its own invoice. Eight weeks will pass without a price signal.
3. **The Network half of the moat has no work.** No item covers a school, federation or trial
   partner accepting the record. The moat is "who accepts the certificate", and nobody is being
   asked.

**Also missing from the backlog**

- **The Veo defence**, the sharpest threat on the threat board.
- **Golden-dataset growth** beyond 10 rows.
- **The fix-plan items as Linear issues.** They exist only in `compounding-system.md`.

**Verdict:** the backlog executes *trust* rigorously and *value* not at all. That is the right
order for a children's product. But if the pilot ends with no price signal and no institution
asked, the next round of work (H2) starts blind.

## Recommendations

Three H1 items, none of them code:

1. **Price test.** During the pilot, the founders ask the academy for a signed letter of intent to
   collect the season pass from families in H2, at $100 or at a named alternative price.
   Owner: founders.
2. **Acceptance test.** Ask one UAE school or trial partner whether it would accept a
   coach-signed, consent-backed record, and in what form. Owner: founders.
3. **Put the fix plan in Linear**, one TRAK issue per item, so the first three can meet their
   3 October date. Owner: Imad.

**First item in H2:** the passport comes back before AI does. The Leader matters more than the
Filler.
