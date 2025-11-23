/**
 * Remotion AWS Lambda Service
 * 
 * This service handles deployment and rendering operations for Remotion videos
 * using AWS Lambda. It includes functions for:
 * - Deploying Lambda functions
 * - Deploying sites (Remotion compositions)
 * - Rendering videos with captions
 * - Checking render progress
 * 
 * ⚠️ SERVER-SIDE ONLY
 * This module uses @remotion/lambda which is server-side only.
 * It should NEVER be imported in client-side code.
 */

// Prevent this module from being imported on the client side
import 'server-only'

import {
	deployFunction,
	deploySite,
	renderMediaOnLambda,
	getRenderProgress,
	getFunctions,
	getOrCreateBucket,
	getSites,
	type DeployFunctionInput,
	type DeploySiteInput,
	type RenderMediaOnLambdaInput,
} from '@remotion/lambda'
import path from 'path'

// AWS Configuration
const AWS_REGION = (process.env.REMOTION_AWS_REGION || 'us-east-1') as const

// Cache for deployed site info to avoid redeploying every time
let cachedSiteInfo: {
	serveUrl: string
	siteName: string
	bucketName: string
} | null = null

// Lambda Function Configuration
const LAMBDA_CONFIG = {
	region: AWS_REGION,
	timeoutInSeconds: 120,
	memorySizeInMb: 2048,
	createCloudWatchLogGroup: true,
} as const

/**
 * Deploy a Lambda function to AWS that can render Remotion videos
 * This function needs to be called once per Remotion version
 * 
 * @returns Function name and other deployment details
 */
export async function deployRenderFunction() {
	try {
		console.log('Deploying Remotion Lambda function...')
		
		const deployment = await deployFunction({
			...LAMBDA_CONFIG,
			architecture: 'arm64', // Use ARM64 for better performance and lower cost
		})

		console.log('Lambda function deployed successfully:', deployment.functionName)
		
		return {
			success: true,
			functionName: deployment.functionName,
			alreadyExisted: deployment.alreadyExisted,
		}
	} catch (error) {
		console.error('Failed to deploy Lambda function:', error)
		throw error
	}
}

/**
 * Get or create an S3 bucket for Remotion
 * If the bucket already exists, it will be used
 * 
 * @returns Bucket name
 */
export async function getOrCreateRemotionBucket() {
	try {
		console.log('Getting or creating S3 bucket...')
		
		const { bucketName } = await getOrCreateBucket({
			region: AWS_REGION,
		})

		console.log('S3 bucket ready:', bucketName)
		
		return {
			success: true,
			bucketName,
		}
	} catch (error) {
		console.error('Failed to get or create bucket:', error)
		throw error
	}
}

/**
 * Deploy a Remotion site to S3
 * This bundles and uploads your Remotion code
 * 
 * @param bucketName - The S3 bucket name to deploy to
 * @param siteName - Optional site name for the deployment (enables overwrites on redeploy)
 * @param forceRedeploy - Force redeployment even if a site exists
 * @returns Serve URL for the deployed site
 */
