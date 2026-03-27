import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CoachSessionDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [squadPlayers, setSquadPlayers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from('coach_sessions').select('*').eq('id', id).eq('coach_user_id', user.id).maybeSingle()
      .then(({ data }) => setSession(data));
    supabase.from('squad_players').select('*').eq('coach_user_id', user.id).order('player_name')
      .then(({ data }) => {
        setSquadPlayers(data || []);
        // Load existing attendance
        supabase.from('session_attendance').select('*').eq('session_id', id)
          .then(({ data: attData }) => {
            const map: Record<string, string> = {};
            (attData || []).forEach((a: any) => { map[a.squad_player_id] = a.status; });
            // Default to 'present' for players without record
            (data || []).forEach(p => { if (!map[p.id]) map[p.id] = 'present'; });
            setAttendance(map);
          });
      });
  }, [user, id]);

  const handleSaveAttendance = async () => {
    if (!user || !id) return;
    setSaving(true);
    try {
      // Delete existing attendance for this session
      await supabase.from('session_attendance').delete().eq('session_id', id);
      // Insert new
      const rows = Object.entries(attendance).map(([squadPlayerId, status]) => ({
        session_id: id,
        squad_player_id: squadPlayerId,
        status,
      }));
      if (rows.length) {
        const { error } = await supabase.from('session_attendance').insert(rows);
        if (error) throw error;
      }
      toast.success('Attendance saved!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!session) return <div className="app-container flex items-center justify-center min-h-screen text-foreground">Loading...</div>;

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;

  return (
    <div className="app-container px-[18px] py-6 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/coach/sessions')} className="w-[34px] h-[34px] bg-secondary border border-white/5 rounded-[10px] flex items-center justify-center text-foreground text-sm">←</button>
        <span className="font-heading text-[26px] font-black tracking-wider text-foreground">
          {session.session_type === 'match' ? 'MATCH SQUAD' : 'ATTENDANCE'}
        </span>
      </div>

      <div className="bg-card border border-white/5 rounded-[10px] p-3 mb-4">
        <p className="text-[15px] font-bold text-foreground">{session.title}</p>
        <p className="text-xs text-primary mt-1">{presentCount} of {squadPlayers.length} players present</p>
      </div>

      <div className="space-y-2 mb-5">
        {squadPlayers.map(p => (
          <div key={p.id} className="bg-card border border-white/5 rounded-[10px] px-3 py-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{p.player_name}</span>
            <div className="flex gap-1.5">
              <button onClick={() => setAttendance(prev => ({ ...prev, [p.id]: 'present' }))}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  attendance[p.id] === 'present' ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
                }`}>Present</button>
              <button onClick={() => setAttendance(prev => ({ ...prev, [p.id]: 'absent' }))}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  attendance[p.id] === 'absent' ? 'bg-destructive text-white' : 'bg-destructive/15 text-destructive'
                }`}>Absent</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSaveAttendance} disabled={saving}
        className="w-full rounded-[10px] py-4 text-white font-heading text-[15px] font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, hsl(224 85% 35%) 0%, hsl(224 85% 53%) 100%)' }}>
        {saving ? 'Saving...' : 'Save Attendance →'}
      </button>
    </div>
  );
};

export default CoachSessionDetail;
