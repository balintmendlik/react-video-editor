import { NextResponse } from 'next/server'
import {
	getDeployedFunctions,
	getCompatibleFunctionName,
} from '@/lib/remotion-lambda'

/**
 * GET /api/remotion/functions
 * Get all deployed Lambda functions compatible with current Remotion version
 * 
 * This is useful for retrieving function names programmatically,
 * especially after a Node.js restart
 */
export async function GET() {
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

		const result = await getDeployedFunctions()

		return NextResponse.json(result, { status: 200 })
	} catch (error) {
		console.error('Error getting functions:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: 'Failed to get deployed functions',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

/**
 * POST /api/remotion/functions/compatible
 * Get the first compatible function name
 * Returns null if no compatible functions found
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

		const functionName = await getCompatibleFunctionName()

		if (!functionName) {
			return NextResponse.json(
				{
					success: true,
					functionName: null,
					message:
						'No compatible functions found. Deploy a new function with POST /api/remotion/deploy',
				},
				{ status: 200 }
			)
		}

		return NextResponse.json(
			{
				success: true,
				functionName,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error getting compatible function:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: 'Failed to get compatible function',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

