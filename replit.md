# AetherWave Studio - AI Music and Media Maker

## Overview

AetherWave Studio is an AI-powered application designed for music and media creation. It leverages AI for music generation (via SUNO through KIE.ai API), DALL-E 3 for album art, and Fal.ai Seedance for AI music video generation. The platform features a 4-tier monetization model (Free, Studio, Creator, All Access) and a centralized credit system for resource consumption, with options for bundled credit purchases. The application aims to provide a professional-grade creative tool experience, drawing inspiration from platforms like Runway ML, Midjourney, and ElevenLabs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a standalone HTML single-page application (`client/index.html`) built with vanilla JavaScript and inline CSS. It utilizes Vite for serving static assets and development. The design system features a dark-optimized interface with animated gradient backgrounds, custom AetherWave branding, and a pink/purple color palette. It is fully mobile-responsive across desktop, tablet, and mobile breakpoints, using a three-panel layout (Music | Hero/Credits | Chat/Media) on desktop and a single-column layout with a bottom navigation bar on mobile. Key features include real-time credit display, music model selection with plan-based restrictions, an interactive album art style selection modal, an "Album Art to Video" conversion feature with duration options, a premium audio player, image engine selector (Nano Banana for Free+, DALL-E 3 for Studio+) in Panel 3, and a user profile modal displaying account details, subscription plan, and credit balance.

### Backend Architecture

The backend is an Express.js application written in TypeScript, running on Node.js with ESM modules. It uses a RESTful API design with JSON request/response formats. Data storage is handled by PostgreSQL (Neon serverless) with Drizzle ORM for type-safe schema management and migrations. Authentication is managed via Replit Auth (OIDC) with a PostgreSQL session store. A core design principle is a security-first credit deduction flow, where credits are validated and deducted before external API calls are made, with unlimited plans bypassing credit checks. An interface-based storage abstraction manages user data and credit operations.

### Data Storage

The project utilizes a serverless PostgreSQL database hosted on Neon, accessed via Drizzle ORM. The schema is defined in `shared/schema.ts` and managed with Drizzle Kit. Key tables include `users` (storing UUID, username, subscription plan, credits, vocal preferences, Stripe data) and `uploadedAudio`. Plan-based features and service credit costs are centrally defined.

### Authentication & Authorization

Replit Auth provides OIDC-based authentication, with user accounts automatically created on first login. Session management is handled by `express-session` and `connect-pg-simple`, storing sessions in PostgreSQL. An `isAuthenticated` middleware protects all API routes, ensuring only authenticated users can access resources.

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **KIE.ai SUNO API**: For AI music generation, accessed via a Webshare static proxy to manage IP whitelisting.
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