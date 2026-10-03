# PharmaERP Database Restore Utility (PowerShell)
# Usage: .\restore.ps1 -ArchiveFile "<path-to-archive.gz>" [-Uri "<mongodb-connection-string>"] [-Drop]

param (
    [Parameter(Mandatory=$true)]
    [string]$ArchiveFile,
    [string]$Uri = $env:MONGODB_URI,
    [switch]$Drop
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

if (-not (Test-Path $ArchiveFile)) {
    Write-Error "Error: Specified archive file does not exist: $ArchiveFile"
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PharmaERP Database Restore Utility" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Archive File: $ArchiveFile"
Write-Host "Target Database Connection: Configured"
if ($Drop) {
    Write-Host "WARNING: --drop flag is active. Existing collections will be replaced!" -ForegroundColor Red
}

$argsList = @(
    "--uri=$targetUri",
    "--archive=$ArchiveFile",
    "--gzip"
)

if ($Drop) {
    $argsList += "--drop"
}

try {
    mongorestore @argsList
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Database restored successfully from: $ArchiveFile" -ForegroundColor Green
    } else {
        Write-Error " Restore failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error "Error executing mongorestore. Ensure MongoDB Database Tools are installed and in PATH."
    Write-Error $_.Exception.Message
}
