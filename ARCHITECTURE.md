# C3i Backup ONE Architecture

This document describes the architecture of the C3i Backup ONE desktop application, particularly the Tauri integration and cross-platform considerations.

## Architecture Overview

C3i Backup ONE is built using a **sidecar architecture** where:

1. **Frontend**: React SPA (Single Page Application) built with React Router
2. **Backend**: Node.js/Bun server running as a sidecar process
3. **Desktop Shell**: Tauri (Rust) application that manages the frontend and backend

```
┌─────────────────────────────────────────┐
│         Tauri Application (Rust)        │
│  ┌───────────────────────────────────┐  │
│  │     Frontend (React/Vite)         │  │
│  │  - UI Components                  │  │
│  │  - API Client                     │  │
│  └───────────────────────────────────┘  │
│              ↕ HTTP/SSE                  │
│  ┌───────────────────────────────────┐  │
│  │   Backend Sidecar (Bun/Node.js)   │  │
│  │  - Hono API Server                │  │
│  │  - Restic/Rclone Integration      │  │
│  │  - Database (SQLite)              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Deployment Modes

C3i Backup ONE supports three deployment modes:

### 1. Docker Container (Original zerobyte mode)
- Frontend and backend run together in a single Node.js process
- Accessed via web browser
- Standard Docker deployment with docker-compose

### 2. Desktop Application (Tauri)
- Frontend runs in a Tauri webview
- Backend runs as a sidecar process spawned by Tauri
- Standalone executable with all dependencies bundled
- Supports Windows, macOS, and Linux

### 3. Windows Service
- Backend runs as a Windows Service using NSSM
- Accessed via web browser (no Tauri shell)
- See [WINDOWS_SERVICE.md](WINDOWS_SERVICE.md) for setup

## Sidecar Process Management

The Tauri application manages the backend sidecar with the following lifecycle:

1. **Startup**:
   - Tauri locates the compiled sidecar binary
   - Sets environment variables (database paths, migrations, etc.)
   - Spawns the sidecar process
   - Polls health check endpoint (120 attempts × 500ms = 60 seconds)

2. **Runtime**:
   - Frontend communicates with backend via HTTP on a dynamic port
   - Backend URL is retrieved via Tauri commands
   - Server events (SSE) keep frontend updated

3. **Shutdown**:
   - Tauri sends graceful shutdown signal to sidecar
   - Cleanup of temporary files and mounts

### Key Files

- **Rust**: `src-tauri/src/lib.rs` - Sidecar lifecycle management
- **TypeScript**: `app/client/lib/tauri.ts` - Frontend Tauri utilities
- **Build**: `scripts/build-sidecar.ts` - Compiles backend to standalone binary

## Path Resolution Strategy

Path resolution differs between deployment modes and platforms:

### Resource Paths

Resources (binaries, migrations, etc.) are resolved in this order:

1. **Development**: `src-tauri/resources/` directory
2. **Bundled**: Tauri resource directory (`_up_/Resources` on macOS, etc.)
3. **Portable**: Next to executable in `resources/` subdirectory
4. **Environment**: `C3I_BACKUP_ONE_RESOURCES_PATH` if set

### Windows UNC Path Normalization

**Important**: Windows UNC paths (`\\?\C:\...`) need normalization as they cause issues with some filesystem operations.

Path normalization is duplicated in:
- **Rust** (`src-tauri/src/lib.rs`): For Tauri-specific paths
- **TypeScript** (`app/server/core/constants.ts`): For backend server paths

**Why duplicated?**
- Different languages (Rust vs TypeScript)
- Different contexts (Tauri shell vs backend server)
- Each needs to normalize paths independently

**Code location**:
```rust
// src-tauri/src/lib.rs
fn normalize_windows_path(path: &Path) -> PathBuf {
    let path_str = path.to_string_lossy();
    if path_str.starts_with(r"\\?\") {
        PathBuf::from(&path_str[4..])
    } else {
        path.to_path_buf()
    }
}
```

```typescript
// app/server/core/constants.ts
const normalizeWindowsPath = (path: string): string => {
    if (path.startsWith("\\\\?\\")) {
        return path.slice(4);
    }
    return path;
};
```

## Database and Migrations

### Migration Handling

Database migrations are handled differently in each mode:

1. **Docker**: Migrations run on container startup from `/app/drizzle`
2. **Development**: Migrations loaded from `app/drizzle/`
3. **Tauri Bundle**: Migrations bundled as Tauri resources
4. **Compiled Sidecar**: Migrations located via `MIGRATIONS_PATH` env var

The migrations are **NOT** embedded in the sidecar binary. They are:
- Bundled separately by Tauri as resources
- Referenced via `MIGRATIONS_PATH` environment variable
- Expected next to the executable in production builds

### Database Location

Default database paths by platform:

- **Linux/macOS**: `/var/lib/c3i-backup-one/data/c3i-backup-one.db`
- **Windows**: `C:\ProgramData\C3iBackupONE\c3i-backup-one.db`
- **Tauri**: Platform-specific app data directory
- **Development**: `./data/c3i-backup-one.db`

Configurable via `DATABASE_URL` environment variable.

## Build System

### Scripts Organization

Build scripts are located in `scripts/` with shared configuration:

- **`scripts/config.ts`**: Shared constants (versions, platform mappings)
- **`scripts/build-sidecar.ts`**: Compiles backend to standalone binary
- **`scripts/download-binaries.ts`**: Downloads platform-specific binaries
- **`scripts/build-tauri.ts`**: Builds complete Tauri application

### Platform Support

Supported platforms (via `scripts/config.ts`):

| Platform | Architecture | Tauri Target | Binary Downloads |
|----------|--------------|--------------|------------------|
| Linux | x64 | `x86_64-unknown-linux-gnu` | ✓ |
| Linux | ARM64 | `aarch64-unknown-linux-gnu` | ✓ |
| macOS | x64 | `x86_64-apple-darwin` | ✓ |
| macOS | ARM64 | `aarch64-apple-darwin` | ✓ |
| Windows | x64 | `x86_64-pc-windows-msvc` | ✓ |

### Binary Versions

External binary versions are centralized in `scripts/config.ts`:

```typescript
export const BINARY_VERSIONS = {
    RESTIC: "0.18.1",
    RCLONE: "1.72.1",
    SHOUTRRR: "0.13.1",
};
```

Update these to change versions for all platforms simultaneously.

## Environment Variables

### Tauri-Specific

Set by Tauri when launching sidecar:

- `C3I_BACKUP_ONE_TAURI=1`: Indicates running in Tauri mode
- `C3I_BACKUP_ONE_RESOURCES_PATH`: Path to bundled resources
- `MIGRATIONS_PATH`: Path to database migrations
- `DATABASE_URL`: SQLite database file path

### Backend Server

Standard environment variables (all modes):

- `PORT`: Server port (default: 4096)
- `C3I_BACKUP_ONE_REPOSITORIES_DIR`: Backup repository storage
- `C3I_BACKUP_ONE_VOLUMES_DIR`: Volume mount points
- `RESTIC_CACHE_DIR`: Restic cache directory
- `RESTIC_PASS_FILE`: Master encryption password file
- `NODE_ENV`: Environment mode (development/production)

## Cross-Platform Considerations

### File System Operations

- Use Tauri's `fs` plugin for file operations when possible
- Backend uses native Node.js `fs` module
- Windows paths require UNC normalization (see above)

### Process Management

- Linux/macOS: Standard Unix process management
- Windows: Additional considerations for service mode and permissions

### Binary Execution

- Binaries stored in `resources/bin/{platform}/`
- Platform detection handled by `scripts/config.ts`
- Automatic selection of correct binary for current platform

## Security Considerations

### Sandboxing

Tauri provides a sandboxed environment with:
- CSP (Content Security Policy) disabled for local development
- Capability-based permissions (see `src-tauri/capabilities/`)
- IPC commands explicitly allowed via Tauri commands

### Sensitive Data

- Master encryption password stored in `restic.pass`
- Database contains encrypted repository credentials
- Secret references support (`env://`, `file://`) for external secrets

