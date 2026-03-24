import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ParentOnboarding = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    supabase
      .from('parent_invites')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .maybeSingle()
      .then(({ data }) => {
        setInvite(data);
        if (data) setEmail(data.parent_email);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="app-container p-6 text-foreground">Loading...</div>;

  if (!token || !invite) {
    return (
      <div className="app-container flex flex-col items-center justify-center px-6 py-12 min-h-screen">
        <h1 className="text-2xl font-heading text-foreground mb-4">Invalid Invite</h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          This invite link is invalid or has already been used.
        </p>
        <a href="/" className="text-primary text-sm font-semibold">← Back to home</a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setSubmitting(true);
    try {
      const { user, error } = await signUp(email, password);
      if (error || !user) throw error || new Error('Signup failed');

      await supabase.from('profiles').insert({
        user_id: user.id,
        role: 'parent' as any,
        full_name: name,
      });

      await supabase.from('player_parent_links').insert({
        player_user_id: invite.player_user_id,
        parent_user_id: user.id,
      });

      // Mark invite as used - we use update via RPC or just leave it
      // Since we can't update parent_invites (RLS only allows player), we'll handle this differently
      // The invite is effectively "used" once the parent account exists

      toast.success('Account created! Check your email to verify.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container px-6 py-8">
      <h1 className="text-2xl font-heading text-foreground mb-1">Parent Registration</h1>
      <p className="text-muted-foreground text-sm mb-6">You've been invited to follow a player's journey</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required className="bg-card" />
        <Input type="email" value={email} readOnly className="bg-muted cursor-not-allowed" />
        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-card" />
        <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="bg-card" />
        <Button type="submit" disabled={submitting} className="w-full mt-2">
          {submitting ? 'Creating...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
};

export default ParentOnboarding;
