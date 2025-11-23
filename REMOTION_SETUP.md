# Remotion AWS Lambda Setup Guide

This guide will help you set up Remotion with AWS Lambda for serverless video rendering with burned-in captions.

## Prerequisites

1. An AWS account with access to:
   - AWS Lambda
   - Amazon S3
   - CloudWatch Logs

2. AWS IAM credentials configured with the necessary permissions

## Step 1: Configure AWS Credentials

### Create IAM User

1. Go to AWS IAM Console
2. Create a new IAM user (e.g., `remotion-lambda-user`)
3. Attach the following policies:
   - `AmazonS3FullAccess` (or create a custom policy with S3 permissions)
   - `AWSLambda_FullAccess` (or create a custom policy with Lambda permissions)
   - `CloudWatchLogsFullAccess` (for logging)

### Get Access Keys

1. In the IAM user details, go to "Security credentials"
2. Click "Create access key"
3. Choose "Application running outside AWS"
4. Save the Access Key ID and Secret Access Key

### Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Add your AWS credentials:

```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
REMOTION_AWS_REGION=us-east-1
REMOTION_AWS_BUCKET_NAME=remotion-renders-your-project
```

## Step 2: Deploy Lambda Function

The Lambda function needs to be deployed once per Remotion version. When you upgrade Remotion, you'll need to deploy a new function.

### Option A: Using the API Endpoint

```bash
# Deploy a new Lambda function
curl -X POST http://localhost:3000/api/remotion/deploy

# Check existing functions
curl -X GET http://localhost:3000/api/remotion/deploy

# Get or create a function (recommended)
curl -X PUT http://localhost:3000/api/remotion/deploy
```

### Option B: Using the Service Directly

You can also import and use the service functions in your code:

```typescript
import { deployRenderFunction, ensureLambdaFunction } from '@/lib/remotion-lambda'

// Deploy a new function
const { functionName } = await deployRenderFunction()

// Or ensure a function exists
const functionName = await ensureLambdaFunction()
```

## Step 3: Understanding the Architecture

### Components

1. **Lambda Function**: Runs the Remotion renderer in AWS Lambda
   - Deployed once per Remotion version
   - Contains Remotion binaries and rendering code
   - Automatically scales based on load

2. **S3 Bucket**: Stores rendered videos and deployed sites
   - Videos are stored temporarily with presigned URLs
   - Sites contain your bundled Remotion code

3. **Remotion Composition**: Your video structure
   - Defined in `src/remotion/composition.tsx`
   - Includes video, captions, and other elements

### Rendering Flow

1. **Deploy Function** (one-time): `POST /api/remotion/deploy`
   - Creates Lambda function in AWS
   - Returns function name for future renders

2. **Deploy Site** (when code changes):
   - Bundles your Remotion composition
   - Uploads to S3
   - Returns serve URL

3. **Render Video**:
   - Calls Lambda function with serve URL and input props
   - Lambda renders video frame by frame
   - Uploads result to S3
   - Returns presigned URL for download

4. **Check Progress**:
   - Poll render status
   - Get progress percentage
   - Receive final video URL when complete

## Step 4: Cost Considerations

### Lambda Pricing

- **Compute**: Charged per GB-second of execution
- **Requests**: $0.20 per 1M requests
- **Typical cost**: $0.01 - $0.10 per minute of video (varies by resolution)

### S3 Pricing

- **Storage**: $0.023 per GB-month
- **Transfer**: First 100 GB/month free
- **Requests**: Minimal cost for PUT/GET operations

### Optimization Tips

1. Use **ARM64 architecture** (already configured) for 20% cost savings
2. Set appropriate **timeout** values (currently 120 seconds)
3. Optimize **memory** allocation (currently 2048 MB)
4. Clean up old renders from S3 regularly
5. Use **lower resolutions** for previews

## Step 5: Testing the Setup

### Test Lambda Deployment

```bash
# Start your Next.js dev server
npm run dev

# Deploy the Lambda function
curl -X POST http://localhost:3000/api/remotion/deploy

# Expected response:
# {
#   "success": true,
#   "functionName": "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
#   "alreadyExisted": false
# }
```

### Verify in AWS Console

1. Go to AWS Lambda Console
2. Check for the deployed function
3. Verify CloudWatch log group was created

## Troubleshooting

### Common Issues

1. **"AWS credentials not configured"**
   - Check `.env.local` file exists
   - Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
   - Restart your Next.js dev server

2. **"Access Denied" errors**
   - Verify IAM user has correct policies attached
   - Check AWS region matches in all configurations

3. **"Function deployment failed"**
   - Check CloudWatch logs for detailed error messages
   - Verify Lambda service is available in your region
   - Ensure IAM user has Lambda creation permissions

4. **Timeout errors**
   - Increase `timeoutInSeconds` in Lambda configuration
   - Consider breaking long videos into smaller segments

## Next Steps

1. Create your Remotion composition with video and captions
2. Implement the site deployment endpoint
3. Create the render endpoint
4. Add progress tracking UI
5. Test end-to-end rendering flow

## Resources

- [Remotion Lambda Documentation](https://www.remotion.dev/docs/lambda)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)

