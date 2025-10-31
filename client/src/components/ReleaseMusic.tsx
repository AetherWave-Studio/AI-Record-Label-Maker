import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Upload, Music, TrendingUp, Users, Trophy, Star } from "lucide-react";
import type { ArtistCard, ArtistData } from "@shared/schema";

interface CareerOverview {
  releases: Array<any>;
  evolutions: Array<any>;
  careerStats: {
    totalReleases: number;
    genreConsistencyScore: number;
    artisticGrowthTrend: string;
    bestPerformingRelease: any | null;
    careerHighlights: string[];
  };
}

interface ReleaseResult {
  success: boolean;
  release: {
    id: string;
    releaseTitle: string;
    releaseType: string;
    musicQuality: number;
    genreConsistency: number;
  };
  rankingUpdate: {
    fameChange: number;
    dailyStreamsChange: number;
    totalStreamsChange: number;
    chartPositionChange: number;
    fanbaseChange: number;
    reason: string;
  };
  artistEvolution: {
    soundEvolution: string;
    fanbaseReaction: string;
    artisticGrowth: string;
    genreMastery: number;
  };
  careerSummary: string;
  message: string;
}

interface ReleaseMusicProps {
  artistCard: ArtistCard;
  onReleaseSuccess?: () => void;
}

export function ReleaseMusic({ artistCard, onReleaseSuccess }: ReleaseMusicProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [releaseTitle, setReleaseTitle] = useState("");
  const [releaseType, setReleaseType] = useState<"single" | "ep" | "album">("single");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const artistData = artistCard.artistData as ArtistData;

  // Fetch artist's career overview to show current status
  const { data: careerOverview } = useQuery<CareerOverview>({
    queryKey: [`/api/artists/${artistCard.id}/career`],
    enabled: !!artistCard.id,
  });

  const releaseMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/artists/${artistCard.id}/release`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to release music');
      }
      
      return response.json() as Promise<ReleaseResult>;
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Music Released Successfully!",
        description: data.message,
      });
      
      // Reset form
      setSelectedFile(null);
      setReleaseTitle("");
      setReleaseType("single");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/artists/${artistCard.id}/career`] });
      queryClient.invalidateQueries({ queryKey: [`/api/artists/${artistCard.id}/releases`] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-releases'] });
      
      onReleaseSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Release Failed",
        description: error instanceof Error ? error.message : "Failed to release music",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Auto-generate release title from filename if not set
    if (!releaseTitle) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setReleaseTitle(nameWithoutExtension);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an audio file to release",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to release music",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('audio', selectedFile);
    formData.append('releaseTitle', releaseTitle || selectedFile.name);
    formData.append('releaseType', releaseType);

    releaseMutation.mutate(formData);
  };

  const lastResult = releaseMutation.data;

  return (
    <div className="space-y-6" data-testid="release-music-component">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Release New Music as {artistData.bandName}
          </CardTitle>
          <CardDescription>
            Upload a new track to advance your artist's career. Music quality and genre consistency will affect fan reaction and chart performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Artist Current Status */}
          {careerOverview && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Career Status
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{careerOverview.careerStats.totalReleases}</div>
                  <div className="text-muted-foreground">Releases</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{(careerOverview.careerStats.genreConsistencyScore * 100).toFixed(0)}%</div>
                  <div className="text-muted-foreground">Consistency</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{careerOverview.careerStats.artisticGrowthTrend}</div>
                  <div className="text-muted-foreground">Growth</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{artistData.genre}</div>
                  <div className="text-muted-foreground">Genre</div>
                </div>
              </div>
              {careerOverview.careerStats.careerHighlights.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {careerOverview.careerStats.careerHighlights.map((highlight: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="audio-file">Audio File</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  data-testid="audio-file-input"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Release Title */}
            <div className="space-y-2">
              <Label htmlFor="release-title">Release Title</Label>
              <Input
                id="release-title"
                type="text"
                value={releaseTitle}
                onChange={(e) => setReleaseTitle(e.target.value)}
                placeholder="Enter the title for this release"
                data-testid="release-title-input"
              />
            </div>

            {/* Release Type */}
            <div className="space-y-2">
              <Label htmlFor="release-type">Release Type</Label>
              <Select value={releaseType} onValueChange={(value) => setReleaseType(value as "single" | "ep" | "album")}>
                <SelectTrigger data-testid="release-type-select">
                  <SelectValue placeholder="Select release type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="ep">EP</SelectItem>
                  <SelectItem value="album">Album</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={!selectedFile || releaseMutation.isPending}
              className="w-full"
              data-testid="release-button"
            >
              {releaseMutation.isPending ? "Releasing..." : `Release ${releaseType.toUpperCase()}`}
            </Button>
          </form>

          {/* Release Result */}
          {lastResult && (
            <div className="mt-6 space-y-4">
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Release Impact
                </h4>

                {/* Career Summary */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm leading-relaxed">{lastResult.careerSummary}</p>
                </div>

                {/* Stats Changes */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {lastResult.rankingUpdate.fameChange !== 0 && (
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className={`font-bold text-lg ${lastResult.rankingUpdate.fameChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {lastResult.rankingUpdate.fameChange > 0 ? '+' : ''}{lastResult.rankingUpdate.fameChange}
                      </div>
                      <div className="text-sm text-muted-foreground">FAME</div>
                    </div>
                  )}
                  
                  {lastResult.rankingUpdate.fanbaseChange !== 0 && (
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className={`font-bold text-lg ${lastResult.rankingUpdate.fanbaseChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {lastResult.rankingUpdate.fanbaseChange > 0 ? '+' : ''}{lastResult.rankingUpdate.fanbaseChange}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                        <Users className="h-3 w-3" />
                        Fans
                      </div>
                    </div>
                  )}

                  {lastResult.rankingUpdate.dailyStreamsChange !== 0 && (
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className={`font-bold text-lg ${lastResult.rankingUpdate.dailyStreamsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {lastResult.rankingUpdate.dailyStreamsChange > 0 ? '+' : ''}{lastResult.rankingUpdate.dailyStreamsChange.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Daily Streams</div>
                    </div>
                  )}
                </div>

                {/* Artistic Evolution */}
                <div className="space-y-2">
                  <h5 className="font-medium">Artistic Evolution</h5>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Sound:</strong> {lastResult.artistEvolution.soundEvolution}</p>
                    <p><strong>Fan Reaction:</strong> {lastResult.artistEvolution.fanbaseReaction}</p>
                    <p><strong>Growth:</strong> {lastResult.artistEvolution.artisticGrowth}</p>
                  </div>
                </div>

                {/* Release Quality Indicators */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={lastResult.release.musicQuality > 0.7 ? "default" : lastResult.release.musicQuality > 0.4 ? "secondary" : "destructive"}>
                    Quality: {lastResult.release.musicQuality > 0.7 ? "High" : lastResult.release.musicQuality > 0.4 ? "Medium" : "Low"}
                  </Badge>
                  <Badge variant={lastResult.release.genreConsistency > 1.1 ? "default" : lastResult.release.genreConsistency > 0.9 ? "secondary" : "outline"}>
                    Consistency: {lastResult.release.genreConsistency > 1.1 ? "Mastery" : lastResult.release.genreConsistency > 0.9 ? "Consistent" : "Departure"}
                  </Badge>
                  <Badge variant="outline">
                    {lastResult.rankingUpdate.reason}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}