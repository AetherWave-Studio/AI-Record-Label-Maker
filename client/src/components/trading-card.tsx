import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Music2, Sparkles } from "lucide-react";
import type { CardDesignType } from "@shared/schema";

// Member structure from BandProfile
interface MemberProfile {
  name: string;
  role: string;
  gender?: 'm' | 'f' | 'nb';
  age?: number;
  backstory?: string;
  personality?: string;
  appearance?: string;
  archetype?: string; // For personality archetypes
}

// Artist/Band data structure  
export interface ArtistData {
  bandName: string;
  genre: string;
  concept?: string;
  philosophy?: string;
  signatureSound?: string;
  lyricalThemes?: string[];
  influences?: string[];
  members?: MemberProfile[];
  tradingCardText?: {
    front?: {
      headline?: string;
      tagline?: string;
      quickFacts?: string[];
    };
    back?: {
      origin?: string;
      achievement?: string;
      quote?: string;
    };
  };
  sunoPrompt?: string; // SUNO AI prompt text
  songTitle?: string;
}

interface TradingCardProps {
  artistData: ArtistData | null;
  imageUrl?: string;
  cardDesign?: CardDesignType;
  isProcessing?: boolean;
  cardId?: string;
  viewMode?: 'full' | 'gallery' | 'browse';
}

// Theme configurations for different card designs
function getCardTheme(design: CardDesignType = 'ghosts_online') {
  const themes = {
    ghosts_online: {
      name: "GHOSTS ONLINE",
      headerBg: "bg-gradient-to-r from-slate-800 to-slate-900",
      headerText: "text-cyan-400 font-bold tracking-wider",
      cardBg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      borderColor: "border-cyan-500",
      borderGlow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      sectionBg: "bg-slate-800/60 border border-cyan-500/30",
      textPrimary: "text-white",
      textSecondary: "text-gray-300",
      accentColor: "text-cyan-400",
      badgeBg: "bg-cyan-600",
      badgeText: "text-white",
    },
    cyberpunk_holo: {
      name: "CYBERPUNK",
      headerBg: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500",
      headerText: "text-white font-bold tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]",
      cardBg: "bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900",
      borderColor: "border-transparent",
      borderGlow: "shadow-[0_0_30px_rgba(168,85,247,0.6)] ring-4 ring-purple-500/50",
      sectionBg: "bg-black/40 border-2 border-purple-500/50 backdrop-blur-sm",
      textPrimary: "text-white",
      textSecondary: "text-purple-200",
      accentColor: "text-pink-400",
      badgeBg: "bg-gradient-to-r from-pink-500 to-orange-500",
      badgeText: "text-white font-bold",
    },
    vintage_weathered: {
      name: "VINTAGE",
      headerBg: "bg-gradient-to-r from-amber-900 to-yellow-900",
      headerText: "text-amber-100 font-bold tracking-wide font-serif",
      cardBg: "bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800",
      borderColor: "border-amber-700",
      borderGlow: "shadow-[0_0_20px_rgba(180,83,9,0.4)]",
      sectionBg: "bg-stone-900/70 border border-amber-800/40",
      textPrimary: "text-amber-50",
      textSecondary: "text-stone-300",
      accentColor: "text-amber-400",
      badgeBg: "bg-amber-800",
      badgeText: "text-amber-50",
    },
    modern_sleek: {
      name: "MODERN",
      headerBg: "bg-gradient-to-r from-gray-900 to-black",
      headerText: "text-white font-bold tracking-widest",
      cardBg: "bg-gradient-to-br from-gray-900 via-black to-gray-900",
      borderColor: "border-gray-600",
      borderGlow: "shadow-[0_0_25px_rgba(255,255,255,0.2)]",
      sectionBg: "bg-gray-800/50 border border-gray-700/50",
      textPrimary: "text-white",
      textSecondary: "text-gray-400",
      accentColor: "text-white",
      badgeBg: "bg-white",
      badgeText: "text-black font-bold",
    },
    neon_arcade: {
      name: "NEON ARCADE",
      headerBg: "bg-gradient-to-r from-fuchsia-600 to-cyan-500",
      headerText: "text-white font-bold tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,1)]",
      cardBg: "bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900",
      borderColor: "border-fuchsia-500",
      borderGlow: "shadow-[0_0_35px_rgba(217,70,239,0.7)]",
      sectionBg: "bg-black/50 border-2 border-cyan-500/60",
      textPrimary: "text-white",
      textSecondary: "text-cyan-100",
      accentColor: "text-fuchsia-400",
      badgeBg: "bg-gradient-to-r from-fuchsia-500 to-cyan-500",
      badgeText: "text-white font-bold",
    },
    dark_carnival: {
      name: "DARK CARNIVAL",
      headerBg: "bg-gradient-to-r from-orange-900 via-red-900 to-purple-900",
      headerText: "text-orange-200 font-bold tracking-wide",
      cardBg: "bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950",
      borderColor: "border-orange-600",
      borderGlow: "shadow-[0_0_25px_rgba(234,88,12,0.5)]",
      sectionBg: "bg-black/60 border border-orange-600/40",
      textPrimary: "text-orange-100",
      textSecondary: "text-gray-400",
      accentColor: "text-orange-400",
      badgeBg: "bg-orange-700",
      badgeText: "text-white",
    },
    winter_frost: {
      name: "WINTER FROST",
      headerBg: "bg-gradient-to-r from-blue-600 to-cyan-600",
      headerText: "text-blue-100 font-bold tracking-wide",
      cardBg: "bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950",
      borderColor: "border-blue-400",
      borderGlow: "shadow-[0_0_25px_rgba(96,165,250,0.5)]",
      sectionBg: "bg-slate-900/60 border border-blue-400/30",
      textPrimary: "text-blue-50",
      textSecondary: "text-blue-200",
      accentColor: "text-cyan-300",
      badgeBg: "bg-blue-600",
      badgeText: "text-white",
    },
    gold_anniversary: {
      name: "GOLD ANNIVERSARY",
      headerBg: "bg-gradient-to-r from-yellow-600 to-amber-600",
      headerText: "text-yellow-50 font-bold tracking-widest drop-shadow-lg",
      cardBg: "bg-gradient-to-br from-gray-900 via-amber-950 to-gray-900",
      borderColor: "border-yellow-500",
      borderGlow: "shadow-[0_0_30px_rgba(234,179,8,0.6)]",
      sectionBg: "bg-black/50 border-2 border-yellow-600/50",
      textPrimary: "text-yellow-50",
      textSecondary: "text-amber-200",
      accentColor: "text-yellow-400",
      badgeBg: "bg-gradient-to-r from-yellow-500 to-amber-600",
      badgeText: "text-black font-bold",
    },
  };

  return themes[design] || themes.ghosts_online;
}

