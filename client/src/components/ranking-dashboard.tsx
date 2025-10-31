import { Trophy, TrendingUp, Users, Music, Star, ChartBar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
// Progress component fallback
const Progress = ({ value, className }: { value: number, className?: string }) => (
  <div className={`bg-gray-700 rounded-full overflow-hidden ${className}`}>
    <div 
      className="bg-purple-500 h-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

interface RankingDashboardProps {
  className?: string;
}

export default function RankingDashboard({ className = "" }: RankingDashboardProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Use the new user stats endpoint to get calculated daily streams
  const { data: userStats } = useQuery<{
    fame: number;
    dailyStreams: number; 
    totalStreams: number;
    chartPosition: number;
    fanbase: number;
  }>({
    queryKey: ['/api/user/stats'],
    enabled: !!user
  });

  // Calculate stats for display with live calculated daily streams
  const stats = {
    fame: userStats?.fame || user.fame || 1,
    dailyStreams: userStats?.dailyStreams || 0, // Use calculated daily streams
    totalStreams: userStats?.totalStreams || user.totalStreams || 0,
    chartPosition: userStats?.chartPosition || user.chartPosition || 0,
    fanbase: userStats?.fanbase || user.fanbase || 0,
  };

  const getFameLevel = (fame: number) => {
    if (fame >= 90) return "Legend";
    if (fame >= 70) return "Superstar";
    if (fame >= 50) return "Rising Star";
    if (fame >= 30) return "Upcoming";
    return "Emerging";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 rounded-xl border border-purple-500/20 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Artist Rankings</h3>
        <Badge variant="secondary" className="bg-purple-600 text-white">
          {getFameLevel(stats.fame)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Top Row: Fame Level and Daily Streams */}
        {/* Fame Level */}
        <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-purple-200">Fame Level</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1" data-testid="fame-value">{stats.fame}/100</div>
          <Progress value={stats.fame} className="h-2" />
        </div>

        {/* Daily Streams */}
        <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-purple-200">Daily Streams</span>
          </div>
          <div className="text-2xl font-bold text-white" data-testid="daily-streams-value">{formatNumber(stats.dailyStreams)}</div>
          <div className="text-xs text-green-400">+{Math.floor(Math.random() * 500)} today</div>
        </div>

        {/* Middle Row: Total Streams and Chart Position */}
        {/* Total Streams */}
        <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-purple-200">Total Streams</span>
          </div>
          <div className="text-2xl font-bold text-white" data-testid="total-streams-value">{formatNumber(stats.totalStreams)}</div>
          <div className="text-xs text-blue-400">All-time</div>
        </div>

        {/* Chart Position */}
        <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ChartBar className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-purple-200">Chart Position</span>
          </div>
          <div className="text-2xl font-bold text-white" data-testid="chart-position-value">
            {stats.chartPosition > 0 ? `#${stats.chartPosition}` : "—"}
          </div>
          <div className="text-xs text-orange-400">
            {stats.chartPosition > 0 ? "On Charts" : "Keep releasing!"}
          </div>
        </div>

        {/* Bottom Row: Fanbase (full width) */}
        {/* Fanbase */}
        <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20 col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-200">Fanbase</span>
          </div>
          <div className="text-2xl font-bold text-white" data-testid="fanbase-value">{formatNumber(stats.fanbase)}</div>
          <div className="text-xs text-purple-400">Followers</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
        <div className="text-sm text-purple-200 mb-1">Next Milestone:</div>
        <div className="text-sm text-white">
          {stats.fame < 30 ? "Reach Fame Level 30 to become 'Upcoming'" : 
           stats.fame < 50 ? "Reach Fame Level 50 to become 'Rising Star'" :
           stats.fame < 70 ? "Reach Fame Level 70 to become 'Superstar'" :
           stats.fame < 90 ? "Reach Fame Level 90 to become 'Legend'" :
           "You've reached the highest level! 🎉"}
        </div>
      </div>
    </div>
  );
}