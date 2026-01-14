/**
 * Tauri utilities for the frontend
 * Handles detection and communication with Tauri runtime
 */

declare global {
	interface Window {
		__TAURI_INTERNALS__?: unknown;
	}
}

/**
 * Check if we're running inside a Tauri application
 */
export function isTauri(): boolean {
	return typeof window !== "undefined" && window.__TAURI_INTERNALS__ !== undefined;
}

/**
 * Get the backend URL from Tauri
 * Returns null if not in Tauri or backend not ready
 */
export async function getBackendUrl(): Promise<string | null> {
	if (!isTauri()) {
		return null;
	}

	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const url = await invoke<string>("get_backend_url");
		return url;
	} catch {
		return null;
	}
}

/**
 * Check if the backend sidecar is ready
 */
export async function isBackendReady(): Promise<boolean> {
	if (!isTauri()) {
		return true; // In web mode, assume backend is ready
	}

	try {
		const { invoke } = await import("@tauri-apps/api/core");
		return await invoke<boolean>("is_backend_ready");
	} catch {
		return false;
	}
}

/**
 * Get the app data directory
 */
export async function getDataDir(): Promise<string | null> {
	if (!isTauri()) {
		return null;
	}

	try {
		const { invoke } = await import("@tauri-apps/api/core");
		return await invoke<string>("get_data_dir");
	} catch {
		return null;
	}
}

/**
 * Open the app data directory in the system file manager
 */
export async function openDataDir(): Promise<void> {
	if (!isTauri()) {
		return;
	}

	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("open_data_dir");
	} catch (error) {
		console.error("Failed to open data directory:", error);
	}
}

/**
 * Wait for the backend to be ready with a timeout
 */
export async function waitForBackend(timeoutMs = 30000): Promise<string> {
	if (!isTauri()) {
		return "/"; // In web mode, use relative URL
	}

	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		const ready = await isBackendReady();
		if (ready) {
			const url = await getBackendUrl();
			if (url) {
				return url;
			}
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	throw new Error("El backend no pudo iniciarse dentro del tiempo límite");
}
