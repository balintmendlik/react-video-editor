# Remotion Lambda Rendering - Complete Example

This guide shows you exactly how to implement video rendering following the Remotion Lambda best practices.

## 📋 The Recommended Flow (Remotion Docs)

According to Remotion documentation, the recommended approach is:

1. **Deploy function once** - Deploy a Lambda function (one-time per Remotion version)
2. **Retrieve function programmatically** - Use `getFunctions()` with `compatibleOnly: true` to get function names (useful after Node.js restarts)
3. **Deploy site** - Bundle and upload your Remotion compositions
4. **Start render** - Trigger video rendering with `renderMediaOnLambda()`
5. **Poll progress** - Check render status with `getRenderProgress()`

## 🚀 Implementation

### Step 1: Deploy Function (One-Time)

```typescript
import { deployRenderFunction } from '@/lib/remotion-lambda'

// Deploy once per Remotion version
const { functionName } = await deployRenderFunction()
console.log('Function deployed:', functionName)
// Output: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec"
```

**Via API:**
```bash
curl -X POST http://localhost:3000/api/remotion/deploy
```

### Step 2: Retrieve Function Name (After Restart)

```typescript
import { getFunctions } from '@remotion/lambda'

// Get all compatible functions
const functions = await getFunctions({
  region: 'us-east-1',
  compatibleOnly: true, // Only functions matching current Remotion version
})

const functionName = functions[0].functionName
```

**Our Helper Function:**
```typescript
import { getCompatibleFunctionName } from '@/lib/remotion-lambda'

// Simplified - returns first compatible function or null
const functionName = await getCompatibleFunctionName()
```

**Via API:**
```bash
# Get all compatible functions
curl -X GET http://localhost:3000/api/remotion/functions

# Get first compatible function name
curl -X POST http://localhost:3000/api/remotion/functions/compatible
```

### Step 3: Deploy Site

```typescript
import { getOrCreateBucket, deploySite } from '@remotion/lambda'
import path from 'path'

// Create bucket
const { bucketName } = await getOrCreateBucket({
  region: 'us-east-1',
})

// Deploy site
const { serveUrl } = await deploySite({
  bucketName,
  entryPoint: path.resolve(process.cwd(), 'remotion/root.tsx'),
  region: 'us-east-1',
  siteName: 'my-video', // Pass same name to overwrite on redeploy
})
```

**Our Helper Function:**
```typescript
import { setupRemotionInfrastructure } from '@/lib/remotion-lambda'

// Does everything: bucket + function + site
const { bucketName, functionName, serveUrl } = await setupRemotionInfrastructure('my-video')
```

**Via API:**
```bash
# Deploy site only
curl -X POST http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{"siteName": "my-video"}'

# Complete setup (bucket + function + site)
curl -X PUT http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{"siteName": "my-video"}'
```

### Step 4: Start Render

```typescript
import { renderMediaOnLambda } from '@remotion/lambda'

const { renderId, bucketName } = await renderMediaOnLambda({
  region: 'us-east-1',
  functionName,
  serveUrl,
  composition: 'VideoWithCaptions',
  inputProps: {
    trackItems: [...],
    videoWidth: 1080,
    videoHeight: 1920,
    fps: 30,
    durationInSeconds: 10,
  },
  codec: 'h264',
  imageFormat: 'jpeg',
  maxRetries: 1,
  framesPerLambda: 20,
  privacy: 'public',
})

console.log('Render started:', renderId)
```

**Our Helper Function:**
```typescript
import { renderVideo } from '@/lib/remotion-lambda'

const { renderId, bucketName } = await renderVideo({
  functionName,
  serveUrl,
  composition: 'VideoWithCaptions',
  inputProps: { /* ... */ },
  codec: 'h264',
  imageFormat: 'jpeg',
  maxRetries: 1,
  framesPerLambda: 20,
  privacy: 'public',
})
```

**Via API:**
```bash
curl -X POST http://localhost:3000/api/remotion/render \
  -H "Content-Type: application/json" \
  -d '{
    "trackItems": [...],
    "videoWidth": 1080,
    "videoHeight": 1920,
    "fps": 30,
    "durationInSeconds": 10,
    "codec": "h264",
    "imageFormat": "jpeg",
    "maxRetries": 1,
    "framesPerLambda": 20,
    "privacy": "public"
  }'
```

