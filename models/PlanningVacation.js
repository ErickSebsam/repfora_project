import mongoose from 'mongoose';

/**
 * Modelo para los días no programables (vacaciones colectivas, festivos especiales, etc.)
 * del módulo de Planeación Pedagógica.
 * Reemplaza el almacenamiento en localStorage del frontend.
 */
const planningVacationSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
      // Formato 'YYYY-MM-DD'
    },
    end: {
      type: String,
      required: true,
      // Formato 'YYYY-MM-DD'
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: String,
      default: '',
      // Email del usuario que creó el registro
    },
  },
  { timestamps: true }
);

const PlanningVacation = mongoose.model(
  'PlanningVacation',
  planningVacationSchema,
  'planningVacations'
);

export default PlanningVacation;
