import registerAction from "../middlewares/binnacle.js";
import { execSync } from "child_process";
import fs from "fs";
import archiver from "archiver";
import path from "path";
import { google } from "googleapis";

const backupdatabaseCtrl = {};

// Autorizar con Google Drive
async function authorizeDrive() {
  const apiKey = `./utils/uploadFiles/${process.env.GOOGLE_DRIVE_API_KEY}`;
  const auth = new google.auth.JWT({
    keyFile: apiKey,
    scopes: "https://www.googleapis.com/auth/drive",
  });
  await auth.authorize();
  return auth;
}

// Crear un backup de la base de datos
async function createBackupDb() {
  try {
    const date = new Date();
    const dateFormated = `${date.getFullYear()}-${
      date.getMonth() + 1 < 10
        ? "0" + (date.getMonth() + 1)
        : date.getMonth() + 1
    }-${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}`;

    const backupFolderPath = `./backup/${dateFormated}`;

    if (!fs.existsSync("./backup")) {
      fs.mkdirSync("./backup");
    }

    // Usar MONGO_URL para backup de la base de datos local
    const command = `mongodump --uri "${process.env.MONGO_URL}" --out ${backupFolderPath}`;

    try {
      // Usar execSync para esperar a que termine el comando
      execSync(command, { stdio: "inherit" });
      console.log("Backup successful");
      return { success: true, path: backupFolderPath, date: dateFormated };
    } catch (err) {
      console.error("Error during backup:", err);
      return { success: false, error: err };
    }
  } catch (err) {
    console.error("Error in createBackupDb:", err);
    return { success: false, error: err };
  }
}

// Comprimir el backup en un archivo ZIP
async function compressBackup(backupFolderPath, dateFormated) {
  return new Promise((resolve, reject) => {
    const zipFilePath = `./backup/${dateFormated}.zip`;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`Backup comprimido: ${archive.pointer()} bytes`);
      resolve({ success: true, path: zipFilePath });
    });

    archive.on("error", (err) => {
      console.error("Error comprimiendo backup:", err);
      reject({ success: false, error: err });
    });

    archive.pipe(output);
    archive.directory(backupFolderPath, false);
    archive.finalize();
  });
}

// Subir backup a Google Drive
async function uploadBackupToDrive(zipFilePath, dateFormated) {
  try {
    const auth = await authorizeDrive();
    const drive = google.drive({ version: "v3", auth });

    // Buscar o crear carpeta de backups
    const folderName = "database-backups";
    let folder = await findDriveFolder(drive, folderName);

    if (!folder) {
      folder = await createDriveFolder(drive, folderName);
      console.log(`Carpeta creada: ${folderName}`);
    }

    // Subir el archivo
    const fileMetadata = {
      name: `backup-${dateFormated}.zip`,
      parents: [folder.id],
    };

    const media = {
      mimeType: "application/zip",
      body: fs.createReadStream(zipFilePath),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
      supportsAllDrives: true,
    });

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: file.data.id,
      resource: {
        type: "anyone",
        role: "reader",
      },
    });

    const url = `https://drive.google.com/file/d/${file.data.id}/preview`;

    console.log(`Backup subido a Drive: ${url}`);
    return { success: true, id: file.data.id, url };
  } catch (error) {
    console.error("Error subiendo backup a Drive:", error);
    return { success: false, error };
  }
}

// Buscar carpeta en Drive
async function findDriveFolder(drive, name) {
  try {
    const query = `mimeType='application/vnd.google-apps.folder' and name='${name}'`;
    const res = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      supportsAllDrives: true,
    });

    const folders = res.data.files;
    return folders.find((folder) => folder.name === name) || null;
  } catch (error) {
    console.error("Error buscando carpeta:", error);
    return null;
  }
}

// Crear carpeta en Drive
async function createDriveFolder(drive, name) {
  try {
    const fileMetadata = {
      name: name,
      mimeType: "application/vnd.google-apps.folder",
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      fields: "id",
      supportsAllDrives: true,
    });

    return {
      id: file.data.id,
      name: name,
    };
  } catch (error) {
    console.error("Error creando carpeta:", error);
    throw error;
  }
}

