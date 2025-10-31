import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Play, Pause, Download, Heart, Share2, MoreHorizontal, Shuffle, Plus } from "lucide-react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  downloadUrl: string;
  coverArt: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  coverArt: string;
  tracks: Track[];
  totalDuration: number;
  curator: string;
}

export default function PlaylistPage() {
  const [, params] = useRoute("/playlist/:playlistId");
  const { isAuthenticated } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sample AetherWave Studio playlist based on the screenshot
  const playlist: Playlist = {
    id: "aetherwave-releases",
    name: "AetherWave Studio Releases",
    description: "Where AI meets human artistry. With 30+ years of live performance & production, we craft royalty-free music for creators who demand authentic quality.",
    coverArt: "https://via.placeholder.com/300x300/6b46c1/ffffff?text=AETHERWAVE",
    curator: "AetherWave Studio",
    totalDuration: 480, // 8 minutes
    tracks: [
      {
        id: "daydreams-end-times",
        title: "Daydreams in the End Times",
        artist: "Helena Jansen Band",
        duration: 234,
        audioUrl: "/api/audio/daydreams.mp3",
        downloadUrl: "/api/download/daydreams.wav",
        coverArt: "https://via.placeholder.com/60x60/1e293b/ffffff?text=HJ"
      },
      {
        id: "you-didnt-need-bring-him",
        title: "You Didn't Need to Bring Him",
        artist: "Ghosts Online",
        duration: 246,
        audioUrl: "/api/audio/ghosts-online.mp3",
        downloadUrl: "/api/download/ghosts-online.wav",
        coverArt: "https://via.placeholder.com/60x60/dc2626/ffffff?text=GO"
      }
    ]
  };

  // Recommended tracks section
  const recommendedTracks: Track[] = [
    {
      id: "i-am-universe",
      title: "I Am The Universe",
      artist: "Dylan Tauber",
      duration: 198,
      audioUrl: "/api/audio/universe.mp3",
      downloadUrl: "/api/download/universe.wav",
      coverArt: "https://via.placeholder.com/60x60/059669/ffffff?text=DT"
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md p-4">
        <Button 
          onClick={() => window.history.back()} 
          variant="ghost" 
          size="sm"
          className="text-white hover:bg-white/10"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Playlist Header */}
      <div className="px-6 pb-6">
        <div className="flex items-end space-x-6">
          {/* Playlist Cover Art */}
          <div className="flex-shrink-0">
            <img 
              src={playlist.coverArt}
              alt={playlist.name}
              className="w-60 h-60 rounded-lg shadow-2xl"
            />
          </div>

          {/* Playlist Info */}
          <div className="flex-1 min-w-0 pb-4">
            <h1 className="text-5xl font-bold mb-4 text-white">
              {playlist.name}
            </h1>
            <p className="text-gray-300 mb-4 leading-relaxed max-w-3xl">
              {playlist.description}
            </p>
            
            {/* Playlist Stats */}
            <div className="flex items-center space-x-2 text-sm text-gray-300 mb-4">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">A</span>
              </div>
              <span className="font-medium text-white">{playlist.curator}</span>
              <span>•</span>
              <span>{formatTime(playlist.totalDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="px-6 pb-6">
        <div className="flex items-center space-x-4">
          <Button 
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14"
            data-testid="button-play-all"
          >
            <Play className="w-6 h-6 ml-1" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" data-testid="button-download-playlist">
            <Download className="w-6 h-6" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" data-testid="button-shuffle">
            <Shuffle className="w-6 h-6" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" data-testid="button-more">
            <MoreHorizontal className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-white hover:bg-white/10"
            data-testid="button-add"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-white hover:bg-white/10"
            data-testid="button-sort"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Sort
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-white hover:bg-white/10"
            data-testid="button-edit"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Track List */}
      <div className="px-6 space-y-1">
        {playlist.tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center space-x-4 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            data-testid={`track-${track.id}`}
          >
            {/* Track Cover */}
            <img 
              src={track.coverArt}
              alt={track.title}
              className="w-12 h-12 rounded"
            />
            
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{track.title}</h3>
              <p className="text-sm text-gray-400 truncate">{track.artist}</p>
            </div>
            
            {/* Track Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handlePlayPause(track)}
                className="text-gray-400 hover:text-white"
                data-testid={`button-play-${track.id}`}
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid={`button-more-${track.id}`}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Duration */}
            <span className="text-sm text-gray-400 w-12 text-right">
              {formatTime(track.duration)}
            </span>
          </div>
        ))}
      </div>

      {/* Recommended Songs Section */}
      <div className="px-6 pt-12 pb-6">
        <h2 className="text-xl font-bold text-white mb-4">Recommended Songs</h2>
        <p className="text-sm text-gray-400 mb-6">Based on the songs in this playlist</p>
        
        <div className="space-y-1">
          {recommendedTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center space-x-4 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              data-testid={`recommended-${track.id}`}
            >
              <img 
                src={track.coverArt}
                alt={track.title}
                className="w-12 h-12 rounded"
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{track.title}</h3>
                <p className="text-sm text-gray-400 truncate">{track.artist}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid={`button-add-${track.id}`}>
                  <Plus className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handlePlayPause(track)}
                  className="text-gray-400 hover:text-white"
                  data-testid={`button-play-recommended-${track.id}`}
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audio Player */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}