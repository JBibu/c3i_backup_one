#!/usr/bin/env bun
/**
 * Build script for Tauri frontend (SPA mode)
 * Sets BUILD_TARGET=tauri environment variable for cross-platform compatibility
 */

import { $ } from "bun";

// Set environment variable and run react-router build
await $`react-router build`.env({ BUILD_TARGET: "tauri" });
