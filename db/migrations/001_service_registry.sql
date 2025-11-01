-- Migration: Add service_registry table
-- Created: 2025-10-31
-- Purpose: Centralize all service configuration in database instead of hardcoded values

CREATE TABLE IF NOT EXISTS service_registry (
  id VARCHAR PRIMARY KEY,
  display_name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,

  -- Timeout & Performance
  typical_time_seconds INTEGER NOT NULL,
  typical_time_seconds_max INTEGER NOT NULL,
  max_timeout_seconds INTEGER NOT NULL,
  poll_interval_ms INTEGER DEFAULT 2000,

  -- Credit & Pricing
  credit_cost INTEGER NOT NULL,
  is_dynamic_pricing INTEGER DEFAULT 0,

  -- Success Tracking (updated in real-time)
  success_rate INTEGER DEFAULT 95,
  total_attempts INTEGER DEFAULT 0,
  total_successes INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  total_timeouts INTEGER DEFAULT 0,
  total_refunds INTEGER DEFAULT 0,

  -- Status & Availability
  is_active INTEGER DEFAULT 1 NOT NULL,
  is_async_service INTEGER DEFAULT 0,
  auto_refund_enabled INTEGER DEFAULT 1,

  -- Metadata
  description TEXT,
  technical_notes TEXT,
  last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for faster lookups by category and active status
CREATE INDEX IF NOT EXISTS idx_service_registry_category ON service_registry(category);
CREATE INDEX IF NOT EXISTS idx_service_registry_active ON service_registry(is_active);
CREATE INDEX IF NOT EXISTS idx_service_registry_provider ON service_registry(provider);

-- Seed initial service data based on current implementation
INSERT INTO service_registry (
  id, display_name, category, provider,
  typical_time_seconds, typical_time_seconds_max, max_timeout_seconds, poll_interval_ms,
  credit_cost, is_dynamic_pricing,
  success_rate, is_active, is_async_service, auto_refund_enabled,
  description, technical_notes
) VALUES
  -- Music Generation
  (
    'music_generation',
    'Music Generation (SUNO)',
    'music',
    'kie-ai',
    120, -- 2 minutes typical (lower bound)
    240, -- 4 minutes typical (upper bound)
    360, -- 6 minutes max timeout
    2000, -- Poll every 2 seconds
    18, -- Credit cost
    0, -- Not dynamic pricing
    95, -- 95% success rate
    1, -- Active
    1, -- Async service (polling required)
    1, -- Auto-refund enabled
    'Generate full music tracks with lyrics using SUNO AI via KIE.ai API. Supports custom prompts, vocal gender selection, and returns 2 track variations.',
    'KIE.ai task-based API. Status codes: PENDING → TEXT_SUCCESS → FIRST_SUCCESS → SUCCESS. Explicit failures: GENERATE_AUDIO_FAILED, SENSITIVE_WORD_ERROR. Typical generation: 2-4 min, max supported: 10 min.'
  ),

  -- Album Art Generation (DALL-E 3)
  (
    'album_art_generation',
    'Album Art (DALL-E 3)',
    'image',
    'openai',
    15, -- 15 seconds typical (lower bound)
    30, -- 30 seconds typical (upper bound)
    60, -- 60 seconds max timeout
    NULL, -- Synchronous, no polling
    9, -- Credit cost
    0, -- Not dynamic pricing
    96, -- 96% success rate
    1, -- Active
    0, -- Synchronous service
    1, -- Auto-refund enabled
    'Generate professional album cover art using OpenAI DALL-E 3. Supports multiple styles and aspect ratios.',
    'OpenAI synchronous API. Either succeeds or fails immediately. Timeout is HTTP request timeout.'
  ),

  -- Image Generation (Nano Banana)
  (
    'image_generation',
    'Image Generation (Nano Banana)',
    'image',
    'fal-ai',
    10, -- 10 seconds typical (lower bound)
    20, -- 20 seconds typical (upper bound)
    60, -- 60 seconds max timeout
    NULL, -- Synchronous
    12, -- Credit cost
    0, -- Not dynamic pricing
    97, -- 97% success rate
    1, -- Active
    0, -- Synchronous service
    1, -- Auto-refund enabled
    'Fast image generation using Fal.ai Nano Banana model. Supports reference images and multiple aspect ratios.',
    'Fal.ai synchronous subscribe API. Completes in 5-20 seconds typically.'
  ),

  -- Midjourney Generation (Fast)
  (
    'midjourney_generation',
    'Midjourney (Fast)',
    'image',
    'ttapi',
    30, -- 30 seconds typical (lower bound)
    60, -- 60 seconds typical (upper bound)
    180, -- 3 minutes max timeout
    2000, -- Poll every 2 seconds
    6, -- Credit cost
    0, -- Not dynamic pricing
    82, -- 82% success rate
    1, -- Active
    1, -- Async service
    1, -- Auto-refund enabled
    'Generate high-quality images with Midjourney Fast mode via ttapi.io. Returns 4 image variations.',
    'ttapi.io async API. Typically 30-60s. Already has timeout refund implemented in routes.ts:1623-1650.'
  ),

  -- Midjourney Generation (Turbo)
  (
    'midjourney_generation_turbo',
    'Midjourney (Turbo)',
    'image',
    'ttapi',
    15, -- 15 seconds typical (lower bound)
    40, -- 40 seconds typical (upper bound)
    120, -- 2 minutes max timeout
    2000, -- Poll every 2 seconds
    12, -- Credit cost
    0, -- Not dynamic pricing
    89, -- 89% success rate
    1, -- Active
    1, -- Async service
    1, -- Auto-refund enabled
    'Generate high-quality images with Midjourney Turbo mode (faster). Returns 4 image variations.',
    'ttapi.io async API. Typically 15-40s. Already has timeout refund implemented.'
  ),

  -- Video Generation (Seedance Lite)
  (
    'video_generation_seedance_lite',
    'Video Generation (Seedance Lite)',
    'video',
    'fal-ai',
    30, -- 30 seconds typical (lower bound)
    90, -- 90 seconds typical (upper bound)
    180, -- 3 minutes max timeout
    NULL, -- Synchronous via subscribe
    10, -- Base credit cost (dynamic pricing applies)
    1, -- Dynamic pricing based on resolution/duration
    92, -- 92% success rate
    1, -- Active
    0, -- Synchronous via subscribe
    1, -- Auto-refund enabled
    'Fast video generation using Fal.ai Seedance Lite model. Supports text-to-video and image-to-video.',
    'Fal.ai synchronous subscribe API. Pricing varies by resolution (480p-1080p) and duration (3-15s). Uses calculateVideoCredits() function.'
  ),

  -- Video Generation (Seedance Pro)
  (
    'video_generation_seedance_pro',
    'Video Generation (Seedance Pro)',
    'video',
    'fal-ai',
    60, -- 60 seconds typical (lower bound)
    180, -- 180 seconds typical (upper bound)
    300, -- 5 minutes max timeout
    NULL, -- Synchronous via subscribe
    20, -- Base credit cost (dynamic pricing applies)
    1, -- Dynamic pricing
    90, -- 90% success rate
    1, -- Active
    0, -- Synchronous via subscribe
    1, -- Auto-refund enabled
    'High-quality video generation using Fal.ai Seedance Pro model. Higher quality than Lite.',
    'Fal.ai synchronous subscribe API. Higher resolution and longer durations supported. Dynamic pricing.'
  ),

  -- WAV Conversion
  (
    'wav_conversion',
    'WAV Conversion',
    'audio',
    'kie-ai',
    5, -- 5 seconds typical (lower bound)
    15, -- 15 seconds typical (upper bound)
    30, -- 30 seconds max timeout
    2000, -- Poll every 2 seconds
    6, -- Credit cost
    0, -- Not dynamic pricing
    99, -- 99% success rate
    1, -- Active
    1, -- Async service
    1, -- Auto-refund enabled
    'Convert audio files to high-quality WAV format using KIE.ai SUNO API.',
    'KIE.ai task-based API. Very fast conversion, rarely times out.'
  )
ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_service_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update 'updated_at'
DROP TRIGGER IF EXISTS service_registry_updated_at ON service_registry;
CREATE TRIGGER service_registry_updated_at
  BEFORE UPDATE ON service_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_service_registry_updated_at();

COMMENT ON TABLE service_registry IS 'Centralized service configuration and metadata. Single source of truth for timeouts, credit costs, success rates, and service status.';
COMMENT ON COLUMN service_registry.typical_time_seconds IS 'Lower bound of typical completion time range';
COMMENT ON COLUMN service_registry.typical_time_seconds_max IS 'Upper bound of typical completion time range';
COMMENT ON COLUMN service_registry.max_timeout_seconds IS 'Hard timeout - after this, auto-refund is triggered';
COMMENT ON COLUMN service_registry.success_rate IS 'Percentage (0-100) based on historical data, updated from total_successes/total_attempts';
COMMENT ON COLUMN service_registry.total_attempts IS 'Incremented when generation starts';
COMMENT ON COLUMN service_registry.total_successes IS 'Incremented when generation completes successfully';
COMMENT ON COLUMN service_registry.total_failures IS 'Incremented when generation fails explicitly (not timeout)';
COMMENT ON COLUMN service_registry.total_timeouts IS 'Incremented when generation exceeds max_timeout_seconds';
COMMENT ON COLUMN service_registry.total_refunds IS 'Incremented when auto-refund is processed';
