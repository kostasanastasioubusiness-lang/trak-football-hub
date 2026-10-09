# Trak — Legal Questions for a UAE Pilot

*Updated 8 October 2026 for counsel review and the forthcoming academy meeting.*

| Document control | Value |
| --- | --- |
| Purpose | Describe the product and ask for decisions before the first real-child pilot. |
| Source baseline | Repository commit `d0ed55ff618ee0a0b943399236527f9e3f7ebbb5`, reviewed 8 October 2026. Source inspection does not confirm deployed configuration or current production behaviour. |
| Product scope | [MVP Requirements](../MVP%20Requirements), including the agreed J8 events requirement. A requirement is not evidence of implementation. |
| Related legal work | Makis's preliminary counsel paper in [PR #247](https://github.com/kostasanastasioubusiness-lang/trak-football-hub/pull/247). It remains his draft; its retention and updates are his decision. This brief supplies current product facts and open questions without changing that paper. |
| Academy discussion | The academy has **not been briefed**. A meeting is planned in the coming weeks; acceptance of the arrangements below remains pending. |

## 1. Pilot scope and decisions still needed

The proposed first pilot is in the UAE. Coaches record training, matches,
attendance and six-metric assessments. Children see their records and a
manually written message published by their coach. Linked parents see their
child's assessment bands and history, but not the coach's message or private
working notes. Guardian approval is required below 18 in the current source.
This is the implemented product threshold, not a conclusion about applicable law.

**J8 events are required for the first real-child pilot.** Coaches must be able
to schedule training, matches and other events with weekly repetition. Children
and parents must see events in the app and their phone calendars; changes and
cancellations must reach families. A past event becomes a completed session
with attendance. Match events include kit; parents can report an absence.
Launch requires the nine TRAK-25 acceptance checks, including one-tap calendar
subscription and rehearsal on real phones, delivered through 18 slices. The existing parked calendar is not evidence that
these requirements have been delivered. The pilot date depends on the launch
gates; an earlier September or October target is not a current commitment.

AI assistance, AI feedback, child photos, recognition authoring and the academy
console are parked. Lineups and broader matchday planning are post-pilot.
Coach-only birthday reminders and profile improvements are also post-pilot:
preferred foot, coach-entered statistics and a possible UAE FA statistics sync.
No height or weight is planned. UAE FA access, fields and permissions have not
been settled.

**Questions for counsel:** Which legal regime applies to the actual entities,
location and activities, including any applicable free-zone rules? What
conditions apply to processing children's data and verifying parental
authority? Which documents, languages and approvals are required before roster
admission, invitations and first use? Earlier EU proposals do not answer these
questions for this pilot.

## 2. Data and access in the current source

The [data inventory](data-inventory.html) lists the 28 public tables implied by
the migrations, together with Auth, storage, email and monitoring data outside
those tables. It separates current source behaviour from planned features and
retained data.

| Category | What the source holds or does |
| --- | --- |
| Academy-supplied roster | Child name, DOB, age group, assigned coach, optional child email and guardian email/relationship. Trak loads the roster through an operator path; coaches cannot create new squad rows. Operator identity, source-file reference, invitation timestamps and counts are recorded. |
| Accounts | Name, role, football profile and account links. Existing profile fields include nationality, position, club and shirt number. DOB comes from the roster for admitted children. Auth stores account identities and sessions separately. |
| Children without email | An approved, linked guardian can create a username/password login. The Auth identity uses an internal address under `child.trakfootball.com`; it is not a child's mailbox. Application tables store the username, guardian/roster link and Auth target, not the password. Guardian reset is authorized in SQL and attempts to end existing child sessions. |
| Development records | Coach assessments and derived ratings; coach-recorded match facts; training dates, focus and attendance. Match fields still include legacy `body_condition` and `self_rating`, but the current routed coach flow sends null for them. |
| Written material | Private coach working notes are separate from the published message. The child can read their published message while required consent is active; parents cannot. Admin notes remain stored and governed by author-ID policies despite the parked console. Free text requires its own handling and retention rules. |
| Consent and corrections | Purposes, notice version, statement, declared relationship, verification method, ages, timestamps, withdrawal/supersession history and child/guardian identifiers. Email-correction audit keeps old/new email hashes, reason, operator and timestamp. |
| Measurement | User ID, role, event type, metadata and time. J7 counts assessments saved through the app and distinct person/assessment appearances on the relevant home screen each week. An “open” is not proof of reading or understanding. |

Access varies by category. Roster contact/DOB tables deny direct app access and
use scoped functions. Coach access follows roster ownership and organizational
membership; admin access is scoped. Ordinary family table reads and the
training-history function are consent-gated for under-18s, with an explicit
exception for retained player-logged matches. Account export has a separate
access path described in section 6. The family training function returns date, focus
and that child's attendance, excluding coach diary titles and notes. Avoid a
blanket claim that every role can read “the child's record.”

