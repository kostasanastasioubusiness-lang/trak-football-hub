import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  EUROPEAN_COUNTRIES, POSITIONS, AGE_GROUPS, COACH_ROLES,
  DAYS, MONTHS, YEARS
} from '@/lib/constants';
import { Mail, RefreshCw } from 'lucide-react';

type Role = 'player' | 'coach';

const EmailConfirmationScreen = ({ email }: { email: string }) => {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResent(true);
      toast.success('Confirmation email resent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-6">
        <Mail className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-heading text-foreground mb-2">Check your email</h2>
      <p className="text-sm text-muted-foreground mb-2">
        We sent a confirmation link to
      </p>
      <p className="text-sm font-semibold text-foreground mb-6">{email}</p>
      <p className="text-xs text-muted-foreground mb-8">
        Click the link to activate your account and get started.
      </p>
      <Button
        variant="outline"
        onClick={handleResend}
        disabled={resending || resent}
        className="w-full gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
        {resent ? 'Email resent' : resending ? 'Resending...' : 'Resend confirmation email'}
      </Button>
      <a href="/" className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors">
        ← Back to home
      </a>
    </div>
  );
};

const OnboardingPage = () => {
  const { role } = useParams<{ role: string }>();
  const validRole = (role === 'player' || role === 'coach') ? role as Role : null;

  if (!validRole) return <div className="app-container p-6 text-foreground">Invalid role</div>;

  return (
    <div className="app-container px-6 py-8">
      <a href="/" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">
        ← Back
      </a>
      <h1 className="text-2xl font-heading text-foreground mb-1">
        {validRole === 'player' ? 'Player' : 'Coach'} Registration
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Create your Trak account</p>
      {validRole === 'player' ? <PlayerOnboarding /> : <CoachOnboarding />}
    </div>
  );
};

const PlayerOnboarding = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');

  // Step 1
  const [name, setName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [nationality, setNationality] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [position, setPosition] = useState('');
  const [club, setClub] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [shirtNumber, setShirtNumber] = useState('');

  // Step 3 - parent invite
  const [parentEmail, setParentEmail] = useState('');

  const handleStep1 = () => {
    if (!name || !dobDay || !dobMonth || !dobYear || !nationality || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields'); return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setStep(2);
  };

  const handleStep2 = () => {
    if (!position || !club || !ageGroup) {
      toast.error('Please fill in all required fields'); return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { user, error } = await signUp(email, password);
      if (error || !user) throw error || new Error('Signup failed');

      const monthIndex = MONTHS.indexOf(dobMonth) + 1;
      const dob = `${dobYear}-${String(monthIndex).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;

      await supabase.from('profiles').insert({
        user_id: user.id,
        role: 'player' as any,
        full_name: name,
        nationality,
      });

      await supabase.from('player_details').insert({
        user_id: user.id,
        date_of_birth: dob,
        position,
        current_club: club,
        age_group: ageGroup,
        shirt_number: shirtNumber ? parseInt(shirtNumber) : null,
      });

      if (parentEmail) {
        await supabase.from('parent_invites').insert({
          player_user_id: user.id,
          parent_email: parentEmail,
        });
      }

      setFirstName(name.split(' ')[0]);
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Step indicator */}
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <>
          <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="bg-card" />
          <p className="text-xs text-muted-foreground">Date of Birth</p>
          <div className="grid grid-cols-3 gap-2">
            <select value={dobDay} onChange={e => setDobDay(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="">Day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={dobYear} onChange={e => setDobYear(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <select value={nationality} onChange={e => setNationality(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="">Select nationality</option>
            {EUROPEAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-card" />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-card" />
          <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-card" />
          <Button onClick={handleStep1} className="w-full mt-2">Next</Button>
        </>
      )}

      {step === 2 && (
        <>
          <select value={position} onChange={e => setPosition(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="">Select position</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input placeholder="Current club" value={club} onChange={e => setClub(e.target.value)} className="bg-card" />
          <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="">Select age group</option>
            {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <Input type="number" placeholder="Shirt number (optional)" value={shirtNumber} onChange={e => setShirtNumber(e.target.value)} className="bg-card" />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={handleStep2} className="flex-1">Next</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            Want to invite a parent to follow your journey? Enter their email below (optional).
          </p>
          <Input type="email" placeholder="Parent's email (optional)" value={parentEmail} onChange={e => setParentEmail(e.target.value)} className="bg-card" />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </>
      )}

      {step === 4 && (
        <EmailConfirmationScreen email={email} />
      )}
    </div>
  );
};

const CoachOnboarding = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastName, setLastName] = useState('');

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [club, setClub] = useState('');
  const [team, setTeam] = useState('');
  const [coachRole, setCoachRole] = useState('');

  const handleStep1 = () => {
    if (!name || !nationality || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields'); return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!club || !team || !coachRole) {
      toast.error('Please fill in all fields'); return;
    }
    setLoading(true);
    try {
      const { user, error } = await signUp(email, password);
      if (error || !user) throw error || new Error('Signup failed');

      await supabase.from('profiles').insert({
        user_id: user.id,
        role: 'coach' as any,
        full_name: name,
        nationality,
      });

      await supabase.from('coach_details').insert({
        user_id: user.id,
        current_club: club,
        team,
        coach_role: coachRole,
      });

      const parts = name.trim().split(' ');
      setLastName(parts[parts.length - 1]);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        {[1, 2].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <>
          <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="bg-card" />
          <select value={nationality} onChange={e => setNationality(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="">Select nationality</option>
            {EUROPEAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-card" />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-card" />
          <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-card" />
          <Button onClick={handleStep1} className="w-full mt-2">Next</Button>
        </>
      )}

      {step === 2 && (
        <>
          <Input placeholder="Current club" value={club} onChange={e => setClub(e.target.value)} className="bg-card" />
          <Input placeholder="Team name" value={team} onChange={e => setTeam(e.target.value)} className="bg-card" />
          <select value={coachRole} onChange={e => setCoachRole(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="">Select role</option>
            {COACH_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <EmailConfirmationScreen email={email} />
      )}
    </div>
  );
};

export default OnboardingPage;