export async function deployRemotionSite(
	bucketName: string,
	siteName?: string,
	forceRedeploy = false
) {
	try {
		// Check if we have a cached site and it matches the requested bucket/siteName
		if (
			!forceRedeploy &&
			cachedSiteInfo &&
			cachedSiteInfo.bucketName === bucketName &&
			(!siteName || cachedSiteInfo.siteName === siteName)
		) {
			console.log('✅ Using cached site deployment:', cachedSiteInfo.siteName)
			return {
				success: true,
				serveUrl: cachedSiteInfo.serveUrl,
				siteName: cachedSiteInfo.siteName,
			}
		}

		// Check if a site with this name already exists
		if (!forceRedeploy && siteName) {
			console.log('Checking for existing site:', siteName)
			try {
				const sites = await getSites({
					region: AWS_REGION,
					bucketName,
				})
				
				const existingSite = sites.sites.find((s) => s.id === siteName)
				if (existingSite) {
					console.log('✅ Found existing site, reusing:', siteName)
					
					// Cache the site info
					cachedSiteInfo = {
						serveUrl: existingSite.serveUrl,
						siteName: existingSite.id,
						bucketName,
					}
					
					return {
						success: true,
						serveUrl: existingSite.serveUrl,
						siteName: existingSite.id,
					}
				}
			} catch (error) {
				console.log('Could not check existing sites, will deploy new one:', error)
			}
		}

		console.log('📦 Deploying Remotion site (this may take a few minutes)...')
		
		// Get the entry point path
		const entryPoint = path.resolve(process.cwd(), 'remotion/root.tsx')
		
		console.log('Entry point:', entryPoint)
		console.log('Bucket name:', bucketName)
		console.log('Site name:', siteName || '(auto-generated)')
		
		const deployParams: any = {
			region: AWS_REGION,
			bucketName,
			entryPoint,
			// Force overwrite to ensure latest code is deployed
			options: {
				ignoreRegisterRootWarning: true
			}
		}
		
		// Add siteName if provided (enables overwriting on redeploy)
		if (siteName) {
			deployParams.siteName = siteName
		}
		
		console.log('Deploying site with params:', {
			siteName: deployParams.siteName,
			entryPoint: deployParams.entryPoint
		})
		
		const { serveUrl, siteName: deployedSiteName } = await deploySite(deployParams)

		console.log('✅ Site deployed successfully:', { serveUrl, siteName: deployedSiteName })
		
		// Cache the site info for future use
		cachedSiteInfo = {
			serveUrl,
			siteName: deployedSiteName,
			bucketName,
		}
		
		return {
			success: true,
			serveUrl,
			siteName: deployedSiteName,
		}
	} catch (error) {
		console.error('Failed to deploy site:', error)
		throw error
	}
}

/**
 * Render a video on AWS Lambda
 * 
 * @param params - Render parameters
 * @returns Render ID and bucket name for tracking progress
 */
export async function renderVideo(params: {
	functionName: string
	serveUrl: string
	composition: string
	inputProps: any
	codec?: 'h264' | 'h265'
	imageFormat?: 'jpeg' | 'png'
	maxRetries?: number
	framesPerLambda?: number
	privacy?: 'public' | 'private'
	outputPath?: string
}) {
	try {
		console.log('Starting video render on Lambda...')
		console.log('Render configuration:', {
			composition: params.composition,
			codec: params.codec || 'h264',
			framesPerLambda: params.framesPerLambda || 20,
		})
		
		const { renderId, bucketName } = await renderMediaOnLambda({
			region: AWS_REGION,
			functionName: params.functionName,
			serveUrl: params.serveUrl,
			composition: params.composition,
			inputProps: params.inputProps,
			codec: params.codec || 'h264',
			imageFormat: params.imageFormat || 'jpeg',
			maxRetries: params.maxRetries ?? 1,
			framesPerLambda: params.framesPerLambda ?? 20,
			privacy: params.privacy || 'public',
			outName: params.outputPath,
		})

		console.log('Render started successfully:', { renderId, bucketName })
		
		return {
			success: true,
			renderId,
			bucketName,
		}
	} catch (error) {
		console.error('Failed to start render:', error)
		throw error
	}
}

/**
 * Check the progress of a render
 * 
 * @param renderId - The render ID returned from renderVideo
 * @param bucketName - The S3 bucket name where the render is stored
 * @param functionName - The Lambda function name
 * @returns Render progress and status
 */
export async function checkRenderProgress(
	renderId: string,
	bucketName: string,
	functionName: string
) {
	try {
		console.log('Checking render progress:', { renderId, bucketName, functionName })
		
		const progress = await getRenderProgress({
			renderId,
			bucketName,
			functionName,
			region: AWS_REGION,
		})

		console.log('Progress data:', {
			done: progress.done,
			overallProgress: progress.overallProgress,
			outputFile: progress.outputFile,
			fatalErrorEncountered: progress.fatalErrorEncountered,
			errors: progress.errors,
		})

		// If there are errors, log them in detail
		if (progress.errors && progress.errors.length > 0) {
			console.error('Lambda render errors:', progress.errors)
		}

		return {
			success: true,
			status: progress.done ? 'COMPLETED' : progress.fatalErrorEncountered ? 'FAILED' : 'PROCESSING',
			progress: progress.overallProgress,
			outputFile: progress.outputFile,
			outputUrl: progress.outputFile,
			costs: progress.costs,
			timeElapsed: progress.timeToFinish,
			errors: progress.errors,
			fatalErrorEncountered: progress.fatalErrorEncountered,
		}
	} catch (error) {
		console.error('Failed to check render progress:', error)
		throw error
	}
}

