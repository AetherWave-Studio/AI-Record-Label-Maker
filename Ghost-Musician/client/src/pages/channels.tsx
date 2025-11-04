import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio, TrendingUp, Music, Users, Clock, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import UserNavigation from "@/components/user-navigation";

interface FeedEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: any;
  createdAt: string;
  userName?: string;
}

interface Band {
  id: string;
  name: string;
  genre: string;
  fame: number;
  totalStreams: number;
  chartPosition: number;
}

export default function Channels() {
  const [activeTab, setActiveTab] = useState("trending");
  const { isAuthenticated } = useAuth();

  // Fetch activity feed
  const { data: feedEvents = [], isLoading: feedLoading } = useQuery<FeedEvent[]>({
    queryKey: ["/api/feed"],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch top bands
  const { data: topBands = [], isLoading: bandsLoading } = useQuery<Band[]>({
    queryKey: ["/api/bands/top"],
    enabled: isAuthenticated,
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "band_created":
        return <Users className="h-4 w-4" />;
      case "achievement_unlocked":
        return <TrendingUp className="h-4 w-4" />;
      case "daily_growth":
        return <Music className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getEventDescription = (event: FeedEvent) => {
    switch (event.eventType) {
      case "band_created":
        return `created a new band: ${event.eventData.bandName}`;
      case "achievement_unlocked":
        return `unlocked ${event.eventData.achievement} achievement`;
      case "daily_growth":
        return `grew their band to ${event.eventData.fame} FAME`;
      case "music_released":
        return `released "${event.eventData.trackName}"`;
      default:
        return "made an update";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle data-testid="text-login-required">Login Required</CardTitle>
            <CardDescription>Please log in to view channels.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="text-page-title">
            <Radio className="inline-block mr-2 h-8 w-8 text-green-400" />
            Channels
          </h1>
          <p className="text-slate-400 text-lg">
            Discover what's happening in the GhostMusician community
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="trending" data-testid="tab-trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              <Clock className="h-4 w-4 mr-2" />
              Recent Activity
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab */}
          <TabsContent value="trending">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                    Top Bands
                  </CardTitle>
                  <CardDescription>The hottest virtual artists right now</CardDescription>
                </CardHeader>
                <CardContent>
                  {bandsLoading ? (
                    <div className="text-center text-slate-400 py-8">Loading...</div>
                  ) : topBands.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No bands yet. Create the first one!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topBands.slice(0, 10).map((band, index) => (
                        <div
                          key={band.id}
                          className="flex items-center gap-4 p-4 bg-slate-800 rounded-md hover-elevate"
                          data-testid={`band-item-${band.id}`}
                        >
                          <div className="text-2xl font-bold text-slate-600 w-8">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{band.name}</div>
                            <div className="text-sm text-slate-400">{band.genre}</div>
                          </div>
                          <div className="text-right">
                            <Badge className="mb-1">
                              FAME {band.fame}
                            </Badge>
                            <div className="text-xs text-slate-400">
                              {band.totalStreams.toLocaleString()} streams
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Live feed from the community</CardDescription>
              </CardHeader>
              <CardContent>
                {feedLoading ? (
                  <div className="text-center text-slate-400 py-8">Loading...</div>
                ) : feedEvents.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity yet. Be the first to make a move!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedEvents.slice(0, 20).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 p-4 bg-slate-800 rounded-md hover-elevate"
                        data-testid={`feed-item-${event.id}`}
                      >
                        <div className="mt-1 text-slate-400">
                          {getEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white">
                            <span className="font-semibold">
                              {event.userName || "Anonymous"}
                            </span>{" "}
                            <span className="text-slate-400">
                              {getEventDescription(event)}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatTimeAgo(event.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold text-white">
                {topBands.length}
              </div>
              <div className="text-sm text-slate-400">Active Bands</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Music className="h-8 w-8 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold text-white">
                {topBands.reduce((sum, band) => sum + (band.totalStreams || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Total Streams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold text-white">
                {feedEvents.length}
              </div>
              <div className="text-sm text-slate-400">Recent Activities</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
