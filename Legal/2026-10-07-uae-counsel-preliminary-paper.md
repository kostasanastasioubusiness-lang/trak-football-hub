# Trak — Legal and Compliance Pack for the UAE Pilot

*Preliminary discussion paper for UAE counsel*

| Document control | Value |
| --- | --- |
| Prepared | 7 October 2026, by Dimos Gougousis (Product) |
| Status | **DRAFT for discussion.** Questions and proposed positions only. Nothing here is legal advice, and no statement in it about UAE law should be relied on. |
| Purpose | Agree the minimum set of legal documents and processes Trak needs before a real child uses the product, and the decisions that block drafting them |
| Companion to | [`docs/lawyer-meeting-brief-uae.md`](../docs/lawyer-meeting-brief-uae.md) (18 September). Its questions still stand; section 2 below updates its facts, several of which have changed. |
| Facts verified against | The `main` branch of the code on 7 October 2026 |

---

## 0. What we are asking for

1. **Tell us which law governs this pilot** and confirm the two threshold decisions in section 4 (data roles; age and parental authority). These shape every document.
2. **Confirm or correct the document pack** in section 5. We think five documents and four internal procedures are the minimum, and we have deliberately left some things out (section 5.3).
3. **Draft, or review our drafts of,** the academy pilot agreement and the guardian privacy notice. These are the two the launch gate depends on.
4. **Review the specific positions** in sections 6 and 7, including the exact consent wording parents see today.

**Timing.** The pilot start is provisionally Monday 12 October 2026 and will be confirmed by the founders. That date is when rehearsal begins, **not when children are admitted.** Our launch rule is that real children join only after counsel signs off on data roles, the privacy notice, withdrawal, deletion and retention, and the academy has signed. A date never admits anyone.

---

## 1. Trak and the pilot

**Trak** is a mobile web app for youth football development. After a training session or match, a coach rates each player on six areas: work rate, technical, physical, tactical, attitude and coachability. The ratings combine into a word-based **band** (for example "Steady" or "Good"). The coach can also write a short message to the player.

- The **player** sees their band, the six ratings, the coach's message and their match and training history.
- **Parents** see the same bands and history, but **not** the coach's message.
- The coach can keep a **private note** that nobody else can read.

There is no video, location tracking, health or wellbeing data, public profile, ranking, scouting marketplace, messaging between users, or advertising.

**The pilot:** one squad at one UAE football academy, for eight weeks. We plan for 25 players. The academy and the squad have not yet been confirmed.

**How a child gets in.** Self-signup is closed.

1. The academy gives Trak its roster: child's name, date of birth, age group, assigned coach, child's email (optional, since many under-12s have none) and every guardian's email.
2. Trak loads the roster by hand.
3. Each guardian gets an email invitation, signs in and gives consent.
4. Only after consent can the child activate an account. A child with an email gets a one-use invitation. A child without one gets a username and password created by their guardian.

The database refuses any player or parent account that has no valid roster invitation.

---

## 2. What changed since the 18 September brief

The 18 September brief described the product as it was then. Several of its most serious points have since been fixed in the code. Please read this table before relying on that brief.

| 18 September brief said | True on 7 October |
| --- | --- |
| AI writes feedback a child reads, unreviewed, and a child can chat with an AI model | **All AI processing is switched off** in both the app and the backend. The AI functions refuse every request, and the AI tables cannot be read or written by users. No child data goes to any AI provider during the pilot. |
| Children can upload profile photos | **Photo upload and viewing are switched off** at the storage level. Photos of children are out of scope for the pilot. |
| A coach can type a child into the squad before any parent is involved; consent does not reach those records | **Coaches can no longer add players.** Only the academy's roster admits a child, and a guardian can consent before the child has an account. **Every write about a child under 18 now checks for active consent**: assessments, private notes, messages, attendance and match logs. A missing date of birth counts as under 18. |
| Coach notes were described as private but were readable by the player | **Private notes are private again**, including those written earlier. A message to the child is now a separate item the coach writes and saves on purpose. |
| Parents could read the coach's message through the API | **Parents cannot read the coach's message**, including through the API. They see bands and history. |
| Consent age hard-coded at 15 (reasoned from Greek law) | **Consent is required for everyone under 18.** We chose this as stricter than either market's floor. We need counsel to confirm it is right for the UAE (Q4). |
| Withdrawal stops future processing | Withdrawal **also hides already-published content** from the child and parents immediately. Nothing is deleted, and records reappear if consent is given again. |

