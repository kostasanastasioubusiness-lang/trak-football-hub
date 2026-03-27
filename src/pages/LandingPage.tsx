import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect } from 'react';

type Role = 'player' | 'coach' | 'parent';

const roles: { role: Role; label: string; desc: string; icon: React.ElementType }[] = [
  { role: 'player', label: 'Player', desc: 'Track your career, stats and development', icon: Users },
  { role: 'coach', label: 'Coach', desc: 'Manage your squad and rate performances', icon: ClipboardList },
  { role: 'parent', label: 'Parent', desc: 'Follow your child\'s football journey', icon: Heart },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  const handleRoleSelect = (role: Role) => {
    if (role === 'parent') {
      navigate('/parent-info');
    } else {
      navigate(`/onboarding/${role}`);
    }
  };

  return (
    <div className="app-container flex flex-col items-center px-6 py-12">
      {/* Logo */}
      <div className="mb-2 mt-8">
        <h1 className="text-5xl font-heading font-extrabold tracking-wider text-primary">
          TRAK
        </h1>
        <p className="text-center text-sm text-muted-foreground tracking-widest uppercase">
          Football
        </p>
      </div>

      <p className="text-muted-foreground text-center mt-4 mb-10 text-sm max-w-[280px]">
        Your career. Your data. Your journey.
      </p>

      {!loginMode ? (
        <>
          <h2 className="text-lg font-heading mb-6 text-foreground">I am a...</h2>

          <div className="flex flex-col gap-4 w-full">
            {roles.map(({ role, label, desc, icon: Icon }, i) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary transition-all duration-200 text-left group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-lg text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setLoginMode(true)}
            className="mt-10 text-sm text-muted-foreground hover:text-primary transition-colors"
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
      <h2 className="text-lg font-heading mb-2 text-foreground">Sign In</h2>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-card"
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="bg-card"
      />
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
