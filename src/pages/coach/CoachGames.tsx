import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCoachSquad } from '@/lib/coach-squad'
import { type GameState, type PlanProgress, gameState, gameStatus, orderGames } from '@/lib/games/loop'
import { gameTitle, gameWhen, useGameEvaluations, useGamePlanChanges, useGamePlans, useGameShares, useGames, type Game } from '@/components/coach/games/useGames'
import { matchResult } from '@/lib/games/results'
import { LoadError, WIDE_COLUMN } from '@/components/trak'
import { PitchIcon } from '@/components/icons/PitchIcon'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { Countdown } from '@/components/arc/countdown/countdown'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { ScrollArea } from '@/components/arc/scroll-area/scroll-area'
import { MatchAction } from '@/components/coach/games/MatchAction'
import { MorphBlock, SkeletonMorph } from '@/components/arc/skeleton-morph/skeleton-morph'
import { i18n, useTranslation } from '@/lib/i18n'
import { COMPETITION_WORD, MATCH_WORD } from '@/lib/games/match-words'
import { shown } from '@/lib/squad/trait-words'
import { PageTop } from '@/components/coach/PageTop'

/* TRAK-283 (Games 1/8): Games home. The next game with where it is in its loop and its one next action, the open
   drafts, and every match of the squad in view. Cards follow Home's Needs you pattern (Imad, 27 Oct). TRAK-320 (Imad,
   30 Oct): a published match moves to Previous matches, newest first, with its result, and opens on its evaluation.
   Makis, 24 Nov (#769): one full-width column, with no Open drafts or Top scorers panel. A draft still shows on its
   match's card. */

/** Schedule's quick hand-over (TRAK-182 part 8): New event, on its first step, with Match picked. */
const ADD_MATCH = { quickEvent: { kind: 'match' } }
/** A placeholder that fills its column, as the card it grows into does. */
const FILL = { width: '100%' }
const details = (game: Game, time: string | null) => [
  time ? i18n.t('coachSquad:kickOffAt', { time }) : '',
  game.home_away === 'home' ? i18n.t('coachSchedule:home') : game.home_away === 'away' ? i18n.t('coachSchedule:away') : '',
  game.venue ?? '',
].filter(Boolean).join(' · ')

export default function CoachGames() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const coachSquad = useCoachSquad(user?.id)
  const navigate = useNavigate()
  const games = useGames()
  const plans = useGamePlans()
  const shares = useGameShares()
  const evaluations = useGameEvaluations()
  // TRAK-305: All or one squad, as picked at the top of the frame.
  const { everySquad } = coachSquad
  // The countdown's end moves the next game on, so the clock is read again then.
  const [now, setNow] = useState(() => Date.now())
  const inView = (games.data ?? []).filter(game => everySquad || coachSquad.eventInSquad(game.squad))
  const { next, games: ordered } = orderGames(inView, now)
  // TRAK-286: edits since sharing, for shared matches still to kick off. A failed read shows them as shared.
  const changes = useGamePlanChanges(ordered.filter(game => shares.data?.has(game.id) && now < Date.parse(game.starts_at)).map(game => game.id))
  const progress = (game: Game): PlanProgress => ({ drafted: plans.data?.has(game.id), shared: shares.data?.has(game.id), sharedAt: shares.data?.get(game.id),
    changes: changes.data?.get(game.id)?.length, evaluated: evaluations.data?.has(game.id), published: !!evaluations.data?.get(game.id)?.publishedAt })
  const stateOf = (game: Game) => gameStatus(game, now, progress(game))

  const published = (game: Game) => !!evaluations.data?.get(game.id)?.publishedAt
  const previous = ordered.filter(published)
  const loading = games.isPending || plans.isPending || shares.isPending || evaluations.isPending

  return (
    <div className="min-h-screen bg-ground pb-24">
      <div className={WIDE_COLUMN}>
        {/* TRAK-376 (Imad, 5 Nov): on a phone the avatar opens the side menu, where the squad picker is. TRAK-422: PageTop. */}
        <PageTop title={t('nav:matches')} />

        {games.error || plans.error || shares.error || evaluations.error
            ? <LoadError what={t('coachMatches:matchesWhat')} onRetry={() => { void games.refetch(); void plans.refetch(); void shares.refetch(); void evaluations.refetch() }}
                retrying={games.isFetching || plans.isFetching || shares.isFetching || evaluations.isFetching} />
          : !loading && ordered.length === 0 ? (
            <div className="arc pt-6">
              <EmptyState icon={<PitchIcon size={24} strokeWidth={1.5} />} title={t('coachMatches:noMatchesYet')}
                description={t('coachMatches:noMatchesBody')}
                action={<Button onClick={() => navigate('/coach/schedule', { state: ADD_MATCH })}>{t('coachMatches:addMatch')}</Button>} />
            </div>
          ) : <SkeletonMorph loading={loading} stagger={0} loadingLabel={t('coachSquad:fmMatchesLoading')}>
            {/* TRAK-461: while the matches load, each part of the page is a placeholder of its shape that grows into it. */}
            <MorphBlock height={196} radius={16} className="grid min-w-0" style={FILL}>{!loading && (next ? <NextGame game={next} state={stateOf(next)} step={gameState(next, now, progress(next))} onKickOff={() => setNow(Date.now())} /> : (
              <section aria-labelledby="next-game" className="h-full rounded-2xl border border-line bg-surface p-5 laptop:p-6">
                <h2 id="next-game" className="text-lg font-medium text-ink">{t('coachMatches:nextMatch')}</h2>
                <p className="mt-2 text-sm text-ink-2">{t('coachMatches:noMatchComing')}</p>
                <Link to="/coach/schedule" state={ADD_MATCH}
                  className="mt-3 inline-block rounded text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t('coachMatches:addMatch')}</Link>
              </section>
            ))}</MorphBlock>

            <div className="mt-6 grid gap-6">
            <div className="min-w-0">
              <MorphBlock lines={1} lineHeight={28} width={140} className="mb-2"><h2 className="text-lg font-medium text-ink">{t('coachMatches:yourMatches')}</h2></MorphBlock>
              <MorphBlock height={112} radius={16} style={FILL}>{!loading &&
              <div className="arc -mx-1">
                <ScrollArea orientation="horizontal" snap="x mandatory" fade={24} label={t('coachMatches:yourMatches')}>
                  <ul className="flex gap-3 px-1 pb-1">
                    {ordered.filter(game => !published(game)).map(game => {
                      const state = stateOf(game)
                      const { day, time } = gameWhen(game)
                      return <li key={game.id} className="w-[220px] flex-none" style={{ scrollSnapAlign: 'start' }}>
                        <Link to={`/coach/matches/${game.id}`}
                          className="flex h-full flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3.5 transition-transform active:scale-[.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <span className="grid min-w-0">
                            <span className="truncate text-base font-medium text-ink">{gameTitle(game)}</span>
                            <span className="truncate text-sm text-ink-3">{[day, time, everySquad ? game.squad : null].filter(Boolean).join(' · ')}</span>
                          </span>
                          <span className="arc mt-auto"><Badge tone={state.tone} size="sm">{shown(MATCH_WORD, state.label)}</Badge></span>
                        </Link>
                      </li>
                    })}
                  </ul>
                </ScrollArea>
              </div>}</MorphBlock>
            </div>
            {previous.length > 0 && <PreviousMatches games={previous} results={evaluations.data!} squads={everySquad} />}
            </div>
          </SkeletonMorph>}
      </div>
    </div>
  )
}

