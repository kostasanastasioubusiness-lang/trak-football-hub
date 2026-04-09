# Trak Football — Pilot PRD
Version: 1.0
Date: 2026-04-09
Mode: Hold Scope
Status: Build-ready

> **This document is the single implementation reference for Lovable and Claude Code.**
> Do not add features not listed here. Do not deviate from the design system.
> If something is ambiguous, ask — do not guess and build.

---

## 1. Product Summary

Trak is a player-first career tracking platform for academy footballers aged 13–18.
The founding principle: **the player owns their career.**

### Pilot Scope
One academy club. ~15 players, ~2 coaches, ~15 parents. 8-week closed pilot.
Mobile web only, max width 430px. No native apps. No public marketing.

### Success Metric
≥60% of pilot players log ≥1 match/week for 8 consecutive weeks, unprompted after week 2.

### Kill Criteria
- <30% weekly player logging by week 8 → kill player-first thesis
- ≥50% of coaches stop assessing after week 4 → kill triangle thesis
- <20% of parents ever open the app → retire parent role

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+ with TypeScript |
| Styling | Tailwind CSS (custom config matching design tokens below) |
| Database | Supabase PostgreSQL (Frankfurt region) |
| Auth | Supabase Auth with email confirmation |
| Email | Resend SMTP via trakfootball.com |
| Hosting | Lovable (pilot), migrate if needed |
| Repo | Private GitHub |

---

## 3. Design System

### 3.1 Colour Tokens

```css
:root {
  --bg:        #0A0A0B;                    /* near-black base background */
  --s1:        #101012;                    /* surface — cards */
  --s2:        #17171A;                    /* elevated surface */
  --s3:        #202024;                    /* input backgrounds */
  --border:    rgba(255, 255, 255, 0.07);  /* subtle border */
  --border-md: rgba(255, 255, 255, 0.11);  /* medium border */
  --accent:    #C8F25A;                    /* volt green — primary accent */
  --t1:        rgba(255, 255, 255, 0.88);  /* primary text */
  --t2:        rgba(255, 255, 255, 0.45);  /* secondary text */
  --t3:        rgba(255, 255, 255, 0.22);  /* muted text */
}
```

**Tailwind config extension:**
```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0B',
        s1: '#101012',
        s2: '#17171A',
        s3: '#202024',
        accent: '#C8F25A',
        t1: 'rgba(255,255,255,0.88)',
        t2: 'rgba(255,255,255,0.45)',
        t3: 'rgba(255,255,255,0.22)',
        border: 'rgba(255,255,255,0.07)',
        'border-md': 'rgba(255,255,255,0.11)',
        // Band colours
        'band-exceptional': '#C8F25A',
        'band-standout': '#86efac',
        'band-good': '#4ade80',
        'band-steady': '#60a5fa',
        'band-mixed': '#fb923c',
        'band-developing': '#a78bfa',
        'band-difficult': 'rgba(255,255,255,0.4)',
      },
    },
  },
};
```

### 3.2 Typography

| Usage | Font | Weight | Size | Letter-spacing |
|-------|------|--------|------|----------------|
| Display numbers, band words | DM Sans | 300 | 40–56px | -0.03em |
| Headings | DM Sans | 300–400 | 20–32px | -0.02em |
| Body | DM Sans | 400 | 14–16px | normal |
| Section labels, metadata, timestamps | DM Mono | 500 | 9px | 0.12em, uppercase |
| Buttons | DM Sans | 700 | 14px | 0.02em |

**Rules:**
- Never use weight 700 except on buttons
- All metadata labels are DM Mono 500, 9px, uppercase, letter-spacing 0.12em
- Large display values (season band word, match count) are DM Sans 300, 40–56px

**Font loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3.3 Spacing & Radius

| Token | Value |
|-------|-------|
| `radius-sm` | 10px |
| `radius-md` | 14px |
| `radius-lg` | 18px |
| `radius-xl` | 24px |
| Card padding | 16px |
| Screen horizontal padding | 20px |
| Section gap | 24px |
| Card gap | 12px |

### 3.4 Nav Bar

Bottom navigation with glassmorphism effect.

```css
.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(10, 10, 11, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
}

.nav-item.active {
  background: rgba(200, 242, 90, 0.06);
  color: #C8F25A;
}

.nav-item.inactive {
  color: rgba(255, 255, 255, 0.35);
}
```

### 3.5 Performance Band Display

**7 bands. Fixed vocabulary. Never show decimal numbers.**

| Band | Word | Colour | Hex | Score Range |
|------|------|--------|-----|-------------|
| 1 | Exceptional | Volt | `#C8F25A` | 9.2+ |
| 2 | Standout | Soft lime | `#86efac` | 8.2–9.1 |
| 3 | Good | Green | `#4ade80` | 7.2–8.1 |
| 4 | Steady | Blue | `#60a5fa` | 6.4–7.1 |
| 5 | Mixed | Muted orange | `#fb923c` | 5.6–6.3 |
| 6 | Developing | Soft purple | `#a78bfa` | 4.8–5.5 |
| 7 | Difficult | Near-white muted | `rgba(255,255,255,0.4)` | Below 4.8 |

**Band pill CSS:**
```css
.band-exceptional { background: rgba(200,242,90,0.15); color: #C8F25A; border: 1px solid rgba(200,242,90,0.3); }
.band-standout    { background: rgba(134,239,172,0.13); color: #86efac; border: 1px solid rgba(134,239,172,0.26); }
.band-good        { background: rgba(74,222,128,0.13);  color: #4ade80; border: 1px solid rgba(74,222,128,0.24); }
.band-steady      { background: rgba(96,165,250,0.13);  color: #60a5fa; border: 1px solid rgba(96,165,250,0.24); }
.band-mixed       { background: rgba(251,146,60,0.13);  color: #fb923c; border: 1px solid rgba(251,146,60,0.24); }
.band-developing  { background: rgba(167,139,250,0.13); color: #a78bfa; border: 1px solid rgba(167,139,250,0.24); }
.band-difficult   { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }
```

