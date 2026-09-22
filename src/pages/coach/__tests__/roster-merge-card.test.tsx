/**
 * T4 UI: a coach repairs a roster row whose player joined under a different
 * name (coach_merge_squad_rows, #106). Shown on the unclaimed row's page only
 * when it holds history, two-step confirm, then opens the merged player.
 */
import { it, expect, describe } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderApp } from '../../../../tests/support/render-app'
import { signInAs } from '../../../../tests/support/session'
import { server } from '../../../../tests/msw/server'
import { table, SUPABASE_URL } from '../../../../tests/msw/supabase'

const COACH = { id: 'merge-coach-test' }
const ORPHAN = { id: 'orphan-row', coach_user_id: COACH.id, player_name: 'Mohammad Hassan', linked_player_id: null, position: 'Midfielder', status: 'active' }
const JOINED = { id: 'joined-row', coach_user_id: COACH.id, player_name: 'Mohammed Hassan', linked_player_id: 'player-mo', position: 'Midfielder', status: 'active' }
const ASSESSMENT = { id: 'a1', squad_player_id: ORPHAN.id, coach_user_id: COACH.id, work_rate: 7, tactical: 7, attitude: 7, technical: 7, physical: 7, coachability: 7, created_at: '2026-09-10T10:00:00Z' }

function setup({ orphanHasHistory = true, rpc = () => HttpResponse.json({ merged_into: JOINED.id, moved: { coach_assessments: 1 } }) } = {}) {
  signInAs(COACH)
  const calls: unknown[] = []
  server.use(
    table('profiles', [{ id: 'p', user_id: COACH.id, role: 'coach', full_name: 'Coach', nationality: 'AE', invite_code: 'ABCD' }]),
    http.get(`${SUPABASE_URL}/rest/v1/squad_players`, ({ request }) => {
      const q = new URL(request.url).searchParams
      const id = q.get('id')
      const one = request.headers.get('Accept')?.includes('vnd.pgrst.object')
      const rows = id ? [ORPHAN, JOINED].filter(r => `eq.${r.id}` === id)
        : q.get('linked_player_id') === 'not.is.null' ? [JOINED] : [ORPHAN, JOINED]
      return HttpResponse.json(one ? rows[0] ?? null : rows)
    }),
    http.get(`${SUPABASE_URL}/rest/v1/coach_assessments`, ({ request }) => {
      const sp = new URL(request.url).searchParams.get('squad_player_id')
      return HttpResponse.json(sp === `eq.${ORPHAN.id}` && orphanHasHistory ? [ASSESSMENT] : [])
    }),
    table('coach_assessment_notes', []),
    http.post(`${SUPABASE_URL}/rest/v1/rpc/coach_merge_squad_rows`, async ({ request }) => { calls.push(await request.json()); return rpc() }),
  )
  return calls
}

describe('RosterMergeCard on the coach player page', () => {
  it('offers the merge on an unclaimed row that holds history', async () => {
    setup()
    renderApp(`/coach/player/${ORPHAN.id}`)
    expect(await screen.findByText(/joined under a different name/i)).toBeInTheDocument()
  })

  it('does not offer it on a signed-up player (control)', async () => {
    setup()
    renderApp(`/coach/player/${JOINED.id}`)
    await screen.findByText('Mohammed Hassan')
    expect(screen.queryByText(/joined under a different name/i)).not.toBeInTheDocument()
  })

  it('does not offer it when the unclaimed row has nothing to move', async () => {
    setup({ orphanHasHistory: false })
    renderApp(`/coach/player/${ORPHAN.id}`)
    await screen.findByText('Mohammad Hassan')
    expect(screen.queryByText(/joined under a different name/i)).not.toBeInTheDocument()
  })

  it('merges only after an explicit confirm, then opens the merged player', async () => {
    const calls = setup()
    renderApp(`/coach/player/${ORPHAN.id}`)
    const user = userEvent.setup()
    await screen.findByRole('option', { name: 'Mohammed Hassan' }) // targets load after the card renders
    await user.selectOptions(screen.getByRole('combobox', { name: /signed-up player/i }), JOINED.id)
    await user.click(screen.getByRole('button', { name: /merge into mohammed hassan/i }))
    expect(calls).toHaveLength(0) // first press only asks for confirmation
    expect(screen.getByText(/can.t be undone/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirm merge/i }))
    await waitFor(() => expect(calls).toEqual([{ p_from: ORPHAN.id, p_into: JOINED.id }]))
    await waitFor(() => expect(window.location.pathname).toBe(`/coach/player/${JOINED.id}`))
  })

  it('shows the server\'s refusal and stays put', async () => {
    const calls = setup({ rpc: () => HttpResponse.json({ code: '42501', message: 'Both players must be on your current roster' }, { status: 403 }) })
    renderApp(`/coach/player/${ORPHAN.id}`)
    const user = userEvent.setup()
    await screen.findByRole('option', { name: 'Mohammed Hassan' }) // targets load after the card renders
    await user.selectOptions(screen.getByRole('combobox', { name: /signed-up player/i }), JOINED.id)
    await user.click(screen.getByRole('button', { name: /merge into/i }))
    await user.click(screen.getByRole('button', { name: /confirm merge/i }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(await screen.findByText(/both players must be on your current roster/i)).toBeInTheDocument()
    expect(window.location.pathname).toBe(`/coach/player/${ORPHAN.id}`)
  })
})
