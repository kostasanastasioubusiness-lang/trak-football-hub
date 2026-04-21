import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

const COACH_ID  = '11111111-1111-1111-1111-111111111111'
const PLAYER_ID = '22222222-2222-2222-2222-222222222222'
const PARENT_ID = '33333333-3333-3333-3333-333333333333'
const SQUAD_ID  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

const ACCOUNTS = [
  { email: 'coach@trak.dev',  password: 'TrakDev123', role: 'coach',  name: 'Alex Martinez' },
  { email: 'player@trak.dev', password: 'TrakDev123', role: 'player', name: 'Jamie Wilson'  },
  { email: 'parent@trak.dev', password: 'TrakDev123', role: 'parent', name: 'Sarah Wilson'  },
]

type Step = { label: string; status: 'pending' | 'running' | 'done' | 'error'; detail?: string }

export default function DevSetupPage() {
  const navigate = useNavigate()
  const [steps, setSteps] = useState<Step[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const update = (label: string, status: Step['status'], detail?: string) =>
    setSteps(prev => {
      const existing = prev.find(s => s.label === label)
      if (existing) return prev.map(s => s.label === label ? { ...s, status, detail } : s)
      return [...prev, { label, status, detail }]
    })

  const trySignUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error && /already registered|already exists/i.test(error.message)) {
      // Already exists — try sign in to get the user
      const { data: si } = await supabase.auth.signInWithPassword({ email, password })
      return si?.user ?? null
    }
    return data?.user ?? null
  }

  const run = async () => {
    setRunning(true)
    setSteps([])

    try {
      // ── 1. Create accounts ──────────────────────────────────────────
      const userIds: Record<string, string> = {}

      for (const acc of ACCOUNTS) {
        update(`Create ${acc.role} account`, 'running')
        const user = await trySignUp(acc.email, acc.password)
        if (!user) {
          update(`Create ${acc.role} account`, 'error', 'Sign-up failed — check if email confirmation is disabled in Supabase Auth settings')
          setRunning(false)
          return
        }
        userIds[acc.role] = user.id
        update(`Create ${acc.role} account`, 'done', user.email ?? acc.email)
      }

      const coachId  = userIds['coach']
      const playerId = userIds['player']
      const parentId = userIds['parent']

      // ── 2. Sign in as coach to seed coach data ───────────────────────
      update('Sign in as coach', 'running')
      await supabase.auth.signInWithPassword({ email: 'coach@trak.dev', password: 'TrakDev123' })
      update('Sign in as coach', 'done')

      update('Coach profile + details', 'running')
      await supabase.from('profiles').upsert({ user_id: coachId, role: 'coach' as any, full_name: 'Alex Martinez', invite_code: 'DEMO' }, { onConflict: 'user_id' })
      await supabase.from('coach_details').upsert({ user_id: coachId, current_club: 'City FC Academy', team: 'U15s', coach_role: 'Head Coach' }, { onConflict: 'user_id' })
      update('Coach profile + details', 'done')

      // ── 3. Sign in as player to seed player data ─────────────────────
      update('Sign in as player', 'running')
      await supabase.auth.signInWithPassword({ email: 'player@trak.dev', password: 'TrakDev123' })
      update('Sign in as player', 'done')

      update('Player profile + details', 'running')
      await supabase.from('profiles').upsert({ user_id: playerId, role: 'player' as any, full_name: 'Jamie Wilson' }, { onConflict: 'user_id' })
      await supabase.from('player_details').upsert({ user_id: playerId, date_of_birth: '2010-05-15', position: 'CM', current_club: 'City FC Academy', age_group: 'U15', shirt_number: 8 }, { onConflict: 'user_id' })
      update('Player profile + details', 'done')

      update('Seed 10 matches', 'running')
      const now = Date.now()
      const matches = [
        { team_score: 3, opponent_score: 1, opponent: 'Riverside United', competition: 'League',  venue: 'Home', minutes_played: 90, goals: 1, assists: 1, self_rating: 8, body_condition: 'good',      card_received: 'None',   created_at: new Date(now - 1   * 86400000).toISOString() },
        { team_score: 1, opponent_score: 2, opponent: 'North Academy',    competition: 'League',  venue: 'Away', minutes_played: 90, goals: 0, assists: 0, self_rating: 5, body_condition: 'average',   card_received: 'Yellow', created_at: new Date(now - 8   * 86400000).toISOString() },
        { team_score: 2, opponent_score: 2, opponent: 'East City FC',     competition: 'Cup',     venue: 'Home', minutes_played: 90, goals: 1, assists: 0, self_rating: 7, body_condition: 'good',      card_received: 'None',   created_at: new Date(now - 15  * 86400000).toISOString() },
        { team_score: 4, opponent_score: 0, opponent: 'Valley Rangers',   competition: 'League',  venue: 'Home', minutes_played: 90, goals: 2, assists: 1, self_rating: 9, body_condition: 'excellent', card_received: 'None',   created_at: new Date(now - 22  * 86400000).toISOString() },
        { team_score: 0, opponent_score: 3, opponent: 'Metro Boys',       competition: 'League',  venue: 'Away', minutes_played: 75, goals: 0, assists: 0, self_rating: 4, body_condition: 'tired',     card_received: 'None',   created_at: new Date(now - 29  * 86400000).toISOString() },
        { team_score: 2, opponent_score: 1, opponent: 'Hillside FC',      competition: 'League',  venue: 'Home', minutes_played: 90, goals: 0, assists: 2, self_rating: 7, body_condition: 'good',      card_received: 'None',   created_at: new Date(now - 36  * 86400000).toISOString() },
        { team_score: 1, opponent_score: 1, opponent: 'South Stars',      competition: 'Cup',     venue: 'Away', minutes_played: 90, goals: 1, assists: 0, self_rating: 6, body_condition: 'average',   card_received: 'None',   created_at: new Date(now - 43  * 86400000).toISOString() },
        { team_score: 3, opponent_score: 2, opponent: 'Park City',        competition: 'League',  venue: 'Home', minutes_played: 90, goals: 0, assists: 1, self_rating: 8, body_condition: 'good',      card_received: 'None',   created_at: new Date(now - 50  * 86400000).toISOString() },
        { team_score: 2, opponent_score: 0, opponent: 'West United',      competition: 'League',  venue: 'Away', minutes_played: 85, goals: 1, assists: 0, self_rating: 7, body_condition: 'good',      card_received: 'None',   created_at: new Date(now - 57  * 86400000).toISOString() },
        { team_score: 1, opponent_score: 4, opponent: 'Crestwood FC',     competition: 'League',  venue: 'Away', minutes_played: 90, goals: 0, assists: 0, self_rating: 5, body_condition: 'tired',     card_received: 'None',   created_at: new Date(now - 64  * 86400000).toISOString() },
      ].map(m => ({ ...m, self_rating: String(m.self_rating), user_id: playerId, position: 'CM', age_group: 'U15' }))
      await supabase.from('matches').insert(matches)
      update('Seed 10 matches', 'done')

      update('Player goals', 'running')
      await supabase.from('player_goals').insert([
        { user_id: playerId, goal_type: 'goals_scored',   target_value: 5,   category: 'performance', current_value: 4,   completed: false },
        { user_id: playerId, goal_type: 'matches_logged', target_value: 10,  category: 'consistency', current_value: 10,  completed: false },
        { user_id: playerId, goal_type: 'minutes_played', target_value: 500, category: 'consistency', current_value: 425, completed: false },
      ])
      update('Player goals', 'done')

      // ── 4. Sign back in as coach to create squad + assessments ───────
      update('Sign in as coach (squad + assessments)', 'running')
      await supabase.auth.signInWithPassword({ email: 'coach@trak.dev', password: 'TrakDev123' })
      update('Sign in as coach (squad + assessments)', 'done')

      update('Squad player link', 'running')
      await supabase.from('squad_players').upsert({ id: SQUAD_ID, coach_user_id: coachId, player_name: 'Jamie Wilson', position: 'CM', shirt_number: 8, linked_player_id: playerId }, { onConflict: 'id' })
      update('Squad player link', 'done')

      update('3 coach assessments', 'running')
      await supabase.from('coach_assessments').insert([
        { coach_user_id: coachId, squad_player_id: SQUAD_ID, appearance: 'started', work_rate: 8, tactical: 7, attitude: 9, technical: 7, physical: 8, coachability: 8, private_note: 'Great attitude this week — pressed well in the first half.', flag: 'fair',     created_at: new Date(now - 1  * 86400000).toISOString() },
        { coach_user_id: coachId, squad_player_id: SQUAD_ID, appearance: 'started', work_rate: 6, tactical: 6, attitude: 7, technical: 6, physical: 7, coachability: 7, private_note: 'Struggled away but kept working. Needs to improve positioning.', flag: 'generous', created_at: new Date(now - 8  * 86400000).toISOString() },
        { coach_user_id: coachId, squad_player_id: SQUAD_ID, appearance: 'started', work_rate: 9, tactical: 8, attitude: 9, technical: 8, physical: 9, coachability: 9, private_note: 'Outstanding — best of the season. Real leadership on show.',   flag: 'fair',     created_at: new Date(now - 22 * 86400000).toISOString() },
      ])
      update('3 coach assessments', 'done')

      update('Player of the Week award', 'running')
      await supabase.from('recognition_awards').insert({
        coach_user_id: coachId, squad_player_id: SQUAD_ID,
        award_type: 'player_of_week', awarded_for: 'Week of 14 Apr',
        note: 'Best performance vs Valley Rangers — 2 goals, 1 assist.',
        created_at: new Date(now - 6 * 86400000).toISOString(),
      })
      update('Player of the Week award', 'done')

      // ── 5. Sign in as parent to seed parent data ─────────────────────
      update('Sign in as parent', 'running')
      await supabase.auth.signInWithPassword({ email: 'parent@trak.dev', password: 'TrakDev123' })
      update('Sign in as parent', 'done')

      update('Parent profile + links', 'running')
      await supabase.from('profiles').upsert({ user_id: parentId, role: 'parent' as any, full_name: 'Sarah Wilson' }, { onConflict: 'user_id' })
      await supabase.from('player_parent_links').upsert({ player_user_id: playerId, parent_user_id: parentId }, { onConflict: 'player_user_id,parent_user_id' }).then(() => {})
      await supabase.from('parent_invites').upsert({ player_user_id: playerId, parent_email: 'parent@trak.dev' }).then(() => {})
      update('Parent profile + links', 'done')

      // ── 6. Sign out ─────────────────────────────────────────────────
      await supabase.auth.signOut()
      setDone(true)

    } catch (err: any) {
      update('Unexpected error', 'error', err?.message ?? String(err))
    }

    setRunning(false)
  }

  const iconFor = (s: Step['status']) =>
    s === 'done' ? '✅' : s === 'error' ? '❌' : s === 'running' ? '⏳' : '○'

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-start px-5 py-10 max-w-md mx-auto">
      <div className="w-full mb-8">
        <p className="text-[9px] font-medium tracking-[0.12em] text-white/30 uppercase mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Dev only</p>
        <h1 className="text-[26px] font-light text-white/90 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
          Seed test accounts
        </h1>
        <p className="text-[12px] text-white/40 mt-1">
          Creates coach / player / parent accounts with realistic sample data. Safe to run multiple times.
        </p>
      </div>

      <div className="w-full rounded-[14px] p-4 mb-5 space-y-1"
        style={{ background: 'rgba(200,242,90,0.05)', border: '1px solid rgba(200,242,90,0.15)' }}>
        {[
          { role: 'Coach',  email: 'coach@trak.dev' },
          { role: 'Player', email: 'player@trak.dev' },
          { role: 'Parent', email: 'parent@trak.dev' },
        ].map(a => (
          <div key={a.role} className="flex justify-between text-[12px]">
            <span className="text-white/50">{a.role}</span>
            <span className="text-[#C8F25A]/70" style={{ fontFamily: "'DM Mono', monospace" }}>{a.email} · TrakDev123</span>
          </div>
        ))}
      </div>

      {steps.length > 0 && (
        <div className="w-full rounded-[14px] p-4 mb-5 space-y-2"
          style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>
          {steps.map(s => (
            <div key={s.label} className="flex items-start gap-2 text-[12px]">
              <span className="flex-shrink-0 w-4">{iconFor(s.status)}</span>
              <div>
                <span className="text-white/70">{s.label}</span>
                {s.detail && <p className="text-[10px] text-white/35 mt-0.5">{s.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {done ? (
        <div className="w-full space-y-2">
          <div className="text-center py-3 text-[14px] font-semibold text-[#C8F25A]">All done! ✅</div>
          <button onClick={() => navigate('/')}
            className="w-full py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm">
            Go to app →
          </button>
        </div>
      ) : (
        <button onClick={run} disabled={running}
          className="w-full py-4 rounded-[10px] bg-[#C8F25A] text-black font-bold text-sm disabled:opacity-50 transition-opacity">
          {running ? 'Setting up...' : 'Run Setup →'}
        </button>
      )}

      <p className="text-[10px] text-white/20 mt-4 text-center" style={{ fontFamily: "'DM Mono', monospace" }}>
        ⚠ Disable "Confirm email" in Supabase Auth settings if sign-up fails
      </p>

      <button onClick={() => navigate('/')} className="mt-3 text-[11px] text-white/25 hover:text-white/50">
        ← Back to landing
      </button>
    </div>
  )
}
