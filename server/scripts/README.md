# PharmaERP Database Backup & Restore Utilities

This directory contains production-ready automated database backup and disaster recovery scripts for MongoDB (Atlas Replica Sets and self-hosted instances).

## Prerequisites
- MongoDB Database Tools (`mongodump` & `mongorestore`) installed and added to your system PATH.
  - Windows: [MongoDB Database Tools MSI](https://www.mongodb.com/try/download/database-tools)
  - Linux: `sudo apt-get install mongodb-database-tools` or `yum install mongodb-database-tools`
  - macOS: `brew install mongodb-database-tools`

---

## 1. Automated Backups

### Windows (PowerShell)
```powershell
cd server/scripts
.\backup.ps1
```
*Backups are saved to `backups/pharmaerp_backup_YYYYMMDD_HHMMSS.gz` with gzip compression.*

To schedule a daily backup at 2:00 AM using Windows Task Scheduler:
```powershell
schtasks /create /tn "PharmaERP_Daily_Backup" /tr "powershell.exe -ExecutionPolicy Bypass -File G:\code\PharmaERP\server\scripts\backup.ps1" /sc daily /st 02:00
```

### Linux / macOS (Bash)
```bash
chmod +x server/scripts/backup.sh
./server/scripts/backup.sh
```

To schedule a daily cron job at 2:00 AM:
```bash
0 2 * * * /path/to/PharmaERP/server/scripts/backup.sh >> /var/log/pharmaerp_backup.log 2>&1
```

---

## 2. Disaster Recovery & Restore

### Windows (PowerShell)
```powershell
# Restore without dropping existing database
.\restore.ps1 -ArchiveFile "..\..\backups\pharmaerp_backup_20261003_120000.gz"

# Restore with clean drop/overwrite of existing collections
.\restore.ps1 -ArchiveFile "..\..\backups\pharmaerp_backup_20261003_120000.gz" -Drop
```

### Linux / macOS (Bash)
```bash
chmod +x server/scripts/restore.sh
./server/scripts/restore.sh /path/to/backups/pharmaerp_backup_20261003_120000.gz --drop
```
