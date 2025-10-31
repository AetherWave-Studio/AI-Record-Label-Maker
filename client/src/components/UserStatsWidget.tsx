import { TrendingUp, Music, Users, Award } from "lucide-react";
import { Link } from "wouter";

interface UserStatsWidgetProps {
  totalStreams: number;
  chartPosition: number;
  chartChange?: number;
  fame: number;
  totalCards: number;
  level: string;
}

export function UserStatsWidget({
  totalStreams,
  chartPosition,
  chartChange = 0,
  fame,
  totalCards,
  level,
}: UserStatsWidgetProps) {
  return (
    <div
      className="sticky top-24 w-full bg-black/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/5"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline font-bold text-xl text-white-smoke">
          Your Stats
        </h3>
        <Link href="/profile">
          <button className="text-xs text-sky-glint hover:text-electric-neon transition-colors">
            View All →
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        {/* Chart Position */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-950/20 to-transparent border border-electric-neon/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-electric-neon/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-electric-neon" />
            </div>
            <div>
              <p className="text-xs text-soft-gray">Chart Position</p>
              <p className="font-headline font-bold text-2xl text-white-smoke">
                #{chartPosition}
              </p>
            </div>
          </div>
          {chartChange !== 0 && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                chartChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {chartChange > 0 ? '⬆️' : '⬇️'}
              <span>{Math.abs(chartChange)}</span>
            </div>
          )}
        </div>

        {/* Total Streams */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-950/20 to-transparent border border-aetherwave-pink/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-aetherwave-pink/20 flex items-center justify-center">
              <Music size={20} className="text-aetherwave-pink" />
            </div>
            <div>
              <p className="text-xs text-soft-gray">Total Streams</p>
              <p className="font-headline font-bold text-xl text-white-smoke">
                {totalStreams.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* FAME */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-950/20 to-transparent border border-amber-400/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Award size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-soft-gray">FAME</p>
              <p className="font-headline font-bold text-xl text-white-smoke">
                {fame}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-soft-gray">{level}</p>
          </div>
        </div>

        {/* Total Cards */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-sky-950/20 to-transparent border border-sky-glint/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-glint/20 flex items-center justify-center">
              <Users size={20} className="text-sky-glint" />
            </div>
            <div>
              <p className="text-xs text-soft-gray">Total Artists</p>
              <p className="font-headline font-bold text-xl text-white-smoke">
                {totalCards}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
        <Link href="/my-bands">
          <button className="w-full px-4 py-2 bg-gradient-to-r from-aetherwave-pink to-electric-neon text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-aetherwave-pink/50 transition-all">
            View My Bands
          </button>
        </Link>
        <Link href="/upgrade">
          <button className="w-full px-4 py-2 border border-sky-glint/30 text-sky-glint font-semibold rounded-lg hover:border-sky-glint hover:bg-sky-glint/10 transition-all">
            Upgrade Tier
          </button>
        </Link>
      </div>
    </div>
  );
}
