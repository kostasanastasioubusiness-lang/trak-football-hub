import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { POSITIONS } from '@/lib/constants';
import {
  MATCH_AGE_GROUPS, COMPETITIONS, VENUES, CARDS, BODY_CONDITIONS, SELF_RATINGS,
  AGE_GROUP_MAX_MINUTES, POSITION_QUESTIONS, MID_ROLE_QUESTIONS,
  computeRating, type MatchInputs,
} from '@/lib/rating';
import { getRatingBand } from '@/lib/ratingBand';

const MatchLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [position, setPosition] = useState('');
  const [competition, setCompetition] = useState('');
  const [venue, setVenue] = useState('');
  const [teamScore, setTeamScore] = useState<number | ''>('');
  const [opponentScore, setOpponentScore] = useState<number | ''>('');
  const [ageGroup, setAgeGroup] = useState('');
  const [minutesPlayed, setMinutesPlayed] = useState<number | ''>('');
  const [cardReceived, setCardReceived] = useState('None');
  const [bodyCondition, setBodyCondition] = useState('');
  const [selfRating, setSelfRating] = useState('');
  const [goals, setGoals] = useState<number | ''>('');
  const [assists, setAssists] = useState<number | ''>('');
  const [positionInputs, setPositionInputs] = useState<Record<string, string | number | ''>>({});

  const midRole = position === 'Midfielder' ? (positionInputs['midrole'] as string || '') : '';
  const midRoleKey = midRole === 'Defensive' ? 'cdm' : midRole === 'Box-to-box' ? 'cm' : midRole === 'Attacking' ? 'cam' : '';

  const setPosInput = (id: string, val: string | number | '') => {
    setPositionInputs(prev => ({ ...prev, [id]: val }));
  };

  const handlePositionChange = (p: string) => {
    setPosition(p);
    setPositionInputs({});
  };

  const inputs: MatchInputs = {
    position, competition, venue, teamScore, opponentScore,
    ageGroup, minutesPlayed, cardReceived, bodyCondition, selfRating,
    goals, assists, positionInputs, midRole: midRoleKey,
  };

  const rating = useMemo(() => computeRating(inputs), [
    position, competition, venue, teamScore, opponentScore,
    ageGroup, minutesPlayed, cardReceived, bodyCondition, selfRating,
    goals, assists, positionInputs, midRoleKey,
  ]);

  const maxMinutes = ageGroup ? AGE_GROUP_MAX_MINUTES[ageGroup] || 90 : 90;
  const scoresFilled = teamScore !== '' && opponentScore !== '';
  const maxGoalContributions = scoresFilled ? Number(teamScore) : 0;
  const canSave = position && competition && venue && scoresFilled && ageGroup && minutesPlayed !== '';
  const showGoalsAssists = position !== 'Goalkeeper';

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('matches').insert({
        user_id: user.id, position, competition, venue,
        team_score: Number(teamScore), opponent_score: Number(opponentScore),
        age_group: ageGroup, minutes_played: Number(minutesPlayed),
        card_received: cardReceived, body_condition: bodyCondition || null,
        self_rating: selfRating || null, goals: goals !== '' ? Number(goals) : 0,
        assists: assists !== '' ? Number(assists) : 0, computed_rating: rating ?? 6.5,
      });
      if (error) throw error;
      toast.success('Match logged!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save match');
    } finally {
      setSaving(false);
    }
  };

  const posQuestions = position ? POSITION_QUESTIONS[position] || [] : [];
  const midSubQuestions = midRoleKey ? MID_ROLE_QUESTIONS[midRoleKey] || [] : [];

  return (
    <div className="app-container px-[18px] py-6 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/log')} className="w-[34px] h-[34px] bg-secondary border border-border rounded-[10px] flex items-center justify-center text-foreground text-sm">
          ←
        </button>
        <span className="text-[26px] text-foreground">Log match</span>
      </div>

      {/* Performance Band Preview */}
      {(() => {
        const band = rating !== null ? getRatingBand(rating) : null;
        return (
          <div className="rounded-[18px] p-5 mb-5" style={{ background: 'rgba(200,242,90,0.06)', border: '1px solid rgba(200,242,90,0.18)' }}>
            <p className="section-label mb-2">Performance Band</p>
            <p className="text-[48px] leading-none font-light" style={{ color: band?.color || 'rgba(255,255,255,0.22)' }}>
              {band ? band.label : '–'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {band ? 'Updates live as you fill in the form' : 'Select your position and fill in the form'}
            </p>
          </div>
        );
      })()}

      <div className="space-y-5">
        {/* Position */}
        <Section label="Position">
          <div className="grid grid-cols-2 gap-1.5">
            {POSITIONS.map(p => (
              <SelectCard key={p} selected={position === p} onClick={() => handlePositionChange(p)} label={p} />
            ))}
          </div>
        </Section>

        {/* Competition */}
        <Section label="Competition">
          <div className="grid grid-cols-3 gap-1.5">
            {COMPETITIONS.map(c => (
              <SelectCard key={c} selected={competition === c} onClick={() => setCompetition(c)} label={c} />
            ))}
          </div>
        </Section>

        {/* Venue */}
        <Section label="Venue">
          <div className="grid grid-cols-2 gap-1.5">
            {VENUES.map(v => (
              <SelectCard key={v} selected={venue === v} onClick={() => setVenue(v)} label={v} />
            ))}
          </div>
        </Section>

        {/* Score */}
        <Section label="Final Score">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <label className="section-label block mb-1">Your team</label>
              <input type="number" min={0} value={teamScore}
                onChange={e => setTeamScore(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-card border border-border rounded-[10px] p-3 text-center text-3xl text-foreground outline-none focus:border-primary" />
            </div>
            <span className="text-2xl text-muted-foreground mt-5">–</span>
            <div>
              <label className="section-label block mb-1">Opponent</label>
              <input type="number" min={0} value={opponentScore}
                onChange={e => setOpponentScore(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-card border border-border rounded-[10px] p-3 text-center text-3xl text-foreground outline-none focus:border-primary" />
            </div>
          </div>
        </Section>

        {/* Age Group */}
        <Section label="Age Group">
          <div className="flex gap-1.5">
            {MATCH_AGE_GROUPS.map(a => (
              <SelectCard key={a} selected={ageGroup === a} onClick={() => setAgeGroup(a)} label={a} className="flex-1 text-xs" />
            ))}
          </div>
        </Section>

        {/* Minutes Played */}
        <Section label={`Minutes Played (max ${maxMinutes})`}>
          <Input type="number" min={0} max={maxMinutes} value={minutesPlayed}
            onChange={e => { const v = e.target.value === '' ? '' : Math.min(parseInt(e.target.value), maxMinutes); setMinutesPlayed(v); }}
            className="bg-card border-border" placeholder={`0–${maxMinutes}`} />
        </Section>

        {/* Card */}
        <Section label="Card Received">
          <div className="grid grid-cols-3 gap-1.5">
            {CARDS.map(c => (
              <SelectCard key={c} selected={cardReceived === c} onClick={() => setCardReceived(c)} label={c}
                className={c === 'Yellow' && cardReceived === c ? '!border-gold !text-gold' : c === 'Red' && cardReceived === c ? '!border-destructive !text-destructive' : ''} />
            ))}
          </div>
        </Section>

        {/* Body Condition */}
        <Section label="Body Condition">
          <div className="grid grid-cols-4 gap-1.5">
            {BODY_CONDITIONS.map(bc => (
              <SelectCard key={bc.label} selected={bodyCondition === bc.label} onClick={() => setBodyCondition(bc.label)} label={`${bc.emoji}\n${bc.label}`} />
            ))}
          </div>
        </Section>

        {/* Self-Rating */}
        <Section label="Overall Self-Rating">
          <div className="grid grid-cols-2 gap-1.5">
            {SELF_RATINGS.map(r => (
              <SelectCard key={r} selected={selfRating === r} onClick={() => setSelfRating(r)} label={r} />
            ))}
          </div>
        </Section>

        {/* Goals & Assists — not for GK */}
        {showGoalsAssists && (
          <Section label="Goals & Assists">
            <div className="grid grid-cols-3 gap-2">
              <StatInput label="Goals" value={goals} disabled={!scoresFilled} max={maxGoalContributions}
                onChange={v => { if (v !== '' && assists !== '' && v + Number(assists) > maxGoalContributions) return; setGoals(v); }} />
              <StatInput label="Assists" value={assists} disabled={!scoresFilled} max={maxGoalContributions}
                onChange={v => { if (v !== '' && goals !== '' && Number(goals) + v > maxGoalContributions) return; setAssists(v); }} />
            </div>
            {!scoresFilled && <p className="text-[10px] text-muted-foreground mt-2">Enter both scores to unlock goals & assists</p>}
          </Section>
        )}

        {/* GK: Penalties Faced/Saved */}
        {position === 'Goalkeeper' && (
          <Section label="Penalties">
            <div className="grid grid-cols-2 gap-2">
              <StatInput label="Pen. Faced" value={positionInputs['penFaced'] as number | '' ?? ''} disabled={false} max={20}
                onChange={v => {
                  setPosInput('penFaced', v);
                  if (v !== '' && positionInputs['penSaved'] !== '' && Number(positionInputs['penSaved']) > Number(v)) {
                    setPosInput('penSaved', v);
                  }
                }} />
              <StatInput label="Pen. Saved" value={positionInputs['penSaved'] as number | '' ?? ''} disabled={false}
                max={positionInputs['penFaced'] !== '' ? Number(positionInputs['penFaced']) : 20}
                onChange={v => setPosInput('penSaved', v)} />
            </div>
          </Section>
        )}

        {/* Position-specific questions */}
        {position && posQuestions.length > 0 && (
          <>
            <div className="border-t border-border pt-4">
              <p className="text-[13px] text-primary mb-3 tracking-wide">📋 {position} Questions</p>
            </div>
            {posQuestions.map(q => {
              if (q.id === 'midrole') {
                return (
                  <Section key={q.id} label={q.label}>
                    <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${q.cols || q.options.length}, 1fr)` }}>
                      {q.options.map(opt => (
                        <SelectCard key={opt} selected={positionInputs[q.id] === opt} onClick={() => setPosInput(q.id, opt)} label={opt} />
                      ))}
                    </div>
                  </Section>
                );
              }
              return (
                <Section key={q.id} label={q.label}>
                  <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${q.cols || q.options.length}, 1fr)` }}>
                    {q.options.map(opt => (
                      <SelectCard key={opt} selected={positionInputs[q.id] === opt} onClick={() => setPosInput(q.id, opt)} label={opt} />
                    ))}
                  </div>
                </Section>
              );
            })}
          </>
        )}

        {/* Midfielder sub-role questions */}
        {position === 'Midfielder' && midRoleKey && midSubQuestions.length > 0 && (
          <>
            {midSubQuestions.map(q => (
              <Section key={q.id} label={q.label}>
                <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${q.cols || q.options.length}, 1fr)` }}>
                  {q.options.map(opt => (
                    <SelectCard key={opt} selected={positionInputs[q.id] === opt} onClick={() => setPosInput(q.id, opt)} label={opt} />
                  ))}
                </div>
              </Section>
            ))}
          </>
        )}

        <button onClick={handleSave} disabled={!canSave || saving}
          className="w-full rounded-[10px] py-4 bg-primary text-primary-foreground text-[15px] font-medium transition-all active:scale-[0.98] disabled:opacity-40">
          {saving ? 'Saving...' : 'Save & Calculate Rating →'}
        </button>
      </div>
    </div>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="section-label mb-2">{label}</p>
    {children}
  </div>
);

const SelectCard = ({ selected, onClick, label, className = '' }: { selected: boolean; onClick: () => void; label: string; className?: string }) => (
  <button onClick={onClick}
    className={`border rounded-lg px-2 py-2.5 text-[11px] font-medium transition-colors whitespace-pre-line
      ${selected ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}
      ${className}`}>
    {label}
  </button>
);

const StatInput = ({ label, value, disabled, max, onChange }: {
  label: string; value: number | ''; disabled: boolean; max: number;
  onChange: (v: number | '') => void;
}) => (
  <div className={`bg-card border border-border rounded-[10px] p-3 text-center ${disabled ? 'opacity-40' : ''}`}>
    <p className="section-label mb-1.5">{label}</p>
    <input type="number" min={0} max={max} value={value} disabled={disabled}
      onChange={e => onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
      className="bg-transparent border-none outline-none w-full text-center text-2xl text-foreground" />
  </div>
);

export default MatchLog;
