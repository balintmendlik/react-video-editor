/**
 * Remotion Configuration
 * 
 * This configuration is used when deploying to AWS Lambda and rendering videos
 */

import { Config } from '@remotion/cli/config'

// Set the entry point for Remotion
Config.setEntryPoint('./remotion/root.tsx')

// Enable concurrent rendering for better performance
Config.setConcurrency(2)

// Set output location
Config.setOutputLocation('out/video.mp4')

// Enable image caching for better performance
Config.setImageSequenceCaching(true)

// Set timeout for individual frames (in milliseconds)
Config.setTimeoutInMilliseconds(30000)

// Enable browser logging
Config.setLevel('verbose')

// Override webpack configuration if needed
Config.overrideWebpackConfig((currentConfiguration) => {
	return {
		...currentConfiguration,
		// Add any webpack customizations here
		resolve: {
			...currentConfiguration.resolve,
			alias: {
				...currentConfiguration.resolve?.alias,
				// Add path aliases if needed
			},
		},
	}
})

