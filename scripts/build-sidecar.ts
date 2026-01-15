#!/usr/bin/env bun
/**
 * Build script for compiling the C3i Backup ONE server into a standalone sidecar binary
 * using Bun's compile feature.
 */

import { $ } from "bun";
import path from "node:path";
import fs from "node:fs/promises";
import { getCurrentPlatform, getTauriTarget, getSupportedPlatforms } from "./config";

const ROOT_DIR = path.resolve(import.meta.dir, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "src-tauri", "resources");

async function buildSidecar(target?: string) {
	const currentPlatform = getCurrentPlatform();
	const targetPlatform = target || currentPlatform.key;

	const targetConfig = getTauriTarget(targetPlatform);
	if (!targetConfig) {
		console.error(`Unknown target platform: ${targetPlatform}`);
		console.error(`Available targets: ${getSupportedPlatforms().join(", ")}`);
		process.exit(1);
	}

	console.log(`Building sidecar for ${targetPlatform}...`);

	// Ensure output directory exists
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	const outputName =
		targetPlatform.startsWith("windows")
			? `c3i-backup-one-server-${targetConfig.tauriSuffix}.exe`
			: `c3i-backup-one-server-${targetConfig.tauriSuffix}`;

	const outputPath = path.join(OUTPUT_DIR, outputName);

	// Build the server first
	console.log("Building server with react-router...");
	await $`bun run build`.cwd(ROOT_DIR);

	// Note: Migrations are NOT embedded in the sidecar binary
	// They are bundled separately by Tauri and referenced via MIGRATIONS_PATH env var
	// or found next to the executable at runtime

	// Compile to standalone binary
	console.log(`Compiling to standalone binary: ${outputName}`);

	const compileArgs = [
		"build",
		"--compile",
		"--minify",
		"--target",
		targetConfig.bunTarget,
		"--outfile",
		outputPath,
		"./dist/server/index.js",
	];

	await $`bun ${compileArgs}`.cwd(ROOT_DIR);

	// Make executable on Unix
	if (!targetPlatform.startsWith("windows")) {
		await fs.chmod(outputPath, 0o755);
	}

	console.log(`Sidecar built successfully: ${outputPath}`);
	return outputPath;
}

async function buildAllPlatforms() {
	console.log("Building sidecars for all platforms...");

	for (const target of getSupportedPlatforms()) {
		try {
			await buildSidecar(target);
		} catch (error) {
			console.error(`Failed to build for ${target}:`, error);
		}
	}
}

// CLI entry point
const args = process.argv.slice(2);

if (args.includes("--all")) {
	await buildAllPlatforms();
} else if (args.includes("--target")) {
	const targetIndex = args.indexOf("--target");
	const target = args[targetIndex + 1];
	await buildSidecar(target);
} else {
	// Build for current platform only
	await buildSidecar();
}