**Global rule:** The band word is rendered inside a pill using these styles. The underlying decimal score is NEVER rendered in any component, for any role.

---

## 4. User Roles & Permissions

| Role | Can Read | Can Write | Receives |
|------|----------|-----------|----------|
| Player | Own matches, own goals, own medals, own assessments, own profile | Match log, goal updates, profile | Assessment notifications |
| Coach | Connected players' matches, connected players' profiles | Assessments, sessions, own profile | New player connection |
| Parent | Connected child's matches (bands only), child's assessments, child's goals | Nothing | Match logged, medal unlocked, new assessment |

**Strict rules:**
- Parent cannot see: body condition, self-rating details (private match inputs)
- Parent cannot write to any table — enforced by RLS
- Coach can only see players connected via `player_coach` table
- Player A cannot see Player B's data — enforced by RLS
- Assessment notes are visible to the assessed player and their coach only — not parents

---

## 5. Connection System

### 5.1 Coach Invite Code (`TRK-XXXX`)

**Generation:** On coach signup, system generates a unique 6-character code with format `TRK-XXXX` (where X is alphanumeric uppercase). Stored in `coaches.invite_code`.

**Flow:**
1. Coach completes onboarding → system generates `TRK-XXXX` code
2. Coach shares code verbally or via messaging (outside Trak)
3. Player enters code during onboarding Step 3 or from profile
4. System validates code → finds coach → creates `player_coach` row instantly
5. No approval step required — connection is immediate
6. Coach sees player appear in squad view

**Validation rules:**
- Code must match exactly (case-insensitive input, stored uppercase)
- Code must exist in `coaches.invite_code`
- Player cannot connect to same coach twice (unique constraint on `player_coach`)

### 5.2 Parent Invite Code (`PAR-XXXX`)

**Generation:** Player generates a code from their profile. Format `PAR-XXXX`. Stored in `players.parent_invite_code`.

**Flow:**
1. Player taps "Invite Parent" → system generates `PAR-XXXX` code
2. Player shares code with parent (verbally, text, etc.)
3. Parent downloads Trak → selects Parent role on landing
4. Parent enters `PAR-XXXX` code → app shows child's name for confirmation
5. Parent creates account → `player_parent` row created
6. Parent has immediate read-only access

**Validation rules:**
- Code must exist in `players.parent_invite_code`
- Show child's first name + last initial for confirmation before creating account
- One parent code per player (can be regenerated)

---

## 6. Rating Algorithm

### 6.1 Core Rules
- **Baseline:** 6.5
- **Range:** 4.0 minimum, 10.0 maximum (clamped)
- **Friendly matches:** all modifiers × 0.8
- **Output:** decimal stored in `matches.computed_score`, mapped to band word in `matches.band`
- **UI rule:** player sees band word only. NEVER the number.

### 6.2 Universal Modifiers (all positions)

| Condition | Modifier |
|-----------|----------|
| Team won (`score_us > score_them`) | +0.3 |
| Team drew (`score_us == score_them`) | 0 |
| Team lost (`score_us < score_them`) | –0.2 |
| Self-rating: Excellent | +0.4 |
| Self-rating: Good | +0.2 |
| Self-rating: Average | 0 |
| Self-rating: Poor | –0.3 |
| Yellow card | –0.2 |
| Red card | –0.6 |
| Body: Fresh | +0.1 |
| Body: Good | 0 |
| Body: Tired | –0.05 |
| Body: Carrying a knock | –0.15 |
| Played 75+ minutes | +0.1 |
| Played 45–74 minutes | 0 |
| Played under 45 minutes | –0.1 |

### 6.3 Position-Specific Modifiers — Goalkeeper

**Questions shown to player:**
1. Clean sheet? — Yes / No
2. Saves made — 0 / 1–2 / 3–4 / 5+
3. Distribution quality — Poor / Average / Good / Excellent
4. Commanding presence — Yes / Mostly / No
5. Errors leading to a goal — None / 1 / 2+

| Input | Modifier |
|-------|----------|
| Clean sheet: Yes | +0.5 |
| Clean sheet: No | 0 |
| Saves: 0 | –0.1 |
| Saves: 1–2 | +0.1 |
| Saves: 3–4 | +0.25 |
| Saves: 5+ | +0.4 |
| Distribution: Excellent | +0.2 |
| Distribution: Good | +0.1 |
| Distribution: Average | 0 |
| Distribution: Poor | –0.2 |
| Commanding presence: Yes | +0.15 |
| Commanding presence: Mostly | +0.05 |
| Commanding presence: No | –0.15 |
| Errors leading to goal: None | 0 |
| Errors leading to goal: 1 | –0.3 |
| Errors leading to goal: 2+ | –0.55 |

### 6.4 Position-Specific Modifiers — Defender

**Questions shown to player:**
1. Duels won — Most / About half / Few / None
2. Clearances and blocks — Several / Some / None
3. Aerial dominance — Won most headers / Mixed / Lost most
4. Positioning — Yes / Mostly / No
5. Goals conceded — 0 / 1 / 2 / 3+
6. Assists or key passes — 0 / 1 / 2+

