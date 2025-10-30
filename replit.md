# AetherWave Studio - AI Music and Media Maker

## Overview

AetherWave Studio is an AI-powered music and media creation application featuring SUNO music generation via KIE.ai API, 4-tier monetization (Free, Studio $20, Creator $35, All Access $50), centralized credit system, and bundled credit purchases.

**Architecture**: Standalone HTML single-page application (NOT React) with inline CSS/JavaScript, served by Express.js backend. Features full-screen mobile-responsive design with gesture navigation and custom AetherWave branding with animated logos.

The application provides a creative tool interface for generating AI-created music and media content, inspired by professional creative tools like Runway ML, Midjourney, and ElevenLabs.

## Recent Changes (October 30, 2025)

**Unified Video Generation Workflow (Seedance Lite + VEO):**
- Aligned Seedance Lite workflow with VEO 3.1 Fast - both support 3 generation types:
  1. **Text-to-video** (no image)
  2. **First frame mode** (one image as starting frame)
  3. **First + Last frame mode** (two images for beginning and end)
- **Seedance Pro**: Reference mode only (no first/last frame support)
- Removed image mode dropdown (auto-determined based on model and uploaded images)
- Second image uploader appears for Seedance Lite and VEO 3.1 Fast only
- Frontend auto-sets `imageMode` based on model:
  - Seedance Pro: 'reference' (reference-to-video)
  - Seedance Lite/VEO: 'first-frame' (image-to-video with optional end frame)
- Backend properly handles `endImageData` for Fal.ai Seedance Lite first+last frame mode
- Image upload labels standardized by model:
  - Seedance Lite: "- First frame or reference"
  - Seedance Pro: "- Reference only"
  - VEO 3.1 Fast: "- First frame or reference"
  - SORA 2: "- Reference only"
- **Resolution Options:**
  - Seedance Lite: 480p, 720p, 1080p only (4K hidden)
  - Seedance Pro: 480p, 720p, 1080p, 4K
  - Changed default from 512p to 480p across entire application
- **Duration Options:**
  - Seedance Lite: 5 seconds, 10 seconds only (3s removed)
  - Seedance Pro: 3 seconds, 5 seconds, 10 seconds
  - Free account default changed from 3s to 5s

**Custom Video Generation Button Styling:**
- Added custom button styling for video generation with background images
- Button uses `/assets/Generate-video-btn.png` for default state
- Button uses `/assets/Generate-video-btn-active.png` for active/processing state
- Added pink pulsating glow animation during video generation (5-10 min process)
- Button dynamically switches between `btn-video-generate` (video) and `btn-primary` (image) classes
- Processing state shows "⏳ Generating Video... (may take 5-10 min)" with animated glow
- Backend now returns `model` field in video generation response for proper UI display

**VEO3 Model Display Fix:**
- Fixed UI to dynamically display correct model names (KIE.ai VEO 3, KIE.ai SORA 2, Fal.ai Seedance)
- Title now shows "✅ Video Generated with KIE.ai VEO 3" instead of hardcoded "Fal.ai Seedance 1.0"
- Model detection logic checks for veo3, sora, and seedance in model name

**Album Art Video Animation Feature:**
- Added duration picker modal for "Turn into Video" feature in Panel 1 (album art animation)
- Modal offers 3 and 5 second options only (no 10 seconds for album cover animations)
- Free accounts locked to 3 seconds with visual indicator in modal
- Paid accounts can choose between 3s (3 credits) and 5s (5 credits)
- Video display dynamically shows selected duration (e.g., "3s Seedance" or "5s Seedance")

**Video Duration Bug Fix:**
- Fixed critical bug where free accounts couldn't generate videos due to missing 3-second duration option
- Added "3 seconds" option to main video generation duration dropdown (previously only had 5 and 10)
- Updated backend validation to accept 3 seconds for free accounts (was incorrectly set to 5)
- Fixed frame calculation to properly support all three durations (3s=73 frames, 5s=121 frames, 10s=241 frames)
- Free account default is now 3 seconds at 3 credits (the cheapest option)

