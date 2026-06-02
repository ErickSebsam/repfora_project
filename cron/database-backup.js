import * as cron from "node-cron";

import {
  createBackupDb,
  deleteOldDriveBackups,
  deleteOldLocalBackup,
} from "../controller/backupdatabase.controller.js";
import { deleteOldBinnacle } from "../controller/binnacle.controller.js";

export const cronDatabaseBackup = async () => {
  //ejecutar el cron diariamente a las 3:00 am hora del servidor
  cron.schedule("0 3 * * *", async () => {
    console.log("🗄️  Iniciando backup automático de base de datos...");

    const backupResult = await createBackupDb();

    if (!backupResult.success) {
      console.error("❌ Error al crear el backup:", backupResult.error);
    } else {
      console.log("✅ Backup creado correctamente y subido a Drive");
    }
  });
};

export const deleteOldBackups = async () => {
  //ejecutar semanalmente (domingos) a las 1:00 am hora del servidor
  cron.schedule("0 1 * * 0", async () => {
    try {
      console.log("🧹 Iniciando limpieza de backups antiguos...");

      // Limpiar backups locales (más de 7 días)
      const localResult = await deleteOldLocalBackup();
      if (localResult.success) {
        console.log(`✅ Backups locales eliminados: ${localResult.deletedCount.local}`);
      }

      // Limpiar backups de Drive (más de 15 días)
      const driveResult = await deleteOldDriveBackups();
      if (driveResult.success) {
        console.log(`✅ Backups de Drive eliminados: ${driveResult.deletedCount.drive}`);
      }

      // Limpiar bitácora antigua
      await deleteOldBinnacle();
      console.log("✅ Limpieza completada");
    } catch (err) {
      console.error("❌ Error en limpieza de backups:", err);
    }
  });
};