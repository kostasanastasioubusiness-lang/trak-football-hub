import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'work_rate', label: 'Work Rate', hint: 'Pressing · tracking back · effort without the ball' },
  { id: 'tactical', label: 'Tactical Discipline', hint: 'Positioning · game plan · decisions off the ball' },
  { id: 'attitude', label: 'Attitude', hint: 'Focus · response to mistakes · body language' },
  { id: 'technical', label: 'Technical Execution', hint: 'Touch · passing · execution under pressure' },
  { id: 'physical', label: 'Physical Presence', hint: 'Winning physical battles · athleticism' },
  { id: 'coachability', label: 'Coachability', hint: 'Responding to instructions · making adjustments' },
];

const CoachAssess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [appearance, setAppearance] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({
    work_rate: 5, tactical: 5, attitude: 5, technical: 5, physical: 5, coachability: 5,
  });
  const [flag, setFlag] = useState('fair');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('squad_players').select('*').eq('coach_user_id', user.id).order('player_name')
      .then(({ data }) => setPlayers(data || []));
    supabase.from('coach_sessions').select('*').eq('coach_user_id', user.id).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setSessions(data || []));
  }, [user]);

  const avgRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 6;
  const touched = Object.values(ratings).some(v => v !== 5);

  const handleSave = async () => {
    if (!user || !selectedPlayer) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('coach_assessments').insert({
        coach_user_id: user.id,
        squad_player_id: selectedPlayer,
        session_id: selectedSession || null,
        appearance: appearance || null,
        ...ratings,
        flag,
        private_note: note || null,
      });
      if (error) throw error;
      toast.success('Assessment saved!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedPlayerData = players.find(p => p.id === selectedPlayer);

  return (
    <div className="app-container px-[18px] py-6 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/dashboard')} className="w-[34px] h-[34px] bg-secondary border border-white/5 rounded-[10px] flex items-center justify-center text-foreground text-sm">←</button>
        <span className="font-heading text-[26px] font-black tracking-wider text-foreground">ASSESSMENT</span>
      </div>

      {/* Player Select */}
      <div className="mb-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Player</p>
        <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}
          className="w-full bg-card border border-white/5 rounded-[10px] p-3 text-foreground outline-none focus:border-primary text-sm">
          <option value="">Select a player...</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.player_name} — {p.position}</option>
          ))}
        </select>
      </div>

      {selectedPlayerData && (
        <div className="bg-card border border-white/5 rounded-[10px] p-3 mb-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-lg">👦</div>
          <div>
            <p className="text-[15px] font-bold text-foreground">{selectedPlayerData.player_name}</p>
            <p className="text-[11px] text-muted-foreground">{selectedPlayerData.position} {selectedPlayerData.shirt_number ? `· #${selectedPlayerData.shirt_number}` : ''}</p>
          </div>
        </div>
      )}

      {/* Session Select */}
      <div className="mb-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Session</p>
        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
          className="w-full bg-card border border-white/5 rounded-[10px] p-3 text-foreground outline-none focus:border-primary text-sm">
          <option value="">Select a session...</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.session_type === 'match' ? '⚽' : '🏃'} {s.title} — {new Date(s.session_date || s.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Appearance */}
      <div className="mb-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Appearance</p>
        <div className="grid grid-cols-3 gap-1.5">
          {['Started', 'Substitute', 'Training'].map(a => (
            <button key={a} onClick={() => setAppearance(a)}
              className={`border rounded-lg py-2.5 text-[11px] font-bold transition-colors
                ${appearance === a ? 'border-primary bg-primary/15 text-primary' : 'border-white/5 bg-[hsl(222,40%,8%)] text-muted-foreground'}`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Category Sliders */}
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-3">Category Ratings (1–10)</p>
      <div className="space-y-2 mb-4">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="bg-card border border-white/5 rounded-[10px] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground">{cat.label}</span>
              <span className="font-heading text-xl text-coach-orange">{ratings[cat.id]}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">{cat.hint}</p>
            <Slider min={1} max={10} step={1} value={[ratings[cat.id]]}
              onValueChange={([v]) => setRatings(prev => ({ ...prev, [cat.id]: v }))}
              className="[&_[role=slider]]:border-coach-orange [&_[role=slider]]:bg-coach-orange [&_.bg-primary]:bg-coach-orange" />
          </div>
        ))}
      </div>

      {/* Coach Rating Preview */}
      <div className="rounded-[10px] p-3 mb-4 flex items-center justify-between"
        style={{ background: 'rgba(232,128,58,0.08)', border: '1px solid rgba(232,128,58,0.2)' }}>
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-coach-orange mb-1">Coach Rating</p>
          <p className="text-[11px] text-muted-foreground">Average of 6 categories</p>
        </div>
        <p className="font-heading text-5xl font-black text-coach-orange leading-none">
          {touched ? avgRating.toFixed(1) : '–'}
        </p>
      </div>

      {/* Flag */}
      <div className="mb-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Does the player's computed rating feel fair?</p>
        <div className="space-y-1.5">
          {[
            { k: 'fair', l: '✓ Fair — rating reflects the performance', cls: 'border-primary bg-primary/10 text-primary' },
            { k: 'generous', l: '⚠️ Slightly generous', cls: 'border-gold bg-gold/10 text-gold' },
            { k: 'off', l: '✕ Significantly off', cls: 'border-destructive bg-destructive/10 text-destructive' },
          ].map(f => (
            <button key={f.k} onClick={() => setFlag(f.k)}
              className={`w-full text-left border rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors flex items-center gap-2
                ${flag === f.k ? f.cls : 'border-white/5 bg-[hsl(222,40%,8%)] text-muted-foreground'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mb-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Private Note <span className="text-[10px] font-normal">(visible to player only)</span></p>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          className="w-full bg-card border border-white/5 rounded-[10px] p-3 text-sm text-foreground outline-none focus:border-primary resize-none"
          rows={3} placeholder="e.g. Great movement before goals. Pressing needs improvement..." />
      </div>

      <button onClick={handleSave} disabled={!selectedPlayer || saving}
        className="w-full rounded-[10px] py-4 text-white font-heading text-[15px] font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #7a3a00, hsl(24 78% 57%))' }}>
        {saving ? 'Saving...' : 'Save Assessment →'}
      </button>
    </div>
  );
};

export default CoachAssess;
