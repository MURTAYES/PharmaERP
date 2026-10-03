#!/usr/bin/env bash
# PharmaERP Database Backup Script (Bash)
# Usage: ./backup.sh [MONGODB_URI] [BACKUP_DIR]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${2:-"$SCRIPT_DIR/../../backups"}"

if [ -z "$1" ]; then
    if [ -f "$SCRIPT_DIR/../.env" ]; then
        MONGODB_URI=$(grep -E '^MONGODB_URI=' "$SCRIPT_DIR/../.env" | cut -d '=' -f2- | tr -d '\r')
    else
        MONGODB_URI="$MONGODB_URI"
    fi
else
    MONGODB_URI="$1"
fi

if [ -z "$MONGODB_URI" ]; then
    echo "Error: MONGODB_URI not provided and not found in .env" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_FILE="$BACKUP_DIR/pharmaerp_backup_${TIMESTAMP}.gz"

echo "=========================================="
echo "  PharmaERP Database Backup Utility"
echo "=========================================="
echo "Target Archive: $ARCHIVE_FILE"

mongodump --uri="$MONGODB_URI" --archive="$ARCHIVE_FILE" --gzip

echo "Backup created successfully: $ARCHIVE_FILE"
