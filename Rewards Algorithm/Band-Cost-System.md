# Band Cost System - Strategic Monetization

## Overview
Implemented a refined band cost system that balances user acquisition with revenue generation, creating natural upgrade incentives while maintaining fair progression.

## Free Band Limits (Updated)
- **Fan Tier (Free)**: 2 free bands
- **Artist Tier ($5.95)**: 5 free bands  
- **Record Label Tier ($19.95)**: 15 free bands
- **Mogul Tier ($49.50)**: Unlimited bands

## Additional Band Cost
- **Cost**: 500 credits per additional band
- **Applied**: When users exceed their tier's free limit
- **User Experience**: Clear messaging about cost and upgrade benefits

## Credit Deduction Process
1. User attempts to create band beyond free limit
2. System checks available credits (500 required)
3. If sufficient credits: Band creation proceeds, credits deducted
4. If insufficient credits: Show upgrade prompt and credit purchase options

## Upgrade Benefits System
When users upgrade subscription tiers:

### Band Allowance Reset
- **Non-Mogul Tiers**: Reset `bandGenerationCount` to 0, granting full new tier allowance
- **Mogul Tier**: Keep existing band count (unlimited anyway)
- **Example**: User with 10 bands upgrading from Artist (5 free) to Record Label (15 free) gets fresh 15 free bands

### Credit & Stat Benefits
- **Credits**: Keep higher of current credits or new tier initial amount
- **FAME**: Keep higher of current FAME or new tier initial amount  
- **Experience**: Keep higher of current experience or new tier initial amount
- **No Penalties**: Users never lose progress when upgrading

## User Experience Messages

### Beyond Free Limit (402 Status)
```json
{
  "error": "CREDITS_REQUIRED",
  "message": "You've used 5/5 free bands for Artist tier. Additional bands cost 500 credits each.",
  "requiresCredits": true,
  "creditCost": 500,
  "userCredits": 1200,
  "canAfford": true,
  "upgradeUrl": "/upgrade"
}
```

### Insufficient Credits (402 Status)
```json
{
  "error": "CREDITS_REQUIRED", 
  "message": "You've used 2/2 free bands for Fan tier. Additional bands cost 500 credits each.",
  "requiresCredits": true,
  "creditCost": 500,
  "userCredits": 100,
  "canAfford": false,
  "upgradeUrl": "/upgrade"
}
```

## Strategic Benefits

### For Users
- **Clear Progression**: Understand exact costs and benefits
- **Fair Upgrade Value**: Always get full new tier allowance
- **No Penalties**: Never lose existing progress when upgrading

### For Business
- **Upgrade Incentives**: Clear value proposition for higher tiers
- **Revenue Generation**: Additional band purchases via credits
- **User Retention**: Fair system encourages long-term engagement

## Technical Implementation
- **Function**: `checkSubscriptionLimit()` handles credit checking and messaging
- **Credit Deduction**: `storage.spendUserCredits()` safely deducts credits
- **Upgrade Benefits**: `applySubscriptionTierBenefits()` resets allowances and preserves progress

## Monitoring Points for Beta
- Track upgrade conversion rates when users hit limits
- Monitor average additional bands purchased per user
- Measure user satisfaction with upgrade value proposition
- Adjust credit costs based on user behavior patterns