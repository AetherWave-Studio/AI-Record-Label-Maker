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
  subscriptionPlan: varchar("subscription_plan").default('free').notNull(), // 'free', 'studio', 'creator', 'all_access'
  lastCreditReset: timestamp("last_credit_reset").defaultNow().notNull(),
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

// Plan-based feature restrictions
export const PlanType = z.enum(['free', 'studio', 'creator', 'all_access']);
export type PlanType = z.infer<typeof PlanType>;

// Video resolution options (for future video generation)
export const VideoResolution = z.enum(['720p', '1080p', '4k']);
export type VideoResolution = z.infer<typeof VideoResolution>;

// Image engine options (for future image generation)
export const ImageEngine = z.enum(['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion']);
export type ImageEngine = z.infer<typeof ImageEngine>;

// Music model options (existing)
export const MusicModel = z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']);
export type MusicModel = z.infer<typeof MusicModel>;

// Plan feature access definitions
export interface PlanFeatures {
  musicGeneration: boolean;
  videoGeneration: boolean;
  imageGeneration: boolean;
  wavConversion: boolean; // Convert audio to high-quality WAV format
  allowedVideoResolutions: VideoResolution[];
  allowedImageEngines: ImageEngine[];
  allowedMusicModels: MusicModel[];
  maxCreditsPerDay: number | 'unlimited';
  commercialLicense: boolean;
  apiAccess: boolean;
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: false, // WAV conversion is paid-only
    allowedVideoResolutions: ['720p'], // Only lowest resolution
    allowedImageEngines: ['dall-e-2'], // Only basic engine
    allowedMusicModels: ['V3_5', 'V4'], // Only beginner models
    maxCreditsPerDay: 50,
    commercialLicense: false,
    apiAccess: false,
  },
  studio: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['720p', '1080p', '4k'], // All resolutions
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    commercialLicense: true,
    apiAccess: false,
  },
  creator: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['720p', '1080p', '4k'], // All resolutions
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
    commercialLicense: true,
    apiAccess: false,
  },
  all_access: {
    musicGeneration: true,
    videoGeneration: true,
    imageGeneration: true,
    wavConversion: true, // WAV conversion available
    allowedVideoResolutions: ['720p', '1080p', '4k'], // All resolutions
    allowedImageEngines: ['dall-e-2', 'dall-e-3', 'flux', 'midjourney', 'stable-diffusion'], // All engines
    allowedMusicModels: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], // All models
    maxCreditsPerDay: 'unlimited',
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
  optionType: 'videoResolutions' | 'imageEngines' | 'musicModels'
): T[] {
  const featureMap = {
    videoResolutions: 'allowedVideoResolutions',
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
  'wav_conversion'
]);
export type ServiceType = z.infer<typeof ServiceType>;

// Credit cost configuration for each service type
export const SERVICE_CREDIT_COSTS: Record<ServiceType, number> = {
  music_generation: 5,
  video_generation: 10,
  image_generation: 3,
  wav_conversion: 2,
};

// Plans that have unlimited access to specific services
export const UNLIMITED_SERVICE_PLANS: Record<ServiceType, PlanType[]> = {
  music_generation: ['studio', 'creator', 'all_access'],
  video_generation: ['all_access'],
  image_generation: ['all_access'],
  wav_conversion: ['studio', 'creator', 'all_access'], // WAV conversion free for paid plans
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
