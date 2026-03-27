import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import PlayerHome from '@/components/player/PlayerHome';

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/');
    if (!loading && user && !user.email_confirmed_at && profile?.role !== 'parent') {
      navigate('/');
    }
  }, [loading, user, profile, navigate]);

  if (loading) return <div className="app-container flex items-center justify-center min-h-screen text-foreground">Loading...</div>;
  if (!profile) return <div className="app-container flex items-center justify-center min-h-screen text-foreground">Loading profile...</div>;

  if (profile.role === 'player') return <PlayerHome />;

  // Coach and Parent dashboards remain as placeholders
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
