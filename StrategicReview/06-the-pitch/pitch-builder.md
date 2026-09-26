# Pitch Builder, Module 6

*Session: 26 September 2026. The Pitch Builder tool for Module 6. Trak's pitch goes under
[roadmap.md, Board Pitch](roadmap.md#board-pitch). This file records how the builder works and how
Trak's files fit it. Described in our own terms, from the tool page's text.*

---

## What the builder does

It turns the strategy and the roadmap into a board-ready pitch, weighted for one named audience
and ending in a specific ask. The pitch has six parts:

- thesis
- why now
- defensibility
- economics
- risks
- the ask

**The Markdown output is the source of truth.** It is pasted into `06-the-pitch/roadmap.md` and
committed, and the pitch is presented from the repo. The builder can also render an HTML deck,
but that is an optional take-home copy.

## Its five panels

| # | Panel | What it does |
|---|---|---|
| 1 | Load your strategy | Takes the repo's root URL once, detects the branch, and pulls both `README.md` (the strategy summary) and `06-the-pitch/roadmap.md` (roadmap and evaluation) in parallel. For a private repo, upload or paste the files instead. |
| 2 | Strategy summary | One box per component (Bet, Moat, Margin, Contract, Guardrails), filled from the README. This is the pitch's spine. |
| 3 | Roadmap and evaluation context | Boxes for Horizon 1, Horizon 2, Horizon 3 and AI Evaluation, filled from `roadmap.md`. The roadmap shows the strategy moving through time; the evaluation shows the bet was stress-tested. |
| 4 | Who you are pitching to | Pick one audience, then state the ask (see below). Each audience changes the opener, the objections and how risk is framed. |
| 5 | Run the prompt | Copy the prompt into ChatGPT, Claude or Gemini, or add an API key and run it in the page. The response is pasted into the page, rendered, and can be copied as Markdown, downloaded as `.md`, or downloaded as an HTML deck. |

**The five audiences in panel 4:**

| Audience | What it weighs |
|---|---|
| CEO + leadership team | Strategic fit, portfolio trade-offs, near-term wins |
| Founders / funding committee | Why now, why us, unfair advantage, burn that fits the stage |
| External board / investors | Defensibility, economics under stress, competitive moat, path to scale |
| CTO + head of product | Reliability contract, capability gaps, inference economics, build vs buy, governance |
| Custom | A named person and role, and what they care about |

**The ask** has three fields (funding, headcount and time horizon), plus optional context: a
decision deadline, what triggered the pitch, and any earlier asks. The builder's advice is to be
specific, because a vague ask gets a vague answer.

## The output's shape

The pitch follows the Board Pitch section of `roadmap.md` exactly:

1. **Thesis**
2. **The case**: Why now · What's defensible · The economics
3. **The risks**: Trust · Scale · Competitive
4. **The ask**

Paste it under the existing `## Board Pitch` heading, commit, then rehearse it out loud once.

## How Trak's files fit

| Builder expects | Trak | Fit |
|---|---|---|
| `README.md` with five component sections | [../README.md](../README.md) has `## The Bet` … `## The Guardrails` | Fits |
| `06-the-pitch/roadmap.md` with three horizons | `## Roadmap` with `### H1`, `### H2`, `### H3` and `### Unmapped` | Likely fits. The headings say H1/H2/H3 rather than "Horizon 1". Check that the boxes fill, and paste them if not. |
| AI evaluation findings | `## Evaluation: does the backlog execute the strategy?` in `roadmap.md`, plus the AI board metrics in the README's The Guardrails section | Partial. There is no separate evaluator output; paste the evaluation section into the AI Evaluation box. |
| An existing `## Board Pitch` heading | Added to `roadmap.md` with the four-part skeleton | Fits; empty until the builder is run |
| Repo URL loading | The strategy lives on `StrategicReview/` in the Trak repo, not at the repo root, and the work is on branch `shared/strategic-review-guardrails` until PR #165 merges | **Upload or paste the two files.** A root-URL load would look for `README.md` and `06-the-pitch/` at the root. |

## Still to decide before running it

- **Audience.** The roadmap's evaluation points to **founders / funding committee**. The open
  questions are why-now and value (price, acceptance), not defensibility.
- **The ask.** Funding, headcount and months are the founders' call. Nothing in the repo sets them.
