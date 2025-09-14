import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, MemoryRouter } from "react-router-dom";
import Index from "./pages/Index";
import { EcoGarden } from "./pages/EcoGarden";
import { Security } from "./pages/Security";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Determine if we're in a Chrome extension context
const isChromeExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

const App = () => {
  const Router = isChromeExtension ? MemoryRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/eco-garden" element={<EcoGarden />} />
            <Route path="/security" element={<Security />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
