import { NextResponse } from 'next/server'
import {
	deployRenderFunction,
	getDeployedFunctions,
	ensureLambdaFunction,
} from '@/lib/remotion-lambda'

/**
 * GET /api/remotion/deploy
 * Check for existing deployed Lambda functions
 */
export async function GET() {
	try {
		const result = await getDeployedFunctions()
		
		return NextResponse.json(result, { status: 200 })
	} catch (error) {
		console.error('Error getting deployed functions:', error)
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to get deployed functions',
			},
			{ status: 500 }
		)
	}
}

/**
 * POST /api/remotion/deploy
 * Deploy a new Lambda function for Remotion rendering
 */
export async function POST() {
	try {
		// Check AWS credentials
		if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					message: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
				},
				{ status: 400 }
			)
		}

		// Deploy the function
		const result = await deployRenderFunction()
		
		return NextResponse.json(result, { status: 200 })
	} catch (error) {
		console.error('Error deploying Lambda function:', error)
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to deploy Lambda function',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

/**
 * PUT /api/remotion/deploy
 * Ensure a Lambda function exists (get existing or deploy new)
 */
export async function PUT() {
	try {
		// Check AWS credentials
		if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					message: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
				},
				{ status: 400 }
			)
		}

		const functionName = await ensureLambdaFunction()
		
		return NextResponse.json(
			{
				success: true,
				functionName,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error ensuring Lambda function:', error)
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to ensure Lambda function',
				error: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

