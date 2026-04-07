import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CoachNav } from './CoachHome';

const CoachProgress = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('squad_players').select('*').eq('coach_user_id', user.id).order('player_name')
      .then(({ data }) => setPlayers(data || []));
    supabase.from('coach_assessments').select('*, squad_players(player_name, position)')
      .eq('coach_user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setAssessments(data || []));
  }, [user]);

  const playerStats = players.map(p => {
    const pa = assessments.filter(a => a.squad_player_id === p.id);
    const avg = pa.length > 0 ? pa.reduce((s, a) => s + Number(a.coach_rating), 0) / pa.length : 0;
    return { ...p, assessmentCount: pa.length, avgRating: avg };
  }).sort((a, b) => b.avgRating - a.avgRating);

  return (
    <div className="app-container flex flex-col min-h-screen">
      <div className="flex-1 px-[18px] pt-4 pb-24">
        <h1 className="text-[28px] text-foreground mb-4">Progress</h1>

        {/* Squad Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-card border border-border rounded-[10px] p-3 text-center">
            <p className="text-2xl text-gold leading-none">{players.length}</p>
            <p className="section-label mt-1">Players</p>
          </div>
          <div className="bg-card border border-border rounded-[10px] p-3 text-center">
            <p className="text-2xl text-coach-orange leading-none">{assessments.length}</p>
            <p className="section-label mt-1">Assessments</p>
          </div>
          <div className="bg-card border border-border rounded-[10px] p-3 text-center">
            <p className="text-2xl text-primary leading-none">
              {playerStats.length > 0 && playerStats[0].avgRating > 0 ? playerStats[0].avgRating.toFixed(1) : '—'}
            </p>
            <p className="section-label mt-1">Top Rating</p>
          </div>
        </div>

        {/* Player Rankings */}
        <p className="section-label mb-3">Squad Rankings</p>
        <div className="space-y-2">
          {playerStats.map((p, i) => (
            <div key={p.id} className="bg-card border border-border rounded-[10px] p-3 flex items-center gap-3">
              <span className="text-muted-foreground text-lg w-6 text-center">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{p.player_name}</p>
                <p className="text-[11px] text-muted-foreground">{p.position} · {p.assessmentCount} assessments</p>
              </div>
              <div className="text-right">
                <p className="text-xl text-coach-orange leading-none">{p.avgRating > 0 ? p.avgRating.toFixed(1) : '—'}</p>
                <p className="section-label">Coach Avg</p>
              </div>
            </div>
          ))}
          {playerStats.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Add players and assessments to see progress.</p>
          )}
        </div>
      </div>
      <CoachNav active="progress" />
    </div>
  );
};

export default CoachProgress;
