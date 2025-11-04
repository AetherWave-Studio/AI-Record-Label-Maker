import { Music, TrendingUp, Users } from "lucide-react";

interface DailyGrowthReminderCardProps {
  readyBandsCount: number;
  onClick?: () => void;
}

export function DailyGrowthReminderCard({
  readyBandsCount,
  onClick,
}: DailyGrowthReminderCardProps) {
  return (
    <div
      className="relative w-full max-w-[600px] h-[400px] mx-auto group cursor-pointer"
      onClick={onClick}
    >
      {/* Glass morphism card with cyan accent */}
      <div
        className="relative h-full bg-gradient-to-br from-black via-cyan-950/20 to-black rounded-3xl p-6 border-2 border-sky-glint/40 transition-all duration-300 hover:border-sky-glint/70 overflow-hidden"
        style={{
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 48px rgba(166, 239, 255, 0.2)',
        }}
      >
        {/* Decorative floating orbs */}
        <div className="absolute top-6 right-6 w-24 h-24 rounded-full bg-sky-glint/20 blur-2xl" />
        <div className="absolute top-12 right-12 w-16 h-16 rounded-full bg-sky-glint/30 blur-xl" />
        <div className="absolute top-16 right-20 w-8 h-8 rounded-full bg-sky-glint blur-sm" />

        {/* Content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h3 className="font-headline font-bold text-4xl text-white-smoke">
              Daily Growth
            </h3>
            <h4 className="font-headline font-bold text-3xl bg-gradient-to-r from-sky-glint to-electric-neon bg-clip-text text-transparent">
              Reminder
            </h4>
          </div>

          <p className="text-white-smoke text-lg font-body leading-relaxed max-w-sm">
            Track your progress
            <br />
            <span className="text-soft-gray">
              {readyBandsCount} {readyBandsCount === 1 ? 'band is' : 'bands are'} ready for growth
            </span>
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Music size={20} className="text-sky-glint" />
              </div>
              <span className="text-xs text-soft-gray font-body">Stats</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <TrendingUp size={20} className="text-sky-glint" />
              </div>
              <span className="text-xs text-soft-gray font-body">Streams</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Users size={20} className="text-sky-glint" />
              </div>
              <span className="text-xs text-soft-gray font-body">Engagement</span>
            </div>
          </div>

          {/* Time indicator */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-soft-gray font-mono">#00x:00</span>
              <span className="text-xs text-electric-neon font-semibold">
                Click to apply growth
              </span>
            </div>
          </div>
        </div>

        {/* Animated pulse effect */}
        <div className="absolute top-6 right-6 w-24 h-24 rounded-full border-2 border-sky-glint/50 animate-ping opacity-20" />
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 0 64px rgba(166, 239, 255, 0.3)',
        }}
      />
    </div>
  );
}
