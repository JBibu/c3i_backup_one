#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Uninstalls C3i Backup ONE Windows Service

.DESCRIPTION
    Removes the Windows Service and optionally cleans up data

.PARAMETER KeepData
    Keep application data (database, repositories, etc.)
    Default: $true

.EXAMPLE
    .\uninstall-windows-service.ps1

.EXAMPLE
    .\uninstall-windows-service.ps1 -KeepData $false
#>

param(
    [bool]$KeepData = $true
)

# Require Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Right-click and select 'Run as Administrator'."
    exit 1
}

$ServiceName = "C3iBackupONE"
$DataDir = "C:\ProgramData\C3iBackupONE"
$NssmExe = Join-Path $env:TEMP "nssm\nssm.exe"

Write-Host "=== C3i Backup ONE - Windows Service Uninstaller ===" -ForegroundColor Cyan
Write-Host ""

# Check if service exists
$Service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $Service) {
    Write-Warning "Service '$ServiceName' not found. Nothing to uninstall."
    exit 0
}

# Check if NSSM is available
if (-not (Test-Path $NssmExe)) {
    Write-Error "NSSM not found at: $NssmExe"
    Write-Host "Please install NSSM or remove the service manually using:"
    Write-Host "  sc.exe delete $ServiceName"
    exit 1
}

# Stop the service
Write-Host "[1/3] Stopping service..." -ForegroundColor Yellow
& $NssmExe stop $ServiceName
Start-Sleep -Seconds 2

# Remove the service
Write-Host "[2/3] Removing service..." -ForegroundColor Yellow
& $NssmExe remove $ServiceName confirm

Write-Host "[2/3] Service removed successfully" -ForegroundColor Green

# Clean up data if requested
if (-not $KeepData) {
    Write-Host "[3/3] Removing application data..." -ForegroundColor Yellow

    if (Test-Path $DataDir) {
        $Confirmation = Read-Host "Are you sure you want to delete all data at $DataDir? (yes/no)"
        if ($Confirmation -eq "yes") {
            Remove-Item -Path $DataDir -Recurse -Force
            Write-Host "[3/3] Data directory removed" -ForegroundColor Green
        } else {
            Write-Host "[3/3] Data directory kept" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[3/3] No data directory found" -ForegroundColor Gray
    }
} else {
    Write-Host "[3/3] Keeping application data at: $DataDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Uninstallation Complete ===" -ForegroundColor Cyan
Write-Host ""

if ($KeepData) {
    Write-Host "Note: Application data preserved at $DataDir" -ForegroundColor Yellow
    Write-Host "To remove manually: Remove-Item -Path '$DataDir' -Recurse -Force" -ForegroundColor Gray
}
