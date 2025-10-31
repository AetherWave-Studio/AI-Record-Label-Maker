import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Music, Users, Filter, Grid, List, Star, ArrowLeft, ExternalLink } from "lucide-react";
import type { ArtistCard, ArtistData } from "@shared/schema";
import TradingCard from "@/components/trading-card";

export default function Gallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch all artist cards
  const { data: allCards, isLoading } = useQuery<ArtistCard[]>({
    queryKey: ["/api/cards"],
  });

  // Filter and sort cards based on current criteria
  const filteredCards = allCards?.filter(card => {
    const artistData = card.artistData as ArtistData;
    const matchesSearch = !searchQuery || 
      artistData.bandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artistData.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artistData.philosophy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artistData.members?.some(member => 
        member.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesGenre = genreFilter === "all" || (artistData.genre && artistData.genre.toLowerCase().includes(genreFilter.toLowerCase()));
    const matchesRarity = rarityFilter === "all" || card.rarity === rarityFilter;
    
    return matchesSearch && matchesGenre && matchesRarity;
  })?.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        const bDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const aDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aDate - bDate;
      case "oldest":
        const bDateOld = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const aDateOld = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return aDateOld - bDateOld;
      case "name":
        return ((a.artistData as ArtistData).bandName || "").localeCompare((b.artistData as ArtistData).bandName || "");
      case "rarity":
        const rarityOrder = { "Common": 1, "Uncommon": 2, "Rare": 3, "Epic": 4, "Legendary": 5 };
        return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
      default:
        return 0;
    }
  }) || [];

  // Get unique genres and rarities for filter options
  const availableGenres = Array.from(new Set(
    allCards?.map(card => (card.artistData as ArtistData).genre?.toLowerCase()).filter((genre): genre is string => Boolean(genre))
  )).sort();
  
  const availableRarities = Array.from(new Set(
    allCards?.map(card => card.rarity).filter((rarity): rarity is string => Boolean(rarity))
  )).sort();

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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate">
      {/* Header */}
      <header className="px-6 py-6 border-b border-soft-gray/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-sky-glint to-electric-blue p-3 rounded-lg">
                  <Music className="text-deep-slate" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white-smoke to-sky-glint bg-clip-text text-transparent">
                    Artist Gallery
                  </h1>
                  <p className="text-soft-gray text-sm">
                    Discover all {allCards?.length || 0} artists in the collection
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                data-testid="button-grid-view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search artists, genres, members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                data-testid="search-input"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-soft-gray" />
                <span className="text-sm text-soft-gray">Filters:</span>
              </div>
              
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {availableGenres.map(genre => genre && (
                    <SelectItem key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  {availableRarities.map(rarity => (
                    <SelectItem key={rarity} value={rarity}>
                      {rarity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-soft-gray ml-auto">
                {filteredCards.length} of {allCards?.length || 0} artists
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {filteredCards.length === 0 ? (
            <div className="text-center py-16">
              <Music className="h-16 w-16 mx-auto mb-4 text-soft-gray opacity-50" />
              <h2 className="text-2xl font-bold text-white-smoke mb-2">No artists found</h2>
              <p className="text-soft-gray mb-6">
                {searchQuery || genreFilter !== "all" || rarityFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No artists have been created yet"
                }
              </p>
              {searchQuery || genreFilter !== "all" || rarityFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setGenreFilter("all");
                    setRarityFilter("all");
                  }}
                >
                  Clear all filters
                </Button>
              ) : (
                <Link href="/">
                  <Button variant="outline">
                    Create your first artist
                  </Button>
                </Link>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredCards.map((card) => {
                const artistData = card.artistData as ArtistData;
                return (
                  <TradingCard 
                    key={card.id}
                    artistData={artistData}
                    imageUrl={card.imageUrl || undefined}
                    theme={card.cardTheme || "dark"}
                    isProcessing={false}
                    cardId={card.id}
                    viewMode="browse"
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCards.map((card) => {
                const artistData = card.artistData as ArtistData;
                return (
                  <Link key={card.id} href={`/artist/${card.id}`}>
                    <Card className="group hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          {/* Artist Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={artistData.bandName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Artist Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                {artistData.bandName}
                              </h3>
                              <Badge 
                                variant="secondary" 
                                className={`${getRarityColor(card.rarity || 'Common')} text-white text-xs`}
                              >
                                {card.rarity || 'Common'}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Music className="h-3 w-3" />
                                <span>{artistData.genre}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{artistData.members?.length || 1} member{(artistData.members?.length || 1) !== 1 ? 's' : ''}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Star className="h-3 w-3" />
                                <span>FAME {card.currentFame || 5}</span>
                              </span>
                            </div>
                          </div>

                          {/* Action Icon */}
                          <div className="flex-shrink-0">
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}