# Roadmap Builder, Module 6

*Session: 26 September 2026. The Roadmap Builder tool for Module 6. Trak's roadmap is in
[roadmap.md](roadmap.md), built from [backlog.csv](backlog.csv). This file records how the builder
works and how Trak's files fit it. Described in our own terms, from the tool page's text.*

---

## What the builder does

It takes the strategy README and a backlog export. It lets you correct how each initiative maps to
the strategy, then produces a prompt for ChatGPT, Claude or Gemini. The model returns a
three-horizon roadmap: every initiative mapped to a strategy component and a horizon, plus an
**unmapped** pile. The result is pasted into the Roadmap section of `06-the-pitch/roadmap.md`.

## Its five panels

| # | Panel | What it does |
|---|---|---|
| 1 | Load your strategy README | Repo URL, file upload or pasted Markdown. The same loader as the AI Bet Evaluator: it pulls the five component sections, Bet, Moat, Margin, Contract and Guardrails. |
| 2 | Strategy summary | Fills one box per component from the README. The boxes can be edited, and they are what the model uses to map each initiative. |
| 3 | Drop your backlog | CSV, TSV or plain text; a Jira, Linear, Asana or Notion export works as-is. The parser detects the delimiter and looks for columns named Summary, Title, Description, Issue Type, Priority, Status, Components and Labels. The file stays in the browser. A Paste tab takes rough one-liners instead. |
| 4 | Initiatives | One row per initiative, each with a coloured chip showing a keyword guess of its component. Clicking the chip overrides the guess, and the model must respect every override. Rows can be edited, removed or added by hand, for things the backlog doesn't track. |
| 5 | Run the prompt | Either copy the prompt, where each Open button copies it and opens ChatGPT, Claude or Gemini, or add an API key and run it in the page. **Load example** fills a sample backlog; **Start blank** clears it. |

## After the run

- Paste the H1 / H2 / H3 tables into the Roadmap section of `roadmap.md`.
- Move anything that is in the wrong component.
- An unmapped item is one of two things:
  - **noise:** cut it
  - **a gap in the strategy:** rethink the strategy

  Both are findings.

## How Trak's files fit

| Builder expects | Trak | Fit |
|---|---|---|
| README with five component sections | [../README.md](../README.md) has `## The Bet`, `## The Moat`, `## The Margin`, `## The Contract`, `## The Guardrails`. Each section has a files table and a **Findings** list. | Fits. Before 26 September the README was a folder index, and the loader found no sections. |
| Backlog columns the parser recognises | `backlog.csv` has `Summary`, `Status` and `Labels`, plus `Issue key` and `Source`, which the parser does not list | Fits. The extra columns should be ignored. |
| Real backlog export | Linear was not reachable; `backlog.csv` was assembled from PR titles, `MVP Requirements` and the fix plan (74 rows) | **Partial.** About 36 Linear issues that never reached a PR are missing. Export from Linear and load that instead. |
| Chip overrides | The five overrides in [roadmap.md, step 3](roadmap.md#step-3-overrides) | Re-apply them in the builder after loading |
| Output into the Roadmap section | `roadmap.md` has `## Roadmap` with H1, H2, H3 and Unmapped | Fits |

## Differences from how Trak's roadmap was made

- **The roadmap was not produced by the builder's prompt.** It was mapped and written in this
  session. Running the builder on the same README and backlog would give an independent second
  mapping to compare against.
- **The builder's panel 4 accepts items the backlog doesn't track.** The three recommended H1
  additions in `roadmap.md` belong there as hand-added rows, so the model maps them too:
  - a price letter of intent
  - one UAE acceptance conversation
  - the fix plan entered in Linear
