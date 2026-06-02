import { Router } from "express";
import { backupdatabaseCtrl } from "../controller/backupdatabase.controller.js";
import { backupdatabasVali } from "../validations/backupdatabase.validation.js";

/**
 * Controller functions containing validation functions for backupdatabase registration, existence, update, and headers.
 * @typedef {Object} backupdatabaseCtrl
 * @property {Function} backupDatabase - backups of database.
 * @property {Function} listBackup - list of backup.
 * @property {Function} downloadBackup - download of backup.
 * @property {Function} restoreBackup - restore of backup.
 */
const { backupDatabase, listBackup, downloadBackup, restoreBackup } =
  backupdatabaseCtrl;
const { validateToken } = backupdatabasVali;

const routerBackupDatabase = Router();

/**
 * @swagger
 * /api/backupdatabase:
 *   get:
 *     summary: Crea un backup de la base de datos
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Backup creado correctamente"
 *                 filePath:
 *                   type: string
 *                   example: "/backups/backup_2024-02-07.zip"
 */
routerBackupDatabase.get("/", validateToken, backupDatabase);

/**
 * @swagger
 * /api/backupdatabase/listbackup:
 *   get:
 *     summary: Lista todos los backups disponibles
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de backups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "backup_2024-02-07.zip"
 *                   size:
 *                     type: string
 *                     example: "2.5 MB"
 *                   date:
 *                     type: string
 *                     example: "2024-02-07T10:30:00.000Z"
 */
routerBackupDatabase.get("/listbackup", validateToken, listBackup);

/**
 * @swagger
 * /api/backupdatabase/downloadbackup:
 *   get:
 *     summary: Descarga un backup de la base de datos
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del archivo a descargar
 *         example: "backup_2024-02-07.zip"
 *     responses:
 *       200:
 *         description: Archivo de backup descargado
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Archivo no encontrado
 */
routerBackupDatabase.get("/downloadbackup", validateToken, downloadBackup);

// routerBackupDatabase.get("/restorebackup",validateToken, restoreBackup);

export { routerBackupDatabase };
