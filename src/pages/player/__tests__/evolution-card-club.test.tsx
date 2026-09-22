/**
 * The Evolution Card is the image a child shares. With no free-text club on
 * player_details it printed "Unaffiliated" under the name of a player who is
 * on an academy roster: found on production, 22 Sep, for a seeded U15. Signup
 * requires a club, so today this reaches accounts created another way (the
 * rehearsal seed, and potentially academy-led admission). PlayerPassport
 * already falls back to "Academy"; the two cards now agree.
 */
import { it, expect, describe } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderApp } from '../../../../tests/support/render-app'
import { signInAs } from '../../../../tests/support/session'
import { server } from '../../../../tests/msw/server'
import { table } from '../../../../tests/msw/supabase'

const PLAYER = { id: 'evolution-player-test' }

function setup(currentClub: string | null) {
  signInAs(PLAYER)
  server.use(
    table('profiles', [{ id: 'p', user_id: PLAYER.id, role: 'player', full_name: 'Synthetic Player', nationality: 'AE' }]),
    table('player_details', [{ user_id: PLAYER.id, position: 'Defender', current_club: currentClub, age_group: 'U15' }]),
    table('squad_players', [{ id: 'sq-1', linked_player_id: PLAYER.id, coach_user_id: 'coach-1' }]),
    table('coach_assessments', []),
    table('recognition_awards', []),
    table('matches', []),
  )
}

describe('Evolution Card club line', () => {
  it('never tells a rostered player they are unaffiliated when no club text is stored', async () => {
    setup(null)
    renderApp('/player/evolution')
    await screen.findByText('Synthetic Player')
    await waitFor(() => expect(screen.getByText('Academy')).toBeInTheDocument())
    expect(screen.queryByText(/unaffiliated/i)).not.toBeInTheDocument()
  })

  it('shows the stored club when there is one (control)', async () => {
    setup('Synthetic Academy FC')
    renderApp('/player/evolution')
    expect(await screen.findByText('Synthetic Academy FC')).toBeInTheDocument()
  })
})
