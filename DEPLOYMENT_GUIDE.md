# Video Export with Remotion & AWS Lambda - Deployment Guide

This guide walks you through deploying the Remotion Lambda function to render videos with burned-in captions.

## 📋 Overview

The video export system consists of:

1. **AWS Lambda Function**: Serverless rendering infrastructure
2. **Remotion Compositions**: Video rendering components
3. **API Endpoints**: REST APIs to trigger and monitor renders
4. **S3 Storage**: Temporary storage for rendered videos

## 🚀 Quick Start

### 1. Configure AWS Credentials

Create a `.env.local` file in the project root:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
REMOTION_AWS_REGION=us-east-1
REMOTION_AWS_BUCKET_NAME=remotion-renders-your-project
```

### 2. Deploy the Lambda Function

**Option A: Using the npm script**

```bash
npm run deploy:lambda
```

**Option B: Using the API endpoint**

Start your dev server and call the deployment endpoint:

```bash
# Start the server
npm run dev

# In another terminal, deploy the function
curl -X POST http://localhost:3000/api/remotion/deploy
```

**Option C: Using the API endpoint (ensure function exists)**

This will check for existing functions and create one if needed:

```bash
curl -X PUT http://localhost:3000/api/remotion/deploy
```

### 3. Verify Deployment

Check for deployed functions:

```bash
curl -X GET http://localhost:3000/api/remotion/deploy
```

Expected response:

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

## 📁 Project Structure

```
react-video-editor/
├── remotion/                          # Remotion compositions
│   ├── root.tsx                      # Entry point
│   ├── types.ts                      # TypeScript types
│   ├── compositions/
│   │   └── video-with-captions.tsx  # Main composition
│   └── components/                   # Render components
│       ├── render-video.tsx
│       ├── render-caption.tsx
│       ├── render-audio.tsx
│       ├── render-image.tsx
│       └── render-text.tsx
├── src/
│   ├── lib/
│   │   ├── remotion-lambda.ts        # Lambda service functions
│   │   └── remotion-deploy-script.ts # Deployment script
│   └── app/api/remotion/
│       ├── deploy/
│       │   └── route.ts              # Lambda deployment endpoint
│       └── render/
│           └── route.ts              # Video rendering endpoint
├── remotion.config.ts                 # Remotion configuration
└── .env.local                         # Environment variables (create this)
```

## 🔧 API Endpoints

### Deploy Lambda Function

**POST /api/remotion/deploy**

Deploys a new Lambda function.

```bash
curl -X POST http://localhost:3000/api/remotion/deploy
```

Response:
```json
{
  "success": true,
  "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
  "alreadyExisted": false
}
```

### Check Deployed Functions

**GET /api/remotion/deploy**

Lists all deployed Remotion Lambda functions.

```bash
curl -X GET http://localhost:3000/api/remotion/deploy
```

### Ensure Function Exists

**PUT /api/remotion/deploy**

Gets an existing compatible function or deploys a new one.

```bash
curl -X PUT http://localhost:3000/api/remotion/deploy
```

### Start Video Render

**POST /api/remotion/render**

Starts rendering a video with captions.

```bash
curl -X POST http://localhost:3000/api/remotion/render \
  -H "Content-Type: application/json" \
  -d '{
    "trackItems": [...],
    "background": {
      "type": "color",
      "value": "transparent"
    },
    "videoWidth": 1080,
    "videoHeight": 1920,
    "fps": 30,
    "durationInSeconds": 10
  }'