### Step 5: Poll for Progress

```typescript
import { getRenderProgress } from '@remotion/lambda'

const progress = await getRenderProgress({
  renderId,
  bucketName,
  functionName,
  region: 'us-east-1',
})

console.log('Status:', progress.done ? 'COMPLETED' : 'PROCESSING')
console.log('Progress:', progress.overallProgress)
console.log('Output:', progress.outputFile)
```

**Our Helper Function:**
```typescript
import { checkRenderProgress } from '@/lib/remotion-lambda'

const progress = await checkRenderProgress(renderId, functionName)

console.log('Status:', progress.status) // "PROCESSING" | "COMPLETED" | "FAILED"
console.log('Progress:', progress.progress) // 0-1
console.log('Output URL:', progress.outputUrl)
```

**Via API:**
```bash
curl "http://localhost:3000/api/remotion/render?renderId=abc123&functionName=remotion-render-4-0-377-mem2048mb-disk2048mb-120sec"
```

## 💻 Complete Frontend Example

```typescript
// 1. Get function name (reuse after restart)
async function getFunctionName(): Promise<string> {
  const response = await fetch('/api/remotion/functions/compatible', {
    method: 'POST',
  })
  const data = await response.json()
  
  if (!data.functionName) {
    // Deploy new function
    const deployResponse = await fetch('/api/remotion/deploy', {
      method: 'POST',
    })
    const deployData = await deployResponse.json()
    return deployData.functionName
  }
  
  return data.functionName
}

// 2. Start render
async function startRender(trackItems: any[]) {
  const response = await fetch('/api/remotion/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackItems,
      videoWidth: 1080,
      videoHeight: 1920,
      fps: 30,
      durationInSeconds: 10,
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 1,
      framesPerLambda: 20,
      privacy: 'public',
    }),
  })
  
  const data = await response.json()
  return data
}

// 3. Poll for progress
async function pollProgress(renderId: string, functionName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/remotion/render?renderId=${renderId}&functionName=${functionName}`
        )
        const progress = await response.json()
        
        console.log(`Progress: ${Math.round(progress.progress * 100)}%`)
        
        if (progress.status === 'COMPLETED') {
          clearInterval(interval)
          resolve(progress.outputUrl)
        } else if (progress.status === 'FAILED') {
          clearInterval(interval)
          reject(new Error('Render failed'))
        }
      } catch (error) {
        clearInterval(interval)
        reject(error)
      }
    }, 2500) // Poll every 2.5 seconds
  })
}

// 4. Complete flow
async function exportVideo(trackItems: any[]) {
  try {
    // Start render
    const { renderId, functionName } = await startRender(trackItems)
    console.log('Render started:', renderId)
    
    // Wait for completion
    const videoUrl = await pollProgress(renderId, functionName)
    console.log('Video ready:', videoUrl)
    
    // Download video
    window.location.href = videoUrl
  } catch (error) {
    console.error('Export failed:', error)
  }
}
```

## 🎯 React Hook Example

```typescript
import { useState, useCallback } from 'react'

interface RenderState {
  isRendering: boolean
  progress: number
  status: 'idle' | 'rendering' | 'completed' | 'failed'
  outputUrl: string | null
  error: string | null
}

