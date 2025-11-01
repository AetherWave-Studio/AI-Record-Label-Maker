# Service Registry System - Implementation Guide

**Created: October 31, 2025**

## 🎯 Overview

The **Service Registry** is a database-driven system that centralizes all service configuration, replacing scattered hardcoded values across the codebase.

### Before (❌ Scattered Configuration):
- Timeouts hardcoded in frontend: `const maxAttempts = 180`
- Credit costs in schema constants: `SERVICE_CREDIT_COSTS`
- Success rates only in documentation
- No single source of truth
- Can't track real performance
- No admin control without code changes

### After (✅ Centralized Registry):
- **All configuration in database** (`service_registry` table)
- **Real-time success tracking** (attempts, successes, failures, timeouts, refunds)
- **Admin dashboard possible** (update timeouts without code deploy)
- **Performance-based optimization** (adjust timeouts based on actual data)
- **A/B testing capable** (test different timeout values)
- **Automatic documentation** (TOS generated from DB)

---

## 📊 Database Schema

### Table: `service_registry`

```sql
CREATE TABLE service_registry (
  -- Identity
  id VARCHAR PRIMARY KEY,              -- 'music_generation', 'midjourney_generation_turbo'
  display_name VARCHAR NOT NULL,       -- 'Music Generation (SUNO)'
  category VARCHAR NOT NULL,           -- 'music', 'image', 'video', 'audio'
  provider VARCHAR NOT NULL,           -- 'kie-ai', 'openai', 'fal-ai', 'ttapi'

  -- Timeout & Performance
  typical_time_seconds INTEGER,        -- Lower bound (e.g., 120 = 2 min)
  typical_time_seconds_max INTEGER,    -- Upper bound (e.g., 240 = 4 min)
  max_timeout_seconds INTEGER,         -- Hard timeout (e.g., 360 = 6 min)
  poll_interval_ms INTEGER,            -- Polling frequency (e.g., 2000 = 2s)

  -- Credit & Pricing
  credit_cost INTEGER,                 -- Base cost (18 credits)
  is_dynamic_pricing INTEGER,          -- 1 if cost varies by parameters

  -- Real-Time Success Tracking
  success_rate INTEGER,                -- Calculated from totals (0-100%)
  total_attempts INTEGER,              -- Incremented on generation start
  total_successes INTEGER,             -- Incremented on success
  total_failures INTEGER,              -- Incremented on explicit failure
  total_timeouts INTEGER,              -- Incremented on timeout
  total_refunds INTEGER,               -- Incremented on refund issued

  -- Status & Behavior
  is_active INTEGER,                   -- 1 = enabled, 0 = disabled
  is_async_service INTEGER,            -- 1 = polling required, 0 = sync
  auto_refund_enabled INTEGER,         -- 1 = auto-refund on failure

  -- Metadata
  description TEXT,                    -- User-facing description
  technical_notes TEXT,                -- Admin/developer notes
  last_updated TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔧 How to Use the Service Registry

### 1. **Backend: Load Service Config at Runtime**

**Before (hardcoded)**:
```javascript
// Frontend
const maxAttempts = 180; // 6 minutes
const pollInterval = 2000; // 2 seconds

// Backend
const timeout = 360; // seconds
```

**After (database-driven)**:
```javascript
// server/routes.ts - Example for music generation
import { storage } from './storage';

app.post("/api/generate-music", async (req, res) => {
  // Load service config from DB
  const serviceConfig = await storage.getServiceConfig('music_generation');

  if (!serviceConfig.isActive) {
    return res.status(503).json({
      error: 'Music generation is temporarily unavailable'
    });
  }

  // Use config values
  console.log(`Service timeout: ${serviceConfig.maxTimeoutSeconds}s`);
  console.log(`Credit cost: ${serviceConfig.creditCost}`);

  // Track attempt
  await storage.incrementServiceAttempts('music_generation');

  // ... generation logic ...

  // Track success or failure
  if (success) {
    await storage.incrementServiceSuccesses('music_generation');
  } else {
    await storage.incrementServiceFailures('music_generation');
  }
});
```

### 2. **Frontend: Fetch Service Config via API**

**Create API endpoint**:
```javascript
// server/routes.ts
app.get("/api/services", async (req, res) => {
  const services = await storage.getAllActiveServices();
  res.json(services);
});

