# Windows Service Deployment Guide

This guide explains how to run C3i Backup ONE as a Windows Service, allowing automated backups to run even when no user is logged in.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: NSSM (Recommended)](#option-1-nssm-recommended)
- [Option 2: Native sc.exe](#option-2-native-scexe)
- [Option 3: Manual Configuration](#option-3-manual-configuration)
- [Service Management](#service-management)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Build the Sidecar Binary**:
   ```powershell
   bun run build:sidecar
   ```

2. **Administrator Privileges**: All installation methods require running PowerShell or Command Prompt as Administrator.

3. **Windows Version**: Windows 10/11 or Windows Server 2016+

---

## Option 1: NSSM (Recommended)

**NSSM** (Non-Sucking Service Manager) is the easiest and most reliable method.

### Quick Install

```powershell
# Run as Administrator
.\scripts\install-windows-service.ps1
```

### Custom Installation

```powershell
# Specify custom data directory and port
.\scripts\install-windows-service.ps1 -DataDir "D:\Backups\C3iBackupONE" -Port 8080
```

### What It Does

1. Downloads NSSM automatically (if needed)
2. Creates data directory structure
3. Installs the service with proper configuration
4. Sets up automatic startup on boot
5. Configures log rotation
6. Starts the service

### Verify Installation

```powershell
Get-Service C3iBackupONE
```

You should see:
```
Status   Name             DisplayName
------   ----             -----------
Running  C3iBackupONE     C3i Backup ONE
```

Access the web interface at: **http://localhost:4096**

### Uninstall

```powershell
# Remove service but keep data
.\scripts\uninstall-windows-service.ps1

# Remove service AND delete all data
.\scripts\uninstall-windows-service.ps1 -KeepData $false
```

---

## Option 2: Native sc.exe

If you prefer not to use NSSM, you can use Windows' built-in `sc.exe` command.

### Install

```powershell
# Run as Administrator

# 1. Set variables
$SidecarPath = "C:\path\to\c3i-backup-one-server-x86_64-pc-windows-msvc.exe"
$DataDir = "C:\ProgramData\C3iBackupONE"

# 2. Create data directory
New-Item -ItemType Directory -Path $DataDir -Force

# 3. Create the service
sc.exe create C3iBackupONE `
    binPath= "$SidecarPath" `
    start= auto `
    DisplayName= "C3i Backup ONE" `
    obj= "NT AUTHORITY\LocalService"

# 4. Set description
sc.exe description C3iBackupONE "Automated backup service powered by Restic"

# 5. Start the service
sc.exe start C3iBackupONE
```

### Limitations of sc.exe

⚠️ **Important**: `sc.exe` doesn't support environment variables directly. You'll need to:

1. Set system-wide environment variables, OR
2. Modify the binary to read from a config file, OR
3. Use NSSM (recommended)

### Uninstall

```powershell
sc.exe stop C3iBackupONE
sc.exe delete C3iBackupONE
```

---

## Option 3: Manual Configuration

For advanced users who want full control.

### Using Task Scheduler

An alternative to Windows Services is Task Scheduler with "Run whether user is logged on or not":

```powershell
# Create a scheduled task that runs on startup
$Action = New-ScheduledTaskAction -Execute "C:\path\to\c3i-backup-one-server.exe"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "C3iBackupONE" `
    -Action $Action `
    -Trigger $Trigger `
    -Principal $Principal `
    -Settings $Settings `
    -Description "C3i Backup ONE automated backup service"
```

---

## Service Management

### Start/Stop/Restart

#### Using NSSM:
```powershell
nssm start C3iBackupONE
nssm stop C3iBackupONE
nssm restart C3iBackupONE
```

#### Using Windows Services:
```powershell
Start-Service C3iBackupONE
Stop-Service C3iBackupONE
Restart-Service C3iBackupONE
```

#### Using sc.exe:
```powershell
sc.exe start C3iBackupONE
sc.exe stop C3iBackupONE
```

### Check Status

```powershell
Get-Service C3iBackupONE | Format-List *
```

### View Logs

Logs are stored at: `C:\ProgramData\C3iBackupONE\logs\`

```powershell
# View latest stdout log
Get-Content C:\ProgramData\C3iBackupONE\logs\service-stdout.log -Tail 50

# View latest stderr log
Get-Content C:\ProgramData\C3iBackupONE\logs\service-stderr.log -Tail 50

# Follow logs in real-time
Get-Content C:\ProgramData\C3iBackupONE\logs\service-stdout.log -Wait
```

### Access Web Interface

Once the service is running, access the web interface at:

- **Default**: http://localhost:4096
- **Custom port**: http://localhost:{your-port}

---

## Configuration

### Environment Variables (NSSM)

NSSM automatically sets these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4096 | Web interface port |
| `DATABASE_URL` | `C:\ProgramData\C3iBackupONE\c3i-backup-one.db` | SQLite database path |
| `C3I_BACKUP_ONE_REPOSITORIES_DIR` | `C:\ProgramData\C3iBackupONE\repositories` | Backup repositories |
| `C3I_BACKUP_ONE_VOLUMES_DIR` | `C:\ProgramData\C3iBackupONE\volumes` | Volume mount points |
| `RESTIC_CACHE_DIR` | `C:\ProgramData\C3iBackupONE\cache` | Restic cache |
| `RESTIC_PASS_FILE` | `C:\ProgramData\C3iBackupONE\restic.pass` | Master password |
| `NODE_ENV` | production | Environment mode |

### Modify Configuration

```powershell
# Change port
nssm set C3iBackupONE AppEnvironmentExtra "PORT=8080"

# Add custom environment variable
nssm set C3iBackupONE AppEnvironmentExtra "LOG_LEVEL=debug"

# Restart to apply changes
nssm restart C3iBackupONE
```

---

## Data Directory Structure

```
C:\ProgramData\C3iBackupONE\
├── c3i-backup-one.db          # SQLite database
├── restic.pass                # Master encryption password
├── repositories\              # Local backup repositories
├── volumes\                   # Volume mount points (unused on Windows)
├── cache\                     # Restic cache
└── logs\                      # Service logs
    ├── service-stdout.log     # Application output
    └── service-stderr.log     # Error output
```

---

## Firewall Configuration

If you want to access the web interface from other computers:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "C3i Backup ONE" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 4096 `
    -Action Allow
```

---

## Troubleshooting

### Service Won't Start

1. **Check the service status**:
   ```powershell
   Get-Service C3iBackupONE | Format-List *
   ```

2. **Check Event Viewer**:
   - Open Event Viewer (`eventvwr.msc`)
   - Navigate to: Windows Logs → Application
   - Look for errors from source "C3iBackupONE"

3. **Check service logs**:
   ```powershell
   Get-Content C:\ProgramData\C3iBackupONE\logs\service-stderr.log
   ```

### Can't Access Web Interface

1. **Verify service is running**:
   ```powershell
   Get-Service C3iBackupONE
   ```

2. **Check which port is being used**:
   ```powershell
   Get-NetTCPConnection -LocalPort 4096
   ```

3. **Try accessing via IP**:
   ```
   http://127.0.0.1:4096
   ```

### Permission Denied Errors

The service runs as `LocalService` by default. If you need file system access:

```powershell
# Run as NETWORK SERVICE instead
nssm set C3iBackupONE ObjectName "NT AUTHORITY\NetworkService"
nssm restart C3iBackupONE
```

Or grant LocalService permissions to specific directories:

```powershell
# Grant LocalService access to a directory
icacls "D:\MyBackups" /grant "NT AUTHORITY\LocalService:(OI)(CI)F"
```

### Service Crashes on Startup

1. **Check if port is already in use**:
   ```powershell
   Get-NetTCPConnection -LocalPort 4096 -ErrorAction SilentlyContinue
   ```

2. **Try running the binary manually** to see errors:
   ```powershell
   cd C:\ProgramData\C3iBackupONE
   & "C:\path\to\c3i-backup-one-server-x86_64-pc-windows-msvc.exe"
   ```

3. **Check NSSM configuration**:
   ```powershell
   nssm dump C3iBackupONE
   ```

### Logs Not Rotating

NSSM handles log rotation. To force rotation:

```powershell
nssm rotate C3iBackupONE
```

---

## Security Best Practices

### 1. Use Strong Master Password

The master password is stored at `C:\ProgramData\C3iBackupONE\restic.pass`. Ensure:

- File permissions are restricted
- Password is strong and unique
- Backup this file securely

### 2. Restrict Web Interface Access

By default, the service binds to `localhost` only. To restrict further:

```powershell
# Bind to localhost only (default)
nssm set C3iBackupONE AppEnvironmentExtra "SERVER_IP=127.0.0.1"
nssm restart C3iBackupONE
```

### 3. Enable HTTPS (Optional)

For production use, consider putting the service behind a reverse proxy (IIS, nginx) with HTTPS.

### 4. Regular Backups of Service Data

Backup the database and configuration:

```powershell
# Create backup
$BackupDir = "C:\Backups\C3iBackupONE-$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $BackupDir -Force
Copy-Item "C:\ProgramData\C3iBackupONE\c3i-backup-one.db" -Destination $BackupDir
Copy-Item "C:\ProgramData\C3iBackupONE\restic.pass" -Destination $BackupDir
```

---

## Upgrading

To upgrade the service:

```powershell
# 1. Stop the service
nssm stop C3iBackupONE

# 2. Build new sidecar binary
bun run build:sidecar

# 3. Replace the binary
$NewBinary = ".\src-tauri\resources\c3i-backup-one-server-x86_64-pc-windows-msvc.exe"
$ServiceBinary = nssm get C3iBackupONE Application
Copy-Item $NewBinary -Destination $ServiceBinary -Force

# 4. Start the service
nssm start C3iBackupONE
```

---

## Comparison of Methods

| Feature | NSSM | sc.exe | Task Scheduler |
|---------|------|--------|----------------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Environment Variables** | ✅ Yes | ❌ No | ⚠️ Limited |
| **Log Rotation** | ✅ Yes | ❌ No | ❌ No |
| **Auto-restart** | ✅ Yes | ⚠️ Manual | ⚠️ Manual |
| **No Dependencies** | ❌ No (NSSM) | ✅ Yes | ✅ Yes |
| **GUI Configuration** | ✅ Yes | ❌ No | ✅ Yes |

**Recommendation**: Use **NSSM** for production deployments.

---

## FAQ

### Q: Can I run both the service and Tauri GUI app?

**A**: Yes, but they'll conflict if using the same port. Options:

1. **Different ports**: Run service on port 4096, GUI on 4097
2. **Different data dirs**: Service uses `C:\ProgramData\`, GUI uses `%APPDATA%\`
3. **Use only service**: Access via web browser instead of Tauri GUI

### Q: Does the service auto-start after reboot?

**A**: Yes, if installed with `start= auto` (default with NSSM).

### Q: Can I schedule backups?

**A**: Yes! The service includes a built-in scheduler. Configure backup schedules via the web interface.

### Q: What user does the service run as?

**A**: By default, `NT AUTHORITY\LocalService`. You can change this with NSSM if needed.

### Q: How much disk space does the service need?

**A**:
- Binary: ~100 MB
- Database: Varies (typically < 100 MB)
- Repositories: Depends on your backup data
- Logs: Rotated daily, max 10 MB each

---

## Additional Resources

- [NSSM Official Site](https://nssm.cc/)
- [Windows Service Documentation](https://docs.microsoft.com/en-us/windows/win32/services/services)
- [sc.exe Reference](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/sc-create)

---

## Support

For issues specific to Windows Service deployment, check:

1. Service logs at `C:\ProgramData\C3iBackupONE\logs\`
2. Windows Event Viewer
3. GitHub Issues: [github.com/your-repo/issues](https://github.com)
