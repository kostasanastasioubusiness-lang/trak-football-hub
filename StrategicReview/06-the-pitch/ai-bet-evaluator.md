# AI Bet Evaluator

*Session: 26 September 2026. The AI Bet Evaluator tool, usable after any module. It critiques the
strategy README, and its findings feed the evaluation in [roadmap.md](roadmap.md) and the AI
Evaluation box of the [Pitch Builder](pitch-builder.md). Described in our own terms, from the tool
page's text.*

---

## What the evaluator does

It builds a prompt that asks ChatGPT, Claude, Gemini or any other model for a structured critique
of the strategy. The critique points to where the strategy is weakest. It is meant to be used in a
loop:

1. Evaluate.
2. Fix the weakest section in its component files.
3. Re-assemble the README.
4. Evaluate again.

## How it works

| # | Step | What it does |
|---|---|---|
| 1 | Load the README | Repo URL, upload `README.md`, or paste the Markdown. The five component fields fill from the README's sections. **Load example** fills a complete worked strategy; **Start blank** clears the fields. |
| 2 | Choose evaluation dimensions | Tick the lenses the model should challenge. More dimensions give a deeper analysis. |
| 3 | Generate the prompt | Copy it; each Open button copies it and opens ChatGPT, Claude or Gemini. Or add an API key and run it in the page. |
| 4 | Iterate | Fix the weakest section, re-assemble, re-evaluate |

**The five component fields**

| Field | What it holds |
|---|---|
| The Bet (M1) | What you're building, for whom, why now |
| The Moat (M2) | Defensibility, flywheel, vendor portability |
| The Margin (M3) | Cost model, pricing strategy, unit economics |
| The Contract (M4) | Trust, evals, reliability, confidence UX |
| The Guardrails (M5) | Governance, scaling, compounding systems |

**The eight evaluation dimensions**

| Dimension | Question |
|---|---|
| Bet Validation | Is the bet backed by evidence or just conviction? |
| Capability Assessment | What needs to be built, and is it realistic? |
| Impact Analysis | What business impact does it drive? |
| Defensibility Check | Can platforms or competitors copy it? |
| Pricing Alignment | Do the economics and the pricing strategy hold? |
| Trust & Reliability | Is the trust contract explicit and measurable? |
| Governance & Scale | Can it scale without breaking? |
| Gap Identification | What is missing or underspecified? |

## Trak's first load: 1 of 5 fields filled

**Open issue.** When Trak's README was pasted on 26 September, the evaluator reported *"Parsed
pasted README. Filled 1/5 component fields"*. Four of the five sections were not recognised. The
page's parser could not be read, so the cause is not confirmed. Two likely causes:

| Likely cause | Check |
|---|---|
| The pasted text was not the raw Markdown. Text copied from GitHub's rendered page or from the PR diff loses the `##` markers, or mixes old and new lines. | Paste the raw file from the branch: `StrategicReview/README.md` on `shared/strategic-review-guardrails`, via the **Raw** button |
| The parser expects the assembler's exact heading format, which may differ from `## The Bet` (for example, with the module tag `(M1)`, or a number) | Compare with the README the Strategy Assembler writes, or with the evaluator's **Load example** strategy, and match its headings |

Until all five fields fill, paste each section's **Findings** into its field by hand before
generating the prompt.

## How Trak should run it

- **Tick all eight dimensions.** Each of Trak's components has a known weak spot for a dimension
  to press on:
  - **Pricing Alignment:** billing is out of the pilot, and no academy has agreed to collect the
    pass.
  - **Bet Validation:** the passport is cut.
  - **Defensibility Check:** the network half of the moat has no work behind it.
- **Expect the critique to confirm the roadmap evaluation:** trust is well built, value is
  unproven. If it names a different weakest section, that section gets fixed first.
- **Record the output under `## Evaluation` in `roadmap.md`,** so the Pitch Builder's AI
  Evaluation box has the model's critique to draw on, not only the session's own evaluation.
