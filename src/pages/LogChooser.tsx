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
    <div className="app-container flex flex-col min-h-screen" style={{ background: 'hsl(222 47% 6%)' }}>
      <div className="flex-1 flex flex-col items-center justify-start pt-20 px-[18px] pb-24 text-center">
        <h1 className="font-heading text-[26px] font-black tracking-wider text-foreground mb-7">
          WHAT ARE YOU LOGGING?
        </h1>
        <div className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
          <button
            onClick={() => navigate('/log/match')}
            className="flex flex-col items-center justify-center gap-3 rounded-[18px] p-7 border border-primary/20 cursor-pointer transition-all active:scale-95 active:border-primary"
            style={{ background: 'linear-gradient(160deg, hsl(222 40% 10%) 0%, hsl(224 50% 17%) 100%)' }}
          >
            <span className="text-5xl">⚽</span>
            <div className="text-center">
              <p className="font-heading text-[22px] font-black text-foreground tracking-wide">MATCH</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Log a match and<br/>compute your rating</p>
            </div>
          </button>
          <button
            onClick={() => {}}
            className="flex flex-col items-center justify-center gap-3 rounded-[18px] p-7 border border-training-blue/15 cursor-pointer transition-all active:scale-95 active:border-training-blue"
            style={{ background: 'linear-gradient(160deg, hsl(222 40% 10%) 0%, hsl(222 45% 12%) 100%)' }}
          >
            <span className="text-5xl">🏃</span>
            <div className="text-center">
              <p className="font-heading text-[22px] font-black text-foreground tracking-wide">TRAINING</p>
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
