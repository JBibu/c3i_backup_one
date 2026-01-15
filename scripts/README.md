# Build Scripts

This directory contains build and deployment scripts for C3i Backup ONE desktop application.

## Overview

The scripts handle three main tasks:
1. **Downloading** platform-specific binaries (restic, rclone, shoutrrr)
2. **Building** the backend server as a standalone sidecar binary
3. **Building** the complete Tauri desktop application

## Scripts

### `config.ts`

Shared configuration for all build scripts.

**Exports**:
- `BINARY_VERSIONS`: Version numbers for restic, rclone, and shoutrrr
- `getCurrentPlatform()`: Get normalized platform information
- `getTauriTarget()`: Get Tauri target triple for a platform
- `getSupportedPlatforms()`: List all supported platform keys

**Supported Platforms**:
- `linux-x64`, `linux-arm64`
- `darwin-x64`, `darwin-arm64`
- `windows-x64`

### `download-binaries.ts`

Downloads platform-specific binaries from GitHub releases.

**Usage**:
```bash
# Download for current platform only
bun run download:binaries

# Download for specific platform
bun run download:binaries -- --platform linux-amd64

# Download for all platforms
bun run download:binaries:all
```

**What it does**:
1. Downloads restic, rclone, and shoutrrr binaries
2. Extracts from various archive formats (zip, tar.gz, bz2)
3. Places binaries in `src-tauri/resources/bin/{platform}/`
4. Sets executable permissions on Unix platforms

**Output structure**:
```
src-tauri/resources/bin/
├── linux-amd64/
│   ├── restic
│   ├── rclone
│   └── shoutrrr
├── darwin-amd64/
│   ├── restic
│   ├── rclone
│   └── shoutrrr
└── windows-amd64/
    ├── restic.exe
    ├── rclone.exe
    └── shoutrrr.exe
```

**Note**: Platform naming uses `amd64` instead of `x64` (matches GitHub release naming).

### `build-sidecar.ts`

Compiles the C3i Backup ONE backend server into a standalone executable using Bun's compilation feature.

**Usage**:
```bash
# Build for current platform
bun run build:sidecar

# Build for specific platform
bun run build:sidecar -- --target linux-x64

# Build for all platforms
bun run build:sidecar:all
```

**What it does**:
1. Builds the React Router server (`bun run build`)
2. Compiles `dist/server/index.js` to a standalone binary
3. Names binary using Tauri target triple convention
4. Places binary in `src-tauri/resources/`

**Output**:
```
src-tauri/resources/
├── c3i-backup-one-server-x86_64-unknown-linux-gnu
├── c3i-backup-one-server-aarch64-unknown-linux-gnu
├── c3i-backup-one-server-x86_64-apple-darwin
├── c3i-backup-one-server-aarch64-apple-darwin
└── c3i-backup-one-server-x86_64-pc-windows-msvc.exe
```

**Important**: Migrations are NOT embedded in the sidecar. They are bundled separately by Tauri and referenced via the `MIGRATIONS_PATH` environment variable.

### `build-tauri.ts`

Orchestrates the complete Tauri application build.

**Usage**:
```bash
# Build for current platform
bun run tauri:build

# Build for all platforms
bun run tauri:build:all
```

**What it does**:
1. Runs frontend build (`build:tauri`)
2. Compiles Rust Tauri shell
3. Bundles everything into platform installers

**Output** (varies by platform):
```
src-tauri/target/release/bundle/
├── deb/              # Linux .deb package
├── rpm/              # Linux .rpm package
├── appimage/         # Linux AppImage
├── msi/              # Windows MSI installer
├── nsis/             # Windows NSIS installer
└── dmg/              # macOS disk image
```

### `build-tauri-frontend.ts`

Builds the React Router frontend specifically for Tauri (disables SSR).

**Usage**:
```bash
bun run build:tauri
```

**What it does**:
1. Sets `C3I_BACKUP_ONE_TAURI=1` environment variable
2. Builds React Router frontend with SSR disabled
3. Outputs to `dist/client/`

**Note**: Tauri requires static files, so SSR is disabled for desktop builds.

### `install-windows-service.ps1`

PowerShell script to install C3i Backup ONE as a Windows Service using NSSM.

**Usage**:
```powershell
# Install with defaults
.\scripts\install-windows-service.ps1

# Custom data directory and port
.\scripts\install-windows-service.ps1 -DataDir "D:\Backups" -Port 8080
```

See [WINDOWS_SERVICE.md](../WINDOWS_SERVICE.md) for complete documentation.

### `uninstall-windows-service.ps1`

PowerShell script to remove the Windows Service.

**Usage**:
```powershell
# Remove service but keep data
.\scripts\uninstall-windows-service.ps1

# Remove service and delete all data
.\scripts\uninstall-windows-service.ps1 -KeepData $false
```

## Typical Workflow

### First-time Setup

1. **Download binaries** for your platform:
   ```bash
   bun run download:binaries
   ```

