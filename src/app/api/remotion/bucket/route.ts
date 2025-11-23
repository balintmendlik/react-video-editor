import { NextResponse } from 'next/server'
import { getOrCreateRemotionBucket } from '@/lib/remotion-lambda'

/**
 * POST /api/remotion/bucket
 * Get or create an S3 bucket for Remotion
 */
export async function POST() {
	try {
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

		const result = await getOrCreateRemotionBucket()

		return NextResponse.json(result, { status: 200 })
	} catch (error) {
		console.error('Error getting or creating bucket:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: 'Failed to get or create bucket',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