**Unchanged:** consent records are append-only and versioned, and cross-academy isolation is enforced and tested.

---

## 3. Data map

### 3.1 What we hold about a child

| Data | Source | Who can read it |
| --- | --- | --- |
| Name, date of birth, age group, assigned coach, child email (optional) | Academy roster | Academy admin, coach; the child sees their own |
| Login: email, or a guardian-created username | Child or guardian | Authentication service only (passwords are never stored by Trak's own tables) |
| Six-area ratings and band per session | Coach | Coach, academy admin, child, linked parents |
| Coach's message to the child | Coach | Coach, child. **Not** parents |
| Coach's private note | Coach | That coach only |
| Match records (date, opponent, result, position, minutes, goals, assists) and training attendance | Coach | Coach, academy admin, child, linked parents |
| Guardian consent records (guardian name, relationship, purposes chosen, exact wording shown, wording version, date) | Guardian | Kept as evidence; the guardian can see and withdraw their own |
| App-usage events, such as "opened a published message" | Generated by the app | Founders, to measure the pilot |

**About guardians:** email, name, relationship to the child, and consent history.
**Not collected:** health, injury, mood, sleep, biometrics, location, photos, video, free-text messages between users.

### 3.2 Who processes it

| Supplier | Role | Receives | Region |
| --- | --- | --- | --- |
| Supabase | Database, authentication, sign-in email | Everything in 3.1 | **To confirm** |
| Vercel | Web hosting | Request traffic (IP address, browser) | **To confirm** |
| Sentry | Error monitoring, production only | Error reports | EU (Germany) |
| Email delivery used for invitations | Sends invitation and password-reset emails | Recipient email, child's first name and academy name in the invitation text | **To confirm**: provider and region |

No AI provider receives data during the pilot. Code for the AI features still exists but is switched off. Turning it back on would be a decision taken with counsel, not a configuration change.

---

## 4. Decisions that block drafting

For each one we give the position we propose and the question we need answered.

### D1. Governing law and our entity
**Proposed position:** none yet. We have listed instruments we *think* may apply, but we have not verified them and are not qualified to: the federal Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) and its implementing rules; the Child Rights Law (Federal Law No. 3 of 2016); the Federal Decree-Law No. 26 of 2025 on children's digital safety, which our team has cited; and the DIFC or ADGM data protection regimes if the academy or Trak sits in a free zone.

> **Q1.** Which of these apply to this pilot, and which do not?
> **Q2.** Does Trak need a UAE entity to contract with the academy, or can our existing entity contract directly? Does that choice change the data protection analysis?

### D2. Who is controller and who is processor
**Proposed position:** the **academy is the controller** of its players' coaching records and **Trak is its processor**. The academy decides which players join, who their coaches are, and how long records are kept. Trak is a separate controller only for its own account security and service operation.

**The argument against, which we want tested rather than ignored:** Trak designed the six rating areas, the band calculation, and who sees what (for example, that parents see bands but not messages). That could be read as Trak deciding *how*, and possibly *why*, children are evaluated, which would suggest joint control.

> **Q3.** Does the controller/processor split hold under the applicable law, or are we joint controllers? What does the agreement need to say either way?

