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
    <div className="app-container flex flex-col min-h-screen bg-background">
      <div className="flex-1 flex flex-col items-center justify-start pt-20 px-[18px] pb-24 text-center">
        <h1 className="text-[26px] text-foreground mb-7">
          What are you logging?
        </h1>
        <div className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
          <button
            onClick={() => navigate('/log/match')}
            className="flex flex-col items-center justify-center gap-3 rounded-[18px] p-7 border border-primary/20 cursor-pointer transition-all active:scale-95 active:border-primary bg-card"
          >
            <span className="text-5xl">⚽</span>
            <div className="text-center">
              <p className="text-[22px] text-foreground">Match</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Log a match and<br/>compute your rating</p>
            </div>
          </button>
          <button
            onClick={() => {}}
            className="flex flex-col items-center justify-center gap-3 rounded-[18px] p-7 border border-training-blue/15 cursor-pointer transition-all active:scale-95 active:border-training-blue bg-card"
          >
            <span className="text-5xl">🏃</span>
            <div className="text-center">
              <p className="text-[22px] text-foreground">Training</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Log a session and<br/>track your progress</p>
            </div>
          </button>
        </div>
        <div className="absolute bottom-24 left-0 right-0 flex justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-muted-foreground px-8 py-2.5 bg-secondary rounded-xl"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogChooser;
