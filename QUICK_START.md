# Remotion Lambda - Quick Start Guide

Get your video export up and running in minutes!

## 🚀 Setup (One-Time)

### 1. Configure AWS Credentials

Create `.env.local` in your project root:

```bash
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
REMOTION_AWS_REGION=us-east-1
```

That's it! No need to specify bucket name - it will be created automatically.

### 2. Start Your Dev Server

```bash
npm run dev
```

## 🎬 Rendering a Video

### Option 1: All-in-One Setup + Render

Use the render endpoint - it handles everything automatically:

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
          "height": 1920
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
          "color": "#ffffff"
        }
      }
    ],
    "videoWidth": 1080,
    "videoHeight": 1920,
    "fps": 30,
    "durationInSeconds": 10
  }'
```

**What happens:**
1. ✅ Creates S3 bucket (if needed)
2. ✅ Deploys Lambda function (if needed)
3. ✅ Deploys your Remotion site
4. ✅ Starts rendering

**Response:**
```json
{
  "success": true,
  "renderId": "abc123",
  "bucketName": "remotion-lambda-abcd1234",
  "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
  "siteName": "video-editor-site"
}
```

### Option 2: Step-by-Step Setup

If you prefer more control:

#### Step 1: Create Bucket
```bash
curl -X POST http://localhost:3000/api/remotion/bucket
```

#### Step 2: Deploy Lambda Function
```bash
curl -X POST http://localhost:3000/api/remotion/deploy
```

#### Step 3: Deploy Site
```bash
curl -X POST http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{ "siteName": "my-video-site" }'
```

#### Step 4: Start Render
(Same as above)

## 📊 Check Render Progress

```bash
curl "http://localhost:3000/api/remotion/render?renderId=abc123&functionName=remotion-render-4-0-377-mem2048mb-disk2048mb-120sec"
```

**Response (Processing):**
```json
{
  "success": true,
  "status": "PROCESSING",
  "progress": 0.45,
  "outputUrl": null
}
```

**Response (Completed):**
```json
{
  "success": true,
  "status": "COMPLETED",
  "progress": 1,
  "outputUrl": "https://bucket.s3.amazonaws.com/renders/abc123.mp4?X-Amz-Algorithm=..."
}
```

## 💻 Frontend Integration

```typescript
// Start render
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
    }),
  })
  
  const { renderId, functionName } = await response.json()
  
  // Poll for progress
  const interval = setInterval(async () => {
    const progressResponse = await fetch(
      `/api/remotion/render?renderId=${renderId}&functionName=${functionName}`
    )
    const progress = await progressResponse.json()
    
    if (progress.status === 'COMPLETED') {
      clearInterval(interval)
      window.location.href = progress.outputUrl // Download video
    }
  }, 2500)
}
```

## 🎯 Track Item Types

### Video
```json
{
  "id": "video1",
  "type": "video",
  "display": { "from": 0, "to": 10000 },
  "details": {
    "src": "https://example.com/video.mp4",
    "width": 1080,
    "height": 1920,
    "volume": 100,
    "x": 0,
    "y": 0
  },
  "trim": { "from": 1000, "to": 9000 },
  "playbackRate": 1
}
```

### Caption
```json
{
  "id": "caption1",
  "type": "caption",
  "display": { "from": 0, "to": 5000 },
  "details": {
    "words": [
      { "word": "Hello", "start": 0, "end": 500, "is_keyword": false },
      { "word": "World", "start": 500, "end": 1000, "is_keyword": true }
    ],
    "fontSize": 48,
    "fontFamily": "Arial",
    "color": "#ffffff",
    "activeColor": "#ffff00",
    "appearedColor": "#cccccc",
    "backgroundColor": "rgba(0, 0, 0, 0.5)"
  }
}
```

### Audio
```json
{
  "id": "audio1",
  "type": "audio",
  "display": { "from": 0, "to": 10000 },
  "details": {
    "src": "https://example.com/audio.mp3",
    "volume": 80
  }
}
```

### Image
```json
{
  "id": "image1",
  "type": "image",
  "display": { "from": 0, "to": 5000 },
  "details": {
    "src": "https://example.com/image.jpg",
    "width": 500,
    "height": 500,
    "x": 290,
    "y": 710
  }
}
```

### Text
```json
{
  "id": "text1",
  "type": "text",
  "display": { "from": 0, "to": 5000 },
  "details": {
    "text": "Hello World",
    "fontSize": 64,
    "fontFamily": "Arial",
    "color": "#ffffff",
    "x": "50%",
    "y": "50%",
    "textAlign": "center"
  }
}
```

## 📝 Tips

### Redeploying Site
When you update your Remotion compositions, pass the same `siteName`:

```bash
curl -X POST http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{ "siteName": "video-editor-site" }'
```

This overwrites the previous deployment instead of creating a new one.

### Complete Setup in One Call
Use the convenience endpoint:

```bash
curl -X PUT http://localhost:3000/api/remotion/site \
  -H "Content-Type: application/json" \
  -d '{ "siteName": "my-site" }'
```

This creates bucket + function + site in one call!

## 🐛 Troubleshooting

### "AWS credentials not configured"
- Check `.env.local` exists
- Restart dev server: `npm run dev`

### Render stuck at 0%
- Check video URLs are accessible
- Verify fonts are loading
- Check CloudWatch logs in AWS Console

### "Access Denied" errors
- Verify IAM permissions (see `REMOTION_SETUP.md`)
- Ensure correct AWS region

## 💰 Costs

Approximate costs per video:
- **10-second video**: $0.01 - $0.05
- **30-second video**: $0.03 - $0.10
- **60-second video**: $0.05 - $0.15

For 1,000 videos/month: ~$55-90/month

## 📚 More Info

- Full setup guide: `REMOTION_SETUP.md`
- API documentation: `DEPLOYMENT_GUIDE.md`
- File overview: `REMOTION_FILES_SUMMARY.md`

