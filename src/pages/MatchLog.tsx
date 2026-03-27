import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { POSITIONS } from '@/lib/constants';
import {
  MATCH_AGE_GROUPS, COMPETITIONS, VENUES, CARDS, BODY_CONDITIONS, SELF_RATINGS,
  AGE_GROUP_MAX_MINUTES, computeRating, type MatchInputs,
} from '@/lib/rating';

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

  const inputs: MatchInputs = {
    position, competition, venue, teamScore, opponentScore,
    ageGroup, minutesPlayed, cardReceived, bodyCondition, selfRating,
    goals, assists,
  };

  const rating = useMemo(() => computeRating(inputs), [
    position, competition, venue, teamScore, opponentScore,
    ageGroup, minutesPlayed, cardReceived, bodyCondition, selfRating, goals, assists,
  ]);

  const maxMinutes = ageGroup ? AGE_GROUP_MAX_MINUTES[ageGroup] || 90 : 90;
  const scoresFilled = teamScore !== '' && opponentScore !== '';
  const maxGoalContributions = scoresFilled ? Number(teamScore) : 0;

  const canSave = position && competition && venue && scoresFilled && ageGroup && minutesPlayed !== '';

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('matches').insert({
        user_id: user.id,
        position,
        competition,
        venue,
        team_score: Number(teamScore),
        opponent_score: Number(opponentScore),
        age_group: ageGroup,
        minutes_played: Number(minutesPlayed),
        card_received: cardReceived,
        body_condition: bodyCondition || null,
        self_rating: selfRating || null,
        goals: goals !== '' ? Number(goals) : 0,
        assists: assists !== '' ? Number(assists) : 0,
        computed_rating: rating ?? 6.5,
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

  return (
    <div className="app-container px-4 py-6 pb-8">
      <button onClick={() => navigate('/log')} className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-foreground">Log Match</h1>
          <p className="text-muted-foreground text-xs">Fill in your match details</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-heading text-primary">{rating !== null ? rating.toFixed(1) : '—'}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Position */}
        <Section label="Position">
          <div className="grid grid-cols-4 gap-2">
            {POSITIONS.map(p => (
              <SelectCard key={p} selected={position === p} onClick={() => setPosition(p)} label={p} />
            ))}
          </div>
        </Section>

        {/* Competition */}
        <Section label="Competition">
          <div className="grid grid-cols-2 gap-2">
            {COMPETITIONS.map(c => (
              <SelectCard key={c} selected={competition === c} onClick={() => setCompetition(c)} label={c} />
            ))}
          </div>
        </Section>

        {/* Venue */}
        <Section label="Venue">
          <div className="grid grid-cols-2 gap-2">
            {VENUES.map(v => (
              <SelectCard key={v} selected={venue === v} onClick={() => setVenue(v)} label={v} />
            ))}
          </div>
        </Section>

        {/* Score */}
        <Section label="Final Score">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Your team</label>
              <Input
                type="number" min={0} value={teamScore}
                onChange={e => setTeamScore(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="bg-card text-center"
              />
            </div>
            <span className="text-muted-foreground font-heading text-lg mt-4">–</span>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Opponent</label>
              <Input
                type="number" min={0} value={opponentScore}
                onChange={e => setOpponentScore(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="bg-card text-center"
              />
            </div>
          </div>
        </Section>

        {/* Age Group */}
        <Section label="Age Group">
          <div className="flex gap-2">
            {MATCH_AGE_GROUPS.map(a => (
              <SelectCard key={a} selected={ageGroup === a} onClick={() => setAgeGroup(a)} label={a} className="flex-1 text-xs" />
            ))}
          </div>
        </Section>

        {/* Minutes Played */}
        <Section label={`Minutes Played (max ${maxMinutes})`}>
          <Input
            type="number" min={0} max={maxMinutes} value={minutesPlayed}
            onChange={e => {
              const v = e.target.value === '' ? '' : Math.min(parseInt(e.target.value), maxMinutes);
              setMinutesPlayed(v);
            }}
            className="bg-card"
            placeholder={`0–${maxMinutes}`}
          />
        </Section>

        {/* Card Received */}
        <Section label="Card Received">
          <div className="grid grid-cols-3 gap-2">
            {CARDS.map(c => (
              <SelectCard
                key={c} selected={cardReceived === c} onClick={() => setCardReceived(c)} label={c}
                className={c === 'Yellow' && cardReceived === c ? '!border-gold !text-gold' : c === 'Red' && cardReceived === c ? '!border-destructive !text-destructive' : ''}
              />
            ))}
          </div>
        </Section>

        {/* Body Condition */}
        <Section label="Body Condition">
          <div className="grid grid-cols-4 gap-2">
            {BODY_CONDITIONS.map(bc => (
              <SelectCard key={bc.label} selected={bodyCondition === bc.label} onClick={() => setBodyCondition(bc.label)} label={`${bc.emoji}\n${bc.label}`} />
            ))}
          </div>
        </Section>

        {/* Self-Rating */}
        <Section label="Overall Self-Rating">
          <div className="grid grid-cols-2 gap-2">
            {SELF_RATINGS.map(r => (
              <SelectCard key={r} selected={selfRating === r} onClick={() => setSelfRating(r)} label={r} />
            ))}
          </div>
        </Section>

        {/* Goals & Assists */}
        <Section label="Goals & Assists">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Goals</label>
              <Input
                type="number" min={0} max={maxGoalContributions}
                value={goals}
                onChange={e => {
                  const v = e.target.value === '' ? '' : parseInt(e.target.value);
                  if (v !== '' && assists !== '' && v + Number(assists) > maxGoalContributions) return;
                  setGoals(v);
                }}
                disabled={!scoresFilled}
                className={`bg-card ${!scoresFilled ? 'opacity-40' : ''}`}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Assists</label>
              <Input
                type="number" min={0} max={maxGoalContributions}
                value={assists}
                onChange={e => {
                  const v = e.target.value === '' ? '' : parseInt(e.target.value);
                  if (v !== '' && goals !== '' && Number(goals) + v > maxGoalContributions) return;
                  setAssists(v);
                }}
                disabled={!scoresFilled}
                className={`bg-card ${!scoresFilled ? 'opacity-40' : ''}`}
              />
            </div>
          </div>
          {!scoresFilled && (
            <p className="text-[10px] text-muted-foreground mt-1">Enter both scores to unlock goals & assists</p>
          )}
        </Section>

        <Button onClick={handleSave} disabled={!canSave || saving} className="w-full mt-4">
          {saving ? 'Saving...' : 'Save Match'}
        </Button>
      </div>
    </div>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">{label}</p>
    {children}
  </div>
);

const SelectCard = ({ selected, onClick, label, className = '' }: { selected: boolean; onClick: () => void; label: string; className?: string }) => (
  <button
    onClick={onClick}
    className={`border rounded-lg px-2 py-2.5 text-xs font-medium transition-colors whitespace-pre-line
      ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30'}
      ${className}`}
  >
    {label}
  </button>
);

export default MatchLog;
