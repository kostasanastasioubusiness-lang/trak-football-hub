import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

/**
 * T4. A player whose name did not exactly match this row ("Mohammad" typed by
 * the coach, "Mohammed" by the player) joined onto a new, empty row, and their
 * history stayed here. The coach, who knows their players, merges it into the
 * signed-up player. coach_merge_squad_rows (#106) enforces ownership and moves
 * every referencing row; this card only asks, confirms, and reports.
 *
 * Render it only for an unclaimed row that holds history; the page decides.
 */
export function RosterMergeCard({ orphan, coachId, assessmentCount }: {
  orphan: { id: string; player_name: string }
  coachId: string
  assessmentCount: number
}) {
  const navigate = useNavigate()
  const [targets, setTargets] = useState<{ id: string; player_name: string }[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [into, setInto] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.from('squad_players').select('id, player_name')
      .eq('coach_user_id', coachId).not('linked_player_id', 'is', null).order('player_name')
      .then(({ data, error: readError }) => {
        if (cancelled) return
        if (readError) { setLoadFailed(true); return }
        setTargets((data ?? []) as { id: string; player_name: string }[])
      })
    return () => { cancelled = true }
  }, [coachId])

  const target = targets?.find(t => t.id === into)

  const merge = async () => {
    if (!target || merging) return
    setMerging(true)
    setError(null)
    const { error: mergeError } = await supabase.rpc('coach_merge_squad_rows' as never, { p_from: orphan.id, p_into: target.id } as never)
    setMerging(false)
    if (mergeError) {
      setConfirming(false)
      setError(mergeError.message || 'Could not merge. Nothing was changed.')
      return
    }
    toast.success(`${orphan.player_name}'s history is now on ${target.player_name}`)
    navigate(`/coach/player/${target.id}`, { replace: true })
  }

  return (
    <section className="rounded-[14px] p-4 space-y-3" style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div>
        <p className="text-[13px] font-medium text-white/85">Joined under a different name?</p>
        <p className="text-[12px] text-white/50 leading-relaxed mt-1">
          Nobody has claimed this row, but it holds {assessmentCount} assessment{assessmentCount === 1 ? '' : 's'}.
          If this player signed up with a different spelling, merge this history into their account.
        </p>
      </div>

      {loadFailed ? (
        <p role="alert" className="text-[12px] text-white/60">Couldn't load your signed-up players.</p>
      ) : targets && targets.length === 0 ? (
        <p className="text-[12px] text-white/45">No signed-up players to merge into yet.</p>
      ) : (
        <>
          <select
            aria-label="Signed-up player"
            value={into}
            disabled={!targets || merging}
            onChange={e => { setInto(e.target.value); setConfirming(false); setError(null) }}
            className="w-full px-3 py-2.5 rounded-[10px] bg-[#0d0d0f] border border-white/[0.07] text-sm text-white/88"
          >
            <option value="">Choose the player…</option>
            {(targets ?? []).map(t => <option key={t.id} value={t.id}>{t.player_name}</option>)}
          </select>

          {confirming && target ? (
            <div className="space-y-2">
              <p className="text-[12px] text-white/70 leading-relaxed">
                Move everything recorded for <strong>{orphan.player_name}</strong> to <strong>{target.player_name}</strong> and
                remove this row. This can't be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={merge} disabled={merging}
                  className="flex-1 py-2.5 rounded-[10px] bg-[#C8F25A] text-black text-sm font-semibold disabled:opacity-40">
                  {merging ? 'Merging…' : 'Confirm merge'}
                </button>
                <button onClick={() => setConfirming(false)} disabled={merging}
                  className="flex-1 py-2.5 rounded-[10px] border border-white/[0.1] text-white/60 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} disabled={!target}
              className="w-full py-2.5 rounded-[10px] border border-white/[0.12] text-white/80 text-sm font-medium disabled:opacity-40">
              {target ? `Merge into ${target.player_name}` : 'Merge into…'}
            </button>
          )}
        </>
      )}

      {error && <p role="alert" className="text-[12px] text-[#ff8a8a]">{error}</p>}
    </section>
  )
}
