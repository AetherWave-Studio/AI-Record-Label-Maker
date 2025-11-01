-- Fix dev user subscription plan from 'all_access' to 'mogul'
-- This fixes the bug where validateMusicModel fails because 'all_access'
-- doesn't exist in PLAN_FEATURES

UPDATE users
SET subscription_plan = 'mogul',
    credits = 10000,
    updated_at = NOW()
WHERE id = 'dev-user-123';
