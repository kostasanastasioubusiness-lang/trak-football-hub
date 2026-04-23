import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Target, Award, Star, Trophy, Shield, Goal, Home, ClipboardList, PlaySquare, Brain, User, X, Check, type LucideIcon } from 'lucide-react';

const GOAL_PRESETS: { type: string; label: string; icon: LucideIcon }[] = [
  { type: 'goals_scored',   label: 'Goals Scored',       icon: Goal },
  { type: 'assists',        label: 'Assists',            icon: Award },
  { type: 'matches_played', label: 'Matches Played',     icon: ClipboardList },
  { type: 'avg_rating',     label: 'Average Rating',     icon: Star },
  { type: 'wins',           label: 'Wins',               icon: Trophy },
  { type: 'clean_sheets',   label: 'Clean Sheets (GK)',  icon: Shield },
];

interface PlayerGoal {
  id: string;
  goal_type: string;
  target_value: number;
}

interface MatchStats {
  goals: number;
  assists: number;
  matches: number;
  avgRating: number | null;
  wins: number;
  cleanSheets: number;
}

const PlayerGoals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats>({ goals: 0, assists: 0, matches: 0, avgRating: null, wins: 0, cleanSheets: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState(GOAL_PRESETS[0].type);
  const [newTarget, setNewTarget] = useState('');

  useEffect(() => {
    if (!user) return;

    supabase.from('player_goals').select('*').eq('user_id', user.id)
      .then(({ data }) => setGoals((data as any[]) || []));

    supabase.from('matches').select('*').eq('user_id', user.id)
      .then(({ data }) => {
        const m = data || [];
        setMatchStats({
          goals: m.reduce((s, x) => s + (x.goals || 0), 0),
          assists: m.reduce((s, x) => s + (x.assists || 0), 0),
          matches: m.length,
          avgRating: m.length > 0 ? Math.round(m.reduce((s, x) => s + Number(x.computed_rating), 0) / m.length * 10) / 10 : null,
          wins: m.filter(x => x.team_score > x.opponent_score).length,
          cleanSheets: m.filter(x => x.opponent_score === 0 && x.position?.toLowerCase().includes('gk')).length,
        });
      });
  }, [user]);

  const getCurrentValue = (type: string): number => {
    switch (type) {
      case 'goals_scored': return matchStats.goals;
      case 'assists': return matchStats.assists;
      case 'matches_played': return matchStats.matches;
      case 'avg_rating': return matchStats.avgRating || 0;
      case 'wins': return matchStats.wins;
      case 'clean_sheets': return matchStats.cleanSheets;
      default: return 0;
    }
  };

  const handleAdd = async () => {
    if (!user || !newTarget) return;
    const target = parseFloat(newTarget);
    if (isNaN(target) || target <= 0) { toast.error('Enter a valid target'); return; }

    const { data, error } = await supabase.from('player_goals')
      .insert({ user_id: user.id, goal_type: newType, target_value: target })
      .select()
      .single();

    if (error) { toast.error('Failed to add goal'); return; }
    setGoals(prev => [...prev, data as any]);
    setShowAdd(false);
    setNewTarget('');
    toast.success('Goal added!');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('player_goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal removed');
  };

  const preset = (type: string) => GOAL_PRESETS.find(p => p.type === type);

  return (
    <div className="app-container flex flex-col min-h-screen">
      <div className="flex-1 px-[18px] pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl text-foreground">My goals</h1>
          <button onClick={() => setShowAdd(true)}
            className="text-xs text-primary-foreground bg-primary rounded-lg px-3 py-1.5 font-medium">
            + Add Goal
          </button>
        </div>

        {goals.length === 0 && !showAdd && (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <Target size={28} strokeWidth={1.5} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No goals set yet. Tap "Add Goal" to set your first target!</p>
          </div>
        )}

        {/* Goal Cards */}
        <div className="space-y-3 mb-4">
          {goals.map(goal => {
            const p = preset(goal.goal_type);
            const current = getCurrentValue(goal.goal_type);
            const target = Number(goal.target_value);
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isComplete = current >= target;
            const Icon = p?.icon || Target;

            return (
              <div key={goal.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={18} strokeWidth={1.75} className="text-foreground" />
                    <span className="text-sm font-medium text-foreground">{p?.label || goal.goal_type}</span>
                  </div>
                  <button onClick={() => handleDelete(goal.id)} className="text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-2xl leading-none ${isComplete ? 'text-primary' : 'text-foreground'}`}>
                    {goal.goal_type === 'avg_rating' ? current.toFixed(1) : current}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {goal.goal_type === 'avg_rating' ? target.toFixed(1) : target}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isComplete ? 'bg-primary' : 'bg-primary/60'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-right inline-flex items-center gap-1 w-full justify-end">
                  {isComplete ? <><Check size={11} className="text-primary" /> Complete!</> : `${pct}% there`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Add Goal Form */}
        {showAdd && (
          <div className="bg-card rounded-xl border border-primary/30 p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">New Goal</h3>
            <div>
              <label className="section-label block mb-1">Goal Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                {GOAL_PRESETS.map(p => (
                  <option key={p.type} value={p.type}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1">Target</label>
              <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="e.g. 10"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-border rounded-lg py-2 text-xs text-muted-foreground">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-medium">Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-xl border-t border-border px-2 py-2 z-50">
        <div className="flex justify-around items-center">
          <NavItem icon={Home} label="Home" onClick={() => navigate('/dashboard')} />
          <NavItem icon={ClipboardList} label="Log" onClick={() => navigate('/log')} />
          <NavItem icon={PlaySquare} label="Highlights" onClick={() => {}} />
          <NavItem icon={Brain} label="Goals" active onClick={() => {}} />
          <NavItem icon={User} label="Profile" onClick={() => navigate('/profile')} />
        </div>
      </nav>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-1 ${active ? '' : 'opacity-35'}`}>
    <Icon size={18} strokeWidth={1.75} className={active ? 'text-primary' : 'text-muted-foreground'} />
    <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
  </button>
);

export default PlayerGoals;
