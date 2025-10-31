import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, CheckCircle2, Star, Sparkles, Trophy, Gift } from "lucide-react";
import type { CardDesignType } from "@shared/schema";
import { CARD_DESIGNS } from "@shared/schema";

interface CardDesignCatalogItem {
  id: CardDesignType;
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'premium' | 'special' | 'legendary';
  available: boolean;
  unlockedByDefault: boolean;
}

const rarityConfig = {
  common: { color: 'default', icon: CheckCircle2, label: 'Common' },
  premium: { color: 'secondary', icon: Star, label: 'Premium' },
  special: { color: 'default', icon: Gift, label: 'Special' },
  legendary: { color: 'default', icon: Trophy, label: 'Legendary' },
};

export default function CardShop() {
  const { toast } = useToast();

  // Fetch user's credits
  const { data: userData, isLoading: userLoading } = useQuery<{ credits: number }>({
    queryKey: ['/api/user/credits'],
  });

  // Fetch available designs
  const { data: catalogData, isLoading: catalogLoading } = useQuery<{
    designs: CardDesignCatalogItem[];
  }>({
    queryKey: ['/api/card-designs'],
  });

  // Fetch owned designs
  const { data: ownedData, isLoading: ownedLoading } = useQuery<{
    ownedDesigns: string[];
  }>({
    queryKey: ['/api/card-designs/owned'],
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (designId: string) => {
      return apiRequest('POST', '/api/card-designs/purchase', { designId });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Design Unlocked!",
        description: `You now own ${data.design.name}. New balance: ${data.newBalance} credits`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/card-designs/owned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || 'Failed to purchase design',
        variant: "destructive",
      });
    },
  });

  const isLoading = userLoading || catalogLoading || ownedLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  const userCredits = userData?.credits || 0;
  const designs = catalogData?.designs || [];
  const ownedDesigns = ownedData?.ownedDesigns || [];

  // Sort designs: owned first, then by rarity, then by price
  const sortedDesigns = [...designs].sort((a, b) => {
    const aOwned = ownedDesigns.includes(a.id);
    const bOwned = ownedDesigns.includes(b.id);
    
    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    
    // Sort by rarity tier
    const rarityOrder = { legendary: 0, special: 1, premium: 2, common: 3 };
    const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    
    return b.price - a.price;
  });

  const handlePurchase = (designId: string) => {
    purchaseMutation.mutate(designId);
  };

  return (
    <div className="container mx-auto py-8 px-4" data-testid="card-shop-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="page-title">Trading Card Design Shop</h1>
        <p className="text-muted-foreground mb-4" data-testid="page-description">
          Customize your bands with unique card designs. Each design applies a different visual style to your trading cards.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2" data-testid="credits-display">
            <Sparkles className="w-4 h-4 mr-2" />
            {userCredits} Credits
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedDesigns.map((design) => {
          const isOwned = ownedDesigns.includes(design.id);
          const canAfford = userCredits >= design.price;
          const rarityInfo = rarityConfig[design.rarity];
          const RarityIcon = rarityInfo.icon;

          return (
            <Card
              key={design.id}
              className={`relative ${!design.available ? 'opacity-60' : ''}`}
              data-testid={`card-design-${design.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {design.name}
                      {isOwned && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" data-testid={`owned-badge-${design.id}`} />
                      )}
                    </CardTitle>
                    <CardDescription>{design.description}</CardDescription>
                  </div>
                  <Badge variant={rarityInfo.color as any} className="shrink-0" data-testid={`rarity-${design.id}`}>
                    <RarityIcon className="w-3 h-3 mr-1" />
                    {rarityInfo.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {/* Preview placeholder - could be replaced with actual preview images */}
                <div className="aspect-[3.5/5] bg-gradient-to-br from-background to-muted rounded-lg flex items-center justify-center border-2 border-border">
                  <div className="text-center text-muted-foreground">
                    <RarityIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{design.name}</p>
                    <p className="text-xs mt-1">{design.rarity} design</p>
                  </div>
                </div>

                {!design.available && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {design.rarity === 'special' ? 'Limited time - check back during special events!' : 'Not available'}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                {isOwned ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                    data-testid={`owned-button-${design.id}`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Owned
                  </Button>
                ) : design.unlockedByDefault ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                    data-testid={`free-button-${design.id}`}
                  >
                    Free for Everyone
                  </Button>
                ) : !design.available ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                    data-testid={`unavailable-button-${design.id}`}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Not Available
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(design.id)}
                    disabled={!canAfford || purchaseMutation.isPending}
                    data-testid={`purchase-button-${design.id}`}
                  >
                    {purchaseMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : !canAfford ? (
                      <Lock className="w-4 h-4 mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {canAfford ? `Purchase for ${design.price} Credits` : `Need ${design.price} Credits`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {sortedDesigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground" data-testid="empty-state">No designs available at this time.</p>
        </div>
      )}
    </div>
  );
}
