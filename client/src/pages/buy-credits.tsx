import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import type { CreditBundle } from "@shared/schema";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ bundle, onSuccess }: { bundle: CreditBundle, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/ghost-musician',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend and add credits
        const data = await apiRequest("/api/confirm-payment", { 
          method: "POST",
          body: JSON.stringify({ paymentIntentId: paymentIntent.id })
        });

        if (data) {
          toast({
            title: "Payment Successful! 🎉",
            description: `${data.creditsAdded} credits added to your account! New balance: ${data.newBalance}`,
          });
          
          // Invalidate user query to refresh credit balance
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          
          onSuccess();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <PaymentElement />
      </div>
      
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          disabled={isProcessing}
          className="flex-1"
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-complete-payment"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${bundle.priceUSD}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function BuyCredits() {
  const [, setLocation] = useLocation();
  const [bundles, setBundles] = useState<CreditBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch available credit bundles
    apiRequest("/api/credit-bundles")
      .then((data) => {
        setBundles(data);
        setIsLoading(false);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to load credit bundles",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, []);

  const handleBundleSelect = async (bundle: CreditBundle) => {
    setIsLoading(true);
    setSelectedBundle(bundle);

    try {
      const data = await apiRequest("/api/create-payment-intent", { 
        method: "POST",
        body: JSON.stringify({ bundleId: bundle.id })
      });
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
      setSelectedBundle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setLocation('/ghost-musician');
  };

  const handleBack = () => {
    setSelectedBundle(null);
    setClientSecret("");
  };

  if (isLoading && bundles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3" data-testid="heading-buy-credits">
            Buy Credits
          </h1>
          <p className="text-muted-foreground text-lg">
            Purchase credits to unlock AI music generation, album art, and RPG features
          </p>
        </div>

        {!selectedBundle ? (
          // Bundle selection
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundles.map((bundle) => (
              <Card 
                key={bundle.id} 
                className={`relative hover-elevate active-elevate-2 cursor-pointer transition-all ${
                  bundle.popular ? 'border-primary' : ''
                }`}
                onClick={() => handleBundleSelect(bundle)}
                data-testid={`card-bundle-${bundle.id}`}
              >
                {bundle.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl" data-testid={`text-bundle-name-${bundle.id}`}>
                    {bundle.name}
                  </CardTitle>
                  <CardDescription data-testid={`text-bundle-desc-${bundle.id}`}>
                    {bundle.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold" data-testid={`text-bundle-price-${bundle.id}`}>
                      ${bundle.priceUSD}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      one-time purchase
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm" data-testid={`text-bundle-credits-${bundle.id}`}>
                        {bundle.credits} credits
                      </span>
                    </div>
                    {bundle.bonusCredits > 0 && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary" data-testid={`text-bundle-bonus-${bundle.id}`}>
                          +{bundle.bonusCredits} bonus credits!
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={bundle.popular ? "default" : "outline"}
                    data-testid={`button-select-${bundle.id}`}
                  >
                    Select Package
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          // Checkout form
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Complete Your Purchase</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBack}
                    data-testid="button-back-to-bundles"
                  >
                    ← Back
                  </Button>
                </div>
                <CardDescription>
                  You're purchasing <strong>{selectedBundle.name}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Order summary */}
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-medium">{selectedBundle.credits}</span>
                  </div>
                  {selectedBundle.bonusCredits > 0 && (
                    <div className="flex justify-between text-primary">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Bonus Credits
                      </span>
                      <span className="font-medium">+{selectedBundle.bonusCredits}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t flex justify-between text-lg font-bold">
                    <span>Total Credits</span>
                    <span>{selectedBundle.credits + selectedBundle.bonusCredits}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between text-xl font-bold">
                    <span>Amount to Pay</span>
                    <span>${selectedBundle.priceUSD}</span>
                  </div>
                </div>

                {/* Stripe payment form */}
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm bundle={selectedBundle} onSuccess={handleSuccess} />
                  </Elements>
                )}

                {isLoading && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
