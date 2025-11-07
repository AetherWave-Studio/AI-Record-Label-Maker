import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  lastUsernameChange: timestamp("last_username_change"), // Track last username change for 30-day restriction
  vocalGenderPreference: varchar("vocal_gender_preference").default('m'),
  credits: integer("credits").default(50).notNull(),
  subscriptionPlan: varchar("subscription_plan").default('free').notNull(), // 'free', 'studio', 'creator', 'producer', 'mogul'
  lastCreditReset: timestamp("last_credit_reset").defaultNow().notNull(),
  welcomeBonusClaimed: integer("welcome_bonus_claimed").default(0), // 1 if claimed, 0 if not (100 credits one-time bonus) - optional for backward compat
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Free tier credit system constants
export const FREE_TIER_WELCOME_BONUS = 100; // One-time 100 credits on signup
export const FREE_TIER_DAILY_CREDITS = 20; // 20 credits per day
export const FREE_TIER_CREDIT_CAP = 100;    // Max 100 credits for free tier

// Plan-based feature restrictions
export const PlanType = z.enum(['free', 'studio', 'creator', 'producer', 'mogul']);
export type PlanType = z.infer<typeof PlanType>;

// Display names for subscription tiers
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  free: 'Fan',
  studio: 'Studio Pass',
  creator: 'Artist',
  producer: 'Record Label',
  mogul: 'Mogul',
};

// Unified subscription pricing (monthly)
export const PLAN_PRICING: Record<PlanType, number> = {
  free: 0,
  studio: 4.99,
  creator: 9.99,
  producer: 19.99,
  mogul: 49.99,
};

// Video resolution options
export const VideoResolution = z.enum(['512p', '720p', '1080p', '4k']);
export type VideoResolution = z.infer<typeof VideoResolution>;

// Video model options (KIE.ai and Fal.ai providers)
export const VideoModel = z.enum([
  'seedance-lite',      // Fal.ai ByteDance Seedance V1 Lite
  'seedance-pro-fast',  // Fal.ai ByteDance Seedance V1 Pro Fast
  'seedance-pro',       // Fal.ai ByteDance Seedance V1 Pro
  'veo3_fast',          // KIE.ai Google Veo 3 Fast
  'sora2',              // KIE.ai OpenAI Sora 2 Standard
]);
export type VideoModel = z.infer<typeof VideoModel>;

// Image engine options
export const ImageEngine = z.enum(['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion']);
export type ImageEngine = z.infer<typeof ImageEngine>;

// Music model options
export const MusicModel = z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']);
export type MusicModel = z.infer<typeof MusicModel>;

// Plan feature access definitions
export interface PlanFeatures {
  musicGeneration: boolean;
  videoGeneration: boolean;
  imageGeneration: boolean;
  wavConversion: boolean; // Convert audio to high-quality WAV format
  allowedVideoResolutions: VideoResolution[];
  allowedVideoModels: VideoModel[]; // Which video generation models are allowed
  allowedImageEngines: ImageEngine[];
  allowedMusicModels: MusicModel[];
  maxCreditsPerDay: number | 'unlimited';
  maxCreditsPerMonth?: number | 'unlimited'; // Monthly credit pool for paid plans
  maxAudioUploadSizeMB: number; // Max audio file upload size in MB
  commercialLicense: boolean;
  apiAccess: boolean;
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: false, // WAV conversion is paid-only
    allowedVideoResolutions: ['512p'], // Only lowest resolution (lite, 512p, 3s)
    allowedVideoModels: ['seedance-lite'], // Only Seedance Lite model
    allowedImageEngines: ['dall-e-2'], // Only basic engine (Nano Banana for Panel 3)
    allowedMusicModels: ['V3_5', 'V4'], // Only beginner models
    maxCreditsPerDay: 20,  // 20 credits/day + 100 welcome bonus (capped at 100)
    maxAudioUploadSizeMB: 10, // Free users: 10MB limit (MP3 only, ~10 minutes)
    commercialLicense: false,
    apiAccess: false,
  },
  studio: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: false, // No WAV (upsell to Creator)
    allowedVideoResolutions: ['512p', '720p', '1080p'], // All except 4K
    allowedVideoModels: ['seedance-lite', 'seedance-pro-fast'], // Seedance Lite + Pro Fast
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'midjourney'], // DALL-E 2/3 + Midjourney
    allowedMusicModels: ['V3_5', 'V4', 'V4_5'], // Basic to mid-tier models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 400, // 400 credits/month ($9.99 tier)
    maxAudioUploadSizeMB: 50, // 50MB limit
    commercialLicense: true,
    apiAccess: false,
  },
  creator: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['512p', '720p', '1080p', '4k'], // All resolutions
    allowedVideoModels: ['seedance-lite', 'seedance-pro-fast', 'seedance-pro', 'sora2'], // Seedance + Sora 2
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 1000, // 1000 credits/month ($19.99 tier)
    maxAudioUploadSizeMB: 100, // 100MB limit (WAV support)
    commercialLicense: true,
    apiAccess: false,
  },
  producer: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['512p', '720p', '1080p', '4k'], // All resolutions
    allowedVideoModels: ['seedance-lite', 'seedance-pro-fast', 'seedance-pro', 'sora2', 'veo3_fast'], // All available models
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 4000, // 4000 credits/month ($49 tier)
    maxAudioUploadSizeMB: 100, // 100MB limit (WAV support)
    commercialLicense: true,
    apiAccess: false,
  },
  mogul: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['512p', '720p', '1080p', '4k'], // All resolutions
    allowedVideoModels: ['seedance-lite', 'seedance-pro-fast', 'seedance-pro', 'sora2', 'veo3_fast'], // All available models
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 10000, // 10000 credits/month ($99 tier)
    maxAudioUploadSizeMB: 100, // 100MB limit (WAV support)
    commercialLicense: true,
    apiAccess: true,
  },
};

