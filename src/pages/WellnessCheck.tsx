import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SLEEP_OPTIONS = [
  { emoji: '😴', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'OK', value: 'ok' },
  { emoji: '😩', label: 'Poor', value: 'poor' },
];

const ENERGY_OPTIONS = [
  { emoji: '⚡', label: 'High', value: 'high' },
  { emoji: '🔋', label: 'Good', value: 'good' },
  { emoji: '🪫', label: 'Low', value: 'low' },
  { emoji: '😶', label: 'Drained', value: 'drained' },
];

const MOOD_OPTIONS = [
  { emoji: '😁', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Meh', value: 'meh' },
  { emoji: '😔', label: 'Low', value: 'low' },
];

const WellnessCheck = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sleep, setSleep] = useState('');
  const [energy, setEnergy] = useState('');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = sleep && energy && mood;

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('wellness_logs').insert({
        user_id: user.id,
        sleep_quality: sleep,
        energy,
        mood,
        notes: notes || null,
      });
      if (error) throw error;
      toast.success('Wellness logged! 💪');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container px-[18px] py-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="w-[34px] h-[34px] bg-secondary border border-white/5 rounded-[10px] flex items-center justify-center text-foreground text-sm">←</button>
        <span className="font-heading text-[26px] font-black tracking-wider text-foreground">WELLNESS</span>
      </div>

      <p className="text-sm text-muted-foreground mb-6">How are you feeling today? This helps track your readiness and recovery.</p>

      {/* Sleep Quality */}
      <Section label="Sleep Quality">
        <EmojiGrid options={SLEEP_OPTIONS} selected={sleep} onSelect={setSleep} />
      </Section>

      {/* Energy Level */}
      <Section label="Energy Level">
        <EmojiGrid options={ENERGY_OPTIONS} selected={energy} onSelect={setEnergy} />
      </Section>

      {/* Mood */}
      <Section label="Mood">
        <EmojiGrid options={MOOD_OPTIONS} selected={mood} onSelect={setMood} />
      </Section>

      {/* Notes */}
      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Notes <span className="text-[10px] font-normal">(optional)</span></p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full bg-card border border-white/5 rounded-[10px] p-3 text-sm text-foreground outline-none focus:border-primary resize-none"
          rows={3}
          placeholder="e.g. Slept late, feeling stiff from yesterday's session..."
        />
      </div>

      {/* Summary */}
      {canSave && (
        <div className="rounded-[10px] p-4 mb-4 border border-primary/20 bg-primary/5">
          <p className="text-[10px] font-bold tracking-wider uppercase text-primary mb-2">Today's Check-in</p>
          <div className="flex items-center gap-4 text-sm">
            <span>😴 {SLEEP_OPTIONS.find(o => o.value === sleep)?.label}</span>
            <span>⚡ {ENERGY_OPTIONS.find(o => o.value === energy)?.label}</span>
            <span>😁 {MOOD_OPTIONS.find(o => o.value === mood)?.label}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="w-full rounded-[10px] py-4 text-white font-heading text-[15px] font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, hsl(224 85% 35%), hsl(224 85% 53%))' }}
      >
        {saving ? 'Saving...' : 'Log Wellness →'}
      </button>
    </div>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mb-2">{label}</p>
    {children}
  </div>
);

const EmojiGrid = ({ options, selected, onSelect }: {
  options: { emoji: string; label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) => (
  <div className="grid grid-cols-4 gap-2">
    {options.map(o => (
      <button
        key={o.value}
        onClick={() => onSelect(o.value)}
        className={`flex flex-col items-center gap-1.5 rounded-xl py-3 border transition-all active:scale-95 ${
          selected === o.value
            ? 'border-primary bg-primary/15 shadow-[0_0_12px_rgba(37,99,235,0.15)]'
            : 'border-white/5 bg-card hover:border-white/10'
        }`}
      >
        <span className="text-2xl">{o.emoji}</span>
        <span className={`text-[11px] font-semibold ${selected === o.value ? 'text-primary' : 'text-muted-foreground'}`}>{o.label}</span>
      </button>
    ))}
  </div>
);

export default WellnessCheck;
