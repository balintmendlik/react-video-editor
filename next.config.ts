import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: false,
	// Disable Webpack filesystem cache to avoid ENOENT issues on iCloud paths
	webpack: (config) => {
		if (config.cache && (config as any).cache?.type === "filesystem") {
			config.cache = false as any;
		}
		return config;
	},
};

export default nextConfig;
