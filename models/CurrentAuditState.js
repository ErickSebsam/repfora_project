import mongoose from 'mongoose';

const { Schema } = mongoose;

// Aprendiz
const LearnerInfoSchema = new Schema({
  name: String,
  document: String
}, { _id: false });

// Resultado pendiente o vencido
const OutcomeStateSchema = new Schema({
  scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedules' },
  ficheNumber: String,
  ficheId: { type: Schema.Types.ObjectId, ref: 'Fiche' },
  outcomeText: String,
  fend: Date,

  missingLearners: [LearnerInfoSchema],
  totalLearners: Number,
  isTotalMissing: Boolean,

  daysOverdue: Number,
  missingCount: Number,

  instructorName: String,
  instructorEmail: String,

  ficheOwnerName: String,
  ficheOwnerEmail: String,

  isVencido: { type: Boolean, default: false }
}, { _id: false });

// Resumen de auditoría por ficha
const FicheSummarySchema = new Schema({
  ficheNumber: String,
  ficheId: { type: Schema.Types.ObjectId, ref: 'Fiche' },
  programName: String,
  coordinationId: { type: Schema.Types.ObjectId, ref: 'Coordination' },
  coordinationName: String,

  aprendicesActivos: { type: Number, default: 0 },
  rapsTotal: { type: Number, default: 0 },
  alDia: { type: Number, default: 0 },
  aunNoVence: { type: Number, default: 0 },
  sncParcial: { type: Number, default: 0 },
  sncCritico: { type: Number, default: 0 },
  sinProgramar: { type: Number, default: 0 },
  rapsConExclusiones: { type: Number, default: 0 },

  estadoGeneral: { type: String, enum: ['AL DÍA', 'SNC PARCIAL', 'SNC CRÍTICO'], default: 'AL DÍA' }
}, { _id: false });

// Una ejecución del cron
const AuditRunSchema = new Schema({
  executionDate: { type: Date, default: Date.now },
  fichesSummary: [FicheSummarySchema],
  pendientes: [OutcomeStateSchema],
  vencidos: [OutcomeStateSchema],
  estadisticas: {
    totalPendientes: { type: Number, default: 0 },
    totalVencidos: { type: Number, default: 0 },
    totalAprendicesSinNota: { type: Number, default: 0 }
  }
}, { _id: false });

// Estado de auditoría — guarda las últimas 2 ejecuciones
const CurrentAuditStateSchema = new Schema({
  runs: { type: [AuditRunSchema], default: [] },
  ultimaActualizacion: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'currentauditstate'
});

CurrentAuditStateSchema.index({}, { unique: true });

export default mongoose.models.CurrentAuditState || mongoose.model('CurrentAuditState', CurrentAuditStateSchema);
