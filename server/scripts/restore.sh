#!/usr/bin/env bash
# PharmaERP Database Restore Utility (Bash)
# Usage: ./restore.sh <ARCHIVE_FILE> [MONGODB_URI] [--drop]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE_FILE="$1"
MONGODB_URI="$2"
DROP_FLAG=""

if [ -z "$ARCHIVE_FILE" ]; then
    echo "Usage: ./restore.sh <ARCHIVE_FILE> [MONGODB_URI] [--drop]" >&2
    exit 1
fi

if [ "$3" = "--drop" ] || [ "$2" = "--drop" ]; then
    DROP_FLAG="--drop"
fi

if [ -z "$MONGODB_URI" ] || [ "$MONGODB_URI" = "--drop" ]; then
    if [ -f "$SCRIPT_DIR/../.env" ]; then
        MONGODB_URI=$(grep -E '^MONGODB_URI=' "$SCRIPT_DIR/../.env" | cut -d '=' -f2- | tr -d '\r')
    else
        MONGODB_URI="$MONGODB_URI"
    fi
fi

if [ -z "$MONGODB_URI" ]; then
    echo "Error: MONGODB_URI not provided and not found in .env" >&2
    exit 1
fi

echo "=========================================="
echo "  PharmaERP Database Restore Utility"
echo "=========================================="
echo "Archive File: $ARCHIVE_FILE"

mongorestore --uri="$MONGODB_URI" --archive="$ARCHIVE_FILE" --gzip $DROP_FLAG

echo "Database restored successfully from: $ARCHIVE_FILE"