export default function TradingCard({
  artistData,
  imageUrl,
  cardDesign = 'ghosts_online',
  isProcessing = false,
  cardId,
  viewMode = 'full'
}: TradingCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const theme = getCardTheme(cardDesign);

  if (isProcessing) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="aspect-[3.5/5] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl border-2 border-dashed border-cyan-400/50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-cyan-400 text-sm font-medium">Generating Trading Card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!artistData) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="aspect-[3.5/5] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Music2 className="w-12 h-12 mx-auto text-gray-500" />
            <p className="text-sm text-gray-400">Upload audio to generate card</p>
          </div>
        </div>
      </div>
    );
  }

  const handleFlip = () => {
    if (viewMode !== 'browse') {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Card Container with 3.5:5 aspect ratio */}
      <div
        className={`relative aspect-[3.5/5] ${viewMode === 'browse' ? 'cursor-pointer hover:scale-105 transition-transform duration-300' : 'cursor-pointer'}`}
        onClick={handleFlip}
        data-testid={`trading-card-${cardId || 'default'}`}
      >
        {/* Front and Back with 3D flip */}
        <div
          className={`absolute inset-0 transition-transform duration-700 ${
            isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FRONT CARD */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className={`h-full ${theme.cardBg} rounded-xl border-4 ${theme.borderColor} ${theme.borderGlow} overflow-hidden flex flex-col`}>
              {/* Header */}
              <div className={`${theme.headerBg} px-4 py-3 text-center`}>
                <h1 className={`text-xl ${theme.headerText}`}>
                  {theme.name}
                </h1>
              </div>

              {/* Large Portrait Area */}
              <div className="flex-1 px-4 pt-4 pb-2">
                <div className="relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg overflow-hidden border-4 border-white/20 shadow-xl">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={artistData.bandName}
                      className="w-full h-full object-cover"
                      data-testid="card-portrait-image"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
                      <Users className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Genre Badge */}
              <div className="px-4 pb-2">
                <div className="flex justify-center">
                  <Badge className={`${theme.badgeBg} ${theme.badgeText} text-sm px-4 py-1 uppercase tracking-wider`}>
                    {artistData.genre}
                  </Badge>
                </div>
              </div>

              {/* Quote/Tagline Box */}
              {artistData.tradingCardText?.front?.tagline && (
                <div className="px-4 pb-3">
                  <div className="bg-white/95 text-black px-4 py-2.5 rounded border-2 border-gray-800">
                    <p className="text-center font-bold text-sm uppercase tracking-wide">
                      "{artistData.tradingCardText.front.tagline}"
                    </p>
                  </div>
                </div>
              )}

              {/* Members List at Bottom */}
              <div className="px-4 pb-4">
                <div className={`${theme.sectionBg} rounded px-3 py-2.5`}>
                  {artistData.members && artistData.members.length > 0 ? (
                    <div className="space-y-1">
                      {artistData.members.slice(0, 4).map((member, idx) => (
                        <div key={idx} className={`flex justify-between items-center text-xs ${theme.textSecondary}`}>
                          <span className={`font-semibold ${theme.textPrimary}`}>{member.name}</span>
                          <span>{member.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-center text-xs ${theme.textSecondary}`}>Solo Artist</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BACK CARD */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className={`h-full ${theme.cardBg} rounded-xl border-4 ${theme.borderColor} ${theme.borderGlow} overflow-hidden flex flex-col`}>
              {/* Header */}
              <div className={`${theme.headerBg} px-4 py-3 text-center`}>
                <h2 className={`text-xl ${theme.headerText}`}>
                  {theme.name}
                </h2>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Band Concept */}
                {artistData.concept && (
                  <div className={`${theme.sectionBg} rounded p-3`}>
                    <h3 className={`text-xs font-bold ${theme.accentColor} mb-1.5 uppercase tracking-wide`}>
                      Band Concept
                    </h3>
                    <p className={`text-xs ${theme.textSecondary} leading-relaxed`}>
                      {artistData.concept}
                    </p>
                  </div>
                )}

                {/* Members (Stylized Archetypes) */}
                {artistData.members && artistData.members.length > 0 && (
                  <div className={`${theme.sectionBg} rounded p-3`}>
                    <h3 className={`text-xs font-bold ${theme.accentColor} mb-1.5 uppercase tracking-wide`}>
                      Members (Stylized Archetypes)
                    </h3>
                    <div className="space-y-1.5">
                      {artistData.members.map((member, idx) => (
                        <div key={idx} className={`text-xs ${theme.textSecondary}`}>
                          <span className={`font-semibold ${theme.textPrimary}`}>{member.name}</span>
                          {" - "}
                          <span>{member.role}</span>
                          {member.personality && (
                            <span className="block pl-3 italic mt-0.5 text-xs">
                              {member.personality}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suno Prompt */}
                {(artistData.sunoPrompt || artistData.songTitle) && (
                  <div className={`${theme.sectionBg} rounded p-3`}>
                    <h3 className={`text-xs font-bold ${theme.accentColor} mb-1.5 uppercase tracking-wide`}>
                      Suno Prompt {artistData.songTitle && `(ex. new release)`}
                    </h3>
                    {artistData.songTitle && (
                      <p className={`text-xs ${theme.textPrimary} font-semibold mb-1`}>
                        {artistData.songTitle}
                      </p>
                    )}
                    {artistData.lyricalThemes && artistData.lyricalThemes.length > 0 && (
                      <p className={`text-xs ${theme.textSecondary} mb-1`}>
                        <span className={`font-semibold ${theme.textPrimary}`}>Lyric Theme:</span>{" "}
                        {artistData.lyricalThemes[0]}
                      </p>
                    )}
                    {artistData.influences && artistData.influences.length > 0 && (
                      <p className={`text-xs ${theme.textSecondary} mb-1`}>
                        <span className={`font-semibold ${theme.textPrimary}`}>Influences:</span>{" "}
                        {artistData.influences.join(", ")}
                      </p>
                    )}
                    {artistData.sunoPrompt && (
                      <p className={`text-xs ${theme.textSecondary} italic mt-1.5`}>
                        <span className={`font-semibold ${theme.textPrimary} not-italic`}>Suno Prompt:</span>{" "}
                        {artistData.sunoPrompt}
                      </p>
                    )}
                  </div>
                )}

                {/* Suno ID (if available) */}
                <div className={`${theme.sectionBg} rounded p-2 text-center`}>
                  <p className={`text-xs ${theme.textSecondary} font-mono`}>
                    Suno ID: <span className="italic">suvo aio</span>
                  </p>
                </div>

                {/* AetherWave Branding */}
                <div className="text-center pt-2">
                  <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Sparkles className="w-3 h-3" />
                    <span className="font-mono">AetherWave Studio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions (only in full view mode) */}
      {viewMode === 'full' && (
        <div className="mt-3 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFlipped(!isFlipped)}
            data-testid="button-flip-card"
          >
            Flip Card
          </Button>
        </div>
      )}
    </div>
  );
}
