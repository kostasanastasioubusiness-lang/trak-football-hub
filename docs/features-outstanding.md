# Features that still need work

Derived from the verified use-case review of the current build. Ordered by how ready each group is
to be worked on, not by importance.

---

## 1. Known defects

None currently open. Every defect found in this round has been fixed — see *Recently closed*.

## 2. Built but not yet exercised live

The verification sweep cleared five of the six. One remains.

| | Feature | Persona |
|---|---|---|
| P4 | Parent alerts — implements only a subset of the specced alert types | Parent |

## 3. Partially built

Nothing outstanding — A8 was the last item here and is now delivered.

## 4. Open observations — not yet investigated

| Observation | Why it matters |
|---|---|
| The passport rendered **two identical "Player of the Week" entries** | Either duplicate rows in `recognition_awards` or a render duplication. Recognition is permanent and shown on the passport, so duplicates are visible to players |
| A **U11s squad exists in the data**, but `AGE_GROUPS` in `constants.ts` starts at U13 | The app holds data for an age group it does not officially offer. Directly relevant to the character feature's age banding, which assumes ages 6–18 |

## 5. Not built — the character feature

The athlete's only active role, and the reason for a child to open the app between matches.
Content is gated on the sports psychologist review.

| | Feature | Persona |
|---|---|---|
| A13 | Per-session moment: learn (flashcard) → apply (scenario) → act (challenge) | Athlete |
| A14 | Growth view: values shown, streaks, season progress | Athlete |
| N2 | Character corner on the player card — separate axis, never merged into the performance band | Athlete |
| C13 | Coach sees a player's character progress | Coach |
| — | Content library: values × age band × tier, plus the weekly value rotation | — |

## 6. Not built — required before real users or revenue

| | Feature |
|---|---|
| N3 | Terms of service and privacy policy |
| N3 | Parental consent capture — age gating, versioning, audit trail |
| N4 | Billing: payments, plans, subscription state, invoices, failed-payment handling |
| — | Data export for GDPR portability (account deletion already exists) |

## 7. Deliberately deferred

| Feature | Note |
|---|---|
| Parents see the coach's private note | Kept player-only on purpose. Reopen only if you decide otherwise |
| P6 → parent view of coach assessments | Now delivered; the private note remains excluded |
| Multi-sport — rugby, basketball | Needs the football pack proven first |
| School / academy roles | Parked with the schools direction |

## 8. Technical work that is not a feature but blocks launch

| Item | Current state |
|---|---|
| Test coverage | 7 test files against 163 source files |
| RLS security review | Two faults already found — recursion, then missing policies. Children's data raises the stakes |
| PWA manifest / install experience | None. No app icon; browser bookmark only |
| Backups | Restore never tested |
| Bundle size | Build warns on chunks over 500 kB |

---

## Shortest path

There are no open defects. What remains is genuine build work, and the two largest pieces — the
character feature and the legal/billing layer — are gated on the psychologist and lawyer
conversations rather than on engineering.

The remaining unblocked items are small: exercise parent alerts (P4) live, and settle the two
product questions in group 4. Everything else of substance now waits on a conversation, not on
engineering.

### Recently closed

- **A8 parent invite delivery** — built (`5c91efe`). Players can now share an invite link from
  their profile; previously a parent was only linked by coincidence of using the exact address.

- **P5** — parent access to coach assessments and awards. Migration `20260612000001`, applied.
- **Housekeeping** — `MatchLog.tsx` and `CoachProgress.tsx` deleted as orphaned and unreferenced.
- **Verification sweep** — C9 recognition, C10 schedule, C11 AI assistant, A7 passport and K6 club
  radar all exercised live against the database. **None was silently broken** — the P5 pattern did
  not repeat. C11 proved stronger than documented: it is squad-aware and renders pitch diagrams.
- **K5 club dashboard** — showed "TOTAL PLAYERS 1" above squads summing to 29, because the headline
  counted linked accounts while the squads counted roster rows. Fixed (`3bd1507`).
- **Passport horizontal overflow** — fixed (`866949a`); the card now scales to fit while the PNG
  export keeps its full 390px geometry.
- **Dev seed duplication** — the whole seed is now idempotent (`14976b2`, `42e43c3`).
- **Signup password policy** — client rules did not match Supabase, so realistic passwords were
  rejected with a raw character-set dump. Fixed (`fd1a30e`).
- **End-to-end chain verified** — coach → player → parent created from scratch; invite-code linking,
  squad membership and parent linking all confirmed against the live database.
