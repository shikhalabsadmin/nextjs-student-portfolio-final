# Portfolio System SSO Integration Documentation

## 📋 Overview

This document outlines the SSO (Single Sign-On) implementation completed in the **Portfolio System** to enable seamless integration with the **AI Learning Platform**.

## 🚀 Implementation Status

✅ **COMPLETE** - Portfolio system is ready for SSO integration

### What Has Been Implemented

1. **JWT Token Validation Endpoint**: `/sso/login`
2. **User Profile Synchronization**: Automatic user creation/updates
3. **Authentication Context Integration**: SSO users work with existing auth system
4. **Role-Based Redirection**: Users redirected based on their role
5. **Comprehensive Error Handling**: Robust error handling and logging

## 🔧 Technical Implementation Details

### 1. SSO Login Endpoint

**URL**: `https://your-portfolio-domain.com/sso/login?token={JWT_TOKEN}`

**Method**: GET (via URL parameter)

**Purpose**: Validates JWT token and authenticates user

### 2. JWT Payload Structure Expected

The Portfolio system expects the following JWT payload structure:

```typescript
interface SSOUserData {
  // Required fields
  user_id: string;           // Unique user identifier
  email: string;             // User email address
  full_name: string;         // User's full name
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
  
  // Optional fields
  grade?: string;            // Student grade/class
  subjects?: string[];       // Teaching subjects (for teachers)
  bio?: string;              // User biography
  school_name?: string;      // School name
  workspace_id: string;      // AI Learning workspace ID
  workspace_role: string;    // Role in the workspace
  source: string;           // Must be 'ai-learning' or 'ai-learning-guest'
}
```

### 3. Role Mapping

| AI Learning Role | Portfolio Role | Redirect Destination |
|------------------|----------------|---------------------|
| `teacher`        | `TEACHER`      | `/teacher` (assignments dashboard) |
| `admin`          | `TEACHER`      | `/teacher` (assignments dashboard) |
| `workspace_admin`| `TEACHER`      | `/teacher` (assignments dashboard) |
| `student`        | `STUDENT`      | `/student` (student dashboard) |
| `guest_student`  | `STUDENT`      | `/student` (student dashboard) |
| `parent`         | `PARENT`       | `/student` (student dashboard) |
| `super_admin`    | `ADMIN`        | `/teacher` (assignments dashboard) |

### 4. Environment Variables Required

#### Portfolio System (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# SSO Configuration
VITE_PORTFOLIO_SHARED_SECRET=sso_super_secure_key_2024_portfolio_ai_learning_platform_integration_xyz789
```

#### AI Learning Platform (.env.local)
```bash
# Portfolio Integration
PORTFOLIO_URL=https://student-portfolio-nine-green.vercel.app
PORTFOLIO_SHARED_SECRET=sso_super_secure_key_2024_portfolio_ai_learning_platform_integration_xyz789
```

**⚠️ CRITICAL**: Both systems MUST use the **exact same shared secret**

## 🔐 Security Implementation

### JWT Token Security
- **Signature Validation**: Verifies token using shared secret
- **Expiration Check**: Tokens expire after 24 hours
- **Issuer/Audience Validation**: Validates token metadata
- **Error Handling**: Invalid tokens redirect to login with error

### Data Security
- **Profile Sync**: User profiles stored/updated in Supabase
- **Authentication State**: SSO users integrated with existing auth system
- **Session Management**: Proper session cleanup on logout

## 🔄 User Flow

### Standard User Flow
1. User clicks "Open Portfolio" in AI Learning Platform
2. AI Learning Platform generates JWT token with user data
3. User redirected to: `https://portfolio-domain.com/sso/login?token={JWT}`
4. Portfolio validates token and creates/updates user profile
5. Portfolio sets authentication state in localStorage
6. User redirected to appropriate dashboard based on role

### Guest User Flow
1. Guest user clicks "Open Portfolio" in AI Learning Platform
2. AI Learning Platform generates JWT with guest user data
3. Same validation and redirect process
4. Guest user treated as regular student in Portfolio system

## 🏗️ Files Modified/Created

### New Files
- `src/pages/SSOLogin.tsx` - SSO login component and logic

### Modified Files
- `src/App.tsx` - Added SSO route to router
- `src/config/routes.ts` - Added SSO route constant
- `src/hooks/useAuthState.ts` - Updated to support SSO authentication
- `package.json` - Added JWT dependencies

### Dependencies Added
- `jsonwebtoken` - JWT token validation
- `@types/jsonwebtoken` - TypeScript types

## 🧪 Testing Instructions

### Pre-requisites
1. Portfolio system deployed with SSO implementation
2. Environment variables configured in both systems
3. Same shared secret used in both systems

### Test Scenarios

#### Test 1: Teacher SSO Login
1. Login as teacher in AI Learning Platform
2. Click "Open Portfolio" button
3. **Expected**: Redirect to `/teacher` dashboard
4. **Verify**: User profile created/updated in Portfolio Supabase

#### Test 2: Student SSO Login
1. Login as student in AI Learning Platform
2. Click "Open Portfolio" button
3. **Expected**: Redirect to `/student` dashboard
4. **Verify**: User can access student features

#### Test 3: Guest User SSO
1. Access AI Learning as guest user
2. Click "Open Portfolio" button  
3. **Expected**: Redirect to `/student` dashboard
4. **Verify**: Guest treated as student user

#### Test 4: Invalid Token Handling
1. Manually visit `/sso/login?token=invalid_token`
2. **Expected**: Redirect to homepage with error parameter
3. **Verify**: No authentication state set

### Debugging Tools

#### Browser Developer Tools
- Check Network tab for API calls
- Check Console for SSO-related logs
- Check Application > Local Storage for auth state

#### Portfolio System Logs
- SSO login attempts logged with module "SSOLogin"
- Authentication state changes logged with module "Auth:Hook"

## 🚨 Common Issues & Solutions

### Issue: "SSO shared secret not configured"
**Solution**: Ensure `VITE_PORTFOLIO_SHARED_SECRET` is set in Portfolio `.env`

### Issue: "No SSO token provided"
**Solution**: Verify AI Learning Platform is appending `?token=` parameter

### Issue: "JWT malformed" or "invalid signature"
**Solution**: Ensure both systems use identical shared secret

### Issue: User redirected to login instead of dashboard
**Solution**: Check JWT payload structure and required fields

### Issue: Profile not created in Supabase
**Solution**: Verify Supabase permissions and table schema

## 📞 Support & Contact

### Portfolio System Repository
- **URL**: https://github.com/shikhalabsadmin/nextjs-student-portfolio-final
- **Latest Commit**: SSO implementation (commit: 8784c74)

### Integration Status
- ✅ Portfolio system SSO endpoint: **READY**
- ⏳ AI Learning Platform integration: **PENDING VERIFICATION**
- ⏳ End-to-end testing: **PENDING**

## 🔄 Next Steps for AI Learning Team

1. **Verify JWT payload structure** matches expected format
2. **Confirm environment variables** are configured correctly
3. **Test token generation** with provided shared secret
4. **Execute end-to-end test** with Portfolio system
5. **Report any issues** for resolution

---

**Documentation Generated**: ${new Date().toISOString()}  
**Portfolio System Version**: Latest (post-SSO implementation)  
**Integration Type**: JWT-based SSO with profile synchronization