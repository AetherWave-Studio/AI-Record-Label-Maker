# AetherWave Studio - AI Music & Media Generation Platform

## Overview

AetherWave Studio is a professional-grade creative platform for AI-powered music, image, and video generation. The platform provides cutting-edge creative tools with a unified 5-tier monetization model (Free to Mogul) and a shared credit system powering all AI media generation features. Ghost Musician has been moved to a separate repository and is no longer part of this codebase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is a React SPA built with TypeScript, Wouter for routing, and Shadcn UI components, served by Vite. It features a dark-optimized, mobile-responsive design with a pink/purple color palette and custom AetherWave branding. The platform includes 4 core pages:

1. **Buy Credits** (`/buy-credits`) - One-time credit packages and monthly subscription tiers
2. **Card Shop** (`/card-shop`) - Marketplace for premium items and collectibles  
3. **Video Generation** (`/video-generation`) - Seamless Loop Creator with 3 modes (image-to-loop, upload-video, text-to-loop)
4. **Channels** (`/channels`) - Discovery feed for creative content

Key UI components include UserNavigation with real-time credit display, useAuth hook for authentication state, and Shadcn UI primitives (Button, Card, Avatar, Badge, Tabs, etc.).

### Backend

The backend is an Express.js application written in TypeScript (Node.js, ESM) with a RESTful API. Data is stored in PostgreSQL (Neon serverless) using Drizzle ORM. Authentication is handled via Replit Auth (OIDC) with a PostgreSQL session store. A security-first credit deduction flow ensures credits are validated before external API calls, with unlimited plans bypassing checks. An interface-based storage abstraction manages user data.

### Data Storage

PostgreSQL (Neon) with Drizzle ORM stores user data and marketplace information.

**Core Tables:**
- `users` - User profiles with subscription plan, credits, welcome bonus, and Stripe integration
- `products` - Marketplace items (Card Themes, Premium Features, Collectibles)
- `userInventory` - User-purchased items

The marketplace system supports an e-commerce platform where purchases deduct credits and update user inventory.

### Authentication & Authorization

Replit Auth provides OIDC-based authentication. `express-session` and `connect-pg-simple` manage sessions in PostgreSQL. An `isAuthenticated` middleware protects API routes. Development authentication normalizes `req.user.id` for consistent behavior.

### Credit System & Monetization

The platform uses a unified credit system across all AI generation features:

**5-Tier Subscription Model:**
- **Free** - $0/month, 50 credits/month
- **Studio** - $9.99/month, 500 credits/month  
- **Studio+** - $19.99/month, 1,250 credits/month
- **Pro** - $34.99/month, 2,500 credits/month
- **Mogul** - $49.99/month, Unlimited credits

**One-Time Credit Packages:**
- 100 credits - $4.99
- 250 credits (+25 bonus) - $9.99
- 500 credits (+75 bonus) - $19.99
- 1000 credits (+200 bonus) - $34.99
- 2500 credits (+600 bonus) - $79.99

Credits power all AI generation features including music, images, videos, and seamless loops.

### Seamless Loop Creator

A dedicated video tool at `/seamless-loop-creator/` for generating perfect looping videos with three modes:

1.  **Image-to-Loop Mode (Luma Ray 2 Flash)**: Upload an image, provide a motion prompt, and AI animates it into a 5s or 9s seamless loop (2 credits/second).
2.  **Upload Video Mode (Fal.ai Seedance Lite)**: Convert existing videos to seamless loops (2 credits/second × original duration). Handles various input formats.
3.  **Text-to-Loop Mode (Luma Ray 2 Flash)**: Generate 5s or 9s seamless loops from text prompts only (2 credits/second).

**Technical Implementation:** Utilizes Luma Ray 2 Flash for native looping (no seam) and Fal.ai Seedance Lite for flexible video uploads. FFmpeg ensures `faststart` for browser streaming. ImgBB is used for temporary image hosting. Credit deduction occurs after validation with automatic refunds for failures.

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL for data persistence
-   **Replit Auth (OIDC)**: User authentication and session management
-   **Stripe**: Payment processing for credit packages and subscriptions (ready for setup)
-   **KIE.ai SUNO API**: AI music generation via Webshare proxy
-   **ttapi.io Midjourney API**: High-quality AI image generation (Studio+ users)
-   **OpenAI API**: DALL-E 3 for album art and image generation (Studio+)
-   **Fal.ai Nano Banana**: Fast image generation (all users)
-   **Luma Ray 2 Flash**: Seamless loop video generation (text-to-loop and image-to-loop modes, 5s/9s)
-   **Fal.ai Seedance Lite**: AI seamless loop video generation (upload mode, arbitrary durations)
-   **Fal.ai Seedance**: AI music video generation
-   **ImgBB API**: Temporary image hosting

### Key Libraries & Tools

-   **Frontend Framework**: React with TypeScript
-   **Routing**: Wouter (lightweight React router)
-   **UI Components**: Shadcn UI (Radix UI primitives + Tailwind CSS)
-   **Styling**: Tailwind CSS with custom color system
-   **State Management**: TanStack Query (React Query v5)
-   **Form Handling**: React Hook Form with Zod validation  
-   **Icons**: Lucide React
-   **Database**: Drizzle ORM with PostgreSQL
-   **Development**: Vite, esbuild, TypeScript, Drizzle Kit

## Recent Changes (November 2024)

### Ghost Musician Removal
Ghost Musician has been completely removed from this repository and moved to a separate codebase:
- Removed 1,426+ lines of Ghost Musician code (routes, schema, storage methods)
- Deleted database tables: bands, quests, feedEvents, achievements, cardDesigns, uploadedAudio
- Removed Ghost Musician fields from users table: freeBandGenerations, lastLoginAt, dailyLoginStreak
- Cleaned up server/storage.ts and server/routes.ts
- Database now contains only core platform tables: users, products, userInventory

### Static Homepage Cleanup (November 9, 2024)
**Cleaned up static/index.html from 4,495 lines to 2,270 lines:**
- Removed 2,220+ lines of broken code mixed from other pages (music players, chat UI, quest modals, media generation)
- Created modular authentication system: `static/assets/js/auth.js` (191 lines, clean & tested)
- Fixed all JavaScript syntax errors (51 LSP diagnostics → 0)
- Preserved essential features: animated background, header navigation, credits/quest/profile indicators
- Authentication flow now working correctly: login state toggles header UI, credits display updates, profile modal functions

**Auth Module Features:**
- `checkAuth()` - Verifies login status via `/api/auth/user` and `/api/user/credits`
- `updateCreditsDisplay()` - Shows credit balance (number or ∞ for Mogul plan)
- `showProfileModal()` - Displays user profile with credits, plan, logout
- `showQuestModal()` / `showPaymentModal()` - Navigate to /buy-credits page
- All functions exposed globally for onclick handlers in static HTML

### New Frontend Structure
- Created 4 core pages: buy-credits, card-shop, video-generation, channels
- Implemented UserNavigation component with authentication and credit display
- Added useAuth hook for authentication state management
- Created complete Shadcn UI component library (button, card, avatar, badge, skeleton, tabs, label, textarea, input, select, toast)
- Set up React Router with Wouter
- Configured dark mode theming with purple/pink gradient branding