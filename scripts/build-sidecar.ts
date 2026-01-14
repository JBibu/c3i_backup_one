#!/usr/bin/env bun
/**
 * Build script for compiling the C3i Backup ONE server into a standalone sidecar binary
 * using Bun's compile feature.
 */

import { $ } from "bun";
import path from "node:path";
import fs from "node:fs/promises";

const ROOT_DIR = path.resolve(import.meta.dir, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "src-tauri", "resources");

// Platform/architecture mappings for Tauri sidecar naming convention
const TARGETS: Record<string, { bunTarget: string; tauriSuffix: string }> = {
	"linux-x64": { bunTarget: "bun-linux-x64", tauriSuffix: "x86_64-unknown-linux-gnu" },
	"linux-arm64": { bunTarget: "bun-linux-arm64", tauriSuffix: "aarch64-unknown-linux-gnu" },
	"darwin-x64": { bunTarget: "bun-darwin-x64", tauriSuffix: "x86_64-apple-darwin" },
	"darwin-arm64": { bunTarget: "bun-darwin-arm64", tauriSuffix: "aarch64-apple-darwin" },
	"windows-x64": { bunTarget: "bun-windows-x64", tauriSuffix: "x86_64-pc-windows-msvc" },
};

async function getCurrentPlatform(): Promise<string> {
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

	return `${platformMap[platform]}-${archMap[arch]}`;
}

async function buildSidecar(target?: string) {
	const currentPlatform = await getCurrentPlatform();
	const targetPlatform = target || currentPlatform;

	const targetConfig = TARGETS[targetPlatform];
	if (!targetConfig) {
		console.error(`Unknown target platform: ${targetPlatform}`);
		console.error(`Available targets: ${Object.keys(TARGETS).join(", ")}`);
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

	// Copy migrations to dist/server folder so they get embedded in the compiled binary
	// Bun only embeds files in the same directory tree as the entry point
	console.log("Copying migrations to dist/server/drizzle...");
	const migrationsSource = path.join(ROOT_DIR, "app", "drizzle");
	const migrationsDest = path.join(ROOT_DIR, "dist", "server", "drizzle");
	await fs.rm(migrationsDest, { recursive: true, force: true });
	await fs.cp(migrationsSource, migrationsDest, { recursive: true });

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

	for (const target of Object.keys(TARGETS)) {
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
