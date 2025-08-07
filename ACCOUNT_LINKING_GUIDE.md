# 🔗 Account Linking Guide: Portfolio ↔ AI Learning Integration

## 📋 **The Challenge**

You have **two authentication systems** that need to work together:

### **Portfolio System** (Standalone)
- Uses **email + password** authentication
- Users created accounts directly in Portfolio
- Supabase profiles table with unique user IDs

### **AI Learning Platform** (Master)
- Uses **Gmail OAuth** authentication  
- Generates JWT tokens for SSO
- Has its own user IDs and email addresses

## 🎯 **Account Linking Scenarios**

Our SSO implementation handles **4 distinct scenarios**:

### **Scenario 1: New User (Auto-Creation)**
```
User: john@company.com (Gmail OAuth in AI Learning)
Portfolio: No account exists
Action: ✅ CREATE new Portfolio account
Result: Seamless onboarding
```

### **Scenario 2: Existing Portfolio User (Account Linking)**
```
User: john@company.com (existing Portfolio email+password)
AI Learning: john@company.com (Gmail OAuth)  
Action: ✅ LINK accounts using email match
Result: Single identity across both systems
```

### **Scenario 3: Already Linked User (Profile Sync)**
```
User: Previously linked via SSO
Action: ✅ UPDATE profile with latest AI Learning data
Result: Data stays synchronized
```

### **Scenario 4: Email Change (Update Sync)**
```
User: Changed email in AI Learning
Action: ✅ UPDATE email in Portfolio to match
Result: Consistent identity
```

## 🔍 **Email-Based Account Resolution**

### **How We Identify Users**
```typescript
// Step 1: Check by email (for account linking)
const existingByEmail = await supabase
  .from('profiles')
  .select('*')
  .eq('email', userData.email)  // 🔑 Email is the key!
  .single();

// Step 2: Check by AI Learning user_id (for already linked)
const existingById = await supabase
  .from('profiles') 
  .select('*')
  .eq('id', userData.user_id)
  .single();
```

### **Decision Matrix**
| Email Match | ID Match | Action | Scenario |
|-------------|----------|--------|----------|
| ❌ | ❌ | CREATE new account | New user |
| ✅ | ❌ | LINK existing account | Portfolio user comes from AI Learning |
| ❌ | ✅ | UPDATE email | AI Learning user changed email |
| ✅ | ✅ | UPDATE profile | Already linked user |

## 🛠️ **Implementation Details**

### **Account Linking Process**
```typescript
// When Portfolio user comes from AI Learning for first time
if (existingProfileByEmail && !existingProfileById) {
  // LINK accounts
  await supabase.from('profiles').update({
    ai_learning_user_id: userData.user_id,  // Store AI Learning ID
    linked_at: new Date().toISOString(),    // Track when linked
    sync_source: 'ai-learning',             // Mark as synced
    // ... update other profile data
  }).eq('id', existingProfileByEmail.id);   // Use existing Portfolio ID
  
  // Use Portfolio ID for authentication (keeps existing data)
  userData.user_id = existingProfileByEmail.id;
}
```

### **Database Schema Requirements**
The `profiles` table needs these additional columns:
```sql
-- Add columns for account linking
ALTER TABLE profiles ADD COLUMN ai_learning_user_id UUID;
ALTER TABLE profiles ADD COLUMN linked_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN sync_source VARCHAR(50);

-- Optional: Create index for faster lookups
CREATE INDEX idx_profiles_ai_learning_id ON profiles(ai_learning_user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
```

## 🔐 **Authentication Flow**

### **Traditional Portfolio Auth**
```
User → Email/Password → Supabase Auth → Portfolio Dashboard
```

### **SSO Auth (AI Learning)**
```
User → AI Learning (Gmail OAuth) → JWT Token → Portfolio SSO → Portfolio Dashboard
                                      ↓
                            Account Resolution:
                            - Link existing by email
                            - Create new if needed
                            - Update profile data
```

## 📊 **User Data Mapping**

### **AI Learning → Portfolio Sync**
```typescript
{
  // Identity mapping
  user_id: "ai-learning-uuid",           → id (or link to existing)
  email: "user@domain.com",              → email (primary identifier)
  full_name: "John Doe",                 → first_name + last_name
  
  // Role/permission mapping  
  role: "TEACHER",                       → role (TEACHER/STUDENT)
  
  // Metadata
  workspace_id: "workspace-123",         → workspace_id
  source: "ai-learning",                 → sync_source
  
  // Linking info
  ai_learning_user_id: "ai-uuid",        → ai_learning_user_id
  linked_at: "2024-01-01T00:00:00Z"      → linked_at
}
```

## 🧪 **Testing Scenarios**

### **Test 1: New User**
1. Create user in AI Learning (Gmail OAuth)
2. Click "Portfolio" button  
3. **Expected**: New Portfolio account created automatically
4. **Verify**: User can access Portfolio features

### **Test 2: Existing Portfolio User**
1. Create user in Portfolio (email+password)
2. Create same email user in AI Learning (Gmail OAuth)
3. Click "Portfolio" from AI Learning
4. **Expected**: Accounts linked, no duplicate created
5. **Verify**: Original Portfolio data preserved

### **Test 3: Already Linked User**
1. User previously linked via SSO
2. Update profile in AI Learning
3. Click "Portfolio" again
4. **Expected**: Portfolio profile updated with new data
5. **Verify**: Changes reflected in Portfolio

### **Test 4: Email Change**
1. User linked via SSO
2. Change email in AI Learning
3. Access Portfolio via SSO
4. **Expected**: Portfolio email updated to match
5. **Verify**: User can still access their data

## ⚠️ **Important Considerations**

### **Data Preservation**
- When linking accounts, **Portfolio data is preserved**
- AI Learning becomes the **source of truth** for profile info
- Existing assignments, projects remain intact

### **Authentication Precedence**
- Users coming from AI Learning → **SSO authentication**
- Users going directly to Portfolio → **Traditional authentication**
- Same user, different auth paths, same data

### **Error Handling**
- Email conflicts logged and handled gracefully
- Failed linking attempts don't create duplicates
- Clear error messages for debugging

## 🎉 **Benefits of This Approach**

- ✅ **No Data Loss**: Existing Portfolio users keep their data
- ✅ **Single Identity**: One user, one account, multiple access paths
- ✅ **Seamless UX**: Users don't know they're switching systems
- ✅ **Future-Proof**: Supports additional auth providers
- ✅ **Audit Trail**: Track when/how accounts were linked

---

**This implementation provides bullet-proof account consolidation between your two systems!** 🚀