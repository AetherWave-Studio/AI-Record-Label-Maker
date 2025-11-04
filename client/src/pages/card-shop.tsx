import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
}

export default function CardShopPage() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedProducts = products?.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>) || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <ShoppingBag className="w-10 h-10" />
            Card Shop
          </h1>
          <p className="text-muted-foreground text-lg">
            Enhance your creative experience with premium items
          </p>
        </div>

        {Object.entries(groupedProducts).map(([category, items]) => (
          <section key={category} className="space-y-4">
            <h2 className="text-2xl font-semibold">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((product) => (
                <Card key={product.id} className="hover-elevate flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>{product.name}</span>
                      <Badge variant="secondary">
                        <Coins className="w-3 h-3 mr-1" />
                        {product.price}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      data-testid={`button-buy-product-${product.id}`}
                    >
                      Purchase for {product.price} Credits
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {(!products || products.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No products available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
