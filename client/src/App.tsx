import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">AetherWave Studio</h1>
          <p className="text-slate-400">AI-Powered Creative Platform</p>
        </div>
      </div>
    </QueryClientProvider>
  );
}
