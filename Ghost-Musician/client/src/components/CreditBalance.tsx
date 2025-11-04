import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreditData {
  credits: number;
  totalEarned: number;
  totalSpent: number;
  tier: string;
  lastRenewal: string | null;
}

export function CreditBalance() {
  const { toast } = useToast();

  const { data: creditData, isLoading, refetch } = useQuery<CreditData>({
    queryKey: ["/api/credits"],
    retry: false,
  });

  const handleRenewCredits = async () => {
    try {
      const response = await fetch('/api/credits/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to renew credits');
      }

      const result = await response.json();
      
      toast({
        title: "Credits Renewed!",
        description: `Added ${result.creditsAdded.toLocaleString()} credits to your account.`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Renewal Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-full animate-pulse" />
            <div>
              <div className="w-20 h-4 bg-gray-600 rounded animate-pulse mb-1" />
              <div className="w-16 h-3 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creditData) {
    return null;
  }

  const canRenew = creditData.tier !== 'Free' && (
    !creditData.lastRenewal || 
    (new Date().getTime() - new Date(creditData.lastRenewal).getTime()) > (30 * 24 * 60 * 60 * 1000)
  );

  return (
    <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20" data-testid="credit-balance">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Coins className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400" data-testid="credit-amount">
                {creditData.credits.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Credits Available</div>
            </div>
          </div>
          
          {canRenew && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRenewCredits}
              className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
              data-testid="renew-credits-button"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Renew
            </Button>
          )}
        </div>
        
        {creditData.tier !== 'Free' && (
          <div className="mt-2 text-xs text-gray-500">
            <span>Earned: {creditData.totalEarned.toLocaleString()}</span>
            <span className="mx-2">•</span>
            <span>Spent: {creditData.totalSpent.toLocaleString()}</span>
            {creditData.lastRenewal && (
              <>
                <span className="mx-2">•</span>
                <span>Last renewed: {new Date(creditData.lastRenewal).toLocaleDateString()}</span>
              </>
            )}
          </div>
        )}
        
        {creditData.tier === 'Free' && (
          <div className="mt-2 text-xs text-gray-500">
            <a href="/upgrade" className="text-yellow-400 hover:underline">
              Upgrade to earn monthly credits
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}