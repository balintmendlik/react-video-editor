import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: false,
	
	// Mark server-only code that should never be bundled for client
	serverExternalPackages: [
		'@remotion/lambda',
		'@remotion/renderer',
		'@remotion/bundler',
		'@remotion/cli',
		'@remotion/studio',
		'@remotion/studio-server',
		'prettier',
	],
	
	// Disable Webpack filesystem cache to avoid ENOENT issues on iCloud paths
	webpack: (config, { isServer, webpack }) => {
		if (config.cache && (config as any).cache?.type === "filesystem") {
			config.cache = false as any;
		}

		// Exclude Remotion server packages from client-side bundle
		if (!isServer) {
			config.plugins = config.plugins || [];
			
			// Replace problematic modules with empty stubs
			config.plugins.push(
				new webpack.NormalModuleReplacementPlugin(
					/@remotion\/(lambda|renderer|bundler|cli|studio|studio-server|studio-shared|compositor-.*)/,
					require.resolve('./src/lib/empty-module.js')
				),
				new webpack.NormalModuleReplacementPlugin(
					/^prettier$/,
					require.resolve('./src/lib/empty-module.js')
				)
			);

			config.resolve = config.resolve || {};
			config.resolve.alias = {
				...config.resolve.alias,
				// Server-only Remotion packages
				'@remotion/lambda': false,
				'@remotion/renderer': false,
				'@remotion/bundler': false,
				'@remotion/cli': false,
				'@remotion/studio': false,
				'@remotion/studio-server': false,
				'@remotion/studio-shared': false,
				// Platform-specific compositor packages
				'@remotion/compositor-win32-x64-msvc': false,
				'@remotion/compositor-darwin-x64': false,
				'@remotion/compositor-darwin-arm64': false,
				'@remotion/compositor-linux-x64-gnu': false,
				'@remotion/compositor-linux-arm64-gnu': false,
				'@remotion/compositor-linux-arm64-musl': false,
				'@remotion/compositor-linux-x64-musl': false,
				// Server-only dependencies
				'prettier': false,
				'webpack': false,
			};
		}

		return config;
	},
};

export default nextConfig;
