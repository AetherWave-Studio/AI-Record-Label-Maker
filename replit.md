# AetherWave Studio - Unified AI Music, Media & RPG Platform

## Overview

AetherWave Studio is a comprehensive creative platform combining AI-powered music and media creation with an immersive music industry simulation RPG (GhostMusician). The platform leverages AI for music generation (via SUNO through KIE.ai API), image generation with ttapi.io Midjourney, DALL-E 3, and Fal.ai Nano Banana, and AI video generation with Fal.ai Seedance. The integrated GhostMusician RPG allows users to create virtual artists/bands, build a record label empire, track metrics (FAME, streams, sales), and experience daily growth mechanics. The platform features a unified 5-tier monetization model (Free/$0, Studio/$9.99, Creator/$19.99, Producer/$49, Mogul/$99) with a shared credit system that powers both AI media generation and RPG gameplay actions. The application aims to provide a professional-grade creative tool experience with gamified progression, drawing inspiration from platforms like Runway ML, Midjourney, ElevenLabs, and music industry tycoon games.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a standalone HTML single-page application (`client/index.html`) built with vanilla JavaScript and inline CSS. It utilizes Vite for serving static assets and development. The design system features a dark-optimized interface with animated gradient backgrounds, custom AetherWave branding, and a pink/purple color palette. It is fully mobile-responsive across desktop, tablet, and mobile breakpoints, using a three-panel layout (Music | Hero/Credits | Chat/Media) on desktop and a single-column layout with a bottom navigation bar on mobile. Key features include real-time credit display, music model selection with plan-based restrictions, an interactive album art style selection modal, an "Album Art to Video" conversion feature with duration options, a premium audio player, image engine selector (Nano Banana for Free+, DALL-E 3 and Midjourney for Studio+) with aspect ratio control (1:1, 16:9, 9:16, 4:3, 3:4) and Midjourney speed selector (Fast/Turbo) in Panel 3, and a user profile modal displaying account details, subscription plan, and credit balance.

### Backend Architecture

The backend is an Express.js application written in TypeScript, running on Node.js with ESM modules. It uses a RESTful API design with JSON request/response formats. Data storage is handled by PostgreSQL (Neon serverless) with Drizzle ORM for type-safe schema management and migrations. Authentication is managed via Replit Auth (OIDC) with a PostgreSQL session store. A core design principle is a security-first credit deduction flow, where credits are validated and deducted before external API calls are made, with unlimited plans bypassing credit checks. An interface-based storage abstraction manages user data and credit operations.

### Data Storage

The project utilizes a serverless PostgreSQL database hosted on Neon, accessed via Drizzle ORM. The schema is defined in `shared/schema.ts` and managed with Drizzle Kit. 

**Core Tables:**
- `users`: UUID, username, subscription plan (free/studio/creator/producer/mogul), credits, freeBandGenerations (3 free bands for all users), vocal preferences, Stripe data, daily login tracking (lastLoginAt, dailyLoginStreak)
- `uploadedAudio`: User-uploaded music files for RPG band creation
- `quests`: Social media quest tracking for bonus credits
- `feedEvents`: Platform activity feed tracking band creations, daily growth, achievements, rank changes, and new releases

**GhostMusician RPG Tables:**
- `bands`: Virtual artist/band profiles with FAME, streams, sales metrics, trading card URLs, member details, equippedCardDesign
- `bandAchievements`: Gold/Platinum/Diamond record achievements
- `dailyGrowthLog`: Historical growth tracking for each band
- `ownedCardDesigns`: User's purchased card designs (8 total designs available)

**Unified Marketplace System:**
- Full e-commerce system with `products` and `userInventory` tables
- 19 initial products seeded across multiple categories:
  - **Card Themes** (8): Trading card designs from free (Ghosts Online) to legendary (Gold Anniversary, 2000 credits)
  - **Premium Features** (6): Managers (boost sales 20-100%) and Producers (boost FAME 15-50%)
  - **Collectibles** (5): Vintage instruments (guitars, drums, synths) with rarity tiers
