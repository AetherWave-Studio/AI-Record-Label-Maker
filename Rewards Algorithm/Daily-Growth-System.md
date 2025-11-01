# Daily Growth System Implementation (Grok's Algorithm)

## Overview
Implemented Grok's sophisticated FAME-driven daily growth system that transforms static artist cards into dynamic, evolving careers. Each band grows daily based on their current FAME score, subscription tier, and milestone achievements.

## Core Mechanics

### FAME Growth Per Subscription Tier (Daily)
- **Fan**: +1.0 FAME per day
- **Artist**: +1.5 FAME per day  
- **Record Label**: +2.0 FAME per day
- **Mogul**: +2.5 FAME per day (matches Grok's specification)

### Sales Growth Formula (Per FAME Point Daily)
- **Streams**: 20 per FAME point (highest growth)
- **Digital Downloads**: 1 per FAME point (moderate growth)  
- **Physical Copies**: 0.1 per FAME point (slowest growth)

### Milestone FAME Boosts (Applied to Daily Growth)
- **Gold (500K+ total sales)**: +5% FAME boost
- **Platinum (2M+ total sales)**: +25% FAME boost  
- **Diamond (10M+ total sales)**: +45% FAME boost

### Randomness Factor
- **±20% variance** applied to all growth calculations
- Simulates "life's unpredictability" per Grok's design
- Range: 0.8x to 1.2x of calculated growth

## Example Growth Calculation

**Mogul-tier band with 35 FAME, Gold milestone:**
1. **Base FAME Growth**: 2.5 (Mogul tier)
2. **Milestone Boost**: 2.5 × 1.05 = 2.625 (Gold +5%)
3. **Daily Sales Growth**:
   - Streams: 35 × 20 = 700 base → 560-840 (±20% random)
   - Digital: 35 × 1 = 35 base → 28-42 (±20% random)
   - Physical: 35 × 0.1 = 3.5 base → 3-4 (±20% random)

## Database Schema Additions
```typescript
// Added to artistCards table
currentFame: integer("current_fame").default(5), // Band's FAME score
lastDailyUpdate: timestamp("last_daily_update").default(sql`now()`),
dailyGrowthStreak: integer("daily_growth_streak").default(0),
```

## API Endpoint
- **Route**: `POST /api/daily-growth/:cardId`
- **Protection**: 24-hour cooldown per band
- **Authentication**: Required (user must own the band)
- **Response**: Growth details and updated metrics

## Implementation Benefits
- **Realistic Progression**: 4-year journey to Diamond (vs 219 years without boosts)
- **Subscription Value**: Higher tiers get meaningful daily growth advantages
- **Achievement Rewards**: Milestone bonuses create progression motivation
- **Unpredictability**: Random variance keeps growth interesting
- **Individual Journeys**: Each band progresses independently

## Conservative Starting Values (Updated)
Per Grok's recommendations:
- **Physical**: 10-15 copies (friends/family)
- **Digital**: 50-75 downloads (early supporters)  
- **Streams**: 100-150 plays (initial discovery)

This creates a longer, more engaging progression curve where achieving Gold (500K) feels like a genuine accomplishment rather than a quick milestone.