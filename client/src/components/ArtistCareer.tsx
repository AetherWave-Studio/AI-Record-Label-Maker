import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar, Music, TrendingUp, Users, Award, Clock } from "lucide-react";
import { format } from "date-fns";

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
  createdAt: string;
}

interface ArtistEvolution {
  id: string;
  soundEvolution: string;
  fanbaseReaction: string;
  artisticGrowth: string;
  genreMastery: number;
  createdAt: string;
}

interface CareerStats {
  totalReleases: number;
  genreConsistencyScore: number;
  artisticGrowthTrend: string;
  bestPerformingRelease: Release | null;
  careerHighlights: string[];
}

interface CareerOverview {
  releases: Release[];
  evolutions: ArtistEvolution[];
  careerStats: CareerStats;
}

interface ArtistCareerProps {
  artistId: string;
  artistName: string;
}

export function ArtistCareer({ artistId, artistName }: ArtistCareerProps) {
  const { data: careerData, isLoading } = useQuery<CareerOverview>({
    queryKey: [`/api/artists/${artistId}/career`],
    enabled: !!artistId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!careerData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No career data available for this artist.
        </CardContent>
      </Card>
    );
  }

  const { releases, evolutions, careerStats } = careerData;

  return (
    <div className="space-y-6" data-testid="artist-career-overview">
      {/* Career Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {artistName} Career Overview
          </CardTitle>
          <CardDescription>
            Track the artistic journey and career progression of this virtual artist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{careerStats.totalReleases}</div>
              <div className="text-sm text-muted-foreground">Releases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(careerStats.genreConsistencyScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{careerStats.artisticGrowthTrend}</div>
              <div className="text-sm text-muted-foreground">Growth Stage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {careerStats.bestPerformingRelease && careerStats.bestPerformingRelease.peakChartPosition > 0
                  ? `#${careerStats.bestPerformingRelease.peakChartPosition}` 
                  : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Best Chart</div>
            </div>
          </div>

          {/* Career Highlights */}
          {careerStats.careerHighlights.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Career Highlights</h4>
              <div className="flex flex-wrap gap-2">
                {careerStats.careerHighlights.map((highlight, index) => (
                  <Badge key={index} variant="secondary">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Genre Consistency Meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Genre Consistency</span>
              <span>{(careerStats.genreConsistencyScore * 100).toFixed(0)}%</span>
            </div>
            <Progress value={careerStats.genreConsistencyScore * 100} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {careerStats.genreConsistencyScore > 1.1 ? "Genre Mastery" : 
               careerStats.genreConsistencyScore > 0.9 ? "Consistent Style" : 
               "Experimental Phase"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Release Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Release Timeline
          </CardTitle>
          <CardDescription>
            Chronological history of all releases and their impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          {releases.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No releases yet. This artist is ready to begin their musical journey!
            </div>
          ) : (
            <div className="space-y-4">
              {releases.map((release, index) => {
                const evolution = evolutions.find(e => e.id === release.id);
                return (
                  <div key={release.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {release.releaseTitle}
                          <Badge variant="outline" className="text-xs">
                            {release.releaseType.toUpperCase()}
                          </Badge>
                        </h4>
                        <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(release.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span>{release.genre}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={release.musicQuality > 0.7 ? "default" : 
                                   release.musicQuality > 0.4 ? "secondary" : "destructive"}
                        >
                          Quality: {release.musicQuality > 0.7 ? "High" : 
                                   release.musicQuality > 0.4 ? "Medium" : "Low"}
                        </Badge>
                        {release.peakChartPosition > 0 && (
                          <Badge variant="secondary">
                            Peak: #{release.peakChartPosition}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{release.streams.toLocaleString()}</div>
                        <div className="text-muted-foreground">Streams</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{release.likes.toLocaleString()}</div>
                        <div className="text-muted-foreground">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium capitalize">{release.fanReaction}</div>
                        <div className="text-muted-foreground">Fan Reaction</div>
                      </div>
                    </div>

                    {/* Evolution Details */}
                    {evolution && (
                      <div className="bg-muted/50 rounded p-3 space-y-2">
                        <h5 className="font-medium text-sm">Artistic Impact</h5>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>Evolution:</strong> {evolution.soundEvolution}</p>
                          <p><strong>Fan Response:</strong> {evolution.fanbaseReaction}</p>
                          <p><strong>Growth:</strong> {evolution.artisticGrowth}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs">Genre Mastery:</span>
                          <Progress 
                            value={evolution.genreMastery * 50} 
                            className="flex-1 h-1" 
                          />
                          <span className="text-xs text-muted-foreground">
                            {evolution.genreMastery > 1.3 ? "Master" : 
                             evolution.genreMastery > 1.0 ? "Skilled" : "Learning"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Performing Release */}
      {careerStats.bestPerformingRelease && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Best Performing Release
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{careerStats.bestPerformingRelease.releaseTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  {careerStats.bestPerformingRelease.genre} • {careerStats.bestPerformingRelease.releaseType}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {careerStats.bestPerformingRelease.streams.toLocaleString()} streams
                </div>
                {careerStats.bestPerformingRelease.peakChartPosition > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Peak Chart Position: #{careerStats.bestPerformingRelease.peakChartPosition}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}