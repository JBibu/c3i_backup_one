import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "./client/components/ui/sonner";
import { useServerEvents } from "./client/hooks/use-server-events";
import { client } from "./client/api-client/client.gen";
import { isTauri, waitForBackend } from "./client/lib/tauri";

// Initialize client with default baseUrl (will be updated in Tauri mode)
client.setConfig({
	baseUrl: "/",
});

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap",
	},
];

const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onSuccess: () => {
			void queryClient.invalidateQueries();
		},
		onError: (error) => {
			console.error("Mutation error:", error);
			void queryClient.invalidateQueries();
		},
	}),
});

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
				<link rel="icon" type="image/png" href="/images/favicon/favicon-96x96.png" sizes="96x96" />
				<link rel="icon" type="image/svg+xml" href="/images/favicon/favicon.svg" />
				<link rel="shortcut icon" href="/images/favicon/favicon.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/images/favicon/apple-touch-icon.png" />
				<meta name="apple-mobile-web-app-title" content="C3i Backup ONE" />
				<link rel="manifest" href="/images/favicon/site.webmanifest" />
				<Meta />
				<Links />
			</head>
			<QueryClientProvider client={queryClient}>
				<body className="dark">
					{children}
					<Toaster />
					<ScrollRestoration />
					<Scripts />
				</body>
			</QueryClientProvider>
		</html>
	);
}

export default function App() {
	// In dev mode, backend is always ready (Vite dev server on port 4096)
	// In production Tauri, we need to wait for the sidecar
	const isDev = import.meta.env.DEV;
	const [backendReady, setBackendReady] = useState(!isTauri() || isDev);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isTauri() && !isDev) {
			waitForBackend()
				.then((backendUrl) => {
					client.setConfig({ baseUrl: backendUrl });
					setBackendReady(true);
				})
				.catch((err) => {
					setError(err instanceof Error ? err.message : "Failed to connect to backend");
				});
		}
	}, []);

	useServerEvents();

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<div className="text-center p-8">
					<h1 className="text-2xl font-bold text-destructive mb-4">Connection Error</h1>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

	if (!backendReady) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<div className="text-center p-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Starting C3i Backup ONE...</p>
				</div>
			</div>
		);
	}

	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-4 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
