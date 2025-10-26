# AetherWave Studio - AI Music and Media Maker

## Overview

AetherWave Studio is an AI-powered music and media creation application featuring SUNO music generation via KIE.ai API, 4-tier monetization (Free, Studio $20, Creator $35, All Access $50), centralized credit system, and bundled credit purchases.

**Architecture**: Standalone HTML single-page application (NOT React) with inline CSS/JavaScript, served by Express.js backend. Features full-screen mobile-responsive design with gesture navigation and custom AetherWave branding with animated logos.

The application provides a creative tool interface for generating AI-created music and media content, inspired by professional creative tools like Runway ML, Midjourney, and ElevenLabs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Standalone HTML file (`client/index.html`) with inline CSS and vanilla JavaScript
- **Routing**: Single-page application with tab-based navigation (no router needed)
- **State Management**: Vanilla JavaScript with DOM manipulation
- **Styling**: Custom CSS with CSS variables for theming
- **Build Tool**: Vite (serves static HTML + assets)
- **Assets**: Located in `client/public/assets/` (served at `/assets/` paths)

**Design System**:
- Dark-optimized interface with animated gradient backgrounds
- Custom AetherWave branding with animated GIF logo
- Color palette: Pink (#ff2ea6) and Purple (#8b5cf6) gradients
- Full-screen mobile-responsive design with gesture navigation
- Custom icon set in `/assets/icon-set/`

**Key Frontend Features**:
- Three-panel layout: Music Generation | Hero/Credits | Chat/Media
- Real-time credit display with plan-based restrictions
- Music model selector (V5, V4.5+, V4.5) with plan validation
- Custom mode toggle for advanced music controls
- Polling-based status updates for async music generation
- Premium audio player with download functionality

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database ORM**: Drizzle ORM
- **Session Storage**: PostgreSQL-based sessions (connect-pg-simple)
- **Development**: tsx for TypeScript execution

**API Design**:
- RESTful API with `/api` prefix for all endpoints
- JSON request/response format
- Request logging with duration tracking
- Raw body capture for webhook support

**Storage Pattern**:
- Interface-based storage abstraction (`IStorage`)
- In-memory implementation (`MemStorage`) for development
- CRUD methods: `getUser`, `getUserByUsername`, `createUser`, `upsertUser`
- Credit management: `deductCredits`, `checkCredits` (with unlimited plan bypass)
- User preferences: `updateUserVocalPreference`

**API Endpoints**:
- **Music**: `/api/generate-music`, `/api/upload-cover-music`, `/api/music-status/:taskId`
- **Audio**: `/api/upload-audio`, `/api/audio/:id`, `/api/convert-to-wav`
- **User**: `/api/user/credits`, `/api/user/preferences`, `/api/user/credits/check-reset`
- **Chat**: `/api/chat` (OpenAI via Replit AI Integration)
- **Auth**: `/api/auth/user` (Replit Auth)

**Credit Deduction Flow** (Security-First):
1. Validate user exists
2. Validate all required inputs (prompt, uploadUrl, etc.)
3. Check API key configuration
4. Validate model/service allowed for user's plan
5. **ONLY THEN** deduct credits
6. Make external API call
7. Unlimited plans (studio, creator, all_access) bypass credit deduction

### Data Storage

**Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Type-safe schema in `shared/schema.ts`
- **Migrations**: Drizzle Kit for schema migrations (output to `./migrations`)
- **Connection**: WebSocket-based serverless connection via `@neondatabase/serverless`

**Current Schema**:
- `users` table: UUID primary key, username, subscription_plan, credits, vocalGenderPreference, lastCreditReset, Stripe fields
- `uploadedAudio` table: Audio file metadata for user uploads
- Plan-based features defined in PLAN_FEATURES (Free, Studio, Creator, All Access)
- Service credit costs in SERVICE_CREDIT_COSTS
- Zod validation schemas for insert operations
- Type inference for compile-time safety

**Design Rationale**:
- Serverless PostgreSQL chosen for scalability and zero-config deployment
- Drizzle ORM provides type-safe queries without code generation overhead
- Schema-first approach with validation ensures data integrity

### Authentication & Authorization

**Current State**: Replit Auth (OIDC) fully implemented
- Replit Auth integration via `server/replitAuth.ts`
- Session-based authentication with PostgreSQL session store
- User auto-creation on first login with default Free plan
- `isAuthenticated` middleware protects all API routes
- Session management via express-session + connect-pg-simple

### External Dependencies

**Third-Party Services**:
- **Neon Database**: Serverless PostgreSQL hosting
- **KIE.ai SUNO API**: AI music generation (requires SUNO_API_KEY)
  - **Proxy Configuration**: All KIE.ai API calls route through Webshare static proxy to solve IP whitelisting issues
  - Proxy credentials stored in environment secrets: PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD
  - Uses https-proxy-agent for Node.js fetch proxy support
- **Replit AI Integrations**: OpenAI chat via environment credentials
- **Google Fonts**: Inter font family

**Key Libraries**:
- **UI Components**: Radix UI primitives (40+ component packages)
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with autoprefixer
- **Date Utilities**: date-fns
- **State Management**: TanStack Query
- **Icons**: Lucide React
- **Development**: Replit plugins (vite-plugin-runtime-error-modal, cartographer, dev-banner)

**Build & Development Tools**:
- Vite: Frontend build tool and dev server
- esbuild: Backend bundler for production
- TypeScript: Type safety across stack
- Drizzle Kit: Database schema management

**Design Philosophy**:
- Shadcn UI approach: Components are copied into codebase rather than installed as dependencies
- This allows full customization while maintaining consistency
- All UI components use consistent patterns: Radix primitives + Tailwind + CVA for variants