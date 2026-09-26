# Board Simulation: Presenter's Sheet

*Present from the repo. No slides. The pitch itself is in
[roadmap.md, Board Pitch](roadmap.md#board-pitch).*

---

## Opening line

> **"I'm pitching to the founders and funding committee."**

Then start with the thesis. Always.

## Run order: 5 minutes

| Time | Say | Open in the repo |
|---|---|---|
| 0:00 | **Thesis:** the coach-signed, consent-backed record. The pilot proves it's safe; this season proves people pay for it and accept it. | [roadmap.md, Thesis](roadmap.md#thesis) |
| 0:40 | **Why now:** the signature is the scarce part; child-data rules; Veo's 6–9 month window | [../02-the-moat/threat-board.md](../02-the-moat/threat-board.md) |
| 1:30 | **What's defensible:** regulatory half built and tested, network half not started, and no moat today | [../README.md, The Moat](../README.md#the-moat) |
| 2:20 | **Economics:** $100 pass, 75.7% margin, and 35.9% at 10× AI cost | [../03-the-margin/margin-calculator.md](../03-the-margin/margin-calculator.md) |
| 3:10 | **Risks:** trust (AI off, coach signs, Sentinel), scale (coach time), competitive (Veo) | [../05-the-guardrails/compounding-system.md, Agent Topology](../05-the-guardrails/compounding-system.md#agent-topology) |
| 4:00 | **The ask:** no money; price letter of intent, acceptance conversation, fix plan in Linear; passport before AI | [roadmap.md, The ask](roadmap.md#the-ask) |
| 4:40 | **How we'll know:** opens, message cadence, letter of intent yes/no, acceptance yes/no | [roadmap.md, Roadmap](roadmap.md#roadmap) |

## Hard questions, short answers

**"Why fund this and not X?"**

- **The usual X is the AI features:** the drafter, the assistant, the schedule parser. Funding them
  first spends on margin risk before anyone has shown they'll pay.
- **The other X is the academy console.** It serves the buyer, but it can't show that parents value
  the record.
- **This ask costs nothing and answers the two questions that decide everything after it:** will
  anyone pay, and will anyone accept the record.

**"What's the moat at 6 months?"**

- **Honestly: the regulatory half.** Consent records, roster-only admission and isolation between
  academies, already built and tested.
- **Plus, if the ask is approved:** one institution that has said it will accept the record, and
  one academy committed to collecting the pass.
- **What Veo could copy in that time:** the assessment. **What it couldn't:** the consent records
  and the acceptance.
- **If neither the institution nor the academy says yes by month 6, we have no moat.** That is the
  kill signal below.

**"What happens to the margin under stress?"**

| Scenario | Margin |
|---|---|
| Base (100 players) | 75.7% |
| AI costs triple | 66.9% |
| Usage doubles | 71.3% |
| Fully agentic, 10× cost | 35.9% |

- **Controls:**
  - per-user daily AI quotas already exist
  - route to cheaper models
  - AI stays optional in H2, and the passport ships first
- **At 1,000 players** the platform cost spreads out, and even 10× AI cost holds 53.8%.

**"What's the kill plan?"** *(Thresholds proposed here; the founders set them before launch.)*

- **Stop charging for the record, and rethink who pays,** if by the end of the 8-week pilot:
  - the academy won't sign a letter of intent at any price, **and**
  - no institution will accept the record.
- **Stop the pilot early** if any of these happens:
  - one invented claim about a child reaches a family
  - one child's data reaches an unapproved vendor
  - a consent check fails on a live write
- **Pause AI's return indefinitely** if the Safety Sentinel can't hold safety leaks at exactly zero
  on the golden dataset.

## What not to say

- **Framework names.** The audience doesn't care about "Leader / Filler / Killer" or "Regulatory ×
  Network". Say "what families come for" and "the record others accept".
- **Anything the repo can't show.** If asked for a number that isn't here, say it's not measured
  yet and name when it will be.
