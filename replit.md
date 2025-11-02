# AetherWave Studio - Unified AI Music, Media & RPG Platform

## Overview

AetherWave Studio is a comprehensive creative platform that unifies AI-powered music, image, and video generation with an immersive music industry simulation RPG called GhostMusician. The platform aims to provide professional-grade creative tools with gamified progression, leveraging AI for various media types and offering a robust RPG experience where users build virtual music empires. A key feature is a unified 5-tier monetization model (Free to Mogul) with a shared credit system powering both AI media generation and RPG gameplay actions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is a vanilla JavaScript SPA built with HTML and inline CSS, served by Vite. It features a dark-optimized, mobile-responsive design with a pink/purple color palette, custom AetherWave branding, and animated gradient backgrounds. Key components include real-time credit display, music model selection, an interactive album art style modal, "Album Art to Video" conversion, a premium audio player, multiple image engine selections (Nano Banana, DALL-E 3, Midjourney) with aspect ratio and speed controls, and a user profile modal.

### Backend

The backend is an Express.js application written in TypeScript (Node.js, ESM) with a RESTful API. Data is stored in PostgreSQL (Neon serverless) using Drizzle ORM. Authentication is handled via Replit Auth (OIDC) with a PostgreSQL session store. A security-first credit deduction flow ensures credits are validated before external API calls, with unlimited plans bypassing checks. An interface-based storage abstraction manages user data.

### Data Storage

PostgreSQL (Neon) with Drizzle ORM stores user data, RPG-specific information, and marketplace details.

**Core Tables:** `users` (UUID, plan, credits, freeBandGenerations, daily login), `uploadedAudio`, `quests`, `feedEvents`.

**GhostMusician RPG Tables:** `bands` (FAME, streams, sales), `bandAchievements`, `dailyGrowthLog`, `ownedCardDesigns`.

**Unified Marketplace System:** `products` and `userInventory` tables support an e-commerce system for 19 initial products across Card Themes, Premium Features (Managers, Producers), and Collectibles. Purchases deduct credits and update user inventory.

### Authentication & Authorization

Replit Auth provides OIDC-based authentication. `express-session` and `connect-pg-simple` manage sessions in PostgreSQL. An `isAuthenticated` middleware protects API routes. Development authentication normalizes `req.user.id` for consistent behavior.

### GhostMusician RPG System

Users create virtual artists/bands, manage a music industry empire, and progress through gamified mechanics. All users receive 3 free band generations.

**Core Features:**
- **Band Creation**: Free for the first 3, then 15 credits each. AI generates profiles and backstories.
- **Daily Growth Mechanics**: Apply daily growth (24-hour cooldown) to increase FAME, streams, and sales.
- **FAME System**: A 1-100 scale affecting growth and chart position.
- **Metrics Tracking**: Physical/digital sales, streams, chart position.
- **Achievement System**: Gold, Platinum, Diamond records with FAME bonuses.
- **Tier-Based Multipliers**: Growth rates scale with subscription plan (1.0x Free to 3.0x Mogul).
- **Band Limits**: Tier-based limits on the number of active bands.
- **Shared Credit System**: Credits are unified for both AI media generation and RPG features.
- **Daily Login Rewards**: Free tier users receive 10 credits daily (capped at 50 total), with streak tracking.
- **Activity Feed**: Real-time global feed of user activities (band creation, growth, achievements, releases).

### Seamless Loop Creator

A dedicated video tool at `/seamless-loop-creator/` for generating perfect looping videos with three modes:

1.  **Image-to-Loop Mode (Luma Ray 2 Flash)**: Upload an image, provide a motion prompt, and AI animates it into a 5s or 9s seamless loop (2 credits/second).
2.  **Upload Video Mode (Fal.ai Seedance Lite)**: Convert existing videos to seamless loops (2 credits/second × original duration). Handles various input formats.
3.  **Text-to-Loop Mode (Luma Ray 2 Flash)**: Generate 5s or 9s seamless loops from text prompts only (2 credits/second).

**Technical Implementation:** Utilizes Luma Ray 2 Flash for native looping (no seam) and Fal.ai Seedance Lite for flexible video uploads. FFmpeg ensures `faststart` for browser streaming. ImgBB is used for temporary image hosting. Credit deduction occurs after validation with automatic refunds for failures.

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL.
-   **KIE.ai SUNO API**: AI music generation via Webshare proxy.
-   **ttapi.io Midjourney API**: High-quality AI image generation (Studio+ users), with Fast/Turbo/Relax speed modes and auto-refunds.
-   **OpenAI API**: DALL-E 3 for album art and general image generation (Studio+).
-   **Fal.ai Nano Banana**: Fast image generation (all users).
-   **Luma Ray 2 Flash**: Native seamless loop video generation for text-to-loop and image-to-loop modes (5s/9s durations, no concatenation seam).
-   **Fal.ai Seedance Lite**: AI seamless loop video generation (upload mode only, supports arbitrary durations).
-   **Fal.ai Seedance**: AI music video generation.
-   **Replit AI Integrations**: OpenAI chat.
-   **Google Fonts**: Inter font family.
-   **ImgBB API**: Temporary image hosting.

### Key Libraries & Tools

-   **UI Components**: Radix UI primitives, Tailwind CSS (Shadcn UI-like approach).
-   **Form Handling**: React Hook Form with Zod validation.
-   **Date Utilities**: `date-fns`.
-   **Icons**: Lucide React.
-   **Development**: Vite, esbuild, TypeScript, Drizzle Kit.