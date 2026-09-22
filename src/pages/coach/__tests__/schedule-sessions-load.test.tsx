/**
 * Found on production, 22 Sep, logged in as a rehearsal coach: /coach/schedule
 * asked coach_sessions for `opponent`, a column that table has never had, and
 * PostgREST answered 400 / 42703. The screen ignored the error and said
 * "Nothing planned", so every coach's sessions (10 live rows, 3 coaches) had
 * been missing from their schedule since the 26 May merge that added it.
 *
 * An ordinary mock ignores `select`, so it would pass on the broken code. This
 * one refuses unknown columns the way PostgREST does, using the live column
 * list read from information_schema on 22 Sep.
 */
import { it, expect, describe } from 'vitest'
import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { renderApp } from '../../../../tests/support/render-app'
import { signInAs } from '../../../../tests/support/session'
import { server } from '../../../../tests/msw/server'
import { table, SUPABASE_URL } from '../../../../tests/msw/supabase'

const COACH = { id: 'schedule-coach-test' }
const LIVE_COACH_SESSIONS_COLUMNS = ['id', 'coach_user_id', 'session_type', 'title', 'session_date',
  'training_type', 'competition', 'venue', 'notes', 'created_at']
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

function setup({ sessionsFail = false } = {}) {
  signInAs(COACH)
  server.use(
    table('profiles', [{ id: 'p', user_id: COACH.id, role: 'coach', full_name: 'Synthetic Coach', nationality: 'AE', invite_code: 'ABCD' }]),
    table('coach_calendar_events', []),
    http.get(`${SUPABASE_URL}/rest/v1/coach_sessions`, ({ request }) => {
      if (sessionsFail) return HttpResponse.json({ code: '500', message: 'synthetic failure' }, { status: 500 })
      const requested = (new URL(request.url).searchParams.get('select') ?? '').split(',').map(c => c.trim())
      const unknown = requested.find(c => c !== '*' && !LIVE_COACH_SESSIONS_COLUMNS.includes(c))
      if (unknown) return HttpResponse.json({ code: '42703', details: null, hint: null, message: `column coach_sessions.${unknown} does not exist` }, { status: 400 })
      return HttpResponse.json([
        { id: 's1', title: 'Pressing drills', session_type: 'training', session_date: today(), competition: null, venue: 'Pitch 2', notes: null },
        { id: 's2', title: null, session_type: 'match', session_date: today(), competition: 'League', venue: null, notes: null },
      ])
    }),
  )
}

describe('CoachSchedule loads the coach\'s sessions', () => {
  it('shows today\'s sessions instead of "Nothing planned"', async () => {
    setup()
    renderApp('/coach/schedule')
    expect(await screen.findByText('Pressing drills')).toBeInTheDocument()
    expect(screen.queryByText(/nothing planned/i)).not.toBeInTheDocument()
  })

  // coach_sessions has no opponent, so an untitled match must not render "vs undefined".
  it('titles an untitled match session without inventing an opponent', async () => {
    setup()
    renderApp('/coach/schedule')
    const list = (await screen.findByText('Pressing drills')).closest('div.space-y-2') as HTMLElement
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument()
    // Scoped to the day's event list ("Match" is also a legend label). Each card
    // shows its title and its type label, so an untitled match reads "Match" twice.
    expect(within(list).getAllByText('Match')).toHaveLength(2)
  })

  it('reports a failed load instead of claiming the day is empty', async () => {
    setup({ sessionsFail: true })
    renderApp('/coach/schedule')
    expect(await screen.findByText(/couldn.t load your schedule/i)).toBeInTheDocument()
    expect(screen.queryByText(/nothing planned/i)).not.toBeInTheDocument()
  })
})
