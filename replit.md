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
- `users`: UUID, username, subscription plan (free/studio/creator/producer/mogul), credits, vocal preferences, Stripe data
- `uploadedAudio`: User-uploaded music files for RPG band creation
- `quests`: Social media quest tracking for bonus credits

**GhostMusician RPG Tables:**
- `bands`: Virtual artist/band profiles with FAME, streams, sales metrics, trading card URLs, member details
- `bandAchievements`: Gold/Platinum/Diamond record achievements
- `dailyGrowthLog`: Historical growth tracking for each band

Plan-based features, service credit costs, and RPG credit costs are centrally defined in `shared/schema.ts`.

### Authentication & Authorization

Replit Auth provides OIDC-based authentication, with user accounts automatically created on first login. Session management is handled by `express-session` and `connect-pg-simple`, storing sessions in PostgreSQL. An `isAuthenticated` middleware protects all API routes, ensuring only authenticated users can access resources.

### GhostMusician RPG System

**Concept:**
Users create virtual artists and bands, building a music industry empire with realistic metrics and gamified progression.

**Core Features:**
- **Band Creation** (15 credits): Create virtual artists with AI-generated profiles, backstories, and member details
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

**RPG Credit Costs:**
- Band Creation: 15 credits
- Marketing Campaign: 10 credits
- FAME Boost: 5 credits
- Collaboration: 8 credits

**Shared Credit System:**
All credits work across both AI media generation and RPG features. Users can:
- Generate AI music/images/videos with credits
- Create and manage virtual bands with the same credits
- Seamlessly switch between creative tools and RPG gameplay

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **KIE.ai SUNO API**: For AI music generation, accessed via a Webshare static proxy to manage IP whitelisting.
-   **ttapi.io Midjourney API**: Primary Midjourney provider delivering reliable results with consistent ~30-40s generation times. Available to Studio+ users with three speed modes: Fast (3 credits), Turbo (6 credits), and Relax (3 credits). Generates 4 high-quality Midjourney v7 image variants per request. Features comprehensive timeout + auto-refund system with automatic credit refunds for metered users.
-   **OpenAI API**: For DALL-E 3 album art generation (Panel 1) and image generation (Panel 3 for Studio+ users).
-   **Fal.ai Nano Banana**: For fast image generation in Panel 3, available to all users including Free tier.
-   **Fal.ai Seedance**: For AI music video generation, supporting text-to-video, image-to-video, and reference-to-video modes with Lite/Pro variants. Features quality-based credit pricing and specific restrictions for free accounts.
-   **Replit AI Integrations**: For OpenAI chat functionalities.
-   **Google Fonts**: Used for the Inter font family.

### Key Libraries & Tools

-   **UI Components**: Radix UI primitives and Tailwind CSS for styling, following a Shadcn UI-like approach for customization.
-   **Form Handling**: React Hook Form with Zod validation.
-   **Date Utilities**: `date-fns`.
-   **Icons**: Lucide React.
-   **Development**: Vite (frontend build/dev), esbuild (backend bundler), TypeScript, Drizzle Kit.