import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Gallery from "@/pages/gallery";
import MusicMarketplace from "@/pages/music-marketplace";
import Store from "@/pages/store";
import { ArtistPage } from "@/pages/ArtistPage";
import { UserProfile } from "@/pages/user-profile";
import PlaylistPage from "@/pages/playlist";
import Upgrade from "@/pages/upgrade";
import NotFound from "@/pages/not-found";
import BuyCredits from "@/pages/buy-credits";
import CardShop from "@/pages/card-shop";
import Channels from "@/pages/channels";
import VideoGeneration from "@/pages/video-generation";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Root AetherWave Platform Pages */}
      <Route path="/buy-credits" component={BuyCredits} />
      <Route path="/card-shop" component={CardShop} />
      <Route path="/channels" component={Channels} />
      <Route path="/video-generation" component={VideoGeneration} />
      
      {/* Ghost Musician - Artist pages, gallery, and user profiles are accessible to everyone for discovery */}
      <Route path="/ghost-musician/artist/:cardId" component={ArtistPage} />
      <Route path="/ghost-musician/user/:userId" component={UserProfile} />
      <Route path="/ghost-musician/gallery" component={Gallery} />
      
      {/* Ghost Musician - Main pages */}
      <Route path="/ghost-musician" component={Home} />
      <Route path="/ghost-musician/landing" component={Landing} />
      <Route path="/ghost-musician/music" component={MusicMarketplace} />
      <Route path="/ghost-musician/store" component={Store} />
      <Route path="/ghost-musician/playlist/:playlistId" component={PlaylistPage} />
      <Route path="/ghost-musician/upgrade" component={Upgrade} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
