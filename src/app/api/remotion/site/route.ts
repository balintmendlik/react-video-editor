import { NextResponse } from 'next/server'
import {
	getOrCreateRemotionBucket,
	deployRemotionSite,
	setupRemotionInfrastructure,
} from '@/lib/remotion-lambda'

/**
 * POST /api/remotion/site
 * Deploy a Remotion site to S3
 * 
 * Body params:
 * - siteName (optional): Name for the site. If provided, subsequent deploys will overwrite.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}))
		const { siteName } = body

		// Check AWS credentials
		if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					message:
						'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
				},
				{ status: 400 }
			)
		}

		// Step 1: Get or create bucket
		console.log('Getting or creating S3 bucket...')
		const { bucketName } = await getOrCreateRemotionBucket()

		// Step 2: Deploy site
		console.log('Deploying Remotion site...')
		const result = await deployRemotionSite(bucketName, siteName)

		return NextResponse.json(
			{
				...result,
				bucketName,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error deploying site:', error)
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to deploy site',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

/**
 * PUT /api/remotion/site
 * Complete infrastructure setup: bucket, function, and site deployment
 * This is a convenience endpoint that does everything in one call
 * 
 * Body params:
 * - siteName (optional): Name for the site
 */
export async function PUT(request: Request) {
	try {
		const body = await request.json().catch(() => ({}))
		const { siteName } = body

		// Check AWS credentials
		if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					message:
						'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
				},
				{ status: 400 }
			)
		}

		// Setup complete infrastructure
		const result = await setupRemotionInfrastructure(siteName)

		return NextResponse.json(result, { status: 200 })
	} catch (error) {
		console.error('Error setting up infrastructure:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: 'Failed to setup infrastructure',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

