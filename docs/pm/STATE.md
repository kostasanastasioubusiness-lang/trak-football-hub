# State: Trak Football — Pilot Wedge
Last Updated: 2026-04-09 00:00

## Summary
| Metric | Value |
|--------|-------|
| Total milestones | 6 |
| Total tasks | 31 |
| Completed | 0 |
| In progress | 0 |
| Blocked | 0 |

## Tasks

### Milestone 1: Foundation
| ID | Task | Status | Commit SHA | Notes |
|----|------|--------|------------|-------|
| 1.1 | Scaffold React + Vite + TS project | pending | - | - |
| 1.2 | Configure Tailwind with design tokens | pending | - | - |
| 1.3 | Load fonts (DM Sans + DM Mono) | pending | - | - |
| 1.4 | Initialize Supabase client | pending | - | - |
| 1.5 | Build TypeScript types | pending | - | - |
| 1.6 | Build rating engine | pending | - | - |
| 1.7 | Build shared UI components | pending | - | - |
| 1.8 | Build NavBar component | pending | - | - |

### Milestone 2: Auth + Onboarding
| ID | Task | Status | Commit SHA | Notes |
|----|------|--------|------------|-------|
| 2.1 | Supabase schema migration | pending | - | - |
| 2.2 | Auth context + hooks | pending | - | - |
| 2.3 | Route guard | pending | - | - |
| 2.4 | Landing page | pending | - | - |
| 2.5 | Player onboarding | pending | - | - |
| 2.6 | Coach onboarding + TRK-XXXX | pending | - | - |
| 2.7 | Invite code utilities | pending | - | - |
| 2.8 | Parent onboarding | pending | - | - |
| 2.9 | App router setup | pending | - | - |

### Milestone 3: Player Core
| ID | Task | Status | Commit SHA | Notes |
|----|------|--------|------------|-------|
| 3.1 | Match log form | pending | - | - |
| 3.2 | Live band preview | pending | - | - |
| 3.3 | Match save handler | pending | - | - |
| 3.4 | Match result screen | pending | - | - |
| 3.5 | Player home | pending | - | - |
| 3.6 | Match history + detail | pending | - | - |
| 3.7 | Integration tests for match log | pending | - | - |

### Milestone 4: Coach Core
| ID | Task | Status | Commit SHA | Notes |
|----|------|--------|------------|-------|
| 4.1 | SliderInput component | pending | - | - |
| 4.2 | Assessment form | pending | - | - |
| 4.3 | Assessment save handler | pending | - | - |
| 4.4 | Squad management | pending | - | - |
| 4.5 | Player profile view (coach) | pending | - | - |
| 4.6 | Session log | pending | - | - |
| 4.7 | Invite code display screen | pending | - | - |
| 4.8 | Coach home + profile | pending | - | - |
| 4.9 | Integration tests for assessment | pending | - | - |

### Milestone 5: Parent Core
| ID | Task | Status | Commit SHA | Notes |
|----|------|--------|------------|-------|
| 5.1 | CategoryBar component | pending | - | - |
| 5.2 | AlertCard component | pending | - | - |
| 5.3 | Parent home | pending | - | - |
| 5.4 | Parent match feed (filtered) | pending | - | - |
| 5.5 | Parent goals view | pending | - | - |
| 5.6 | Parent alerts | pending | - | - |
| 5.7 | Integration tests for parent access | pending | - | - |

### Milestone 6: Goals, Medals, Telemetry, Profiles
| ID | Task | Status | Commit SHA | Notes |
|----|------|--------|------------|-------|
| 6.1 | Goals CRUD + auto-tracking | pending | - | - |
| 6.2 | Goals screens | pending | - | - |
| 6.3 | Medal checker | pending | - | - |
| 6.4 | Medals screen | pending | - | - |
| 6.5 | Telemetry client | pending | - | - |
| 6.6 | Player profile | pending | - | - |
| 6.7 | Log choose screen | pending | - | - |
| 6.8 | Telemetry SQL views | pending | - | - |
| 6.9 | End-to-end pilot verification | pending | - | - |

## Blockers
None

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-09 | Approach A (Client-Heavy) | 30-user pilot, zero tamper risk, speed to build |
| 2026-04-09 | GK/DEF/MID use universal-only until modifiers provided | Algorithm structure unchanged, no architectural impact |
