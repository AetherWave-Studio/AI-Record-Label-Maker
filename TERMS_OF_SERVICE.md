# AetherWave Studio - Terms of Service

**Last Updated: October 31, 2025**

## 1. Service Reliability & Automatic Refund Policy

### 1.1 Our Commitment to Transparency

AetherWave Studio believes in complete transparency about AI service performance. We provide realistic timeframes and automatically refund credits when technical issues occur on our end or with our AI provider partners.

### 1.2 Service Performance Standards

The following table outlines typical generation times, maximum timeout thresholds, and our automatic refund policy for each service:

| Service          | Typical Time | Max Timeout | Auto-Refund | Success Rate |
|------------------|--------------|-------------|-------------|--------------|
| Music Generation (SUNO) | 2-4 min | 360s (6 min) | ✅ Yes | 95% |
| Image Generation (Nano Banana) | 10-20s | 60s | ✅ Yes | 97% |
| Image Generation (DALL-E 3) | 15-30s | 60s | ✅ Yes | 96% |
| Album Art | 15-30s | 60s | ✅ Yes | 96% |
| Video (Seedance Lite) | 30-90s | 180s (3 min) | ✅ Yes | 92% |
| Video (Seedance Pro) | 60-180s | 300s (5 min) | ✅ Yes | 90% |
| Video (SORA 2) | 120-300s | 600s (10 min) | ✅ Yes | 88% |
| Video (VEO 3) | 180-420s | 600s (10 min) | ✅ Yes | 85% |
| Midjourney Turbo | 15-40s | 120s (2 min) | ✅ Yes | 89% |
| Midjourney Fast | 30-60s | 180s (3 min) | ✅ Yes | 82% |
| Midjourney Relax | 90-180s | 300s (5 min) | ✅ Yes | 80% |

### 1.3 Automatic Refund Triggers

You will **automatically** receive a full credit refund when:

✅ **Service Timeouts** - Generation exceeds the maximum timeout listed above
✅ **API Provider Outages** - Third-party AI service is down or unavailable
✅ **Technical Failures** - Server errors or processing failures on our end
✅ **Generation Errors** - AI returns error status (failed, blocked content, etc.)
✅ **Network Issues** - Lost connection during generation process

### 1.4 No Refund Scenarios

Credits will **NOT** be refunded when:

❌ **User Cancellation** - You voluntarily cancel a generation in progress
❌ **Invalid Prompts** - Content violates our acceptable use policy
❌ **Inappropriate Content** - Requests filtered by AI safety systems
❌ **Account Violations** - Account suspended for policy violations
❌ **Successful Completion** - Generation completed successfully

### 1.5 Refund Processing

- **Speed**: Credits refunded automatically within 5 seconds of failure detection
- **Notification**: No manual intervention required
- **Balance Update**: Your credit balance reflects immediately in the UI
- **Email Alerts**: Automatic email notification for refunds over 50 credits
- **Unlimited Plans**: Users on unlimited plans receive confirmation but no credit deduction/refund

### 1.6 Failure Detection Process

Our system uses intelligent failure detection to ensure fair and accurate refunds:

1. **Real Failures Only**: We verify with the AI provider that the task truly failed before refunding
2. **Smart Timeout Detection**: If polling reaches maximum timeout while task is still "PENDING" with no progress, we treat it as a stuck task
3. **Explicit Error Detection**: Provider returns explicit failure status codes (FAILED, ERROR, etc.)
4. **Final Status Check**: Before refunding on timeout, we make one final status check to confirm the task didn't complete in the final seconds

**Example**: Music generation typically completes in 2-4 minutes. Our timeout is set at 6 minutes (3x buffer). If after 6 minutes the task is still stuck in "PENDING" status with no progress indicators (not TEXT_SUCCESS or FIRST_SUCCESS), we treat it as a failed task and automatically refund your credits.

## 2. Credit System

### 2.1 Credit Purchases & Usage

- Credits are purchased through your subscription plan or one-time purchases
- Credits are consumed when you initiate an AI generation request
- Credits are deducted **immediately** when you click "Generate"
- If generation fails, credits are **automatically refunded** (see Section 1)

