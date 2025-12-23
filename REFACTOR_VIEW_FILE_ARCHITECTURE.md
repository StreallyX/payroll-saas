# View File Functionality - Client/Server Architecture Refactoring

## Summary

This refactoring addresses a critical architectural issue where client-side pages were directly importing and calling server-only S3 functions. This violated the Next.js client/server boundary and caused the View button to fail silently.

## Changes Made

### 1. New API Route: `/api/files/view`

**File**: `app/api/files/view/route.ts`

**Purpose**: Server-side file viewing with proper authentication and authorization.

**Features**:
- ✅ Requires user authentication (via NextAuth session)
- ✅ Validates file access permissions
- ✅ Supports user-owned files and admin access
- ✅ Generates signed S3 URLs with 1-hour expiration
- ✅ Returns proper error responses (401, 403, 404, 500)
- ✅ Designed for reusability across modules

**API Usage**:
```typescript
// GET /api/files/view?filePath=uploads/onboarding/{userId}/...
const response = await fetch(`/api/files/view?filePath=${encodeURIComponent(filePath)}`);
const data = await response.json();
// Returns: { success: true, url: "https://s3-signed-url..." }
```

**Security Model**:
- Users can access their own files
- Admins can access all files (checked via permissions: `onboarding.read`, `onboarding.write`, `users.read`, `users.write`, `global.admin`)
- File ownership is extracted from the file path structure

### 2. Updated Client Components

**Files Modified**:
- `app/(dashboard)/(modules)/onboarding/my-onboarding/page.tsx`
- `app/(dashboard)/(modules)/onboarding/page.tsx`

**Changes**:
- ❌ Removed direct import of `downloadFile` from `@/lib/s3`
- ✅ Updated `handleViewFile` function to call the API route
- ✅ Added proper error handling with user-friendly toast notifications
- ✅ Improved loading states and popup blocker fallbacks

**Before**:
```typescript
import { downloadFile } from "@/lib/s3";

const handleViewFile = async (filePath: string) => {
  const url = await downloadFile(filePath); // ❌ Client calling server-only code
  window.open(url, "_blank");
};
```

**After**:
```typescript
const handleViewFile = async (filePath: string) => {
  const response = await fetch(`/api/files/view?filePath=${encodeURIComponent(filePath)}`);
  const data = await response.json();
  window.open(data.url, "_blank");
};
```

### 3. Server-Only Documentation

**File**: `lib/s3.ts`

Added clear documentation at the top of the file indicating it's server-only:

```typescript
/**
 * SERVER-ONLY MODULE
 * 
 * This module uses AWS SDK and must ONLY be imported in server-side code:
 * - API routes (app/api routes)
 * - Server Actions
 * - TRPC procedures
 * - Server Components (with proper "use server" directive)
 * 
 * DO NOT import this module in client components or pages marked with "use client".
 * 
 * For client-side file operations, use the API routes:
 * - File viewing: /api/files/view
 * - File upload: /api/upload
 */
```

## Architecture Benefits

### ✅ Proper Separation of Concerns
- Client code handles UI and user interactions
- Server code handles AWS SDK operations and sensitive credentials
- Clear boundary between client and server

### ✅ Security Improvements
- AWS credentials never exposed to the browser
- Proper authentication checks on the server
- Permission validation before file access
- Signed URLs with expiration

### ✅ Reliability
- Server-side code runs in a controlled environment
- No client-side AWS SDK issues
- Consistent behavior across browsers

### ✅ Reusability
- API route can be used by any module (contracts, invoices, documents)
- Extensible permission model
- Consistent error handling

## Permission Model

### User Access
- Users can view **their own** files
- File ownership is determined by the file path: `uploads/onboarding/{userId}/...`

### Admin Access
Admins can view **all files** if they have any of these permissions:
- `onboarding.read`
- `onboarding.write`
- `users.read`
- `users.write`
- `global.admin`

### Path Structure Support
Currently supports:
- `uploads/onboarding/{userId}/{questionId}/{filename}`

Can be extended for:
- `uploads/contracts/{userId}/...`
- `uploads/invoices/{userId}/...`
- Any module following the same pattern

## Error Handling

### API Route Errors
| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing filePath parameter | No file path provided |
| 401 | Unauthorized | User not logged in |
| 403 | Forbidden | User doesn't have permission to access file |
| 404 | File not found | File doesn't exist in S3 |
| 500 | Server error | S3 error or other server issue |

### Client-Side Handling
- Loading states during API calls
- Toast notifications for user feedback
- Popup blocker fallback (creates temporary anchor element)
- Detailed error messages from server

## Testing

### Test Scenarios

1. **Regular User - Own Files** ✅
   - User should be able to view their own onboarding files
   - Should see success toast and file opens in new tab

2. **Regular User - Other User's Files** ❌
   - Should receive 403 Forbidden error
   - Should see error toast notification

3. **Admin User - Any Files** ✅
   - Admin should be able to view all user files
   - Should see success toast and file opens in new tab

4. **Unauthenticated Access** ❌
   - Should receive 401 Unauthorized error
   - Should see error toast notification

5. **Invalid File Path** ❌
   - Should receive 404 Not Found error
   - Should see error toast notification

6. **Different File Types** ✅
   - PDFs should open inline
   - Images should display inline
   - Word docs should download
   - All file types handled correctly

### Testing Steps

```bash
# 1. Start the development server
npm run dev

# 2. Log in as a regular user
# 3. Navigate to My Onboarding
# 4. Upload a file and try to view it (should work)
# 5. Try to access another user's file URL directly (should fail)

# 6. Log in as an admin
# 7. Navigate to All Onboardings
# 8. View any user's files (should work)
```

## Migration Notes

### For Developers

If you're adding file viewing to other modules:

1. **Use the API route**:
   ```typescript
   const response = await fetch(`/api/files/view?filePath=${encodeURIComponent(filePath)}`);
   const data = await response.json();
   window.open(data.url, "_blank");
   ```

2. **Never import S3 utilities in client components**:
   ```typescript
   // ❌ DON'T DO THIS
   import { downloadFile } from "@/lib/s3";
   
   // ✅ DO THIS INSTEAD
   // Use /api/files/view
   ```

3. **Extend permission checks if needed**:
   Edit `app/api/files/view/route.ts` and add your module's permissions to `adminPermissions` array.

### Backward Compatibility

- ✅ No breaking changes to existing functionality
- ✅ File paths remain the same
- ✅ S3 storage structure unchanged
- ✅ All existing files accessible through new API

## Future Enhancements

### Potential Improvements
1. Add module-specific permission checks (e.g., `module` query parameter)
2. Support file download vs. inline viewing toggle
3. Add file access logging for audit trails
4. Implement file preview generation
5. Add rate limiting for file access
6. Support batch file URL generation

### Example Future API
```typescript
// GET /api/files/view?filePath=...&module=contracts&download=true
// GET /api/files/batch?filePaths[]=...&filePaths[]=...
```

## Deployment Notes

1. ✅ Build successful - no compilation errors
2. ✅ All S3 imports are now server-side only
3. ✅ API route is properly configured
4. ✅ Client components updated

## Git Commit

```bash
git add .
git commit -m "refactor: Move View File functionality to proper client/server architecture

- Create /api/files/view API route with authentication and permission checks
- Update onboarding pages to use API route instead of direct S3 access
- Add server-only documentation to lib/s3.ts
- Fix architectural issue where client components imported server-only code
- Implement proper permission model for file access
- Add comprehensive error handling and user feedback"
```

## References

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth Session Management](https://next-auth.js.org/getting-started/client#usesession)
- [AWS S3 Signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)
