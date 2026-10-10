import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderApp } from '../../../../tests/support/render-app'
import { signInAs } from '../../../../tests/support/session'
import { server } from '../../../../tests/msw/server'
import { table, rpc, SUPABASE_URL } from '../../../../tests/msw/supabase'

/**
 * TRAK-153 (J4). TRAK-149's database refuses a player saved with a different
 * score for a match already saved ("This match is already saved as 2-0 …").
 * The screen used to save the session and attendance first, so that refusal
 * left a second session with the wrong score that the coach can't delete.
 * Now the screen asks coach_match_score_clash() before writing anything.
 */

const COACH = { id: 'coach-1' }
const PLAYER = {
  id: 'squad-1', coach_user_id: COACH.id, player_name: 'Ade Okafor', linked_player_id: 'player-1',
  position: 'Attacker', age_group: 'U16', age: 15,
}
const toastText = () => [...document.querySelectorAll('[data-sonner-toast]')].map(t => t.textContent ?? '').join(' | ')

let writes: string[]
let clashArgs: Record<string, unknown>[]

function fixtures(clash: () => unknown) {
  writes = []
  clashArgs = []
  server.use(
    table('profiles', [{ id: 'p-coach', user_id: COACH.id, role: 'coach', full_name: 'Coach Vasilis', invite_code: 'ABCD' }]),
    table('squad_players', [PLAYER]),
    table('coach_sessions', []),
    http.post(`${SUPABASE_URL}/rest/v1/coach_sessions`, async ({ request }) => {
      const body = await request.json() as Record<string, unknown>
      writes.push('session')
      return HttpResponse.json({ id: 'session-1', ...body }, { status: 201 })
    }),
    http.post(`${SUPABASE_URL}/rest/v1/session_attendance`, () => { writes.push('attendance'); return HttpResponse.json([], { status: 201 }) }),
    rpc('coach_squad_player_consent_required', () => false),
    rpc('coach_match_score_clash', args => { clashArgs.push(args); return clash() }),
    rpc('log_match_for_player', () => { writes.push('match row'); return null }),
  )
}

async function saveOneZeroWin(opponent = 'Olympiakos U16') {
  const user = userEvent.setup()
  renderApp('/coach/sessions/quick')
  await user.type(await screen.findByPlaceholderText('Opponent name'), opponent)
  const [scoreUs, scoreThem] = screen.getAllByPlaceholderText('0')
  await user.type(scoreUs, '1')
  await user.type(scoreThem, '0')
  await user.click(await screen.findByRole('button', { name: 'Mark played' }))
  await user.type(screen.getByRole('spinbutton', { name: `Minutes played by ${PLAYER.player_name}` }), '70')
  await user.click(screen.getByRole('button', { name: `One fewer goals for ${PLAYER.player_name}` }))
  await user.click(screen.getByRole('button', { name: `One fewer assists for ${PLAYER.player_name}` }))
  await user.click(screen.getByRole('button', { name: 'Save match' }))
}

describe('J4: a match already saved with another score saves nothing', () => {
  beforeEach(() => signInAs(COACH))

  it('refuses before writing a session, attendance or a match row, and says the saved score', async () => {
    fixtures(() => [{ team_score: 2, opponent_score: 0 }])
    await saveOneZeroWin()
    await waitFor(() => expect(toastText()).toMatch(/already saved as 2-0/))
    expect(toastText()).toContain('vs Olympiakos U16 is already saved as 2-0')
    expect(toastText()).toMatch(/Nothing was saved/)
    expect(writes).toEqual([])
    // The coach keeps what they typed, to fix the score.
    expect(screen.getByPlaceholderText('Opponent name')).toHaveValue('Olympiakos U16')
  }, 20_000)

  it('asks with the match being saved: its date, the trimmed opponent and both scores', async () => {
    fixtures(() => [])
    await saveOneZeroWin('  Olympiakos U16 ')
    await waitFor(() => expect(writes).toContain('match row'))
    expect(clashArgs).toHaveLength(1)
    expect(clashArgs[0]).toMatchObject({ p_opponent: 'Olympiakos U16', p_team_score: 1, p_opponent_score: 0 })
    expect(clashArgs[0].p_match_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // No clash: the save goes ahead as before.
    expect(writes).toEqual(['session', 'attendance', 'match row'])
  }, 20_000)

  it('saves nothing when the question itself fails, and says to try again', async () => {
    fixtures(() => ({ status: 503, body: { message: 'upstream timeout' } }))
    await saveOneZeroWin()
    await waitFor(() => expect(toastText()).toMatch(/Couldn't check this match/))
    expect(toastText()).toMatch(/Nothing was saved/)
    expect(writes).toEqual([])
  }, 20_000)
})