| Input | Modifier |
|-------|----------|
| Duels won: Most | +0.3 |
| Duels won: About half | +0.1 |
| Duels won: Few | –0.15 |
| Duels won: None | –0.3 |
| Clearances: Several | +0.2 |
| Clearances: Some | +0.1 |
| Clearances: None | –0.05 |
| Aerial: Won most | +0.2 |
| Aerial: Mixed | 0 |
| Aerial: Lost most | –0.2 |
| Positioning: Yes | +0.15 |
| Positioning: Mostly | +0.05 |
| Positioning: No | –0.2 |
| Goals conceded: 0 | +0.2 |
| Goals conceded: 1 | 0 |
| Goals conceded: 2 | –0.15 |
| Goals conceded: 3+ | –0.3 |
| Assists or key passes: 0 | 0 |
| Assists or key passes: 1 | +0.15 |
| Assists or key passes: 2+ | +0.25 |

### 6.5 Position-Specific Modifiers — Midfielder

**Questions shown to player:**
1. Passes completed — Most / About half / Few
2. Chances created — 2+ / 1 / None
3. Pressing and ball recovery — High / Medium / Low
4. Assists — 0 / 1 / 2+
5. Goals scored — 0 / 1 / 2+
6. Did you control the tempo? — Yes / Partly / No

| Input | Modifier |
|-------|----------|
| Passes: Most | +0.25 |
| Passes: About half | +0.05 |
| Passes: Few | –0.2 |
| Chances created: 2+ | +0.3 |
| Chances created: 1 | +0.15 |
| Chances created: None | 0 |
| Pressing: High | +0.2 |
| Pressing: Medium | +0.05 |
| Pressing: Low | –0.15 |
| Assists: 0 | 0 |
| Assists: 1 | +0.25 |
| Assists: 2+ | +0.4 |
| Goals: 0 | 0 |
| Goals: 1 | +0.3 |
| Goals: 2+ | +0.5 |
| Tempo: Yes | +0.15 |
| Tempo: Partly | +0.05 |
| Tempo: No | –0.1 |

### 6.6 Position-Specific Modifiers — Attacker

**Questions shown to player:**
1. Goals scored — 0 / 1 / 2 / 3+
2. Assists — 0 / 1 / 2+
3. Shots on target — 0 / 1–2 / 3–4 / 5+
4. Attacking threat — Quiet / Dangerous / Dominant
5. Hold-up play and link-up — Good / Average / Poor
6. Defensive contribution (pressing) — High / Medium / Low

| Input | Modifier |
|-------|----------|
| Goals: 0 | 0 |
| Goals: 1 | +0.35 |
| Goals: 2 | +0.55 |
| Goals: 3+ | +0.75 |
| Assists: 0 | 0 |
| Assists: 1 | +0.25 |
| Assists: 2+ | +0.4 |
| Shots on target: 0 | –0.1 |
| Shots on target: 1–2 | +0.1 |
| Shots on target: 3–4 | +0.2 |
| Shots on target: 5+ | +0.35 |
| Attacking threat: Quiet | –0.2 |
| Attacking threat: Dangerous | +0.15 |
| Attacking threat: Dominant | +0.3 |
| Hold-up play: Good | +0.15 |
| Hold-up play: Average | 0 |
| Hold-up play: Poor | –0.1 |
| Pressing: High | +0.1 |
| Pressing: Medium | 0 |
| Pressing: Low | –0.1 |

### 6.7 Computation Pseudocode

```
function computeMatchScore(match):
    score = 6.5

    // Apply universal modifiers
    score += getResultModifier(match.score_us, match.score_them)
    score += getSelfRatingModifier(match.self_rating)
    score += getCardModifier(match.card)
    score += getBodyModifier(match.body_condition)
    score += getMinutesModifier(match.minutes_played)

    // Apply position-specific modifiers
    score += getPositionModifiers(match.position, match.position_inputs)

    // Apply friendly discount
    if match.is_friendly:
        modifiers_total = score - 6.5
        score = 6.5 + (modifiers_total * 0.8)

    // Clamp
    score = clamp(score, 4.0, 10.0)

    return round(score, 2)

function scoreToBand(score):
    if score >= 9.2: return 'exceptional'
    if score >= 8.2: return 'standout'
    if score >= 7.2: return 'good'
    if score >= 6.4: return 'steady'
    if score >= 5.6: return 'mixed'
    if score >= 4.8: return 'developing'
    return 'difficult'
```

### 6.8 Live Preview

The match log form includes a **live band preview** that updates in real time as the player fills in fields. It shows the band word with its colour pill. It never shows the number. The preview recalculates on every field change.

---

## 7. Database Schema

### 7.1 Core Tables

