import { useState } from "react";
import { RotateCcw, Download, Share2, FileText, Star, Music, Trophy, Users, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArtistData } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { generateArtistProfilePDF } from "@/lib/pdf-generator";

interface TradingCardProps {
  artistData: ArtistData | null;
  imageUrl?: string;
  theme: string;
  isProcessing: boolean;
  cardId?: string;
  onFileUpload?: (file: File) => void;
  viewMode?: 'full' | 'gallery' | 'browse'; // full = all controls, gallery = limited controls, browse = no controls, clickable
}

// Helper function to truncate text with character limit
const truncateText = (text: string, limit: number) => {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
};

export default function TradingCard({ artistData, imageUrl, theme, isProcessing, cardId, onFileUpload, viewMode = 'full' }: TradingCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { user } = useAuth();
  
  // Theme-based styling for 5x7 sports card
  const getThemeClasses = () => {
    switch (theme) {
      case "light":
        return {
          cardBg: "from-gray-50 via-white to-gray-50",
          borderColor: "border-gray-400",
          textPrimary: "text-gray-900",
          textSecondary: "text-gray-600",
          highlight: "text-blue-600",
          accentBg: "bg-blue-50",
          headerBg: "bg-gradient-to-r from-blue-500 to-blue-600"
        };
      case "vibrant":
        return {
          cardBg: "from-purple-600 via-pink-500 to-orange-500",
          borderColor: "border-yellow-400",
          textPrimary: "text-white",
          textSecondary: "text-gray-100",
          highlight: "text-yellow-300",
          accentBg: "bg-black/20",
          headerBg: "bg-gradient-to-r from-yellow-400 to-orange-400"
        };
      default: // dark
        return {
          cardBg: "from-slate-800 via-slate-900 to-slate-800",
          borderColor: "border-cyan-400",
          textPrimary: "text-white",
          textSecondary: "text-gray-300",
          highlight: "text-cyan-400",
          accentBg: "bg-cyan-900/20",
          headerBg: "bg-gradient-to-r from-cyan-500 to-blue-500"
        };
    }
  };
  
  const themeClasses = getThemeClasses();

  const handleFlip = () => {
    console.log("Card flip triggered, current state:", isFlipped);
    setIsFlipped(!isFlipped);
  };

  const generateProfilePDF = async () => {
    if (!artistData) return;
    console.log("Generating PDF for artist:", artistData.bandName);
    
    try {
      const response = await fetch("/api/generate-profile-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artistData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate profile");
      }

      // Get the HTML content and open in new tab for PDF printing
      const htmlContent = await response.text();
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        // Automatically trigger print dialog
        setTimeout(() => {
          newWindow.print();
        }, 1000);
      }
    } catch (error) {
      console.error("Error generating profile:", error);
    }
  };

  const handleDownload = () => {
    console.log("Download card functionality would be implemented here");
    // This would capture the card as an image and download it
  };

  if (isProcessing) {
    return (
      <div className="w-full max-w-sm mx-auto">
        {/* 5x7 aspect ratio card (approximately 3.5:5 ratio) */}
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
        <div 
          className="aspect-[3.5/5] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center cursor-pointer border-gray-600 hover:border-sky-glint/50 hover:bg-slate-800/80"
          data-testid="upload-card-area"
        >
          <div className="text-center space-y-2">
            <Music className="w-12 h-12 mx-auto transition-colors text-gray-500" />
            <p className="text-sm transition-colors text-gray-400">
              Upload audio to generate card
            </p>
            <p className="text-xs text-gray-500">
              Click "Choose Files" button above
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFlipClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFlip();
  };

  const cardContent = (
    <div className="w-full max-w-sm mx-auto">
      {/* Card Container with 5x7 aspect ratio */}
      <div className={`relative aspect-[3.5/5] group ${viewMode === 'browse' ? 'cursor-pointer hover:scale-105 transition-transform duration-300' : 'cursor-pointer'}`} onClick={viewMode === 'browse' ? undefined : handleFlip}>
        {/* Front and Back Card with 3D flip effect */}
        <div 
          className={`absolute inset-0 transition-transform duration-700 ${
            isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FRONT CARD */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
            <div className={`h-full bg-gradient-to-br ${themeClasses.cardBg} rounded-xl border-2 ${themeClasses.borderColor} shadow-2xl overflow-hidden flex flex-col`}>
              {/* Header Banner with FAME - Fixed Height */}
              <div className={`${themeClasses.headerBg} px-3 py-2 relative flex-shrink-0 h-12`}>
                <div className="flex items-center justify-between h-full">
                  {/* FAME Score with Star */}
                  <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    <span className="text-xs font-bold text-white">
                      {user?.fame || 1}
                    </span>
                  </div>
                  
                  {/* Center Title */}
                  <h2 className="font-bold text-sm text-white tracking-wide">
                    VIRTUAL ARTIST
                  </h2>
                  
                  {/* Trophy Icon */}
                  <div className="bg-black/20 px-2 py-1 rounded-full">
                    <Trophy className="w-3 h-3 text-yellow-300" />
                  </div>
                </div>
              </div>

              {/* Artist Portrait - Fixed Height and Position */}
              <div className="px-3 pt-3 flex-shrink-0">
                <div className="relative w-full h-[140px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                  {imageUrl && imageUrl.trim() ? (
                    <img 
                      src={imageUrl} 
                      alt={artistData.bandName || "Artist"}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        console.log("Image loaded successfully:", imageUrl);
                      }}
                      onError={(e) => {
                        console.log("Image failed to load:", imageUrl);
                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback icon - always present but hidden when image loads */}
                  <div className={`fallback-icon absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 ${imageUrl ? 'hidden' : 'flex'}`}>
                    <Users className="w-12 h-12 text-gray-600" />
                  </div>
                  
                  {/* Rarity Badge */}
                  <div className="absolute top-1 right-1 z-10">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-yellow-400 text-black font-bold">
                      RARE
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Artist Name - Fixed Height */}
              <div className="px-3 pt-3 flex-shrink-0 h-8">
                <h3 className={`font-bold text-base ${themeClasses.textPrimary} text-center tracking-tight leading-tight overflow-hidden`}>
                  {truncateText(artistData.bandName || "Unknown Artist", 18)}
                </h3>
              </div>

              {/* Genre Badge - Fixed Height and Consistent Size */}
              <div className="px-3 pt-2 text-center flex-shrink-0 h-7">
                <Badge variant="outline" className={`text-xs px-2 py-1 ${themeClasses.highlight} border-current font-medium`}>
                  {truncateText(artistData.genre || "Unknown", 12)}
                </Badge>
              </div>

              {/* Bottom Info Section - Fixed Height with Overflow Hidden */}
              <div className="px-3 pt-3 flex-grow flex flex-col justify-between overflow-hidden pb-3">
                {/* Stats Row */}
                <div className={`text-xs ${themeClasses.textSecondary} space-y-1.5`}>
                  <div className="flex justify-between items-center">
                    <span>Members:</span>
                    <span className="font-semibold">{artistData.members?.length || 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Influences:</span>
                    <span className="font-semibold text-right max-w-[80px] truncate">
                      {Array.isArray(artistData.influences) && artistData.influences.length > 0 
                        ? artistData.influences[0] 
                        : "Various"}
                    </span>
                  </div>
                </div>

                {/* Philosophy - Constrained to Bottom */}
                <div className={`text-xs ${themeClasses.textSecondary} mt-2`}>
                  <div className="flex items-start gap-1">
                    <span className="font-medium text-xs">Philosophy:</span>
                    {(artistData.philosophy?.length || 0) > 30 && (
                      <button 
                        onClick={generateProfilePDF}
                        className={`${themeClasses.highlight} hover:underline font-medium`}
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 leading-tight text-xs overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {truncateText(artistData.philosophy || "Creating music that resonates", 50)}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* BACK CARD */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className={`h-full bg-gradient-to-br ${themeClasses.cardBg} rounded-xl border-2 ${themeClasses.borderColor} shadow-2xl overflow-hidden`}>
              {/* Header */}
              <div className={`${themeClasses.headerBg} px-3 py-2 text-center`}>
                <h2 className={`font-bold text-sm ${themeClasses.textPrimary} tracking-wide`}>
                  ARTIST PROFILE
                </h2>
              </div>

              {/* Simplified Back Content */}
              <div className="p-3 space-y-3">
                {/* Brief Quote/Philosophy */}
                <div>
                  <h4 className={`text-xs font-bold ${themeClasses.textPrimary} mb-1`}>ARTIST QUOTE</h4>
                  <p className={`text-xs ${themeClasses.textSecondary} italic leading-relaxed`}>
                    "{truncateText(artistData.philosophy || "Making music that speaks to the soul", 60)}..."
                  </p>
                </div>

                {/* Key Stats Only */}
                <div>
                  <h4 className={`text-xs font-bold ${themeClasses.textPrimary} mb-1`}>STATS</h4>
                  <div className={`grid grid-cols-2 gap-2 text-xs ${themeClasses.textSecondary}`}>
                    <div>Genre: {truncateText(artistData.genre || "Rock", 8)}</div>
                    <div>Members: {artistData.members?.length || 1}</div>
                    <div>Rarity: Rare</div>
                    <div>Power: ★★★★☆</div>
                  </div>
                </div>

                {/* Lead Member Only */}
                {artistData.members && artistData.members.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-bold ${themeClasses.textPrimary} mb-1`}>LEAD ARTIST</h4>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                      <span className="font-medium">{truncateText(artistData.members[0].name || "", 18)}</span>
                      {artistData.members[0].role && (
                        <span className="block">{truncateText(artistData.members[0].role, 20)}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Profile Link - More Prominent */}
                <div className={`${themeClasses.accentBg} rounded-lg p-2 text-center border border-current`}>
                  <button 
                    onClick={generateProfilePDF}
                    className={`text-xs ${themeClasses.highlight} hover:underline font-bold flex items-center justify-center gap-1`}
                  >
                    <FileText className="w-3 h-3" />
                    Complete Profile & Story
                  </button>
                  <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                    Full background, all members & more
                  </p>
                </div>

                {/* Suno Music Generation Prompt - Last Item */}
                {artistData.sunoPrompt && (
                  <div>
                    <h4 className={`text-xs font-bold ${themeClasses.textPrimary} mb-1 flex items-center gap-1`}>
                      <Music className="w-3 h-3" />
                      NEXT RELEASE - AI PROMPT
                    </h4>
                    <div className={`text-xs ${themeClasses.textSecondary} leading-tight bg-black/20 p-2 rounded border border-dashed border-current/30`}>
                      <p className="font-mono">
                        {truncateText(artistData.sunoPrompt, 160)}
                        {artistData.sunoPrompt.length > 160 && (
                          <span className={`${themeClasses.highlight} font-bold`}>... [Full prompt in PDF]</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Back Footer */}
              <div className="absolute bottom-2 left-3 right-3 flex justify-between">
                <span className={`text-xs ${themeClasses.textSecondary} font-mono`}>
                  SC-001
                </span>
                <span className={`text-xs ${themeClasses.textSecondary} font-mono`}>
                  ©2024 AetherWave
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Flip Overlay - only show in browse mode */}
        {viewMode === 'browse' && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={handleFlipClick}
              variant="secondary"
              size="sm"
              className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border-white/20 h-8 w-8 p-0"
              data-testid="button-flip-overlay"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Card Controls - only show in non-browse mode */}
      {viewMode !== 'browse' && (
        <div className="flex justify-center flex-wrap gap-2 mt-4">
          {cardId && (
            <Link href={`/artist/${cardId}`}>
              <Button
                variant="default" 
                size="sm"
                className="bg-sky-glint hover:bg-sky-glint/80 text-white"
                data-testid="button-view-artist"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View Artist
              </Button>
            </Link>
          )}
          
          {/* Release New Music Button - only show for card owners in full mode */}
          {cardId && user && viewMode === 'full' && (
            <Link href={`/artist/${cardId}?tab=release`}>
              <Button
                variant="default"
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-release-music"
              >
                <Music className="w-4 h-4 mr-1" />
                Release Music
              </Button>
            </Link>
          )}
          
          <Button
            onClick={handleFlip}
            variant="outline" 
            size="sm"
            data-testid="button-flip-card"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Flip
          </Button>
          
          {/* Download and PDF buttons - only show in full mode */}
          {viewMode === 'full' && (
            <>
              <Button
                onClick={handleDownload}
                variant="outline" 
                size="sm"
                data-testid="button-download-card"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                onClick={generateProfilePDF}
                variant="outline" 
                size="sm"
                data-testid="button-profile-pdf"
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  // In browse mode, wrap the entire card in a Link
  if (viewMode === 'browse' && cardId) {
    return (
      <Link href={`/artist/${cardId}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}