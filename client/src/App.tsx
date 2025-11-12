import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserNavigation } from "@/components/UserNavigation";
import ProfilePage from "@/pages/profile";
import AIMachinePage from "@/pages/ai-machine";

function Router() {
  return (
    <Switch>
      <Route path="/profile" component={ProfilePage} />
      <Route path="/ai-machine" component={AIMachinePage} />
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
      <div className="min-h-screen bg-background">
        <UserNavigation />
        <main>
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
