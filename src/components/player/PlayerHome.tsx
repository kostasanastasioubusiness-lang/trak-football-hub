import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SeasonStats {
  matches: number;
  goals: number;
  sessions: number;
  avgComputed: number | null;
  avgCoach: number | null;
}

const PlayerHome = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SeasonStats>({ matches: 0, goals: 0, sessions: 0, avgComputed: null, avgCoach: null });
  const [wellnessToday, setWellnessToday] = useState<boolean | null>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [playerDetails, setPlayerDetails] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('player_details').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setPlayerDetails(data));

    supabase.from('matches').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        const matches = data || [];
        setRecentMatches(matches.slice(0, 5));
        setStats({
          matches: matches.length,
          goals: matches.reduce((sum, m) => sum + (m.goals || 0), 0),
          sessions: 0,
          avgComputed: matches.length > 0 ? Math.round(matches.reduce((s, m) => s + Number(m.computed_rating), 0) / matches.length * 10) / 10 : null,
          avgCoach: null,
        });
      });

    const today = new Date().toISOString().split('T')[0];
    supabase.from('wellness_logs').select('id').eq('user_id', user.id).eq('logged_date', today).maybeSingle()
      .then(({ data }) => setWellnessToday(!!data));
  }, [user]);

  if (!profile) return null;

  const firstName = profile.full_name?.split(' ')[0] || profile.full_name;
  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="app-container flex flex-col min-h-screen">
      <div className="flex-1 px-[18px] pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-heading text-2xl font-black tracking-wider text-foreground">TRAK</span>
            <span className="text-primary italic text-sm ml-1 tracking-widest font-body">football</span>
          </div>
          <button onClick={signOut} className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors">
            Switch Account
          </button>
        </div>

        {/* Hero Card */}
        <div className="rounded-2xl p-[18px] mb-4 border border-white/5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(222 40% 10%) 0%, hsl(222 50% 15%) 100%)' }}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-xl border-2 border-white/10 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(224 85% 53%) 0%, hsl(224 85% 35%) 100%)' }}>
              {initials}
            </div>
            <div>
              <h2 className="font-heading text-2xl font-black tracking-wide text-foreground leading-tight">{profile.full_name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-muted-foreground">
                  {playerDetails?.position || '—'} · {playerDetails?.current_club || '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <StatBox label="Played" value={stats.matches} />
            <StatBox label="Goals" value={stats.goals} />
            <StatBox label="Avg Rating" value={stats.avgComputed !== null ? stats.avgComputed.toFixed(1) : '—'} color="text-primary" />
            <StatBox label="Coach Avg" value={stats.avgCoach !== null ? stats.avgCoach.toFixed(1) : '—'} color="text-coach-orange" />
          </div>
        </div>

        {/* Wellness Banner */}
        {wellnessToday !== null && (
          <div
            onClick={() => !wellnessToday && navigate('/wellness')}
            className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium cursor-pointer transition-colors ${
              wellnessToday
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-gold/10 text-gold border border-gold/20'
            }`}
          >
            {wellnessToday
              ? '✅ Wellness logged today.'
              : '🟡 How are you feeling today? — Tap to check in.'}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <QuickAction emoji="📝" label="Log" onClick={() => navigate('/log')} />
          <QuickAction emoji="🎬" label="Highlight" onClick={() => {}} />
          <QuickAction emoji="🧠" label="Goal" onClick={() => {}} />
        </div>

        {/* Recent Activity */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-[17px] font-bold tracking-wider text-foreground">RECENT ACTIVITY</h3>
            <button className="text-xs text-primary font-semibold">See all</button>
          </div>
          {recentMatches.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">No matches logged yet. Tap Log to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => {
                const isWin = m.team_score > m.opponent_score;
                const isDraw = m.team_score === m.opponent_score;
                const resultLabel = isWin ? `W ${m.team_score}–${m.opponent_score}` : isDraw ? `D ${m.team_score}–${m.opponent_score}` : `L ${m.team_score}–${m.opponent_score}`;
                const resultClass = isWin ? 'bg-primary/20 text-primary' : isDraw ? 'bg-white/5 text-muted-foreground' : 'bg-red/15 text-red';

                return (
                  <div key={m.id} className="bg-card rounded-xl border border-white/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground font-bold">{m.competition} · {m.venue}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {m.position} · {m.minutes_played}min
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-heading text-sm px-2 py-0.5 rounded-lg ${resultClass}`}>{resultLabel}</span>
                      <div className="text-right">
                        <p className="font-heading text-lg text-primary leading-none">{Number(m.computed_rating).toFixed(1)}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">Cmptd R</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-xl border-t border-white/5 px-2 py-2 z-50">
        <div className="flex justify-around items-center">
          <NavItem emoji="🏠" label="Home" active onClick={() => navigate('/dashboard')} />
          <NavItem emoji="📝" label="Log" onClick={() => navigate('/log')} />
          <NavItem emoji="🎬" label="Highlights" onClick={() => {}} />
          <NavItem emoji="🧠" label="Goals" onClick={() => {}} />
          <NavItem emoji="👤" label="Profile" onClick={() => {}} />
        </div>
      </nav>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <div className="text-center rounded-lg py-2 px-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
    <p className={`font-heading text-2xl leading-none ${color || 'text-foreground'}`}>{value}</p>
    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-1">{label}</p>
  </div>
);

const QuickAction = ({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-card border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-colors active:scale-95"
  >
    <span className="text-xl">{emoji}</span>
    <span className="text-[11px] text-muted-foreground font-semibold">{label}</span>
  </button>
);

const NavItem = ({ emoji, label, active, onClick }: { emoji: string; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-1 ${active ? '' : 'opacity-35 grayscale'}`}>
    <span className="text-[19px]">{emoji}</span>
    <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
  </button>
);

export default PlayerHome;
