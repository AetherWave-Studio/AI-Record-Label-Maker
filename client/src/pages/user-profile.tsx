import { useState, useEffect } from "react";
import { useParams, useSearch, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, User, Music, Trophy, Play, Star, Users, Crown, Zap, Coins, Camera, Upload, TrendingUp, Disc, Store } from "lucide-react";
import type { User as UserType, Band, PlanType } from "@shared/schema";
import { PLAN_DISPLAY_NAMES, BAND_LIMITS } from "@shared/schema";

interface UserStats {
  totalBands: number;
  totalStreams: number;
  totalSales: number;
  averageFame: number;
  highestChartPosition: number;
  credits: number;
  subscriptionPlan: PlanType;
  bandLimit: number | 'unlimited';
}

export function UserProfile() {
  const { userId } = useParams();
  const searchQuery = useSearch();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Handle tab query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(searchQuery);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'collection', 'releases', 'stats'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchQuery]);

  // Fetch user profile data
  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user's bands
  const { data: userBands, isLoading: bandsLoading } = useQuery<Band[]>({
    queryKey: [`/api/bands`],
    enabled: !!userId && isAuthenticated,
    select: (bands) => bands.filter(band => band.userId === userId),
  });

  const isOwnProfile = currentUser?.id === userId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isLoading = userLoading || bandsLoading;

  // Calculate user stats from bands
  const userStats: UserStats = {
    totalBands: userBands?.length || 0,
    totalStreams: userBands?.reduce((sum, band) => sum + (band.totalStreams || 0), 0) || 0,
    totalSales: userBands?.reduce((sum, band) => sum + (band.physicalCopies || 0) + (band.digitalDownloads || 0), 0) || 0,
    averageFame: userBands?.length ? Math.round(userBands.reduce((sum, band) => sum + (band.fame || 0), 0) / userBands.length) : 0,
    highestChartPosition: userBands?.length ? Math.min(...userBands.map(band => band.chartPosition || 100)) : 100,
    credits: user?.credits || 0,
    subscriptionPlan: (user?.subscriptionPlan as PlanType) || 'free',
    bandLimit: user ? BAND_LIMITS[(user.subscriptionPlan as PlanType) || 'free'] : 0,
  };

  // Get subscription tier icon
  const getPlanIcon = (plan: PlanType) => {
    switch (plan) {
      case "free": return <User className="h-5 w-5" />;
      case "studio": return <Music className="h-5 w-5" />;
      case "creator": return <Zap className="h-5 w-5" />;
      case "producer": return <Users className="h-5 w-5" />;
      case "mogul": return <Crown className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };
  
  // Calculate band capacity usage
  const getBandCapacityProgress = () => {
    if (userStats.bandLimit === 'unlimited') return 0;
    return (userStats.totalBands / (userStats.bandLimit as number)) * 100;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common": return "bg-gray-500";
      case "Uncommon": return "bg-green-500";
      case "Rare": return "bg-blue-500";
      case "Epic": return "bg-purple-500";
      case "Legendary": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-charcoal/60 border-soft-gray/20">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-white-smoke mb-4">User Not Found</h1>
              <p className="text-soft-gray mb-6">
                The user profile you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/">
                <Button variant="outline" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href={isOwnProfile ? "/" : "/gallery"}>
              <button className="flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-2xl rounded-full border border-white/5 text-soft-gray hover:text-white-smoke hover:border-sky-glint/30 transition-all">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-semibold">Back</span>
              </button>
            </Link>
          </div>

          {/* User Hero Section - Premium Black Glass */}
          <div
            className="relative bg-black/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/5 transition-all duration-300 hover:border-aetherwave-pink/20"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                <Avatar className="w-32 h-32 border-4 border-sky-glint/30">
                  <AvatarImage 
                    src={user.profileImageUrl ? `/api/profile-image/${user.id}?t=${Date.now()}` : ""} 
                    alt={user.firstName || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate">
                    {(() => {
                      const firstName = user.firstName || "";
                      const lastName = user.lastName || "";
                      const email = user.email || "";
                      
                      if (firstName && lastName) {
                        return `${firstName[0]}${lastName[0]}`.toUpperCase();
                      } else if (firstName) {
                        return firstName[0].toUpperCase();
                      } else if (lastName) {
                        return lastName[0].toUpperCase();
                      } else if (email) {
                        return email[0].toUpperCase();
                      } else {
                        return "U";
                      }
                    })()}
                  </AvatarFallback>
                </Avatar>
                
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white-smoke">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.email || "Music Creator"}
                    </h1>
                    {isOwnProfile && (
                      <Badge variant="outline" className="text-sky-glint border-sky-glint">
                        Your Profile
                      </Badge>
                    )}
                  </div>
                  
                  {/* Subscription Tier and Stats */}
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <Link href="/upgrade">
                      <div
                        className="flex items-center gap-2 bg-gradient-to-r from-sky-glint/10 to-electric-neon/10 px-4 py-2 rounded-xl border border-sky-glint/30 backdrop-blur-sm hover:border-sky-glint cursor-pointer transition-all"
                        style={{
                          boxShadow: '0 4px 16px rgba(166, 239, 255, 0.1)',
                        }}
                      >
                        {getPlanIcon(userStats.subscriptionPlan)}
                        <span className="font-headline font-bold text-sky-glint">{PLAN_DISPLAY_NAMES[userStats.subscriptionPlan]}</span>
                      </div>
                    </Link>
                    <div
                      className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-400/30 backdrop-blur-sm"
                      style={{
                        boxShadow: '0 4px 16px rgba(251, 191, 36, 0.1)',
                      }}
                    >
                      <Star className="h-4 w-4 text-amber-400" />
                      <span className="text-white-smoke font-bold">{userStats.averageFame}</span>
                      <span className="text-soft-gray text-sm font-semibold">AVG FAME</span>
                    </div>
                    {isOwnProfile && (
                      <>
                        <div
                          className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-400/30 backdrop-blur-sm"
                          style={{
                            boxShadow: '0 4px 16px rgba(251, 191, 36, 0.1)',
                          }}
                        >
                          <Coins className="h-4 w-4 text-amber-400" />
                          <span className="text-white-smoke font-bold">{userStats.credits}</span>
                          <span className="text-soft-gray text-sm font-semibold">CREDITS</span>
                        </div>
                        <Link href="/buy-credits">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Store className="h-4 w-4" />
                            Buy Credits
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Band Capacity */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-soft-gray">Bands: {userStats.totalBands} / {userStats.bandLimit === 'unlimited' ? '∞' : userStats.bandLimit}</span>
                      <span className="text-soft-gray">Chart Peak: #{userStats.highestChartPosition}</span>
                    </div>
                    {userStats.bandLimit !== 'unlimited' && (
                      <Progress 
                        value={getBandCapacityProgress()} 
                        className="h-2"
                      />
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sky-glint">{userStats.totalBands}</div>
                    <div className="text-xs text-soft-gray">Virtual Bands</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-electric-blue">{userStats.totalSales.toLocaleString()}</div>
                    <div className="text-xs text-soft-gray">Total Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{userStats.totalStreams.toLocaleString()}</div>
                    <div className="text-xs text-soft-gray">Total Streams</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-charcoal/60">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="collection" data-testid="tab-collection">Artist Collection</TabsTrigger>
              <TabsTrigger value="releases" data-testid="tab-releases">Music Releases</TabsTrigger>
              <TabsTrigger value="stats" data-testid="tab-stats">Statistics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="bg-charcoal/60 border-soft-gray/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white-smoke">
                      <Trophy className="h-5 w-5 text-sky-glint" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userReleases && userReleases.length > 0 ? (
                      userReleases.slice(0, 3).map((release) => (
                        <div key={release.id} className="flex items-center gap-3 p-3 bg-deep-slate/40 rounded-lg">
                          <Play className="h-4 w-4 text-sky-glint" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white-smoke">
                              Released "{release.releaseTitle || release.fileName}"
                            </p>
                            <p className="text-xs text-soft-gray">
                              {release.createdAt ? new Date(release.createdAt).toLocaleDateString() : "Recent"}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : userCards && userCards.length > 0 ? (
                      userCards.slice(0, 3).map((card) => {
                        const artistData = card.artistData as any;
                        return (
                          <div key={card.id} className="flex items-center gap-3 p-3 bg-deep-slate/40 rounded-lg">
                            <Music className="h-4 w-4 text-electric-blue" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white-smoke">
                                Created artist "{artistData.bandName}"
                              </p>
                              <p className="text-xs text-soft-gray">
                                {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : "Recent"}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-soft-gray text-center py-8">No recent activity</p>
                    )}
                  </CardContent>
                </Card>

                {/* Level Progression */}
                <Card className="bg-charcoal/60 border-soft-gray/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white-smoke">
                      {getLevelIcon(userStats.level)}
                      Career Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-sky-glint mb-1">{userStats.level}</div>
                      <div className="text-sm text-soft-gray">Current Level</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-soft-gray">Experience</span>
                        <span className="text-white-smoke">{userStats.experience} XP</span>
                      </div>
                      <Progress value={getLevelProgress(userStats.level, userStats.experience)} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 text-center">
                      <div>
                        <div className="text-lg font-bold text-electric-blue">{userStats.influence}</div>
                        <div className="text-xs text-soft-gray">Influence</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-400">{userStats.fame}</div>
                        <div className="text-xs text-soft-gray">Fame</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Artist Collection Tab */}
            <TabsContent value="collection" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white-smoke">Artist Collection</h2>
                <Badge variant="outline" className="text-sky-glint border-sky-glint">
                  {userStats.totalCards} Artists
                </Badge>
              </div>

              {userCards && userCards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCards.map((card) => {
                    const artistData = card.artistData as any;
                    return (
                      <Link key={card.id} href={`/artist/${card.id}`}>
                        <Card className="group hover:scale-105 transition-all duration-200 cursor-pointer bg-gradient-to-br from-charcoal/40 to-deep-slate/60 border-soft-gray/20 hover:border-sky-glint/50">
                          <CardContent className="p-0">
                            <div className="aspect-[5/7] relative overflow-hidden rounded-t-lg">
                              {card.cardImageUrl ? (
                                <img
                                  src={card.cardImageUrl}
                                  alt={artistData.bandName}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={artistData.bandName}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-charcoal to-deep-slate flex items-center justify-center">
                                  <Users className="h-16 w-16 text-soft-gray opacity-50" />
                                </div>
                              )}
                              
                              <div className="absolute top-3 right-3">
                                <Badge 
                                  className={`${getRarityColor(card.rarity || 'Common')} text-white border-0`}
                                >
                                  {card.rarity || 'Common'}
                                </Badge>
                              </div>
                            </div>

                            <div className="p-4 space-y-2">
                              <h3 className="font-bold text-white-smoke group-hover:text-sky-glint transition-colors">
                                {artistData.bandName || "Unknown Artist"}
                              </h3>
                              
                              <div className="flex items-center gap-2 text-xs text-soft-gray">
                                <Music className="h-3 w-3" />
                                <span>{artistData.genre}</span>
                                <span>•</span>
                                <Users className="h-3 w-3" />
                                <span>{artistData.members?.length || 0} members</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Music className="h-16 w-16 mx-auto mb-4 text-soft-gray opacity-50" />
                  <h3 className="text-2xl font-bold text-white-smoke mb-2">No Artists Created</h3>
                  <p className="text-soft-gray mb-6">
                    {isOwnProfile 
                      ? "Upload your first audio file to create an artist identity" 
                      : "This user hasn't created any artists yet"}
                  </p>
                  {isOwnProfile && (
                    <Link href="/">
                      <Button variant="outline">
                        Create Your First Artist
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Music Releases Tab */}
            <TabsContent value="releases" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white-smoke">Music Releases</h2>
                <Badge variant="outline" className="text-electric-blue border-electric-blue">
                  {userStats.totalReleases} Releases
                </Badge>
              </div>

              {userReleases && userReleases.length > 0 ? (
                <div className="space-y-4">
                  {userReleases.map((release) => (
                    <Card key={release.id} className="bg-charcoal/60 border-soft-gray/20 hover:border-electric-blue/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-electric-blue to-sky-glint rounded-lg flex items-center justify-center">
                            <Play className="h-6 w-6 text-deep-slate" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-white-smoke">
                              {release.releaseTitle || release.fileName}
                            </h3>
                            <p className="text-sm text-soft-gray">
                              {release.releaseType} • {release.genre}
                            </p>
                            <p className="text-xs text-soft-gray">
                              Released: {release.createdAt ? new Date(release.createdAt).toLocaleDateString() : "Unknown"}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-electric-blue">
                              {(release.streams || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-soft-gray">streams</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Play className="h-16 w-16 mx-auto mb-4 text-soft-gray opacity-50" />
                  <h3 className="text-2xl font-bold text-white-smoke mb-2">No Music Releases</h3>
                  <p className="text-soft-gray mb-6">
                    {isOwnProfile 
                      ? "Create artists and release music under their names to build your discography" 
                      : "This user hasn't released any music yet"}
                  </p>
                  {isOwnProfile && (
                    <Link href="/gallery">
                      <Button variant="outline">
                        Browse Your Artists
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-6">
              <h2 className="text-2xl font-bold text-white-smoke">Performance Statistics</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-charcoal/60 border-soft-gray/20 text-center p-6">
                  <Music className="h-8 w-8 mx-auto mb-3 text-sky-glint" />
                  <div className="text-2xl font-bold text-sky-glint">{userStats.totalCards}</div>
                  <div className="text-sm text-soft-gray">Artists Created</div>
                </Card>

                <Card className="bg-charcoal/60 border-soft-gray/20 text-center p-6">
                  <Play className="h-8 w-8 mx-auto mb-3 text-electric-blue" />
                  <div className="text-2xl font-bold text-electric-blue">{userStats.totalReleases}</div>
                  <div className="text-sm text-soft-gray">Songs Released</div>
                </Card>

                <Card className="bg-charcoal/60 border-soft-gray/20 text-center p-6">
                  <Users className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
                  <div className="text-2xl font-bold text-yellow-400">{userStats.totalStreams.toLocaleString()}</div>
                  <div className="text-sm text-soft-gray">Total Streams</div>
                </Card>

                <Card className="bg-charcoal/60 border-soft-gray/20 text-center p-6">
                  <Star className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
                  <div className="text-2xl font-bold text-yellow-400">{userStats.fame}</div>
                  <div className="text-sm text-soft-gray">Fame Rating</div>
                </Card>
              </div>

              {/* Level Progression Chart */}
              <Card className="bg-charcoal/60 border-soft-gray/20">
                <CardHeader>
                  <CardTitle className="text-white-smoke">Career Progression</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-soft-gray">Current Level</span>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(userStats.level)}
                      <span className="font-semibold text-sky-glint">{userStats.level}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-soft-gray">Experience Progress</span>
                      <span className="text-white-smoke">{userStats.experience} XP</span>
                    </div>
                    <Progress value={getLevelProgress(userStats.level, userStats.experience)} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-electric-blue">{userStats.influence}</div>
                      <div className="text-sm text-soft-gray">Industry Influence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-400">{userStats.fame}</div>
                      <div className="text-sm text-soft-gray">Fame Level</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Profile Image Upload Component
interface ProfileImageUploadProps {
  subscriptionTier: string;
  canUploadProfileImages: boolean;
  onImageUpdated: () => void;
}

function ProfileImageUpload({ subscriptionTier, canUploadProfileImages, onImageUpdated }: ProfileImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Get upload URL mutation
  const getUploadUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/profile-image/upload-url');
      // Parse JSON if response is a Response object
      if (response instanceof Response) {
        return await response.json();
      }
      return response;
    },
  });

  // Update profile image mutation
  const updateImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await apiRequest('PUT', '/api/profile-image', { imageUrl });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Profile image updated successfully",
      });
      onImageUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile image",
        variant: "destructive",
      });
    },
  });

  const canUpload = canUploadProfileImages;

  const handleFileUpload = async (file: File) => {
    if (!canUpload) {
      toast({
        title: "Subscription Required",
        description: "Profile image upload requires Tier 2 subscription ($4.96/month). Upgrade to unlock this feature!",
        className: "bg-white/80 text-gray-800 border-gray-200",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Get upload URL
      const response = await getUploadUrlMutation.mutateAsync() as any;
      const { uploadURL } = response;
      
      if (!uploadURL) {
        throw new Error('No upload URL received from server');
      }
      
      // Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Update user's profile image URL (remove query params if present)
      const imageUrl = uploadURL.includes('?') ? uploadURL.split('?')[0] : uploadURL;
      await updateImageMutation.mutateAsync(imageUrl);
      
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      handleFileUpload(file);
    }
    // Reset input value
    event.target.value = '';
  };

  return (
    <div className="absolute -bottom-2 -right-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="profile-image-upload"
        disabled={isUploading}
      />
      <label
        htmlFor="profile-image-upload"
        className={`
          flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-all
          ${canUpload 
            ? 'bg-sky-glint hover:bg-sky-glint/80 border-white text-white' 
            : 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
          }
          ${isUploading ? 'animate-pulse' : ''}
        `}
        title={canUpload ? "Upload profile image" : "Requires Tier 2 subscription ($4.96/month)"}
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </label>
    </div>
  );
}