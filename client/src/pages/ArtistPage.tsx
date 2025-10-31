import { useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Music, Play, Users, Star, Upload, Edit, Image as ImageIcon, Award, Crown, Gem } from "lucide-react";
import { ReleaseMusic } from "@/components/ReleaseMusic";
import { ArtistCareer } from "@/components/ArtistCareer";
import { ArtistPlaylist } from "@/components/ArtistPlaylist";
import { BandEditForm } from "../components/BandEditForm";
import { MediaUploader } from "@/components/MediaUploader";
import { useToast } from "@/hooks/use-toast";
import type { ArtistCard, ArtistData } from "@shared/schema";

export function ArtistPage() {
  const { cardId } = useParams();
  const searchQuery = useSearch();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const { toast } = useToast();
  
  // Handle tab query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(searchQuery);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'career', 'release'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchQuery]);

  // Fetch the artist card
  const { data: artistCard, isLoading, error } = useQuery<ArtistCard>({
    queryKey: [`/api/artist-cards/${cardId}`],
    enabled: !!cardId,
  });

  // Fetch band achievements
  const { data: achievements = [] } = useQuery<any[]>({
    queryKey: [`/api/artist/${cardId}/achievements`],
    enabled: !!cardId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !artistCard) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Artist Not Found</h1>
              <p className="text-muted-foreground">
                The artist you're looking for doesn't exist or has been removed.
              </p>
              <Button 
                onClick={() => window.history.back()} 
                className="mt-4"
                data-testid="back-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const artistData = artistCard.artistData as ArtistData;
  const isOwner = isAuthenticated && user?.id === artistCard.userId;
  const isRecordExecutive = (user as any)?.subscriptionTier === "Pro";
  
  const handleEditClick = () => {
    if (!isOwner) return;
    
    if (!isRecordExecutive) {
      toast({
        title: "Editing Restricted",
        description: "Editing allowed at Record Executive level only. Upgrade to Pro to unlock full band editing capabilities.",
        variant: "destructive",
        action: (
          <button 
            onClick={() => window.location.href = '/upgrade'}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white text-sm"
          >
            Upgrade Now
          </button>
        ),
      });
      return;
    }
    
    setIsEditing(true);
  };
  
  const handleEditComplete = () => {
    setIsEditing(false);
    // Refetch the artist data
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-6" data-testid="artist-page">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Artist Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Artist Image */}
              <div className="w-full md:w-64 aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {artistCard.imageUrl ? (
                  <img 
                    src={artistCard.imageUrl} 
                    alt={artistData.bandName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground text-center">
                    <Music className="h-16 w-16 mx-auto mb-2" />
                    <div>No Image</div>
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-4xl font-bold" data-testid="artist-name">
                      {artistData.bandName}
                    </h1>
                    <div className="flex gap-2">
                      {isOwner && (
                        <>
                          <Button
                            onClick={handleEditClick}
                            variant="outline"
                            size="sm"
                            data-testid="edit-band-button"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Band Info
                          </Button>
                          <Button
                            onClick={() => setShowMediaUploader(true)}
                            variant="outline"
                            size="sm"
                            data-testid="media-button"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Media
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" data-testid="artist-genre">
                      {artistData.genre}
                    </Badge>
                    <Badge variant="outline">{artistCard.rarity}</Badge>
                    {isOwner && (
                      <Badge variant="default">Your Artist</Badge>
                    )}
                    
                    {/* Achievement Badges */}
                    {achievements && Array.isArray(achievements) && achievements.length > 0 && (
                      <div className="flex gap-2 ml-2">
                        {achievements.map((achievement: any) => (
                          <div key={achievement.id} className="flex items-center gap-1" title={achievement.description}>
                            {achievement.iconType === 'gold' && (
                              <div className="flex items-center bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30">
                                <img 
                                  src="/attached_assets/GoldRecord_1756333348978.png" 
                                  alt="Gold Record"
                                  className="h-5 w-5 object-contain"
                                />
                                <span className="text-xs text-yellow-700 ml-1 font-semibold">GOLD</span>
                              </div>
                            )}
                            {achievement.iconType === 'platinum' && (
                              <div className="flex items-center bg-gray-400/20 px-2 py-1 rounded-full border border-gray-400/30">
                                <Crown className="h-4 w-4 text-gray-600" />
                                <span className="text-xs text-gray-700 ml-1 font-semibold">PLATINUM</span>
                              </div>
                            )}
                            {achievement.iconType === 'diamond' && (
                              <div className="flex items-center bg-blue-500/20 px-2 py-1 rounded-full border border-blue-500/30">
                                <Gem className="h-4 w-4 text-blue-600" />
                                <span className="text-xs text-blue-700 ml-1 font-semibold">DIAMOND</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Band Members */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Band Members
                  </h3>
                  <div className="space-y-2">
                    {artistData.members.map((member, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted-foreground">• {member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Philosophy */}
                <div>
                  <h3 className="font-semibold mb-2">Philosophy</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {artistData.philosophy}
                  </p>
                </div>

                {/* Influences */}
                <div>
                  <h3 className="font-semibold mb-2">Musical Influences</h3>
                  <div className="flex flex-wrap gap-1">
                    {artistData.influences.map((influence, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {influence}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sales Metrics */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Sales Performance
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-bold text-primary" data-testid="physical-copies">
                        {(artistCard.physicalCopies || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Physical Copies</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-bold text-primary" data-testid="digital-downloads">
                        {(artistCard.digitalDownloads || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Digital Downloads</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-bold text-primary" data-testid="total-streams">
                        {(artistCard.totalStreams || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Streams</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm text-muted-foreground">
                      Combined Sales: <span className="font-semibold text-primary">
                        {((artistCard.physicalCopies || 0) + (artistCard.digitalDownloads || 0) + (artistCard.totalStreams || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview" data-testid="overview-tab">
              Overview
            </TabsTrigger>
            <TabsTrigger value="music" data-testid="music-tab">
              <Play className="h-4 w-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger value="career" data-testid="career-tab">
              Career History
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="release" data-testid="release-tab">
                <Upload className="h-4 w-4 mr-2" />
                Release Music
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Artist Details</CardTitle>
                <CardDescription>
                  Comprehensive information about {artistData.bandName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Band Concept */}
                <div>
                  <h3 className="font-semibold mb-2">Band Concept</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {artistData.bandConcept}
                  </p>
                </div>

                {/* Signature Sound */}
                <div>
                  <h3 className="font-semibold mb-2">Signature Sound</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {artistData.signatureSound}
                  </p>
                </div>

                {/* Lyrical Themes */}
                <div>
                  <h3 className="font-semibold mb-2">Lyrical Themes</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {artistData.lyricalThemes}
                  </p>
                </div>

                {/* Live Visuals */}
                <div>
                  <h3 className="font-semibold mb-2">Live Performance Style</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {artistData.liveVisuals}
                  </p>
                </div>

                {/* Suno AI Music Generation Prompt */}
                {artistData.sunoPrompt && (
                  <div>
                    <h3 className="font-semibold mb-2">Music Recreation Guide (Suno AI)</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm leading-relaxed font-mono">
                        {artistData.sunoPrompt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use this prompt in Suno AI to generate music in this artist's style
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="mt-6">
            <ArtistPlaylist 
              artistId={artistCard.id} 
              artistName={artistData.bandName}
              artistImage={artistCard.imageUrl || undefined}
            />
          </TabsContent>

          {/* Career History Tab */}
          <TabsContent value="career" className="mt-6">
            <ArtistCareer artistId={artistCard.id} artistName={artistData.bandName} />
          </TabsContent>

          {/* Release Music Tab (only for owners) */}
          {isOwner && (
            <TabsContent value="release" className="mt-6">
              <ReleaseMusic 
                artistCard={artistCard} 
                onReleaseSuccess={() => {
                  // Switch to career tab to show the new release
                  setActiveTab("career");
                }}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Band Edit Form Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
            <div className="w-full max-w-4xl">
              <BandEditForm
                artistCard={artistCard}
                onComplete={handleEditComplete}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          </div>
        )}

        {/* Media Uploader Modal */}
        {showMediaUploader && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
            <MediaUploader
              artistCardId={artistCard.id}
              onClose={() => setShowMediaUploader(false)}
            />
          </div>
        )}

        {/* Back to Cards Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            data-testid="back-to-cards-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cards
          </Button>
        </div>
      </div>
    </div>
  );
}