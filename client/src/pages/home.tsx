import { Music, Search, Bell, CreditCard, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { ActivityFeed } from "@/components/ActivityFeed";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { UserStatsWidget } from "@/components/UserStatsWidget";
import { DailyQuestsWidget } from "@/components/DailyQuestsWidget";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationCount] = useState(3);
  const [readyBandsCount] = useState(5); // TODO: Get from API
  
  // Daily login reward mutation
  const dailyLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/daily-login');
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Invalidate auth and credits queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
      
      if (data.firstLoginToday && data.creditsAwarded > 0) {
        toast({
          title: "Daily Reward!",
          description: data.message,
          variant: "default"
        });
      }
    },
    onError: (error: any) => {
      console.error('Daily login error:', error);
    }
  });

  // Call daily login on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && user) {
      dailyLoginMutation.mutate();
    }
  }, [isAuthenticated, user?.id]);

  // Mock data for stats widget - will be replaced with API calls
  const mockUserStats = {
    totalStreams: 250000,
    chartPosition: 34,
    chartChange: 8,
    fame: 25,
    totalCards: 5,
    level: 'Artist',
  };

  // Mock data for daily quests - will be replaced with API calls
  const mockQuests = [
    {
      id: '1',
      title: 'Upload 1 new song',
      description: 'Create a new artist or add to existing',
      reward: 50,
      completed: true,
      progress: 1,
      total: 1,
    },
    {
      id: '2',
      title: 'Apply growth to 3 bands',
      description: 'Use daily growth on your artists',
      reward: 25,
      completed: false,
      progress: 1,
      total: 3,
    },
    {
      id: '3',
      title: 'Comment on 5 artists',
      description: 'Engage with the community',
      reward: 10,
      completed: false,
      progress: 0,
      total: 5,
    },
  ];

  // Demo mode for unauthenticated users
  const demoUser = {
    id: 'demo',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@aetherwave.studio',
    level: 'Artist',
    chartPosition: 34,
    totalCards: 5,
  };

  const displayUser = user || demoUser;

  return (
    <div className="min-h-screen bg-black text-white-smoke relative">
      {/* Subtle depth - minimal gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-black via-black to-gray-900/20" />

      {/* Premium Black Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/70 border-b border-white/5" style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aetherwave-pink to-electric-neon flex items-center justify-center font-bold text-white shadow-lg">
                  A
                </div>
                <span className="text-xl font-headline font-bold bg-gradient-to-r from-aetherwave-pink via-electric-neon to-white-smoke bg-clip-text text-transparent">
                  AetherWave
                </span>
              </div>
            </a>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-soft-gray" size={20} />
                <input
                  type="text"
                  placeholder="Search artists, users..."
                  className="w-full pl-11 pr-4 py-2 bg-deep-slate border border-soft-gray/30 rounded-lg text-white-smoke placeholder-soft-gray focus:border-sky-glint focus:ring-2 focus:ring-sky-glint/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Side - User Actions */}
            <div className="flex items-center gap-4">
              {/* Credits */}
              <Link href="/buy-credits">
                <button 
                  className="flex items-center gap-2 px-3 py-2 bg-deep-slate border border-sky-glint/30 rounded-lg hover:border-sky-glint transition-colors"
                  data-testid="button-buy-credits"
                >
                  <CreditCard size={18} className="text-sky-glint" />
                  <span className="font-semibold text-white-smoke">{user?.credits || 0}</span>
                </button>
              </Link>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-deep-slate rounded-lg transition-colors">
                <Bell size={22} className="text-soft-gray hover:text-white-smoke" />
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {notificationCount}
                  </div>
                )}
              </button>

              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-deep-slate/50 rounded-lg">
                <span className="text-soft-gray text-sm">Chart:</span>
                <span className="text-sky-glint font-bold">#{displayUser?.chartPosition || '—'}</span>
                <span className="text-green-400 text-sm">⬆️</span>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-deep-slate rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-glint to-electric-blue flex items-center justify-center text-deep-slate font-bold">
                    {displayUser?.firstName?.[0] || displayUser?.email?.[0] || 'U'}
                  </div>
                  <span className="hidden md:inline font-semibold text-white-smoke">
                    {displayUser?.firstName || 'User'}
                  </span>
                  <ChevronDown size={16} className="text-soft-gray" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-charcoal border border-sky-glint/30 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-soft-gray/20">
                      <div className="font-semibold text-white-smoke">
                        {displayUser?.firstName || 'User'} {displayUser?.lastName || ''}
                      </div>
                      <div className="text-soft-gray text-sm">
                        {displayUser?.level || 'Fan'} • #{displayUser?.chartPosition || '—'}
                      </div>
                    </div>

                    <Link href={`/user/${displayUser?.id}`}>
                      <button className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3">
                        <span>📊</span>
                        <span>My Profile</span>
                      </button>
                    </Link>

                    <button
                      onClick={() => window.location.href = '#my-bands'}
                      className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3"
                    >
                      <span>🎸</span>
                      <span>My Bands ({displayUser?.totalCards || 0})</span>
                    </button>

                    <Link href="/store">
                      <button className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3" data-testid="link-store">
                        <span>🛍️</span>
                        <span>AetherWave Store</span>
                      </button>
                    </Link>

                    <Link href="/upgrade">
                      <button className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3">
                        <span>📈</span>
                        <span>My Stats</span>
                      </button>
                    </Link>

                    <button className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>

                    <div className="border-t border-soft-gray/20">
                      <button
                        onClick={() => window.location.href = '/api/logout'}
                        className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3 text-red-400"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-soft-gray" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-deep-slate border border-soft-gray/30 rounded-lg text-white-smoke placeholder-soft-gray focus:border-sky-glint outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Feed + Sidebar Layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {/* Feed - Left Side (Main Content) */}
          <div className="flex-1 min-w-0">
            <ActivityFeed />
          </div>

          {/* Sidebar - Right Side (Stats + Quests) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <UserStatsWidget
              totalStreams={mockUserStats.totalStreams}
              chartPosition={mockUserStats.chartPosition}
              chartChange={mockUserStats.chartChange}
              fame={mockUserStats.fame}
              totalCards={mockUserStats.totalCards}
              level={mockUserStats.level}
            />
            <DailyQuestsWidget
              quests={mockQuests}
              totalCreditsEarned={50}
            />
          </aside>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton readyBandsCount={readyBandsCount} />

      {/* Quick Action Bar - Mobile Alternative */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-charcoal/95 backdrop-blur-sm border-t border-sky-glint/20 z-40">
        <div className="flex items-center justify-around p-3">
          <a href="/">
            <button className="flex flex-col items-center gap-1 text-sky-glint">
              <Music size={24} />
              <span className="text-xs">Feed</span>
            </button>
          </a>
          <Link href="/gallery">
            <button className="flex flex-col items-center gap-1 text-soft-gray hover:text-white-smoke">
              <Search size={24} />
              <span className="text-xs">Explore</span>
            </button>
          </Link>
          <button className="flex flex-col items-center gap-1 text-soft-gray hover:text-white-smoke">
            <Bell size={24} />
            <span className="text-xs">Alerts</span>
            {notificationCount > 0 && (
              <div className="absolute top-2 right-1/3 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {notificationCount}
              </div>
            )}
          </button>
          <Link href={`/user/${displayUser?.id}`}>
            <button className="flex flex-col items-center gap-1 text-soft-gray hover:text-white-smoke">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-glint to-electric-blue" />
              <span className="text-xs">Profile</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
