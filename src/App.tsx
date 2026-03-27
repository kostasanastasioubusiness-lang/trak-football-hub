import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";
import ParentInfoPage from "./pages/ParentInfoPage";
import ParentOnboarding from "./pages/ParentOnboarding";
import Dashboard from "./pages/Dashboard";
import LogChooser from "./pages/LogChooser";
import MatchLog from "./pages/MatchLog";
import NotFound from "./pages/NotFound";
import CoachSquad from "./components/coach/CoachSquad";
import CoachSessions from "./components/coach/CoachSessions";
import CoachSessionDetail from "./components/coach/CoachSessionDetail";
import CoachAssess from "./components/coach/CoachAssess";
import CoachPlayerProfile from "./components/coach/CoachPlayerProfile";
import CoachProgress from "./components/coach/CoachProgress";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding/:role" element={<OnboardingPage />} />
            <Route path="/parent-info" element={<ParentInfoPage />} />
            <Route path="/parent-invite" element={<ParentOnboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<LogChooser />} />
            <Route path="/log/match" element={<MatchLog />} />
            {/* Coach routes */}
            <Route path="/coach/squad" element={<CoachSquad />} />
            <Route path="/coach/sessions" element={<CoachSessions />} />
            <Route path="/coach/session/:id" element={<CoachSessionDetail />} />
            <Route path="/coach/assess" element={<CoachAssess />} />
            <Route path="/coach/player/:id" element={<CoachPlayerProfile />} />
            <Route path="/coach/progress" element={<CoachProgress />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