/**
 * Get all deployed Lambda functions for Remotion
 * Uses compatibleOnly flag to get only functions with matching Remotion version
 * This is useful for retrieving function names after a Node.js restart
 * 
 * @returns List of deployed functions compatible with current Remotion version
 */
export async function getDeployedFunctions() {
	try {
		console.log('Retrieving deployed Lambda functions...')
		
		const functions = await getFunctions({
			region: AWS_REGION,
			compatibleOnly: true, // Only get functions compatible with current Remotion version
		})

		console.log(`Found ${functions.length} compatible function(s)`)

		return {
			success: true,
			functions: functions.map((fn) => ({
				functionName: fn.functionName,
				version: fn.version,
				memorySizeInMb: fn.memorySizeInMb,
				timeoutInSeconds: fn.timeoutInSeconds,
			})),
		}
	} catch (error) {
		console.error('Failed to get deployed functions:', error)
		throw error
	}
}

/**
 * Get the first compatible Lambda function name
 * Useful for retrieving function name programmatically before rendering
 * 
 * @returns Function name or null if no compatible functions found
 */
export async function getCompatibleFunctionName(): Promise<string | null> {
	try {
		const { functions } = await getDeployedFunctions()
		
		if (functions.length === 0) {
			console.log('No compatible functions found')
			return null
		}
		
		const functionName = functions[0].functionName
		console.log('Using compatible function:', functionName)
		
		return functionName
	} catch (error) {
		console.error('Failed to get compatible function name:', error)
		throw error
	}
}

/**
 * Get or create a Lambda function
 * Checks if a compatible function exists, otherwise deploys a new one
 * This is the recommended approach from Remotion docs:
 * - Use getFunctions() with compatibleOnly to retrieve existing functions
 * - Deploy only if no compatible function exists
 * 
 * @returns Function name
 */
export async function ensureLambdaFunction(): Promise<string> {
	try {
		// First, try to get existing compatible functions
		// This is useful in case Node.js program restarts
		const compatibleFunctionName = await getCompatibleFunctionName()
		
		if (compatibleFunctionName) {
			console.log('✅ Using existing compatible Lambda function:', compatibleFunctionName)
			return compatibleFunctionName
		}

		// No compatible function exists, deploy a new one
		console.log('📦 No compatible Lambda function found, deploying new one...')
		const deployment = await deployRenderFunction()
		
		if (!deployment.functionName) {
			throw new Error('Failed to get function name from deployment')
		}
		
		console.log('✅ Lambda function deployed:', deployment.functionName)
		return deployment.functionName
	} catch (error) {
		console.error('Failed to ensure Lambda function:', error)
		throw error
	}
}

/**
 * Clear the cached site info
 * Useful when you want to force a fresh deployment
 */
export function clearSiteCache() {
	cachedSiteInfo = null
	console.log('Site cache cleared')
}

/**
 * Complete setup flow: ensure bucket, function, and deploy site
 * This is a convenience function that handles the full setup
 * 
 * @param siteName - Optional site name for redeployment
 * @param forceRedeploy - Force site redeployment even if one exists
 * @returns All necessary details for rendering
 */
export async function setupRemotionInfrastructure(
	siteName?: string,
	forceRedeploy = false
) {
	try {
		console.log('🚀 Setting up Remotion infrastructure...\n')
		
		// Step 1: Get or create S3 bucket
		console.log('📦 Step 1/3: Setting up S3 bucket...')
		const { bucketName } = await getOrCreateRemotionBucket()
		
		// Step 2: Ensure Lambda function exists
		console.log('⚡ Step 2/3: Setting up Lambda function...')
		const functionName = await ensureLambdaFunction()
		
		// Step 3: Deploy site (or reuse existing)
		console.log('🌐 Step 3/3: Setting up Remotion site...')
		const { serveUrl, siteName: deployedSiteName } = await deployRemotionSite(
			bucketName,
			siteName,
			forceRedeploy
		)
		
		console.log('✅ Infrastructure setup complete!\n')
		
		return {
			success: true,
			bucketName,
			functionName,
			serveUrl,
			siteName: deployedSiteName,
		}
	} catch (error) {
		console.error('Failed to setup infrastructure:', error)
		throw error
	}
}

