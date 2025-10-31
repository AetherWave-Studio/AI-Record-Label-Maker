import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Music, Users, Sparkles, Zap } from "lucide-react";
import { PLAN_DISPLAY_NAMES, PLAN_PRICING, BAND_LIMITS, type PlanType } from "@shared/schema";

const SUBSCRIPTION_TIERS = [
  {
    id: 'free' as PlanType,
    name: PLAN_DISPLAY_NAMES.free,
    price: `$${PLAN_PRICING.free}`,
    bandLimit: BAND_LIMITS.free,
    features: [
      "2 virtual bands",
      "3 FREE band generations",
      "Basic artist profiles",
      "10 credits per day (capped at 50)",
      "Community activity feed"
    ],
    icon: Music,
    current: true
  },
  {
    id: 'studio' as PlanType,
    name: PLAN_DISPLAY_NAMES.studio,
    price: `$${PLAN_PRICING.studio}`,
    period: "/month",
    bandLimit: BAND_LIMITS.studio,
    features: [
      "7 virtual bands",
      "Unlimited music generation",
      "Enhanced artist profiles",
      "1.5x FAME growth multiplier",
      "Priority processing",
      "Album art generation",
      "HD video generation"
    ],
    icon: Users,
    popular: false
  },
  {
    id: 'creator' as PlanType,
    name: PLAN_DISPLAY_NAMES.creator, 
    price: `$${PLAN_PRICING.creator}`,
    period: "/month",
    bandLimit: BAND_LIMITS.creator,
    features: [
      "17 virtual bands",
      "Unlimited music generation",
      "Premium artist profiles",
      "2.0x FAME growth multiplier",
      "WAV audio conversion",
      "Advanced analytics",
      "Midjourney integration"
    ],
    icon: Sparkles,
    popular: true
  },
  {
    id: 'producer' as PlanType,
    name: PLAN_DISPLAY_NAMES.producer,
    price: `$${PLAN_PRICING.producer}`, 
    period: "/month",
    bandLimit: BAND_LIMITS.producer,
    features: [
      "Unlimited virtual bands",
      "Unlimited music generation",
      "Professional profiles",
      "2.5x FAME growth multiplier",
      "All premium features",
      "Label partnerships",
      "Marketplace exclusives"
    ],
    icon: Crown,
    popular: false
  },
  {
    id: 'mogul' as PlanType,
    name: PLAN_DISPLAY_NAMES.mogul,
    price: `$${PLAN_PRICING.mogul}`, 
    period: "/month",
    bandLimit: BAND_LIMITS.mogul,
    features: [
      "Unlimited virtual bands",
      "Unlimited everything",
      "3.0x FAME growth multiplier",
      "Commercial license",
      "API access",
      "Priority support",
      "All future features"
    ],
    icon: Crown,
    popular: false
  }
];

export default function Upgrade() {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleUpgrade = (tierName: string) => {
    setSelectedTier(tierName);
    // TODO: Implement Stripe checkout integration
    alert(`Upgrade to ${tierName} - Payment integration coming soon!`);
  };

  const currentPlanId = (user?.subscriptionPlan as PlanType) || 'free';
  const currentTierDisplayName = PLAN_DISPLAY_NAMES[currentPlanId];
  const currentBandCount = (user as any)?.bandGenerationCount || 0;
  const userCredits = user?.credits || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Upgrade Your Music Journey
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock unlimited creativity and take your music career to the next level
          </p>
          
          {user && (
            <div className="mt-6 inline-flex items-center gap-4 bg-slate-800/50 rounded-lg px-6 py-3 border border-slate-700">
              <div className="text-sm">
                <span className="text-gray-400">Current Plan:</span>
                <span className="ml-2 font-semibold text-blue-400">{currentTierDisplayName}</span>
              </div>
              <div className="w-px h-6 bg-slate-600" />
              <div className="text-sm">
                <span className="text-gray-400">Bands Created:</span>
                <span className="ml-2 font-semibold text-purple-400">{currentBandCount}</span>
              </div>
              <div className="w-px h-6 bg-slate-600" />
              <div className="text-sm">
                <span className="text-gray-400">Credits:</span>
                <span className="ml-2 font-semibold text-yellow-400">{userCredits.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const Icon = tier.icon;
            const isCurrentTier = tier.id === currentPlanId;
            const isFree = tier.id === 'free';
            
            return (
              <Card 
                key={tier.name}
                className={`relative transition-all duration-300 hover:scale-105 ${
                  tier.popular 
                    ? "ring-2 ring-blue-500 bg-slate-800/80" 
                    : "bg-slate-800/50"
                } ${
                  isCurrentTier 
                    ? "border-green-500 bg-green-900/20" 
                    : "border-slate-700"
                }`}
                data-testid={`tier-card-${tier.name.toLowerCase()}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {isCurrentTier && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <Icon className={`h-8 w-8 ${
                      tier.name === "Pro" ? "text-yellow-400" :
                      tier.name === "Tier 3" ? "text-purple-400" :
                      tier.name === "Tier 2" ? "text-blue-400" :
                      "text-gray-400"
                    }`} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {tier.name}
                  </CardTitle>
                  <div className="text-3xl font-bold">
                    {tier.price}
                    {tier.period && (
                      <span className="text-lg text-gray-400">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-gray-400">
                    {tier.bandLimit === -1 ? "Unlimited bands" : `${tier.bandLimit} bands`}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    {isCurrentTier ? (
                      <Button 
                        disabled
                        className="w-full bg-green-600 text-white"
                        data-testid="current-tier-button"
                      >
                        Current Plan
                      </Button>
                    ) : isFree ? (
                      <Button 
                        onClick={() => handleUpgrade(tier.name)}
                        variant="outline"
                        className="w-full border-slate-700 hover:bg-slate-800 hover:text-white"
                        data-testid="downgrade-button-fan"
                      >
                        Downgrade to Free
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleUpgrade(tier.name)}
                        className={`w-full ${
                          tier.popular 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" 
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                        data-testid={`upgrade-button-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {currentPlanId === 'free' ? "Upgrade Now" : "Change Plan"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8 text-white">Why Upgrade?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Music className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">Unlimited Creativity</h3>
              <p className="text-gray-400">
                Generate as many bands as your creativity demands with higher tier plans
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">Professional Features</h3>
              <p className="text-gray-400">
                Access advanced tools, better audio analysis, and industry partnerships
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                <Crown className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold">Real Career Growth</h3>
              <p className="text-gray-400">
                Streaming distribution, mastering services, and direct label connections
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">What happens if I hit my band limit?</h3>
              <p className="text-gray-300">
                You'll be prompted to upgrade when you reach your tier's limit. Your existing bands remain accessible, 
                but you'll need to upgrade to create new ones.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Can I downgrade my plan?</h3>
              <p className="text-gray-300">
                Yes, you can change your plan at any time. If you downgrade, your existing bands remain accessible, 
                but you may not be able to create new ones until your count falls within the new tier's limit.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Do I get real industry benefits?</h3>
              <p className="text-gray-300">
                Yes! Higher tiers include real-world benefits like streaming distribution through DistroKid, 
                mastering services via LANDR, and partnerships with industry professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}