/** The next match: its next action as a split button (TRAK-333) and the countdown to kick-off. A static panel, not a
 *  link. TRAK-333 (Imad, 2 Nov): no loop stepper; it served no purpose here. */
function NextGame({ game, state, step, onKickOff }: {
  game: Game; state: ReturnType<typeof gameStatus>; step: GameState; onKickOff: () => void
}) {
  const { t } = useTranslation()
  const { day, time, academy } = gameWhen(game)
  return (
    <section aria-labelledby="next-game" className="arc flex h-full min-w-0 flex-col gap-4 rounded-2xl border border-line bg-surface p-5 laptop:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="next-game" className="text-lg font-medium text-ink">{t('coachMatches:nextMatch')}</h2>
        <Badge tone={state.tone}>{shown(MATCH_WORD, state.label)}</Badge>
      </div>
      <div className="grid min-w-0 gap-2">
        <p className="text-[22px] font-medium tracking-[-0.01em] text-ink break-words">{gameTitle(game)}</p>
        <p className="text-sm text-ink-2">{[day, details(game, time)].filter(Boolean).join(' · ')}</p>
        {academy && <p className="text-sm text-ink-3">{academy}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <MatchAction state={step} eventId={game.id} />
        <Countdown variant="compact" units={['days', 'hours', 'minutes']} target={game.starts_at}
          label={t('coachMatches:kickOffIn')} completeLabel={t('coachMatches:locked')} onComplete={onKickOff} className="ml-auto" />
      </div>
    </section>
  )
}

/** TRAK-320: matches whose evaluation is published, newest first: the result at a glance, and the evaluation a tap away. */
function PreviousMatches({ games, results, squads }: {
  games: Game[]; results: Map<string, { ourScore: number | null; theirScore: number | null }>; squads: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="min-w-0">
      <h2 className="mb-2 text-lg font-medium text-ink">{t('coachMatches:previousMatches')}</h2>
      <div className="arc -mx-1">
        <ScrollArea orientation="horizontal" snap="x mandatory" fade={24} label={t('coachMatches:previousMatches')}>
          <ul className="flex gap-3 px-1 pb-1">
            {games.map(game => {
              const { ourScore: our, theirScore: their } = results.get(game.id)!
              // TRAK-362: said the same way as on Home's Season plan card.
              const result = matchResult(our, their)
              const competition = game.competition && game.competition in COMPETITION_WORD ? t(COMPETITION_WORD[game.competition as keyof typeof COMPETITION_WORD]) : undefined
              return <li key={game.id} className="w-[200px] flex-none" style={{ scrollSnapAlign: 'start' }}>
                <Link to={`/coach/matches/${game.id}?tab=evaluation`}
                  className="flex h-full flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3.5 transition-transform active:scale-[.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="grid min-w-0">
                    <span className="truncate text-base font-medium text-ink">{gameTitle(game)}</span>
                    <span className="truncate text-sm text-ink-3">{[gameWhen(game).day, competition, squads ? game.squad : null].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="arc mt-auto"><Badge tone={result.tone} size="sm">{result.label}</Badge></span>
                </Link>
              </li>
            })}
          </ul>
        </ScrollArea>
      </div>
    </div>
  )
}
