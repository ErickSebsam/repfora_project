import express from 'express';
import {
  getAllVacations,
  createVacation,
  updateVacation,
  deleteVacation,
} from '../controller/planningVacation.controller.js';

const router = express.Router();

// GET    /api/planning/vacations        → Lista todos los días no programables
router.get('/', getAllVacations);

// POST   /api/planning/vacations        → Crea un nuevo rango
router.post('/', createVacation);

// PUT    /api/planning/vacations/:id    → Edita un rango existente
router.put('/:id', updateVacation);

// DELETE /api/planning/vacations/:id    → Elimina un rango
router.delete('/:id', deleteVacation);

export { router as routerPlanningVacation };
