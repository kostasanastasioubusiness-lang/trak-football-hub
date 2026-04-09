import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RatingBandPill } from '@/lib/ratingBand';

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
            <span className="text-2xl text-foreground">TRAK</span>
            <span className="text-primary italic text-sm ml-1 tracking-widest block mt-0.5">football</span>
          </div>
          <button onClick={signOut} className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors">
            Switch Account
          </button>
        </div>

        {/* Hero Card */}
        <div className="rounded-2xl p-[18px] mb-4 border border-border relative overflow-hidden bg-card">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-xl border-2 border-border flex-shrink-0 bg-secondary">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl text-foreground leading-tight">{profile.full_name}</h2>
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
            <div className="text-center rounded-lg py-2 px-1 bg-secondary flex flex-col items-center justify-center">
              {stats.avgComputed !== null ? <RatingBandPill rating={stats.avgComputed} /> : <p className="text-2xl leading-none text-foreground">—</p>}
              <p className="section-label mt-1">Avg Rating</p>
            </div>
            <div className="text-center rounded-lg py-2 px-1 bg-secondary flex flex-col items-center justify-center">
              {stats.avgCoach !== null ? <RatingBandPill rating={stats.avgCoach} /> : <p className="text-2xl leading-none text-foreground">—</p>}
              <p className="section-label mt-1">Coach Avg</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <QuickAction emoji="📝" label="Log" onClick={() => navigate('/log')} />
          <QuickAction emoji="🎬" label="Highlight" onClick={() => {}} />
          <QuickAction emoji="🧠" label="Goal" onClick={() => navigate('/goals')} />
        </div>

        {/* Recent Activity */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-label">Recent Activity</h3>
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
                const resultClass = isWin ? 'bg-primary/20 text-primary' : isDraw ? 'bg-muted text-muted-foreground' : 'bg-red/15 text-red';

                return (
                  <div key={m.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground font-medium">{m.competition} · {m.venue}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {m.position} · {m.minutes_played}min
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm px-2 py-0.5 rounded-lg ${resultClass}`}>{resultLabel}</span>
                      <RatingBandPill rating={Number(m.computed_rating)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-xl border-t border-border px-2 py-2 z-50">
        <div className="flex justify-around items-center">
          <NavItem emoji="🏠" label="Home" active onClick={() => navigate('/dashboard')} />
          <NavItem emoji="📝" label="Log" onClick={() => navigate('/log')} />
          <NavItem emoji="🎬" label="Highlights" onClick={() => {}} />
          <NavItem emoji="🧠" label="Goals" onClick={() => navigate('/goals')} />
          <NavItem emoji="👤" label="Profile" onClick={() => navigate('/profile')} />
        </div>
      </nav>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <div className="text-center rounded-lg py-2 px-1 bg-secondary">
    <p className={`text-2xl leading-none ${color || 'text-foreground'}`}>{value}</p>
    <p className="section-label mt-1">{label}</p>
  </div>
);

const QuickAction = ({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-colors active:scale-95"
  >
    <span className="text-xl">{emoji}</span>
    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
  </button>
);

const NavItem = ({ emoji, label, active, onClick }: { emoji: string; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-1 ${active ? '' : 'opacity-35 grayscale'}`}>
    <span className="text-[19px]">{emoji}</span>
    <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
  </button>
);

export default PlayerHome;
