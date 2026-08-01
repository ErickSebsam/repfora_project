import mongoose from 'mongoose';

const planningShiftSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  hoursPerDay: { type: Number, required: true },
  allowedDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 1 = Lunes, ..., 7 = Domingo
  defaultStartTime: { type: String, default: '' },
  defaultEndTime: { type: String, default: '' },
  isCustom: { type: Boolean, default: false },
  status: { type: Number, default: 0 } // 0 = Activo, 1 = Inactivo
}, {
  timestamps: true,
  collection: 'planningshifts'
});

const PlanningShift = mongoose.model('PlanningShift', planningShiftSchema);

export default PlanningShift;