2. **Build the sidecar**:
   ```bash
   bun run build:sidecar
   ```

3. **Run in development mode**:
   ```bash
   bun run tauri:dev
   ```

### Building for Distribution

1. **Download binaries for all platforms**:
   ```bash
   bun run download:binaries:all
   ```

2. **Build sidecars for all platforms**:
   ```bash
   bun run build:sidecar:all
   ```

3. **Build Tauri application**:
   ```bash
   # Current platform only
   bun run tauri:build

   # All platforms (requires cross-compilation setup)
   bun run tauri:build:all
   ```

## Version Updates

To update binary versions (restic, rclone, shoutrrr):

1. Edit `scripts/config.ts`
2. Update the `BINARY_VERSIONS` object:
   ```typescript
   export const BINARY_VERSIONS = {
       RESTIC: "0.18.2",    // <- Update here
       RCLONE: "1.72.2",    // <- Update here
       SHOUTRRR: "0.13.2",  // <- Update here
   };
   ```
3. Re-download binaries:
   ```bash
   bun run download:binaries:all
   ```

Changes will apply to all platforms automatically.

## Platform Notes

### Linux

- Binaries are statically linked (no external dependencies)
- Supports x86_64 (amd64) and ARM64 architectures
- Output formats: .deb, .rpm, AppImage

### macOS

- Supports Intel (x86_64) and Apple Silicon (ARM64)
- Requires code signing for distribution (optional for development)
- Output format: .dmg

### Windows

- Only x86_64 supported currently
- Requires Windows 10/11 or Windows Server 2016+
- Output formats: .msi, NSIS installer
- See [WINDOWS_SERVICE.md](../WINDOWS_SERVICE.md) for service installation

## Cross-Compilation

Building for different platforms requires additional setup:

### macOS → Windows/Linux
Requires Docker or cross-compilation toolchain.

### Linux → macOS
Requires osxcross toolchain.

### Windows → Linux/macOS
Requires WSL2 or Docker.

**Recommendation**: Build on the target platform for simplest workflow, or use GitHub Actions for multi-platform builds.

## Troubleshooting

### "Binary not found" errors

1. Check that binaries were downloaded:
   ```bash
   ls src-tauri/resources/bin/
   ```

2. Verify platform detection:
   ```bash
   node -e "console.log(process.platform, process.arch)"
   ```

3. Re-download if needed:
   ```bash
   bun run download:binaries
   ```

### "Sidecar build failed"

1. Ensure frontend builds successfully:
   ```bash
   bun run build
   ```

2. Check Bun version (requires Bun 1.3.5+):
   ```bash
   bun --version
   ```

3. Try building manually:
   ```bash
   bun build --compile dist/server/index.js --outfile test-sidecar
   ```

### "Tauri build failed"

1. Check Rust installation:
   ```bash
   rustc --version
   cargo --version
   ```

2. Update Tauri CLI:
   ```bash
   bun install @tauri-apps/cli@latest
   ```

3. Clean build artifacts:
   ```bash
   rm -rf src-tauri/target
   bun run tauri:build
   ```

### Windows-specific issues

1. **PowerShell execution policy**:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Missing build tools**:
   - Install Visual Studio Build Tools
   - Ensure MSVC toolchain is available

3. **NSSM not found**:
   - Script auto-downloads NSSM
   - Manually download from https://nssm.cc/ if needed

## Development

### Adding a new platform

1. Update `scripts/config.ts`:
   ```typescript
   export const TAURI_TARGETS = {
       // ... existing targets ...
       "linux-riscv64": {
           bunTarget: "bun-linux-riscv64",
           tauriSuffix: "riscv64-unknown-linux-gnu"
       },
   };
   ```

2. Add binary URLs in `download-binaries.ts`:
   ```typescript
   const PLATFORMS = {
       // ... existing platforms ...
       "linux-riscv64": {
           restic: `https://...`,
           rclone: `https://...`,
           shoutrrr: `https://...`,
           archiveType: "zip",
           exeSuffix: "",
       },
   };
   ```

3. Test:
   ```bash
   bun run download:binaries -- --platform linux-riscv64
   bun run build:sidecar -- --target linux-riscv64
   ```

### Testing scripts locally

All scripts use TypeScript and can be run directly:

```bash
bun ./scripts/config.ts          # Run config (will error, it's a module)
bun ./scripts/download-binaries.ts
bun ./scripts/build-sidecar.ts
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Multi-Platform

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-latest, macos-latest, windows-latest]

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.3.5

      - name: Install dependencies
        run: bun install

      - name: Download binaries
        run: bun run download:binaries

      - name: Build sidecar
        run: bun run build:sidecar

      - name: Build Tauri app
        run: bun run tauri:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

## Further Reading

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Application architecture
- [WINDOWS_SERVICE.md](../WINDOWS_SERVICE.md) - Windows Service deployment
- [Tauri Build Guide](https://tauri.app/v1/guides/building/)
- [Bun Compilation](https://bun.sh/docs/bundler/executables)
