import { Zap } from 'lucide-react';
import { useState } from 'react';

interface FloatingActionButtonProps {
  readyBandsCount?: number;
}

export function FloatingActionButton({ readyBandsCount = 0 }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (readyBandsCount === 0) {
    return null; // Hide if no bands ready
  }

  return (
    <>
      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-full font-bold shadow-2xl hover:scale-110 hover:shadow-sky-glint/50 transition-all duration-200 animate-pulse"
      >
        <Zap size={24} className="animate-bounce" />
        <div className="text-left">
          <div className="text-sm opacity-90">DAILY GROWTH</div>
          <div className="text-lg leading-none">{readyBandsCount} bands ready</div>
        </div>

        {/* Notification Badge */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-deep-slate animate-pulse">
          {readyBandsCount}
        </div>
      </button>

      {/* Modal (placeholder for now) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-charcoal border border-sky-glint rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap size={32} className="text-sky-glint" />
                <h2 className="text-2xl font-bold text-white-smoke">Daily Growth</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-soft-gray hover:text-white-smoke text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-soft-gray mb-6">
              {readyBandsCount} bands are ready to receive their daily growth bonuses!
            </p>

            {/* Placeholder content - will be replaced with actual band list */}
            <div className="space-y-3 mb-6">
              {Array.from({ length: Math.min(readyBandsCount, 5) }).map((_, i) => (
                <div key={i} className="bg-deep-slate/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white-smoke font-semibold">Band {i + 1}</div>
                    <div className="text-soft-gray text-sm">Ready for growth</div>
                  </div>
                  <div className="text-sky-glint text-sm">+streams, +sales</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  // TODO: Implement apply growth to all
                  setIsOpen(false);
                }}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate rounded-lg font-bold hover:shadow-lg transition-all"
              >
                <Zap className="inline mr-2" size={20} />
                APPLY GROWTH TO ALL
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-4 border border-soft-gray/30 text-soft-gray rounded-lg hover:border-sky-glint hover:text-white-smoke transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
