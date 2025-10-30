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
  subscriptionPlan: varchar("subscription_plan").default('free').notNull(), // 'free', 'starter', 'studio', 'creator', 'all_access'
  lastCreditReset: timestamp("last_credit_reset").defaultNow().notNull(),
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

// Free tier credit system constants
export const FREE_TIER_WELCOME_BONUS = 50; // One-time 50 credits on signup
export const FREE_TIER_DAILY_CREDITS = 10; // 10 credits per day
export const FREE_TIER_CREDIT_CAP = 50;    // Max 50 credits (quest rewards can exceed cap, but daily credits won't be added if >= 50)

// Plan-based feature restrictions
export const PlanType = z.enum(['free', 'starter', 'studio', 'creator', 'all_access']);
export type PlanType = z.infer<typeof PlanType>;

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
  maxCreditsPerMonth?: number; // Monthly credit pool for paid plans
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
    allowedImageEngines: ['dall-e-2'], // Only basic engine
    allowedMusicModels: ['V3_5', 'V4'], // Only beginner models
    maxCreditsPerDay: 10,  // 10 credits/day + 50 welcome bonus (cap at 50, quest rewards can exceed cap but daily credits won't be added if >= 50)
    maxAudioUploadSizeMB: 10, // Free users: 10MB limit (MP3 only, ~10 minutes)
    commercialLicense: false,
    apiAccess: false,
  },
  starter: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: false, // No WAV (upsell to Studio)
    allowedVideoResolutions: ['512p', '720p', '1080p'], // All except 4K
    allowedVideoModels: ['seedance-lite', 'sora2'], // Seedance Lite + SORA 2! (the hook)
    allowedImageEngines: ['dall-e-2', 'dall-e-3'], // DALL-E 2 & 3
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All music models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 200, // 200 credits/month (no daily reset)
    maxAudioUploadSizeMB: 50, // 50MB limit (between free and paid)
    commercialLicense: true,
    apiAccess: false,
  },
  studio: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['512p', '720p', '1080p', '4k'], // All resolutions
    allowedVideoModels: ['seedance-lite', 'seedance-pro-fast', 'seedance-pro', 'sora2'], // Seedance + Sora 2
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 500, // 500 credits/month for video/images (music unlimited)
    maxAudioUploadSizeMB: 100, // Studio users: 100MB limit (WAV support, ~8 minutes)
    commercialLicense: true,
    apiAccess: false,
  },
  creator: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['512p', '720p', '1080p', '4k'], // All resolutions
    allowedVideoModels: ['seedance-lite', 'seedance-pro-fast', 'seedance-pro', 'sora2', 'veo3_fast'], // All available models
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 2000, // 2000 credits/month for video/images
    maxAudioUploadSizeMB: 100, // Creator users: 100MB limit (WAV support, ~8 minutes)
    commercialLicense: true,
    apiAccess: false,
  },
  all_access: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['512p', '720p', '1080p', '4k'], // All resolutions
    allowedVideoModels: ['seedance-lite', 'seedance-pro-fast', 'seedance-pro', 'sora2', 'veo3_fast'], // All available models
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    maxCreditsPerMonth: 5000, // 5000 credit cap (fair-use rate limits)
    maxAudioUploadSizeMB: 100, // All Access users: 100MB limit (WAV support, ~8 minutes)
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
  midjourney_generation: 3,    // KIE.ai Midjourney: $0.04 API (4 images) + 50% margin = $0.06 total
  wav_conversion: 3,           // $0.02 API + 50% margin = $0.03
};

// Plans that have unlimited access to specific services
export const UNLIMITED_SERVICE_PLANS: Record<ServiceType, PlanType[]> = {
  music_generation: ['starter', 'studio', 'creator', 'all_access'], // Unlimited music for all paid plans!
  video_generation: ['all_access'], // Only All Access has unlimited video
  image_generation: ['all_access'], // Only All Access has unlimited images
  album_art_generation: ['all_access'], // Album art unlimited for All Access plan
  midjourney_generation: ['all_access'], // Midjourney unlimited for All Access plan
  wav_conversion: ['studio', 'creator', 'all_access'], // WAV conversion free for Studio+ plans
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
