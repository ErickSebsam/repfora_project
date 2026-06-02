import express from 'express';
import { uploadPlanning, getPlanningByFiche, extractFromPDFs, getAllPlannings, scheduleOutcomeInCalendar, savePlanningTemplate, getPlanningTemplate } from '../controller/planning.controller.js';

const router = express.Router();

// Ruta para recibir la extracción de Python
router.post('/upload', uploadPlanning);

// Ruta para obtener todas las planeaciones
router.get('/', getAllPlannings);

// Ruta para programar un resultado de la planeación pedagógica directamente al calendario oficial
router.post('/schedule-outcome', scheduleOutcomeInCalendar);

// Rutas para planillas (plantillas) de programas
router.post('/template', savePlanningTemplate);
router.get('/template/:programCode', getPlanningTemplate);

// Ruta para obtener planeación por ficha
router.get('/:fiche', getPlanningByFiche);

// Ruta para subir PDFs y ejecutar extracción automática
router.post('/extract', extractFromPDFs);

export { router as routerPlanning };
