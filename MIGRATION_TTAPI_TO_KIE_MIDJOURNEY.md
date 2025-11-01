# Migration Guide: ttapi.io → KIE.ai Midjourney

**Estimated Time**: 30 minutes
**Difficulty**: Easy (function already exists!)
**Risk**: Low (can revert easily)

---

## 🎯 Why This Migration?

**Current Problem**: ttapi.io
- Not trusted by team
- Unofficial (TOS violation)
- Single-purpose provider

**Solution**: KIE.ai
- ✅ Already using for SUNO music
- ✅ Same pricing ($0.04/gen)
- ✅ More trustworthy (larger platform)
- ✅ Consolidates providers (music + images)
- ✅ **Already integrated!** (kieClient.ts:781)

---

## 📊 What Changes

| Before (ttapi.io) | After (KIE.ai) |
|-------------------|----------------|
| `generateMidjourneyTtapi()` | `generateMidjourney()` |
| ttapiClient.ts | kieClient.ts (already have!) |
| TTAPI_IO_API_KEY | KIE_API_KEY (already have!) |
| Models: v6 only | Models: v7, v6.1, v5.2, Niji |
| Speed: fast/turbo/relax | All modes supported |

---

## 🔧 Step 1: Update routes.ts (10 min)

### File: `server/routes.ts`

**Find this code** (around line 1712-1847):
```javascript
// Midjourney image generation via ttapi.io
app.post("/api/media/midjourney-ttapi", authMiddleware, async (req: any, res) => {
  // ... existing code ...

  // Line ~1772: This is what we're changing
  const result = await generateMidjourneyTtapi(
    styledPrompt,
    speed as "fast" | "turbo" | "relax",
    aspectRatio,
    timeoutSeconds
  );
```

