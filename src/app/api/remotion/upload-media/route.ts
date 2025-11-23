import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateBucket } from '@remotion/lambda'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import path from 'path'
import fs from 'fs/promises'

const AWS_REGION = (process.env.REMOTION_AWS_REGION || 'us-east-1') as const

/**
 * POST /api/remotion/upload-media
 * Upload local media files to S3 so Lambda can access them
 * 
 * This endpoint:
 * 1. Takes relative file paths from the request
 * 2. Reads the files from _uploads directory
 * 3. Uploads them to the Remotion S3 bucket
 * 4. Returns public S3 URLs that Lambda can access
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { filePaths } = body

		if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
			return NextResponse.json(
				{
					success: false,
					message: 'filePaths array is required',
				},
				{ status: 400 }
			)
		}

		// Check AWS credentials
		if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					message: 'AWS credentials not configured',
				},
				{ status: 400 }
			)
		}

		// Get or create the S3 bucket
		const { bucketName } = await getOrCreateBucket({
			region: AWS_REGION,
		})

		// Initialize S3 client
		const s3Client = new S3Client({
			region: AWS_REGION,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},
		})

		const uploadedUrls: Record<string, string> = {}

		// Upload each file
		for (const filePath of filePaths) {
			try {
				// Extract filename from path like /api/uploads/file/video.mp4
				const filename = filePath.split('/').pop()
				if (!filename) continue

				// Read file from _uploads directory
				const localPath = path.join(process.cwd(), '_uploads', filename)
				
				// Check if file exists
				try {
					await fs.access(localPath)
				} catch {
					console.warn(`File not found: ${localPath}`)
					continue
				}

				const fileBuffer = await fs.readFile(localPath)

				// Determine content type
				const ext = path.extname(filename).toLowerCase()
				const contentType =
					ext === '.mp4' ? 'video/mp4' :
					ext === '.mov' ? 'video/quicktime' :
					ext === '.webm' ? 'video/webm' :
					ext === '.mp3' ? 'audio/mpeg' :
					ext === '.wav' ? 'audio/wav' :
					ext === '.png' ? 'image/png' :
					ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
					'application/octet-stream'

				// Upload to S3
				const s3Key = `uploads/${Date.now()}-${filename}`
				await s3Client.send(
					new PutObjectCommand({
						Bucket: bucketName,
						Key: s3Key,
						Body: fileBuffer,
						ContentType: contentType,
						ACL: 'public-read', // Make it publicly accessible
					})
				)

				// Generate public URL
				const publicUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`
				uploadedUrls[filePath] = publicUrl

				console.log(`Uploaded ${filename} to S3:`, publicUrl)
			} catch (error) {
				console.error(`Failed to upload ${filePath}:`, error)
			}
		}

		return NextResponse.json(
			{
				success: true,
				uploadedUrls,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error uploading media to S3:', error)
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to upload media',
			},
			{ status: 500 }
		)
	}
}

