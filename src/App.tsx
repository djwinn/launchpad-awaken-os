import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import SocialCapture from "./pages/SocialCapture";
import SocialCaptureConnect from "./pages/SocialCaptureConnect";
import SocialCaptureActivate from "./pages/SocialCaptureActivate";
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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/social-capture" element={<SocialCapture />} />
          <Route path="/social-capture/connect" element={<SocialCaptureConnect />} />
          <Route path="/social-capture/activate" element={<SocialCaptureActivate />} />
          <Route path="/social-capture/activate" element={<SocialCaptureActivate />} />
          <Route path="/funnel" element={<Funnel />} />
          <Route path="/funnel/craft" element={<FunnelCraft />} />
          <Route path="/funnel/build" element={<FunnelBuild />} />
          <Route path="/funnel-builder" element={<Index />} />
          <Route path="/outputs" element={<OutputsHistory />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
