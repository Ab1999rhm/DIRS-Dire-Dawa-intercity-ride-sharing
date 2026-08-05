#!/bin/bash
# DIRS Database Backup Script
# Run daily via cron: 0 2 * * * /path/to/backup.sh
# Requires MONGODB_URI environment variable

set -e

if [ -z "$MONGODB_URI" ]; then
  echo "Error: MONGODB_URI environment variable is not set."
  echo "Usage: MONGODB_URI='mongodb://...' ./backup.sh"
  exit 1
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dirs_backup_$TIMESTAMP.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting DIRS database backup..."

mongodump \
  --uri="$MONGODB_URI" \
  --archive="$BACKUP_FILE" \
  --gzip

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completed: $BACKUP_FILE ($FILESIZE)"

find "$BACKUP_DIR" -name "dirs_backup_*.gz" -mtime +30 -delete
echo "[$(date)] Old backups cleaned (kept 30 days)"

echo "[$(date)] Backup process finished"
