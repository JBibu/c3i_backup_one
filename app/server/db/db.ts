import { Database } from "bun:sqlite";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { DATABASE_URL } from "../core/constants";
import fs from "node:fs";
import { config } from "../core/config";
import type * as schemaTypes from "./schema";

/**
 * TODO: try to remove this if moving away from react-router.
 * The rr vite plugin doesn't let us customize the chunk names
 * to isolate the db initialization code from the rest of the server code.
 */
let _sqlite: Database | undefined;
let _db: ReturnType<typeof drizzle<typeof schemaTypes>> | undefined;
let _schema: typeof schemaTypes | undefined;

/**
 * Sets the database schema. This must be called before any database operations.
 */
export const setSchema = (schema: typeof schemaTypes) => {
	_schema = schema;
};

const initDb = () => {
	if (!_schema) {
		throw new Error("Database schema not set. Call setSchema() before accessing the database.");
	}

	fs.mkdirSync(path.dirname(DATABASE_URL), { recursive: true });

	if (fs.existsSync(path.join(path.dirname(DATABASE_URL), "ironmount.db")) && !fs.existsSync(DATABASE_URL)) {
		fs.renameSync(path.join(path.dirname(DATABASE_URL), "ironmount.db"), DATABASE_URL);
	}

	_sqlite = new Database(DATABASE_URL);
	return drizzle({ client: _sqlite, schema: _schema });
};

/**
 * Database instance (Proxy for lazy initialization)
 */
export const db = new Proxy(
	{},
	{
		get(_, prop, receiver) {
			if (!_db) {
				_db = initDb();
			}
			return Reflect.get(_db, prop, receiver);
		},
	},
) as ReturnType<typeof drizzle<typeof schemaTypes>>;

export const runDbMigrations = () => {
	let migrationsFolder: string;

	// Check if running as Bun compiled executable
	const isCompiledExecutable = Bun.main.endsWith(".exe") || (!Bun.main.endsWith(".js") && !Bun.main.endsWith(".ts"));

	if (config.migrationsPath) {
		// Tauri sets this to the bundled drizzle directory
		migrationsFolder = config.migrationsPath;
	} else if (isCompiledExecutable) {
		// When running as compiled sidecar, look for drizzle folder next to the executable on disk
		// process.execPath gives the actual filesystem path (Bun.main gives virtual /$bunfs/root path)
		migrationsFolder = path.join(path.dirname(process.execPath), "drizzle");
	} else if (config.__prod__) {
		migrationsFolder = path.join("/app", "assets", "migrations");
	} else {
		migrationsFolder = path.join(process.cwd(), "app", "drizzle");
	}

	migrate(db, { migrationsFolder });

	if (!_sqlite) {
		throw new Error("Database not initialized");
	}

	_sqlite.run("PRAGMA foreign_keys = ON;");
};
