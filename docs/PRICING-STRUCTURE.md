# AetherWave Studio - Video Generation Pricing Structure

## Executive Summary

**Margin Policy**: 50% markup on all API costs
**Credit System**: 1 credit = $0.01 USD
**Rounding**: Always round up to nearest whole credit (benefits platform 0-3%)

---

## 🎯 Pricing Formula

```typescript
// Step 1: Calculate API cost
apiCost = costPerSecond × duration

// Step 2: Add 50% margin
totalCost = apiCost × 1.5

// Step 3: Convert to credits (round up)
credits = Math.ceil(totalCost / 0.01)

// Step 4: Actual charge
finalCost = credits × $0.01
```

**Actual margin** = ((finalCost - apiCost) / apiCost) × 100
- Typically 50-53% due to rounding
- Never less than 50%

---

## 💰 Current Pricing Table (January 2025)

### **SORA 2 Models** (OpenAI via KIE.ai)

| Model | Duration | API Cost | 1.5x | Credits | We Charge | Actual Margin |
|-------|----------|----------|------|---------|-----------|---------------|
| **SORA 2 Standard** | 10s | $0.15 | $0.225 | 23 | $0.23 | 53.3% |
| **SORA 2 Standard** | 15s | $0.225 | $0.3375 | 34 | $0.34 | 51.1% |
| **SORA 2 Pro** | 10s | $0.45 | $0.675 | 68 | $0.68 | 51.1% |
| **SORA 2 Pro** | 15s | $0.675 | $1.0125 | 102 | $1.02 | 51.1% |
| **SORA 2 Pro HD** | 10s | $1.00 | $1.50 | 150 | $1.50 | 50.0% |
| **SORA 2 Pro HD** | 15s | $1.50 | $2.25 | 225 | $2.25 | 50.0% |

**Cost per second:**
- Standard: $0.015/s
- Pro: $0.045/s
- Pro HD: $0.10/s

**Features:**
- Free users: Videos include watermark
- Paid users: Watermark removed automatically
- Aspect ratios: 16:9 or 9:16 only
- Audio included

---

### **VEO 3 Models** (Google via KIE.ai)

| Model | Duration | API Cost | 1.5x | Credits | We Charge | Actual Margin |
|-------|----------|----------|------|---------|-----------|---------------|
| **VEO 3 Fast** | 5s | $0.1875 | $0.28125 | 29 | $0.29 | 54.7% |
| **VEO 3 Fast** | 8s | $0.30 | $0.45 | 45 | $0.45 | 50.0% |
| **VEO 3 Fast** | 10s | $0.375 | $0.5625 | 57 | $0.57 | 52.0% |

**Cost per second:** $0.0375/s ($0.30/8s)

**Features:**
- Cinematic quality
- All aspect ratios: 16:9, 9:16, 1:1, 4:3, 21:9
- Duration: 5-10 seconds (1s steps)

---

### **Seedance Models** (ByteDance via Fal.ai)

#### **Seedance Lite**

| Resolution | Duration | API Cost | 1.5x | Credits | We Charge | Actual Margin |
|------------|----------|----------|------|---------|-----------|---------------|
| 512p | 5s | $0.05 | $0.075 | 8 | $0.08 | 60.0% |
| 720p | 5s | $0.1125 | $0.16875 | 17 | $0.17 | 51.1% |
| 1080p | 5s | $0.25 | $0.375 | 38 | $0.38 | 52.0% |

**Cost per second:**
- 512p: $0.010/s
- 720p: $0.0225/s
- 1080p: $0.050/s
- 4K: $0.100/s

#### **Seedance Pro**

| Resolution | Duration | API Cost | 1.5x | Credits | We Charge | Actual Margin |
|------------|----------|----------|------|---------|-----------|---------------|
| 512p | 5s | $0.10 | $0.15 | 15 | $0.15 | 50.0% |
| 720p | 5s | $0.225 | $0.3375 | 34 | $0.34 | 51.1% |
| 1080p | 5s | $0.50 | $0.75 | 75 | $0.75 | 50.0% |

**Cost per second:**
- 512p: $0.020/s
- 720p: $0.045/s
- 1080p: $0.100/s
- 4K: $0.200/s

**Features:**
- Duration: 3-10 seconds (1s steps)
- Supports first frame, reference, and first+last frame modes

---

## 📈 Competitive Analysis

