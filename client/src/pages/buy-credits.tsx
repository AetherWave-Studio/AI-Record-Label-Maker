import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Check } from "lucide-react";

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

export default function BuyCreditsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Credits & Subscriptions</h1>
          <p className="text-muted-foreground text-lg">
            Power your creativity with AetherWave credits
          </p>
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
                  <Button className="w-full" data-testid={`button-buy-${pkg.credits}`}>
                    Purchase
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
