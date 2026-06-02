import mongoose from 'mongoose';

const { Schema } = mongoose;

// Nivel 4: Aprendiz
const LearnerSnapshotSchema = new Schema({
  name: String,
  document: String
}, { _id: false });

// Nivel 3: Resultado de Aprendizaje (Schedule/Outcome) - PENDIENTE
const PendingOutcomeSchema = new Schema({
  scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedules' },
  outcomeText: String,
  isTotalMissing: Boolean,
  missingLearners: [LearnerSnapshotSchema],
  totalLearners: Number,
  fend: Date
}, { _id: false });

// Nivel 3: Resultado de Aprendizaje VENCIDO
const VencidoOutcomeSchema = new Schema({
  scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedules' },
  ficheNumber: String,
  ficheId: { type: Schema.Types.ObjectId, ref: 'Fiche' },
  outcomeText: String,
  fend: Date,
  daysOverdue: Number,
  missingCount: Number,
  totalLearners: Number,
  // Instructor del schedule
  instructorName: String,
  instructorEmail: String,
  // Líder de la ficha (fiche owner)
  ficheOwnerName: String,
  ficheOwnerEmail: String
}, { _id: false });

// Inconsistencia: Outcome existe en BD pero no se encontró en Excel
const InconsistencySchema = new Schema({
  ficheNumber: String,
  ficheId: { type: Schema.Types.ObjectId, ref: 'Fiche' },
  scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedules' },
  outcomeText: String,
  instructorName: String,
  instructorEmail: String,
  reason: { type: String, default: 'Resultado no encontrado en el Excel de Sofía Plus' }
}, { _id: false });

// Nivel 2: Ficha
const FicheReportSchema = new Schema({
  ficheNumber: String,
  ficheId: { type: Schema.Types.ObjectId, ref: 'Fiche' },
  // Líder de la ficha (fiche owner)
  ficheOwnerName: String,
  ficheOwnerEmail: String,
  pendingOutcomes: [PendingOutcomeSchema]
}, { _id: false });

// Nivel 1: Registro Principal de la Auditoría (Root)
const DailyAuditLogSchema = new Schema({
  executionDate: { type: Date, default: Date.now, index: true },
  totalFichesWithIssues: Number,
  totalOutcomesPending: Number,
  totalVencidosOutcomes: { type: Number, default: 0 },
  details: [FicheReportSchema],
  vencidosOutcomes: [VencidoOutcomeSchema], // Resultados vencidos encontrados
  inconsistencias: [InconsistencySchema], // Resultados no encontrados en Excel
  summary: {
    totalGroups: Number,
    totalSchedules: Number,
    fichesProcessed: Number,
    outcomesRated: Number,
    outcomesPending: Number,
    totalMissingLearners: Number,
    totalReportRows: Number,
    totalRowsEnFormacion: Number
  }
}, {
  timestamps: true,
  collection: 'dailyauditlogs'
});

export default mongoose.models.DailyAuditLog || mongoose.model('DailyAuditLog', DailyAuditLogSchema);