import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserNavigation } from "@/components/UserNavigation";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useAuth } from "@/hooks/useAuth";
import BuyCreditsPage from "@/pages/buy-credits";
import CardShopPage from "@/pages/card-shop";
import VideoGenerationPage from "@/pages/video-generation";
import ChannelsPage from "@/pages/channels";
import ProfilePage from "@/pages/profile";

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            AetherWave Studio
          </h1>
          <p className="text-2xl text-muted-foreground">
            AI-Powered Creative Platform
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate music, images, and videos with cutting-edge AI. 
            Build your creative empire with our unified credit system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="p-6 rounded-lg border bg-card hover-elevate">
            <h3 className="text-xl font-semibold mb-2">AI Music Generation</h3>
            <p className="text-muted-foreground">
              Create original songs with SUNO AI
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card hover-elevate">
            <h3 className="text-xl font-semibold mb-2">Image & Video</h3>
            <p className="text-muted-foreground">
              Generate visuals with DALL-E, Midjourney, and Luma
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card hover-elevate">
            <h3 className="text-xl font-semibold mb-2">Seamless Loops</h3>
            <p className="text-muted-foreground">
              Perfect looping videos for any project
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card hover-elevate">
            <h3 className="text-xl font-semibold mb-2">Unified Credits</h3>
            <p className="text-muted-foreground">
              One credit system for all AI features
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/buy-credits" component={BuyCreditsPage} />
      <Route path="/card-shop" component={CardShopPage} />
      <Route path="/seamless-loop-creator" component={VideoGenerationPage} />
      <Route path="/channels" component={ChannelsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  // Check if user needs to set username
  const needsUsername = user && !user.username;

  return (
    <>
      <div className="min-h-screen bg-background">
        <UserNavigation />
        <main>
          <Router />
        </main>
      </div>
      <Toaster />
      
      {/* Show welcome modal if user is logged in but has no username */}
      {!isLoading && needsUsername && <WelcomeModal open={true} user={user} />}
    </>
  );
}
