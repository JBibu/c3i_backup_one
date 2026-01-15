#!/usr/bin/env bun
/**
 * Download script for platform-specific binaries (restic, rclone, shoutrrr)
 * Downloads and extracts binaries for all supported platforms.
 */

import path from "node:path";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { BINARY_VERSIONS, getCurrentPlatform, convertArchName } from "./config";

const ROOT_DIR = path.resolve(import.meta.dir, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "src-tauri", "resources", "bin");

// Binary versions from shared config
const RESTIC_VERSION = BINARY_VERSIONS.RESTIC;
const RCLONE_VERSION = BINARY_VERSIONS.RCLONE;
const SHOUTRRR_VERSION = BINARY_VERSIONS.SHOUTRRR;

interface PlatformConfig {
	restic: string;
	rclone: string;
	shoutrrr: string;
	archiveType: "zip" | "tar.gz" | "bz2";
	exeSuffix: string;
}

const PLATFORMS: Record<string, PlatformConfig> = {
	"linux-amd64": {
		restic: `https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_linux_amd64.bz2`,
		rclone: `https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-amd64.zip`,
		shoutrrr: `https://github.com/nicholas-fedor/shoutrrr/releases/download/v${SHOUTRRR_VERSION}/shoutrrr_linux_amd64_${SHOUTRRR_VERSION}.tar.gz`,
		archiveType: "zip",
		exeSuffix: "",
	},
	"linux-arm64": {
		restic: `https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_linux_arm64.bz2`,
		rclone: `https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-arm64.zip`,
		shoutrrr: `https://github.com/nicholas-fedor/shoutrrr/releases/download/v${SHOUTRRR_VERSION}/shoutrrr_linux_arm64v8_${SHOUTRRR_VERSION}.tar.gz`,
		archiveType: "zip",
		exeSuffix: "",
	},
	"darwin-amd64": {
		restic: `https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_darwin_amd64.bz2`,
		rclone: `https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-osx-amd64.zip`,
		shoutrrr: `https://github.com/nicholas-fedor/shoutrrr/releases/download/v${SHOUTRRR_VERSION}/shoutrrr_darwin_amd64_${SHOUTRRR_VERSION}.tar.gz`,
		archiveType: "zip",
		exeSuffix: "",
	},
	"darwin-arm64": {
		restic: `https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_darwin_arm64.bz2`,
		rclone: `https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-osx-arm64.zip`,
		shoutrrr: `https://github.com/nicholas-fedor/shoutrrr/releases/download/v${SHOUTRRR_VERSION}/shoutrrr_darwin_arm64_${SHOUTRRR_VERSION}.tar.gz`,
		archiveType: "zip",
		exeSuffix: "",
	},
	"windows-amd64": {
		restic: `https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_windows_amd64.zip`,
		rclone: `https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-windows-amd64.zip`,
		shoutrrr: `https://github.com/nicholas-fedor/shoutrrr/releases/download/v${SHOUTRRR_VERSION}/shoutrrr_windows_amd64_${SHOUTRRR_VERSION}.tar.gz`,
		archiveType: "zip",
		exeSuffix: ".exe",
	},
};

