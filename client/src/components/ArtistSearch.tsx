import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Music, Users, ExternalLink } from "lucide-react";
import type { ArtistCard, ArtistData } from "@shared/schema";

interface SearchResult {
  id: string;
  artistData: ArtistData;
  imageUrl?: string;
  rarity: string;
}

export function ArtistSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: [`/api/search/artists?q=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length >= 2,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length >= 2);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4" data-testid="artist-search">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search for artists and bands..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          data-testid="search-input"
        />
      </div>

      {/* Search Results */}
      {isSearching && (
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <Link key={result.id} href={`/artist/${result.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      {/* Artist Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        {result.imageUrl ? (
                          <img
                            src={result.imageUrl}
                            alt={result.artistData.bandName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Artist Info */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {result.artistData.bandName}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {result.rarity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {result.artistData.genre}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {result.artistData.members.length} members
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                          {result.artistData.philosophy}
                        </p>
                      </div>

                      {/* View Button */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <h3 className="font-medium mb-1">No artists found</h3>
                <p className="text-sm">
                  No artists match your search for "{searchQuery}"
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      {!isSearching && (
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            Search for artists by name, genre, or style to discover new music profiles
          </p>
        </div>
      )}
    </div>
  );
}