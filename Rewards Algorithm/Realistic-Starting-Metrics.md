# Realistic Starting Metrics Algorithm

## Overview
New artist cards receive realistic starting metrics instead of zeros to create authentic music industry simulation. The algorithm generates believable baseline numbers that reflect how new bands actually perform in the real music industry.

## Algorithm Parameters

### Base Ranges
- **Physical Copies**: 50-250 base range → 12-250 final (minimum 12 for friends/family)
- **Digital Downloads**: 150-650 base range → 45-650 final (minimum 45)
- **Total Streams**: 800-2,800 base range → 250-2,800 final (minimum 250)

### Quality Scaling Factor
- **Confidence Range**: 0% - 100% (from audio analysis)
- **Quality Factor**: 0.7 - 1.3 (70% to 130% of base)
- **Formula**: `qualityFactor = 0.7 + (confidence / 100) * 0.6`

Higher confidence scores from audio analysis result in better starting metrics, reflecting higher production quality leading to better initial reception.

### Final Calculation
```
baseMetric = (baseRange + random) * genreMultiplier * qualityFactor
finalMetric = Math.max(baseMetric, minimum)
```

## Implementation Location
- **File**: `server/routes.ts`
- **Function**: `generateRealisticStartingMetrics(genre, confidence, audioMetrics)`
- **Called**: During artist card creation, before database save

## Industry Realism Hierarchy
1. **Streams** (highest) - Easy to generate through social sharing
2. **Digital Downloads** (middle) - Requires purchase intent
3. **Physical Copies** (lowest) - Most expensive, committed fans only

## Rationale
- Eliminates unrealistic "zero" starting values
- Creates believable progression to achievement milestones
- Reflects actual new artist performance patterns
- Maintains genre-specific market dynamics
- Quality-based scaling rewards better productions