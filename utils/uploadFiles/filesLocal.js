import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Base directory for uploads
const UPLOAD_BASE_DIR = process.env.UPLOAD_PATH || "/var/www/repfora/uploads";

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Upload file to local storage
 * @param {Object} file - File object with { tempFilePath, name, mimetype }
 * @param {string} nameFolder - Folder name (e.g., "news", "instructivos")
 * @param {Array} emailsFolder - Array of emails (ignored for local storage)
 * @param {string} idOldImg - Old image ID to delete (ignored for local storage)
 * @returns {Promise<Object>} - { id, name, url }
 */
export async function uploadFileLocal(
  file,
  nameFolder = "others",
  emailsFolder = [],
  idOldImg = null
) {
  try {
    // Create folder if not exists
    const folderPath = path.join(UPLOAD_BASE_DIR, nameFolder);
    ensureDir(folderPath);

    // Generate unique filename
    const ext = path.extname(file.name);
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    const destPath = path.join(folderPath, uniqueName);

    // Copy file from temp to destination
    fs.copyFileSync(file.tempFilePath, destPath);

    // Delete temp file
    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }

    // Generate public URL
    const url = `/uploads/${nameFolder}/${uniqueName}`;

    return {
      id: uniqueName, // Using filename as ID
      name: file.name,
      url,
    };
  } catch (error) {
    console.error("Error in uploadFileLocal:", error);
    throw new Error(error.message || "Error uploading file to local storage");
  }
}

/**
 * Delete file from local storage
 * @param {string} fileId - The filename/ID to delete
 * @returns {Promise<void>}
 */
export async function deleteFileLocal(fileId) {
  try {
    // Search in all subdirectories
    const folders = fs.readdirSync(UPLOAD_BASE_DIR, { withFileTypes: true });

    for (const folder of folders) {
      if (folder.isDirectory()) {
        const filePath = path.join(UPLOAD_BASE_DIR, folder.name, fileId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return;
        }
      }
    }
  } catch (error) {
    console.error("Error in deleteFileLocal:", error);
    throw new Error(error.message || "Error deleting file from local storage");
  }
}