```sql
-- profiles extends auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('player', 'coach', 'parent')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nationality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('gk', 'def', 'mid', 'att')),
  club TEXT,
  age_group TEXT,
  shirt_number INT,
  coach_invite_code TEXT,           -- code player entered to connect
  parent_invite_code TEXT UNIQUE,   -- code player shares with parent
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club TEXT,
  age_group TEXT,
  role TEXT,                         -- coaching role title
  invite_code TEXT UNIQUE NOT NULL,  -- TRK-XXXX
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connection tables
CREATE TABLE player_coach (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, coach_id)
);

CREATE TABLE player_parent (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, parent_id)
);

-- Match data
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  opponent TEXT NOT NULL,
  score_us INT NOT NULL,
  score_them INT NOT NULL,
  competition TEXT NOT NULL CHECK (competition IN ('league', 'cup', 'tournament', 'friendly')),
  venue TEXT NOT NULL CHECK (venue IN ('home', 'away')),
  age_group TEXT,
  minutes_played INT NOT NULL,
  card TEXT NOT NULL DEFAULT 'none' CHECK (card IN ('none', 'yellow', 'red')),
  body_condition TEXT NOT NULL CHECK (body_condition IN ('fresh', 'good', 'tired', 'knock')),
  self_rating TEXT NOT NULL CHECK (self_rating IN ('poor', 'average', 'good', 'excellent')),
  position TEXT NOT NULL CHECK (position IN ('gk', 'def', 'mid', 'att')),
  position_inputs JSONB NOT NULL DEFAULT '{}',
  computed_score DECIMAL(4,2) NOT NULL,
  band TEXT NOT NULL CHECK (band IN ('exceptional','standout','good','steady','mixed','developing','difficult')),
  is_friendly BOOLEAN NOT NULL DEFAULT false,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coach assessments
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
  appearance TEXT CHECK (appearance IN ('started', 'sub', 'training')),
  work_rate INT NOT NULL CHECK (work_rate BETWEEN 1 AND 10),
  tactical INT NOT NULL CHECK (tactical BETWEEN 1 AND 10),
  attitude INT NOT NULL CHECK (attitude BETWEEN 1 AND 10),
  technical INT NOT NULL CHECK (technical BETWEEN 1 AND 10),
  physical INT NOT NULL CHECK (physical BETWEEN 1 AND 10),
  coachability INT NOT NULL CHECK (coachability BETWEEN 1 AND 10),
  overall_band TEXT NOT NULL CHECK (overall_band IN ('exceptional','standout','good','steady','mixed','developing','difficult')),
  self_rating_flag TEXT CHECK (self_rating_flag IN ('fair', 'generous', 'way off')),
  note TEXT,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('performance', 'consistency', 'development', 'personal')),
  target_number INT,
  current_number INT DEFAULT 0,
  is_auto_tracked BOOLEAN NOT NULL DEFAULT false,
  tracking_field TEXT,
  progress_level TEXT CHECK (progress_level IN ('just_started', 'making_progress', 'nearly_there', 'achieved')),
  progress_note TEXT,
  target_date TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medals
CREATE TABLE medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  medal_type TEXT NOT NULL CHECK (medal_type IN ('first_match','on_a_roll','first_star','ten_down','most_improved','self_aware')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, medal_type)
);

-- Previous clubs
CREATE TABLE previous_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  role TEXT,
  years TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false
);

-- Telemetry (REQ-005)
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL,  -- 'match_log' | 'assessment' | 'parent_open' | 'form_start' | 'form_submit'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.2 Telemetry View (REQ-005)

```sql
-- Weekly pilot dashboard view
CREATE OR REPLACE VIEW pilot_weekly_summary AS
SELECT
  date_trunc('week', te.created_at) AS week_start,
  te.event_type,
  COUNT(DISTINCT te.user_id) AS unique_users,
  COUNT(*) AS total_events
FROM telemetry_events te
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Player weekly logging detail
CREATE OR REPLACE VIEW pilot_player_logging AS
SELECT
  p.id AS player_id,
  pr.first_name,
  date_trunc('week', m.logged_at) AS week_start,
  COUNT(*) AS matches_logged
FROM players p
JOIN profiles pr ON p.profile_id = pr.id
LEFT JOIN matches m ON m.player_id = p.id
GROUP BY 1, 2, 3
ORDER BY 3 DESC, 2;
```

---

## 8. RLS Policies

```sql
-- Players read own data only
CREATE POLICY "Players read own matches"
  ON matches FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Players insert own matches"
  ON matches FOR INSERT
  WITH CHECK (player_id IN (
    SELECT id FROM players WHERE profile_id = auth.uid()
  ));

-- Coaches read connected players' matches
CREATE POLICY "Coaches read connected player matches"
  ON matches FOR SELECT
  USING (player_id IN (
    SELECT pc.player_id FROM player_coach pc
    JOIN coaches c ON c.id = pc.coach_id
    WHERE c.profile_id = auth.uid()
  ));

-- Parents read connected child's matches (band only enforced at app layer)
CREATE POLICY "Parents read child matches"
  ON matches FOR SELECT
  USING (player_id IN (
    SELECT pp.player_id FROM player_parent pp
    JOIN parents p ON p.id = pp.parent_id
    WHERE p.profile_id = auth.uid()
  ));

-- Parents cannot write anywhere
-- (No INSERT/UPDATE/DELETE policies for parents on any table)

-- Assessments: coach can write for connected players
CREATE POLICY "Coaches insert assessments"
  ON assessments FOR INSERT
  WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE profile_id = auth.uid())
    AND player_id IN (
      SELECT pc.player_id FROM player_coach pc
      JOIN coaches c ON c.id = pc.coach_id
      WHERE c.profile_id = auth.uid()
    )
  );

-- Assessments: player reads own
CREATE POLICY "Players read own assessments"
  ON assessments FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE profile_id = auth.uid()
  ));

-- Assessments: parent reads child's (note field filtered at app layer)
CREATE POLICY "Parents read child assessments"
  ON assessments FOR SELECT
  USING (player_id IN (
    SELECT pp.player_id FROM player_parent pp
    JOIN parents p ON p.id = pp.parent_id
    WHERE p.profile_id = auth.uid()
  ));

-- Invite codes: publicly readable for validation
CREATE POLICY "Anyone can validate coach invite codes"
  ON coaches FOR SELECT
  USING (true)  -- only invite_code column exposed via API view
;

CREATE POLICY "Anyone can validate parent invite codes"
  ON players FOR SELECT
  USING (true)  -- only parent_invite_code column exposed via API view
