import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IconRolePlayer, IconRoleCoach, IconRoleParent, IconRoleClub } from '@/components/icons/TrakIcons';

const IS_DEV = import.meta.env.DEV;

const DEV_ACCOUNTS = [
  { role: 'coach',  label: 'Coach',  email: 'coach@trak.dev',  color: 'hsl(40,78%,60%)' },
  { role: 'player', label: 'Player', email: 'player@trak.dev', color: '#C8F25A' },
  { role: 'parent', label: 'Parent', email: 'parent@trak.dev', color: 'hsl(214,60%,57%)' },
  { role: 'club',   label: 'Admin',  email: 'club@trak.dev',   color: 'rgba(255,255,255,0.7)' },
] as const;

const DEV_PASSWORD = 'TrakDev123';

const LandingPage = () => {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState(false);
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const homeMap: Record<string, string> = { coach: '/coach/home', parent: '/parent/home', club: '/club/home' }
      const home = homeMap[profile?.role ?? ''] ?? '/player/home';
      navigate(home, { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const handleRoleSelect = (role: string) => {
    if (role === 'parent') {
      navigate('/parent-info');
    } else {
      navigate(`/onboarding/${role}`);
    }
  };

  return (
    <div className="app-container flex flex-col items-center justify-center min-h-screen px-6 py-10">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 blur-3xl opacity-15 bg-[#C8F25A]" />
          <span className="relative text-7xl text-foreground block leading-none tracking-tight font-light">TRAK</span>
        </div>
        <span className="text-primary italic text-lg tracking-[0.12em] block mt-1">football</span>
        <p className="text-muted-foreground text-sm mt-3 tracking-wide">Own your career.</p>
      </div>

      {!loginMode ? (
        <>
          <h2 className="section-label mb-5">
            Choose your account
          </h2>

          <div className="flex flex-col gap-2.5 w-full">
            <RoleCard
              icon={<IconRolePlayer size={28} />}
              name="Player"
              desc="Track your career, log matches, earn medals and set goals"
              bg="rgba(200,242,90,0.08)"
              border="rgba(200,242,90,0.18)"
              onClick={() => handleRoleSelect('player')}
            />
            <RoleCard
              icon={<IconRoleCoach size={28} />}
              name="Coach"
              desc="Manage your squad, track attendance and assess players"
              bg="rgba(96,165,250,0.08)"
              border="rgba(96,165,250,0.18)"
              onClick={() => handleRoleSelect('coach')}
            />
            <RoleCard
              icon={<IconRoleParent size={28} />}
              name="Parent"
              desc="Follow your child's development, see both ratings and progress"
              bg="rgba(74,222,128,0.08)"
              border="rgba(74,222,128,0.18)"
              onClick={() => handleRoleSelect('parent')}
            />
            <RoleCard
              icon={<IconRoleClub size={28} />}
              name="Administrator"
              desc="Read-only academy overview across all coaches and squads"
              bg="rgba(255,255,255,0.04)"
              border="rgba(255,255,255,0.12)"
              onClick={() => handleRoleSelect('club')}
            />
          </div>

          <button
            onClick={() => setLoginMode(true)}
            className="mt-8 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Already have an account? <span className="text-primary font-semibold">Sign in</span>
          </button>

          {IS_DEV && <DevLoginPanel />}
        </>
      ) : (
        <LoginForm onBack={() => setLoginMode(false)} />
      )}
    </div>
  );
};

const RoleCard = ({ icon, name, desc, bg, border, onClick }: {
  icon: React.ReactNode; name: string; desc: string; bg: string; border: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group w-full bg-card border border-border rounded-2xl p-[18px] flex items-center gap-4 text-left transition-all active:scale-[0.98] hover:border-primary/30"
  >
    <div
      className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center flex-shrink-0"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[22px] text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
    </div>
    <span className="text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
  </button>
);

const LoginForm = ({ onBack }: { onBack: () => void }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate('/player/home');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      <h2 className="text-lg mb-2 text-foreground">Sign in</h2>
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-card border-border" />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-card border-border" />
      <button type="button" onClick={async () => {
        if (!email) { toast.error('Enter your email first'); return }
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) toast.error(error.message)
        else toast.success('Password reset email sent!')
      }} className="text-xs text-primary self-end -mt-2">
        Forgot password?
      </button>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
      <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-primary">
        ← Back to role selection
      </button>
    </form>
  );
};

const DEV_PIN = '013';

const DevLoginPanel = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [busyRole, setBusyRole] = useState<string | null>(null);

  const handlePinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 3);
    setPin(digits);
    if (digits.length === 3) {
      if (digits === DEV_PIN) {
        setUnlocked(true);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); }, 600);
      }
    }
  };

  const loginAs = async (account: typeof DEV_ACCOUNTS[number]) => {
    setBusyRole(account.role);
    await supabase.auth.signOut();
    const { error } = await signIn(account.email, DEV_PASSWORD);
    if (error) {
      toast.error(`Dev login failed: ${error.message}`);
      setBusyRole(null);
    } else {
      navigate(`/${account.role}/home`, { replace: true });
    }
  };

  return (
    <div className="mt-10 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="text-[9px] font-medium tracking-[0.12em] text-white/25 uppercase"
          style={{ fontFamily: "'DM Mono', monospace" }}>Dev quick-login</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      {!unlocked ? (
        <div className="flex flex-col items-center gap-2">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => handlePinChange(e.target.value)}
            placeholder="PIN"
            maxLength={3}
            className={`w-20 text-center py-2 rounded-[10px] text-[18px] tracking-[0.3em] outline-none transition-all ${shake ? 'animate-shake' : ''}`}
            style={{
              background: shake ? 'rgba(255,80,80,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${shake ? 'rgba(255,80,80,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: "'DM Mono', monospace",
            }}
            autoComplete="off"
          />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Enter PIN to access
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {DEV_ACCOUNTS.map(account => (
              <button
                key={account.role}
                onClick={() => loginAs(account)}
                disabled={busyRole !== null}
                className="rounded-[10px] py-3 text-center text-[11px] font-semibold transition-opacity disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1.5px solid rgba(255,255,255,0.08)`,
                  color: account.color,
                }}
              >
                {busyRole === account.role ? '...' : account.label}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/dev-setup')}
            className="w-full text-[9px] text-white/25 hover:text-white/50 text-center mt-2 transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}>
            First time? Run setup → /dev-setup
          </button>
        </>
      )}
    </div>
  );
};

export default LandingPage;