// Helper function to check boolean features for a plan
export function isPlanFeatureEnabled(
  planType: PlanType,
  feature: 'musicGeneration' | 'videoGeneration' | 'imageGeneration' | 'wavConversion' | 'commercialLicense' | 'apiAccess'
): boolean {
  return PLAN_FEATURES[planType][feature];
}

// Helper function to get allowed options for a plan
export function getAllowedOptions<T>(
  planType: PlanType,
  optionType: 'videoResolutions' | 'videoModels' | 'imageEngines' | 'musicModels'
): T[] {
  const featureMap = {
    videoResolutions: 'allowedVideoResolutions',
    videoModels: 'allowedVideoModels',
    imageEngines: 'allowedImageEngines',
    musicModels: 'allowedMusicModels',
  } as const;

  return PLAN_FEATURES[planType][featureMap[optionType]] as T[];
}

// Service types for credit deduction
export const ServiceType = z.enum([
  'music_generation',
  'video_generation',
  'image_generation',
  'album_art_generation',
  'midjourney_generation',
  'midjourney_generation_turbo',
  'wav_conversion',
  'background_removal'
]);
export type ServiceType = z.infer<typeof ServiceType>;

// Credit cost configuration for each service type
// NOTE: video_generation uses dynamic pricing based on quality settings (see calculateVideoCredits in routes.ts)
// Pricing updated 2025-01 based on actual API costs + 50% margin
// 1 credit = $0.005 USD
export const SERVICE_CREDIT_COSTS: Record<ServiceType, number> = {
  music_generation: 18,        // KIE.ai/Suno: $0.06 API + 50% margin = $0.09
  video_generation: 10,        // Base for lite 512p 3s (dynamic function calculates actual cost)
  image_generation: 12,        // DALL-E 3: $0.04 API + 50% margin = $0.06
  album_art_generation: 9,     // Seedream: $0.03 API + 50% margin = $0.045
  midjourney_generation: 6,    // KIE.ai Midjourney Fast: ~$0.04 API cost for 4 images, priced competitively at 6 credits
  midjourney_generation_turbo: 12, // KIE.ai Midjourney Turbo: 2x API cost, 2x credits
  wav_conversion: 6,           // $0.02 API + 50% margin = $0.03
  background_removal: 20,      // AI background removal: $0.10 API + 50% margin = $0.15
};

// Plans that have unlimited access to specific services
export const UNLIMITED_SERVICE_PLANS: Record<ServiceType, PlanType[]> = {
  music_generation: ['studio', 'creator', 'producer', 'mogul'], // Unlimited music for all paid plans!
  video_generation: ['mogul'], // Only Mogul has unlimited video
  image_generation: ['mogul'], // Only Mogul has unlimited images
  album_art_generation: ['mogul'], // Album art unlimited for Mogul plan
  midjourney_generation: ['mogul'], // Midjourney Fast unlimited for Mogul plan
  midjourney_generation_turbo: ['mogul'], // Midjourney Turbo unlimited for Mogul plan
  wav_conversion: ['creator', 'producer', 'mogul'], // WAV conversion free for Creator+ plans
  background_removal: ['mogul'], // Background removal unlimited for Mogul plan
};

// Result types for credit operations
export interface CreditCheckResult {
  allowed: boolean;
  reason?: 'insufficient_credits' | 'unlimited' | 'success';
  currentCredits?: number;
  requiredCredits?: number;
  planType?: PlanType;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  amountDeducted: number;
  wasUnlimited: boolean;
  error?: string;
}

// ============================================================================
// GHOSTMUSICIAN RPG TABLES
// ============================================================================

// Virtual bands/artists created by users










// ============================================================================
// MARKETPLACE SYSTEM
// ============================================================================

// Product categories
export const ProductCategory = z.enum([
  'card_themes',
  'premium_features', 
  'profile_items',
  'sound_packs',
  'collectibles'
]);
export type ProductCategory = z.infer<typeof ProductCategory>;