// Listar backups en Drive
async function listDriveBackups() {
  try {
    const auth = await authorizeDrive();
    const drive = google.drive({ version: "v3", auth });

    const folder = await findDriveFolder(drive, "database-backups");
    if (!folder) {
      return [];
    }

    const query = `'${folder.id}' in parents and mimeType='application/zip'`;
    const res = await drive.files.list({
      q: query,
      fields: "files(id, name, createdTime)",
      orderBy: "createdTime desc",
      supportsAllDrives: true,
    });

    return res.data.files || [];
  } catch (error) {
    console.error("Error listando backups de Drive:", error);
    return [];
  }
}

// Eliminar backups antiguos de Drive (más de 15 días)
async function deleteOldDriveBackups() {
  try {
    const auth = await authorizeDrive();
    const drive = google.drive({ version: "v3", auth });

    const backups = await listDriveBackups();
    const date = new Date();
    const deletedCount = { drive: 0, local: 0 };

    for (const backup of backups) {
      const createdDate = new Date(backup.createdTime);
      const diffTime = Math.abs(date.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 15) {
        await drive.files.delete({
          fileId: backup.id,
          supportsAllDrives: true,
        });
        console.log(`Backup antiguo eliminado de Drive: ${backup.name}`);
        deletedCount.drive++;
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Error eliminando backups antiguos de Drive:", error);
    return { success: false, error };
  }
}

// Eliminar las copias de seguridad locales antiguas de más de 7 días
async function deleteOldLocalBackup() {
  const backupFolder = "./backup";

  try {
    if (!fs.existsSync(backupFolder)) {
      return { success: true, deletedCount: { local: 0 } };
    }

    const folders = fs.readdirSync(backupFolder);
    const date = new Date();
    let deletedLocal = 0;

    folders.forEach((folder) => {
      // Solo procesar carpetas de fecha (formato YYYY-MM-DD)
      if (!folder.match(/^\d{4}-\d{2}-\d{2}$/)) return;

      const folderDate = folder.split("-");
      const folderDateFormated = `${folderDate[0]}-${folderDate[1]}-${folderDate[2]}`;
      const dateFolder = new Date(folderDateFormated);
      const diffTime = Math.abs(date.getTime() - dateFolder.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        const fullPath = `${backupFolder}/${folder}`;
        if (fs.existsSync(fullPath)) {
          fs.rmdirSync(fullPath, { recursive: true });
          console.log(`Backup local antiguo eliminado: ${folder}`);
          deletedLocal++;
        }
      }

      // También eliminar archivos ZIP antiguos
      if (folder.endsWith('.zip')) {
        const filePath = `${backupFolder}/${folder}`;
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const diffTime = Math.abs(date.getTime() - stats.mtime.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 7) {
            fs.unlinkSync(filePath);
            console.log(`ZIP local antiguo eliminado: ${folder}`);
            deletedLocal++;
          }
        }
      }
    });

    return { success: true, deletedCount: { local: deletedLocal } };
  } catch (err) {
    console.error("Error eliminando backups locales:", err);
    return { success: false, error: err };
  }
}

// Eliminar carpeta local después de subir a Drive
async function cleanupLocalBackup(backupFolderPath, zipFilePath) {
  try {
    // Eliminar carpeta del backup
    if (fs.existsSync(backupFolderPath)) {
      fs.rmdirSync(backupFolderPath, { recursive: true });
    }

    // Eliminar archivo ZIP
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
    }

    console.log("Limpieza local completada");
    return { success: true };
  } catch (error) {
    console.error("Error en limpieza local:", error);
    return { success: false, error };
  }
}

backupdatabaseCtrl.backupDatabase = async (req, res) => {
  try {
    await registerAction("DATABASE", { event: "COPIA DE LA BASE DE DATOS" }, req.headers.token);

    console.log("Iniciando proceso de backup...");

    // Paso 1: Crear backup local con mongodump
    const backupResult = await createBackupDb();
    if (!backupResult.success) {
      console.error("Error creando backup local:", backupResult.error);
      return res.status(500).json({
        msg: "Error al crear el backup local",
        error: backupResult.error?.message,
      });
    }

    // Paso 2: Comprimir backup en ZIP
    console.log("Comprimiendo backup...");
    const compressResult = await compressBackup(backupResult.path, backupResult.date);
    if (!compressResult.success) {
      return res.status(500).json({
        msg: "Error al comprimir el backup",
      });
    }

    // Paso 3: Subir a Google Drive
    console.log("Subiendo backup a Google Drive...");
    const uploadResult = await uploadBackupToDrive(compressResult.path, backupResult.date);
    if (!uploadResult.success) {
      return res.status(500).json({
        msg: "Error al subir el backup a Drive",
      });
    }

    // Paso 4: Limpiar archivos locales (ahorrar espacio)
    console.log("Limpiando archivos locales...");
    await cleanupLocalBackup(backupResult.path, compressResult.path);

    return res.status(200).json({
      msg: "Backup creado correctamente y subido a Google Drive",
      url: uploadResult.url,
      date: backupResult.date,
    });
  } catch (err) {
    console.error("Error en proceso de backup:", err);
    return res.status(500).json({
      msg: "Error al crear el backup",
      error: err.message,
    });
  }
};