### 2.2 Credit Expiration

- Free tier credits reset daily at midnight UTC
- Purchased credits do not expire
- Subscription plan credits reset monthly on your billing date
- Unused credits do not roll over (except purchased credits)

### 2.3 Unlimited Plans

- "All Access" and similar unlimited plans have no credit limits for included services
- Unlimited plans still show refund notifications for transparency
- No actual credit deduction/refund occurs for unlimited plan users

## 3. Privacy & Data

### 3.1 Generated Content

- You own all content you generate through AetherWave Studio
- We do not claim ownership of your generated music, images, or videos
- We may temporarily store generated content for delivery purposes
- Content is automatically deleted after 30 days unless saved to your account

### 3.2 AI Provider Data Sharing

- Your prompts and inputs are sent to third-party AI providers (OpenAI, KIE.ai, Fal.ai, etc.)
- Each provider has their own privacy policy and data retention practices
- We recommend not including personal information in prompts
- By using our services, you acknowledge this data sharing is necessary for generation

## 4. Acceptable Use Policy

### 4.1 Prohibited Content

You may not use AetherWave Studio to generate:

- Illegal content under US or international law
- Content that violates intellectual property rights
- Deepfakes or misleading content of real individuals without consent
- Content designed to harass, threaten, or harm others
- Sexually explicit content involving minors
- Content promoting violence or terrorism

### 4.2 Enforcement

- First violation: Warning and content removal
- Second violation: Temporary account suspension (7 days)
- Third violation: Permanent account termination without refund
- Severe violations: Immediate permanent ban

## 5. Service Availability

### 5.1 Uptime Commitment

- We strive for 99% uptime for core platform features
- AI generation services depend on third-party providers and may have lower availability
- We are not liable for third-party AI provider downtime
- Automatic refunds compensate for technical failures (see Section 1)

### 5.2 Scheduled Maintenance

- Planned maintenance will be announced 24 hours in advance
- Maintenance typically occurs during low-traffic hours (2-6 AM UTC)
- Critical security patches may be applied with shorter notice

## 6. Billing & Subscriptions

### 6.1 Subscription Billing

- Subscriptions are billed monthly or annually based on your plan
- Automatic renewal unless cancelled before billing date
- No partial refunds for cancelled subscriptions
- Access continues until end of current billing period after cancellation

### 6.2 Payment Methods

- We accept credit cards, debit cards, and PayPal
- Payment processing handled securely through Stripe
- Failed payments result in account downgrade to free tier after 3 days

## 7. Disclaimer of Warranties

### 7.1 AI-Generated Content Quality

- AI-generated content quality varies by model and input
- We do not guarantee specific quality outcomes
- "Success rate" percentages are estimates based on historical data
- You are responsible for reviewing and validating generated content

### 7.2 Service "As-Is"

- Services provided "as-is" without warranties of any kind
- We do not guarantee uninterrupted or error-free service
- We reserve the right to modify or discontinue services with notice

## 8. Limitation of Liability

- Our total liability is limited to the amount you paid in the last 12 months
- We are not liable for indirect, incidental, or consequential damages
- This includes lost profits, data loss, or business interruption
- Automatic credit refunds (Section 1) are your exclusive remedy for technical failures

## 9. Changes to Terms

### 9.1 Modification Rights

- We may update these Terms at any time
- Material changes will be announced via email and in-app notification
- Continued use after changes constitutes acceptance
- You may cancel your subscription if you disagree with changes

### 9.2 Notification Period

- 30 days notice for material changes affecting billing or refund policies
- 7 days notice for minor clarifications or additions
- Immediate effect for legal compliance or security updates

## 10. Contact & Support

### 10.1 Customer Support

- Email: support@aetherwavestudio.com
- Response time: Within 24 hours for general inquiries
- Priority support for paying subscribers

### 10.2 Refund Inquiries

- Automatic refunds process immediately (see Section 1)
- Manual refund requests: support@aetherwavestudio.com
- Response within 48 hours for refund disputes

## 11. Governing Law

These Terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.

---

**By using AetherWave Studio, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.**

**Questions?** Contact us at legal@aetherwavestudio.com
