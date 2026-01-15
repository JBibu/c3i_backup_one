#!/usr/bin/env bun
/**
 * Full Tauri build orchestration script
 * Downloads binaries, builds sidecar, and triggers Tauri build
 */

import { $ } from "bun";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dir, "..");

async function main() {
	const args = process.argv.slice(2);
	const skipDownload = args.includes("--skip-download");
	const skipSidecar = args.includes("--skip-sidecar");
	const allPlatforms = args.includes("--all");

	console.info("=== C3i Backup ONE Tauri Build ===\n");

	// Step 1: Download binaries
	if (!skipDownload) {
		console.info("Step 1: Downloading platform binaries...");
		if (allPlatforms) {
			await $`bun run ${path.join(ROOT_DIR, "scripts/download-binaries.ts")} --all`.cwd(ROOT_DIR);
		} else {
			await $`bun run ${path.join(ROOT_DIR, "scripts/download-binaries.ts")}`.cwd(ROOT_DIR);
		}
		console.info("");
	} else {
		console.info("Step 1: Skipping binary download (--skip-download)\n");
	}

	// Step 2: Build sidecar
	if (!skipSidecar) {
		console.info("Step 2: Building sidecar binary...");
		if (allPlatforms) {
			await $`bun run ${path.join(ROOT_DIR, "scripts/build-sidecar.ts")} --all`.cwd(ROOT_DIR);
		} else {
			await $`bun run ${path.join(ROOT_DIR, "scripts/build-sidecar.ts")}`.cwd(ROOT_DIR);
		}
		console.info("");
	} else {
		console.info("Step 2: Skipping sidecar build (--skip-sidecar)\n");
	}

	// Step 3: Build Tauri app
	console.info("Step 3: Building Tauri application...");
	await $`bunx tauri build`.cwd(ROOT_DIR);

	console.info("\n=== Build Complete ===");
}

main().catch((error) => {
	console.error("Build failed:", error);
	process.exit(1);
});
