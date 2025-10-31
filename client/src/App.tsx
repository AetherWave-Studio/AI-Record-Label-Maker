import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import VideoGeneration from "@/pages/video-generation";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Gallery from "@/pages/gallery";
import MusicMarketplace from "@/pages/music-marketplace";
import Store from "@/pages/store";
import { ArtistPage } from "@/pages/ArtistPage";
import { UserProfile } from "@/pages/user-profile";
import PlaylistPage from "@/pages/playlist";
import Upgrade from "@/pages/upgrade";
import BuyCredits from "@/pages/buy-credits";

function Router() {
  return (
    <Switch>
      {/* AetherWave Studio pages */}
      <Route path="/video-generation" component={VideoGeneration} />
      
      {/* GhostMusician RPG pages */}
      <Route path="/ghost-musician" component={Home} />
      <Route path="/ghost-musician/landing" component={Landing} />
      <Route path="/ghost-musician/artist/:cardId" component={ArtistPage} />
      <Route path="/ghost-musician/user/:userId" component={UserProfile} />
      <Route path="/ghost-musician/gallery" component={Gallery} />
      <Route path="/ghost-musician/music" component={MusicMarketplace} />
      <Route path="/ghost-musician/store" component={Store} />
      <Route path="/store" component={Store} />
      <Route path="/ghost-musician/playlist/:playlistId" component={PlaylistPage} />
      <Route path="/ghost-musician/upgrade" component={Upgrade} />
      <Route path="/ghost-musician/buy-credits" component={BuyCredits} />
      <Route path="/buy-credits" component={BuyCredits} />
      
      {/* Fallback to 404 */}
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
