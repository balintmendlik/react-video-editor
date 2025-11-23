# AWS Setup for Remotion Lambda - Quick Guide

## ✅ Progress: Webpack Issues Resolved!

Your webpack bundling issue is now **completely fixed**. The new error about AWS credentials is actually **good news** - it means your code is running and just needs AWS configuration.

## 🔑 Get Your AWS Credentials

### Step 1: Log into AWS Console

Go to: https://console.aws.amazon.com/

### Step 2: Create IAM User

1. Navigate to **IAM** (Identity and Access Management)
2. Click **Users** → **Create user**
3. User name: `remotion-lambda-user` (or any name you prefer)
4. Click **Next**

### Step 3: Attach Permissions

Select **Attach policies directly** and add these policies:

**Required policies:**
- ✅ `AmazonS3FullAccess`
- ✅ `AWSLambdaFullAccess` 
- ✅ `CloudWatchLogsFullAccess`
- ✅ `IAMFullAccess` (for creating Lambda execution roles)

Click **Next** → **Create user**

### Step 4: Create Access Keys

1. Click on your newly created user
2. Go to **Security credentials** tab
3. Scroll to **Access keys**
4. Click **Create access key**
5. Choose **Application running outside AWS**
6. Click **Next** → **Create access key**
7. **⚠️ IMPORTANT:** Copy both:
   - Access key ID
   - Secret access key
   
   **You won't be able to see the secret key again!**

## 📝 Configure Your Project

### Option 1: Edit `.env.local` (Recommended)

Open `.env.local` in your project root and replace the placeholders:

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE    # Replace with your actual key
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY    # Replace with your actual key
REMOTION_AWS_REGION=us-east-1
```

### Option 2: Create `.env.local` if it doesn't exist

```bash
# In your project root
touch .env.local
```

Then add the content above.

## 🚀 Restart Your Dev Server

**Important:** Environment variable changes require a restart:

```bash
# Stop your current dev server (Ctrl+C)
npm run dev
```

## 🧪 Test the Setup

1. **Check credentials loaded:**
   - Restart dev server
   - Try to export a video
   - You should see different errors (about deployment, not credentials)

2. **Deploy Lambda function:**
   ```bash
   curl -X POST http://localhost:3000/api/remotion/deploy
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "functionName": "remotion-render-4-0-377-...",
     "alreadyExisted": false
   }
   ```

3. **Try exporting:**
   - Add content to timeline
   - Click Export → MP4
   - Should start processing!

## 💰 AWS Costs

Don't worry about costs while testing:
- Lambda function deployment: **Free**
- First 1M Lambda requests: **Free tier**
- First 400,000 GB-seconds compute: **Free tier**
- S3 storage: Pennies per month
- Typical test video: **$0.01 - $0.05**

You won't be charged much (if anything) during initial testing!

## 🔒 Security Notes

### ⚠️ Keep `.env.local` Secret

The `.env.local` file contains your AWS credentials. It should:
- ✅ Already be in `.gitignore` (Next.js adds this by default)
- ✅ Never be committed to Git
- ✅ Never be shared publicly

### 🔐 Best Practices

1. **Never commit credentials** to version control
2. **Use IAM user** (not root account credentials)
3. **Limit permissions** (only what's needed for Remotion)
4. **Rotate keys** periodically
5. **Delete user** when no longer needed

## 🐛 Troubleshooting

### Error: "AWS credentials not configured"
- ✅ Check `.env.local` exists
- ✅ Check file is in project root (same level as `package.json`)
- ✅ Check no typos in variable names
- ✅ **Restart dev server** after adding credentials

### Error: "Access Denied"
- Check IAM policies are attached correctly
- Wait a few seconds (IAM changes can take time to propagate)
- Verify AWS region matches (us-east-1)

### Error: "Cannot find credentials"
- Restart dev server (environment variables load on startup)
- Check file encoding (should be UTF-8)
- Check no extra spaces around `=` sign

## ✅ Quick Checklist

- [ ] AWS account created
- [ ] IAM user created with correct policies
- [ ] Access keys generated and saved
- [ ] `.env.local` file created
- [ ] Credentials added to `.env.local`
- [ ] Dev server restarted
- [ ] Test export attempt

## 🎉 Next Steps

Once credentials are configured:
1. Export will start deploying Lambda function
2. First render will take ~2-3 minutes (deployment + render)
3. Subsequent renders will be much faster (~30-60 seconds)
4. You'll see progress percentage in the modal
5. Download button appears when complete!

## 📞 Need Help?

If you're still stuck:
1. Check the error message in browser console (F12)
2. Check terminal logs for server-side errors
3. Verify AWS credentials work by testing with AWS CLI
4. Check AWS CloudWatch logs for detailed errors

Your webpack issue is **completely fixed** now - you're just one step away from rendering videos! 🚀

