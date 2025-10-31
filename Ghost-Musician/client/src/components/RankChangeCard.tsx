import { TrendingUp } from "lucide-react";

interface RankChangeCardProps {
  spotsChanged: number;
  newRank: number;
  oldRank: number;
  trend: "up" | "down";
}

export function RankChangeCard({
  spotsChanged,
  newRank,
  oldRank,
  trend,
}: RankChangeCardProps) {
  return (
    <div className="relative w-full max-w-[600px] h-[300px] mx-auto group">
      {/* Glass morphism card with electric green accent */}
      <div
        className="relative h-full bg-gradient-to-br from-black via-emerald-950/20 to-black rounded-3xl p-6 border-2 border-electric-neon/40 transition-all duration-300 hover:border-electric-neon/60 overflow-hidden"
        style={{
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 48px rgba(0, 245, 160, 0.2)',
        }}
      >
        {/* Badge - top right */}
        <div className="absolute top-4 right-4">
          <div className="bg-electric-neon text-black text-xs font-bold px-3 py-1 rounded-full">
            #{newRank}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="font-headline font-bold text-3xl text-white-smoke">
              Rank Change
            </h3>
          </div>

          <p className="text-white-smoke text-lg">
            Your chart position improved by{' '}
            <span className="font-bold text-electric-neon">{spotsChanged}</span>{' '}
            spots
          </p>

          {/* Chart visualization */}
          <div className="relative h-32 mt-6">
            {/* Grid background */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px bg-white/5" />
              ))}
            </div>

            {/* Trend line with gradient */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: '#00F5A0', stopOpacity: 0.3 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: '#00F5A0', stopOpacity: 1 }}
                  />
                </linearGradient>
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: '#00F5A0', stopOpacity: 0.2 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: '#00F5A0', stopOpacity: 0 }}
                  />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path
                d="M 0,70 L 15,65 L 30,68 L 45,60 L 60,55 L 75,45 L 90,30 L 100,20 L 100,100 L 0,100 Z"
                fill="url(#areaGradient)"
              />

              {/* Trend line */}
              <path
                d="M 0,70 L 15,65 L 30,68 L 45,60 L 60,55 L 75,45 L 90,30 L 100,20"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Trend arrow */}
            <div className="absolute bottom-0 right-0">
              <TrendingUp size={32} className="text-electric-neon" />
            </div>
          </div>
        </div>

        {/* Green glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{
            background:
              'radial-gradient(circle at 100% 50%, rgba(0, 245, 160, 0.15) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 0 64px rgba(0, 245, 160, 0.3)',
        }}
      />
    </div>
  );
}