**Replace with**:
```javascript
// Midjourney image generation via KIE.ai (consolidated provider)
app.post("/api/media/midjourney-ttapi", authMiddleware, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const user = await storage.getUser(userId);
    const { prompt, style = 'photorealistic', aspectRatio = '1:1', speed = 'fast' } = req.body;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Validate inputs
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
    }

    // Validate speed parameter
    if (speed !== 'fast' && speed !== 'turbo' && speed !== 'relax') {
      return res.status(400).json({ error: 'Invalid speed. Must be "fast", "turbo", or "relax"' });
    }

    // Determine service type based on speed
    const serviceType = speed === 'turbo' ? 'midjourney_generation_turbo' : 'midjourney_generation';

    // Deduct credits
    const creditResult = await storage.deductCredits(userId, serviceType);

    if (!creditResult.success) {
      return res.status(403).json({
        error: 'Insufficient credits',
        credits: creditResult.newBalance,
        required: SERVICE_CREDIT_COSTS[serviceType],
        message: creditResult.error || `You need more credits for Midjourney ${speed} mode.`
      });
    }

    // Style mapping (same as before)
    const styleNames: Record<string, string> = {
      cyberpunk: 'Cyberpunk neon-lit futuristic aesthetic',
      abstract: 'Abstract artistic interpretation',
      retro: 'Retro vaporwave 80s aesthetic',
      minimal: 'Minimalist clean design',
      surreal: 'Surrealist dreamlike imagery',
      photorealistic: 'Photorealistic professional photography'
    };

    const styleName = styleNames[style] || 'photorealistic';
    const styledPrompt = `In the style of ${styleName}, ${prompt}`;

    console.log('Generating images with Midjourney via KIE.ai:', {
      originalPrompt: prompt,
      styledPrompt,
      style,
      aspectRatio,
      speed
    });

    // Set timeout based on speed mode (same as before)
    const timeoutSeconds = speed === 'turbo' ? 120 : speed === 'relax' ? 300 : 180;

    // Call KIE.ai Midjourney (already integrated!)
    const result = await generateMidjourney({
      prompt: styledPrompt,
      taskType: 'imagine', // text-to-image generation
      version: 'v7', // Use latest Midjourney v7 (or 'v6.1', 'v5.2', 'niji')
      aspectRatio: aspectRatio,
      timeoutSeconds: timeoutSeconds,
      apiKey: process.env.KIE_API_KEY || process.env.SUNO_API_KEY,
      onQueueUpdate: (update: any) => {
        console.log(`KIE.ai Midjourney queue update:`, update.status, update.progress ? `${update.progress}%` : '');
      }
    });

    if (!result.success) {
      console.error('KIE.ai Midjourney generation failed:', result.error);

      // Check if it's a timeout error and refund credits
      if (result.error && result.error.includes('did not complete within')) {
        console.log(`⏱️ KIE.ai Midjourney timed out after ${timeoutSeconds}s, refunding ${SERVICE_CREDIT_COSTS[serviceType]} credits to user ${userId}`);

        const refundResult = await storage.refundCredits(userId, serviceType);

        if (refundResult.success) {
          const timeoutMessage = refundResult.amountRefunded > 0
            ? `KIE.ai Midjourney servers are experiencing delays. Your ${refundResult.amountRefunded} credits have been refunded. Try Nano Banana for instant results, or try again later.`
            : `KIE.ai Midjourney servers are experiencing delays. Try Nano Banana for instant results, or try again later.`;

          return res.status(408).json({
            error: 'Generation timeout',
            timeout: true,
            timeoutSeconds,
            creditsRefunded: refundResult.amountRefunded,
            newBalance: refundResult.newBalance,
            message: timeoutMessage,
            details: result.error
          });
        } else {
          console.error(`❌ Failed to refund credits:`, refundResult.error);
        }
      }

      return res.status(500).json({
        error: 'KIE.ai Midjourney generation failed',
        details: result.error
      });
    }

    // Extract image URLs from result
    const imageUrls = result.imageUrls || (result.imageUrl ? [result.imageUrl] : []);

    if (imageUrls.length === 0) {
      console.error('No images returned from KIE.ai Midjourney');
      return res.status(500).json({
        error: 'KIE.ai Midjourney generation completed but no images found'
      });
    }

    console.log(`✅ KIE.ai Midjourney generated ${imageUrls.length} images successfully`);

    return res.status(200).json({
      imageUrls,
      prompt,
      hasReference: false,
      model: 'midjourney-kie',
      version: 'v7'
    });

  } catch (error: any) {
    console.error('KIE.ai Midjourney generation error:', error);
    res.status(500).json({
      error: 'Failed to generate with KIE.ai Midjourney',
      details: error.message
    });
  }
});
```

---

## 🔧 Step 2: Update Import Statement (1 min)

**Find this** (around line 14):
```javascript
import { generateMidjourneyTtapi } from "./ttapiClient";
```

**Change to**:
```javascript
// Remove ttapi import, add KIE Midjourney import
// import { generateMidjourneyTtapi } from "./ttapiClient"; // OLD - remove
// generateMidjourney is already imported from kieClient!
```

**Check existing imports** (should already have):
```javascript
import { kieSubscribe, uploadImageToKie, generateMidjourney, KIE_MODELS } from "./kieClient";
```

If `generateMidjourney` is not in the import, add it!

---

## 🔧 Step 3: Environment Variables (Already Done!)

You already have `KIE_API_KEY` or `SUNO_API_KEY` in your `.env` file (used for SUNO music).

**No changes needed!** The same API key works for both SUNO and Midjourney.

---

## 🧪 Step 4: Test the Migration (10 min)

### Test 1: Basic Generation
```bash
# Test with curl or frontend
POST /api/media/midjourney-ttapi
{
  "prompt": "A futuristic music studio with neon lights",
  "style": "cyberpunk",
  "aspectRatio": "16:9",
  "speed": "fast"
}
```

**Expected**: 4 image URLs returned in 30-60 seconds

### Test 2: Timeout Handling
```bash
# Test timeout refund (use relax mode for longer wait)
POST /api/media/midjourney-ttapi
{
  "prompt": "Complex detailed scene...",
  "speed": "relax"
}
```

**Expected**: If timeout occurs, credits auto-refunded

### Test 3: Different Models
**Update the code** to test different MJ versions:
```javascript
version: 'v6.1', // Try different versions
// Options: 'v7', 'v6.1', 'v5.2', 'niji' (anime)
```

