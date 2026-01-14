import path from "node:path";
import fs from "node:fs";

/**
 * Normalize Windows UNC paths (\\?\C:\...) to regular paths
 * Windows UNC paths can cause issues with some filesystem operations
 */
const normalizeWindowsPath = (pathStr: string): string => {
	// Remove UNC prefix if present
	if (pathStr.startsWith("\\\\?\\")) {
		return pathStr.slice(4);
	}
	return pathStr;
};

/**
 * Resolves the path to a bundled binary.
 * In Tauri mode, binaries are bundled in the resources directory.
 * In development/Docker mode, binaries are expected in PATH.
 */
export function resolveBinaryPath(binaryName: string): string {
	const resourcesPath = process.env.C3I_BACKUP_ONE_RESOURCES_PATH;

	if (resourcesPath) {
		// Normalize Windows UNC paths
		const normalizedResourcesPath = normalizeWindowsPath(resourcesPath);
		// Look for bundled binary in resources path
		const platform = process.platform;
		const isWindows = platform === "win32";
		const binaryFileName = isWindows ? `${binaryName}.exe` : binaryName;

		// Try direct path first
		let binaryPath = path.join(normalizedResourcesPath, binaryFileName);
		if (fs.existsSync(binaryPath)) {
			return binaryPath;
		}

		// Try platform-specific subdirectory
		const platformDir = getPlatformDir();
		binaryPath = path.join(normalizedResourcesPath, platformDir, binaryFileName);
		if (fs.existsSync(binaryPath)) {
			return binaryPath;
		}

		// Fall back to just the binary name (will look in PATH)
		console.warn(`Bundled binary not found: ${binaryPath}, falling back to PATH`);
	}

	// In development/Docker mode, use binary from PATH
	return binaryName;
}

function getPlatformDir(): string {
	const platform = process.platform;
	const arch = process.arch;

	const platformMap: Record<string, string> = {
		linux: "linux",
		darwin: "darwin",
		win32: "windows",
	};

	const archMap: Record<string, string> = {
		x64: "amd64",
		arm64: "arm64",
	};

	return `${platformMap[platform] || platform}-${archMap[arch] || arch}`;
}

/**
 * Check if a binary exists and is executable
 */
export function binaryExists(binaryName: string): boolean {
	const binaryPath = resolveBinaryPath(binaryName);

	// If it's just the binary name, assume it's in PATH
	if (!path.isAbsolute(binaryPath)) {
		return true;
	}

	try {
		fs.accessSync(binaryPath, fs.constants.X_OK);
		return true;
	} catch {
		return false;
	}
}