## Testing

### Development Mode

```bash
# Run backend only
bun run dev

# Run Tauri desktop app
bun run tauri:dev

# Run Docker environment
bun run start:dev
```

### Production Builds

```bash
# Build sidecar for current platform
bun run build:sidecar

# Build Tauri app for current platform
bun run tauri:build

# Build for all platforms
bun run tauri:build:all
```

## Troubleshooting

### Common Issues

1. **Sidecar fails to start**:
   - Check logs in console (Tauri dev mode)
   - Verify migrations path is correct
   - Ensure database directory exists and is writable

2. **Binary not found**:
   - Run `bun run download:binaries` to download platform binaries
   - Check `src-tauri/resources/bin/{platform}/` exists
   - Verify platform detection in `scripts/config.ts`

3. **Database errors**:
   - Check `DATABASE_URL` environment variable
   - Verify migrations are bundled correctly
   - Check file permissions on database file

### Debug Mode

Enable verbose logging:

```bash
# Tauri
RUST_LOG=debug bun run tauri:dev

# Backend
LOG_LEVEL=debug bun run dev
```

## Contributing

When adding features:

1. **Maintain cross-platform compatibility**: Test on Windows, macOS, and Linux
2. **Update architecture docs**: Document significant architectural changes
3. **Keep deployment modes in sync**: Changes should work in Docker, Tauri, and Windows Service modes
4. **Use shared configuration**: Platform mappings go in `scripts/config.ts`

## Further Reading

- [Tauri Documentation](https://tauri.app/)
- [Restic Documentation](https://restic.readthedocs.io/)
- [WINDOWS_SERVICE.md](WINDOWS_SERVICE.md) - Windows Service deployment
- [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md) - Syncing with upstream zerobyte
