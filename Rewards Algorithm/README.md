# Rewards Algorithm Documentation

## Quick Reference for Beta Adjustments

### 📁 Documentation Files
- **`Realistic-Starting-Metrics.md`** - Core algorithm overview and implementation
- **`Genre-Multipliers.md`** - Industry-based genre scaling factors
- **`Quality-Scaling-System.md`** - Confidence-based quality adjustments

### 🎯 Key Numbers to Monitor
- **Genre Multipliers**: Hip Hop (1.8x) to Classical (0.4x)
- **Quality Range**: 70%-130% based on audio confidence
- **Starting Ranges**: Physical (12-250), Digital (45-650), Streams (250-2,800)

### 🔧 Beta Adjustment Points
1. **Genre Performance** - Track which genres hit milestones too fast/slow
2. **Quality Impact** - Monitor if confidence scaling is too aggressive
3. **Baseline Metrics** - Adjust minimum values if progression feels off
4. **Achievement Balance** - Ensure Gold (500K), Platinum (2M), Diamond (10M) remain achievable

### 📍 Code Locations
- **Implementation**: `server/routes.ts` → `generateRealisticStartingMetrics()`
- **Called**: During artist card creation before database save
- **Database**: `physical_copies`, `digital_downloads`, `total_streams` columns

### 🎵 Industry Hierarchy Maintained
1. **Streams** (highest) - Easy social sharing
2. **Digital Downloads** (middle) - Purchase intent required  
3. **Physical Copies** (lowest) - Most committed fans

---
*Created: August 27, 2025*  
*Algorithm Version: 1.0 (Beta Ready)*