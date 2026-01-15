import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "~/lib/auth";

// Auth client with dynamic baseURL support
// In Tauri, the backend URL will be set after initialization
export const authClient = createAuthClient({
	// Use window.location.origin as base - this will work in both dev and Tauri
	// In Tauri, the frontend is served from tauri://localhost but we'll override the fetch
	fetchOptions: {
		customFetchImpl: async (url, options) => {
			// Get the backend URL from global variable (set by app/root.tsx)
			const backendUrl = (window as any).__TAURI_BACKEND_URL__ || window.location.origin;

			// Convert relative URLs to absolute using the backend URL
			const urlString = url.toString();
			const fullUrl = urlString.startsWith('http')
				? urlString
				: `${backendUrl}${urlString.startsWith('/') ? '' : '/'}${urlString}`;

			console.info("[Auth Client] Fetching:", fullUrl);
			return fetch(fullUrl, options);
		},
	},
	plugins: [inferAdditionalFields<typeof auth>(), usernameClient(), twoFactorClient()],
});