app.get("/api/services/:serviceId", async (req, res) => {
  const service = await storage.getServiceConfig(req.params.serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json(service);
});
```

**Frontend usage**:
```javascript
// client/index.html
async function generateMusic() {
  // Fetch service config
  const serviceConfig = await fetch('/api/services/music_generation').then(r => r.json());

  // Use dynamic values instead of hardcoded
  const maxAttempts = serviceConfig.maxTimeoutSeconds / (serviceConfig.pollIntervalMs / 1000);
  const pollInterval = serviceConfig.pollIntervalMs;

  console.log(`Max wait: ${serviceConfig.maxTimeoutSeconds}s`);
  console.log(`Typical time: ${serviceConfig.typicalTimeSeconds}-${serviceConfig.typicalTimeSecondsMax}s`);

  // Show user expected wait time
  showMessage(`Generating music... Typically takes ${serviceConfig.typicalTimeSeconds / 60}-${serviceConfig.typicalTimeSecondsMax / 60} minutes.`);

  // Poll with dynamic interval
  const pollInterval = setInterval(async () => {
    // ... polling logic ...
  }, serviceConfig.pollIntervalMs);
}
```

### 3. **Storage Layer: Add Helper Methods**

**Add to `db/storage.ts`** (or wherever your storage layer is):

```typescript
export class Storage {
  // ... existing methods ...

  async getServiceConfig(serviceId: string): Promise<ServiceRegistry | null> {
    const [service] = await db
      .select()
      .from(serviceRegistry)
      .where(eq(serviceRegistry.id, serviceId))
      .limit(1);

    return service || null;
  }

  async getAllActiveServices(): Promise<ServiceRegistry[]> {
    return await db
      .select()
      .from(serviceRegistry)
      .where(eq(serviceRegistry.isActive, 1));
  }

  async incrementServiceAttempts(serviceId: string): Promise<void> {
    await db
      .update(serviceRegistry)
      .set({
        totalAttempts: sql`${serviceRegistry.totalAttempts} + 1`,
        lastUpdated: new Date()
      })
      .where(eq(serviceRegistry.id, serviceId));
  }

  async incrementServiceSuccesses(serviceId: string): Promise<void> {
    await db
      .update(serviceRegistry)
      .set({
        totalSuccesses: sql`${serviceRegistry.totalSuccesses} + 1`,
        lastUpdated: new Date()
      })
      .where(eq(serviceRegistry.id, serviceId));

    // Recalculate success rate
    await this.recalculateSuccessRate(serviceId);
  }

  async incrementServiceFailures(serviceId: string): Promise<void> {
    await db
      .update(serviceRegistry)
      .set({
        totalFailures: sql`${serviceRegistry.totalFailures} + 1`,
        lastUpdated: new Date()
      })
      .where(eq(serviceRegistry.id, serviceId));

    await this.recalculateSuccessRate(serviceId);
  }

  async incrementServiceTimeouts(serviceId: string): Promise<void> {
    await db
      .update(serviceRegistry)
      .set({
        totalTimeouts: sql`${serviceRegistry.totalTimeouts} + 1`,
        lastUpdated: new Date()
      })
      .where(eq(serviceRegistry.id, serviceId));

    await this.recalculateSuccessRate(serviceId);
  }

  async incrementServiceRefunds(serviceId: string): Promise<void> {
    await db
      .update(serviceRegistry)
      .set({
        totalRefunds: sql`${serviceRegistry.totalRefunds} + 1`,
        lastUpdated: new Date()
      })
      .where(eq(serviceRegistry.id, serviceId));
  }

  private async recalculateSuccessRate(serviceId: string): Promise<void> {
    const service = await this.getServiceConfig(serviceId);
    if (!service || service.totalAttempts === 0) return;

    const successRate = Math.round((service.totalSuccesses / service.totalAttempts) * 100);

    await db
      .update(serviceRegistry)
      .set({ successRate })
      .where(eq(serviceRegistry.id, serviceId));
  }

  async updateServiceTimeout(serviceId: string, maxTimeoutSeconds: number): Promise<void> {
    await db
      .update(serviceRegistry)
      .set({
        maxTimeoutSeconds,
        lastUpdated: new Date()
      })
      .where(eq(serviceRegistry.id, serviceId));
  }

  async toggleServiceActive(serviceId: string, isActive: boolean): Promise<void> {
    await db
      .update(serviceRegistry)
      .set({
        isActive: isActive ? 1 : 0,
        lastUpdated: new Date()
      })
      .where(eq(serviceRegistry.id, serviceId));
  }
}
```

---

## 📈 Real-Time Analytics & Optimization

### Automatic Success Rate Calculation

Every time a service completes (success/failure/timeout), the success rate is automatically recalculated:

```
Success Rate = (total_successes / total_attempts) * 100
```

### Example Usage in Admin Dashboard

```javascript
// Admin can see real performance data
const musicService = await storage.getServiceConfig('music_generation');

console.log(`Music Generation Performance:`);
console.log(`- Success Rate: ${musicService.successRate}%`);
console.log(`- Total Attempts: ${musicService.totalAttempts}`);
console.log(`- Successes: ${musicService.totalSuccesses}`);
console.log(`- Failures: ${musicService.totalFailures}`);
console.log(`- Timeouts: ${musicService.totalTimeouts}`);
console.log(`- Refunds Issued: ${musicService.totalRefunds}`);

// If success rate drops below threshold, increase timeout
if (musicService.successRate < 85) {
  console.warn(`⚠️ Success rate low! Consider increasing timeout.`);
  await storage.updateServiceTimeout('music_generation', 420); // Increase to 7 minutes
}
```

---

## 🎨 Admin Dashboard Features (Future)

With the service registry in place, you can build an admin dashboard to:

### 1. **Monitor Service Health**
- Real-time success rates
- Recent timeout trends
- Provider uptime tracking
- Alert when success rate drops below threshold

### 2. **Adjust Service Settings**
- Update timeouts without code deploy
- Temporarily disable underperforming services
- A/B test different timeout values
- Adjust credit costs based on actual API costs

### 3. **Performance Analytics**
- Charts showing success rate over time
- Identify peak failure times
- Compare provider reliability
- ROI analysis (credits vs. API costs)

### 4. **User-Facing Status Page**
```javascript
// Public endpoint
app.get("/api/service-status", async (req, res) => {
  const services = await storage.getAllActiveServices();

  res.json(services.map(s => ({
    name: s.displayName,
    status: s.successRate >= 90 ? 'operational' :
            s.successRate >= 75 ? 'degraded' : 'major_outage',
    successRate: s.successRate,
    typicalTime: `${s.typicalTimeSeconds}-${s.typicalTimeSecondsMax}s`,
    lastUpdated: s.lastUpdated
  })));
});
```

---

## 🚀 Migration Steps

### Step 1: Run the Migration

```bash
# Apply the service registry schema
psql $DATABASE_URL < db/migrations/001_service_registry.sql
```

### Step 2: Verify Data

```sql
-- Check that services were seeded
SELECT id, display_name, max_timeout_seconds, success_rate
FROM service_registry
ORDER BY category, id;
```

### Step 3: Add Storage Methods

Add the helper methods shown above to your storage layer (`db/storage.ts`).

### Step 4: Update Backend Routes

Gradually replace hardcoded values with database lookups:

```javascript
// OLD:
const creditCost = 18; // Hardcoded

// NEW:
const serviceConfig = await storage.getServiceConfig('music_generation');
const creditCost = serviceConfig.creditCost;
```

### Step 5: Update Frontend

Create a service config cache in frontend:

```javascript
// Cache service configs on page load
const serviceConfigs = {};

async function loadServiceConfigs() {
  const services = await fetch('/api/services').then(r => r.json());
  services.forEach(s => {
    serviceConfigs[s.id] = s;
  });
}

// Use cached config
const musicConfig = serviceConfigs['music_generation'];
const maxAttempts = musicConfig.maxTimeoutSeconds / 2; // 2s poll interval
```

### Step 6: Track Service Metrics

Update generation endpoints to track metrics:

```javascript
// Music generation endpoint
app.post("/api/generate-music", async (req, res) => {
  const serviceId = 'music_generation';

  // Increment attempts
  await storage.incrementServiceAttempts(serviceId);

  try {
    // ... generation logic ...

    if (success) {
      await storage.incrementServiceSuccesses(serviceId);
      return res.json({ ... });
    } else {
      await storage.incrementServiceFailures(serviceId);
      return res.status(500).json({ ... });
    }
  } catch (error) {
    await storage.incrementServiceFailures(serviceId);
    throw error;
  }
});

// Refund endpoint
app.post("/api/music-refund/:taskId", async (req, res) => {
  // ... refund logic ...

  if (reason === 'timeout') {
    await storage.incrementServiceTimeouts('music_generation');
  }

  await storage.incrementServiceRefunds('music_generation');

  // ... rest of refund logic ...
});
```

---

## 📊 Benefits Summary

### For Developers:
✅ **Single source of truth** - No more hunting for hardcoded values
✅ **Easier maintenance** - Update timeout in DB, not 5 different files
✅ **Version control** - Service config changes tracked in DB
✅ **Testing** - Easy to test different timeout values

### For Operations:
✅ **No code deploys** - Adjust service settings via admin panel
✅ **Real-time monitoring** - See actual performance data
✅ **Quick response** - Disable underperforming services instantly
✅ **Performance optimization** - Data-driven timeout adjustments

### For Users:
✅ **Better UX** - Accurate wait time estimates
✅ **More reliable** - Timeouts adjusted based on real performance
✅ **Transparency** - See actual service success rates
✅ **Service status page** - Know when services are degraded

### For Business:
✅ **Cost tracking** - Real refund metrics
✅ **Provider comparison** - Which AI provider performs best?
✅ **SLA compliance** - Track uptime and reliability
✅ **Automatic TOS** - Generate service table from DB

---

## 🎯 Next Steps

1. ✅ **Schema created** (`shared/schema.ts`)
2. ✅ **Migration written** (`db/migrations/001_service_registry.sql`)
3. ⏳ **Run migration** (need to apply to database)
4. ⏳ **Add storage methods** (add helpers to storage layer)
5. ⏳ **Update backend** (replace hardcoded values with DB lookups)
6. ⏳ **Update frontend** (fetch and cache service configs)
7. ⏳ **Add tracking** (increment attempts/successes/failures)
8. ⏳ **Build admin dashboard** (future enhancement)

---

## 📝 Example Queries

### Get all services by category
```sql
SELECT * FROM service_registry
WHERE category = 'music' AND is_active = 1;
```

### Find underperforming services
```sql
SELECT id, display_name, success_rate, total_timeouts
FROM service_registry
WHERE success_rate < 85
ORDER BY success_rate ASC;
```

### Calculate refund rate
```sql
SELECT
  id,
  display_name,
  total_refunds,
  total_attempts,
  ROUND((total_refunds::float / NULLIF(total_attempts, 0)) * 100, 2) as refund_rate_percent
FROM service_registry
WHERE total_attempts > 0
ORDER BY refund_rate_percent DESC;
```

### Compare providers
```sql
SELECT
  provider,
  AVG(success_rate) as avg_success_rate,
  SUM(total_attempts) as total_attempts,
  SUM(total_refunds) as total_refunds
FROM service_registry
WHERE is_active = 1
GROUP BY provider
ORDER BY avg_success_rate DESC;
```

---

**Created by**: Claude Code
**Date**: October 31, 2025
**Status**: Schema created, migration ready, implementation pending
