// src/db/backup_utils.ts
import { format } from "date-fns";
// Per timestamp nel nome del backup
import fs from "fs-extra";
// Per fs.copy, più robusto
import path from "path";

const projectRoot = process.cwd();
const dbDir = path.join(projectRoot, "database");
const dbName = "starter_default.db"; // Assicurati che questo nome sia consistente con src/lib/db/index.ts
const dbPath = path.join(dbDir, dbName);
const backupsDir = path.join(dbDir, "backups"); // Sottodirectory per i backup

/**
 * Crea un backup del file database corrente.
 * @param reason Una stringa opzionale per descrivere il motivo del backup (es. "pre-reset", "pre-apply-changes").
 * @returns Il percorso al file di backup creato, o null se il database non esisteva.
 * @throws Errore se la copia fallisce.
 */
export async function createBackup(
  reason: string = "manual"
): Promise<string | null> {
  console.log(`[Backup Util] Attempting to backup database: ${dbPath}`);
  console.log(`[Backup Util] Reason for backup: ${reason}`);

  if (!fs.existsSync(dbPath)) {
    console.warn("[Backup Util] Database file not found. Nothing to backup.");
    return null;
  }

  // Assicura che la directory dei backup esista
  if (!fs.existsSync(backupsDir)) {
    try {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log(`[Backup Util] Created backups directory: ${backupsDir}`);
    } catch (mkdirError) {
      console.error(
        `[Backup Util] Failed to create backups directory ${backupsDir}:`,
        mkdirError
      );
      throw mkdirError; // Rilancia l'errore
    }
  }

  const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
  // Includi la ragione nel nome del file per chiarezza
  const safeReason = reason.replace(/[^a-z0-9_.-]/gi, "_").toLowerCase(); // Rendi la ragione sicura per il nome file
  const backupFileName = `${dbName}.${safeReason}.backup_${timestamp}.db`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  try {
    await fs.copy(dbPath, backupFilePath); // fs-extra.copy() è asincrono
    console.log(
      `[Backup Util] Database successfully backed up to: ${backupFilePath}`
    );

    // Copia anche i file ausiliari SHM e WAL se esistono
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(shmPath)) {
      await fs.copy(shmPath, `${backupFilePath}-shm`);
      console.log(`[Backup Util] SHM file backed up to: ${backupFilePath}-shm`);
    }
    const walPath = `${dbPath}-wal`;
    if (fs.existsSync(walPath)) {
      await fs.copy(walPath, `${backupFilePath}-wal`);
      console.log(`[Backup Util] WAL file backed up to: ${backupFilePath}-wal`);
    }

    return backupFilePath;
  } catch (copyError) {
    console.error("[Backup Util] Error creating database backup:", copyError);
    throw copyError; // Rilancia l'errore
  }
}
