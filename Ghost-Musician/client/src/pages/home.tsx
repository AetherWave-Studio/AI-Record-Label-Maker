import { Music, Search, Bell, CreditCard, ChevronDown, LogIn, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ActivityFeed } from "@/components/ActivityFeed";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { UserStatsWidget } from "@/components/UserStatsWidget";
import { DailyQuestsWidget } from "@/components/DailyQuestsWidget";
import { CreateBandModal } from "@/components/CreateBandModal";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import AuthForm from "@/components/auth-form";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCreateBand, setShowCreateBand] = useState(false);
  const [notificationCount] = useState(3);
  const [credits] = useState(500);
  const [readyBandsCount] = useState(5); // TODO: Get from API

  // Handle successful login/register
  const handleAuthSuccess = () => {
    setShowLoginModal(false);
    window.location.reload(); // Refresh to update user state
  };

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
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aetherwave-pink to-electric-neon flex items-center justify-center font-bold text-white shadow-lg">
                  A
                </div>
                <span className="text-xl font-headline font-bold bg-gradient-to-r from-aetherwave-pink via-electric-neon to-white-smoke bg-clip-text text-transparent">
                  AetherWave
                </span>
              </div>
            </Link>

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
              {isAuthenticated ? (
                <>
                  {/* Create Band Button */}
                  <button
                    onClick={() => setShowCreateBand(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-bold hover:shadow-lg transition-all"
                    data-testid="button-create-band"
                  >
                    <Sparkles size={18} />
                    <span className="hidden md:inline">Create Band</span>
                  </button>

                  {/* Credits */}
                  <Link href="/ghost-musician/store">
                    <button className="flex items-center gap-2 px-3 py-2 bg-deep-slate border border-sky-glint/30 rounded-lg hover:border-sky-glint transition-colors">
                      <CreditCard size={18} className="text-sky-glint" />
                      <span className="font-semibold text-white-smoke">{credits}</span>
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
                    <span className="text-sky-glint font-bold">#{user?.chartPosition || '—'}</span>
                    <span className="text-green-400 text-sm">⬆️</span>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-deep-slate rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-glint to-electric-blue flex items-center justify-center text-deep-slate font-bold">
                        {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                      </div>
                      <span className="hidden md:inline font-semibold text-white-smoke">
                        {user?.firstName || 'User'}
                      </span>
                      <ChevronDown size={16} className="text-soft-gray" />
                    </button>
                  </div>
                </>
              ) : (
                /* Login Button for Unauthenticated Users - Link to Replit Auth */
                <a
                  href="/api/login"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <LogIn size={18} />
                  <span className="hidden md:inline">Sign In</span>
                </a>
              )}

              {/* Profile Dropdown */}
              {isAuthenticated && (
                <div className="relative">
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-charcoal border border-sky-glint/30 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-4 border-b border-soft-gray/20">
                        <div className="font-semibold text-white-smoke">
                          {user?.firstName || 'User'} {user?.lastName || ''}
                        </div>
                        <div className="text-soft-gray text-sm">
                          {user?.level || 'Fan'} • #{user?.chartPosition || '—'}
                        </div>
                      </div>

                      <Link href={`/ghost-musician/user/${user?.id}`}>
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
                        <span>My Bands ({user?.totalCards || 0})</span>
                      </button>

                      <Link href="/upgrade">
                        <button className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3">
                          <span>📈</span>
                          <span>My Stats</span>
                        </button>
                      </Link>

                      <Link href="/creators-lounge/media-center.html">
                        <button className="w-full px-4 py-3 text-left hover:bg-deep-slate transition-colors flex items-center gap-3">
                          <span>🎬</span>
                          <span>Media Center</span>
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
              )}
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

            {/* Enhanced AetherWave Studio Portal */}
            {isAuthenticated && (
              <div className="mt-6 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-indigo-900/30 border border-purple-500/40 backdrop-blur-sm rounded-xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                {/* Portal glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-indigo-600/10 animate-pulse" />

                <div className="text-center relative z-10">
                  {/* Animated portal icon */}
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center animate-spin-slow">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>

                    {/* Portal particles */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping absolute" style={{ left: '20%', top: '20%' }} />
                      <div className="w-1 h-1 bg-pink-400 rounded-full animate-ping absolute" style={{ right: '20%', top: '30%' }} style={{ animationDelay: '0.5s' }} />
                      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-ping absolute" style={{ left: '30%', bottom: '20%' }} style={{ animationDelay: '1s' }} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-2 animate-gradient">
                    AetherWave Studio
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    ✨ Your Personal AI Media Studio<br/>
                    🎨 Create with Your Own Creative Portfolio<br/>
                    🌟 See Your Work in the Portal
                  </p>

                  <a
                    href="/static/aimusic-media.html"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-full transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Enter Portal
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>

                    {/* Portal effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                  </a>

                  <div className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Portal Active - Your Portfolio Awaits</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton readyBandsCount={readyBandsCount} />

      {/* Quick Action Bar - Mobile Alternative */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-charcoal/95 backdrop-blur-sm border-t border-sky-glint/20 z-40">
        <div className="flex items-center justify-around p-3">
          <Link href="/">
            <button className="flex flex-col items-center gap-1 text-sky-glint">
              <Music size={24} />
              <span className="text-xs">Feed</span>
            </button>
          </Link>
          <Link href="/gallery">
            <button className="flex flex-col items-center gap-1 text-soft-gray hover:text-white-smoke">
              <Search size={24} />
              <span className="text-xs">Explore</span>
            </button>
          </Link>
          <Link href="/creators-lounge/media-center.html">
            <button className="flex flex-col items-center gap-1 text-soft-gray hover:text-aetherwave-pink">
              <span className="text-xl">🎬</span>
              <span className="text-xs">Media</span>
            </button>
          </Link>
          {isAuthenticated ? (
            <>
              <button className="flex flex-col items-center gap-1 text-soft-gray hover:text-white-smoke">
                <Bell size={24} />
                <span className="text-xs">Alerts</span>
                {notificationCount > 0 && (
                  <div className="absolute top-2 right-1/3 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notificationCount}
                  </div>
                )}
              </button>
              <Link href={`/ghost-musician/user/${user?.id}`}>
                <button className="flex flex-col items-center gap-1 text-soft-gray hover:text-white-smoke">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-glint to-electric-blue" />
                  <span className="text-xs">Profile</span>
                </button>
              </Link>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex flex-col items-center gap-1 text-sky-glint"
            >
              <LogIn size={24} />
              <span className="text-xs">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Login/Register Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  Welcome to AetherWave
                </h2>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <AuthForm onSuccess={handleAuthSuccess} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Band Modal */}
      <CreateBandModal
        isOpen={showCreateBand}
        onClose={() => setShowCreateBand(false)}
      />
    </div>
  );
}
