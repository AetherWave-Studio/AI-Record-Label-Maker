import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, Play, Pause, Heart, Share2, MoreHorizontal, Download, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface ArtistPageData {
  id: string;
  bandName: string;
  genre: string;
  philosophy: string;
  bandConcept: string;
  members: Array<{
    name: string;
    role: string;
    archetype: string;
  }>;
  influences: string[];
  signatureSound: string;
  imageUrl: string;
  cardImageUrl: string;
  fileName: string;
  duration: number;
  tempo: number;
  key: string;
  energy: string;
  createdAt: string;
  rarity: string;
  streamCount?: number;
  monthlyListeners?: number;
}

export default function ArtistPage() {
  const [, params] = useRoute("/artist/:cardId");
  const { isAuthenticated } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const { data: artistData, isLoading } = useQuery({
    queryKey: ["/api/artist-cards", params?.cardId],
    queryFn: () => fetch(`/api/artist-cards/${params?.cardId}`).then(res => res.json()),
    enabled: !!params?.cardId,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'text-amber-400 border-amber-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'uncommon': return 'text-green-400 border-green-400';
      default: return 'text-soft-gray border-soft-gray';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate flex items-center justify-center">
        <div className="text-sky-glint text-xl">Loading artist...</div>
      </div>
    );
  }

  if (!artistData || !artistData.artistData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate flex items-center justify-center">
        <div className="text-center">
          <div className="text-white-smoke text-xl mb-4">Artist Not Found</div>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const artist = artistData.artistData;
  const streamCount = Math.floor(Math.random() * 50000) + 1000;
  const monthlyListeners = Math.floor(Math.random() * 10000) + 500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate text-white-smoke">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-charcoal/80 backdrop-blur-md border-b border-soft-gray/20 p-4">
        <Button 
          onClick={() => window.history.back()} 
          variant="ghost" 
          size="sm"
          className="text-white-smoke hover:bg-sky-glint/20"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-80 md:h-96 bg-gradient-to-b from-purple-900/20 to-charcoal/80 relative overflow-hidden">
          {artist.imageUrl && (
            <img 
              src={artist.imageUrl} 
              alt={artist.bandName}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-end space-x-6">
              {/* Album/Card Art */}
              <div className="flex-shrink-0">
                <img 
                  src={artist.cardImageUrl || artist.imageUrl || "/api/placeholder/200/200"} 
                  alt={artist.bandName}
                  className="w-32 h-32 md:w-48 md:h-48 rounded-lg shadow-2xl border-2 border-sky-glint/30"
                />
              </div>

              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className={`mb-2 ${getRarityColor(artistData?.rarity || 'Common')}`}>
                  {artistData?.rarity || 'Common'} Artist
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-white-smoke to-sky-glint bg-clip-text text-transparent">
                  {artist.bandName}
                </h1>
                <p className="text-soft-gray text-lg mb-2">{artist.genre}</p>
                <div className="flex items-center space-x-4 text-sm text-soft-gray">
                  <span>{monthlyListeners.toLocaleString()} monthly listeners</span>
                  <span>•</span>
                  <span>{streamCount.toLocaleString()} total streams</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-charcoal/90 backdrop-blur-md border-b border-soft-gray/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14"
                onClick={() => setIsPlaying(!isPlaying)}
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={`${isLiked ? 'text-green-400' : 'text-soft-gray'} hover:text-green-400`}
                data-testid="button-like"
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              
              <Button variant="ghost" size="sm" className="text-soft-gray hover:text-white-smoke" data-testid="button-share">
                <Share2 className="w-5 h-5" />
              </Button>
              
              <Button variant="ghost" size="sm" className="text-soft-gray hover:text-white-smoke" data-testid="button-more">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {isAuthenticated && (
              <Button variant="outline" size="sm" className="border-sky-glint text-sky-glint hover:bg-sky-glint hover:text-charcoal" data-testid="button-download">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Track List */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Latest Release</h2>
              <div className="bg-charcoal/60 rounded-xl p-6">
                <div className="flex items-center justify-between p-4 hover:bg-sky-glint/10 rounded-lg transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-glint to-electric-blue rounded-lg flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-white-smoke">{artistData?.fileName?.replace(/\.[^/.]+$/, '') || 'Untitled Track'}</h3>
                      <p className="text-sm text-soft-gray">{artist.bandName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-soft-gray">
                    <span className="text-sm">{streamCount.toLocaleString()}</span>
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatDuration(artistData?.duration || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <div className="bg-charcoal/60 rounded-xl p-6 space-y-4">
                <p className="text-soft-gray leading-relaxed">{artist.bandConcept}</p>
                <div className="border-t border-soft-gray/20 pt-4">
                  <h3 className="font-semibold text-white-smoke mb-2">Artistic Philosophy</h3>
                  <p className="text-soft-gray italic">"{artist.philosophy}"</p>
                </div>
              </div>
            </div>

            {/* Band Members */}
            {artist.members && artist.members.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Band Members</h2>
                <div className="bg-charcoal/60 rounded-xl p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {artist.members.map((member: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-deep-slate/50">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-glint to-electric-blue rounded-full flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white-smoke">{member.name}</h4>
                          <p className="text-sm text-soft-gray">{member.role}</p>
                          <p className="text-xs text-sky-glint">{member.archetype}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-charcoal/60 rounded-xl p-6">
              <h3 className="font-semibold text-white-smoke mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-soft-gray">Monthly Listeners</span>
                  <span className="text-white-smoke font-medium">{monthlyListeners.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soft-gray">Total Streams</span>
                  <span className="text-white-smoke font-medium">{streamCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soft-gray">Genre</span>
                  <span className="text-sky-glint font-medium">{artist.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soft-gray">Tempo</span>
                  <span className="text-white-smoke font-medium">{artistData?.tempo || 'Unknown'} BPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soft-gray">Key</span>
                  <span className="text-white-smoke font-medium">{artistData?.key || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soft-gray">Energy</span>
                  <span className="text-white-smoke font-medium">{artistData?.energy || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Release Info */}
            <div className="bg-charcoal/60 rounded-xl p-6">
              <h3 className="font-semibold text-white-smoke mb-4">Release Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-soft-gray" />
                  <span className="text-soft-gray">Released {formatDate(artistData?.createdAt || new Date().toISOString())}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getRarityColor(artistData?.rarity || 'Common')}>
                    {artistData?.rarity || 'Common'}
                  </Badge>
                </div>
                <div className="text-xs text-soft-gray pt-2 border-t border-soft-gray/20">
                  ℗ 2025 AetherWave Studio<br/>
                  ℗ 2025 AetherWave Studio
                </div>
              </div>
            </div>

            {/* Influences */}
            {artist.influences && artist.influences.length > 0 && (
              <div className="bg-charcoal/60 rounded-xl p-6">
                <h3 className="font-semibold text-white-smoke mb-4">Influences</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.influences.map((influence: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs border-sky-glint/30 text-sky-glint hover:bg-sky-glint/10"
                    >
                      {influence}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Sound */}
            {artist.signatureSound && (
              <div className="bg-charcoal/60 rounded-xl p-6">
                <h3 className="font-semibold text-white-smoke mb-4">Signature Sound</h3>
                <p className="text-sm text-soft-gray leading-relaxed">{artist.signatureSound}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}