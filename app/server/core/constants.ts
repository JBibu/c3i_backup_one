/**
 * Normalize Windows UNC paths (\\?\C:\...) to regular paths
 * Windows UNC paths can cause issues with some filesystem operations
 */
const normalizeWindowsPath = (path: string): string => {
	// Remove UNC prefix if present
	if (path.startsWith("\\\\?\\")) {
		return path.slice(4);
	}
	return path;
};

export const OPERATION_TIMEOUT = 5000;

export const VOLUME_MOUNT_BASE = normalizeWindowsPath(
	process.env.C3I_BACKUP_ONE_VOLUMES_DIR || "/var/lib/c3i-backup-one/volumes",
);
export const REPOSITORY_BASE = normalizeWindowsPath(
	process.env.C3I_BACKUP_ONE_REPOSITORIES_DIR || "/var/lib/c3i-backup-one/repositories",
);

export const RESTIC_CACHE_DIR = normalizeWindowsPath(
	process.env.RESTIC_CACHE_DIR || "/var/lib/c3i-backup-one/restic/cache",
);

export const DATABASE_URL = normalizeWindowsPath(
	process.env.DATABASE_URL || "/var/lib/c3i-backup-one/data/zerobyte.db",
);
export const RESTIC_PASS_FILE = normalizeWindowsPath(
	process.env.RESTIC_PASS_FILE || "/var/lib/c3i-backup-one/data/restic.pass",
);

export const DEFAULT_EXCLUDES = [DATABASE_URL, RESTIC_PASS_FILE, REPOSITORY_BASE];
