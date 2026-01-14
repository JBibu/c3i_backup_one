#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Installs C3i Backup ONE as a Windows Service using NSSM

.DESCRIPTION
    This script downloads NSSM (if needed) and configures C3i Backup ONE
    to run as a Windows Service that starts automatically on boot.

.PARAMETER DataDir
    Directory for application data (database, repositories, etc.)
    Default: C:\ProgramData\C3iBackupONE

.PARAMETER Port
    Port number for the web interface
    Default: 4096

.EXAMPLE
    .\install-windows-service.ps1

.EXAMPLE
    .\install-windows-service.ps1 -DataDir "D:\Backups\C3iBackupONE" -Port 8080
#>

param(
    [string]$DataDir = "C:\ProgramData\C3iBackupONE",
    [int]$Port = 4096
)

# Require Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Right-click and select 'Run as Administrator'."
    exit 1
}

$ServiceName = "C3iBackupONE"
$DisplayName = "C3i Backup ONE"
$Description = "Automated backup service powered by Restic"

Write-Host "=== C3i Backup ONE - Windows Service Installer ===" -ForegroundColor Cyan
Write-Host ""

# Get the directory where the compiled sidecar binary is located
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir
$SidecarPath = Join-Path $ProjectRoot "src-tauri\resources\c3i-backup-one-server-x86_64-pc-windows-msvc.exe"

if (-not (Test-Path $SidecarPath)) {
    Write-Error "Sidecar binary not found at: $SidecarPath"
    Write-Host "Please run 'bun run build:sidecar' first to build the server binary."
    exit 1
}

Write-Host "[1/5] Found sidecar binary: $SidecarPath" -ForegroundColor Green

# Create data directory
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
    Write-Host "[2/5] Created data directory: $DataDir" -ForegroundColor Green
} else {
    Write-Host "[2/5] Using existing data directory: $DataDir" -ForegroundColor Green
}

# Download NSSM if needed
$NssmDir = Join-Path $env:TEMP "nssm"
$NssmExe = Join-Path $NssmDir "nssm.exe"

if (-not (Test-Path $NssmExe)) {
    Write-Host "[3/5] Downloading NSSM..." -ForegroundColor Yellow

    $NssmZip = Join-Path $env:TEMP "nssm.zip"
    $NssmUrl = "https://nssm.cc/release/nssm-2.24.zip"

    Invoke-WebRequest -Uri $NssmUrl -OutFile $NssmZip -UseBasicParsing

    # Extract NSSM
    Expand-Archive -Path $NssmZip -DestinationPath $env:TEMP -Force

    # Copy the correct architecture binary
    $NssmExtractedDir = Join-Path $env:TEMP "nssm-2.24"
    $NssmWin64 = Join-Path $NssmExtractedDir "win64\nssm.exe"

    if (-not (Test-Path $NssmDir)) {
        New-Item -ItemType Directory -Path $NssmDir -Force | Out-Null
    }

    Copy-Item $NssmWin64 -Destination $NssmExe -Force

    # Cleanup
    Remove-Item $NssmZip -Force -ErrorAction SilentlyContinue
    Remove-Item $NssmExtractedDir -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "[3/5] NSSM downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "[3/5] NSSM already available" -ForegroundColor Green
}

# Stop existing service if running
$ExistingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($ExistingService) {
    Write-Host "[4/5] Stopping existing service..." -ForegroundColor Yellow
    & $NssmExe stop $ServiceName
    Start-Sleep -Seconds 2
    & $NssmExe remove $ServiceName confirm
    Start-Sleep -Seconds 1
}

# Install the service
Write-Host "[4/5] Installing Windows Service..." -ForegroundColor Yellow

& $NssmExe install $ServiceName $SidecarPath

# Configure service parameters
& $NssmExe set $ServiceName DisplayName $DisplayName
& $NssmExe set $ServiceName Description $Description
& $NssmExe set $ServiceName Start SERVICE_AUTO_START

# Set environment variables
$DbPath = Join-Path $DataDir "c3i-backup-one.db"
$ReposDir = Join-Path $DataDir "repositories"
$VolumesDir = Join-Path $DataDir "volumes"
$CacheDir = Join-Path $DataDir "cache"
$PassFile = Join-Path $DataDir "restic.pass"

& $NssmExe set $ServiceName AppEnvironmentExtra "PORT=$Port"
& $NssmExe set $ServiceName AppEnvironmentExtra "DATABASE_URL=$DbPath"
& $NssmExe set $ServiceName AppEnvironmentExtra "C3I_BACKUP_ONE_REPOSITORIES_DIR=$ReposDir"
& $NssmExe set $ServiceName AppEnvironmentExtra "C3I_BACKUP_ONE_VOLUMES_DIR=$VolumesDir"
& $NssmExe set $ServiceName AppEnvironmentExtra "RESTIC_CACHE_DIR=$CacheDir"
& $NssmExe set $ServiceName AppEnvironmentExtra "RESTIC_PASS_FILE=$PassFile"
& $NssmExe set $ServiceName AppEnvironmentExtra "NODE_ENV=production"

# Set working directory
& $NssmExe set $ServiceName AppDirectory $DataDir

# Configure logging
$LogDir = Join-Path $DataDir "logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$StdOutLog = Join-Path $LogDir "service-stdout.log"
$StdErrLog = Join-Path $LogDir "service-stderr.log"

& $NssmExe set $ServiceName AppStdout $StdOutLog
& $NssmExe set $ServiceName AppStderr $StdErrLog

# Set log rotation
& $NssmExe set $ServiceName AppStdoutCreationDisposition 4  # Append
& $NssmExe set $ServiceName AppStderrCreationDisposition 4  # Append
& $NssmExe set $ServiceName AppRotateFiles 1
& $NssmExe set $ServiceName AppRotateOnline 1
& $NssmExe set $ServiceName AppRotateSeconds 86400  # Daily rotation
& $NssmExe set $ServiceName AppRotateBytes 10485760  # 10MB max size

Write-Host "[4/5] Service configured successfully" -ForegroundColor Green

# Start the service
Write-Host "[5/5] Starting service..." -ForegroundColor Yellow
& $NssmExe start $ServiceName

Start-Sleep -Seconds 3

# Verify service is running
$Service = Get-Service -Name $ServiceName
if ($Service.Status -eq "Running") {
    Write-Host "[5/5] Service started successfully!" -ForegroundColor Green
} else {
    Write-Warning "Service status: $($Service.Status)"
    Write-Host "Check logs at: $LogDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Name:    $ServiceName" -ForegroundColor White
Write-Host "Data Directory:  $DataDir" -ForegroundColor White
Write-Host "Web Interface:   http://localhost:$Port" -ForegroundColor White
Write-Host "Logs Directory:  $LogDir" -ForegroundColor White
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Yellow
Write-Host "  Start:   nssm start $ServiceName" -ForegroundColor Gray
Write-Host "  Stop:    nssm stop $ServiceName" -ForegroundColor Gray
Write-Host "  Restart: nssm restart $ServiceName" -ForegroundColor Gray
Write-Host "  Status:  Get-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Remove:  nssm remove $ServiceName confirm" -ForegroundColor Gray
Write-Host ""