### D3. Age threshold and proof of parental authority
**Proposed position:** guardian consent is required for every child under 18. The academy supplies the guardian emails from its own registration records, and Trak only invites those addresses. A guardian confirms their relationship (parent or legal guardian) on the consent screen. Trak does not check identity documents.

> **Q4.** Is under-18 the right threshold, or is there a lower digital-consent age, and would applying 18 to everyone cause any problem?
> **Q5.** Is relying on the academy's registration records enough to establish parental authority? Does the academy need to warrant this in the agreement?
> **Q6.** Each guardian consents through their own account. If two guardians disagree (one consents, one withdraws), is there a rule we must follow? We will confirm the product's current behaviour in this case before the meeting.

### D4. Processing outside the UAE
All processing happens outside the UAE (section 3.2).

> **Q7.** Is transferring children's data out of the UAE permitted for this pilot, and on what basis? What must each supplier contract contain? Do we need to change hosting region before admitting children?

### D5. Retention and end of pilot
**Proposed position:** keep pilot data for **the pilot plus 90 days**. The academy then chooses either to continue or to have Trak return the data and delete it. Consent records are evidence and may need to be kept longer than the data they cover.

> **Q8.** Is pilot + 90 days acceptable? How long must consent and withdrawal evidence be kept after the related data is deleted? What about backups?

### D6. Who collects consent
**Proposed position:** **Trak collects consent in the app**, on the academy's behalf, using wording counsel approves. The academy's existing registration process supplies the guardian contacts.

> **Q9.** Is in-app consent collected by the processor on the controller's behalf acceptable, or must the academy collect it itself?

---

## 5. Proposed document pack

### 5.1 Documents