### vs OpenAI Direct
- **Their price**: $0.10/s with watermark
- **Our SORA 2**: $0.015/s (their API via KIE.ai)
- **User savings**: 85% cheaper than OpenAI direct

### vs KIE.ai Direct
- **Their price**: $0.15/10s
- **Our price**: $0.23/10s
- **Our margin**: 53%
- **Value add**: Integrated platform, credit system, user management

---

## 🔄 Updating Prices

When API costs change, update **ONE PLACE**:

**File**: `server/routes.ts` (lines 68-96)

```typescript
function calculateVideoCredits(
  model: VideoModel,
  resolution?: Resolution,
  duration?: number
): number {
  let costPerSecond = 0;

  // Update these values when API prices change:
  if (model === 'veo3_fast') {
    costPerSecond = 0.0375; // UPDATE HERE
  } else if (model === 'sora2') {
    costPerSecond = 0.015; // UPDATE HERE
  }
  // ... etc

  const apiCost = costPerSecond * (duration || 5);
  const totalCost = apiCost * 1.5; // 50% margin
  const totalCredits = Math.ceil(totalCost / 0.01);

  return totalCredits;
}
```

**The formula automatically:**
1. ✅ Applies 50% margin
2. ✅ Rounds up to whole credits
3. ✅ Returns correct pricing

---

## 💡 Pricing Strategy Notes

### Why 50% Margin?

1. **Infrastructure costs**: Server hosting, bandwidth, storage
2. **Support costs**: User support, documentation, maintenance
3. **Platform value**: Credit system, UI/UX, integrations
4. **Risk buffer**: API price increases, failed generations
5. **Profit margin**: Sustainable business model

### Watermark Policy

**SORA 2 Only** (KIE.ai charges extra for watermark removal)

```typescript
// Automatic watermark removal logic
const isPaidUser = user.subscriptionPlan !== 'free';
kieInput.remove_watermark = isPaidUser;
```

- **Free users**: Get watermarked videos (still functional!)
- **Paid users**: Automatic watermark removal (premium experience)
- **Result**: Natural upgrade incentive

### Rounding Policy

**Always round UP** to nearest credit (`Math.ceil`)

**Why?**
- Prevents fractional cents
- Slightly increases margin (0-3%)
- Industry standard practice
- Simpler for users to understand

**Example:**
- Calculated: $0.225
- Rounded credits: 23 (not 22.5)
- Charged: $0.23
- Extra margin: $0.005 (0.3%)

---

## 🎯 Pricing Transparency

### What We Show Users

**Before generation:**
```
Estimated Cost: 23 credits ($0.23)
SORA 2 Standard • 10 seconds • 16:9
```

**Why transparent?**
1. Builds trust
2. No billing surprises
3. Users make informed decisions
4. Reduces support tickets

### What We DON'T Show

- Our API costs (competitive info)
- Exact margin percentage
- Provider details (KIE.ai, Fal.ai)

We show **value** (what they get), not **cost breakdown** (what we pay).

---

## 📊 Monthly Revenue Calculator

### Example: 1000 videos/month

| Model | Duration | User Charge | API Cost | Profit | Margin |
|-------|----------|-------------|----------|--------|--------|
| SORA 2 | 10s | $230 | $150 | **$80** | 53% |
| SORA 2 Pro | 10s | $680 | $450 | **$230** | 51% |
| VEO 3 | 8s | $450 | $300 | **$150** | 50% |

**Total profit on 1000 videos**: $80-$230 depending on model mix

### Break-even Analysis

**Fixed costs** (estimated):
- Server: $50/month
- Database: $25/month
- Bandwidth: $30/month
- **Total**: $105/month

**Break-even**: ~100 SORA 2 videos/month or ~50 Pro videos/month

---

## 🚀 Scaling Considerations

### Volume Discounts (Future)

When monthly API spend exceeds:
- **$500**: Negotiate 5% discount with KIE.ai
- **$1000**: Negotiate 10% discount
- **$5000**: Negotiate 15% discount

**Pass savings to users?**
- Option 1: Keep same prices, increase margin
- Option 2: Reduce prices 5%, increase volume
- **Recommendation**: Hybrid - increase margin to 60%, reduce prices 5%

### Price Optimization

**A/B test pricing** when user base > 1000:
- Test 45% vs 50% vs 55% margin
- Measure conversion rate vs revenue
- Find optimal balance

---

## 💳 Subscription Plans

### Overview

AetherWave Studio offers 5 subscription tiers designed to scale with user needs:

