import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { reactRouterHonoServer } from "react-router-hono-server/dev";

export default defineConfig({
	plugins: [reactRouterHonoServer({ runtime: "bun" }), reactRouter(), tailwindcss(), tsconfigPaths()],
	build: {
		outDir: "dist",
		sourcemap: false,
		rollupOptions: {
			external: ["bun"],
		},
	},
	server: {
		host: true,
		port: 4096,
		headers: {
			"Cache-Control": "no-store",
		},
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
	optimizeDeps: {
		force: true,
		noDiscovery: true,
		include: [
			"react",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-dom",
			"react-dom/client",
			"react-router",
			"@tanstack/react-query",
			"next-themes",
			"sonner",
			"lucide-react",
			"@radix-ui/react-slot",
			"class-variance-authority",
			"better-auth/react",
			"better-auth/client/plugins",
			"clsx",
			"tailwind-merge",
			"@radix-ui/react-separator",
			"@radix-ui/react-dialog",
			"@radix-ui/react-tooltip",
			"@radix-ui/react-hover-card",
			"react-markdown",
			"remark-gfm",
			"@radix-ui/react-scroll-area",
			"date-fns",
			"@radix-ui/react-select",
			"@tauri-apps/api/core",
			"@hookform/resolvers/arktype",
			"arktype",
			"react-hook-form",
			"@radix-ui/react-label",
			"@radix-ui/react-checkbox",
			"@radix-ui/react-switch",
			"@radix-ui/react-tabs",
			"@radix-ui/react-progress",
			"@radix-ui/react-alert-dialog",
			"@radix-ui/react-collapsible",
			"recharts",
			"input-otp",
			"qrcode.react",
			"cron-parser",
		],
	},
});
