import express from 'express';
import { uploadPlanning, getPlanningByFiche, extractFromPDFs, getAllPlannings, scheduleOutcomeInCalendar, savePlanningTemplate, getPlanningTemplate, applyPlanningTemplate } from '../controller/planning.controller.js';

const router = express.Router();

// Ruta para obtener todas las planeaciones
router.get('/', getAllPlannings);

// Ruta para recibir la extracción de Python
router.post('/upload', uploadPlanning);

// Ruta para subir PDFs y ejecutar extracción automática
router.post('/extract', extractFromPDFs);

// Ruta para programar un resultado de la planeación pedagógica directamente al calendario oficial
router.post('/schedule-outcome', scheduleOutcomeInCalendar);

// Rutas para planillas (plantillas) de programas
router.post('/template', savePlanningTemplate);
router.get('/template/:programCode', getPlanningTemplate);

// Ruta para aplicar una plantilla a la planeación de una ficha
// (va antes de /:fiche para evitar conflicto con el parámetro dinámico)
router.post('/apply-template/:fiche', applyPlanningTemplate);

// Ruta para obtener planeación por ficha (se deja al final por ser parámetro dinámico)
router.get('/:fiche', getPlanningByFiche);

export { router as routerPlanning };
