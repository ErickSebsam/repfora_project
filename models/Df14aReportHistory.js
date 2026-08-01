import mongoose from 'mongoose';

const { Schema } = mongoose;

const Df14aItemSchema = new Schema({
  fichaNumber: { type: String, required: true },
  courseName: { type: String },
  instructorName: { type: String },
  instructorEmail: { type: String },
  pendientes: { type: Number, default: 0 } // enTransito for routes or enFormacion for judgments
}, { _id: false });

const Df14aReportHistorySchema = new Schema({
  executionDate: { type: Date, default: Date.now, index: true },
  type: { 
    type: String, 
    enum: ['cron_scraper', 'manual_scraper', 'manual_upload'], 
    required: true 
  },
  triggeredBy: { type: String }, // User email or 'System (Cron)'

  // Statistics/Summary
  totalProcessed: { type: Number, default: 0 },
  fichesEvaluated: { type: Number, default: 0 }, // For manual upload marking schedules as calificado
  fichesNotFound: { type: Number, default: 0 },  // Not matching requests
  totalSinRuta: { type: Number, default: 0 },
  totalSinJuicios: { type: Number, default: 0 },

  // Detailed lists
  sinRuta: [Df14aItemSchema],
  sinJuicios: [Df14aItemSchema],

  // Fiches not found in DB but present in the report
  fichasNoEncontradas: [{
    fichaNumber: String,
    enTransito: Number,
    enFormacion: Number
  }],

  // Notification stats
  notificacionRutas: {
    enviados: { type: Number, default: 0 },
    fallidos: { type: Number, default: 0 },
    noEncontrados: { type: Number, default: 0 }
  },
  notificacionJuicios: {
    enviados: { type: Number, default: 0 },
    fallidos: { type: Number, default: 0 },
    noEncontrados: { type: Number, default: 0 }
  },
  summary: { type: String }
}, {
  timestamps: true,
  collection: 'df14areporthistories'
});

export default mongoose.models.Df14aReportHistory || mongoose.model('Df14aReportHistory', Df14aReportHistorySchema);
