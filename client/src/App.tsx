import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            AetherWave Studio
          </h1>
          <p className="text-muted-foreground">
            React app deactivated. Please use the static homepage.
          </p>
        </div>
      </div>
    </QueryClientProvider>
  );
}
