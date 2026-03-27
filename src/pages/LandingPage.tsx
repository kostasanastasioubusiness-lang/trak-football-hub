import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const LandingPage = () => {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

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
      <div className="mb-8 text-center">
        <span className="font-heading text-7xl font-black tracking-tight text-foreground block leading-none">TRAK</span>
        <span className="text-primary italic text-lg tracking-[0.12em] font-body block mt-1">football</span>
        <p className="text-muted-foreground text-sm mt-3 tracking-wide">Own your career.</p>
      </div>

      {!loginMode ? (
        <>
          <h2 className="font-heading text-[15px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-5">
            Choose your account
          </h2>

          <div className="flex flex-col gap-2.5 w-full">
            <RoleCard
              emoji="⚽"
              name="Player"
              desc="Track your career, log matches, earn medals and set goals"
              colorClass="bg-primary/20"
              onClick={() => handleRoleSelect('player')}
            />
            <RoleCard
              emoji="📋"
              name="Coach"
              desc="Manage your squad, track attendance and assess players"
              colorClass="bg-gold/15"
              onClick={() => handleRoleSelect('coach')}
            />
            <RoleCard
              emoji="👨‍👩‍👦"
              name="Parent"
              desc="Follow your child's development, see both ratings and progress"
              colorClass="bg-training-blue/15"
              onClick={() => handleRoleSelect('parent')}
            />
          </div>

          <button
            onClick={() => setLoginMode(true)}
            className="mt-8 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Already have an account? <span className="text-primary font-semibold">Sign in</span>
          </button>
        </>
      ) : (
        <LoginForm onBack={() => setLoginMode(false)} />
      )}
    </div>
  );
};

const RoleCard = ({ emoji, name, desc, colorClass, onClick }: {
  emoji: string; name: string; desc: string; colorClass: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full bg-card border border-white/5 rounded-2xl p-[18px] flex items-center gap-4 text-left transition-all active:scale-[0.98] hover:border-primary/30"
  >
    <div className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0 ${colorClass}`}>
      {emoji}
    </div>
    <div className="flex-1">
      <p className="font-heading text-[22px] font-black tracking-wide text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
    </div>
    <span className="text-lg text-muted-foreground">→</span>
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
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      <h2 className="text-lg font-heading mb-2 text-foreground">SIGN IN</h2>
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-card border-white/5" />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-card border-white/5" />
      <Button type="submit" disabled={loading} className="w-full" style={{ background: 'linear-gradient(135deg, hsl(224 85% 35%) 0%, hsl(224 85% 53%) 100%)' }}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
      <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-primary">
        ← Back to role selection
      </button>
    </form>
  );
};

export default LandingPage;
