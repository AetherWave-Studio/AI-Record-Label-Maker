# Quality Scaling System - Confidence-Based Metrics

## System Overview
Audio analysis confidence scores directly influence starting metrics, simulating how production quality affects initial market reception.

## Confidence Score Mapping
| Confidence | Quality Factor | Result |
|------------|----------------|---------|
| 0%         | 0.70          | 70% of base |
| 25%        | 0.85          | 85% of base |
| 50%        | 1.00          | 100% of base |
| 75%        | 1.15          | 115% of base |
| 100%       | 1.30          | 130% of base |

## Formula
```javascript
qualityFactor = 0.7 + (confidence / 100) * 0.6
```

## Range Justification
- **Minimum (0.7)**: Even poor-quality music gets some baseline reception
- **Maximum (1.3)**: High-quality productions get significant boost but not extreme
- **Scaling (0.6 range)**: 60% variation provides meaningful differentiation

## Real-World Parallels
- **Low Confidence (0-30%)**: Bedroom recordings, demo quality
- **Medium Confidence (30-70%)**: Semi-professional, good home studio
- **High Confidence (70-100%)**: Professional production, studio quality

## Implementation Details
- **Source**: Audio analysis confidence percentage
- **Applied to**: All three metrics (physical, digital, streams)
- **Calculation Order**: Base → Genre Multiplier → Quality Factor → Minimum Check

## Beta Monitoring Points
- Track correlation between confidence scores and user engagement
- Monitor if quality scaling creates too much variance in starting metrics
- Adjust range (0.6) if needed to balance realistic variance vs. fairness
- Consider separate quality factors for different metric types

## Example Calculations
**Hip Hop track, 85% confidence:**
- Genre Multiplier: 1.8x
- Quality Factor: 0.7 + (85/100) * 0.6 = 1.21
- Base Streams: 800-2,800 → ~1,800 average
- Final: 1,800 * 1.8 * 1.21 = ~3,920 streams (capped at reasonable max)

**Classical track, 45% confidence:**
- Genre Multiplier: 0.4x  
- Quality Factor: 0.7 + (45/100) * 0.6 = 0.97
- Base Streams: 800-2,800 → ~1,800 average
- Final: 1,800 * 0.4 * 0.97 = ~698 streams