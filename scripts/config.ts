/**
 * Shared configuration for build and download scripts
 * Centralizes versions, platform mappings, and constants
 */

// Binary versions (keep in sync with Dockerfile)
export const BINARY_VERSIONS = {
	RESTIC: "0.18.1",
	RCLONE: "1.72.1",
	SHOUTRRR: "0.13.1",
} as const;

// Platform/architecture normalization
export interface PlatformInfo {
	platform: string;
	arch: string;
	key: string;
}

/**
 * Get normalized platform information for the current system
 */
export function getCurrentPlatform(): PlatformInfo {
	const platform = process.platform;
	const arch = process.arch;

	const platformMap: Record<string, string> = {
		linux: "linux",
		darwin: "darwin",
		win32: "windows",
	};

	const archMap: Record<string, string> = {
		x64: "x64",
		arm64: "arm64",
	};

	const normalizedPlatform = platformMap[platform];
	const normalizedArch = archMap[arch];

	if (!normalizedPlatform || !normalizedArch) {
		throw new Error(`Unsupported platform: ${platform}-${arch}`);
	}

	return {
		platform: normalizedPlatform,
		arch: normalizedArch,
		key: `${normalizedPlatform}-${normalizedArch}`,
	};
}

/**
 * Convert platform key to different architecture naming conventions
 */
export function convertArchName(arch: string, convention: "x64" | "amd64"): string {
	if (convention === "amd64") {
		return arch === "x64" ? "amd64" : arch;
	}
	return arch === "amd64" ? "x64" : arch;
}

/**
 * Platform/target mappings for Tauri sidecar naming convention
 */
export const TAURI_TARGETS: Record<string, { bunTarget: string; tauriSuffix: string }> = {
	"linux-x64": { bunTarget: "bun-linux-x64", tauriSuffix: "x86_64-unknown-linux-gnu" },
	"linux-arm64": { bunTarget: "bun-linux-arm64", tauriSuffix: "aarch64-unknown-linux-gnu" },
	"darwin-x64": { bunTarget: "bun-darwin-x64", tauriSuffix: "x86_64-apple-darwin" },
	"darwin-arm64": { bunTarget: "bun-darwin-arm64", tauriSuffix: "aarch64-apple-darwin" },
	"windows-x64": { bunTarget: "bun-windows-x64", tauriSuffix: "x86_64-pc-windows-msvc" },
};

/**
 * Get Tauri target configuration for a platform
 */
export function getTauriTarget(platformKey: string) {
	const target = TAURI_TARGETS[platformKey];
	if (!target) {
		throw new Error(`Unknown Tauri target platform: ${platformKey}`);
	}
	return target;
}

/**
 * Get all supported platform keys
 */
export function getSupportedPlatforms(): string[] {
	return Object.keys(TAURI_TARGETS);
}
