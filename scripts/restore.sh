#!/bin/bash
# DIRS Database Restore Script
# Usage: MONGODB_URI='mongodb://...' ./restore.sh ./backups/dirs_backup_20260805_020000.gz
# Requires MONGODB_URI environment variable

set -e

if [ -z "$MONGODB_URI" ]; then
  echo "Error: MONGODB_URI environment variable is not set."
  echo "Usage: MONGODB_URI='mongodb://...' $0 <backup_file.gz>"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.gz>"
  echo "Example: MONGODB_URI='mongodb://...' $0 ./backups/dirs_backup_20260805_020000.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

read -p "This will OVERWRITE the current database. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date)] Starting database restore from $BACKUP_FILE..."

mongorestore \
  --uri="$MONGODB_URI" \
  --archive="$BACKUP_FILE" \
  --gzip \
  --drop

echo "[$(date)] Restore completed successfully"
