# Remotion Lambda API Reference

Complete API documentation for all Remotion Lambda endpoints.

## 🔧 Base Configuration

All endpoints require AWS credentials in environment variables:

```bash
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
REMOTION_AWS_REGION=us-east-1
```

Base URL: `http://localhost:3000/api/remotion` (development)

---

## 📦 Bucket Management

### Create or Get S3 Bucket

**Endpoint:** `POST /api/remotion/bucket`

Creates an S3 bucket for Remotion if it doesn't exist, or returns the existing one.

**Request:**
```bash
curl -X POST http://localhost:3000/api/remotion/bucket
```

**Response:**
```json
{
  "success": true,
  "bucketName": "remotion-lambda-abcd1234"
}
```

**Errors:**
- `400`: AWS credentials not configured
- `500`: Failed to create/get bucket

---

## ⚡ Lambda Function Management

### Deploy Lambda Function

**Endpoint:** `POST /api/remotion/deploy`

Deploys a new Lambda function for Remotion rendering.

**Request:**
```bash
curl -X POST http://localhost:3000/api/remotion/deploy
```

**Response:**
```json
{
  "success": true,
  "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
  "alreadyExisted": false
}
```

**Configuration:**
- Memory: 2048 MB
- Timeout: 120 seconds
- Architecture: ARM64

### List Deployed Functions

**Endpoint:** `GET /api/remotion/deploy`

Lists all deployed Remotion Lambda functions.

**Request:**
```bash
curl -X GET http://localhost:3000/api/remotion/deploy
```

**Response:**
```json
{
  "success": true,
  "functions": [
    {
      "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      "version": "4.0.377",
      "memorySizeInMb": 2048,
      "timeoutInSeconds": 120
    }
  ]
}
```

### Ensure Function Exists

**Endpoint:** `PUT /api/remotion/deploy`

Gets an existing compatible function or deploys a new one.

**Request:**
```bash
curl -X PUT http://localhost:3000/api/remotion/deploy
```

**Response:**
```json
{
  "success": true,
  "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec"
}
```

---

## 🌐 Site Deployment

### Deploy Remotion Site

**Endpoint:** `POST /api/remotion/site`

Deploys your Remotion compositions to S3.

**Request:**
```bash
curl -X POST http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "my-video-site"
  }'
```

**Parameters:**
- `siteName` (optional): Name for the site. If provided, subsequent deploys will overwrite the previous deployment.

**Response:**
```json
{
  "success": true,
  "serveUrl": "https://remotion-lambda-abcd1234.s3.us-east-1.amazonaws.com/sites/my-video-site/",
  "siteName": "my-video-site",
  "bucketName": "remotion-lambda-abcd1234"
}
```

### Complete Infrastructure Setup

**Endpoint:** `PUT /api/remotion/site`

Creates bucket, deploys function, and deploys site in one call.

**Request:**
```bash
curl -X PUT http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "my-video-site"
  }'
```

**Response:**
```json
{
  "success": true,
  "bucketName": "remotion-lambda-abcd1234",
  "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
  "serveUrl": "https://remotion-lambda-abcd1234.s3.us-east-1.amazonaws.com/sites/my-video-site/",
  "siteName": "my-video-site"
}
```

---

## 🎬 Video Rendering

### Start Render

**Endpoint:** `POST /api/remotion/render`

Starts rendering a video with captions. Handles complete setup automatically.

**Request:**
```bash
curl -X POST http://localhost:3000/api/remotion/render \
  -H "Content-Type: application/json" \
  -d '{
    "trackItems": [
      {
        "id": "video1",
        "type": "video",
        "display": { "from": 0, "to": 10000 },
        "details": {
          "src": "https://example.com/video.mp4",
          "width": 1080,
          "height": 1920,
          "volume": 100
        }
      },
      {
        "id": "caption1",
        "type": "caption",
        "display": { "from": 0, "to": 5000 },
        "details": {
          "words": [
            { "word": "Hello", "start": 0, "end": 500 },
            { "word": "World", "start": 500, "end": 1000 }
          ],
          "fontSize": 48,
          "fontFamily": "Arial",
          "color": "#ffffff",
          "activeColor": "#ffff00"
        }
      }
    ],
    "background": {
      "type": "color",
      "value": "transparent"
    },
    "videoWidth": 1080,
    "videoHeight": 1920,
    "fps": 30,
    "durationInSeconds": 10,
    "siteName": "video-editor-site"
  }'
```

