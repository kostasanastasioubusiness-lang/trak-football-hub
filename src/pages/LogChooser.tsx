import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const LogChooser = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  return (
    <div className="app-container px-4 py-6">
      <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">
        ← Back
      </button>
      <h1 className="text-2xl font-heading text-foreground mb-1">Log Activity</h1>
      <p className="text-muted-foreground text-sm mb-6">What would you like to log?</p>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => navigate('/log/match')}
          className="bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 transition-colors"
        >
          <span className="text-3xl mb-3 block">⚽</span>
          <h2 className="font-heading text-lg text-foreground mb-1">Match</h2>
          <p className="text-xs text-muted-foreground">Log a competitive or friendly match</p>
        </button>

        <button
          className="bg-card border border-border rounded-xl p-6 text-left opacity-50 cursor-not-allowed"
          disabled
        >
          <span className="text-3xl mb-3 block">🏋️</span>
          <h2 className="font-heading text-lg text-foreground mb-1">Training</h2>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </button>
      </div>
    </div>
  );
};

export default LogChooser;
