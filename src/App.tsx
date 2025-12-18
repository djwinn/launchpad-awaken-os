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
import Phase2Domain from "./pages/Phase2Domain";
import Phase2EmailSetup from "./pages/Phase2EmailSetup";
import Phase2AIConversation from "./pages/Phase2AIConversation";
import Phase2BuildAutomation from "./pages/Phase2BuildAutomation";
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
              <Route path="/phase2/domain" element={<Phase2Domain />} />
              <Route path="/phase2/email-setup" element={<Phase2EmailSetup />} />
              <Route path="/phase2/ai-conversation" element={<Phase2AIConversation />} />
              <Route path="/phase2/build-automation" element={<Phase2BuildAutomation />} />
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