```

Response:
```json
{
  "success": true,
  "renderId": "abc123",
  "bucketName": "remotion-renders-xyz",
  "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec"
}
```

### Check Render Progress

**GET /api/remotion/render?renderId=xxx&functionName=yyy**

Checks the progress of a render.

```bash
curl "http://localhost:3000/api/remotion/render?renderId=abc123&functionName=remotion-render-4-0-377-mem2048mb-disk2048mb-120sec"
```

Response:
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

When completed:
```json
{
  "success": true,
  "status": "COMPLETED",
  "progress": 1,
  "outputFile": "s3://bucket/renders/abc123.mp4",
  "outputUrl": "https://bucket.s3.amazonaws.com/renders/abc123.mp4?...",
  "costs": {
    "estimatedCost": 0.08
  },
  "timeElapsed": 25000
}
```

## 🎬 Rendering Workflow

1. **Deploy Function** (one-time setup)
   ```
   POST /api/remotion/deploy
   ```

2. **Prepare Video Data**
   - Collect track items (videos, captions, images, text, audio)
   - Set video dimensions, fps, and duration

3. **Start Render**
   ```
   POST /api/remotion/render
   ```
   - Returns a `renderId` for tracking

4. **Poll for Progress**
   ```
   GET /api/remotion/render?renderId=xxx&functionName=yyy
   ```
   - Poll every 2-3 seconds
   - Check `status` field
   - When `status === "COMPLETED"`, get `outputUrl`

5. **Download Video**
   - Use the `outputUrl` to download the final video
   - The URL is a presigned S3 URL (valid for 24 hours)

## 🔐 AWS IAM Permissions

Your IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction",
        "lambda:ListFunctions",
        "lambda:InvokeFunction",
        "lambda:DeleteFunction"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutBucketPolicy"
      ],
      "Resource": [
        "arn:aws:s3:::remotion-*",
        "arn:aws:s3:::remotion-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## 💰 Cost Estimation

### Lambda Costs (US East 1)

- **Compute**: ~$0.0000166667 per GB-second
- **Requests**: $0.20 per 1M requests
- **Typical 10-second 1080x1920 video**: $0.01 - $0.05
- **Typical 60-second 1080x1920 video**: $0.05 - $0.15

### S3 Costs

- **Storage**: $0.023 per GB-month (minimal - files are temporary)
- **Transfer**: First 100 GB/month free
- **Requests**: Negligible

### Monthly Estimate

For 1,000 videos per month (average 30 seconds each):
- Lambda: ~$50-80
- S3: ~$5-10
- **Total**: ~$55-90/month

## 🐛 Troubleshooting

### "AWS credentials not configured"

**Solution**: Check that `.env.local` exists and contains valid AWS credentials.

```bash
# Verify file exists
ls -la .env.local

# Restart dev server
npm run dev
```

### "Failed to deploy Lambda function"

**Possible causes**:
1. Insufficient IAM permissions
2. Region not supported
3. Lambda quota exceeded

**Solution**: Check AWS CloudWatch logs for detailed error messages.

### "Render stuck at 0% progress"

**Possible causes**:
1. Invalid video URLs
2. Font not loading
3. Missing assets

**Solution**: 
- Check that all asset URLs are accessible
- Verify font URLs are valid
- Check Lambda function logs in CloudWatch

### "Timeout errors"

**Solution**: Increase timeout in `remotion-lambda.ts`:

```typescript
const LAMBDA_CONFIG = {
  region: AWS_REGION,
  timeoutInSeconds: 240, // Increase from 120
  memorySizeInMb: 2048,
  createCloudWatchLogGroup: true,
}
```

## 🚀 Next Steps

1. ✅ Deploy Lambda function
2. ⏳ Integrate with your frontend
3. ⏳ Add progress UI
4. ⏳ Handle video downloads
5. ⏳ Set up error handling
6. ⏳ Add render queue (optional)
7. ⏳ Implement webhook notifications (optional)

## 📚 Resources

- [Remotion Lambda Documentation](https://www.remotion.dev/docs/lambda)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [Remotion Discord Community](https://remotion.dev/discord)

## 🆘 Support

If you encounter issues:

1. Check the [Remotion Lambda Documentation](https://www.remotion.dev/docs/lambda)
2. Review AWS CloudWatch logs
3. Check your IAM permissions
4. Verify environment variables are set correctly
5. Ensure your Remotion version matches across all dependencies

