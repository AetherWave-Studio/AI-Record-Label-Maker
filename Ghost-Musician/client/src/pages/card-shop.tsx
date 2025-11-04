import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, Palette, Star, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserNavigation from "@/components/user-navigation";

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

const rarityColors: Record<string, string> = {
  Common: "bg-slate-600 text-white border-slate-500",
  Rare: "bg-blue-600 text-white border-blue-500", 
  Epic: "bg-purple-600 text-white border-purple-500",
  Legendary: "bg-orange-600 text-white border-orange-500"
};

export default function CardShop() {
  const [selectedCategory, setSelectedCategory] = useState<string>("card_themes");
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

  const handlePurchase = (product: Product) => {
    if (!creditData || creditData.credits < product.price) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${product.price} credits but only have ${creditData?.credits || 0}. Visit Buy Credits to purchase more.`,
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate({ productId: product.id });
  };

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory && product.isActive
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle data-testid="text-login-required">Login Required</CardTitle>
            <CardDescription>Please log in to access the Card Shop.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="text-page-title">
            <Palette className="inline-block mr-2 h-8 w-8 text-pink-400" />
            Card Shop
          </h1>
          <p className="text-slate-400 text-lg">
            Customize your virtual bands with exclusive card themes, managers, and collectibles
          </p>
          {creditData && (
            <div className="mt-4 inline-flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-full">
              <ShoppingCart className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-semibold" data-testid="text-current-credits">
                {creditData.credits} Credits
              </span>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto">
            <TabsTrigger value="card_themes" data-testid="tab-card-themes">
              <Palette className="h-4 w-4 mr-2" />
              Card Themes
            </TabsTrigger>
            <TabsTrigger value="premium_features" data-testid="tab-premium-features">
              <Star className="h-4 w-4 mr-2" />
              Premium Features
            </TabsTrigger>
            <TabsTrigger value="collectibles" data-testid="tab-collectibles">
              <Sparkles className="h-4 w-4 mr-2" />
              Collectibles
            </TabsTrigger>
          </TabsList>

          {/* Products Grid */}
          <TabsContent value={selectedCategory} className="mt-8">
            {productsLoading ? (
              <div className="text-center text-slate-400 py-12">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No products available in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="hover-elevate"
                    data-testid={`card-product-${product.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </CardTitle>
                        <Badge className={rarityColors[product.rarity] || rarityColors.Common}>
                          {product.rarity}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.imageUrl && (
                        <div className="aspect-square bg-slate-800 rounded-md overflow-hidden">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-yellow-400" data-testid={`text-price-${product.id}`}>
                            {product.price}
                          </div>
                          <div className="text-xs text-slate-400">Credits</div>
                        </div>
                        <Button
                          onClick={() => handlePurchase(product)}
                          disabled={
                            purchaseMutation.isPending ||
                            (creditData?.credits || 0) < product.price
                          }
                          data-testid={`button-buy-${product.id}`}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy
                        </Button>
                      </div>

                      {product.stock !== null && product.stock !== undefined && (
                        <div className="text-xs text-slate-400 text-center">
                          {product.stock > 0 ? (
                            <span>{product.stock} in stock</span>
                          ) : (
                            <span className="text-red-400">Out of Stock</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
