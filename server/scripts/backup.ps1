# PharmaERP Database Backup Script (PowerShell)
# Usage: .\backup.ps1 [-Uri "<mongodb-connection-string>"] [-OutDir "<path>"]

param (
    [string]$Uri = $env:MONGODB_URI,
    [string]$OutDir = "$PSScriptRoot/../../backups"
)

$targetUri = $Uri

# Load .env if targetUri not provided
if (-not $targetUri) {
    $envFile = "$PSScriptRoot/../.env"
    if (Test-Path $envFile) {
        $found = Get-Content $envFile | Where-Object { $_ -match "^\s*MONGODB_URI\s*=\s*(.+)$" } | Select-Object -First 1
        if ($found -and $found -match "^\s*MONGODB_URI\s*=\s*(.+)$") {
            $targetUri = $matches[1].Trim()
        }
    }
}

if (-not $targetUri) {
    Write-Error "Error: MONGODB_URI not found in environment or .env file."
    exit 1
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFolder = "$OutDir/pharmaerp_backup_$Timestamp"
$ArchiveFile = "$BackupFolder.gz"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PharmaERP Database Backup Utility" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Target Archive: $ArchiveFile"
Write-Host "Connecting to MongoDB..."

# Execute mongodump
try {
    mongodump "--uri=$targetUri" --archive="$ArchiveFile" --gzip
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Backup created successfully: $ArchiveFile" -ForegroundColor Green
    } else {
        Write-Error " Backup failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error "Error executing mongodump. Ensure MongoDB Database Tools are installed and in PATH."
    Write-Error $_.Exception.Message
}
