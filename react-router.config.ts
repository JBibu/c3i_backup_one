import type { Config } from "@react-router/dev/config";

export default {
	buildDirectory: "dist",
	ssr: process.env.BUILD_TARGET !== "tauri",
	future: {
		v8_middleware: true,
	},
} satisfies Config;
