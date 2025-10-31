import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music, Calendar } from "lucide-react";
import TradingCard from "./trading-card";

interface MyCardsProps {
  onBack: () => void;
}

export default function MyCards({ onBack }: MyCardsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/my-cards"],
  });

  const cards = data as any[] | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button onClick={onBack} variant="outline" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-white-smoke">My Collection</h1>
          </div>
          <div className="text-center text-soft-gray">Loading your collection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={onBack} variant="outline" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white-smoke">My Collection</h1>
          <div className="text-soft-gray">
            {cards?.length || 0} cards
          </div>
        </div>

        {!cards || cards.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-soft-gray mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white-smoke mb-2">
              No cards yet
            </h2>
            <p className="text-soft-gray mb-6">
              Start generating cards from your music to build your collection!
            </p>
            <Button onClick={onBack} data-testid="button-create-first-card">
              Create Your First Card
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card: any) => (
              <Card key={card.id} className="bg-deep-slate/50 border-sky-glint/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white-smoke text-lg">
                    {card.artistData?.bandName || "Unknown Artist"}
                  </CardTitle>
                  <CardDescription className="text-soft-gray">
                    {card.fileName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-[3/4] relative">
                    <TradingCard
                      artistData={card.artistData}
                      imageUrl={card.imageUrl}
                      theme={card.cardTheme || "dark"}
                      isProcessing={false}
                      cardId={card.id}
                      viewMode="full"
                    />
                  </div>
                  
                  <div className="text-xs text-soft-gray space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(card.createdAt).toLocaleDateString()}
                    </div>
                    <div>Style: {card.artStyle || "realistic"}</div>
                    <div>Theme: {card.cardTheme || "dark"}</div>
                    {card.genre && <div>Genre: {card.genre}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}