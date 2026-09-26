# Strategic Review — Trak Football

Outputs of a strategy workshop run against the Trak codebase and docs on **12 September 2026**,
with the margin and contract modules added on 19 September and the guardrails module on 26
September. The review covers:

- where Trak places its bet, and a working prototype of the most critical use case
- a stress test of whether anything about the business is defensible
- how Trak should package and price
- why anyone should trust what its AI writes
- which of its loops learn rather than just scale, and the guardrails around its agents

**Read [What has changed since](#what-has-changed-since) first.** The analysis is kept exactly as
delivered, but several facts it rested on have been superseded by the
[September 25 pilot plan](../docs/pilot-readiness-2026-09-25.md) and by
[MVP Requirements](../MVP%20Requirements). The biggest change: guarantee **G7** removed all AI
processing and the player passport from the first pilot.

The review has five components, one per workshop module: [The Bet](#the-bet),
[The Moat](#the-moat), [The Margin](#the-margin), [The Contract](#the-contract) and
[The Guardrails](#the-guardrails). Each section lists its files, then its findings.

`00-Makis` is an existing placeholder in this folder and was left untouched.

---

## The Bet

Folder: [01-the-bet/](01-the-bet/)

| File | Question it answers |
|---|---|
| [strategy.md](01-the-bet/strategy.md) | What is the strategy in three sentences, and how do we pitch Trak to a CEO as an athlete passport? |
| [three-axis-diagnostic.md](01-the-bet/three-axis-diagnostic.md) | How defensible is Trak on moat, data and platform exposure — and what are the top 10 vulnerabilities? |
| [prototype.md](01-the-bet/prototype.md) | What did we prototype for the most critical use case, and what claim should the pilot attack? |
| [touchline-prototype.html](01-the-bet/touchline-prototype.html) | The prototype itself. Open in a browser; live version at the link in `prototype.md`. |

**Findings**

- **The M1 diagnostic scored** Contextual Moat 2, Data Advantage 2, Platform Exposure 3.
- **Touchline — Claude drafts, the coach signs.** The prototype's central idea is that an
  AI-authored assessment destroys believability the same way a self-fabricated one does.
- **Since then:** the player passport at the centre of the pitch is cut from the first pilot
  (G7), and AI drafting is switched off. The coach-signs principle is now enforced in the database
  (G4).

---

## The Moat

Folder: [02-the-moat/](02-the-moat/)

| File | Question it answers |
|---|---|
| [moat-stress-test.md](02-the-moat/moat-stress-test.md) | Which axis is weakest, and who exploits it? |
| [eight-moats.md](02-the-moat/eight-moats.md) | Of the eight classic moats, which is actually available to Trak? |
| [data-flywheel.md](02-the-moat/data-flywheel.md) | Does usage make the product better — and which loop is the vulnerability? |
| [threat-board.md](02-the-moat/threat-board.md) | Who attacks, from where, how fast, and how much value is at risk? |
| [90-day-encroachment-plan.md](02-the-moat/90-day-encroachment-plan.md) | What would the strongest attacker do in 90 days, and how does Trak defend? |

**Findings**

- **No moat today.** Nothing scores above 2 / 5 across the eight moats.
- **One defensible position is available: Regulatory × Network** — the only record of a young
  athlete's performance and conduct that a school can lawfully hold and another institution will
  accept. The moat is who accepts the certificate, not the software.
- **The data flywheel scores 5 / 20.** The weakest loop is Correction. The one move: persist
  `source_text`, `drafted_band`, `signed_band` and `coach_id` on every assessment — with the GDPR
  legal basis for model improvement designed in *before* the first row.
- **The sharpest attacker is Veo**: a coach assessment stapled to footage the camera already
  captured, shipped free to an installed base in 6–9 months. Veo's 90-day plan out-bites Trak's
  defence.

---

## The Margin

Folder: [03-the-margin/](03-the-margin/)

| File | Question it answers |
|---|---|
| [cost-curve.md](03-the-margin/cost-curve.md) | What do customers come for, what is metered, what is sold separately, how is it priced — and where does AI cost break the margin? |
| [margin-calculator.md](03-the-margin/margin-calculator.md) | What is Trak's gross margin per player, and what breaks it — AI cost, usage, or scale? |

**Findings**

- **Package as Leader / Filler / Killer:**
  - **Leader:** the player passport and coach-signed record, which is what customers come for.
  - **Filler:** agent-built session records (the coach judges, the agent compiles), priced per
    session but billed as a season pass.
  - **Killer:** the trial application pack, sold separately.
- **Priced for squad coverage, paid by parents through the academy.** Penetrate, not Maximize: a
  $100 season pass ($10 a month, 20% of the ~€500 academy fee) on the academy's own invoice, with
  only parent-chosen extras billed per unit.
- **On illustrative costs, margin is 75.7% at 100 players,** and ~78 paying players cover a $200
  platform bill. But AI cost can rise only ~2.3× at pilot scale before margin drops below 70%.
  Cost control and routing to cheaper models are the discipline.
- **The $55-a-month option was replaced:** it cost more than the academy fee and metered parents
  for the coach's activity.
- **Since then:** billing is out of scope for the pilot, and the passport (the Leader) is cut from
  it (G7). The pricing stays untested.

---

## The Contract

Folder: [04-the-contract/](04-the-contract/)

| File | Question it answers |
|---|---|
| [golden-dataset.md](04-the-contract/golden-dataset.md) | How do we test the agent's output, how does the coach see its confidence, and what reliability do we promise? |
| [confidence-ux.md](04-the-contract/confidence-ux.md) | What does the coach see at each confidence tier, and what can they control? The tool's output and how the tool works. |
| [reliability-contract-builder.md](04-the-contract/reliability-contract-builder.md) | The worked reliability contract, and how its builder works. Trak's own contract is section 5 of golden-dataset.md. |

**Findings**

- **Trust comes from the coach's signature and the source, not accuracy.** At the time, Trak had
  no evals, and `player-feedback` wrote AI text to children with no filter on numbers.
- **The golden dataset has 10 rows**, 4 of them adversarial, including prompt injection and a
  safeguarding disclosure.
- **Three confidence tiers, and no tier signs for the coach.**
- **The reliability contract:** fidelity ≥ 92%, invented claims < 1%, and zero safety leaks,
  checked on every live draft.
- **Since then:** T2 made coach approval mandatory, and G7 switched AI off. The contract now
  applies to AI's return.

---

## The Guardrails

Folder: [05-the-guardrails/](05-the-guardrails/)

| File | Question it answers |
|---|---|
| [compounding-system.md](05-the-guardrails/compounding-system.md) | Which loops learn and which just scale? What is the broken loop and the fix plan? Which agents should Trak build, what may each one do, and who approves? |
| [governance-policy-drafter.md](05-the-guardrails/governance-policy-drafter.md) | The worked governance policy (SupportCopilot v1.2). Trak's own policy and agent topology are in compounding-system.md. |

`compounding-system.md` holds the whole module, in this order:

1. Feedback loops, including the loops that only scale
2. Broken loop and partner audit
3. Fix plan
4. Context connectivity
5. Freeze test
6. Governance policy (five sections, plus data classes)
7. Agent topology

**Findings**

- **Nothing compounds yet: 0 of 3 learning loops, and AI is off for the pilot (G7).** Everything
  that grows is volume (records, accounts, events), not judgement. Trak passes the freeze test,
  which means it is not compounding. The pilot's real value is the human baseline:
  coach-written, coach-published messages, each with an open signal (J7).
- **The broken loop: corrections are trashed.** Found in a partner audit:
  - coach message edits overwrite `coach_shared_feedback` with no history
  - AI drafts can be deleted
  - the Safety Sentinel's block reasons would not be stored
  - no consent purpose allows learning

  The 12-step fix plan starts with one migration due 3 October: revision history, discard instead
  of delete, `prompt_version`, and band fields.
- **Data leaks (Samsung path):**
  - coaches pasting children's data into personal chatbots, now brought into the policy's scope
  - screenshots sent to the old schedule parser, now text only with names replaced
  - pre-G7 prompts carrying child data to Lovable → Gemini with no processor agreement
  - a dormant Lovable key
- **False promises (Air Canada path):**
  - the "UEFA coaching principles" claim on the dormant coach assistant screen, to be deleted
  - drafts that could promise a team place, a trial or a scholarship, now blocked by
    escalation trigger 8
  - the pre-G7 child chat. "No agent converses with a child, parent or buyer" is now a hard rule.
- **Six agents are recommended, with the Safety Sentinel first and in front of every
  child-related agent.** The orchestrator is code, not an agent, and only the coach is ever on the
  path to a child.
- **Proposed EU AI Act risk tier: `limited`.** It becomes `high` if counsel finds an academy
  counts as a vocational training institution (Annex III).

### AI board metrics

*26 September 2026. Six signals boards ask for beyond MAU and retention, evaluated for Trak.*
While G7 holds, every signal reads zero. Say so plainly rather than showing a dashboard of zeros.

| Signal | Trak's version | Target | Verdict |
|---|---|---|---|
| Hallucination rate | Drafts containing a claim not in the coach's input, plus safety leaks counted separately | Invented claims < 1%; safety leaks **exactly 0** | **Adopt. Report it first.** |
| HITL rate | Trak is 100% human-signed by design (G4). Report **edit rate** and **rubber-stamp rate** (published unedited in under 20 s) instead | 100% signed, always; rubber-stamp rate < 10% | **Adapt.** Never report "HITL down" as progress |
| Eval regression | Prompt or model changes that fail the golden dataset | 0 reach coaches | **Adopt.** A release gate first. Needs `prompt_version` (fix 3). |
| Confidence distribution | Share of drafts per tier (confident / uncertain / not confident), from verified quotes | The confident tier has the lowest edit rate | **Adopt**, together with edit rate per tier |
| Drift velocity | Weekly change in drafted-vs-signed band agreement; model-change events | Alert on a drop of more than 10 points (trigger 4) | **Adapt.** Track weekly; show the board a quarterly trend |
| Inference ROI | Revenue per $1 of AI spend: about 23× on illustrative costs ($10 a month vs $0.44) | Keep above 10× (the 70% margin floor) | **Adopt**, labelled as modelled until billing and AI are live |

**One metric to add: outcome parity.** Are AI-assisted messages opened by children as often as
hand-written ones (J7)? That is where quality meets retention.

---

## What has changed since

### 26 September 2026

Checked against `origin/main` and [MVP Requirements](../MVP%20Requirements).

| The analysis assumed | Now | Affects |
|---|---|---|
| `player-feedback` writes AI text to children | **T2 merged** (`20260920140000_coach_approved_feedback.sql`), then **G7 disabled all AI.** The three AI endpoints return `403 PILOT_FEATURE_DISABLED` before reading anything (`20260923110906`; `src/__tests__/pilot-ai-disabled.test.ts`). | The Contract, The Moat (flywheel), The Margin |
| The player passport is the Leader | The passport, its export and its sharing are **cut from the first pilot** (G7; `/player/passport` shows "Coming soon") | The Bet, The Margin |
| Coach assessments feed an AI draft | Coaches write and publish every message by hand (`coach_shared_feedback`); J7 measures whether it is opened | The Moat, The Guardrails |
| GDPR data export missing | `export_my_account()` exists (`20260919140000`); no screen offers it yet | Still open, below |
| Coaches add players | The academy roster decides the squad; coaches cannot add players (UC-C02) | The Moat (90-day plan) |

### 19 September 2026

Checked against [docs/pilot-readiness-2026-09-25.md](../docs/pilot-readiness-2026-09-25.md) and
the repository on 19 September 2026. [CLAUDE.md](../CLAUDE.md) now marks `docs/pm/STATE.md` and
`docs/features-outstanding.md` — both used as inputs to this analysis — as historical.

#### Superseded

| The analysis assumed | The current plan says | Affects |
|---|---|---|
| Greece first | **UAE first, Greece on the same build** | strategy, threat board |
| No parental-consent capture | Backend-enforced guardian consent below 18 in both countries, with purpose choices and withdrawal (P2); only minimal roster setup before approval | diagnostic #5, eight moats, threat board, 90-day plan |
| No terms or privacy policy | Drafts of terms, privacy policy and an academy agreement are in scope (P8, P9) | same as above |
| Backups never restore-tested | A restore rehearsal with recorded duration is a deliverable (S5) | diagnostic #8 |
| 9 test files for 162 source files | 29 test files for 198 source files, plus a harness suite | diagnostic #8 |
| Character axis as defensible ground | The character module is **explicitly out of scope** for September 25 | moat stress test, eight moats, 90-day plan |

#### Confirmed by the team's own decisions

| The analysis concluded | The current plan says |
|---|---|
| The coach must sign before an AI draft counts (Touchline) | AI feedback is invisible to children until a coach approves it (T2, verification U6) |
| Cross-club isolation is deliberate and blocks a data network effect | Cross-academy isolation is a named deliverable (K1, verification U7) |

### Still open

- **No billing yet.** Billing is out of scope for the pilot. The pricing policy has parents paying
  a season pass through the academy's invoice; whether academies will collect it is untested.
- **No real-child pilot yet.** September 25 was a synthetic-account demonstration. Real children
  join only when the launch gate in MVP Requirements passes and a founder majority agrees.
- **No AI evals.** No golden rows, judge or prompt/model version record exist. The fix plan in
  `05-the-guardrails/compounding-system.md` sets the order: `prompt_version`, a Safety Sentinel
  block log, and then golden-set runs before G7 is lifted.
- **AI returns only through paperwork.** G7 lifts after a processor agreement with the model
  vendor, a DPIA section and a model-improvement consent purpose. None exists yet.
- **GDPR data export.** `export_my_account()` exists, but no screen offers it. The passport's
  portability depends on it.
