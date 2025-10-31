import { Trophy } from "lucide-react";

interface AchievementCardProps {
  milestone: string;
  value: string | number;
  metricLabel: string;
  badgeColor?: "gold" | "platinum" | "diamond";
  chartPosition?: number;
}

export function AchievementCard({
  milestone,
  value,
  metricLabel,
  badgeColor = "gold",
  chartPosition,
}: AchievementCardProps) {
  const badgeColors = {
    gold: "from-yellow-500 via-amber-500 to-yellow-600",
    platinum: "from-gray-300 via-gray-100 to-gray-400",
    diamond: "from-cyan-300 via-blue-200 to-purple-300",
  };

  const glowColors = {
    gold: "rgba(251, 191, 36, 0.4)",
    platinum: "rgba(229, 231, 235, 0.4)",
    diamond: "rgba(147, 197, 253, 0.4)",
  };

  return (
    <div className="relative w-full max-w-[600px] h-[350px] mx-auto group">
      {/* Glass morphism card with gold/amber gradient */}
      <div
        className="relative h-full bg-gradient-to-br from-black via-charcoal to-black rounded-3xl p-8 border-2 border-amber-500/30 transition-all duration-300 hover:border-amber-500/50 overflow-hidden"
        style={{
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 48px ${glowColors[badgeColor]}`,
        }}
      >
        {/* Badge icon - top right */}
        <div className="absolute top-6 right-6">
          <div className="relative">
            {/* Badge background */}
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${badgeColors[badgeColor]} flex items-center justify-center shadow-2xl`}
            >
              <Trophy size={32} className="text-white" />
            </div>
            {/* Ribbon tails */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              <div
                className={`w-3 h-6 bg-gradient-to-b ${badgeColors[badgeColor]} rounded-b-sm`}
              />
              <div
                className={`w-3 h-6 bg-gradient-to-b ${badgeColors[badgeColor]} rounded-b-sm`}
              />
            </div>
            {/* Chart position badge */}
            {chartPosition && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-black">
                #{chartPosition}
              </div>
            )}
          </div>
        </div>

        {/* Content - centered */}
        <div className="flex flex-col items-center justify-center h-full space-y-6 pr-20">
          <h3 className="font-headline font-bold text-2xl text-white-smoke text-center">
            {milestone}
          </h3>

          {/* Big number display */}
          <div className="text-center">
            <div
              className={`font-headline font-black text-7xl bg-gradient-to-br ${badgeColors[badgeColor]} bg-clip-text text-transparent`}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="font-headline font-bold text-3xl text-white-smoke mt-2">
              {metricLabel}
            </div>
          </div>
        </div>

        {/* Decorative light rays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-${badgeColor === 'gold' ? 'amber' : badgeColor === 'platinum' ? 'gray' : 'cyan'}-500/10 to-transparent blur-3xl`}
          />
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `0 0 64px ${glowColors[badgeColor]}`,
        }}
      />
    </div>
  );
}
