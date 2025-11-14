import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Check, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const creditPackages = [
  { credits: 100, price: 4.99, bonus: 0 },
  { credits: 250, price: 9.99, bonus: 25 },
  { credits: 500, price: 19.99, bonus: 75 },
  { credits: 1000, price: 34.99, bonus: 200 },
  { credits: 2500, price: 79.99, bonus: 600 },
];

const subscriptionTiers = [
  {
    name: "Free",
    price: 0,
    monthlyCredits: 50,
    features: ["50 credits/month", "Basic features", "Community support"],
  },
  {
    name: "Studio",
    price: 9.99,
    monthlyCredits: 500,
    features: ["500 credits/month", "All AI models", "Priority support", "1.5x growth multiplier"],
  },
  {
    name: "Studio+",
    price: 19.99,
    monthlyCredits: 1250,
    features: ["1,250 credits/month", "Premium AI models", "Early access", "2.0x growth multiplier"],
  },
  {
    name: "Pro",
    price: 34.99,
    monthlyCredits: 2500,
    features: ["2,500 credits/month", "Unlimited basic features", "API access", "2.5x growth multiplier"],
  },
  {
    name: "Mogul",
    price: 49.99,
    monthlyCredits: Infinity,
    features: ["Unlimited credits", "All features unlocked", "Dedicated support", "3.0x growth multiplier"],
  },
];

interface CheckoutFormProps {
  onSuccess: () => void;
  paymentIntentId: string;
}

function CheckoutForm({ onSuccess, paymentIntentId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/confirm-payment", { 
        paymentIntentId 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful!",
        description: `Added ${data.creditsAdded} credits to your account`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      confirmMutation.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing || confirmMutation.isPending}
        data-testid="button-confirm-payment"
      >
        {isProcessing || confirmMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Complete Purchase"
        )}
      </Button>
    </form>
  );
}

export default function BuyCreditsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<typeof creditPackages[0] | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const createPaymentMutation = useMutation({
    mutationFn: async (pkg: typeof creditPackages[0]) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: pkg.price,
        credits: pkg.credits,
        bonusCredits: pkg.bonus,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSelectedPackage(null);
    },
  });

  const handlePurchase = (pkg: typeof creditPackages[0]) => {
    setSelectedPackage(pkg);
    createPaymentMutation.mutate(pkg);
  };

  const handleCheckoutSuccess = () => {
    setSelectedPackage(null);
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8" 
	style={{
		    backgroundImage:"url('https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2FLOGO_Tiled_bg5opcacity.png?alt=media&token=d8e23a3d-b343-4ad5-87fd-892f0f722e8d')",
			backgroundRepeat: "no-repeat",
			backgroundSize: "cover",
			}}
	>
      <div className="max-w-6xl mx-auto space-y-8">
	     {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Credits & Subscriptions</h1>
          <p className="text-muted-foreground text-lg">
            Power your creativity with AetherWave credits
          </p>
          {user && !isLoading && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Coins className="w-5 h-5 mr-2 text-yellow-500" />
                {user.credits.toLocaleString()} Credits
              </Badge>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {user.subscriptionPlan.replace("_", " ").toUpperCase()} Plan
              </Badge>
            </div>
          )}
        </div>

        {/* Credit Packages */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">One-Time Credit Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {creditPackages.map((pkg) => (
              <Card key={pkg.credits} className="hover-elevate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    {pkg.credits} Credits
                  </CardTitle>
                  {pkg.bonus > 0 && (
                    <CardDescription className="text-green-500 font-semibold">
                      +{pkg.bonus} Bonus!
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase(pkg)}
                    disabled={createPaymentMutation.isPending || !user}
                    data-testid={`button-buy-${pkg.credits}`}
                  >
                    {createPaymentMutation.isPending && selectedPackage?.credits === pkg.credits ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Purchase"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Subscription Tiers */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Monthly Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {subscriptionTiers.map((tier) => (
              <Card 
                key={tier.name} 
                className={`hover-elevate ${tier.name === "Studio+" ? "border-purple-500 border-2" : ""}`}
              >
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>
                    {tier.monthlyCredits === Infinity ? "Unlimited" : `${tier.monthlyCredits} credits/mo`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {tier.price === 0 ? "Free" : `$${tier.price}`}
                    {tier.price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.name === "Studio+" ? "default" : "outline"}
                    data-testid={`button-subscribe-${tier.name.toLowerCase()}`}
                  >
                    {tier.price === 0 ? "Current Plan" : "Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
