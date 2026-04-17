import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard } from "@/components/layout/RouteGuard";

// Existing pages
import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";
import ParentInfoPage from "./pages/ParentInfoPage";
import ParentOnboarding from "./pages/ParentOnboarding";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

// Player pages
import PlayerHome from "./pages/player/PlayerHome";
import PlayerLogForm from "./pages/player/PlayerLogForm";
import PlayerResult from "./pages/player/PlayerResult";
import PlayerMatches from "./pages/player/PlayerMatches";
import PlayerMatchDetail from "./pages/player/PlayerMatchDetail";
import PlayerGoalsPage from "./pages/player/PlayerGoalsPage";
import PlayerMedals from "./pages/player/PlayerMedals";
import PlayerProfilePage from "./pages/player/PlayerProfilePage";
import PlayerPassport from "./pages/player/PlayerPassport";
import PlayerCard from "./pages/player/PlayerCard";

// Coach pages
import CoachHomePage from "./pages/coach/CoachHomePage";
import CoachSquadPage from "./pages/coach/CoachSquadPage";
import CoachAddPlayer from "./pages/coach/CoachAddPlayer";
import CoachAssessPage from "./pages/coach/CoachAssessPage";
import CoachSessionsPage from "./pages/coach/CoachSessionsPage";
import CoachAddSession from "./pages/coach/CoachAddSession";
import CoachProfilePage from "./pages/coach/CoachProfilePage";
import CoachPlayerProfilePage from "./pages/coach/CoachPlayerProfilePage";
import CoachRecognition from "./pages/coach/CoachRecognition";
import CoachQuickAssess from "./pages/coach/CoachQuickAssess";

// Parent pages
import ParentHome from "./pages/parent/ParentHome";
import ParentMatches from "./pages/parent/ParentMatches";
import ParentGoals from "./pages/parent/ParentGoals";
import ParentAlerts from "./pages/parent/ParentAlerts";
import ParentOnboardingFlow from "./pages/parent/ParentOnboardingFlow";

// Club pages
import ClubHome from "./pages/club/ClubHome";
import ClubSquads from "./pages/club/ClubSquads";
import ClubCoaches from "./pages/club/ClubCoaches";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding/parent" element={<ParentOnboardingFlow />} />
            <Route path="/onboarding/:role" element={<OnboardingPage />} />
            <Route path="/parent-info" element={<ParentInfoPage />} />
            <Route path="/parent-invite" element={<ParentOnboarding />} />

            {/* Player routes */}
            <Route path="/player/home" element={<RouteGuard allowedRole="player"><PlayerHome /></RouteGuard>} />
            <Route path="/player/log" element={<RouteGuard allowedRole="player"><PlayerLogForm /></RouteGuard>} />
            <Route path="/player/result" element={<RouteGuard allowedRole="player"><PlayerResult /></RouteGuard>} />
            <Route path="/player/matches" element={<RouteGuard allowedRole="player"><PlayerMatches /></RouteGuard>} />
            <Route path="/player/match/:id" element={<RouteGuard allowedRole="player"><PlayerMatchDetail /></RouteGuard>} />
            <Route path="/player/goals" element={<RouteGuard allowedRole="player"><PlayerGoalsPage /></RouteGuard>} />
            <Route path="/player/medals" element={<RouteGuard allowedRole="player"><PlayerMedals /></RouteGuard>} />
            <Route path="/player/profile" element={<RouteGuard allowedRole="player"><PlayerProfilePage /></RouteGuard>} />
            <Route path="/player/passport" element={<RouteGuard allowedRole="player"><PlayerPassport /></RouteGuard>} />
            <Route path="/player/card" element={<RouteGuard allowedRole="player"><PlayerCard /></RouteGuard>} />

            {/* Coach routes */}
            <Route path="/coach/home" element={<RouteGuard allowedRole="coach"><CoachHomePage /></RouteGuard>} />
            <Route path="/coach/squad" element={<RouteGuard allowedRole="coach"><CoachSquadPage /></RouteGuard>} />
            <Route path="/coach/squad/add" element={<RouteGuard allowedRole="coach"><CoachAddPlayer /></RouteGuard>} />
            <Route path="/coach/assess" element={<RouteGuard allowedRole="coach"><CoachAssessPage /></RouteGuard>} />
            <Route path="/coach/sessions" element={<RouteGuard allowedRole="coach"><CoachSessionsPage /></RouteGuard>} />
            <Route path="/coach/sessions/add" element={<RouteGuard allowedRole="coach"><CoachAddSession /></RouteGuard>} />
            <Route path="/coach/profile" element={<RouteGuard allowedRole="coach"><CoachProfilePage /></RouteGuard>} />
            <Route path="/coach/player/:id" element={<RouteGuard allowedRole="coach"><CoachPlayerProfilePage /></RouteGuard>} />
            <Route path="/coach/recognition" element={<RouteGuard allowedRole="coach"><CoachRecognition /></RouteGuard>} />
            <Route path="/coach/quick-assess" element={<RouteGuard allowedRole="coach"><CoachQuickAssess /></RouteGuard>} />

            {/* Parent routes */}
            <Route path="/parent/home" element={<RouteGuard allowedRole="parent"><ParentHome /></RouteGuard>} />
            <Route path="/parent/matches" element={<RouteGuard allowedRole="parent"><ParentMatches /></RouteGuard>} />
            <Route path="/parent/goals" element={<RouteGuard allowedRole="parent"><ParentGoals /></RouteGuard>} />
            <Route path="/parent/alerts" element={<RouteGuard allowedRole="parent"><ParentAlerts /></RouteGuard>} />

            {/* Club admin routes */}
            <Route path="/club/home" element={<ClubHome />} />
            <Route path="/club/squads" element={<ClubSquads />} />
            <Route path="/club/coaches" element={<ClubCoaches />} />

            {/* Legacy redirects for old routes */}
            <Route path="/dashboard" element={<PlayerHome />} />
            <Route path="/log" element={<PlayerLogForm />} />
            <Route path="/log/match" element={<PlayerLogForm />} />
            <Route path="/profile" element={<PlayerProfilePage />} />
            <Route path="/goals" element={<PlayerGoalsPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
