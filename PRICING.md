# AetherWave Studio Pricing & Credit System

**Last Updated:** January 2025
**Credit Value:** 1 credit = $0.01 USD

---

## 📊 Credit Economics Overview

All pricing includes a **50% margin** for infrastructure, storage, support, and profit on top of API costs.

### API Cost Breakdown

| Service | API Provider | API Cost | + 50% Margin | Credits |
|---------|--------------|----------|--------------|---------|
| **Music Generation** | KIE.ai/Suno | $0.06 | $0.09 | **10** |
| **Image (DALL-E 3)** | OpenAI | $0.04 | $0.06 | **6** |
| **Album Art** | fal.ai Seedream | $0.03 | $0.045 | **5** |
| **WAV Conversion** | (processing) | $0.02 | $0.03 | **3** |
| **Video (see below)** | fal.ai Seedance | varies | varies | **5-375** |

---

## 🎬 Video Generation Pricing

Video pricing is **dynamic** based on model, provider, resolution, and duration.

### Premium Models (KIE.ai) - Fixed per-second pricing

| Model | Provider | Cost/Second | API Cost | 5s Video | 8s Video | 10s Video |
|-------|----------|-------------|----------|----------|----------|-----------|
| **Sora 2 Standard** | KIE.ai/OpenAI | $0.015 | $0.15/10s | **12 credits** | **23 credits** | **23 credits** |
| **Veo 3 Fast** | KIE.ai/Google | $0.0375 | $0.30/8s | **29 credits** | **45 credits** | **57 credits** |
| **Sora 2 Pro** | KIE.ai/OpenAI | $0.045 | $0.45/10s | **34 credits** | **54 credits** | **68 credits** |
| **Sora 2 Pro HD** | KIE.ai/OpenAI | $0.10 | $1.00/10s | **75 credits** | **120 credits** | **150 credits** |