// Product rarities
export const ProductRarity = z.enum(['Common', 'Rare', 'Epic', 'Legendary']);
export type ProductRarity = z.infer<typeof ProductRarity>;

// Products table - All marketplace items
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // ProductCategory
  price: integer("price").notNull(), // Credit cost
  imageUrl: varchar("image_url"), // Optional preview image
  productData: jsonb("product_data"), // Category-specific data (multipliers, etc.)
  rarity: varchar("rarity").notNull().default('Common'), // ProductRarity
  requiredLevel: varchar("required_level").default('Fan'), // Minimum FAME tier
  subscriptionTierRequired: varchar("subscription_tier_required"), // Optional tier gate
  isActive: integer("is_active").default(1).notNull(), // 1 = available, 0 = hidden
  stock: integer("stock"), // null = unlimited, number = limited stock
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// User inventory table - Track purchased items
export const userInventory = pgTable("user_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").default(1).notNull(), // For stackable items
  isActive: integer("is_active").default(1).notNull(), // 1 = equipped/active, 0 = owned but inactive
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const insertUserInventorySchema = createInsertSchema(userInventory).omit({
  id: true,
  purchasedAt: true,
});

export type InsertUserInventory = z.infer<typeof insertUserInventorySchema>;
export type UserInventory = typeof userInventory.$inferSelect;

// ============================================================================
// SERVICE REGISTRY - Centralized service configuration and metadata
// ============================================================================

export const serviceRegistry = pgTable("service_registry", {
  id: varchar("id").primaryKey(), // e.g., 'music_generation', 'midjourney_generation_turbo'
  displayName: varchar("display_name").notNull(), // e.g., 'Music Generation (SUNO)'
  category: varchar("category").notNull(), // 'music', 'image', 'video', 'audio'
  provider: varchar("provider").notNull(), // 'kie-ai', 'openai', 'fal-ai', 'ttapi'

  // Timeout & Performance
  typicalTimeSeconds: integer("typical_time_seconds").notNull(), // Typical completion time (lower bound)
  typicalTimeSecondsMax: integer("typical_time_seconds_max").notNull(), // Typical completion time (upper bound)
  maxTimeoutSeconds: integer("max_timeout_seconds").notNull(), // Hard timeout before auto-refund
  pollIntervalMs: integer("poll_interval_ms").default(2000), // How often to poll status (for async services)

  // Credit & Pricing
  creditCost: integer("credit_cost").notNull(), // Base credit cost
  isDynamicPricing: integer("is_dynamic_pricing").default(0), // 1 if pricing varies by parameters

  // Success Tracking
  successRate: integer("success_rate").default(95), // Percentage (0-100) based on historical data
  totalAttempts: integer("total_attempts").default(0), // Total generations attempted
  totalSuccesses: integer("total_successes").default(0), // Total successful generations
  totalFailures: integer("total_failures").default(0), // Total failed generations
  totalTimeouts: integer("total_timeouts").default(0), // Total timeout occurrences
  totalRefunds: integer("total_refunds").default(0), // Total refunds issued

  // Status & Availability
  isActive: integer("is_active").default(1).notNull(), // 1 = active, 0 = disabled
  isAsyncService: integer("is_async_service").default(0), // 1 = polling required, 0 = synchronous
  autoRefundEnabled: integer("auto_refund_enabled").default(1), // 1 = auto-refund on failure

  // Metadata
  description: text("description"), // User-facing description
  technicalNotes: text("technical_notes"), // Admin/developer notes
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceRegistrySchema = createInsertSchema(serviceRegistry).omit({
  totalAttempts: true,
  totalSuccesses: true,
  totalFailures: true,
  totalTimeouts: true,
  totalRefunds: true,
  lastUpdated: true,
  updatedAt: true,
});

export type InsertServiceRegistry = z.infer<typeof insertServiceRegistrySchema>;
export type ServiceRegistry = typeof serviceRegistry.$inferSelect;

// ============================================================================
// CREDIT BUNDLES - Real money purchases via Stripe
// ============================================================================

export const CreditBundle = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  credits: z.number(),
  bonusCredits: z.number(),
  priceUSD: z.number(), // Price in dollars (e.g., 4.99)
  popular: z.boolean().optional(),
});

export type CreditBundle = z.infer<typeof CreditBundle>;

// Credit bundle products available for purchase
export const CREDIT_BUNDLES: CreditBundle[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for trying out premium features',
    credits: 200,
    bonusCredits: 20,
    priceUSD: 4.99,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    description: 'Most popular choice for regular creators',
    credits: 500,
    bonusCredits: 100,
    priceUSD: 9.99,
    popular: true,
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    description: 'For serious content creators',
    credits: 1200,
    bonusCredits: 300,
    priceUSD: 19.99,
  },
  {
    id: 'pro',
    name: 'Professional Pack',
    description: 'Maximum value for power users',
    credits: 3000,
    bonusCredits: 1000,
    priceUSD: 49.99,
  },
];