`wellness_logs` and `player_goals` are dropped by migration. Historical awards,
calendar events, AI records and avatar objects may remain; disabling a feature
does not delete its data. The source blocks the old AI handlers and new avatar
use. No current live-data inspection or deletion check is asserted here.

**Questions for counsel:** How should assessments, free text, legacy fields
and retained data be classified? Is an impact assessment required? What should
staff be prohibited from recording? Removing the wellness feature does not
settle these questions.

## 3. Admission and consent: current controls and an unresolved discrepancy

The source now uses roster-led admission. A guardian's confirmed email must
match the supplied roster relationship. Approval can be recorded before the
child has an account. A child without email follows the guardian-created login
path. Development writes require the relevant consent and ownership checks;
unknown age does not grant an exception. The old coach-created, unlinked-child
assessment bypass is not the current design.

**Product decision, 8 October:** the coach may view the academy-supplied
player profile before guardian approval. Assessments must remain blocked
until approval. The roster is treated as academy data in this flow; viewing
permission does not settle the legal basis or notice for its transfer to Trak.

Roster details are still processed **before in-app guardian approval**. The
academy supplies them to Trak, so counsel must establish the basis, notice,
authority and responsibilities for that initial transfer. Confirmed email and
a declared relationship are the technical evidence; they are not a legal
finding that the person holds parental responsibility.

There is a source discrepancy to resolve:

- The routed consent screen renders `CONSENT_PURPOSES` from `src/lib/consent.ts`.
  `coaching_records` is required; `recognition` and `parent_visibility` are
  optional and initially off. The notice version is `2026-09-12.1`.
- Database approval checks use active `coaching_records` consent. Setting
  `parent_visibility` to false does not independently block the linked
  parent's assessment/history reads. Recognition authoring is separately
  parked; its optional flag is not the control enforcing that closure.
- The approval call records the purposes, notice version and
  `CONSENT_STATEMENT`; it does not store the complete rendered page as a
  snapshot. Describing it as a verbatim record of every displayed notice would
  overstate the evidence.

The agreed pilot requirement covers coaching records and the specified family
views. The screen, enforcement and final notice must agree before relying on
that approval. This documentation update records the discrepancy; it does not
resolve it or change consent code.

