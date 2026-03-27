import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CoachNav } from './CoachHome';

const CoachSquad = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('All');
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newShirt, setNewShirt] = useState('');
  const [newAge, setNewAge] = useState('');

  const loadPlayers = async () => {
    if (!user) return;
    const { data } = await supabase.from('squad_players').select('*').eq('coach_user_id', user.id).order('player_name');
    setPlayers(data || []);
  };

  useEffect(() => { loadPlayers(); }, [user]);

  const handleAddPlayer = async () => {
    if (!user || !newName || !newPosition) return;
    const { error } = await supabase.from('squad_players').insert({
      coach_user_id: user.id,
      player_name: newName,
      position: newPosition,
      shirt_number: newShirt ? parseInt(newShirt) : null,
      age: newAge ? parseInt(newAge) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Player added!');
    setNewName(''); setNewPosition(''); setNewShirt(''); setNewAge('');
    setShowAdd(false);
    loadPlayers();
  };

  const filtered = filter === 'All' ? players : players.filter(p => {
    const pos = (p.position || '').toLowerCase();
    if (filter === 'Attack') return pos.includes('att') || pos.includes('rw') || pos.includes('lw') || pos.includes('st') || pos.includes('cf');
    if (filter === 'Midfield') return pos.includes('mid') || pos.includes('cam') || pos.includes('cdm') || pos.includes('cm');
    if (filter === 'Defence') return pos.includes('def') || pos.includes('cb') || pos.includes('lb') || pos.includes('rb') || pos.includes('gk') || pos.includes('goalkeeper');
    return true;
  });

  return (
    <div className="app-container flex flex-col min-h-screen">
      <div className="flex-1 px-[18px] pt-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-[28px] font-bold tracking-wider text-foreground">Squad</h1>
          <button onClick={() => setShowAdd(!showAdd)}
            className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white text-lg"
            style={{ background: 'linear-gradient(135deg, hsl(224 85% 35%), hsl(224 85% 53%))' }}>+</button>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {['All', 'Attack', 'Midfield', 'Defence'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`border rounded-lg py-2 text-[11px] font-bold transition-colors
                ${filter === f ? 'border-primary bg-primary/15 text-primary' : 'border-white/5 bg-[hsl(222,40%,8%)] text-muted-foreground'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="bg-card border border-white/5 rounded-xl p-4 mb-4 space-y-3">
            <Input placeholder="Player Name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-secondary border-white/5" />
            <div className="grid grid-cols-2 gap-1.5">
              {['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'].map(p => (
                <button key={p} onClick={() => setNewPosition(p)}
                  className={`border rounded-lg py-2 text-[11px] font-bold transition-colors
                    ${newPosition === p ? 'border-primary bg-primary/15 text-primary' : 'border-white/5 bg-[hsl(222,40%,8%)] text-muted-foreground'}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Shirt #" type="number" value={newShirt} onChange={e => setNewShirt(e.target.value)} className="bg-secondary border-white/5" />
              <Input placeholder="Age" type="number" value={newAge} onChange={e => setNewAge(e.target.value)} className="bg-secondary border-white/5" />
            </div>
            <button onClick={handleAddPlayer} disabled={!newName || !newPosition}
              className="w-full rounded-[10px] py-3 text-white font-heading text-sm font-bold tracking-wide disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7a3a00, hsl(24 78% 57%))' }}>
              Add Player →
            </button>
          </div>
        )}

        {/* Player List */}
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-card border border-white/5 rounded-[10px] p-3 flex items-center gap-3 cursor-pointer hover:border-gold/30 transition-colors"
              onClick={() => navigate(`/coach/player/${p.id}`)}>
              <div className="w-10 h-10 rounded-full bg-secondary border border-white/5 flex items-center justify-center text-base flex-shrink-0">👦</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{p.player_name}</p>
                <p className="text-[11px] text-muted-foreground">{p.position} {p.age ? `· Age ${p.age}` : ''} {p.shirt_number ? `· #${p.shirt_number}` : ''}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No players yet. Tap + to add your first player.</p>
            </div>
          )}
        </div>
      </div>
      <CoachNav active="squad" />
    </div>
  );
};

export default CoachSquad;
