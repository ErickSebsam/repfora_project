import fs from "fs";
import { google } from "googleapis";
import { uploadFileLocal, deleteFileLocal } from "./filesLocal.js";

const apiKey = `./utils/uploadFiles/${process.env.GOOGLE_DRIVE_API_KEY}`;

const SCOPE = "https://www.googleapis.com/auth/drive";

// Storage type switch: "drive" or "local" (default: local)
const STORAGE_TYPE = process.env.STORAGE_TYPE?.toLowerCase() || "local";

async function authorize() {
  const auth = new google.auth.JWT({
    keyFile: apiKey,
    scopes: SCOPE,
    email: apiKey.client_email,
    key: apiKey.private_key,
  });

  await auth.authorize();

  return auth;
}

//eliminar una imagen de drive
export async function deleteFile(drive, fileId) {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

//buscar si ya existe la carpeta
async function findFolder(drive, name) {
  return new Promise((resolve, reject) => {
    let query =
      "mimeType='application/vnd.google-apps.folder' and name='" + name + "'";
    drive.files.list(
      {
        q: query,
        fields: "nextPageToken, files(id, name)",
      },
      function (err, res) {
        if (err) {
          // Handle error
          console.error(err);
          reject(err);
        } else {
          resolve(res.data.files);
        }
      }
    );
  });
}

//crear carpeta en caso de no existir
async function createFolder(drive, nameFolder) {
  return new Promise((resolve, reject) => {
    let fileMetadata = {
      name: nameFolder,
      mimeType: "application/vnd.google-apps.folder",
    };
    drive.files.create(
      {
        resource: fileMetadata,
        fields: "id",
      },
      function (err, file) {
        if (err) {
          // Handle error
          console.error(err);
          reject(err);
        } else {
          resolve({
            id: file.data.id,
            name: file.config.data.name,
          });
        }
      }
    );
  });
}

//dar permiso a senapruebas123@gmail.com para editar la carpeta
async function givePermission(drive, folderId, email) {
  return new Promise((resolve, reject) => {
    let permission = {
      type: "user",
      role: "writer",
      emailAddress: email,
    };

    drive.permissions.create(
      {
        resource: permission,
        fileId: folderId,
        fields: "id",
      },
      function (err, res) {
        if (err) {
          // Handle error...
          console.error(err);
          reject(err);
        } else {
          resolve(res);
        }
      }
    );
  });
}

export async function uploadFile(
  file,
  nameFolder = "others",
  emailsFolder,
  idOldImg
) {
  const fileUpload = file;
  try {
    const auth = await authorize();

    const drive = google.drive({ version: "v3", auth });
    const foldersDrive = (await findFolder(drive, nameFolder)) || [];

    //validar si los nombres de las carpetas osn exactamente iguales
    let folder = foldersDrive.find((folder) => folder.name === nameFolder);

    if (!folder) {
      folder = await createFolder(drive, nameFolder);
      for (const email of emailsFolder) {
        await givePermission(drive, folder.id, email);
      }
    }

    //si existe una imagen anterior eliminarla
    try {
      if (idOldImg) {
        await deleteFile(drive, idOldImg);
      }
    } catch (error) {}

    const requestBody = {
      name: fileUpload.name,
      parents: [folder.id],
    };

    console.log("mim3", fileUpload.mimetype);
    const media = {
      mimeType: fileUpload.mimetype,
      body: fs.createReadStream(fileUpload.tempFilePath),
    };

    const file = await drive.files.create({
      resource: requestBody,
      media: media,
      fields: "id",
    });

    const url = await generatePublicUrl(drive, file.data.id);

    //eliminar la imagen de la carpeta tmp
    fs.unlinkSync(fileUpload.tempFilePath);

    return {
      id: file.data.id,
      name: fileUpload.name,
      url,
    };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function generatePublicUrl(drive, fileId) {
  return new Promise((resolve, reject) => {
    let permission = {
      type: "anyone",
      role: "reader",
    };

    drive.permissions.create(
      {
        resource: permission,
        fileId: fileId,
        fields: "id",
      },
      function (err, res) {
        if (err) {
          // Handle error...
          console.log(err);
          reject(err);
        } else {
          const urlImg = `https://drive.google.com/file/d/${fileId}/preview`;
          resolve(urlImg);
        }
      }
    );
  });
}

// =====================================================
// WRAPPER FUNCTIONS - Switch between Drive and Local
// =====================================================

/**
 * Upload file to Drive or Local based on STORAGE_TYPE env variable
 * @param {Object} file - File object with { tempFilePath, name, mimetype }
 * @param {string} nameFolder - Folder name
 * @param {Array} emailsFolder - Array of emails (for Drive permissions)
 * @param {string} idOldImg - Old image ID to delete
 * @returns {Promise<Object>} - { id, name, url }
 */
export async function uploadFileByType(
  file,
  nameFolder = "others",
  emailsFolder = [],
  idOldImg = null
) {
  if (STORAGE_TYPE === "drive") {
    console.log("[STORAGE] Using Google Drive");
    return await uploadFile(file, nameFolder, emailsFolder, idOldImg);
  } else {
    console.log("[STORAGE] Using Local Storage");
    return await uploadFileLocal(file, nameFolder, emailsFolder, idOldImg);
  }
}

/**
 * Delete file from Drive or Local based on STORAGE_TYPE env variable
 * @param {Object} drive - Drive instance (required for Drive)
 * @param {string} fileId - File ID to delete
 * @returns {Promise<void>}
 */
export async function deleteFileByType(drive, fileId) {
  if (STORAGE_TYPE === "drive") {
    console.log("[STORAGE] Deleting from Google Drive");
    return await deleteFile(drive, fileId);
  } else {
    console.log("[STORAGE] Deleting from Local Storage");
    return await deleteFileLocal(fileId);
  }
}
