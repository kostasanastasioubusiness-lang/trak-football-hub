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

---

## Board Pitch

*Audience: **founders / funding committee**. Ask: **no new money, three decisions and one rule.**
Drafted in the Pitch Builder's shape from the README and this file. The
[board simulation sheet](board-simulation.md) has the run order and the answers to the hard
questions.*

### Thesis

Trak becomes the **coach-signed, consent-backed development record** for young athletes: the one
record an academy can lawfully hold about a child and another institution will accept. The pilot
proves we can build that record safely. This season has to prove two more things: that families
pay for it through the academy, and that someone outside the academy accepts it.

### The case

#### Why now

- **Anyone can now make an assessment for free. A signature can't be copied that way.** Once AI
  can write any coach's report, the only believable record is one a named coach signed. Trak is
  built around that signature, and the database enforces it (G4).
- **Child-data rules are tightening in our first markets.** A record built consent-first is hard
  for anyone to retrofit. Ours already is: roster-only admission, consent on every write, and one
  tap to withdraw.
- **The window is open for 6 to 9 months.** Veo could staple a coach assessment to footage it
  already captures and ship it free to its installed base. We have to be the accepted record
  before that happens.

#### What's defensible

- **The regulatory half of the moat is built, and tested under real roles.** Roster-only
  admission, consent on every development write, isolation between academies, a coach approval
  that AI cannot bypass, and AI switched off with a test that proves it. 30% of the backlog built
  this.
- **The network half isn't built yet.** No school, federation or trial partner accepts the record
  today. That is the moat, and it is this season's first ask.
- **We say plainly that there is no moat today.** None of the eight classic moats scores above
  2 / 5. What we have is the only position that can become one: Regulatory × Network.

#### The economics

- **Price:** a $100 season pass ($10 a month), about 20% of the ~€500 academy fee, on the
  academy's own invoice. Parents pay for extras only if they choose them.
- **Margin:** 75.7% at 100 players on illustrative costs. About 78 paying players cover a $200
  platform bill.
- **Under stress:** 66.9% if AI costs triple, 71.3% if usage doubles, and 35.9% if we go fully
  agentic at 10× cost. **AI is the margin risk, not the product.** That is why the passport comes
  back before AI does.
- **Untested:** billing is out of the pilot, and no academy has agreed to collect the pass yet.

### The risks

#### Trust

- **The risk:** one invented sentence about a child, or one child's data reaching an unapproved
  vendor, ends the product.
- **Mitigations:**
  - AI is off for the pilot, with a test proving it.
  - A coach signs everything.
  - When AI returns, a Safety Sentinel sits in front of it: invented claims below 1%, zero safety
    leaks.
- **Known gap:** corrections are being thrown away today. The fix migration is due 3 October.

#### Scale

- **The risk:** the pilot is one squad at one UAE academy, loaded by hand, and every message is
  written by a coach.
- **What that means:** scale depends on coach time per assessment.
- **How we'll know:** we measure it now, as the baseline AI must beat later. The rubber-stamp alarm
  stops speed from turning into unread approvals.

#### Competitive

- **The risk:** Veo ships a free coach report on footage to thousands of academies.
- **Our defence:** it isn't features. It is being the record institutions accept, backed by
  consent records Veo would have to rebuild academy by academy.

### The ask

**No new money.** Before the pilot starts on Monday 5 October (provisional), decide:

1. **Price test.** Founders ask the pilot academy for a signed letter of intent to collect the
   season pass in H2, at $100 or at a named alternative price.
2. **Acceptance test.** Founders hold one conversation with a UAE school or trial partner: would
   they accept a coach-signed, consent-backed record, and in what form?
3. **Fix plan into Linear.** One TRAK issue per fix, with the first migration merged by 3 October.

**And one rule for H2: the passport comes back before AI does.**

**How we'll know by the end of the pilot:**

- the share of coach messages opened within 7 days
- the share of players receiving a message every 14 days
- whether the letter of intent is signed
- whether the institution says yes
