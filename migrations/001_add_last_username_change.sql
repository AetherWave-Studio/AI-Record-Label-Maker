-- Add lastUsernameChange field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_username_change ON users(last_username_change);

COMMENT ON COLUMN users.last_username_change IS 'Timestamp of the last username change, used for 30-day restriction';