| Plan | Price | Media Credits | Music | Video Access | WAV | Commercial |
|------|-------|---------------|-------|--------------|-----|------------|
| **Free** | $0/mo | 50/day (capped) | Basic | ❌ (watermarked) | ❌ | ❌ |
| **Starter** | $9.99/mo | 200/mo | Basic | SORA 2 only | ✅ | ❌ |
| **Studio** | $19/mo | 500/mo | Unlimited | Lite videos | ✅ | ✅ |
| **Creator** | $49/mo | 2000/mo | Unlimited | Lite & Pro | ✅ | ✅ |
| **All Access** | $99/mo | 5000/mo | Unlimited | All + 4K | ✅ | ✅ |

---

### 🆓 Free Plan

**Price**: $0/month

**Features**:
- 50 credits per day (50 welcome bonus on signup)
- Max 50 credits stored at once
- Basic music generation
- Watermarked SORA 2 videos only
- Standard quality
- No commercial license

**Target User**: Hobbyists, testers, casual users

**Monthly Value**: ~$15 if used daily (50 credits × 30 days = 1500 credits = $15)

---

### 🎬 Starter Plan (NEW!)

**Price**: $9.99/month

**Features**:
- **200 media credits per month**
- **SORA 2 video access** (no watermark)
- Basic music generation
- WAV conversion included
- Standard quality
- No commercial license

**Target User**: Content creators testing AI video, YouTubers, social media creators

**Value Proposition**:
- Enough for 8-10 SORA 2 videos (10s each @ 23 credits)
- Or 4-5 SORA 2 videos (15s each @ 34 credits)
- Plus unlimited music generation
- Perfect entry point for video generation

**Why $9.99?**
- Low barrier to entry for SORA 2 access
- Competitive with other AI video platforms
- Covers API costs + 50% margin
- Natural upgrade path from Free

---

### 🎤 Studio Plan

**Price**: $19/month

**Features**:
- **500 media credits per month**
- **Unlimited music generation** (all models)
- **Unlimited WAV conversion**
- Lite videos (all resolutions: 512p, 720p, 1080p, 4K)
- **Commercial license included**

**Target User**: Independent musicians, podcasters, small content creators

**Value Proposition**:
- ~20 SORA 2 videos (10s each)
- Or 60+ Seedance Lite videos (5s, 512p)
- Unlimited music for podcasts/videos
- Commercial license unlocks monetization

**Break-even**: ~$25 value in credits alone + unlimited music worth $50+/mo elsewhere

---

### 🎨 Creator Plan (POPULAR)

**Price**: $49/month

**Features**:
- **2000 media credits per month**
- **Unlimited music generation** (all models)
- **Unlimited WAV conversion**
- Lite & Pro videos (all resolutions including 1080p Pro)
- All image generation engines
- **Commercial license included**

**Target User**: Professional content creators, agencies, YouTubers with 10K+ subs

**Value Proposition**:
- ~80 SORA 2 videos (10s each)
- Or ~30 SORA 2 Pro videos (10s each @ 68 credits)
- Access to higher quality Pro models
- All image generation tools

**Why Popular?**
- Best credits-per-dollar ratio
- Professional quality output
- Enough credits for weekly video production
- Commercial license for client work

---

### ⚡ All Access Plan

**Price**: $99/month

**Features**:
- **5000 media credits per month** (rate-limited for abuse prevention)
- **Unlimited music generation** (all models)
- **Unlimited WAV conversion**
- Lite & Pro videos (all resolutions including 4K)
- All image generation engines
- **Commercial license included**
- **API access** for automation
- **Priority support**

**Target User**: Agencies, production companies, high-volume creators

**Value Proposition**:
- ~200 SORA 2 videos (10s each)
- Or ~70 SORA 2 Pro videos (10s each)
- Or ~30 VEO 3 videos (8s each @ 45 credits)
- API access enables workflow automation
- Priority support for mission-critical work

**Why $99?**
- Covers API costs at volume
- Prevents abuse with rate limiting
- API access justifies premium price
- Priority support has real cost

---

### 💎 One-Time Credit Bundles

For users who don't want subscriptions or need extra credits:

| Bundle | Price | Credits | Savings |
|--------|-------|---------|---------|
| Small | $10 | 1000 | 0% |
| Medium | $25 | 2700 | 8% |
| Large | $50 | 5500 | 10% |
| XL | $100 | 12000 | 20% |