| # | Document | Between / for | Proposed key contents | Launch-gate role |
| --- | --- | --- | --- | --- |
| **L1** | **Academy Pilot Agreement** with a **Data Processing Schedule** | Trak and the academy | Pilot scope and duration; fees (if any); data roles (D2); documented instructions; staff confidentiality; supplier list and change notice; transfers (D4); helping with guardian requests; breach notice to the academy; retention and end-of-pilot return or deletion (D5); audit; the academy's warranty about guardian contacts (Q5); safeguarding contacts; **limits on use of bands** (6.1); termination | Required: "signed academy pilot agreement" |
| **L2** | **Guardian Privacy Notice** | The academy (and Trak) to guardians | Who is responsible; what is collected (3.1); purposes; who sees what; suppliers and countries; retention; rights and how to use them; withdrawal; contact and complaints. Versioned, and linked from the invitation email and the consent screen | Required: "counsel signs off on … the notice" |
| **L3** | **Child explanation** | To the child | One screen, plain language, shown at first sign-in: what your coach writes about you, who can see it (your parents see your bands but not your coach's message to you), and who to ask. **Not a contract.** | Proposed; we think it is required for a child audience (Q10) |
| **L4** | **Coach and Academy Staff Code of Conduct** | Trak and the academy to its staff users | What may be written in a message to a child; private notes stay private and professional; no sharing screenshots or data outside the app; confidentiality; reporting concerns. Signed on paper or e-signature for the pilot | Proposed; supports "terms accepted" |
| **L5** | **Website Privacy Notice** | Trak to visitors of trakfootball.com | Error monitoring, hosting, sign-in. Cookie position: we believe we set no non-essential cookies, to be confirmed | Proposed |

### 5.2 Internal procedures (not published)

| # | Procedure | Contents |
| --- | --- | --- |
| **P1** | Risk assessment (DPIA or local equivalent) | Children, ongoing evaluation, transfers, mitigations already built (section 2) |
| **P2** | Retention schedule | Per data type, including consent evidence, invitations, usage events and backups |
| **P3** | Breach procedure | Named owner, assessment steps, who is notified (academy, regulator, families) and when |
| **P4** | Rights and safeguarding requests | How a guardian asks for access, correction, export or deletion. Account deletion is in Settings; corrections to a roster email are made by hand and logged; export exists in the backend with no screen yet. How a safeguarding concern raised through the app reaches the academy's welfare officer. |

### 5.3 Deliberately **not** drafted for the pilot

- **Terms of service for children.** A child cannot meaningfully contract. L3 explains instead of binding.
- **AI terms and AI disclosure.** AI is switched off.
- **Photo or media consent.** Photos are switched off.
- **Payment or consumer terms.** No families pay Trak.
- **In-app click-through acceptance for staff.** With one academy and a few coaches, L1 and a signed L4 are proportionate. We would build in-app acceptance for a second academy.

> **Q10.** Is this pack sufficient for the pilot? Is anything here unnecessary, or anything missing?
> **Q11.** In which language or languages must L2 and L3 be provided?
> **Q12.** Must L2 be issued in the academy's name, Trak's, or both (this depends on D2)?

---

## 6. Positions we would like reviewed

### 6.1 Limits on using bands for selection
A band summarises a coach's ratings for development. If an academy used bands alone to drop or select a child, the band would have a significant effect on that child. **Proposed clause in L1:** the academy will not use Trak bands or ratings as the **sole** basis for decisions about a child's selection, place or fees.
> **Q13.** Is this clause advisable, and is any rule on profiling of children triggered by the product as it stands?

### 6.2 Support channel
The agreed support path for the pilot is a WhatsApp group of academy staff and the Trak founders. Parents and children are not in it. Children are named by first name only, with the problem only: no dates of birth, contact details or screenshots of a child's data. Anything more goes by phone or to support@trakfootball.com.
> **Q14.** Is a WhatsApp group acceptable on these terms, given that it is a third-party service outside the agreement? Should L1 record the rules?

### 6.3 Withdrawal and deletion
Withdrawal is one tap for the guardian. It stops all new records and hides published content from the child and parents straight away, but deletes nothing, so a renewed consent restores the history. Account deletion is a separate step that removes the account.
> **Q15.** Is "hide, don't delete" on withdrawal acceptable, and how long may hidden records be kept before they must be deleted?
> **Q16.** On deletion, what happens to consent evidence about that child? Today it is kept, because it proves the processing was lawful.

### 6.4 Breach notification
> **Q17.** What are the notification deadlines and recipients (regulator, academy, families), and does the processor have its own duty separate from the academy's?

---

## 7. Consent wording parents see today (version 2026-09-12.1)

This is the exact text. It is stored on every consent record with its version number, so a past consent can always be matched to the words shown. **There is currently no longer privacy notice behind this version.** L2 is meant to be that notice.

**Choices**

| Choice | Wording | Required? |
| --- | --- | --- |
| Coaching records | *"Their coach can record assessments and matches."* Six skill ratings after a session, the matches they play, and a written note from the coach. This is what the app is for. | Required |
| Recognition | *"Their coach can give them recognition awards."* Things like player of the week, visible to you and to them. | Optional, off by default |
| Parent visibility | *"I can see their progress."* Their season band, match history and coach assessments. The coach's private notes are never shared with anyone. | Optional, off by default |

**Statement:** *"I confirm I hold parental responsibility for this child and I authorise the processing I have selected above. I understand I can withdraw at any time from my profile, and that withdrawing stops future processing."*

**Issues we have already found and want fixed with counsel's input:**

1. **Recognition awards are switched off for the pilot**, but the choice is still offered. We propose removing it.
2. Our pilot scope says **one required consent should cover parent viewing**. The screen makes parent viewing optional. We need to decide which is right. Counsel's view on whether parent viewing should be required or optional would settle it.
3. "**A written note from the coach**" does not say who sees it. Parents do not see the coach's message, and nobody sees private notes. The wording should say so.
4. "Withdrawing **stops future processing**" understates what happens. Withdrawal also hides content already published (6.3).
5. The text does not name the **academy**, link to a **privacy notice**, or say where data is **processed**.

> **Q18.** What must the consent screen itself contain, compared with the privacy notice it links to?

---

## 8. All questions in one list

| # | Topic | Question |
| --- | --- | --- |
| Q1 | Law | Which instruments apply to this pilot? |
| Q2 | Entity | Do we need a UAE entity, and does that change the analysis? |
| Q3 | Roles | Controller/processor or joint controllers? |
| Q4 | Age | Is under-18 the right consent threshold? |
| Q5 | Parental authority | Are the academy's registration records enough? |
| Q6 | Two guardians | Any rule when guardians disagree? |
| Q7 | Transfers | Is processing outside the UAE permitted, and on what basis? |
| Q8 | Retention | Pilot + 90 days; consent evidence; backups |
| Q9 | Consent collector | May Trak collect consent on the academy's behalf? |
| Q10 | Pack | Is the pack in section 5 sufficient? |
| Q11 | Language | Which languages for L2 and L3? |
| Q12 | Notice issuer | Academy, Trak, or both? |
| Q13 | Selection | The bands clause, and profiling of children |
| Q14 | Support | WhatsApp group on the stated terms |
| Q15 | Withdrawal | "Hide, don't delete": acceptable, and for how long? |
| Q16 | Deletion | What to keep of consent evidence |
| Q17 | Breach | Deadlines and recipients |
| Q18 | Consent screen | Minimum content of the consent screen |

---

## 9. Proposed next steps

1. **Meeting 1 (this paper):** counsel answers or scopes Q1–Q9. Those answers unblock drafting.
2. **Drafting:** counsel drafts L1 and L2, or reviews ours. Trak drafts L3, L4, L5 and P1–P4 for counsel's review.
3. **Product changes that follow from the answers:** consent wording (section 7), a versioned privacy notice page linked from the invitation and the consent screen, the child explanation at first sign-in, and the retention mechanism. We will scope these once Q4, Q8, Q15 and Q18 are answered.
4. **Sign-off:** counsel confirms data roles, the notice, withdrawal, deletion and retention. The academy signs L1. Only then can founders decide to admit real children.

---

### Appendix — where the facts come from

For Trak's team, so each statement can be re-checked. Paths are relative to the repository root.

| Statement | Source |
| --- | --- |
| Pilot scope, launch gate, support path | `MVP Requirements` |
| AI switched off | `supabase/migrations/20260923110906_pilot_g7_disable_media_and_ai.sql`; `supabase/functions/player-feedback/index.ts`; `supabase/functions/coach-assistant/index.ts` |
| Photos switched off | `supabase/migrations/20260923110906_pilot_g7_disable_media_and_ai.sql` |
| Consent before account; roster admission | `supabase/migrations/20260927090000_roster_consent_before_account.sql`; `20260926170000_roster_only_squad_admission.sql` |
| Consent on every write; unknown age = minor | `supabase/migrations/20260926140000_consent_on_every_development_write.sql` |
| Withdrawal hides published content | `supabase/migrations/20260927130000_family_reads_follow_consent.sql` |
| Private notes private; message separate | `supabase/migrations/20260918135500_private_notes_and_shared_feedback.sql` |
| Parents do not read the message | `supabase/migrations/20260926120000_parents_do_not_read_coach_messages.sql` |
| Under-18 threshold | `supabase/migrations/20260921120000_consent_threshold_18.sql`; `src/lib/consent.ts` |
| Children without email; guardian-created logins | `supabase/migrations/20260928120000_roster_child_without_email.sql`; `20260930090127_guardian_child_logins.sql` |
| Consent wording and version | `src/lib/consent.ts` |
| Roster fields | `admit_roster_child` in `supabase/migrations/` |
| Sentry region | `vercel.json` (Content-Security-Policy) |
| Earlier open decisions | `Legal/DECISIONS-REQUIRED-BEFORE-PILOT.md`; `Legal/PROPOSED-SOLUTION-EU-MINORS-ONBOARDING.md` |