async function downloadFile(url: string, destPath: string): Promise<void> {
	console.info(`  Downloading: ${url}`);

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download ${url}: ${response.statusText}`);
	}

	const fileStream = createWriteStream(destPath);
	// @ts-ignore - ReadableStream compatibility
	await pipeline(response.body as NodeJS.ReadableStream, fileStream);
}

async function extractBz2(archivePath: string, outputPath: string): Promise<void> {
	const { $ } = await import("bun");
	await $`bzip2 -dk ${archivePath}`;

	// The decompressed file has the same name without .bz2
	const decompressedPath = archivePath.replace(".bz2", "");
	await fs.rename(decompressedPath, outputPath);
	await fs.unlink(archivePath);
}

async function extractZip(archivePath: string, outputDir: string, binaryName: string): Promise<string> {
	const { $ } = await import("bun");
	const tempDir = path.join(outputDir, "_temp_extract");

	await fs.mkdir(tempDir, { recursive: true });
	await $`unzip -o ${archivePath} -d ${tempDir}`;

	// Find the binary in extracted files
	const files = await fs.readdir(tempDir, { recursive: true, withFileTypes: true });
	for (const file of files) {
		if (file.isFile() && file.name.startsWith(binaryName)) {
			// Type assertion: parentPath exists in Node.js 20+ but not in all TS definitions
			const fileWithPath = file as any;
			const sourcePath = path.join(fileWithPath.parentPath || fileWithPath.path || tempDir, file.name);
			const destPath = path.join(outputDir, file.name);
			await fs.rename(sourcePath, destPath);
			await fs.rm(tempDir, { recursive: true });
			await fs.unlink(archivePath);
			return destPath;
		}
	}

	await fs.rm(tempDir, { recursive: true });
	throw new Error(`Binary ${binaryName} not found in archive`);
}

async function extractTarGz(archivePath: string, outputDir: string, binaryName: string): Promise<string> {
	const { $ } = await import("bun");
	const tempDir = path.join(outputDir, "_temp_extract");

	await fs.mkdir(tempDir, { recursive: true });
	await $`tar -xzf ${archivePath} -C ${tempDir}`;

	// Find the binary in extracted files
	const files = await fs.readdir(tempDir, { recursive: true, withFileTypes: true });
	for (const file of files) {
		if (file.isFile() && file.name.startsWith(binaryName)) {
			// Type assertion: parentPath exists in Node.js 20+ but not in all TS definitions
			const fileWithPath = file as any;
			const sourcePath = path.join(fileWithPath.parentPath || fileWithPath.path || tempDir, file.name);
			const destPath = path.join(outputDir, file.name);
			await fs.rename(sourcePath, destPath);
			await fs.rm(tempDir, { recursive: true });
			await fs.unlink(archivePath);
			return destPath;
		}
	}

	await fs.rm(tempDir, { recursive: true });
	throw new Error(`Binary ${binaryName} not found in archive`);
}

async function downloadRestic(platform: string, config: PlatformConfig, platformDir: string): Promise<void> {
	const archivePath = path.join(platformDir, `restic.bz2`);
	const binaryName = `restic${config.exeSuffix}`;
	const binaryPath = path.join(platformDir, binaryName);

	// Windows restic is a zip
	if (platform.startsWith("windows")) {
		const zipPath = path.join(platformDir, "restic.zip");
		await downloadFile(config.restic, zipPath);
		await extractZip(zipPath, platformDir, "restic");
	} else {
		await downloadFile(config.restic, archivePath);
		await extractBz2(archivePath, binaryPath);
	}

	await fs.chmod(binaryPath, 0o755);
	console.info(`  ✓ restic installed`);
}

async function downloadRclone(platform: string, config: PlatformConfig, platformDir: string): Promise<void> {
	const archivePath = path.join(platformDir, "rclone.zip");
	const binaryName = `rclone${config.exeSuffix}`;

	await downloadFile(config.rclone, archivePath);
	const extractedPath = await extractZip(archivePath, platformDir, "rclone");

	// Ensure correct name
	const finalPath = path.join(platformDir, binaryName);
	if (extractedPath !== finalPath) {
		await fs.rename(extractedPath, finalPath);
	}

	await fs.chmod(finalPath, 0o755);
	console.info(`  ✓ rclone installed`);
}

async function downloadShoutrrr(platform: string, config: PlatformConfig, platformDir: string): Promise<void> {
	const archivePath = path.join(platformDir, "shoutrrr.tar.gz");
	const binaryName = `shoutrrr${config.exeSuffix}`;

	await downloadFile(config.shoutrrr, archivePath);
	const extractedPath = await extractTarGz(archivePath, platformDir, "shoutrrr");

	// Ensure correct name
	const finalPath = path.join(platformDir, binaryName);
	if (extractedPath !== finalPath) {
		await fs.rename(extractedPath, finalPath);
	}

	await fs.chmod(finalPath, 0o755);
	console.info(`  ✓ shoutrrr installed`);
}

async function downloadForPlatform(platform: string): Promise<void> {
	const config = PLATFORMS[platform];
	if (!config) {
		console.error(`Unknown platform: ${platform}`);
		return;
	}

	const platformDir = path.join(OUTPUT_DIR, platform);
	await fs.mkdir(platformDir, { recursive: true });

	console.info(`\nDownloading binaries for ${platform}...`);

	try {
		await downloadRestic(platform, config, platformDir);
	} catch (error) {
		console.error(`  ✗ Failed to download restic:`, error);
	}

	try {
		await downloadRclone(platform, config, platformDir);
	} catch (error) {
		console.error(`  ✗ Failed to download rclone:`, error);
	}

	try {
		await downloadShoutrrr(platform, config, platformDir);
	} catch (error) {
		console.error(`  ✗ Failed to download shoutrrr:`, error);
	}
}

function getCurrentPlatformForDownload(): string {
	const platformInfo = getCurrentPlatform();
	// Download binaries use amd64 naming convention instead of x64
	const arch = convertArchName(platformInfo.arch, "amd64");
	return `${platformInfo.platform}-${arch}`;
}

// CLI entry point
const args = process.argv.slice(2);

if (args.includes("--all")) {
	console.info("Downloading binaries for all platforms...");
	console.info(`Versions: restic=${RESTIC_VERSION}, rclone=${RCLONE_VERSION}, shoutrrr=${SHOUTRRR_VERSION}`);

	for (const platform of Object.keys(PLATFORMS)) {
		await downloadForPlatform(platform);
	}
} else if (args.includes("--platform")) {
	const platformIndex = args.indexOf("--platform");
	const platform = args[platformIndex + 1];
	await downloadForPlatform(platform);
} else {
	// Download for current platform only
	const currentPlatform = getCurrentPlatformForDownload();
	console.info(`Downloading binaries for current platform: ${currentPlatform}`);
	console.info(`Versions: restic=${RESTIC_VERSION}, rclone=${RCLONE_VERSION}, shoutrrr=${SHOUTRRR_VERSION}`);
	await downloadForPlatform(currentPlatform);
}

console.info("\nDone!");