**Notes**:
- Credits never expire
- Can be purchased alongside subscriptions
- No commercial license included
- Good for occasional burst usage

---

### 📊 Plan Comparison: What Can You Create?

#### With 200 Credits (Starter Plan):

| Content Type | Quantity |
|--------------|----------|
| SORA 2 (10s) | 8 videos |
| SORA 2 (15s) | 5 videos |
| VEO 3 (8s) | 4 videos |
| Seedance Lite (5s, 512p) | 25 videos |
| Seedance Lite (5s, 720p) | 11 videos |

#### With 500 Credits (Studio Plan):

| Content Type | Quantity |
|--------------|----------|
| SORA 2 (10s) | 21 videos |
| VEO 3 (8s) | 11 videos |
| Seedance Lite (5s, 1080p) | 13 videos |

#### With 2000 Credits (Creator Plan):

| Content Type | Quantity |
|--------------|----------|
| SORA 2 Pro (10s) | 29 videos |
| SORA 2 Pro (15s) | 19 videos |
| VEO 3 (10s) | 35 videos |
| Mixed production workflow | 50+ pieces |

---

### 🎯 Upgrade Path Strategy

**Free → Starter ($9.99)**
- Trigger: User generates 3+ watermarked videos
- Message: "Remove watermarks for $9.99/mo"
- Value: 200 credits + no watermarks

**Starter → Studio ($19)**
- Trigger: User runs out of credits mid-month
- Message: "Get 2.5x more credits + commercial license"
- Value: 500 credits + unlimited music + commercial

**Studio → Creator ($49)**
- Trigger: User consistently uses 450+ credits/mo
- Message: "Upgrade to Pro quality + 4x more credits"
- Value: Pro models + 2000 credits

**Creator → All Access ($99)**
- Trigger: User hits credit cap or needs API
- Message: "Get 2.5x more + API access for automation"
- Value: 5000 credits + API + priority support

---

### 💰 Revenue Projections

#### Monthly Recurring Revenue (MRR) Goals:

**Conservative (100 users)**:
- 60 Free: $0
- 20 Starter: $200
- 10 Studio: $190
- 8 Creator: $392
- 2 All Access: $198
- **Total MRR**: $980

**Realistic (500 users)**:
- 300 Free: $0
- 100 Starter: $999
- 60 Studio: $1,140
- 30 Creator: $1,470
- 10 All Access: $990
- **Total MRR**: $4,599

**Optimistic (1000 users)**:
- 600 Free: $0
- 200 Starter: $1,998
- 120 Studio: $2,280
- 60 Creator: $2,940
- 20 All Access: $1,980
- **Total MRR**: $9,198

---

### 🔑 Key Business Metrics

**Average Revenue Per User (ARPU)**:
- Excluding free users: $15-25/mo
- Including free users: $5-10/mo

**Customer Lifetime Value (LTV)**:
- Starter: $120 (12-month retention)
- Studio: $228 (12-month retention)
- Creator: $588 (12-month retention)
- All Access: $1,188 (12-month retention)

**Churn Reduction Strategy**:
- Free tier prevents immediate churn
- Credit rollover (if implemented) increases stickiness
- Commercial license locks in professionals
- API access creates workflow dependency

---

## 📝 Change Log

### 2025-01-29
- Initial pricing structure documented
- SORA 2: $0.15/10s → $0.23/10s (53% margin)
- VEO 3: $0.30/8s → $0.45/8s (50% margin)
- Seedance Lite/Pro: Various resolutions
- 50% margin policy established
- Watermark removal automated by plan
- **Added Starter Plan ($9.99/mo)** with 200 credits and SORA 2 access
- Documented all 5 subscription tiers (Free, Starter, Studio, Creator, All Access)
- Added revenue projections and business metrics
- Created upgrade path strategy

---

## 🔍 Quick Reference

**Key Files:**
- Pricing logic: `server/routes.ts` (line 68-110)
- API costs: `server/kieClient.ts` (line 342-353)
- UI display: `client/src/pages/video-generation.tsx`

**Key Constants:**
- Margin multiplier: `1.5` (50%)
- Credit value: `$0.01`
- Rounding: `Math.ceil()`

**Key Formulas:**
```typescript
credits = Math.ceil((apiCost × 1.5) / 0.01)
actualMargin = ((credits × 0.01) - apiCost) / apiCost × 100
```

---

**Last Updated**: 2025-01-29
**Reviewed By**: Financial Planning
**Next Review**: When API prices change or quarterly (whichever first)
