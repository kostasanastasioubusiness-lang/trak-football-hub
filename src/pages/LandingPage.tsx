import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CircleDot, ClipboardList, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState(false);
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const home = profile?.role === 'coach'
        ? '/coach/home'
        : profile?.role === 'parent'
          ? '/parent/home'
          : '/player/home';
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
              icon={<CircleDot size={24} className="text-[#C8F25A]" />}
              name="Player"
              desc="Track your career, log matches, earn medals and set goals"
              colorClass="bg-primary/20"
              onClick={() => handleRoleSelect('player')}
            />
            <RoleCard
              icon={<ClipboardList size={24} className="text-[hsl(40,78%,60%)]" />}
              name="Coach"
              desc="Manage your squad, track attendance and assess players"
              colorClass="bg-gold/15"
              onClick={() => handleRoleSelect('coach')}
            />
            <RoleCard
              icon={<Users size={24} className="text-[hsl(214,60%,57%)]" />}
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

const RoleCard = ({ icon, name, desc, colorClass, onClick }: {
  icon: React.ReactNode; name: string; desc: string; colorClass: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group w-full bg-card border border-border rounded-2xl p-[18px] flex items-center gap-4 text-left transition-all active:scale-[0.98] hover:border-primary/30"
  >
    <div className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center flex-shrink-0 ${colorClass}`}>
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

export default LandingPage;