---

## 🎨 Step 5: Update Frontend Labels (Optional, 5 min)

### File: `client/index.html`

**Find**: References to "ttapi.io" in UI messages

**Replace with**: "KIE.ai" (for user transparency)

Example:
```javascript
// Before:
"Generating with Midjourney via ttapi.io..."

// After:
"Generating with Midjourney via KIE.ai..."
```

---

## 🗑️ Step 6: Remove ttapi.io Code (Optional Cleanup)

**After confirming KIE.ai works**, you can delete:

1. **`server/ttapiClient.ts`** - No longer needed
2. **`.env` variable**: `TTAPI_IO_API_KEY` - Remove

**Keep for rollback**: Leave ttapi code for 1-2 weeks in case you need to revert.

---

## 📊 Step 7: Update Service Registry (5 min)

### File: `db/migrations/001_service_registry.sql`

**Find**: Midjourney entries

**Update** provider from 'ttapi' to 'kie-ai':

```sql
UPDATE service_registry
SET
  provider = 'kie-ai',
  display_name = 'Midjourney (KIE.ai)',
  technical_notes = 'KIE.ai Midjourney API. Same provider as SUNO music generation. Models: v7, v6.1, v5.2, Niji 6. Task-based async API with polling.'
WHERE id IN ('midjourney_generation', 'midjourney_generation_turbo');
```

---

## ✅ Verification Checklist

- [ ] Updated routes.ts to use `generateMidjourney()` from kieClient
- [ ] Verified import statement includes `generateMidjourney`
- [ ] Tested basic image generation (works?)
- [ ] Tested timeout refund logic (refunds properly?)
- [ ] Updated UI labels (optional)
- [ ] Updated service registry (provider = 'kie-ai')
- [ ] Removed ttapi.io API key from .env (optional)
- [ ] Kept ttapiClient.ts for rollback (1-2 weeks)

---

## 🔄 Rollback Plan (If Something Goes Wrong)

**If KIE.ai Midjourney doesn't work:**

1. Revert routes.ts changes (git checkout)
2. Restore ttapi import
3. Re-add TTAPI_IO_API_KEY to .env
4. Restart server

**Time to rollback**: 5 minutes

---

## 📈 Expected Results

### Before (ttapi.io):
- Provider: ttapi.io (untrusted)
- API Keys: 2 (TTAPI + KIE)
- Providers: 2 (ttapi + KIE)
- Models: v6 only

### After (KIE.ai):
- Provider: KIE.ai (trusted, consolidated)
- API Keys: 1 (KIE only)
- Providers: 1 (KIE for music + images)
- Models: v7, v6.1, v5.2, Niji
- Same pricing: $0.04/generation
- Same timeouts: 120s-300s

---

## 🎯 Next Steps After Migration

### Optional Enhancement 1: Add Flux as Legal Backup

**Why**: Fully legal alternative, 10x faster

**How**: Create `fluxClient.ts` similar to kieClient

**Benefit**: Legal option for risk-averse use cases

### Optional Enhancement 2: Let Users Choose MJ Version

**Frontend**: Add dropdown for v7 / v6.1 / v5.2 / Niji

**Backend**: Pass version param to `generateMidjourney()`

**Benefit**: Users can choose style (realistic vs anime)

### Optional Enhancement 3: Monitor Provider Performance

**Track**: Success rates by provider (KIE vs ttapi)

**Compare**: Speed, reliability, cost

**Decision**: Keep best performer

---

## 📞 Support

**If you need help**:
- Check logs: `console.log()` statements show progress
- KIE.ai docs: https://docs.kie.ai/
- Existing function: `server/kieClient.ts:781`

**Common Issues**:
1. **"No taskId returned"** → Check KIE_API_KEY is valid
2. **Timeout** → Increase timeoutSeconds parameter
3. **No images** → Check aspectRatio format (should be "16:9" not 16:9)

---

**Created**: October 31, 2025
**Status**: Ready to implement
**Estimated Total Time**: 30 minutes
**Risk Level**: Low (easy rollback)
