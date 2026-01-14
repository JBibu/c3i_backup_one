export const OPERATION_TIMEOUT = 5000;

export const VOLUME_MOUNT_BASE = process.env.C3I_BACKUP_ONE_VOLUMES_DIR || "/var/lib/c3i-backup-one/volumes";
export const REPOSITORY_BASE = process.env.C3I_BACKUP_ONE_REPOSITORIES_DIR || "/var/lib/c3i-backup-one/repositories";

export const RESTIC_CACHE_DIR = process.env.RESTIC_CACHE_DIR || "/var/lib/c3i-backup-one/restic/cache";

export const DATABASE_URL = process.env.DATABASE_URL || "/var/lib/c3i-backup-one/data/zerobyte.db";
export const RESTIC_PASS_FILE = process.env.RESTIC_PASS_FILE || "/var/lib/c3i-backup-one/data/restic.pass";

export const DEFAULT_EXCLUDES = [DATABASE_URL, RESTIC_PASS_FILE, REPOSITORY_BASE];
