import express from 'express';
import {
  getAllShifts,
  createShift,
  updateShift,
  deleteShift
} from '../controller/planningShift.controller.js';

const router = express.Router();

// GET    /api/planning/shifts        → Obtener todas las jornadas
router.get('/', getAllShifts);

// POST   /api/planning/shifts        → Crear una nueva jornada
router.post('/', createShift);

// PUT    /api/planning/shifts/:id    → Actualizar una jornada existente
router.put('/:id', updateShift);

// DELETE /api/planning/shifts/:id    → Eliminar una jornada
router.delete('/:id', deleteShift);

export { router as routerPlanningShift };
