import { useState } from "react";
import { Crown, Star, Trophy, Zap, Music, TrendingUp, Users, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface UserProgressionProps {
  className?: string;
}

const LEVEL_THRESHOLDS = {
  Fan: { min: 0, max: 100, next: "Artist" },
  Artist: { min: 100, max: 500, next: "Producer" },
  Producer: { min: 500, max: 2000, next: "Label Executive" },
  "Label Executive": { min: 2000, max: 10000, next: "Music Mogul" },
};

const LEVEL_ICONS = {
  Fan: Users,
  Artist: Music,
  Producer: Award,
  "Label Executive": Crown,
};

const LEVEL_COLORS = {
  Fan: "text-gray-600",
  Artist: "text-blue-600",
  Producer: "text-purple-600",
  "Label Executive": "text-yellow-600",
};

export default function UserProgression({ className = "" }: UserProgressionProps) {
  const { user } = useAuth();
  
  // Fetch fresh user stats including Journey Panel metrics
  const { data: userStats, isLoading } = useQuery<{
    fame: number;
    dailyStreams: number; 
    totalStreams: number;
    chartPosition: number;
    fanbase: number;
    totalCards: number;
    influence: number;
    experience: number;
  }>({
    queryKey: ['/api/user/stats'],
    enabled: !!user
  });

  if (!user) {
    return null;
  }

  const currentLevel = user.level || "Fan";
  const experience = userStats?.experience || user.experience || 0;
  const influence = userStats?.influence || user.influence || 0;
  const totalCards = userStats?.totalCards || user.totalCards || 0;
  const totalStreams = userStats?.totalStreams || user.totalStreams || 0;
  
  const levelData = LEVEL_THRESHOLDS[currentLevel as keyof typeof LEVEL_THRESHOLDS];
  const progressPercent = levelData ? ((experience - levelData.min) / (levelData.max - levelData.min)) * 100 : 0;
  const LevelIcon = LEVEL_ICONS[currentLevel as keyof typeof LEVEL_ICONS] || Users;
  const levelColor = LEVEL_COLORS[currentLevel as keyof typeof LEVEL_COLORS] || "text-gray-600";

  const achievements = [
    {
      title: "Card Creator",
      description: `Generated ${totalCards} artist cards`,
      icon: Star,
      unlocked: totalCards > 0,
      progress: Math.min(totalCards, 10),
      maxProgress: 10
    },
    {
      title: "Industry Influencer",
      description: `${influence} influence points earned`,
      icon: TrendingUp,
      unlocked: influence >= 50,
      progress: Math.min(influence, 500),
      maxProgress: 500
    },
    {
      title: "Streaming Ready",
      description: "Eligible for streaming distribution",
      icon: Zap,
      unlocked: user.hasStreamingDistribution || false,
      progress: user.hasStreamingDistribution ? 1 : 0,
      maxProgress: 1
    }
  ];

  return (
    <div className={`bg-gradient-to-br from-deep-slate to-charcoal rounded-xl border border-soft-gray/20 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-sky-glint to-electric-blue p-2 rounded-lg">
            <LevelIcon className={`w-5 h-5 text-deep-slate`} />
          </div>
          <div>
            <h3 className="font-bold text-white-smoke">Music Producer Journey</h3>
            <p className="text-soft-gray text-sm">Level up your music career</p>
          </div>
        </div>
        <Badge variant="outline" className={`${levelColor} border-current`}>
          {currentLevel}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-soft-gray">Progress to {levelData?.next || "Max Level"}</span>
          <span className="text-sm text-sky-glint font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between mt-1 text-xs text-soft-gray">
          <span>{experience} XP</span>
          <span>{levelData?.max || experience} XP</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-charcoal/40 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-electric-blue" data-testid="cards-created-journey">{totalCards}</div>
          <div className="text-xs text-soft-gray">Cards Created</div>
        </div>
        <div className="bg-charcoal/40 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-sky-glint" data-testid="influence-journey">{influence}</div>
          <div className="text-xs text-soft-gray">Influence</div>
        </div>
        <div className="bg-charcoal/40 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-sky-glint" data-testid="total-streams-journey">{totalStreams.toLocaleString()}</div>
          <div className="text-xs text-soft-gray">Total Streams</div>
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <h4 className="font-semibold text-white-smoke text-sm">Achievements</h4>
        {achievements.map((achievement, index) => {
          const AchievementIcon = achievement.icon;
          const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
          
          return (
            <div 
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg border ${
                achievement.unlocked 
                  ? 'bg-sky-glint/10 border-sky-glint/30' 
                  : 'bg-charcoal/20 border-soft-gray/20'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                achievement.unlocked 
                  ? 'bg-sky-glint text-deep-slate' 
                  : 'bg-soft-gray/20 text-soft-gray'
              }`}>
                <AchievementIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    achievement.unlocked ? 'text-white-smoke' : 'text-soft-gray'
                  }`}>
                    {achievement.title}
                  </span>
                  <span className="text-xs text-soft-gray">
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <div className="text-xs text-soft-gray mt-1">{achievement.description}</div>
                <Progress 
                  value={progressPercent} 
                  className="h-1 mt-2" 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Level Info */}
      {levelData?.next && (
        <div className="mt-6 p-4 bg-gradient-to-r from-sky-glint/10 to-electric-blue/10 rounded-lg border border-sky-glint/30">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-white-smoke">Next: {levelData.next}</h5>
              <p className="text-xs text-soft-gray">
                Unlock streaming distribution & industry partnerships
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-sky-glint">
                {levelData.max - experience} XP needed
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}