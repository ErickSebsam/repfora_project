import fs from "fs";
import { google } from "googleapis";
import { uploadFileLocal, deleteFileLocal } from "./filesLocal.js";

// Storage type switch: "drive" or "local" (default: local)
const STORAGE_TYPE = process.env.STORAGE_TYPE?.toLowerCase() || "local";

async function authorize() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  console.log("[DRIVE] auth method: OAuth2");
  console.log("[DRIVE] client_id present:", !!clientId);
  console.log("[DRIVE] refresh_token present:", !!refreshToken);

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({
    refresh_token: refreshToken,
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  try {
    const token = await auth.getAccessToken();
    console.log("[DRIVE] auth OK - access token obtained");
    return auth;
  } catch (err) {
    console.error("[DRIVE] auth FAILED:", err.message);
    console.error("[DRIVE] auth error code:", err.code);
    throw err;
  }
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

//buscar si ya existe la carpeta dentro de un padre específico
async function findFolder(drive, name, parentId) {
  return new Promise((resolve, reject) => {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    drive.files.list(
      {
        q: query,
        fields: "nextPageToken, files(id, name)",
      },
      function (err, res) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(res.data.files);
        }
      }
    );
  });
}

//crear carpeta dentro de un padre específico
async function createFolder(drive, nameFolder, parentId) {
  return new Promise((resolve, reject) => {
    let fileMetadata = {
      name: nameFolder,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) {
      fileMetadata.parents = [parentId];
    }
    drive.files.create(
      {
        resource: fileMetadata,
        fields: "id",
      },
      function (err, file) {
        if (err) {
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

    // Determinar el parent directo de las carpetas de coordinación
    // Si CENTER_NAME está definido: ROOT > CENTER_NAME > nameFolder
    // Si no:                        ROOT > nameFolder
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const centerName = process.env.CENTER_NAME;

    let coordParentId = rootFolderId;

    if (centerName) {
      const centerFolders = (await findFolder(drive, centerName, rootFolderId)) || [];
      let centerFolder = centerFolders.find((f) => f.name === centerName);
      if (!centerFolder) {
        centerFolder = await createFolder(drive, centerName, rootFolderId);
      }
      coordParentId = centerFolder.id;
    }

    const foldersDrive = (await findFolder(drive, nameFolder, coordParentId)) || [];

    let folder = foldersDrive.find((folder) => folder.name === nameFolder);

    if (!folder) {
      folder = await createFolder(drive, nameFolder, coordParentId);
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
    console.error("[DRIVE] uploadFile error:", error.message);
    console.error("[DRIVE] uploadFile code:", error.code);
    console.error("[DRIVE] uploadFile stack:", error.stack);
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
