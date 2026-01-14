import * as fs from "node:fs/promises";
import * as os from "node:os";
import { $ } from "bun";
import { OPERATION_TIMEOUT } from "../../../core/constants";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { getMountForPath } from "../../../utils/mountinfo";
import { withTimeout } from "../../../utils/timeout";
import type { VolumeBackend } from "../backend";
import { executeUnmount } from "../utils/backend-utils";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";

const mount = async (config: BackendConfig, path: string) => {
	logger.debug(`Mounting rclone volume ${path}...`);

	if (config.backend !== "rclone") {
		logger.error("Provided config is not for rclone backend");
		return { status: BACKEND_STATUS.error, error: "La configuración proporcionada no es para el backend Rclone" };
	}

	if (os.platform() !== "linux") {
		logger.error("Rclone mounting is only supported on Linux hosts.");
		return { status: BACKEND_STATUS.error, error: "El montaje de Rclone solo es compatible con hosts Linux." };
	}

	const { status } = await checkHealth(path);
	if (status === "mounted") {
		return { status: BACKEND_STATUS.mounted };
	}

	if (status === "error") {
		logger.debug(`Trying to unmount any existing mounts at ${path} before mounting...`);
		await unmount(path);
	}

	const run = async () => {
		await fs.mkdir(path, { recursive: true });

		const remotePath = `${config.remote}:${config.path}`;
		const args = ["mount", remotePath, path, "--daemon"];

		if (config.readOnly) {
			args.push("--read-only");
		}

		args.push("--vfs-cache-mode", "writes");
		args.push("--allow-non-empty");
		args.push("--allow-other");

		logger.debug(`Mounting rclone volume ${path}...`);
		logger.info(`Executing rclone: rclone ${args.join(" ")}`);

		const result = await $`rclone ${args}`.nothrow();

		if (result.exitCode !== 0) {
			const errorMsg = result.stderr.toString() || result.stdout.toString() || "Error desconocido";
			throw new Error(`Error al montar el volumen Rclone: ${errorMsg}`);
		}

		logger.info(`Rclone volume at ${path} mounted successfully.`);
		return { status: BACKEND_STATUS.mounted };
	};

	try {
		return await withTimeout(run(), OPERATION_TIMEOUT, "Rclone mount");
	} catch (error) {
		const errorMsg = toMessage(error);

		logger.error("Error mounting rclone volume", { error: errorMsg });
		return { status: BACKEND_STATUS.error, error: errorMsg };
	}
};

const unmount = async (path: string) => {
	if (os.platform() !== "linux") {
		logger.error("Rclone unmounting is only supported on Linux hosts.");
		return { status: BACKEND_STATUS.error, error: "El desmontaje de Rclone solo es compatible con hosts Linux." };
	}

	const run = async () => {
		const mount = await getMountForPath(path);
		if (!mount || mount.mountPoint !== path) {
			logger.debug(`Path ${path} is not a mount point. Skipping unmount.`);
			return { status: BACKEND_STATUS.unmounted };
		}

		await executeUnmount(path);
		await fs.rmdir(path).catch(() => {});

		logger.info(`Rclone volume at ${path} unmounted successfully.`);
		return { status: BACKEND_STATUS.unmounted };
	};

	try {
		return await withTimeout(run(), OPERATION_TIMEOUT, "Rclone unmount");
	} catch (error) {
		logger.error("Error unmounting rclone volume", { path, error: toMessage(error) });
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

const checkHealth = async (path: string) => {
	const run = async () => {
		try {
			await fs.access(path);
		} catch {
			throw new Error("El volumen no está montado");
		}

		const mount = await getMountForPath(path);

		if (!mount || mount.mountPoint !== path) {
			throw new Error("El volumen no está montado");
		}

		if (!mount.fstype.includes("rclone")) {
			throw new Error(`La ruta ${path} no está montada como Rclone (se encontró ${mount.fstype}).`);
		}

		logger.debug(`Rclone volume at ${path} is healthy and mounted.`);
		return { status: BACKEND_STATUS.mounted };
	};

	try {
		return await withTimeout(run(), OPERATION_TIMEOUT, "Rclone health check");
	} catch (error) {
		const message = toMessage(error);
		if (message !== "El volumen no está montado") {
			logger.error("Rclone volume health check failed:", message);
		}
		return { status: BACKEND_STATUS.error, error: message };
	}
};

export const makeRcloneBackend = (config: BackendConfig, path: string): VolumeBackend => ({
	mount: () => mount(config, path),
	unmount: () => unmount(path),
	checkHealth: () => checkHealth(path),
});
