#!/bin/bash
# DIRS Database Backup Script
# Run daily via cron: 0 2 * * * /path/to/backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dirs_backup_$TIMESTAMP.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting DIRS database backup..."

mongodump \
  --uri="mongodb://fikaduabraham093_db_user:fqPONaDBsb2kXCIF@ac-y8f2kev-shard-00-00.q3rw6ml.mongodb.net:27017/dirs_diredawa?authSource=admin&tls=true&tlsAllowInvalidCertificates=true" \
  --archive="$BACKUP_FILE" \
  --gzip

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completed: $BACKUP_FILE ($FILESIZE)"

find "$BACKUP_DIR" -name "dirs_backup_*.gz" -mtime +30 -delete
echo "[$(date)] Old backups cleaned (kept 30 days)"

echo "[$(date)] Backup process finished"
