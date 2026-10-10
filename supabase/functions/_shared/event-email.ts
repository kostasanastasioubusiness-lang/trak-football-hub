// TRAK-135 (J8.12): the wording of a cancellation or change email. Pure, so
// tests pin exactly what a family reads. Plain text for a phone: what
// changed, old → new, the squad, the date and the venue. No child names, no
// coach message or notes, and no link but the plain trakfootball.com page.
// Coach-typed text (title, venue, opponent) has its links replaced, because
// sendPlainEmail() refuses a whole email over one Google Maps link.
import { LINK, type PlainEmail } from './send-email.ts';

/** The event fields an email talks about (trak_private.event_email_fields). */
export interface EventFields {
  title: string | null;
  event_type: string | null;
  opponent: string | null;
  home_away: string | null;
  status: string | null;
  starts_at: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  meet_time: string | null;
  venue: string | null;
}
export interface EventRecipient { user_id: string; email: string }
/** One claimed notice, as claim_event_change_notices() returns it. */
export interface ClaimedNotice {
  notice_id: string;
  kind: 'cancelled' | 'changed';
  before: EventFields;
  event: EventFields;
  squad: string | null;
  academy: string | null;
  recipients: EventRecipient[];
}

export const LINK_PLACEHOLDER = '(link in the Trak app)';
export const TRAK_URL = 'https://trakfootball.com';
const SUBJECT_MAX = 150;

/** Coach-typed text, safe to send: links replaced, one line, trimmed. */
export function withoutLinks(text: string | null | undefined): string {
  return (text ?? '').replace(LINK, LINK_PLACEHOLDER).replace(/\s+/g, ' ').trim();
}

// Dubai is UTC+4 all year (no daylight saving), so an instant's Dubai date
// and time are a fixed shift. Only the oldest rows lack event_date/start_time.
const DUBAI_MS = 4 * 60 * 60 * 1000;
function dubaiParts(startsAt: string | null): { date: string | null; time: string | null } {
  const at = startsAt ? Date.parse(startsAt) : NaN;
  if (!Number.isFinite(at)) return { date: null, time: null };
  const iso = new Date(at + DUBAI_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}
const eventDate = (e: EventFields) => e.event_date ?? dubaiParts(e.starts_at).date;
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);
const startTime = (e: EventFields) => hhmm(e.start_time) ?? (e.event_date ? null : dubaiParts(e.starts_at).time);

function dayName(date: string | null, style: 'long' | 'short'): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'date to be confirmed';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: style, day: 'numeric', month: style, timeZone: 'UTC',
  });
}
/** "Wednesday 14 October" */
export const longDay = (date: string | null) => dayName(date, 'long');
/** "Wed 14 Oct" */
export const shortDay = (date: string | null) => dayName(date, 'short');

function timeRange(e: EventFields): string {
  const start = startTime(e);
  const end = hhmm(e.end_time);
  if (!start) return 'time to be confirmed';
  return end ? `${start}–${end}` : start;
}

/** What the event is called: the coach's title, or what kind of event it is. */
export function eventName(e: EventFields): string {
  const title = withoutLinks(e.title);
  if (title) return title;
  if (e.event_type === 'match') {
    const opponent = withoutLinks(e.opponent);
    return opponent ? `Match vs ${opponent}` : 'Match';
  }
  return e.event_type === 'training' ? 'Training' : 'Event';
}

export type EventChange = { what: 'cancelled' } | { what: 'changed'; lines: string[] };

/**
 * What families need to hear, from the event as they last saw it to now, or
 * null when nothing they'd notice changed (edits that cancelled out).
 */
export function eventChange(notice: Pick<ClaimedNotice, 'before' | 'event'>): EventChange | null {
  const { before, event } = notice;
  if (event.status === 'cancelled') return before.status === 'cancelled' ? null : { what: 'cancelled' };
  if (event.status !== 'scheduled' || before.status !== 'scheduled') return null;

  const lines: string[] = [];
  const was = { date: eventDate(before), time: timeRange(before) };
  const now = { date: eventDate(event), time: timeRange(event) };
  if (was.date !== now.date) lines.push(`Date: ${shortDay(was.date)} → ${shortDay(now.date)}`);
  if (was.time !== now.time) lines.push(`Time: ${was.time} → ${now.time}`);
  const meetWas = hhmm(before.meet_time);
  const meetNow = hhmm(event.meet_time);
  if (meetWas !== meetNow) lines.push(`Meet: ${meetWas ?? 'not set'} → ${meetNow ?? 'not set'}`);
  const venueWas = withoutLinks(before.venue);
  const venueNow = withoutLinks(event.venue);
  if (venueWas !== venueNow) lines.push(`Venue: ${venueWas || 'not set'} → ${venueNow || 'not set'}`);
  return lines.length ? { what: 'changed', lines } : null;
}

function squadLine(notice: Pick<ClaimedNotice, 'squad' | 'academy'>): string | null {
  const parts = [withoutLinks(notice.squad), withoutLinks(notice.academy)].filter(Boolean);
  return parts.length ? `Squad: ${parts.join(', ')}` : null;
}

function block(notice: ClaimedNotice, change: EventChange): string {
  const e = notice.event;
  const venue = withoutLinks(e.venue);
  const when = `${longDay(eventDate(e))}, ${timeRange(e)}`;
  const lines = change.what === 'cancelled'
    ? [`CANCELLED: ${eventName(e)}`, `Was: ${when}${venue ? ` at ${venue}` : ''}`]
    : [`CHANGED: ${eventName(e)}`, ...change.lines, `Now: ${when}${venue ? ` at ${venue}` : ''}`];
  const squad = squadLine(notice);
  return [...lines, ...(squad ? [squad] : [])].join('\n');
}

const oneLine = (text: string) => {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > SUBJECT_MAX ? `${line.slice(0, SUBJECT_MAX - 1).trimEnd()}…` : line;
};

/**
 * One email to one person, covering every notice they're owed in this send
 * (a series cancelled at once is one email, not six). Notices with nothing
 * to say are left out; null when none is left.
 */
export function composeEventEmail(to: string, notices: ClaimedNotice[]): PlainEmail | null {
  const items = notices
    .map(notice => ({ notice, change: eventChange(notice) }))
    .filter((item): item is { notice: ClaimedNotice; change: EventChange } => item.change !== null)
    .sort((a, b) => (eventDate(a.notice.event) ?? '').localeCompare(eventDate(b.notice.event) ?? ''));
  if (!items.length) return null;

  let subject: string;
  if (items.length === 1) {
    const { notice, change } = items[0];
    const label = change.what === 'cancelled' ? 'Cancelled' : 'Changed';
    subject = `${label}: ${eventName(notice.event)}, ${shortDay(eventDate(notice.event))}`;
  } else {
    subject = items.every(item => item.change.what === 'cancelled')
      ? `${items.length} events cancelled`
      : `${items.length} schedule changes`;
  }

  const text = [
    ...items.map(item => block(item.notice, item.change)),
    `See the full schedule in Trak: ${TRAK_URL}`,
    'You get this email because you or your child is in this squad on Trak.',
  ].join('\n\n');
  return { to, subject: oneLine(subject), text };
}