**Key Benefits:**
- ⭐ **OpenAI Sora 2** - 60% cheaper than OpenAI direct pricing!
- ⭐ **Google Veo 3** - Latest Google video AI with cutting-edge quality
- ✅ Resolution-independent (premium models don't charge extra for HD)
- ✅ Aspect ratio control (16:9, 9:16, 1:1, 4:3, 21:9)

### Seedance Models (fal.ai) - Resolution-dependent pricing

| Model | Resolution | Cost/Second | 3s Video | 5s Video | 8s Video | 10s Video |
|-------|-----------|-------------|----------|----------|----------|-----------|
| **Lite** | 512p (480p) | $0.010 | 5 credits | 8 credits | 15 credits | 15 credits |
| **Lite** | 720p | $0.0225 | 11 credits | 17 credits | 27 credits | 34 credits |
| **Lite** | 1080p | $0.050 | 23 credits | 38 credits | 60 credits | 75 credits |
| **Lite** | 4K | $0.100* | 45 credits | 75 credits | 120 credits | 150 credits |
| **Pro** | 512p (480p) | $0.020 | 9 credits | 15 credits | 30 credits | 30 credits |
| **Pro** | 720p | $0.045 | 21 credits | 34 credits | 54 credits | 68 credits |
| **Pro** | 1080p | $0.100 | 45 credits | 75 credits | 120 credits | 150 credits |
| **Pro** | 4K | $0.200* | 90 credits | 150 credits | 240 credits | 300 credits |

*\*4K pricing is estimated*

### Video Credit Calculation Formula

```typescript
// For premium models (Sora 2, Veo 3)
costPerSecond = MODEL_COST_PER_SECOND  // Fixed rate from KIE.ai
apiCost = costPerSecond × duration
totalCost = apiCost × 1.5  // 50% margin
credits = Math.ceil(totalCost / 0.01)

// For Seedance models (resolution-dependent)
costPerSecond = getApiCost(model, resolution)  // from fal.ai pricing
apiCost = costPerSecond × duration
totalCost = apiCost × 1.5  // 50% margin
credits = Math.ceil(totalCost / 0.01)
```

**Implementation:** See `calculateVideoCredits()` in `server/routes.ts` and `kieSubscribe()` in `server/kieClient.ts`

---

## 💳 Subscription Plans

### Free Plan - $0/month

**Credits:**
- **50 credits welcome bonus** (one-time on signup)
- **10 credits/day** (resets daily at midnight UTC)
- **50 credit cap** - Quest rewards can push you over 50, but daily credits won't be added if you're at/above 50
- Earn extra credits through quests (follow on social media)

**What You Can Make:**
- 🎵 5 songs (10 credits each) OR
- 🎬 10 short videos (lite, 512p, 3s = 5 credits each) OR
- 🖼️ 8 images (6 credits each) OR
- 🎨 10 album arts (5 credits each) OR
- **Mix and match** (e.g., 2 videos + 4 songs)

**Quest System - Earn Extra Credits:**
- ✅ Follow us on X.com → +10 credits
- ✅ Join our Discord → +10 credits
- ✅ Follow us on Facebook → +10 credits
- ✅ Follow us on TikTok → +10 credits
- **Total possible: 40 extra credits** (one-time per quest)

**Restrictions:**
- Music: V3.5, V4 models only
- Video: Lite model, 512p resolution, 3s duration max
- Images: DALL-E 2 only
- Audio upload: 10MB max
- ❌ No WAV conversion
- ❌ No commercial license
- ❌ No API access

**Monthly Cost to Platform:**
- Active user: $3-9/month depending on usage (reduced with new cap)
- Target: Lead generation & conversion funnel

---

### Starter Plan - $9.99/month 🆕

**Credits:**
- **Unlimited music generation** (all models V3.5 - V5)
- 200 credits/month for video & images
  - No daily reset - use anytime during the month
  - Resets on billing anniversary date

**What You Can Make Per Month:**
- 🎵 **Unlimited songs** (all models V3.5 - V5)
- 🎬 **~8 Sora 2 videos** (8s, 23 credits each - OpenAI branding!) OR
- 🎬 ~25 Seedance Lite videos (512p, 8s = 8 credits each) OR
- 🎬 **~4 Veo 3 Fast videos** (8s, 45 credits each - Google branding!) OR
- 🖼️ ~33 images (DALL-E 3, 6 credits each) OR
- **Mix and match!** (e.g., 10 songs + 4 Sora 2 videos + 8 images)

**Features:**
- Music: **All models (V3.5 - V5)** - unlimited!
- Video: **Sora 2 Standard** + Seedance Lite (all resolutions up to 1080p, 8s max)
- Images: DALL-E 2 & DALL-E 3
- Audio upload: 50MB max
- ✅ Commercial license
- ❌ No WAV conversion (upgrade to Studio for WAV)
- ❌ No Veo 3 or Sora Pro (upgrade to Creator)
- ❌ No API access

**Monthly Cost to Platform:** $3-4 (with 150 credits avg usage)
**Target Margin:** 70%+ profit
**Target Users:** Hobbyists, content creators trying AI, impulse buyers

**Why This Tier?**
- **$9.99 psychology** - "Less than Netflix", low-friction purchase
- **Sora 2 access** - Premium OpenAI branding at entry level
- **Removes daily reset anxiety** - Monthly pool feels more generous
- **Perfect upsell path** - Want WAV? (Studio) Want more videos/Veo 3? (Creator)

---

### Studio Plan - $19/month

**Credits:**
- **Unlimited music generation**
- **Unlimited WAV conversion**
- 500 credits/month for video & images
  - Separate pool from music
  - Resets monthly

**What You Can Make Per Month:**
- 🎵 **Unlimited songs** (all models)
- 🎬 ~21 Sora 2 videos (8s each) OR ~60 Seedance Lite videos (512p, 8s) OR ~16 Seedance Lite HD videos (720p, 8s)
- 🖼️ ~83 images (mixed use with videos)
- 🔊 **Unlimited WAV conversions**

**Features:**
- Music: All models (V3.5 - V5)
- Video: **Sora 2 Standard** + Seedance Lite & Pro (all resolutions, up to 10s)
- Images: DALL-E 2 & DALL-E 3
- Audio upload: 100MB max
- ✅ Commercial license
- ✅ **Unlimited WAV conversion** (upgrade value!)
- ❌ No Veo 3 or Sora Pro (upgrade to Creator)
- ❌ No API access

**Monthly Cost to Platform:** $15-20
**Target Margin:** Break-even to slight profit
**Target Users:** Music producers, podcasters

---

### Creator Plan - $49/month

**Credits:**
- **Unlimited music generation**
- **Unlimited WAV conversion**
- 2000 credits/month for video & images

**What You Can Make Per Month:**
- 🎵 **Unlimited songs** (all models)
- 🎬 **~87 Sora 2 videos** (8s each) OR **~44 Veo 3 videos** (8s) OR **~37 Sora 2 Pro videos** (8s) OR ~250 Seedance Lite videos (512p, 8s)
- 🖼️ ~333 images (mixed use with videos)
- 🔊 **Unlimited WAV conversions**

**Features:**
- Music: All models (V3.5 - V5)
- Video: **Sora 2 (Standard & Pro)** + **Veo 3 Fast** + Seedance Lite & Pro (all resolutions, up to 10s)
- Images: All engines (DALL-E 2, DALL-E 3, Flux, Midjourney, Stable Diffusion)
- Audio upload: 100MB max
- ✅ Commercial license
- ✅ **Unlimited WAV conversion**
- ✅ **Access to Google Veo 3 & OpenAI Sora 2 Pro!**
- ❌ No Sora 2 Pro HD (upgrade to All Access)
- ❌ No API access

**Monthly Cost to Platform:** $35-45
**Target Margin:** ~$4-14 profit
**Target Users:** Content creators, YouTubers, marketing agencies

---

### All Access Plan - $99/month

**Credits:**
- **Unlimited everything** (with fair-use rate limits)
- 5000 credit cap for video generation to prevent abuse

**What You Can Make Per Month:**
- 🎵 **Unlimited songs** (all models)
- 🎬 **~217 Sora 2 videos** (8s) OR **~111 Veo 3 videos** (8s) OR **~92 Sora 2 Pro videos** (8s) OR **~41 Sora 2 Pro HD videos** (8s) OR ~625 Seedance Lite videos (512p, 8s)
- 🖼️ **Unlimited images** (with fair-use limits)
- 🔊 **Unlimited WAV conversions**
- 🔌 **API access** (1000 requests/day limit)

**Features:**
- Music: All models
- Video: **ALL MODELS** - Sora 2 (Standard, Pro, Pro HD), Veo 3 Fast, Seedance (Lite & Pro), all resolutions
- Images: All engines
- Audio upload: 100MB max
- ✅ Commercial license
- ✅ API access with rate limits
- ✅ Priority support
- ✅ **Access to Sora 2 Pro HD (1080p premium quality)**

**Monthly Cost to Platform:** $60-80 (with rate limits)
**Target Margin:** ~$19-39 profit
**Target Users:** Studios, agencies, developers

---

## 🎯 Feature Comparison Table

| Feature | Free | Starter 🆕 | Studio | Creator | All Access |
|---------|------|---------|--------|---------|------------|
| **Price** | $0 | **$9.99** | $19 | $49 | $99 |
| **Credits** | 50 bonus + 10/day (cap: 50) | 200/mo | 500/mo | 2000/mo | 5000/mo |
| **Quest Rewards** | ✅ (4 quests × 10 credits) | ❌ | ❌ | ❌ | ❌ |
| **Music** | Limited | **Unlimited** | Unlimited | Unlimited | Unlimited |
| **Music Models** | V3.5, V4 | **All (V3.5-V5)** | All | All | All |
| **Video Models** | Seedance Lite | **Sora 2 + Lite** | Sora 2 + Lite/Pro | **Sora 2/Pro + Veo 3 + All Seedance** | **All (Sora Pro HD!)** |
| **Video Resolution** | 512p | Up to 1080p | All | All | All |
| **Video Duration** | 3s max | 8s max | 10s max | 10s max | 10s max |
| **Image Engines** | DALL-E 2 | DALL-E 2, 3 | DALL-E 2, 3 | All | All |
| **Audio Upload** | 10MB | 50MB | 100MB | 100MB | 100MB |
| **WAV Conversion** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Commercial License** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Best For** | Trial | **Impulse buy** | Musicians | Creators | Studios |

---

## 💰 Business Economics

### Free Tier Analysis

**New System (50 welcome + 10/day with 50 cap + quests):**

**Assumptions:**
- 1000 registered users
- 20% daily active users (200)
- Average usage: 20 credits/day per active user (with cap enforcement)
- 30% complete at least 1 quest (avg 2 quests = 20 credits)

**Monthly Cost:**
- Welcome bonuses: Assume 100 new users/mo × 50 credits = 5,000 credits
- Daily credits: 200 active × 20 credits × 30 days = 120,000 credits
- Quest rewards: 300 users × 20 credits = 6,000 credits
- **Total: 131,000 credits/month × $0.01 = $1,310/month**

**Revenue:** $0

**Conversion Goal:** 10% to paid (100 users)
- 100 users × $25 average (weighted with Starter tier) = **$2,500/month revenue**
- Cost: Free tier ($1,310) + Paid tier API ($1,800) = $3,110
- **Break-even at ~6% conversion** 🎯
- **Profitable at 10%+ conversion** with ~$500-800 margin

### Profitability by Plan

| Plan | Price | Avg API Cost | Margin | Profit/User |
|------|-------|--------------|--------|-------------|
| Free | $0 | $3-9 | N/A | -$3 to -$9 (reduced!) |
| **Starter 🆕** | **$9.99** | **$2-4** | **60-75%** | **$6-8** |
| Studio | $19 | $15-20 | 0-20% | $0-4 |
| Creator | $49 | $35-45 | 8-28% | $4-14 |
| All Access | $99 | $60-80 | 19-39% | $19-39 |

**Key Insight:** Starter plan has the **highest profit margin** (60-75%) because:
- Users get unlimited music (high perceived value) but API cost is low per-song
- 200 credits/month limits expensive operations (video/image)
- Avg usage ~150 credits = $2.25 API cost → **$7.74 profit** (77% margin!)

**Weighted average profit per paying customer:** ~$12-18/month (with Starter tier)

---

## 🔄 Credit Reset Policy

### Free Plan Credits
- **Welcome Bonus:** 50 credits (one-time on signup)
- **Daily Credits:** 10 credits added every day at 00:00 UTC
- **Credit Cap:** 50 credits maximum
  - If you're at or above 50 credits, daily credits won't be added
  - Quest rewards can push you over 50, but daily reset won't add more until you're below 50
- **Quest Rewards:** One-time only per quest (40 credits total available)
- Example: User has 55 credits from quests → Daily reset adds 0 credits → User spends 20 credits (now at 35) → Next daily reset adds 10 credits (now at 45)

### Monthly Credits (Paid Plans)
- Reset: On billing anniversary date
- Unused credits: Do NOT carry over
- Music generation: Always unlimited (no credit cost)
- Video/image credits: Tracked separately per month

---

## 📈 Future Pricing Considerations

### Potential Adjustments
1. **If API costs increase:** Adjust credit costs proportionally
2. **If conversion < 5%:** Reduce free tier to 30 credits/day
3. **If video abuse occurs:** Add stricter rate limits on All Access
4. **Add-ons:** Consider premium video add-on ($10-20/month for extra credits)

### Monitoring Metrics
- Track average API cost per user per plan
- Monitor free-to-paid conversion rate (target: 10%)
- Watch for abuse patterns (excessive video generation)
- Measure churn vs. pricing

---

## 🛠️ Technical Implementation

### Files Modified
- `shared/schema.ts` - Plan features & credit costs
- `server/routes.ts` - Video credit calculation function
- `server/storage.ts` - Credit management logic

### Key Functions
- `calculateVideoCredits()` - Dynamic video pricing
- `storage.deductCredits()` - Credit deduction with plan checks
- `storage.checkCredits()` - Pre-validation before generation

### Testing Checklist
- [ ] Free users get 50 credits on signup (welcome bonus)
- [ ] Free users receive 10 credits/day at midnight UTC
- [ ] Free users' credits cap at 50 (daily reset doesn't add if >= 50)
- [ ] Quest completion awards 10 credits per quest
- [ ] Quests can only be completed once per user
- [ ] Quest rewards can push users over 50 credit cap
- [ ] Free users can only generate lite 512p 3s videos
- [ ] Paid users can access higher quality settings
- [ ] Credit deduction works correctly for all services
- [ ] Unlimited plans don't deduct credits for music
- [ ] Monthly credit pools reset on billing date

---

## 📞 Support & Questions

For pricing questions or plan upgrades:
- Documentation: `/docs/pricing`
- Support: support@aetherwavestu dio.com
- Billing: billing@aetherwavestudio.com

---

**Document Version:** 1.0
**Last Review:** January 2025
**Next Review:** March 2025 (post-beta launch)