- Accessible via unified `/store` route (replaces standalone card-shop page)
- Secure purchase flow: validate user/product → check credits → deduct credits → add to inventory → sync card designs
- Manager/Producer items are active inventory items that apply multipliers during band daily growth
- Card theme purchases automatically sync to `ownedCardDesigns` table for backward compatibility
- Stackable purchases increase quantity in inventory
- Product catalog supports filtering by category, rarity tiers, and stock management

**Card Design Integration:**
- 8 unique trading card visual styles generated by DALL-E 3  
- Card themes integrated into marketplace as purchasable products
- Designs can be equipped to bands, changing the visual style of their trading cards
- DALL-E generates complete trading card images (not CSS styling) using design-specific prompts

Plan-based features, service credit costs, and RPG credit costs are centrally defined in `shared/schema.ts`.

### Authentication & Authorization

Replit Auth provides OIDC-based authentication, with user accounts automatically created on first login. Session management is handled by `express-session` and `connect-pg-simple`, storing sessions in PostgreSQL. An `isAuthenticated` middleware protects all API routes, ensuring only authenticated users can access resources.

**Development Authentication:**
- Dev auth middleware (`isDevAuthenticated`) normalizes user session to ensure `req.user.id` is always available
- Extracts user ID from `devUser.id`, `devUser.claims.sub`, or `devUser.userinfo.sub` (handles OIDC format variations)
- This normalization ensures consistent behavior between development and production auth flows

### GhostMusician RPG System

**Concept:**
Users create virtual artists and bands, building a music industry empire with realistic metrics and gamified progression.

**Unified Profile System:**
All users, whether they came for AI media generation or the RPG game, receive a unified profile on the GhostMusician platform with 3 free band generations. This ensures everyone can experience the RPG without spending credits initially.

**Core Features:**
- **Band Creation**: First 3 bands are FREE for all users. Additional bands cost 15 credits each. Create virtual artists with AI-generated profiles, backstories, and member details
- **Daily Growth Mechanics**: Apply daily growth to bands (24-hour cooldown) to increase FAME, streams, and sales
- **FAME System** (1-100 scale): Primary stat affecting growth rates and chart position
- **Metrics Tracking**: Physical copies, digital downloads, total streams, chart position (0-100)
- **Achievement System**: Gold (500K sales), Platinum (2M sales), Diamond (10M sales) - each provides FAME bonuses
- **Tier-Based Multipliers**: Growth rates scale with subscription tier (1.0x Free → 3.0x Mogul)

**Band Limits by Tier:**
- Free: 2 bands
- Studio: 7 bands
- Creator: 17 bands
- Producer/Mogul: Unlimited bands

**Free Band Generation System:**
- Every user gets **3 free band generations** (no credit cost)
- Free bands are tracked separately from credits in the `freeBandGenerations` column
- After using all 3 free generations, bands cost 15 credits each
- If band creation fails, free generations are automatically refunded
- Displayed in user profile modal and throughout the GhostMusician interface

**RPG Credit Costs (After Free Generations):**
- Band Creation: 15 credits (first 3 are FREE)
- Marketing Campaign: 10 credits
- FAME Boost: 5 credits
- Collaboration: 8 credits

**Shared Credit System:**
All credits work across both AI media generation and RPG features. Users can:
- Generate AI music/images/videos with credits
- Create and manage virtual bands with the same credits (after using 3 free generations)
- Seamlessly switch between creative tools and RPG gameplay

**Daily Login Rewards:**
- Free tier users receive **10 credits** on first login each day (capped at 50 total credits)
- Streak tracking maintains consecutive day counter for future bonus features
- Credits automatically added to account, with toast notification on first daily login
- System prevents duplicate claims on same calendar day

**Activity Feed:**
- Real-time platform feed showing all user activities: band creation, daily growth, achievements, rank changes, releases
- Feed events include band name, genre, metrics (FAME, streams), and timestamps
- Authenticated users see global feed with newest events first
- Feed integrated into home page as primary landing experience
- Links to band detail pages for deeper exploration

### Seamless Loop Creator

**Location**: `/seamless-loop-creator/`

A standalone video tool for creating perfect looping videos using AI-powered generation. **Complete suite with THREE modes** - nobody else offers this combination.

**Three Modes:**

