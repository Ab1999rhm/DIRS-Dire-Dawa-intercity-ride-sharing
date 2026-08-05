#!/bin/bash
# DIRS Database Restore Script
# Usage: ./restore.sh ./backups/dirs_backup_20260805_020000.gz

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.gz>"
  echo "Example: $0 ./backups/dirs_backup_20260805_020000.gz"
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
  --uri="mongodb://fikaduabraham093_db_user:fqPONaDBsb2kXCIF@ac-y8f2kev-shard-00-00.q3rw6ml.mongodb.net:27017/dirs_diredawa?authSource=admin&tls=true&tlsAllowInvalidCertificates=true" \
  --archive="$BACKUP_FILE" \
  --gzip \
  --drop

echo "[$(date)] Restore completed successfully"
