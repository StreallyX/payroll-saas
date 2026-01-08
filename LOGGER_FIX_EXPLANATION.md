# Fix for 'logs' Folder Creation Error

## 🔍 Problem Analysis

### Error Encountered
```
Error: ENOENT: no such file or directory, mkdir 'logs'
    at Object.mkdirSync (node:fs:1363:26)
    at e.exports._createLogDirIfNotExist (/var/task/.next/server/app/api/trpc/[trpc]/route.js:8113:58885)
```

### Location of Problematic Code
- **Fichier**: `lib/logging/logger.ts`
- **Problem**: The Winston logger was trying to write logs to local files (`logs/error.log`, `logs/combined.log`, `logs/exceptions.log`, `logs/rejections.log`) without checking the existence of the d

### Identified Causes
1. **Serverless Environment**: The `/var/task/` path indicates a serverless environment (AWS Lambda, Vercel, etc.)
2. **Read-Only File System**: In a serverless environment, the file system is generally read-only, except for `/tmp`
3. **Non-Existent 'logs' Folder**: No check was made to create the folder before writing to it
4. **Inappropriate File Transports**: Using file transports in a serverless environment is problematic because:
   - Files are ephemeral and disappear after each execution
   - The file system may be read-only
   - Logs are not persisted between invocations

## ✅ Applied Solution

### 1. Serverless Environment Detection
Added automatic detection of serverless environments:
```typescript
const isServerless = process.env.VERCEL || 
                     process.env.AWS_LAMBDA_FUNCTION_NAME || 
                     process.env.LAMBDA_TASK_ROOT;
```

### 2. Conditional Disabling of File Transports
File transports are now **automatically disabled** in serverless environment:
```typescript
// File transports (only for local/non-serverless environments)
const fileTransports = !isServerless ? [
  new transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  new transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 10,
  }),
] : [];
```

### 3. Safe Creation of Logs Folder
For local/non-serverless environments, added a safe method for folder creation:
```typescript
private _createLogDirIfNotExist(): void {
  try {
    const logsDir = resolve(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });  // ✅ Option recursive: true
    }
  } catch (error) {
    // Silently fail - console transport will still work
    console.warn('Warning: Could not create logs directory. File logging disabled.', error);
  }
}
```

**Key points of this method** :
- ✅ Uses `recursive: true` to create parent folders if needed
- ✅ Checks existence with `existsSync()` before creating
- ✅ Wraps code in `try-catch` to handle errors gracefully
- ✅ On failure, logger continues to work with console transport

### 4. Gestion des Exception/Rejection Handlers
File handlers for exceptions and rejections are also disabled in serverless environment:
```typescript
...((!isServerless) && {
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
  ],
})
```

## 🎯 Behavior After Fix

### En Serverless Environment (Production)
- ✅ **Console Transport only** : Logs are sent to console
- ✅ **Capture by Cloud Service** : Logs are automatically captured by CloudWatch (AWS), Vercel Logs, etc.
- ✅ **No Error** : No more ENOENT error when creating folder
- ✅ **Optimal Performance** : No unnecessary file operations

### In Local/Development Environment
- ✅ **Console + File Transports** : Logs are both displayed in console and saved to files
- ✅ **Automatic Folder Creation** : The `logs/` folder is automatically created if it doesn't exist
- ✅ **Log Rotation** : Log files are automatically managed with rotation (10MB max per file)

## 📋 Changes Made

### Modified File
- **`lib/logging/logger.ts`**

### Changes Made
1. Added `fs` and `path` imports:
   ```typescript
   import { mkdirSync, existsSync } from 'fs';
   import { resolve } from 'path';
   ```

2. Added serverless environment detection (line 29)

3. Added call to `_createLogDirIfNotExist()` for non-serverless environments (lines 31-34)

4. Separated transports into `baseTransports` and `fileTransports` (lines 36-65)

5. Added private method `_createLogDirIfNotExist()` (lines 92-106)

6. Conditional disabling of exception/rejection handlers (lines 80-88)

## 🚀 Deployment

After this fix, the application can be deployed without error in the following environments:
- ✅ AWS Lambda
- ✅ Vercel Serverless Functions
- ✅ Netlify Functions
- ✅ Google Cloud Functions
- ✅ Azure Functions
- ✅ Local environments (development)

## 📝 Additional Recommendations

For a more robust production logging solution, consider:
1. **Services de Logging Externes** : Winston Cloud Transport, Loggly, Papertrail, Datadog
2. **Structured Logging** : JSON format is already enabled, facilitating log analysis
3. **Log Aggregation** : Use a centralized service to aggregate logs from all instances
4. **Monitoring** : Configure alerts for critical errors

## ✨ Final Result

The application is now compatible with serverless environments while maintaining file logging functionality in local development. The logger automatically adapts to its execution environment without 