1. **Image-to-Loop Mode** (NEW! - Default)
   - Upload a still image and describe the motion you want
   - AI animates the image into a seamless looping video
   - Accepts: JPG, PNG, WebP
   - Required: Motion prompt (e.g., "camera slowly orbits 360 degrees around the subject")
   - Duration options: 4s, 6s, 8s, 10s
   - Algorithm: Upload image → generate first half with user prompt → extract last frame → generate second half (return to start) → concatenate
   - Cost: 2 credits/second (e.g., 16 credits for 8s loop)
   - **Key Feature**: User-provided motion prompt guides both AI generation calls for dynamic animation

2. **Upload Video Mode**
   - Convert existing videos to seamless loops
   - Accepts: MP4, WebM, QuickTime, AVI (auto-transcoded to H.264 MP4)
   - Algorithm: Transcode to H.264 → extract frames → generate return journey → concatenate
   - Cost: 2 credits/second × uploaded video duration

3. **Text-to-Loop Mode**
   - Generate seamless loops from text prompts only
   - Duration options: 6s, 8s, 10s
   - Algorithm: Generate first half → extract first/last frames → generate second half from last frame → concatenate
   - Cost: 2 credits/second (e.g., 16 credits for 8s loop)

**Technical Implementation:**
- **AI Model**: Fal.ai Seedance Lite (chosen for frame-to-frame dependability, supports both text-to-video and image-to-video modes)
- **Video Processing**: FFmpeg (frame extraction, transcoding, concatenation)
- **Frame Storage**: ImgBB (temporary frame hosting for AI reference, also used for user-uploaded images in Image-to-Loop mode)
- **Download System**: Secure temp file download with auto-cleanup
- **Credit System**: Upfront deduction with automatic refunds on failure
- **Cross-Format Support**: Auto-transcoding ensures successful concatenation regardless of input format
- **Buffer-to-Base64**: User-uploaded images converted to base64 before ImgBB upload

**Backend Endpoints:**
- `POST /api/video/generate-seamless-loop-image` - Image-to-loop generation (NEW!)
- `POST /api/video/generate-seamless-loop` - Text-to-loop generation
- `POST /api/video/generate-seamless-loop-upload` - Upload-based loop creation
- `GET /api/video/download-temp/:filename` - Secure video download with cleanup

**Security Features:**
- MIME type validation (video formats only)
- File size limits (100MB max)
- Filename pattern validation for downloads
- Automatic cleanup of temporary files

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **KIE.ai SUNO API**: For AI music generation, accessed via a Webshare static proxy to manage IP whitelisting.
-   **ttapi.io Midjourney API**: Primary Midjourney provider delivering reliable results with consistent ~30-40s generation times. Available to Studio+ users with three speed modes: Fast (3 credits), Turbo (6 credits), and Relax (3 credits). Generates 4 high-quality Midjourney v7 image variants per request. Features comprehensive timeout + auto-refund system with automatic credit refunds for metered users.
-   **OpenAI API**: For DALL-E 3 album art generation (Panel 1) and image generation (Panel 3 for Studio+ users).
-   **Fal.ai Nano Banana**: For fast image generation in Panel 3, available to all users including Free tier.
-   **Fal.ai Seedance Lite**: For AI seamless loop video generation with text-to-video and image-to-video modes. Used in Seamless Loop Creator at 2 credits/second pricing.
-   **Fal.ai Seedance**: For AI music video generation, supporting text-to-video, image-to-video, and reference-to-video modes with Lite/Pro variants. Features quality-based credit pricing and specific restrictions for free accounts.
-   **Replit AI Integrations**: For OpenAI chat functionalities.
-   **Google Fonts**: Used for the Inter font family.
-   **ImgBB API**: For temporary frame image hosting during seamless loop generation.

### Key Libraries & Tools

-   **UI Components**: Radix UI primitives and Tailwind CSS for styling, following a Shadcn UI-like approach for customization.
-   **Form Handling**: React Hook Form with Zod validation.
-   **Date Utilities**: `date-fns`.
-   **Icons**: Lucide React.
-   **Development**: Vite (frontend build/dev), esbuild (backend bundler), TypeScript, Drizzle Kit.