**Parameters:**

Required:
- `trackItems`: Array of track items (videos, captions, images, text, audio)

Optional:
- `background`: Background configuration (default: transparent)
  - `type`: "color" or "image"
  - `value`: Color hex or image URL
- `videoWidth`: Video width in pixels (default: 1080)
- `videoHeight`: Video height in pixels (default: 1920)
- `fps`: Frames per second (default: 30)
- `durationInSeconds`: Video duration (default: 10)
- `siteName`: Site name for deployment (default: "video-editor-site")

**Response:**
```json
{
  "success": true,
  "renderId": "abc123def456",
  "bucketName": "remotion-lambda-abcd1234",
  "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
  "siteName": "video-editor-site"
}
```

**What it does:**
1. Creates S3 bucket (if needed)
2. Deploys Lambda function (if needed)
3. Deploys Remotion site
4. Starts video render
5. Returns render ID for tracking

### Check Render Progress

**Endpoint:** `GET /api/remotion/render`

Checks the progress of an ongoing render.

**Request:**
```bash
curl "http://localhost:3000/api/remotion/render?renderId=abc123def456&functionName=remotion-render-4-0-377-mem2048mb-disk2048mb-120sec"
```

**Parameters:**
- `renderId`: Render ID from start render response
- `functionName`: Function name from start render response

**Response (Processing):**
```json
{
  "success": true,
  "status": "PROCESSING",
  "progress": 0.45,
  "outputFile": null,
  "outputUrl": null,
  "costs": {
    "estimatedCost": 0.05
  },
  "timeElapsed": 12000
}
```

**Response (Completed):**
```json
{
  "success": true,
  "status": "COMPLETED",
  "progress": 1,
  "outputFile": "s3://remotion-lambda-abcd1234/renders/abc123def456.mp4",
  "outputUrl": "https://remotion-lambda-abcd1234.s3.us-east-1.amazonaws.com/renders/abc123def456.mp4?X-Amz-Algorithm=...",
  "costs": {
    "estimatedCost": 0.08
  },
  "timeElapsed": 25000
}
```

**Response (Failed):**
```json
{
  "success": true,
  "status": "FAILED",
  "progress": 0.23,
  "errors": [
    {
      "message": "Error rendering frame 150",
      "stack": "..."
    }
  ]
}
```

**Status Values:**
- `PENDING`: Render queued but not started
- `PROCESSING`: Actively rendering
- `COMPLETED`: Render finished successfully
- `FAILED`: Render failed with errors

---

## 📊 Track Item Schemas

### Video Track Item

```typescript
{
  id: string
  type: "video"
  display: {
    from: number  // milliseconds
    to: number    // milliseconds
  }
  details: {
    src: string          // Video URL
    width: number        // Video width
    height: number       // Video height
    volume?: number      // 0-100 (default: 100)
    x?: number           // X position (default: 0)
    y?: number           // Y position (default: 0)
    rotation?: number    // Rotation in degrees (default: 0)
    crop?: {
      x: number
      y: number
      width: number
      height: number
    }
  }
  trim?: {
    from: number  // milliseconds
    to: number    // milliseconds
  }
  playbackRate?: number  // 0.1-10 (default: 1)
}
```

### Caption Track Item

```typescript
{
  id: string
  type: "caption"
  display: {
    from: number
    to: number
  }
  details: {
    words: Array<{
      word: string
      start: number       // milliseconds
      end: number         // milliseconds
      is_keyword?: boolean
    }>
    fontSize: number
    fontFamily: string
    fontUrl?: string      // Optional custom font URL
    color: string         // Default color
    activeColor?: string  // Color when word is active
    appearedColor?: string // Color after word appears
    backgroundColor?: string
    textAlign?: "left" | "center" | "right"
    x?: number | string   // Position (px or %)
    y?: number | string   // Position (px or %)
    width?: number
    height?: number
    animation?: string
    WebkitTextStrokeWidth?: string
    WebkitTextStrokeColor?: string
    borderWidth?: number
    borderColor?: string
    boxShadow?: {
      x: number
      y: number
      blur: number
      color: string
    }
  }
}
```

