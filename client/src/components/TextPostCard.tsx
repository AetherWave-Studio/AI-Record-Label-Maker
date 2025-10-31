import { Music2 } from "lucide-react";

interface TextPostCardProps {
  title: string;
  content: string;
  timestamp?: string;
  author?: string;
}

export function TextPostCard({ title, content, timestamp, author }: TextPostCardProps) {
  return (
    <div className="relative w-full max-w-[600px] mx-auto group">
      {/* Glass morphism card with 3D depth */}
      <div
        className="relative bg-black/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 transition-all duration-300 hover:border-aetherwave-pink/30"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Top accent icon */}
        <div className="absolute top-6 right-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aetherwave-pink to-electric-neon flex items-center justify-center">
            <Music2 size={20} className="text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="font-headline font-bold text-2xl text-white-smoke pr-14">
            {title}
          </h3>

          <p className="text-soft-gray text-base leading-relaxed font-body">
            {content}
          </p>

          {/* Footer metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-soft-gray">{timestamp || 'Just now'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-xs font-semibold bg-gradient-to-r from-aetherwave-pink to-electric-neon bg-clip-text text-transparent">
                AetherWave
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 0 24px rgba(225, 90, 253, 0.15)',
        }}
      />
    </div>
  );
}
