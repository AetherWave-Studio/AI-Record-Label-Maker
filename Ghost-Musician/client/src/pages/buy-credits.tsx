import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, Zap, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserNavigation from "@/components/user-navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface CreditBundle {
  id: string;
  name: string;
  description: string;
  credits: number;
  bonusCredits: number;
  priceUSD: number;
  popular?: boolean;
}

interface CreditData {
  credits: number;
  totalEarned: number;
  totalSpent: number;
  tier: string;
  lastRenewal: string;
}

function CheckoutForm({ bundle, clientSecret, onSuccess }: { bundle: CreditBundle; clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Confirm payment with backend
        const response = await apiRequest('POST', '/api/confirm-payment', {
          paymentIntentId: paymentIntent.id,
        });

        if (response.ok) {
          toast({
            title: "Success!",
            description: `${bundle.credits + bundle.bonusCredits} credits added to your account!`,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
          onSuccess();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? "Processing..." : `Pay $${bundle.priceUSD.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function BuyCredits() {
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch credit bundles
  const { data: bundles = [], isLoading: bundlesLoading } = useQuery<CreditBundle[]>({
    queryKey: ["/api/credit-bundles"],
    enabled: isAuthenticated,
  });

  // Fetch user credits
  const { data: creditData } = useQuery<CreditData>({
    queryKey: ["/api/credits"],
    enabled: isAuthenticated,
  });

  // Create payment intent
  const createPaymentMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', { bundleId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = (bundle: CreditBundle) => {
    setSelectedBundle(bundle);
    createPaymentMutation.mutate(bundle.id);
  };

  const handlePaymentSuccess = () => {
    setSelectedBundle(null);
    setClientSecret(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle data-testid="text-login-required">Login Required</CardTitle>
            <CardDescription>Please log in to purchase credits.</CardDescription>
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
            <Zap className="inline-block mr-2 h-8 w-8 text-yellow-400" />
            Buy Credits
          </h1>
          <p className="text-slate-400 text-lg">
            Power your creativity with AetherWave credits
          </p>
          {creditData && (
            <div className="mt-4 inline-flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-full">
              <CreditCard className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-semibold" data-testid="text-current-credits">
                {creditData.credits} Credits
              </span>
            </div>
          )}
        </div>

        {/* Checkout Form (if bundle selected) */}
        {selectedBundle && clientSecret && (
          <div className="mb-12">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>
                  {selectedBundle.name} - {selectedBundle.credits + selectedBundle.bonusCredits} total credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    bundle={selectedBundle}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedBundle(null);
                    setClientSecret(null);
                  }}
                  className="w-full mt-4"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Credit Bundles Grid */}
        {!selectedBundle && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundles.map((bundle) => (
              <Card
                key={bundle.id}
                className={`relative ${bundle.popular ? 'border-2 border-yellow-400' : ''}`}
                data-testid={`card-bundle-${bundle.id}`}
              >
                {bundle.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl" data-testid={`text-bundle-name-${bundle.id}`}>
                    {bundle.name}
                  </CardTitle>
                  <CardDescription>{bundle.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white" data-testid={`text-price-${bundle.id}`}>
                      ${bundle.priceUSD.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Base Credits:</span>
                      <span className="font-semibold text-white">{bundle.credits}</span>
                    </div>
                    {bundle.bonusCredits > 0 && (
                      <div className="flex items-center justify-between text-green-400">
                        <span>Bonus Credits:</span>
                        <span className="font-semibold">+{bundle.bonusCredits}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-700 pt-2">
                      <div className="flex items-center justify-between text-yellow-400 font-bold">
                        <span>Total Credits:</span>
                        <span>{bundle.credits + bundle.bonusCredits}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleBuyNow(bundle)}
                    disabled={createPaymentMutation.isPending}
                    className="w-full"
                    size="lg"
                    data-testid={`button-buy-${bundle.id}`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">What You Can Do With Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "🎵", title: "Generate AI Music", desc: "Create original songs with SUNO AI" },
              { icon: "🎨", title: "Create Album Art", desc: "Design stunning covers with DALL-E 3" },
              { icon: "🎬", title: "Make Music Videos", desc: "Generate seamless loop videos" },
              { icon: "👻", title: "Build Virtual Bands", desc: "Create AI-powered artists" },
            ].map((feature, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
