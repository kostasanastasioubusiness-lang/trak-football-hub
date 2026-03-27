import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import PlayerHome from '@/components/player/PlayerHome';

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/');
    if (!loading && user && !user.email_confirmed_at && profile?.role !== 'parent') {
      navigate('/');
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setTimedOut(true), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    if (loading || !user || profile) return;

    const role = (user.user_metadata as any)?.trak_onboarding?.role;
    if (role === 'player' || role === 'coach') {
      navigate(`/onboarding/${role}`, { replace: true });
    }
  }, [loading, user, profile, navigate]);

  if (loading && timedOut) {
    return (
      <div className="app-container flex flex-col items-center justify-center min-h-screen text-foreground gap-4 px-6">
        <p className="text-sm text-muted-foreground text-center">We couldn't load your profile in time. Please try again.</p>
        <Button onClick={() => window.location.reload()} variant="default" size="sm">Retry</Button>
        <Button onClick={signOut} variant="ghost" size="sm" className="text-xs text-muted-foreground">Sign Out</Button>
      </div>
    );
  }

  if (loading) return <div className="app-container flex items-center justify-center min-h-screen text-foreground">Loading...</div>;

  // No profile exists and no pending data — user needs to complete onboarding
  if (!profile) {
    return (
      <div className="app-container flex flex-col items-center justify-center min-h-screen text-foreground gap-4 px-6">
        <p className="text-muted-foreground text-sm text-center">Profile setup couldn't be completed automatically.</p>
        <Button onClick={() => window.location.reload()} variant="default" size="sm">Retry</Button>
        <Button onClick={signOut} variant="ghost" size="sm" className="text-xs text-muted-foreground">Sign Out</Button>
      </div>
    );
  }

  if (profile.role === 'player') return <PlayerHome />;

  const roleConfig: Record<string, { title: string; color: string; emoji: string }> = {
    coach: { title: 'Coach Dashboard', color: 'text-coach-orange', emoji: '📋' },
    parent: { title: 'Parent Dashboard', color: 'text-gold', emoji: '👨‍👩‍👦' },
  };
  const config = roleConfig[profile.role] || roleConfig.coach;

  return (
    <div className="app-container px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Welcome back</p>
          <h1 className={`text-2xl font-heading ${config.color}`}>{profile.full_name}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground text-xs">Sign Out</Button>
      </div>
      <div className="bg-card rounded-lg p-4 border border-border mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.emoji}</span>
          <div>
            <h2 className="font-heading text-lg text-foreground">{config.title}</h2>
            <p className="text-xs text-muted-foreground capitalize">{profile.role} account</p>
          </div>
        </div>
      </div>
      {profile.role === 'coach' && <CoachDashboard />}
      {profile.role === 'parent' && <ParentDashboard />}
    </div>
  );
};

const CoachDashboard = () => (
  <div className="space-y-4">
    {['Squad Overview', 'Player Ratings', 'Training Sessions', 'Match Planning'].map(item => (
      <div key={item} className="bg-card rounded-lg p-4 border border-border">
        <h3 className="font-heading text-sm text-coach-orange mb-1">{item}</h3>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </div>
    ))}
  </div>
);

const ParentDashboard = () => (
  <div className="space-y-4">
    {['Player Progress', 'Match Results', 'Development Reports', 'Schedule'].map(item => (
      <div key={item} className="bg-card rounded-lg p-4 border border-border">
        <h3 className="font-heading text-sm text-gold mb-1">{item}</h3>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </div>
    ))}
  </div>
);

export default Dashboard;
