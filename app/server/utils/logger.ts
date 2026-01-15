import { createLogger, format, transports } from "winston";
import { sanitizeSensitiveData } from "./sanitize";
import path from "node:path";
import fs from "node:fs";

const { printf, combine, colorize, timestamp, errors } = format;

// Enhanced console format with timestamp and better structure
const printConsole = printf((info) => {
	const ts = info.timestamp as string;
	const level = info.level;
	const message = String(info.message);

	// Extract just the time portion (HH:MM:SS)
	const time = ts.split("T")[1]?.split(".")[0] || ts;

	return `${time} ${level} > ${message}`;
});

// File format with full timestamp and JSON structure for parsing
const printFile = printf((info) => {
	const ts = info.timestamp as string;
	const level = info.level.replace(/\x1B\[\d+m/g, ""); // Remove color codes
	const message = String(info.message);

	return JSON.stringify({
		timestamp: ts,
		level,
		message,
		...(info.stack ? { stack: info.stack } : {}),
	});
});

const consoleFormat = combine(
	timestamp(),
	errors({ stack: true }),
	colorize(),
	printConsole,
);

const fileFormat = combine(
	timestamp(),
	errors({ stack: true }),
	printFile,
);

const getDefaultLevel = () => {
	const isProd = process.env.NODE_ENV === "production";
	return isProd ? "info" : "debug";
};

// Get logs directory based on environment
const getLogsDir = (): string => {
	// Tauri mode - Tauri passes the platform-specific logs directory
	if (process.env.C3I_BACKUP_ONE_TAURI === "1" && process.env.C3I_BACKUP_ONE_LOGS_DIR) {
		return process.env.C3I_BACKUP_ONE_LOGS_DIR;
	}

	// Windows Service mode
	if (process.platform === "win32" && process.env.NODE_ENV === "production") {
		const dataDir = process.env.DATABASE_URL ? path.dirname(process.env.DATABASE_URL) : "C:\\ProgramData\\C3iBackupONE";
		return path.join(dataDir, "logs");
	}

	// Docker/Linux production
	if (process.env.NODE_ENV === "production") {
		const dataDir = process.env.DATABASE_URL ? path.dirname(process.env.DATABASE_URL) : "/var/lib/c3i-backup-one/data";
		return path.join(dataDir, "logs");
	}

	// Development mode
	return path.join(process.cwd(), "data", "logs");
};

// Ensure logs directory exists
const logsDir = getLogsDir();
fs.mkdirSync(logsDir, { recursive: true });

// Configure transports
const logTransports: any[] = [
	// Console transport (always enabled)
	new transports.Console({
		level: process.env.LOG_LEVEL || getDefaultLevel(),
		format: consoleFormat,
	}),

	// File transport for all logs (with rotation)
	new transports.File({
		filename: path.join(logsDir, "combined.log"),
		level: process.env.LOG_LEVEL || getDefaultLevel(),
		format: fileFormat,
		maxsize: 10 * 1024 * 1024, // 10MB
		maxFiles: 5,
		tailable: true,
	}),

	// Separate file for errors only
	new transports.File({
		filename: path.join(logsDir, "error.log"),
		level: "error",
		format: fileFormat,
		maxsize: 10 * 1024 * 1024, // 10MB
		maxFiles: 5,
		tailable: true,
	}),
];

const winstonLogger = createLogger({
	level: process.env.LOG_LEVEL || getDefaultLevel(),
	format: format.json(),
	transports: logTransports,
	// Don't exit on error
	exitOnError: false,
});

const log = (level: "info" | "warn" | "error" | "debug", messages: unknown[]) => {
	const stringMessages = messages.flatMap((m) => {
		if (m instanceof Error) {
			return [sanitizeSensitiveData(m.message), m.stack ? sanitizeSensitiveData(m.stack) : undefined].filter(Boolean);
		}

		if (typeof m === "object") {
			return sanitizeSensitiveData(JSON.stringify(m, null, 2));
		}

		return sanitizeSensitiveData(String(m as string));
	});

	winstonLogger.log(level, stringMessages.join(" "));
};

export const logger = {
	debug: (...messages: unknown[]) => log("debug", messages),
	info: (...messages: unknown[]) => log("info", messages),
	warn: (...messages: unknown[]) => log("warn", messages),
	error: (...messages: unknown[]) => log("error", messages),
	// Get the logs directory path
	getLogsDir: () => logsDir,
};

// Log initialization info
winstonLogger.info(`Logger initialized - Writing logs to: ${logsDir}`);
winstonLogger.info(`Log level: ${process.env.LOG_LEVEL || getDefaultLevel()}`);
winstonLogger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
winstonLogger.info(`Platform: ${process.platform}`);
