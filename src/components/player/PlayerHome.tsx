import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Star, Target, Home, Brain, User, Plus } from 'lucide-react';

interface SeasonStats {
  matches: number;
  goals: number;
  avgComputed: number | null;
  avgCoach: number | null;
}

const PlayerHome = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SeasonStats>({ matches: 0, goals: 0, avgComputed: null, avgCoach: null });
  const [wellnessToday, setWellnessToday] = useState<boolean | null>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [playerDetails, setPlayerDetails] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch player details
    supabase.from('player_details').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setPlayerDetails(data));

    // Fetch matches for stats
    supabase.from('matches').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        const matches = data || [];
        setRecentMatches(matches.slice(0, 4));
        setStats({
          matches: matches.length,
          goals: matches.reduce((sum, m) => sum + (m.goals || 0), 0),
          avgComputed: matches.length > 0 ? Math.round(matches.reduce((s, m) => s + Number(m.computed_rating), 0) / matches.length * 10) / 10 : null,
          avgCoach: null, // Phase 3
        });
      });

    // Check wellness today
    const today = new Date().toISOString().split('T')[0];
    supabase.from('wellness_logs').select('id').eq('user_id', user.id).eq('logged_date', today).maybeSingle()
      .then(({ data }) => setWellnessToday(!!data));
  }, [user]);

  if (!profile) return null;

  return (
    <div className="app-container flex flex-col min-h-screen">
      <div className="flex-1 px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-heading text-primary tracking-wider">TRAK</h1>
          <button onClick={signOut} className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors">
            Switch Account
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="mb-3">
            <h2 className="text-lg font-heading text-foreground">{profile.full_name}</h2>
            <p className="text-xs text-muted-foreground">
              {playerDetails?.current_club || '—'} · {playerDetails?.position || '—'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <StatBox label="Played" value={stats.matches} />
            <StatBox label="Goals" value={stats.goals} />
            <StatBox label="Avg Rating" value={stats.avgComputed !== null ? stats.avgComputed.toFixed(1) : '—'} color="text-primary" />
            <StatBox label="Coach Avg" value={stats.avgCoach !== null ? stats.avgCoach.toFixed(1) : '—'} color="text-coach-orange" />
          </div>
        </div>

        {/* Wellness Banner */}
        {wellnessToday !== null && (
          <div
            className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium cursor-pointer transition-colors ${
              wellnessToday
                ? 'bg-primary/15 text-primary'
                : 'bg-gold/15 text-gold'
            }`}
          >
            {wellnessToday
              ? '✅ Wellness logged today.'
              : '🟡 How are you feeling today? — Tap to check in.'}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <QuickAction icon={<Pencil className="w-5 h-5" />} label="Log" onClick={() => navigate('/log')} />
          <QuickAction icon={<Plus className="w-5 h-5" />} label="Highlight" onClick={() => {}} />
          <QuickAction icon={<Target className="w-5 h-5" />} label="Goal" onClick={() => {}} />
        </div>

        {/* Recent Activity */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-sm text-foreground">Recent Activity</h3>
            <button className="text-xs text-primary">See all</button>
          </div>
          {recentMatches.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">No matches logged yet. Tap Log to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div key={m.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground font-medium">
                      {m.competition} · {m.venue}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.team_score}–{m.opponent_score} · {m.position} · {m.minutes_played}min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-heading text-primary">{Number(m.computed_rating).toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">Rating</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-2 py-2 z-50">
        <div className="flex justify-around items-center">
          <NavItem icon={<Home className="w-5 h-5" />} label="Home" active onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Pencil className="w-5 h-5" />} label="Log" onClick={() => navigate('/log')} />
          <NavItem icon={<Star className="w-5 h-5" />} label="Highlights" onClick={() => {}} />
          <NavItem icon={<Brain className="w-5 h-5" />} label="Goals" onClick={() => {}} />
          <NavItem icon={<User className="w-5 h-5" />} label="Profile" onClick={() => {}} />
        </div>
      </nav>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <div className="text-center">
    <p className={`text-lg font-heading ${color || 'text-foreground'}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
  </div>
);

const QuickAction = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-primary/50 transition-colors"
  >
    <span className="text-primary">{icon}</span>
    <span className="text-xs text-foreground">{label}</span>
  </button>
);

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
    {icon}
    <span className="text-[10px]">{label}</span>
  </button>
);

export default PlayerHome;
