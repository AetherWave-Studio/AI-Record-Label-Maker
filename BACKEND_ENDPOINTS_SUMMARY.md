# Backend Profile Management Endpoints

## Overview
The following backend endpoints have been implemented or updated to support profile management functionality with username restrictions and profile image uploads.

## Database Schema Update
- Added `lastUsernameChange` timestamp field to the `users` table
- Migration script: `migrations/001_add_last_username_change.sql`

## API Endpoints

### 1. Profile Image Upload (Existing - Enhanced)
**Endpoint:** `POST /api/user/profile-image`
**Auth:** Required
**Description:** Uploads a profile image using IMGBB service

**Request:** `multipart/form-data`
- `profileImage`: Image file (max 5MB, JPEG/PNG/GIF/WebP)

**Response:**
```json
{
  "success": true,
  "profileImageUrl": "https://i.ibb.co/..."
}
```

### 2. Update User Profile (Enhanced)
**Endpoint:** `PATCH /api/user/profile`
**Auth:** Required
**Description:** Updates user profile information with username change restrictions

**Request:** `application/json`
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "new_username",
  "vocalGenderPreference": "m"
}
```

**Username Validation Rules:**
- Must be 3-20 characters
- Can contain letters, numbers, underscores, and hyphens
- Can only be changed once every 30 days
- Must be unique (case-insensitive)

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "new_username",
  "lastUsernameChange": "2025-11-06T18:00:00.000Z",
  "usernameChanged": true,
  "profileImageUrl": "https://i.ibb.co/...",
  "subscriptionPlan": "studio",
  "credits": 1000
}
```

**Error Responses:**
- `429 Too Many Requests`: Username changed too recently
  ```json
  {
    "message": "Username can only be changed once every 30 days. Please wait 15 more days.",
    "daysRemaining": 15,
    "lastUsernameChange": "2025-10-22T18:00:00.000Z"
  }
  ```
- `400 Bad Request`: Invalid username format or taken username
- `404 Not Found`: User not found

### 3. Get User Information (Existing - Now includes new field)
**Endpoint:** `GET /api/auth/user`
**Auth:** Required
**Description:** Returns current user profile information

**Response:** Full user object including `lastUsernameChange` field

### 4. Get Username Restriction Info (New)
**Endpoint:** `GET /api/user/username-restriction`
**Auth:** Required
**Description:** Returns information about when the user can next change their username

**Response:**
```json
{
  "canChangeUsername": false,
  "daysRemaining": 15,
  "lastUsernameChange": "2025-10-22T18:00:00.000Z",
  "nextChangeDate": "2025-11-21T18:00:00.000Z"
}
```

## Implementation Details

### Username Change Logic
1. **Check Existing Record:** If user has `lastUsernameChange`, calculate days since change
2. **Validate 30-Day Window:** If less than 30 days, reject with days remaining
3. **Validate New Username:**
   - Length: 3-20 characters
   - Format: alphanumeric + underscores + hyphens only
   - Uniqueness: Database-level unique constraint
4. **Update Record:** On successful change, set `lastUsernameChange` to current timestamp

### Profile Image Upload
- Uses IMGBB service for image hosting
- Supports JPEG, PNG, GIF, WebP formats
- Maximum file size: 5MB
- Images are stored permanently (no expiration)
- Updates `profileImageUrl` field in database

### Storage Layer Updates
- `MemStorage.upsertUser()`: Handles `lastUsernameChange` field
- `DbStorage.upsertUser()`: Database operations with new field
- Existing `updateUserProfileImage()` method unchanged

### Database Migration
```sql
-- Add lastUsernameChange field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_username_change ON users(last_username_change);
```

## Frontend Integration Notes

### Profile Page Usage
1. **Load User Data:** Use `GET /api/auth/user` to get current profile
2. **Check Username Restrictions:** Use `GET /api/user/username-restriction` to display lock badge
3. **Upload Profile Image:** Use `POST /api/user/profile-image` with file upload
4. **Update Profile:** Use `PATCH /api/user/profile` for text field updates

### Error Handling
- Handle `429` status for username restrictions
- Display `daysRemaining` to user when locked
- Show appropriate error messages for validation failures
- Refresh user data after successful updates

### Cache Invalidation
- Invalidate `/api/auth/user` query cache after profile updates
- Update local state to reflect changes immediately
- Show success notifications to user

## Security Considerations
- All endpoints require authentication
- File upload validation (type, size)
- Username format validation
- Rate limiting via 30-day restriction
- Database constraints prevent duplicate usernames