import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccountProvider } from "@/contexts/AccountContext";
import { AuthGate } from "@/components/auth/AuthGate";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import Phase2 from "./pages/Phase2";
import Phase2AIConversation from "./pages/Phase2AIConversation";
import Phase2LandingPage from "./pages/Phase2LandingPage";
import Phase2EmailDelivery from "./pages/Phase2EmailDelivery";
import Phase2GoLive from "./pages/Phase2GoLive";
import Phase2SocialTest from "./pages/Phase2SocialTest";
import Funnel from "./pages/Funnel";
import FunnelCraft from "./pages/FunnelCraft";
import FunnelBuild from "./pages/FunnelBuild";
import OutputsHistory from "./pages/OutputsHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AccountProvider>
          <AuthGate>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/phase2" element={<Phase2 />} />
              <Route path="/phase2/content" element={<Phase2AIConversation />} />
              <Route path="/phase2/landing-page" element={<Phase2LandingPage />} />
              <Route path="/phase2/email-delivery" element={<Phase2EmailDelivery />} />
              <Route path="/phase2/go-live" element={<Phase2GoLive />} />
              <Route path="/phase2/social-test" element={<Phase2SocialTest />} />
              {/* Legacy routes redirect to new Phase 2 */}
              <Route path="/social-capture" element={<Phase2 />} />
              <Route path="/funnel" element={<Funnel />} />
              <Route path="/funnel/craft" element={<FunnelCraft />} />
              <Route path="/funnel/build" element={<FunnelBuild />} />
              <Route path="/outputs" element={<OutputsHistory />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthGate>
        </AccountProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
