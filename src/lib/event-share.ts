import { displayEventTime, localTodayISO } from './event-time'
import type { EventRow } from './coach-events'

/**
 * "Share to WhatsApp" (J8.16, TRAK-139): the event's details, pre-written for
 * the coach's parents' group.
 *
 * Trak sends nothing. The link opens WhatsApp with the text filled in; the
 * coach picks the chat and taps send. There is no integration, account or
 * approval behind it.
 *
 * The message is built only from the event's own fields. There is no field
 * for a child, so no name and no "who can't make it" list can reach a group
 * chat from here; absences stay in Trak (J8.14). The cancel reason is the
 * coach's own words, which they read in WhatsApp before sending.
 */
export interface ShareableEvent {
  kind: 'training' | 'match' | 'tournament' | 'other'
  /** The squad, e.g. "U15". */
  squadLabel: string
  /** YYYY-MM-DD, the day the coach chose (event_date). */
  date: string
  /** HH:MM wall clock, or null while the time is not known. */
  startTime: string | null
  meetTime: string | null
  opponent: string | null
  homeAway: 'home' | 'away' | null
  venue: string | null
  kit: string | null
  status: 'scheduled' | 'cancelled'
  cancelReason: string | null
}

export interface ShareOptions {
  /** Today as YYYY-MM-DD on the coach's device; defaults to localTodayISO(). */
  today?: string
}

const TRAK_LINE = 'Full schedule in Trak: https://trakfootball.com'
const KIND_LABEL: Record<ShareableEvent['kind'], string> = {
  training: 'Training',
  match: 'Match',
  tournament: 'Tournament',
  other: 'Event',
}
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Tue 13 Oct", from the calendar date itself, so no time zone can move the day. */
function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${WEEKDAYS[weekday]} ${d} ${MONTHS[m - 1]}`
}

const text = (value: string | null) => (value ?? '').trim()

export function whatsAppShareText(event: ShareableEvent, options: ShareOptions = {}): string {
  const today = options.today ?? localTodayISO()
  const cancelled = event.status === 'cancelled'

  let title = `${event.squadLabel} ${KIND_LABEL[event.kind]}`
  if (event.kind === 'match' && text(event.opponent)) title += ` vs ${text(event.opponent)}`
  if (cancelled) title += event.date === today ? ' cancelled today' : ' cancelled'
  else if (event.kind === 'match' && event.homeAway) title += ` (${event.homeAway})`

  const lines = [
    `*${title}*`,
    `${dayLabel(event.date)}, ${event.startTime ?? 'time to be confirmed'}`,
  ]
  if (cancelled && text(event.cancelReason)) lines.push(`Reason: ${text(event.cancelReason)}`)
  if (!cancelled) {
    if (text(event.venue)) lines.push(`Venue: ${text(event.venue)}`)
    if (text(event.meetTime)) lines.push(`Meet: ${text(event.meetTime)}`)
    if (text(event.kit)) lines.push(`Kit: ${text(event.kit)}`)
  }
  lines.push('', TRAK_LINE)
  return lines.join('\n')
}

/** WhatsApp's standard share link: no phone number, so WhatsApp asks which chat. */
export function whatsAppShareUrl(event: ShareableEvent, options: ShareOptions = {}): string {
  return `https://wa.me/?text=${encodeURIComponent(whatsAppShareText(event, options))}`
}

/** A saved event on the coach's schedule (J8.4's row) as a shareable message. */
export function shareableFromRow(row: EventRow, squadLabel: string): ShareableEvent {
  const shown = displayEventTime(row)
  const kind = (['training', 'match', 'tournament', 'other'] as const).find(k => k === row.event_type) ?? 'other'
  return {
    kind,
    squadLabel,
    date: shown.date,
    startTime: shown.time,
    meetTime: row.meet_time ? row.meet_time.slice(0, 5) : null,
    opponent: row.opponent ?? null,
    homeAway: row.home_away === 'home' || row.home_away === 'away' ? row.home_away : null,
    venue: row.venue ?? null,
    kit: row.kit ?? null,
    status: row.status === 'cancelled' ? 'cancelled' : 'scheduled',
    cancelReason: row.cancel_reason ?? null,
  }
}

/** The coach's squad for the message title: the age group most of the squad is in. */
export function squadLabelFrom(ageGroups: (string | null)[]): string {
  const counts = new Map<string, number>()
  for (const g of ageGroups) {
    const label = (g ?? '').trim()
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  let best = 'Squad'
  let top = 0
  for (const [label, n] of counts) if (n > top) { best = label; top = n }
  return best
}
