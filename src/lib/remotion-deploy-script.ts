#!/usr/bin/env node

/**
 * Remotion Lambda Deployment Script
 * 
 * This script can be run directly to deploy the Lambda function
 * Usage: npm run deploy:lambda
 */

import { deployRenderFunction, getDeployedFunctions } from './remotion-lambda'

async function main() {
	console.log('🚀 Starting Remotion Lambda deployment...\n')

	try {
		// Check for existing functions first
		console.log('📋 Checking for existing Lambda functions...')
		const existing = await getDeployedFunctions()

		if (existing.functions.length > 0) {
			console.log('✅ Found existing compatible functions:')
			existing.functions.forEach((fn) => {
				console.log(`  - ${fn.functionName}`)
				console.log(`    Version: ${fn.version}`)
				console.log(`    Memory: ${fn.memorySizeInMb}MB`)
				console.log(`    Timeout: ${fn.timeoutInSeconds}s\n`)
			})

			console.log(
				'💡 You can use these existing functions or deploy a new one.\n'
			)
		} else {
			console.log('ℹ️  No existing compatible functions found.\n')
		}

		// Deploy new function
		console.log('🔨 Deploying new Lambda function...')
		const result = await deployRenderFunction()

		if (result.alreadyExisted) {
			console.log('✅ Function already exists and is up to date!')
		} else {
			console.log('✅ Function deployed successfully!')
		}

		console.log(`\n📦 Function Name: ${result.functionName}`)
		console.log(
			'\n💡 Save this function name - you\'ll need it for rendering videos!'
		)
		console.log(
			'\n🎬 Next steps:\n  1. Deploy your Remotion site\n  2. Start rendering videos with captions\n'
		)
	} catch (error) {
		console.error('❌ Deployment failed:', error)
		process.exit(1)
	}
}

// Only run if called directly
if (require.main === module) {
	main()
}

export { main }