export function useVideoRender() {
  const [state, setState] = useState<RenderState>({
    isRendering: false,
    progress: 0,
    status: 'idle',
    outputUrl: null,
    error: null,
  })

  const startRender = useCallback(async (trackItems: any[]) => {
    setState({
      isRendering: true,
      progress: 0,
      status: 'rendering',
      outputUrl: null,
      error: null,
    })

    try {
      // Start render
      const response = await fetch('/api/remotion/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackItems,
          videoWidth: 1080,
          videoHeight: 1920,
          fps: 30,
          durationInSeconds: 10,
        }),
      })

      const { renderId, functionName } = await response.json()

      // Poll for progress
      const interval = setInterval(async () => {
        const progressResponse = await fetch(
          `/api/remotion/render?renderId=${renderId}&functionName=${functionName}`
        )
        const progressData = await progressResponse.json()

        setState((prev) => ({
          ...prev,
          progress: progressData.progress,
        }))

        if (progressData.status === 'COMPLETED') {
          clearInterval(interval)
          setState({
            isRendering: false,
            progress: 1,
            status: 'completed',
            outputUrl: progressData.outputUrl,
            error: null,
          })
        } else if (progressData.status === 'FAILED') {
          clearInterval(interval)
          setState({
            isRendering: false,
            progress: progressData.progress,
            status: 'failed',
            outputUrl: null,
            error: 'Render failed',
          })
        }
      }, 2500)
    } catch (error) {
      setState({
        isRendering: false,
        progress: 0,
        status: 'failed',
        outputUrl: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [])

  return {
    ...state,
    startRender,
  }
}

// Usage in component
function ExportButton({ trackItems }: { trackItems: any[] }) {
  const { isRendering, progress, status, outputUrl, startRender } = useVideoRender()

  const handleExport = () => {
    startRender(trackItems)
  }

  if (status === 'completed' && outputUrl) {
    return <a href={outputUrl} download>Download Video</a>
  }

  return (
    <button onClick={handleExport} disabled={isRendering}>
      {isRendering ? `Rendering... ${Math.round(progress * 100)}%` : 'Export Video'}
    </button>
  )
}
```

## ⚙️ Configuration Options

### renderMediaOnLambda Parameters

```typescript
{
  region: 'us-east-1',              // AWS region
  functionName: string,              // Lambda function name
  serveUrl: string,                  // Deployed site URL
  composition: 'VideoWithCaptions',  // Composition ID
  inputProps: {},                    // Props for composition
  codec: 'h264' | 'h265',           // Video codec (default: h264)
  imageFormat: 'jpeg' | 'png',      // Image format (default: jpeg)
  maxRetries: 1,                     // Retry failed renders (default: 1)
  framesPerLambda: 20,               // Frames per Lambda invocation (default: 20)
  privacy: 'public' | 'private',    // S3 object privacy (default: public)
  outName?: string,                  // Custom output file name
}
```

### Optimization Tips

**framesPerLambda:**
- Lower value (10-20): More parallel Lambda invocations, faster but more expensive
- Higher value (40-80): Fewer invocations, slower but cheaper
- Default: 20 (good balance)

**codec:**
- `h264`: Better compatibility, larger files
- `h265`: Better compression, smaller files, less compatible

**imageFormat:**
- `jpeg`: Smaller, faster, lossy
- `png`: Larger, slower, lossless

**maxRetries:**
- `0`: No retries (fail fast)
- `1`: Retry once (recommended)
- `2+`: More retries (slower, more expensive)

## 📊 Cost Optimization

```typescript
// Cheapest (slower)
await renderVideo({
  framesPerLambda: 80,
  imageFormat: 'jpeg',
  codec: 'h264',
  maxRetries: 0,
})

// Fastest (more expensive)
await renderVideo({
  framesPerLambda: 10,
  imageFormat: 'png',
  codec: 'h265',
  maxRetries: 2,
})

// Balanced (recommended)
await renderVideo({
  framesPerLambda: 20,
  imageFormat: 'jpeg',
  codec: 'h264',
  maxRetries: 1,
})
```

## 🐛 Error Handling

```typescript
try {
  const { renderId, functionName } = await startRender(trackItems)
  const outputUrl = await pollProgress(renderId, functionName)
  console.log('Success:', outputUrl)
} catch (error) {
  if (error.message.includes('credentials')) {
    console.error('AWS credentials not configured')
  } else if (error.message.includes('timeout')) {
    console.error('Render timeout - increase Lambda timeout')
  } else if (error.message.includes('compatible')) {
    console.error('No compatible functions - deploy a new one')
  } else {
    console.error('Render failed:', error)
  }
}
```

## 📚 Resources

- [Remotion Lambda Docs](https://www.remotion.dev/docs/lambda)
- [renderMediaOnLambda API](https://www.remotion.dev/docs/lambda/rendermediaonlambda)
- [getFunctions API](https://www.remotion.dev/docs/lambda/getfunctions)
- [getRenderProgress API](https://www.remotion.dev/docs/lambda/getrenderprogress)