//listar las carpetas de backup disponibles
backupdatabaseCtrl.listBackup = async (req, res) => {
  try {
    await registerAction("DATABASE", { event: "LISTAR COPIAS DE SEGURIDAD" }, req.headers.token);

    // Listar backups locales
    const backupFolder = "./backup";
    let localBackups = [];
    if (fs.existsSync(backupFolder)) {
      localBackups = fs.readdirSync(backupFolder);
    }

    // Listar backups de Drive
    const driveBackups = await listDriveBackups();

    return res.status(200).json({
      msg: "Listado de backups",
      local: localBackups,
      drive: driveBackups.map(b => ({
        id: b.id,
        name: b.name,
        created: b.createdTime,
        url: `https://drive.google.com/file/d/${b.id}/preview`
      })),
      total: {
        local: localBackups.length,
        drive: driveBackups.length
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "Error al listar los backups",
    });
  }
};

//descargar un backup
backupdatabaseCtrl.downloadBackup = async (req, res) => {
  const { folder } = req.query;
  try {
    await registerAction("DATABASE",{event: "DESCARGAR COPIA DE SEGURIDAD"}, req.headers.token);
    //validar que exista la carpeta
    const backupFolder = "./backup";
    const folders = fs.readdirSync(backupFolder);
    if (!folders.includes(folder)) {
      return res.status(404).json({
        msg: "No existe la carpeta de backup",
      });
    }

    //crear el archivo zip
    const zipFilePath = `./backup/${folder}.zip`;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw new Error(err);
    });

    output.on("close", async () => {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "Se ha creado el archivo zip correctamente en la ruta: " + zipFilePath
      );
      res.download(zipFilePath, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Se ha descargado el archivo zip correctamente");
          //eliminar el archivo zip
          fs.unlinkSync(zipFilePath);
        }
      });
    });

    archive.pipe(output); // para que se guarde en el archivo zip
    archive.directory(`${backupFolder}/${folder}`, false); // para que se guarde en el archivo zip
    await archive.finalize(); // para que se guarde en el archivo zip

    const __dirname = path.resolve();
    const filePath = path.join(__dirname, "backup", `${folder}.zip`);
    console.log(filePath);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "Error al descargar el backup",
    });
  }
};

//restaurar un backup
backupdatabaseCtrl.restoreBackup = async (req, res) => {
  const { folder } = req.query;

  try {
    await registerAction("DATABASE", { event: "RESTAURAR COPIA DE SEGURIDAD" }, req.headers.token);

    //validar que exista la carpeta
    const backupFolder = "./backup";
    if (!fs.existsSync(backupFolder)) {
      return res.status(404).json({
        msg: "No existe la carpeta de backup",
      });
    }

    const folders = fs.readdirSync(backupFolder);
    if (!folders.includes(folder)) {
      return res.status(404).json({
        msg: "No existe la carpeta de backup",
      });
    }

    // Usar MONGO_URL para restaurar a la base de datos local
    const command = `mongorestore --uri "${process.env.MONGO_URL}" --nsInclude=Horarios_SENA.* --drop ${backupFolder}/${folder}`;

    try {
      execSync(command, { stdio: "inherit" });
      return res.status(200).json({
        msg: "Backup restaurado correctamente",
      });
    } catch (err) {
      console.error("Error during restore:", err);
      return res.status(500).json({
        msg: "Error al restaurar el backup",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "Error al restaurar el backup",
    });
  }
};

export {
  backupdatabaseCtrl,
  createBackupDb,
  deleteOldLocalBackup,
  deleteOldDriveBackups,
  uploadBackupToDrive,
  listDriveBackups
};
