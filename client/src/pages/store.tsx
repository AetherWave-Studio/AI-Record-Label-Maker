import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, Star, Coins, Filter, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserNavigation from "@/components/user-navigation";
import { Music } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  productData: any;
  rarity: string;
  requiredLevel: string;
  subscriptionTierRequired?: string;
  isActive: boolean;
  stock?: number;
}

interface CreditData {
  credits: number;
  totalEarned: number;
  totalSpent: number;
  tier: string;
  lastRenewal: string;
}

const rarityColors = {
  Common: "bg-gray-100 text-gray-800 border-gray-300",
  Rare: "bg-blue-100 text-blue-800 border-blue-300", 
  Epic: "bg-purple-100 text-purple-800 border-purple-300",
  Legendary: "bg-orange-100 text-orange-800 border-orange-300"
};

const categoryIcons = {
  card_themes: "🎨",
  premium_features: "⭐",
  profile_items: "👤",
  sound_packs: "🎵",
  collectibles: "💎"
};

export default function Store() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/store/products"],
    enabled: isAuthenticated,
  });

  // Fetch user credits
  const { data: creditData } = useQuery<CreditData>({
    queryKey: ["/api/credits"],
    enabled: isAuthenticated,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const response = await apiRequest('POST', '/api/store/purchase', { productId, quantity });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase Successful!",
        description: `You bought ${data.product.name} for ${data.totalCost} credits.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Something went wrong with your purchase.",
        variant: "destructive",
      });
    },
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.isActive;
  });

  const categories = [
    { value: "all", label: "All Items", icon: "🛍️" },
    { value: "card_themes", label: "Card Themes", icon: "🎨" },
    { value: "premium_features", label: "Premium Features", icon: "⭐" },
    { value: "profile_items", label: "Profile Items", icon: "👤" },
    { value: "sound_packs", label: "Sound Packs", icon: "🎵" },
    { value: "collectibles", label: "Collectibles", icon: "💎" }
  ];

  const handlePurchase = (product: Product) => {
    if (!creditData || creditData.credits < product.price) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${product.price} credits but only have ${creditData?.credits || 0}.`,
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate({ productId: product.id });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-gray-600 mb-6">Sign in to browse and purchase items from the AetherWave Store.</p>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-deep-slate text-white-smoke font-inter min-h-screen">
      {/* Header */}
      <header className="bg-charcoal/80 backdrop-blur-sm border-b border-sky-glint/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="text-sky-glint text-2xl" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-glint to-electric-blue bg-clip-text text-transparent">
                AetherWave Store
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {/* Credit Balance */}
              {creditData && (
                <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{creditData.credits.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">Credits</span>
                </div>
              )}
              <UserNavigation />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Store Controls */}
        <div className="mb-8 space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white-smoke via-sky-glint to-electric-blue bg-clip-text text-transparent">
              Premium Marketplace
            </h2>
            <p className="text-soft-gray text-lg max-w-2xl mx-auto">
              Enhance your music creation experience with premium themes, tools, and collectibles
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-charcoal border-sky-glint/30 text-white-smoke"
                data-testid="search-products"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.value)}
                className={`${
                  selectedCategory === category.value 
                    ? "bg-sky-glint hover:bg-sky-glint/80" 
                    : "border-sky-glint/30 text-soft-gray hover:border-sky-glint hover:text-sky-glint"
                }`}
                data-testid={`filter-${category.value}`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-charcoal border-sky-glint/20">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-600 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="bg-charcoal border-sky-glint/20 hover:border-sky-glint/60 transition-all hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white-smoke flex items-center gap-2">
                        <span>{categoryIcons[product.category as keyof typeof categoryIcons]}</span>
                        {product.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={`text-xs ${rarityColors[product.rarity as keyof typeof rarityColors]}`}>
                          {product.rarity}
                        </Badge>
                        {product.requiredLevel !== "Fan" && (
                          <Badge variant="outline" className="text-xs border-soft-gray/30 text-soft-gray">
                            {product.requiredLevel}+ Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-soft-gray text-sm mb-4 line-clamp-3">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-yellow-400 text-lg">
                        {product.price.toLocaleString()}
                      </span>
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(product)}
                      disabled={purchaseMutation.isPending || !creditData || creditData.credits < product.price}
                      className="bg-sky-glint hover:bg-sky-glint/80 text-deep-slate"
                      data-testid={`buy-${product.id}`}
                    >
                      {purchaseMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-deep-slate border-t-transparent rounded-full animate-spin" />
                      ) : creditData && creditData.credits >= product.price ? (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Buy
                        </>
                      ) : (
                        "Insufficient Credits"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !productsLoading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white-smoke mb-2">No Products Found</h3>
            <p className="text-soft-gray">Try adjusting your search or category filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}