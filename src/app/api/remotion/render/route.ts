import { NextResponse } from 'next/server'
import {
	setupRemotionInfrastructure,
	renderVideo,
	checkRenderProgress,
} from '@/lib/remotion-lambda'

/**
 * POST /api/remotion/render
 * Start rendering a video with captions using Remotion Lambda
 * 
 * This endpoint handles the complete flow:
 * 1. Ensures S3 bucket exists
 * 2. Ensures Lambda function exists
 * 3. Deploys/updates the Remotion site
 * 4. Starts the render
 */
export async function POST(request: Request) {
	try {
		const body = await request.json()

		// Validate required fields
		if (!body.trackItems || !Array.isArray(body.trackItems)) {
			return NextResponse.json(
				{
					success: false,
					message: 'trackItems array is required',
				},
				{ status: 400 }
			)
		}

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

		// Step 1: Setup complete infrastructure (bucket, function, site)
		console.log('Setting up Remotion infrastructure...')
		
		// Use existing site by default (don't force redeploy)
		const infrastructure = await setupRemotionInfrastructure(
			body.siteName || 'video-editor-site',
			false // Don't force redeploy - reuse existing site for faster exports
		)

		if (!infrastructure.serveUrl) {
			throw new Error('Failed to get serve URL from site deployment')
		}

		console.log('Infrastructure ready:', {
			bucketName: infrastructure.bucketName,
			functionName: infrastructure.functionName,
			siteName: infrastructure.siteName,
		})

		// Step 2: Prepare input props for the composition
		const inputProps = {
			trackItems: body.trackItems,
			background: body.background || {
				type: 'color',
				value: 'transparent',
			},
			videoWidth: body.videoWidth || 1080,
			videoHeight: body.videoHeight || 1920,
			fps: body.fps || 30,
			durationInSeconds: body.durationInSeconds || 10,
		}

		// Step 3: Start the render
		console.log('Starting render on Lambda...')
		const renderResult = await renderVideo({
			functionName: infrastructure.functionName,
			serveUrl: infrastructure.serveUrl,
			composition: 'VideoWithCaptions',
			inputProps,
			codec: body.codec || 'h264',
			imageFormat: body.imageFormat || 'jpeg',
			maxRetries: body.maxRetries ?? 1,
			framesPerLambda: body.framesPerLambda ?? 20,
			privacy: body.privacy || 'public',
		})

		return NextResponse.json(
			{
				success: true,
				renderId: renderResult.renderId,
				bucketName: renderResult.bucketName,
				functionName: infrastructure.functionName,
				siteName: infrastructure.siteName,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error starting render:', error)
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to start render',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

/**
 * GET /api/remotion/render?renderId=xxx&bucketName=yyy&functionName=zzz
 * Check the progress of a render
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const renderId = searchParams.get('renderId')
		const bucketName = searchParams.get('bucketName')
		const functionName = searchParams.get('functionName')

		if (!renderId || !bucketName || !functionName) {
			return NextResponse.json(
				{
					success: false,
					message: 'renderId, bucketName, and functionName parameters are required',
				},
				{ status: 400 }
			)
		}

		const progress = await checkRenderProgress(renderId, bucketName, functionName)

		return NextResponse.json(progress, { status: 200 })
	} catch (error) {
		console.error('Error checking render progress:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: 'Failed to check render progress',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

