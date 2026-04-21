import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { ErrorBoundary } from "@/components/trak/ErrorBoundary";
import { DevSwitcher } from "@/components/trak/DevSwitcher";

// Existing pages
import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";
import ParentInfoPage from "./pages/ParentInfoPage";
import ParentOnboarding from "./pages/ParentOnboarding";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import DevSetupPage from "./pages/DevSetupPage";

// Player pages
import PlayerHome from "./pages/player/PlayerHome";
import PlayerMatches from "./pages/player/PlayerMatches";
import PlayerMatchDetail from "./pages/player/PlayerMatchDetail";
import PlayerProfilePage from "./pages/player/PlayerProfilePage";
import PlayerPassport from "./pages/player/PlayerPassport";
import PlayerCard from "./pages/player/PlayerCard";
import PlayerEvolutionCard from "./pages/player/PlayerEvolutionCard";

// Coach pages
import CoachHomePage from "./pages/coach/CoachHomePage";
import CoachSquadPage from "./pages/coach/CoachSquadPage";
import CoachAddPlayer from "./pages/coach/CoachAddPlayer";
import CoachAssessPage from "./pages/coach/CoachAssessPage";
import CoachSessionsPage from "./pages/coach/CoachSessionsPage";
import CoachAddSession from "./pages/coach/CoachAddSession";
import CoachSessionsChooser from "./pages/coach/CoachSessionsChooser";
import CoachQuickMatchLog from "./pages/coach/CoachQuickMatchLog";
import CoachProfilePage from "./pages/coach/CoachProfilePage";
import CoachPlayerProfilePage from "./pages/coach/CoachPlayerProfilePage";
import CoachRecognition from "./pages/coach/CoachRecognition";
import CoachAwardPlayer from "./pages/coach/CoachAwardPlayer";
import CoachQuickAssess from "./pages/coach/CoachQuickAssess";

// Parent pages
import ParentHome from "./pages/parent/ParentHome";
import ParentMatches from "./pages/parent/ParentMatches";
import ParentAlerts from "./pages/parent/ParentAlerts";
import ParentOnboardingFlow from "./pages/parent/ParentOnboardingFlow";

// Club pages
import ClubHome from "./pages/club/ClubHome";
import ClubSquads from "./pages/club/ClubSquads";
import ClubCoaches from "./pages/club/ClubCoaches";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DevSwitcher />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding/parent" element={<ParentOnboardingFlow />} />
            <Route path="/onboarding/:role" element={<OnboardingPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/parent-info" element={<ParentInfoPage />} />
            <Route path="/parent-invite" element={<ParentOnboarding />} />
            {import.meta.env.DEV && <Route path="/dev-setup" element={<DevSetupPage />} />}

            {/* Player routes */}
            <Route path="/player/home" element={<RouteGuard allowedRole="player"><PlayerHome /></RouteGuard>} />
            <Route path="/player/matches" element={<RouteGuard allowedRole="player"><PlayerMatches /></RouteGuard>} />
            <Route path="/player/match/:id" element={<RouteGuard allowedRole="player"><PlayerMatchDetail /></RouteGuard>} />
            <Route path="/player/profile" element={<RouteGuard allowedRole="player"><PlayerProfilePage /></RouteGuard>} />
            <Route path="/player/passport" element={<RouteGuard allowedRole="player"><PlayerPassport /></RouteGuard>} />
            <Route path="/player/card" element={<RouteGuard allowedRole="player"><PlayerCard /></RouteGuard>} />
            <Route path="/player/evolution" element={<RouteGuard allowedRole="player"><PlayerEvolutionCard /></RouteGuard>} />

            {/* Coach routes */}
            <Route path="/coach/home" element={<RouteGuard allowedRole="coach"><CoachHomePage /></RouteGuard>} />
            <Route path="/coach/squad" element={<RouteGuard allowedRole="coach"><CoachSquadPage /></RouteGuard>} />
            <Route path="/coach/squad/add" element={<RouteGuard allowedRole="coach"><CoachAddPlayer /></RouteGuard>} />
            <Route path="/coach/assess" element={<RouteGuard allowedRole="coach"><CoachAssessPage /></RouteGuard>} />
            <Route path="/coach/sessions" element={<RouteGuard allowedRole="coach"><CoachSessionsChooser /></RouteGuard>} />
            <Route path="/coach/sessions/list" element={<RouteGuard allowedRole="coach"><CoachSessionsPage /></RouteGuard>} />
            <Route path="/coach/sessions/quick" element={<RouteGuard allowedRole="coach"><CoachQuickMatchLog /></RouteGuard>} />
            <Route path="/coach/sessions/add" element={<RouteGuard allowedRole="coach"><CoachAddSession /></RouteGuard>} />
            <Route path="/coach/profile" element={<RouteGuard allowedRole="coach"><CoachProfilePage /></RouteGuard>} />
            <Route path="/coach/quick-assess" element={<RouteGuard allowedRole="coach"><CoachQuickAssess /></RouteGuard>} />
            <Route path="/coach/player/:id" element={<RouteGuard allowedRole="coach"><CoachPlayerProfilePage /></RouteGuard>} />
            <Route path="/coach/recognition" element={<RouteGuard allowedRole="coach"><CoachRecognition /></RouteGuard>} />
            <Route path="/coach/award" element={<RouteGuard allowedRole="coach"><CoachAwardPlayer /></RouteGuard>} />

            {/* Parent routes */}
            <Route path="/parent/home" element={<RouteGuard allowedRole="parent"><ParentHome /></RouteGuard>} />
            <Route path="/parent/matches" element={<RouteGuard allowedRole="parent"><ParentMatches /></RouteGuard>} />
            <Route path="/parent/alerts" element={<RouteGuard allowedRole="parent"><ParentAlerts /></RouteGuard>} />

            {/* Club admin routes */}
            <Route path="/club/home" element={<ClubHome />} />
            <Route path="/club/squads" element={<ClubSquads />} />
            <Route path="/club/coaches" element={<ClubCoaches />} />

            {/* Legacy redirects */}
            <Route path="/dashboard" element={<PlayerHome />} />
            <Route path="/profile" element={<PlayerProfilePage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
