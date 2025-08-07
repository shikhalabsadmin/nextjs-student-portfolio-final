# 🗄️ Database Migration Required for Account Linking

## ⚠️ **Important: Schema Update Needed**

The account linking functionality requires **additional columns** in your `profiles` table. Please run this migration before testing SSO.

## 📋 **Required Database Changes**

### **SQL Migration Script**
```sql
-- Add columns for account linking
ALTER TABLE profiles ADD COLUMN ai_learning_user_id UUID;
ALTER TABLE profiles ADD COLUMN linked_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN sync_source VARCHAR(50);

-- Create indexes for better performance
CREATE INDEX idx_profiles_ai_learning_id ON profiles(ai_learning_user_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Optional: Add comments for documentation
COMMENT ON COLUMN profiles.ai_learning_user_id IS 'User ID from AI Learning Platform for account linking';
COMMENT ON COLUMN profiles.linked_at IS 'Timestamp when account was linked to AI Learning';
COMMENT ON COLUMN profiles.sync_source IS 'Source platform for profile data (ai-learning, manual, etc.)';
```

### **Supabase Migration Steps**

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run the Migration**
   - Copy the SQL script above
   - Paste into SQL Editor
   - Click **Run** to execute

3. **Verify Changes**
   - Go to **Table Editor**
   - Select `profiles` table
   - Confirm new columns are present:
     - `ai_learning_user_id` (uuid, nullable)
     - `linked_at` (timestamp, nullable)  
     - `sync_source` (varchar, nullable)

## 🎯 **Column Purpose**

### **ai_learning_user_id**
- **Type**: UUID (nullable)
- **Purpose**: Stores the user ID from AI Learning Platform
- **Used for**: Linking existing Portfolio users to AI Learning accounts

### **linked_at**
- **Type**: TIMESTAMP (nullable)
- **Purpose**: Records when the account was first linked
- **Used for**: Audit trail and debugging

### **sync_source**
- **Type**: VARCHAR(50) (nullable)
- **Purpose**: Tracks where profile data came from
- **Values**: 'ai-learning', 'manual', 'signup', etc.

## 🔄 **Migration Impact**

### **Existing Data**
- ✅ **Safe**: No existing data will be lost
- ✅ **Compatible**: New columns are nullable
- ✅ **Backward Compatible**: Existing Portfolio users continue working

### **New Users**
- AI Learning users: All columns populated
- Direct Portfolio signups: Only base columns populated
- Linked accounts: `ai_learning_user_id` and `linked_at` added

## 🧪 **Testing the Migration**

### **Before Migration**
SSO will **fail** with error:
```
column "ai_learning_user_id" of relation "profiles" does not exist
```

### **After Migration**  
SSO will **succeed** with logging:
```
[SSOLogin] Linking existing Portfolio account with AI Learning
[SSOLogin] SSO login successful, redirecting user
```

## 📊 **Data Examples**

### **New AI Learning User**
```sql
INSERT INTO profiles (
  id, email, first_name, last_name, role,
  ai_learning_user_id, linked_at, sync_source
) VALUES (
  'ai-learning-uuid', 'user@domain.com', 'John', 'Doe', 'TEACHER',
  'ai-learning-uuid', NOW(), 'ai-learning'
);
```

### **Linked Existing User**
```sql
-- Before: Portfolio user
{ id: 'portfolio-uuid', email: 'user@domain.com', ... }

-- After: Linked to AI Learning
UPDATE profiles SET 
  ai_learning_user_id = 'ai-learning-uuid',
  linked_at = NOW(),
  sync_source = 'ai-learning'
WHERE id = 'portfolio-uuid';
```

## ⚡ **Quick Migration Command**

If you have Supabase CLI installed:
```bash
# Create migration file
supabase migration new add_account_linking_columns

# Add the SQL to the generated file, then apply:
supabase db push
```

## 🔍 **Verification Queries**

### **Check Migration Success**
```sql
-- Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('ai_learning_user_id', 'linked_at', 'sync_source');
```

### **Check Linked Accounts**
```sql
-- See linked accounts
SELECT id, email, ai_learning_user_id, linked_at, sync_source
FROM profiles 
WHERE ai_learning_user_id IS NOT NULL;
```

## 🚨 **Don't Skip This Step!**

**The SSO will not work without this migration.** Please run it before testing the account linking functionality.

---

**Status**: Migration required before SSO testing  
**Priority**: High - blocks SSO functionality