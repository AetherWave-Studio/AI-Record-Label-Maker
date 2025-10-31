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
  vocalGenderPreference: varchar("vocal_gender_preference").default('m'),
  credits: integer("credits").default(50).notNull(),
  freeBandGenerations: integer("free_band_generations").default(3).notNull(), // 3 free band creations for all users
  subscriptionPlan: varchar("subscription_plan").default('free').notNull(), // 'free', 'studio', 'creator', 'producer', 'mogul'
  lastCreditReset: timestamp("last_credit_reset").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"), // Track daily login for rewards
  dailyLoginStreak: integer("daily_login_streak").default(0).notNull(), // Consecutive days logged in
  welcomeBonusClaimed: integer("welcome_bonus_claimed").default(0), // 1 if claimed, 0 if not (50 credits one-time bonus) - optional for backward compat
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

// Uploaded audio files table
export const uploadedAudio = pgTable("uploaded_audio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: varchar("file_size").notNull(),
  audioData: text("audio_data").notNull(), // Base64 encoded audio data
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUploadedAudioSchema = createInsertSchema(uploadedAudio).omit({
  id: true,
  createdAt: true,
});

export type InsertUploadedAudio = z.infer<typeof insertUploadedAudioSchema>;
export type UploadedAudio = typeof uploadedAudio.$inferSelect;

// Quest system for earning credits
export const QuestType = z.enum(['twitter_follow', 'discord_join', 'facebook_follow', 'tiktok_follow']);
export type QuestType = z.infer<typeof QuestType>;

export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  questType: varchar("quest_type").notNull(), // 'twitter_follow', 'discord_join', etc.
  completed: integer("completed").default(0).notNull(), // 1 if completed, 0 if not
  creditsAwarded: integer("credits_awarded").default(0).notNull(), // How many credits were awarded
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;

// Quest reward configuration (credits per quest)
export const QUEST_REWARDS: Record<QuestType, number> = {
  twitter_follow: 10,    // 10 credits for following on X.com
  discord_join: 10,      // 10 credits for joining Discord
  facebook_follow: 10,   // 10 credits for following on Facebook
  tiktok_follow: 10,     // 10 credits for following on TikTok
};

// News Feed Events - Track all platform activities for social feed
export const FeedEventType = z.enum([
  'band_created',
  'daily_growth',
  'achievement',
  'rank_change',
  'press_release',
  'band_milestone'
]);
export type FeedEventType = z.infer<typeof FeedEventType>;

export const feedEvents = pgTable("feed_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  eventType: varchar("event_type").notNull(),
  bandId: varchar("band_id"), // Band involved in the event
  data: jsonb("data").notNull(), // Event-specific data (achievement type, growth stats, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedEventSchema = createInsertSchema(feedEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertFeedEvent = z.infer<typeof insertFeedEventSchema>;
export type FeedEvent = typeof feedEvents.$inferSelect;

// Free tier credit system constants
export const FREE_TIER_WELCOME_BONUS = 50; // One-time 50 credits on signup
export const FREE_TIER_DAILY_CREDITS = 10; // 10 credits per day
export const FREE_TIER_CREDIT_CAP = 50;    // Max 50 credits (quest rewards can exceed cap, but daily credits won't be added if >= 50)

// Plan-based feature restrictions
export const PlanType = z.enum(['free', 'studio', 'creator', 'producer', 'mogul']);
export type PlanType = z.infer<typeof PlanType>;

// Unified subscription pricing (monthly)
export const PLAN_PRICING: Record<PlanType, number> = {
  free: 0,
  studio: 9.99,
  creator: 19.99,
  producer: 49,
  mogul: 99,
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
    maxCreditsPerDay: 10,  // 10 credits/day + 500 welcome bonus (cap at 500, quest rewards can exceed cap but daily credits won't be added if >= 500)
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
    maxCreditsPerMonth: 1500, // 1500 credits/month ($9.99 tier)
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
    maxCreditsPerMonth: 5000, // 5000 credits/month ($19.99 tier)
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
    maxCreditsPerMonth: 15000, // 15000 credits/month ($49 tier)
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
    maxCreditsPerMonth: 'unlimited', // Unlimited credits ($99 tier)
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
  'wav_conversion'
]);
export type ServiceType = z.infer<typeof ServiceType>;

// Credit cost configuration for each service type
// NOTE: video_generation uses dynamic pricing based on quality settings (see calculateVideoCredits in routes.ts)
// Pricing updated 2025-01 based on actual API costs + 50% margin
// 1 credit = $0.01 USD
export const SERVICE_CREDIT_COSTS: Record<ServiceType, number> = {
  music_generation: 10,        // KIE.ai/Suno: $0.06 API + 50% margin = $0.09
  video_generation: 5,         // Base for lite 512p 3s (dynamic function calculates actual cost)
  image_generation: 6,         // DALL-E 3: $0.04 API + 50% margin = $0.06
  album_art_generation: 5,     // Seedream: $0.03 API + 50% margin = $0.045
  midjourney_generation: 3,    // KIE.ai Midjourney Fast: ~$0.04 API cost for 4 images, priced competitively at 3 credits
  midjourney_generation_turbo: 6, // KIE.ai Midjourney Turbo: 2x API cost, 2x credits
  wav_conversion: 3,           // $0.02 API + 50% margin = $0.03
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
export const bands = pgTable("bands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bandName: varchar("band_name").notNull(),
  genre: varchar("genre").notNull(),
  concept: text("concept"), // Band origin story/narrative
  philosophy: text("philosophy"), // Artistic vision
  influences: text("influences").array(), // Cultural references
  colorPalette: varchar("color_palette").array(), // Visual identity colors
  
  // Band members (JSON array of member objects)
  members: jsonb("members").notNull(), // [{name, role, backstory, age, gender}]
  
  // Visual assets
  portraitUrl: varchar("portrait_url"), // AI-generated band portrait
  tradingCardUrl: varchar("trading_card_url"), // Full trading card image
  equippedCardDesign: varchar("equipped_card_design").default('ghosts_online').notNull(), // Which card design to use
  
  // Audio
  audioFileId: varchar("audio_file_id").references(() => uploadedAudio.id),
  songTitle: varchar("song_title"),
  sunoPrompt: text("suno_prompt"), // AI prompt for generating matching music
  
  // Metrics (current values)
  fame: integer("fame").default(5).notNull(), // 1-100 scale
  physicalCopies: integer("physical_copies").default(10).notNull(),
  digitalDownloads: integer("digital_downloads").default(50).notNull(),
  totalStreams: integer("total_streams").default(100).notNull(),
  chartPosition: integer("chart_position").default(0).notNull(), // 0 = unranked, 1-100 = ranked
  
  // Daily growth tracking
  lastGrowthApplied: timestamp("last_growth_applied"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBandSchema = createInsertSchema(bands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBand = z.infer<typeof insertBandSchema>;
export type Band = typeof bands.$inferSelect;

// Achievement tracking for bands (Gold, Platinum, Diamond records)
export const bandAchievements = pgTable("band_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bandId: varchar("band_id").notNull().references(() => bands.id),
  achievementType: varchar("achievement_type").notNull(), // 'gold', 'platinum', 'diamond'
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export type BandAchievement = typeof bandAchievements.$inferSelect;

// Daily growth log (tracks when users apply daily growth to their bands)
export const dailyGrowthLog = pgTable("daily_growth_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bandId: varchar("band_id").notNull().references(() => bands.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  fameGrowth: integer("fame_growth").notNull(),
  streamsAdded: integer("streams_added").notNull(),
  digitalAdded: integer("digital_added").notNull(),
  physicalAdded: integer("physical_added").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

export type DailyGrowthLog = typeof dailyGrowthLog.$inferSelect;

// RPG-specific service types for credit deduction
export const RpgServiceType = z.enum([
  'band_creation',        // Create a new virtual band
  'marketing_campaign',   // Boost band visibility
  'fame_boost',          // Instant FAME increase
  'collaboration',       // Band collaboration feature
]);
export type RpgServiceType = z.infer<typeof RpgServiceType>;

// Credit costs for RPG game actions
export const RPG_CREDIT_COSTS: Record<RpgServiceType, number> = {
  band_creation: 15,      // Creating a new virtual band with AI
  marketing_campaign: 10, // Running a marketing campaign
  fame_boost: 5,          // Instant FAME boost
  collaboration: 8,       // Band collaboration
};

// Band limits by subscription tier
export const BAND_LIMITS: Record<PlanType, number | 'unlimited'> = {
  free: 2,
  studio: 7,
  creator: 17,
  producer: 'unlimited',
  mogul: 'unlimited',
};

// FAME growth multipliers by subscription tier
export const FAME_GROWTH_MULTIPLIERS: Record<PlanType, number> = {
  free: 1.0,
  studio: 1.5,
  creator: 2.0,
  producer: 2.5,
  mogul: 3.0,
};

// Achievement milestone thresholds and FAME bonuses
export const ACHIEVEMENT_MILESTONES = {
  gold: {
    salesRequired: 500000,
    fameBonus: 0.05, // +5% FAME growth
  },
  platinum: {
    salesRequired: 2000000,
    fameBonus: 0.25, // +25% FAME growth
  },
  diamond: {
    salesRequired: 10000000,
    fameBonus: 0.45, // +45% FAME growth
  },
};

// ============================================================================
// CARD DESIGN SYSTEM
// ============================================================================

// Available card design styles
export const CardDesignType = z.enum([
  'ghosts_online',        // Default free design - clean cyan borders
  'cyberpunk_holo',       // Premium: Rainbow gradients, circuit patterns, glow effects
  'vintage_weathered',    // Premium: Aged textures, decorative borders, lightning
  'modern_sleek',         // Premium: Professional, stage lighting, premium typography
  'neon_arcade',          // Premium: 80s retro, pixel effects, vibrant colors
  'dark_carnival',        // Special: Halloween themed
  'winter_frost',         // Special: Winter/holiday themed
  'gold_anniversary',     // Special: Platform anniversary
]);
export type CardDesignType = z.infer<typeof CardDesignType>;

// Card design metadata
export interface CardDesignInfo {
  id: CardDesignType;
  name: string;
  description: string;
  price: number; // Credits cost (0 = free default)
  rarity: 'common' | 'premium' | 'special' | 'legendary';
  available: boolean; // False for limited-time designs not currently available
  previewUrl?: string; // URL to preview image (optional for now, can be generated later)
  unlockedByDefault: boolean; // True for free designs like ghosts_online
}

// Card design catalog with pricing
export const CARD_DESIGNS: Record<CardDesignType, CardDesignInfo> = {
  ghosts_online: {
    id: 'ghosts_online',
    name: 'Ghosts Online',
    description: 'The original design - clean, professional, timeless',
    price: 0, // Free default
    rarity: 'common',
    available: true,
    unlockedByDefault: true, // Everyone gets this
  },
  cyberpunk_holo: {
    id: 'cyberpunk_holo',
    name: 'Cyberpunk Holographic',
    description: 'Rainbow gradient borders, circuit patterns, neon glow effects',
    price: 2000,
    rarity: 'legendary',
    available: true,
    unlockedByDefault: false,
  },
  vintage_weathered: {
    id: 'vintage_weathered',
    name: 'Vintage Weathered',
    description: 'Aged textures, decorative corner flourishes, lightning effects',
    price: 800,
    rarity: 'premium',
    available: true,
    unlockedByDefault: false,
  },
  modern_sleek: {
    id: 'modern_sleek',
    name: 'Modern Sleek',
    description: 'Professional look with stage lighting and premium typography',
    price: 1200,
    rarity: 'premium',
    available: true,
    unlockedByDefault: false,
  },
  neon_arcade: {
    id: 'neon_arcade',
    name: 'Neon Arcade',
    description: '80s retro vibes with pixel effects and vibrant colors',
    price: 1000,
    rarity: 'premium',
    available: true,
    unlockedByDefault: false,
  },
  dark_carnival: {
    id: 'dark_carnival',
    name: 'Dark Carnival',
    description: 'Spooky Halloween theme with dark mystique',
    price: 500,
    rarity: 'special',
    available: false, // Only available in October
    unlockedByDefault: false,
  },
  winter_frost: {
    id: 'winter_frost',
    name: 'Winter Frost',
    description: 'Icy winter wonderland with frost effects',
    price: 500,
    rarity: 'special',
    available: false, // Only available in December
    unlockedByDefault: false,
  },
  gold_anniversary: {
    id: 'gold_anniversary',
    name: 'Gold Anniversary',
    description: 'Exclusive anniversary edition with gold accents',
    price: 0, // Free during anniversary week
    rarity: 'special',
    available: false, // Only available during platform anniversary
    unlockedByDefault: false,
  },
};

// User's owned card designs table
export const ownedCardDesigns = pgTable("owned_card_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  designId: varchar("design_id").notNull(), // CardDesignType
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export type OwnedCardDesign = typeof ownedCardDesigns.$inferSelect;

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
