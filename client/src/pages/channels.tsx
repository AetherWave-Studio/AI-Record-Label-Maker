import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Music2, TrendingUp, Radio, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Band {
  id: string;
  bandName: string;
  genre: string;
  fame: number;
  totalStreams: number;
  chartPosition: number;
  tradingCardUrl: string | null;
  portraitUrl: string | null;
  members: any;
  concept: string | null;
  songTitle: string | null;
}

export default function Channels() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const { data: bands = [], isLoading } = useQuery<Band[]>({
    queryKey: ['/api/bands/all'],
  });

  // Filter bands based on search and genre
  const filteredBands = bands.filter(band => {
    const matchesSearch = band.bandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         band.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || band.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  // Get unique genres for filtering
  const genres = Array.from(new Set(bands.map(b => b.genre))).sort();

  // Get FAME tier label
  const getFameTier = (fame: number) => {
    if (fame >= 80) return { label: "Superstar", color: "bg-yellow-500" };
    if (fame >= 60) return { label: "Rising Star", color: "bg-purple-500" };
    if (fame >= 40) return { label: "Established", color: "bg-blue-500" };
    if (fame >= 20) return { label: "Emerging", color: "bg-green-500" };
    return { label: "Underground", color: "bg-gray-500" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center">
        <div className="text-center">
          <Music2 className="w-16 h-16 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/80">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Radio className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Virtual Artist Channels
            </h1>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Discover {bands.length} virtual artists creating music across the AetherWave universe
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search artists or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-channels"
              />
            </div>
            
            {/* Genre filters */}
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={selectedGenre === null ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setSelectedGenre(null)}
                data-testid="filter-all-genres"
              >
                All Genres
              </Badge>
              {genres.slice(0, 6).map(genre => (
                <Badge
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setSelectedGenre(genre)}
                  data-testid={`filter-genre-${genre.toLowerCase()}`}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Channel Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredBands.length === 0 ? (
          <div className="text-center py-20">
            <Music2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">No artists found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBands.map((band) => {
              const fameTier = getFameTier(band.fame);
              
              return (
                <Card
                  key={band.id}
                  className="group cursor-pointer overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20"
                  onClick={() => setLocation(`/ghost-musician/artist/${band.id}`)}
                  data-testid={`channel-card-${band.id}`}
                >
                  {/* Channel Thumbnail */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-b from-muted to-background">
                    {band.tradingCardUrl ? (
                      <img
                        src={band.tradingCardUrl}
                        alt={band.bandName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        data-testid={`channel-image-${band.id}`}
                      />
                    ) : band.portraitUrl ? (
                      <img
                        src={band.portraitUrl}
                        alt={band.bandName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-16 h-16 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white text-xs line-clamp-3 mb-2">
                        {band.concept || `${band.bandName} is creating amazing ${band.genre} music.`}
                      </p>
                      {band.songTitle && (
                        <div className="flex items-center gap-1 text-white/80 text-xs">
                          <Music2 className="w-3 h-3" />
                          <span className="truncate">{band.songTitle}</span>
                        </div>
                      )}
                    </div>

                    {/* FAME Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className={`${fameTier.color} text-white text-xs px-2 py-0.5`}>
                        {fameTier.label}
                      </Badge>
                    </div>

                    {/* Chart Position */}
                    {band.chartPosition > 0 && band.chartPosition <= 10 && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          #{band.chartPosition}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Channel Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1 truncate" data-testid={`channel-name-${band.id}`}>
                      {band.bandName}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{band.genre}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{band.fame}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        <span>{(band.totalStreams / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="container mx-auto px-4 py-8 border-t mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">{bands.length}</div>
            <div className="text-sm text-muted-foreground">Artists</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{genres.length}</div>
            <div className="text-sm text-muted-foreground">Genres</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">
              {Math.floor(bands.reduce((sum, b) => sum + b.totalStreams, 0) / 1000000)}M
            </div>
            <div className="text-sm text-muted-foreground">Total Streams</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">
              {bands.filter(b => b.chartPosition > 0 && b.chartPosition <= 100).length}
            </div>
            <div className="text-sm text-muted-foreground">Charting</div>
          </div>
        </div>
      </div>
    </div>
  );
}