**Mobile-First Responsive Design Implementation:**
- Implemented comprehensive mobile-responsive design with three breakpoints:
  - **Desktop (>1024px)**: Three-column grid layout (Music | Hero/Chat | Media)
  - **Tablet (768px-1024px)**: Two-column grid with hero spanning both columns
  - **Mobile (≤768px)**: Single-column with bottom navigation bar only
- **Navigation System**: Removed hamburger menu and side navigation drawer
- **Bottom navigation bar** (mobile only): Three tabs (Music, Chat, Media) for panel switching
- Fixed scrolling issues: sticky header, proper overflow containment, no floating menus
- All touch targets meet 44px minimum accessibility standard
- Added touch-action properties for proper mobile gesture handling
- Reduced animations on mobile for better performance (lighter orbs, reduced opacity)
- Removed legacy conflicting media queries that caused cascading issues
- Mobile displays one panel at a time with smooth transitions
- Desktop and tablet layouts remain fully functional with proper grid system

**Profile Modal Implementation:**
- Created user profile modal accessible via avatar click in header
- Displays account details (username, email, user ID)
- Shows subscription plan with upgrade/manage button
- Displays credits balance with cost breakdown
- Shows user preferences (vocal gender)
- Includes logout link and close button
- Modal uses scrollable layout with fixed header/footer (max-height: 90vh)

**Bug Fixes:**
- Fixed JavaScript syntax errors (escaped backticks in template literals)
- Fixed `currentUser is not defined` error by adding global state variables
- Fixed duplicate `userCredits` variable declaration
- Added proper event listener attachment for profile trigger after authentication
- Profile modal now properly accesses user data from global scope
- Resolved mobile scrolling and floating menu issues

**Global State Management:**
- Added `currentUser` global variable populated during authentication
- Added `userCredits` global variable fetched from `/api/user/credits`
- Variables populated in `checkAuth()` function after successful login

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
- **Album Art Style Selection Modal**: Interactive modal for selecting art styles (Photorealistic, Abstract, Cyberpunk, Retro, Minimal, Surreal) before DALL-E 3 generation
- **Panel 1 Album Art to Video**: "Turn into Video" button appears after album art generation with duration picker modal (3s/5s options only, free accounts locked to 3s), converts art using Seedance image-to-video mode with toggle between art/video views
- **Download Format Modal**: Per-track format selection (MP3/WAV) with Free plan restrictions and visual feedback
- **User Profile Modal**: Click avatar to view account details, subscription plan, credits, and preferences with scrollable content

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
- **Media**: `/api/generate-art` (DALL-E 3), `/api/generate-video-fal` (Fal.ai Seedance), `/api/download-image` (CORS proxy)
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
  - Uses node-fetch v2 with https-proxy-agent for reliable proxy support
- **OpenAI API**: DALL-E 3 album art generation (requires OPENAI_API_KEY)
  - Direct API calls (not through Replit proxy)
  - Supports 6 art styles: photorealistic, abstract, cyberpunk, retro, minimal, surreal
  - Backend proxy endpoint for CORS-free downloads
- **Fal.ai Seedance**: AI music video generation (requires FAL_KEY)
  - Supports text-to-video, image-to-video, and reference-to-video modes
  - Lite/Pro model variants with 512p/720p/1080p/4K resolution options
  - 3/5/10 second duration support (73/121/241 frames at ~24fps)
  - **Quality-Based Credit Pricing**:
    - Base cost: 3 credits (Lite, 512p, 3s)
    - Model multiplier: Lite=1x, Pro=2x
    - Resolution multiplier: 512p=1x, 720p=1.5x, 1080p=2x, 4K=3x
    - Duration multiplier: (seconds/3)x
    - Examples: 
      - Free tier (Lite, 512p, 3s) = 3 credits
      - Mid tier (Lite, 720p, 5s) = 8 credits
      - Pro 4K 10s = 60 credits (3 × 2 × 3 × 3.33)
  - **Free Account Restrictions**:
    - Locked to default settings only (Lite, 512p, 3s = 3 credits)
    - Quality/Resolution/Duration dropdowns disabled in UI
    - Backend validation prevents API bypass attempts
  - **Paid Account Benefits**:
    - Full access to all quality settings (3/5/10 second durations)
    - Credits deducted based on selected quality
    - All Access plan: unlimited video generation (no credit deduction)
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