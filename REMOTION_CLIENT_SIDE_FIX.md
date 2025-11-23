# Remotion Client-Side Bundle Fix

## Problem

The error you encountered:

```
Module not found: Can't resolve '@remotion/compositor-win32-x64-msvc'
```

This happens because Next.js was trying to bundle `@remotion/lambda` and related server-only packages for the client (browser) side. These packages contain platform-specific binaries and should NEVER be bundled for the browser.

## Solution Applied

We've implemented three layers of protection:

### 1. Next.js Webpack Configuration

Updated `next.config.ts` to exclude Remotion server packages from client bundle:

```typescript
webpack: (config, { isServer }) => {
  // Exclude Remotion packages from client-side bundle
  if (!isServer) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@remotion/lambda': false,
      '@remotion/renderer': false,
      '@remotion/bundler': false,
      '@remotion/cli': false,
      // Platform-specific compositor packages
      '@remotion/compositor-win32-x64-msvc': false,
      '@remotion/compositor-darwin-x64': false,
      '@remotion/compositor-darwin-arm64': false,
      '@remotion/compositor-linux-x64-gnu': false,
      '@remotion/compositor-linux-arm64-gnu': false,
    };
  }
  return config;
}
```

### 2. Server-Only Import Guard

Added `server-only` package import to `src/lib/remotion-lambda.ts`:

```typescript
// Prevent this module from being imported on the client side
import 'server-only'
```

This will throw a build-time error if anyone tries to import this module from client code.

### 3. Proper API Route Structure

All Remotion operations are isolated to API routes (which run server-side only):
- `/api/remotion/deploy` - Lambda function deployment
- `/api/remotion/site` - Site deployment
- `/api/remotion/render` - Video rendering
- `/api/remotion/bucket` - S3 bucket management
- `/api/remotion/functions` - Function retrieval

## How It Works Now

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                     │
│  - React components                                      │
│  - State management (use-download-state.ts)              │
│  - Makes fetch() calls to API routes                    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP Requests
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVER (API Routes)                     │
│  - /api/remotion/* endpoints                            │
│  - Imports remotion-lambda.ts                           │
│  - Uses @remotion/lambda package                        │
│  - Calls AWS Lambda                                     │
└─────────────────────────────────────────────────────────┘
```

## Restart Required

**Important:** You must restart your dev server for the Next.js config changes to take effect:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Verification

After restarting, you should:

1. ✅ No more webpack errors about `@remotion/compositor-*`
2. ✅ Export button works
3. ✅ API routes can use Remotion packages
4. ✅ Client-side code is smaller (Remotion not bundled)

## What If It Still Doesn't Work?

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules
   pnpm install
   npm run dev
   ```

3. **Check browser console** for any new errors

4. **Check terminal** for server-side errors

## Technical Details

### Why This Happened

- `@remotion/lambda` uses `@remotion/renderer`
- `@remotion/renderer` uses platform-specific compositor binaries
- These binaries are native code (`.node` files) for Windows, macOS, Linux
- Webpack can't bundle native binaries for the browser
- Next.js tries to create a client bundle by default for all imports

### Why Our Solution Works

1. **Webpack aliasing**: Tells webpack "when you see this import on the client, replace it with `false`" (meaning don't include it)
2. **server-only**: Runtime/build-time check that throws an error if imported on client
3. **API Routes**: Next.js API routes are server-only by default, safe place for Remotion code

### Similar Packages That Need This Treatment

If you add other server-only packages in the future:
- Database drivers (pg, mysql2, etc.)
- File system operations (fs-extra)
- Child process operations
- AWS SDK packages
- Any package with native binaries

Just add them to the webpack alias config:

```typescript
if (!isServer) {
  config.resolve.alias = {
    ...config.resolve.alias,
    'your-server-package': false,
  };
}
```

## Files Modified

1. `next.config.ts` - Added webpack config for client-side exclusions
2. `src/lib/remotion-lambda.ts` - Added `server-only` import
3. `package.json` - Added `server-only` dependency

## Resources

- [Next.js Webpack Config](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [Server-Only Package](https://www.npmjs.com/package/server-only)
- [Remotion Lambda Docs](https://www.remotion.dev/docs/lambda)