**Proposed resolution (TRAK-145, PR #251, approved 9 October, not yet merged):**
remove the optional "I can see their progress" box, state parent viewing of
bands and history inside the required purpose, and move the notice version to
`2026-10-09.1`. Until that change is merged and seen on the deployed consent
screen, the discrepancy above stands.

Withdrawal blocks new covered development writes and hides covered records
through the ordinary family read policies while consent is required. It does
not erase the records or remove the coach's authorized history. Reapproval can
make them visible again. Retained player-logged matches have an explicit
exception to the ordinary family-read gate. The account-export function does
not apply the same consent predicate, so a blanket promise that withdrawal prevents all access
would be inaccurate. Consent evidence intentionally survives account or roster
deletion.

**Questions for counsel and product owners:** What is the approved scope of
approval and what, if anything, is separately optional? What verifies parental
authority? How should withdrawal, multiple guardians, reapproval and preserved
consent evidence be explained and handled? What retention period applies to
each kind of evidence?

## 4. Planned J8 data and later profile features

The confirmed J8 scope is TRAK-25 as updated on 8 October, split into 18
slices (TRAK-124–141); delivery status lives in Linear. Since 8 October the
per-academy switch (TRAK-124) turns events on for the synthetic rehearsal
academy only. The older family-read policies on published events do not yet
check consent; TRAK-125 replaces them with the consent-gated J8 rules before
any real family receives events.

| Planned flow | Data and agreed boundaries |
| --- | --- |
| Events and weekly series | Squad/academy, type, date/time, duration, meet time, venue and saved venues; match opponent, home/away and kit; status, optional cancellation reason, series ID and change sequence. Weekly repeats create dated event rows through an inclusive end date, in Dubai time. Saving keeps a draft only the coach sees; Publish sends it to families, and edits to a published event go live on save (decided 9 October). Cancelling retains the event; only a never-published draft can be deleted. |
| Fixture import | CSV only (decided 8 October). The file is read in the coach's browser, previewed and corrected before the coach confirms; repeat imports must not duplicate events. PDF import is out of the pilot: a league that publishes only a PDF is entered through the CSV template or by hand. AI parsing remains out. |
| Calendar feeds | A personal link per player/parent, with a hashed token, label, creation/revocation and last-fetch metadata. Token possession authorizes the feed without an app login. A parent feed covers children with active consent; a player feed covers their squad. Entries have stable IDs and change sequences, retain cancellations, and contain no child names or coach notes. |
| Shared family links | A guardian can create extra named links for relatives or a driver, selecting matches/all events and one/all children. Each is independently revocable and tied to the guardian's continuing access. The recipient need not have an account. |
| Changes and reminders | Per-user new/changed/cancelled seen state in the app; guardian email delivery for today/tomorrow changes, with a 60-second same-day target; two-day reminder emails grouped per guardian/day across their children. Notification preference, recipient, deduplication/retry and delivery records need lifecycle coverage. Reminder opt-out is in Settings; email links must not change state. |
| Parent absence reports | “Can't make it” records the event, child, reporting guardian, time and optional short reason, with undo until the event starts. Active consent and a guardian-child link are required. The coach sees their own squad; families cannot see another child's absence. Players do not respond in v1. |
| Completed attendance | Everyone is expected to attend unless reported absent. After the event, the coach reviews and saves the register through the consent-checked session/attendance path. Expected attendance is not evidence of attendance. Saving again must not duplicate the completed session. |
| Manual WhatsApp share | A button prepares squad/type/date/time/venue/meet-time/kit and cancellation details; the coach selects the recipient and sends in WhatsApp. No child names or absence list. No automatic posting or account integration. Copies then exist outside Trak. |

Calendar withdrawal, departure or revocation must stop disclosure on the next
feed request, including extra links tied to that access. This cannot promise
immediate removal of copies already cached by a phone or calendar provider.
A last-fetch timestamp records a request, not who read it. Counsel must see
the feed privacy design before any real family receives a link.

One-tap subscription is required at the end of parent/player setup and in
Settings, with an easy skip and link regeneration that revokes the old link.
It must be proved on iPhone, Android/Google and Outlook; Android's fallback
remains to be established if the proposed link fails. Direct Google/Microsoft
account connections are outside J8. Same-day emails supplement calendar
refreshes; do not promise instant calendar updates.

**Decided since 8 October:** event emails are sent through Resend from
`noreply@trakfootball.com`, with sending in Ireland (eu-west-1) (Kostas,
TRAK-126); fixture import is CSV only (Imad, TRAK-129); and same-day change
emails go to every affected guardian and to players who have their own email
(Imad, TRAK-135).

**Still open in the issues:** the feed endpoint location (TRAK-132) and the
verified mobile subscription behaviour and fallback (TRAK-133).

**For counsel and the academy:** review token/link disclosure, delegated family
access, device/provider caches, email/share recipients, optional absence and
cancellation free text, retention and rights handling across these flows.
Reflect the agreed design in the notice and contracts. Personal and extra
links, active-consent scope, revocation and no-child-name rules are already
product requirements; their implementation and real-phone proof remain pending.

After the pilot, a reminder goes only to the coach on the child's birthday,
using the roster DOB. Preferred foot and additional profile statistics are
also later work. A UAE FA sync is only a possibility and needs a defined source,
permission, matching process, correction process and data scope. Height and
weight are excluded. Lineups and broader matchday planning remain parked.

## 5. Suppliers, recovery and the academy discussion

| Service or process | Source-backed role | Still to establish |
| --- | --- | --- |
| Supabase | Database, Auth, storage and Edge Functions; roster invitations use Auth email APIs. The project is hosted in eu-central-1 (Frankfurt), per its settings on 9 October. | Confirmation of the Auth email delivery path, retention, backups, access and contractual terms. |
| Vercel | Web hosting and deployment. | Hosting/log regions, log retention and contractual terms. |
| Sentry | Production error monitoring when a DSN is configured; browser tracing uses 10% sampling. No session-replay integration is configured. | Actual project configuration, region, event contents, retention and access. |
| Event email sender | Resend, sending from `noreply@trakfootball.com` in Ireland (eu-west-1), wired on 8 October (TRAK-126) for planned change and grouped reminder emails. The account owner reports that Auth emails also go through Resend. | Contracts, delivery records, retention and any processing outside the sending region. |
| Calendar providers | Planned subscriptions through personal and extra guardian-created links. | Endpoint hosting, mobile behaviour, caching, removal, retention and provider responsibilities; counsel review of the privacy design before real-family links. |
| WhatsApp | Planned coach-initiated sharing of event text; no automatic posting. | Recipient/group handling, external copies, notice and retention responsibilities. |
| Operator handling | Roster source files, support, corrections, legal requests and recovery evidence may exist outside application tables. | Approved storage, access, transfer and deletion procedures for those files and records. |

The previous AI gateway is disabled in the current handlers; it must not be
listed as active pilot processing. Historical data and supplier-side retention
still need review. Supplier headquarters, hostname hints or old comments do not
establish processing location. Regions and transfer arrangements remain open.

**Operating record:** TRAK-23 records daily backups retained for seven days,
no point-in-time recovery (PITR), and an unrehearsed restore on 2 October 2026.
The current pilot decision also excludes a staging environment. These are
recorded arrangements, not dashboard verification or proof of recoverability.
The [restore document](release/s5-restore-rehearsal.md) must identify backup
coverage, recovery procedure, evidence and limitations; database backup alone
must not be described as restoring every service or external copy.

The academy has not been briefed on these arrangements. The forthcoming meeting
must cover scope, roles, consent, calendar exposure, suppliers, retention,
recovery limitations, support and incident handling. Record what is accepted
and what remains open after that meeting.

## 6. Retention, rights and documents to agree

`delete_my_account()` and `export_my_account()` exist. Their presence is not a
claim that every legal request is satisfied automatically:

- Account deletion removes many linked records, but coach-history retention
  and consent evidence have explicit exceptions. Withdrawal is a different
  operation. Backups, supplier logs, email and calendar copies need separate
  treatment.
- Export is scoped to the authenticated caller and their role. The source
  currently includes coach observations for a player through
  `export_scope_includes_observations()`. The parent's export covers their own
  links and consents, not a full export of the child's records.
- The export function executes with elevated database privileges. Its player
  branch reads the caller's matches, assessments and awards without the family
  consent predicate, including after withdrawal in the source logic. Whether
  that retained access is intended, and how it should be explained alongside
  withdrawal and rights requests, needs an engineering/counsel decision. This
  audit did not test the path against production.
- The latest export definition predates roster and child-login additions and
  omits those categories, shared coach messages and training attendance.
  Private coach notes are excluded from the child's application export. This
  is a software boundary, not a conclusion about what counsel may require in
  a reviewed access request.
- Invitation expiry and the stale-consent report do not constitute a complete
  retention or automatic deletion policy. Category-specific periods remain
  open, including consent evidence, telemetry, notes, unclaimed rosters,
  correction audit, backups and external files.

**Questions for counsel:** What access, correction, portability, erasure and
objection rights apply, who may exercise them for a child, and what records
must each response cover? Does the applicable regime distinguish supplied data
from observations? How should private notes and third-party information be
reviewed? What must be retained after withdrawal, departure or deletion?

Agree the contracting entity, controller/processor responsibilities,
academy agreement and data-processing terms; final parent notice and terms;
subprocessor/transfer arrangements; retention schedule; named rights and
incident contacts; and incident escalation/notification requirements. Any
entity, IP or liability questions still open belong in counsel's action list.
Do not treat PR #247 or the older EU papers as legal clearance. Makis decides
how his paper and the older legal documents are retained or updated.

## Source references

- [Roster admission](../supabase/migrations/20260925150000_roster_admission.sql), [roster-only squads](../supabase/migrations/20260926170000_roster_only_squad_admission.sql), [approval before account creation](../supabase/migrations/20260927090000_roster_consent_before_account.sql), [optional child email](../supabase/migrations/20260928120000_roster_child_without_email.sql), [child credentials](../supabase/migrations/20260930090127_guardian_child_logins.sql), [email corrections](../supabase/migrations/20261001120000_roster_email_correction.sql).
- [Consent UI definitions](../src/lib/consent.ts), [routed consent page](../src/pages/parent/ParentConsent.tsx), [approval client](../src/lib/parent-consent.ts), [coaching-purpose gate](../supabase/migrations/20260919120002_consent_requires_coaching_records_purpose.sql), [development-write gates](../supabase/migrations/20260926140000_consent_on_every_development_write.sql), [family-read gates](../supabase/migrations/20260927130000_family_reads_follow_consent.sql).
- [Private/shared notes](../supabase/migrations/20260918135500_private_notes_and_shared_feedback.sql), [parent message exclusion](../supabase/migrations/20260926120000_parents_do_not_read_coach_messages.sql), [family training history](../supabase/migrations/20260926150000_family_training_history.sql), [media/AI closure](../supabase/migrations/20260923110906_pilot_g7_disable_media_and_ai.sql), [legacy calendar/awards closure](../supabase/migrations/20260924000002_parked_feature_writes.sql).
- [Account export](../supabase/migrations/20260922091647_restrict_departed_coach_exports.sql), [account deletion](../supabase/migrations/20260901000008_drop_player_goals_and_fix_deletion.sql), [J7 measurement](../supabase/migrations/20260926130000_pilot_j7_measure.sql), [monitoring setup](../src/main.tsx), [roster email handler](../supabase/functions/send-roster-invites/handler.ts).
