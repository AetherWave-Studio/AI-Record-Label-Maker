import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Calendar, TrendingUp, Heart, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";

interface Release {
  id: string;
  releaseTitle: string;
  releaseType: string;
  genre: string;
  musicQuality: number;
  genreConsistency: number;
  streams: number;
  likes: number;
  fanReaction: string;
  peakChartPosition: number;
  duration: number;
  audioUrl?: string;
  createdAt: string;
}

interface ArtistPlaylistProps {
  artistId: string;
  artistName: string;
  artistImage?: string;
}

export function ArtistPlaylist({ artistId, artistName, artistImage }: ArtistPlaylistProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Release | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: releases, isLoading } = useQuery<Release[]>({
    queryKey: [`/api/artists/${artistId}/releases`],
    enabled: !!artistId,
  });

  const handlePlayPause = (release: Release) => {
    // If no audio URL available, show message
    if (!release.audioUrl) {
      console.warn('No audio URL available for release:', release.releaseTitle);
      return;
    }
    
    if (currentTrack?.id === release.id) {
      // Toggle play/pause for current track
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      // Switch to new track
      setCurrentTrack(release);
      setPlayingTrack(release.id);
      setIsPlaying(true);
    }
  };

  // Handle audio element loading and playing
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl || '';
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play audio:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack, isPlaying]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <Play className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Music Yet</h3>
              <p className="text-muted-foreground">
                This artist hasn't released any tracks. Their musical journey is about to begin!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalStreams = releases.reduce((sum, release) => sum + release.streams, 0);
  const totalLikes = releases.reduce((sum, release) => sum + release.likes, 0);

  return (
    <div className="space-y-6" data-testid="artist-playlist">
      {/* Artist Header */}
      <div className="flex items-end gap-6 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 rounded-lg text-white">
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
          {artistImage ? (
            <img
              src={artistImage}
              alt={artistName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Play className="h-16 w-16 text-white/70" />
          )}
        </div>
        <div className="space-y-4">
          <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
            Artist Profile
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight">{artistName}</h1>
          <div className="flex items-center gap-6 text-sm text-white/80">
            <span>{releases.length} {releases.length === 1 ? 'release' : 'releases'}</span>
            <span>{totalStreams.toLocaleString()} total streams</span>
            <span>{totalLikes.toLocaleString()} likes</span>
          </div>
        </div>
      </div>

      {/* Discography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Discography
          </CardTitle>
          <CardDescription>
            Complete collection of releases by {artistName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-muted-foreground border-b">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Streams</div>
              <div className="col-span-2">Chart Peak</div>
              <div className="col-span-1">
                <Clock className="h-4 w-4" />
              </div>
              <div className="col-span-1"></div>
            </div>

            {/* Track Rows */}
            {releases.map((release, index) => (
              <div
                key={release.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 group transition-colors"
                data-testid={`track-${index}`}
              >
                {/* Play Button & Track Number */}
                <div className="col-span-1 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handlePlayPause(release)}
                    data-testid={`play-button-${index}`}
                  >
                    {currentTrack?.id === release.id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground group-hover:hidden">
                    {index + 1}
                  </span>
                </div>

                {/* Title and Info */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {release.releaseTitle}
                      {currentTrack?.id === release.id && isPlaying && (
                        <div className="inline-flex items-center gap-1 ml-2">
                          <div className="w-1 h-3 bg-green-500 animate-pulse" />
                          <div className="w-1 h-2 bg-green-500 animate-pulse delay-100" />
                          <div className="w-1 h-4 bg-green-500 animate-pulse delay-200" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {release.releaseType.toUpperCase()}
                      </Badge>
                      <span>{release.genre}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(release.createdAt), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Streams */}
                <div className="col-span-2 flex items-center">
                  <div className="text-sm">
                    {release.streams > 0 ? (
                      <>
                        <div className="font-medium">{release.streams.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">streams</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                {/* Chart Position */}
                <div className="col-span-2 flex items-center">
                  {release.peakChartPosition > 0 ? (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        #{release.peakChartPosition}
                      </Badge>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>

                {/* Duration / Progress */}
                <div className="col-span-1 flex items-center text-sm text-muted-foreground">
                  {currentTrack?.id === release.id && isPlaying ? (
                    <div className="flex items-center gap-2">
                      <span>{formatDuration(currentTime)}</span>
                      <span>/</span>
                      <span>{formatDuration(duration || release.duration || 0)}</span>
                    </div>
                  ) : (
                    formatDuration(release.duration || 0)
                  )}
                </div>

                {/* More Options */}
                <div className="col-span-1 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Release Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {totalStreams.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Streams</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              {totalLikes.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Likes</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {Math.min(...releases.filter(r => r.peakChartPosition > 0).map(r => r.peakChartPosition)) || 0 > 0 
                ? `#${Math.min(...releases.filter(r => r.peakChartPosition > 0).map(r => r.peakChartPosition))}`
                : '—'}
            </div>
            <div className="text-sm text-muted-foreground">Best Chart Position</div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden Audio Player */}
      {currentTrack && (
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => {
            const audio = e.target as HTMLAudioElement;
            if (audio) {
              setCurrentTime(audio.currentTime);
            }
          }}
          onLoadedMetadata={(e) => {
            const audio = e.target as HTMLAudioElement;
            if (audio) {
              setDuration(audio.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTrack(null);
            setPlayingTrack(null);
            setCurrentTime(0);
            setDuration(0);
          }}
          onError={() => {
            console.error('Audio playback error');
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
}