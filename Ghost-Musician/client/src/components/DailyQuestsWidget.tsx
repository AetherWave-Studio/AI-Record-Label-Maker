import { CheckCircle2, Circle, Zap } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  progress?: number;
  total?: number;
}

interface DailyQuestsWidgetProps {
  quests: Quest[];
  totalCreditsEarned?: number;
}

export function DailyQuestsWidget({
  quests,
  totalCreditsEarned = 0,
}: DailyQuestsWidgetProps) {
  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div
      className="w-full bg-black/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 mt-6"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-sky-glint" />
          <h3 className="font-headline font-bold text-xl text-white-smoke">
            Daily Quests
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-soft-gray">Today</p>
          <p className="text-sm font-bold text-sky-glint">
            {completedCount}/{quests.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-charcoal rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-glint to-electric-neon transition-all duration-500"
            style={{
              width: `${(completedCount / quests.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-3 mb-4">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`p-3 rounded-xl border transition-all ${
              quest.completed
                ? 'bg-emerald-950/20 border-electric-neon/30'
                : 'bg-charcoal/30 border-white/5 hover:border-sky-glint/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className="mt-0.5">
                {quest.completed ? (
                  <CheckCircle2 size={20} className="text-electric-neon" />
                ) : (
                  <Circle size={20} className="text-soft-gray" />
                )}
              </div>

              {/* Quest Info */}
              <div className="flex-1">
                <p
                  className={`font-semibold text-sm ${
                    quest.completed
                      ? 'text-soft-gray line-through'
                      : 'text-white-smoke'
                  }`}
                >
                  {quest.title}
                </p>
                {quest.description && (
                  <p className="text-xs text-soft-gray mt-1">
                    {quest.description}
                  </p>
                )}
                {quest.progress !== undefined && quest.total !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-soft-gray">
                        {quest.progress}/{quest.total}
                      </span>
                      <span className="text-sky-glint">
                        {Math.round((quest.progress / quest.total) * 100)}%
                      </span>
                    </div>
                    <div className="h-1 bg-charcoal rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-glint transition-all"
                        style={{
                          width: `${(quest.progress / quest.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reward */}
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 font-bold text-sm">
                    +{quest.reward}
                  </span>
                  <span className="text-xs text-soft-gray">credits</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Earned Today */}
      {totalCreditsEarned > 0 && (
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-950/20 to-transparent border border-amber-400/20 rounded-xl">
            <span className="text-sm text-soft-gray">Earned Today</span>
            <span className="font-headline font-bold text-xl text-amber-400">
              +{totalCreditsEarned}
            </span>
          </div>
        </div>
      )}

      {/* Reset Timer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-soft-gray">
          Resets in <span className="text-sky-glint font-semibold">23h 45m</span>
        </p>
      </div>
    </div>
  );
}