;
```

> **Note on parent data filtering:** RLS grants parents SELECT on `matches` and `assessments` rows for their child. The *columns* `body_condition`, `self_rating`, and `position_inputs` are private to the player — filter these out at the app/API layer (return null for parent role). Assessment `note` is visible to player and coach only — filter out for parent.

---

## 9. Screens & User Flows

### 9.1 Screen Inventory (Pilot Build)

The pilot includes a subset of the full 37-screen spec. Each screen below has an ID matching the v4 prototype.

**Landing & Auth:**
| ID | Screen | Purpose |
|----|--------|---------|
| `s-landing` | Landing | Role selection: Player / Coach / Parent |

**Player Onboarding (4 steps + done):**
| ID | Screen | Fields |
|----|--------|--------|
| `s-ob-p1` | Step 1: Identity | First name, last name, nationality |
| `s-ob-p2` | Step 2: Football | Position (GK/DEF/MID/ATT), club, age group, shirt number |
| `s-ob-p3` | Step 3: Coach code | Enter `TRK-XXXX` coach invite code (optional, skippable) |
| `s-ob-p4` | Step 4: Invite parent | Generate `PAR-XXXX` code, display with copy button (skippable) |
| `s-ob-p-done` | Done | Welcome message, enter app |

**Player App:**
| ID | Screen | Purpose |
|----|--------|---------|
| `s-p-home` | Home | Hero card: season band word (large), band distribution bars, trend, recent matches |
| `s-p-logchoose` | Log choose | Select match type / position (if multi-position) |
| `s-p-logform` | Match log form | Full form with live band preview |
| `s-p-result` | Match result | Band reveal animation, band pill, match summary, goal update card (if applicable) |
| `s-p-matches` | Match history | Scrollable list of all matches, each showing opponent, date, band pill |
| `s-p-matchdetail` | Match detail | Full breakdown: all inputs + coach assessment if one exists for this match |
| `s-p-goals` | Goals list | Auto-tracked + manual goals, progress bars |
| `s-p-addgoal` | Add goal | Title, category picker, target (optional), target date (optional) |
| `s-p-updategoal` | Update goal | Progress level selector + note for manual goals |
| `s-p-medals` | Medals | 6 medal slots: unlocked (coloured) vs locked (grey silhouette) |
| `s-p-profile` | Profile | Stats, coach assessment category bars, previous clubs, connections, invite parent |

**Coach Onboarding (2 steps + done):**
| ID | Screen | Fields |
|----|--------|--------|
| `s-ob-c1` | Step 1: Identity | First name, last name, nationality |
| `s-ob-c2` | Step 2: Club | Club name, age group, coaching role |
| `s-ob-c-done` | Done | TRK-XXXX code displayed prominently with copy button |

**Coach App:**
| ID | Screen | Purpose |
|----|--------|---------|
| `s-c-home` | Home | Squad overview, recent assessments, quick actions |
| `s-c-squad` | Squad | Player list with latest band pill per player |
| `s-c-addplayer` | Add player | Manual add form (name, position, age group) |
| `s-c-playerprofile` | Player profile | Player's band history, assessment history, match feed |
| `s-c-sessions` | Sessions | Session list with date, type, notes |
| `s-c-addsession` | Add session | Date picker, type selector (training/match/other), notes |
| `s-c-assess` | Assessment form | 6 sliders (1–10), appearance selector, optional note, band output |
| `s-c-invitecode` | Invite code | Large display of TRK-XXXX code, copy button, share instructions |
| `s-c-profile` | Coach profile | Invite code, season stats, previous clubs |

**Parent Onboarding (3 steps + done):**
| ID | Screen | Fields |
|----|--------|--------|
| `s-ob-par1` | Step 1: Code | Enter `PAR-XXXX` code |
| `s-ob-par1b` | Step 1b: Confirm | Shows child's name — "Is this your child?" confirm/cancel |
| `s-ob-par2` | Step 2: Identity | First name, last name |
| `s-ob-par-done` | Done | Welcome message, enter app |

**Parent App:**
| ID | Screen | Purpose |
|----|--------|---------|
| `s-par-home` | Home | Hero card: child's season band word (large), trend bars, band distribution, latest assessment bars |
| `s-par-matches` | Matches | Child's match feed: opponent, date, band pill (no private inputs) |
| `s-par-goals` | Goals | Read-only view of child's goals and progress |
| `s-par-alerts` | Alerts | 3 types: new coach assessment, medal unlocked, match logged |

### 9.2 Navigation Structure

**Player nav bar (5 items):**
Home | Log | Goals | Medals | Profile

**Coach nav bar (4 items):**
Home | Squad | Sessions | Profile

**Parent nav bar (4 items):**
Home | Matches | Goals | Alerts

---

## 10. Match Log Form Specification (REQ-001)

This is the most important form in the app. If players don't complete it weekly, the pilot fails.

### 10.1 Form Fields (in order)

| # | Field | Type | Options | Required |
|---|-------|------|---------|----------|
| 1 | Position | Pill selector | GK / DEF / MID / ATT (pre-filled from profile) | Yes |
| 2 | Competition | Pill selector | League / Cup / Tournament / Friendly | Yes |
| 3 | Venue | Pill selector | Home / Away | Yes |
| 4 | Opponent | Text input | Free text | Yes |
| 5 | Score (us) | Number input | 0–99 | Yes |
| 6 | Score (them) | Number input | 0–99 | Yes |
| 7 | Minutes played | Slider or number | 0–120 | Yes |
| 8 | Card | Pill selector | None / Yellow / Red | Yes (default: None) |
| 9 | Body condition | Pill selector | Fresh / Good / Tired / Knock | Yes |
| 10 | Self-rating | Pill selector | Poor / Average / Good / Excellent | Yes |
| 11+ | Position-specific | Varies by position | See 10.2 | Yes |

### 10.2 Position-Specific Fields

**Goalkeeper:**
| Field | Type | Options |
|-------|------|---------|
| Clean sheet | Pill selector | Yes / No |
| Saves made | Pill selector | 0 / 1–2 / 3–4 / 5+ |
| Distribution quality | Pill selector | Poor / Average / Good / Excellent |
| Commanding presence | Pill selector | Yes / Mostly / No |
| Errors leading to goal | Pill selector | None / 1 / 2+ |

**Defender:**
| Field | Type | Options |
|-------|------|---------|
| Duels won | Pill selector | Most / About half / Few / None |
| Clearances and blocks | Pill selector | Several / Some / None |
| Aerial dominance | Pill selector | Won most headers / Mixed / Lost most |
| Positioning | Pill selector | Yes / Mostly / No |
| Goals conceded | Pill selector | 0 / 1 / 2 / 3+ |
| Assists or key passes | Pill selector | 0 / 1 / 2+ |

**Midfielder:**
| Field | Type | Options |
|-------|------|---------|
| Passes completed | Pill selector | Most / About half / Few |
| Chances created | Pill selector | 2+ / 1 / None |
| Pressing and ball recovery | Pill selector | High / Medium / Low |
| Assists | Pill selector | 0 / 1 / 2+ |
| Goals scored | Pill selector | 0 / 1 / 2+ |
| Control the tempo | Pill selector | Yes / Partly / No |

**Attacker:**
| Field | Type | Options |
|-------|------|---------|
| Goals scored | Pill selector | 0 / 1 / 2 / 3+ |
| Assists | Pill selector | 0 / 1 / 2+ |
| Shots on target | Pill selector | 0 / 1–2 / 3–4 / 5+ |
| Attacking threat | Pill selector | Quiet / Dangerous / Dominant |
| Hold-up play and link-up | Pill selector | Good / Average / Poor |
| Defensive contribution | Pill selector | High / Medium / Low |

### 10.3 Live Band Preview

- Positioned at the bottom of the form, fixed above the save button
- Recalculates on every field change
- Shows: band word in a colour pill (matching band display CSS from Section 3.5)
- Animates smoothly when band changes (e.g., from Steady to Good)
- NEVER shows the decimal number

### 10.4 Form UX Rules

- Single scrollable form — no multi-step wizard
- All pill selectors use `--s3` background, `--border` border, `--t1` text when selected
- Selected pill: `--accent` border, slight accent background tint
- Save button: full width, `--accent` background, black text, weight 700, `radius-md`
- On save: compute score, determine band, persist to `matches` table, fire `match_log` telemetry event, navigate to result screen

---

## 11. Match Result Screen (`s-p-result`)

After saving a match, the player sees the result screen:

1. **Band reveal** — large band word (DM Sans 300, 48px) with band colour, fade-in animation
2. **Match summary card** — opponent, score, competition, venue, minutes
3. **Goal update card** (conditional) — if any auto-tracked goal made progress, show: goal title, old progress → new progress, progress bar
4. **Medal card** (conditional) — if a medal was unlocked, show medal icon + name + "Just unlocked!"
5. **"Log Another" button** — secondary style
6. **"Done" button** — returns to home

---

## 12. Coach Assessment Form (REQ-002)

### 12.1 Form Fields

| # | Field | Type | Range |
|---|-------|------|-------|
| 1 | Player | Selector | From connected squad |
| 2 | Appearance | Pill selector | Started / Sub / Training |
| 3 | Work Rate | Slider | 1–10 |
| 4 | Tactical | Slider | 1–10 |
| 5 | Attitude | Slider | 1–10 |
| 6 | Technical | Slider | 1–10 |
| 7 | Physical | Slider | 1–10 |
| 8 | Coachability | Slider | 1–10 |
| 9 | Note | Text area | Optional, visible to player only (not parent) |
| 10 | Match link | Selector | Optional — link to a specific match |

### 12.2 Slider UX
- Track: `--s3` background
- Filled portion: gradient towards band colour based on current value
- Thumb: 20px circle, white
- No number displayed on the slider — coach sees the slider position only
- Below all 6 sliders: computed `overall_band` shown as band word in colour pill
- Band recomputes live as sliders move

### 12.3 Overall Band Computation
```
average = (work_rate + tactical + attitude + technical + physical + coachability) / 6
overall_band = scoreToBand(average)  // same function as match banding
```

### 12.4 Self-Rating Flag
If the assessment is linked to a match, compare the coach's `overall_band` with the player's `self_rating`:
- Within 1 band = `fair`
- Player rated themselves higher by 2+ bands = `generous`
- Mismatch by 3+ bands = `way off`

This flag is stored but used for the "Self Aware" medal calculation only. Not displayed to anyone.

---

## 13. Goals & Medals

### 13.1 Auto-Tracked Goals

Updated automatically when a match is saved. The match save handler checks all active auto-tracked goals and increments `current_number`.

| Tracking Field | What It Counts |
|----------------|---------------|
| `goals_scored` | Sum of goals from `position_inputs` across all matches this season |
| `matches_played` | Count of `matches` rows this season |
| `standout_bands` | Count of matches with band = `exceptional` or `standout` |

### 13.2 Manual Goals

Player selects progress level from: Just started / Making progress / Nearly there / Achieved it.
Optional short note. Coach and parent see the update.

### 13.3 Medals (6 total)

| Medal | Type | Trigger Logic |
|-------|------|--------------|
| First Match | `first_match` | `COUNT(matches WHERE player_id = X) >= 1` |
| On a Roll | `on_a_roll` | Matches logged in 5 consecutive calendar weeks |
| First Star | `first_star` | `EXISTS(matches WHERE band IN ('exceptional','standout'))` |
| Ten Down | `ten_down` | `COUNT(matches WHERE player_id = X) >= 10` |
| Most Improved | `most_improved` | Band distribution improves over any 10-match sliding window |
| Self Aware | `self_aware` | Player self-rating aligns with coach band within 1 band, 5 times |

**Medal check runs after every match save.** If a new medal is earned, insert into `medals` table and show on the result screen.

---

## 14. Parent Experience (REQ-004)

### 14.1 What Parents See

| Data | Visible | Source |
|------|---------|--------|
| Match opponent, date, score | Yes | `matches` |
| Match band word + colour | Yes | `matches.band` |
| Coach assessment 6 category bars | Yes | `assessments` (sliders mapped to band colours) |
| Coach assessment overall band | Yes | `assessments.overall_band` |
| Goals and progress | Yes | `goals` |
| Medals | Yes | `medals` |

### 14.2 What Parents Do NOT See

| Data | Reason |
|------|--------|
| `body_condition` | Private health input |
| `self_rating` | Private self-assessment |
| `position_inputs` (raw) | Private match details |
| `assessment.note` | Private coach-to-player note |
| `computed_score` | Hidden from everyone |
| Any other player's data | RLS enforced |

### 14.3 Parent Alerts (3 types only)

| Alert Type | Trigger | Content |
|------------|---------|---------|
| Match logged | Player saves a match | "[Child] logged a match vs [Opponent] — [Band]" |
| Coach assessment | Coach submits assessment | "[Child] received a new assessment from [Coach]" |
| Medal unlocked | Medal earned | "[Child] earned the [Medal Name] medal!" |

Alerts are stored in-app. No push notifications in pilot. No email alerts in pilot.

---

## 15. Auth & Routing

### 15.1 Auth Flow
1. User arrives at `s-landing` → selects role (Player / Coach / Parent)
2. Email + password signup with Supabase Auth
3. Email confirmation sent via Resend SMTP
4. On confirmation → role-specific onboarding flow
5. On completion → role-specific home screen
6. Persistent sessions via Supabase refresh tokens

### 15.2 Role-Based Routing

```
/                    → s-landing (if not authenticated)
/onboarding/player/* → s-ob-p1 through s-ob-p-done
/onboarding/coach/*  → s-ob-c1 through s-ob-c-done
/onboarding/parent/* → s-ob-par1 through s-ob-par-done

/player/home         → s-p-home
/player/log          → s-p-logchoose → s-p-logform → s-p-result
/player/matches      → s-p-matches
/player/matches/:id  → s-p-matchdetail
/player/goals        → s-p-goals
/player/goals/add    → s-p-addgoal
/player/goals/:id    → s-p-updategoal
/player/medals       → s-p-medals
/player/profile      → s-p-profile

/coach/home          → s-c-home
/coach/squad         → s-c-squad
/coach/squad/add     → s-c-addplayer
/coach/squad/:id     → s-c-playerprofile
/coach/sessions      → s-c-sessions
/coach/sessions/add  → s-c-addsession
/coach/assess        → s-c-assess
/coach/invite        → s-c-invitecode
/coach/profile       → s-c-profile

/parent/home         → s-par-home
/parent/matches      → s-par-matches
/parent/goals        → s-par-goals
/parent/alerts       → s-par-alerts
```

### 15.3 Route Guards
- Unauthenticated → redirect to `/`
- Authenticated but onboarding incomplete → redirect to next onboarding step
- Authenticated player accessing `/coach/*` → redirect to `/player/home`
- Authenticated parent accessing write endpoints → block at RLS + app layer

---

## 16. Telemetry (REQ-005)

### 16.1 Events to Track

| Event | `event_type` | `metadata` | Trigger |
|-------|-------------|------------|---------|
| Form started | `form_start` | `{ form: 'match_log' }` | Player opens match log form |
| Form submitted | `form_submit` | `{ form: 'match_log', duration_seconds: N }` | Player saves match |
| Match logged | `match_log` | `{ match_id, band }` | Match persisted |
| Assessment submitted | `assessment` | `{ player_id, overall_band }` | Coach saves assessment |
| Parent app open | `parent_open` | `{}` | Parent loads any screen |

### 16.2 Implementation
- Insert into `telemetry_events` table on each trigger
- `user_id` = `auth.uid()` of the acting user
- No user-facing UI for telemetry
- Founder queries via Supabase dashboard SQL editor using the views from Section 7.2

---

## 17. Component Library

### 17.1 Shared Components

| Component | Usage | Key Props |
|-----------|-------|-----------|
| `BandPill` | Display band word in coloured pill | `band: BandType` |
| `BandPreview` | Live preview during form entry | `score: number` (internal only) |
| `NavBar` | Bottom navigation | `role: Role, activeTab: string` |
| `Card` | Surface container | `elevated?: boolean` |
| `PillSelector` | Single-select horizontal pills | `options: string[], value: string, onChange` |
| `SliderInput` | Coach assessment slider | `value: number, min: 1, max: 10, onChange` |
| `MetadataLabel` | DM Mono uppercase label | `text: string` |
| `InviteCodeDisplay` | Large code with copy button | `code: string, format: 'TRK' \| 'PAR'` |
| `MatchCard` | Match summary in list | `match: Match` |
| `GoalCard` | Goal with progress bar | `goal: Goal` |
| `MedalSlot` | Medal circle — locked or unlocked | `medal?: Medal` |
| `AlertCard` | Parent alert item | `alert: Alert` |
| `CategoryBar` | Coach assessment category bar | `label: string, band: BandType` |

### 17.2 TypeScript Types

```typescript
type Role = 'player' | 'coach' | 'parent';

type Position = 'gk' | 'def' | 'mid' | 'att';

type Competition = 'league' | 'cup' | 'tournament' | 'friendly';

type Venue = 'home' | 'away';

type Card = 'none' | 'yellow' | 'red';

type BodyCondition = 'fresh' | 'good' | 'tired' | 'knock';

type SelfRating = 'poor' | 'average' | 'good' | 'excellent';

type BandType = 'exceptional' | 'standout' | 'good' | 'steady' | 'mixed' | 'developing' | 'difficult';

type MedalType = 'first_match' | 'on_a_roll' | 'first_star' | 'ten_down' | 'most_improved' | 'self_aware';

type GoalCategory = 'performance' | 'consistency' | 'development' | 'personal';

type ProgressLevel = 'just_started' | 'making_progress' | 'nearly_there' | 'achieved';

type Appearance = 'started' | 'sub' | 'training';

type SelfRatingFlag = 'fair' | 'generous' | 'way off';

interface BandConfig {
  word: string;       // display word (capitalised)
  color: string;      // hex or rgba
  bg: string;         // pill background
  border: string;     // pill border
  minScore: number;   // lower threshold (inclusive)
}

const BANDS: BandConfig[] = [
  { word: 'Exceptional', color: '#C8F25A', bg: 'rgba(200,242,90,0.15)', border: 'rgba(200,242,90,0.3)', minScore: 9.2 },
  { word: 'Standout', color: '#86efac', bg: 'rgba(134,239,172,0.13)', border: 'rgba(134,239,172,0.26)', minScore: 8.2 },
  { word: 'Good', color: '#4ade80', bg: 'rgba(74,222,128,0.13)', border: 'rgba(74,222,128,0.24)', minScore: 7.2 },
  { word: 'Steady', color: '#60a5fa', bg: 'rgba(96,165,250,0.13)', border: 'rgba(96,165,250,0.24)', minScore: 6.4 },
  { word: 'Mixed', color: '#fb923c', bg: 'rgba(251,146,60,0.13)', border: 'rgba(251,146,60,0.24)', minScore: 5.6 },
  { word: 'Developing', color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.24)', minScore: 4.8 },
  { word: 'Difficult', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', minScore: 0 },
];
```

---

## 18. Explicitly NOT in Pilot

Do not build any of the following. This list is exhaustive.

- Training log for players
- Wellness as a standalone daily feature
- Highlights / video upload
- CV / profile export
- 1-on-1 meeting requests between coach and parent
- Attendance tracking
- Coach progress dashboard (analytics for the coach)
- Child switcher UI for multi-child parents
- Push notifications
- Email notifications (beyond auth confirmation)
- Payment, pricing, subscription
- Marketing site, landing page, SEO
- App Store / Play Store listing
- Desktop layout (everything is mobile-first, max 430px)
- Native iOS or Android app
- Algorithm tuning beyond v1
- Any feature not explicitly described in this document

---

## 19. Build Sequence

Recommended implementation order. Each phase should be independently testable.

### Phase 1: Foundation
1. Supabase project setup (Frankfurt, schema migration, RLS policies)
2. Auth flow (signup, email confirmation, persistent sessions)
3. Role selection on landing → role-based routing
4. Design system: Tailwind config, font loading, shared components (`BandPill`, `Card`, `NavBar`, `PillSelector`, `MetadataLabel`)

### Phase 2: Player Core (REQ-001 + REQ-003)
5. Player onboarding (4 steps)
6. Coach invite code validation (connect player → coach)
7. Match log form with live band preview
8. Rating algorithm (compute score, map to band)
9. Match result screen (band reveal)
10. Player home (season hero card, band distribution, recent matches)
11. Match history + match detail screens

### Phase 3: Coach Core (REQ-002 + REQ-003)
12. Coach onboarding (2 steps) + `TRK-XXXX` code generation
13. Coach invite code display screen
14. Squad management (list + add player)
15. Assessment form (6 sliders, live band preview, save)
16. Player profile view (from coach perspective)
17. Session log (add + list)

### Phase 4: Parent Core (REQ-003 + REQ-004)
18. Parent invite code generation (player side)
19. Parent onboarding (enter `PAR-XXXX`, confirm child, create account)
20. Parent home (child hero card, assessment bars)
21. Parent match feed (filtered: no private inputs)
22. Parent goals view (read-only)
23. Parent alerts (3 types)

### Phase 5: Goals, Medals, Profiles
24. Auto-tracked goals (update on match save)
25. Manual goals (add + update progress)
26. Medal system (check triggers after match save)
27. Player profile (stats, assessment bars, connections, previous clubs)
28. Coach profile (invite code, stats, previous clubs)

### Phase 6: Telemetry (REQ-005)
29. Telemetry event insertion on all triggers
30. Pilot dashboard views (SQL views in Supabase)
31. Verify founder can query weekly metrics

---

## 20. Acceptance Criteria Summary

| REQ | Criterion | How to Verify |
|-----|-----------|---------------|
| REQ-001 | Match persists with `computed_score` and `band`; no decimal in UI | Save match → check DB row → check result screen |
| REQ-002 | Assessment persists with `overall_band`; player and parent see it | Submit assessment → check DB → check player profile → check parent home |
| REQ-003 | `TRK-XXXX` connects coach↔player instantly; `PAR-XXXX` connects player↔parent | Enter code → check connection table → check squad/parent view |
| REQ-004 | Parent sees bands + assessments + goals; cannot write; cannot see private fields | Load parent screens → attempt mutation → verify RLS rejection |
| REQ-005 | Founder can query weekly loggers, assessments, parent opens in <1 min | Run SQL view → verify counts match manual count |

---

*This PRD is the implementation contract. Build what's here. Nothing more.*