### Audio Track Item

```typescript
{
  id: string
  type: "audio"
  display: {
    from: number
    to: number
  }
  details: {
    src: string       // Audio URL
    volume?: number   // 0-100 (default: 100)
  }
  trim?: {
    from: number
    to: number
  }
  playbackRate?: number
}
```

### Image Track Item

```typescript
{
  id: string
  type: "image"
  display: {
    from: number
    to: number
  }
  details: {
    src: string
    width: number
    height: number
    x?: number
    y?: number
    rotation?: number
    crop?: {
      x: number
      y: number
      width: number
      height: number
    }
  }
}
```

### Text Track Item

```typescript
{
  id: string
  type: "text"
  display: {
    from: number
    to: number
  }
  details: {
    text: string
    fontSize: number
    fontFamily: string
    fontUrl?: string
    color: string
    x?: number | string
    y?: number | string
    width?: number
    height?: number
    textAlign?: "left" | "center" | "right"
    wordWrap?: string
    borderWidth?: number
    borderColor?: string
    boxShadow?: {
      x: number
      y: number
      blur: number
      color: string
    }
  }
}
```

---

## 🔄 Common Workflows

### Quick Start (All-in-One)

```bash
# 1. Start render (handles everything)
curl -X POST http://localhost:3000/api/remotion/render \
  -H "Content-Type: application/json" \
  -d @render-request.json

# 2. Poll for progress
curl "http://localhost:3000/api/remotion/render?renderId=XXX&functionName=YYY"

# 3. Download video when complete
curl -o video.mp4 "OUTPUT_URL_FROM_RESPONSE"
```

### Manual Setup

```bash
# 1. Create bucket
curl -X POST http://localhost:3000/api/remotion/bucket

# 2. Deploy function
curl -X POST http://localhost:3000/api/remotion/deploy

# 3. Deploy site
curl -X POST http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{"siteName": "my-site"}'

# 4. Start render
curl -X POST http://localhost:3000/api/remotion/render \
  -H "Content-Type: application/json" \
  -d @render-request.json
```

### Redeployment

When updating Remotion compositions:

```bash
# Use same siteName to overwrite
curl -X POST http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{"siteName": "video-editor-site"}'
```

---

## ⚠️ Error Codes

### 400 Bad Request
- Missing required parameters
- Invalid track items format
- AWS credentials not configured

### 500 Internal Server Error
- AWS API errors
- Lambda deployment failures
- Render failures
- Network errors

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed stack trace (in development)"
}
```

---

## 💰 Cost Considerations

### Per Request Costs

- **Bucket creation**: Free (one-time)
- **Function deployment**: ~$0.001 (one-time per version)
- **Site deployment**: ~$0.001 (per deployment)
- **Video render**: $0.01-0.15 (per video, varies by length/resolution)

### Optimization Tips

1. **Reuse siteName** to avoid duplicate site deployments
2. **Cache function** across renders (automatic)
3. **Optimize video resolution** for target platform
4. **Use ARM64 architecture** (20% cheaper, already configured)
5. **Implement batch rendering** for multiple videos

---

## 📝 Notes

- Presigned URLs expire after 24 hours
- Lambda function timeout: 120 seconds max
- Maximum video dimensions: 3840x2160 (4K)
- Supported video codecs: H.264, H.265
- Supported image formats: JPEG, PNG
- Supported audio formats: MP3, WAV, AAC

---

## 🆘 Support

For issues or questions:
1. Check CloudWatch logs in AWS Console
2. Review `QUICK_START.md` for common solutions
3. See `REMOTION_SETUP.md` for detailed setup
4. Join [Remotion Discord](https://remotion.dev/discord)

