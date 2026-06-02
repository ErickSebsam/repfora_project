import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  description: { type: String },
  hours: {
    direct: { type: Number, default: 0 },
    independent: { type: Number, default: 0 }
  },
  learningEvidences: [String],
  didacticStrategies: [String],
  environment: {
    type: { type: String },
    materials: [String]
  },
  observations: { type: String },
  suggestedInstructor: {
    id: { type: String },
    name: { type: String },
    type: { type: String },
    assignmentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending'
    }
  },
  scheduleDetails: {
    assignedDays: [String],
    shift: { type: String, enum: ['morning', 'afternoon', 'night', '', null] },
    hoursPerDay: { type: Number },
    calendarNotes: { type: String }
  }
}, { _id: false });

const rapSchema = new mongoose.Schema({
  description: { type: String, required: true },
  evaluationCriteria: [String],
  pedagogicalActivities: [activitySchema]
}, { _id: false });

const competenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  totalCompetenceHours: { type: Number, required: true },
  knowledge: {
    conceptsAndPrinciples: [String],
    processes: [String]
  },
  evaluationCriteria: [String], // CAMPO AÑADIDO PARA EL POOL GLOBAL
  learningOutcomes: [rapSchema]
}, { _id: false });

const phaseSchema = new mongoose.Schema({
  phase: {
    type: String,
    enum: ['INDUCCION', 'ANALYSIS', 'PLANNING', 'EXECUTION', 'EVALUATION', 'ETAPA_PRODUCTIVA'],
    required: true
  },
  projectActivity: { type: String },
  competencies: [competenceSchema]
}, { _id: false });

const planningSchema = new mongoose.Schema({
  pedagogicalPlanning: {
    metadata: {
      programName: { type: String, required: true },
      programCode: { type: String, required: true },
      version: { type: String },
      center: { type: String },
      totalHours: { type: Number },
      lectivaHours: { type: Number },
      productivaHours: { type: Number },
      lectivaStartDate: { type: Date },
      lectivaEndDate: { type: Date },
      teamPdfProcessed: { type: Boolean, default: false }
    },
    fiche: { type: String, required: true },
    leaderEmail: { type: String },
    startDate: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'approved', 'archived'],
      default: 'draft'
    },
    content: [phaseSchema],
    timestamps: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  }
});

// Middleware para actualizar updatedAt
planningSchema.pre('save', async function () {
  this.pedagogicalPlanning.timestamps.updatedAt = new Date();
});

const Planning = mongoose.model('Planning', planningSchema, 'pedagogicalPlanning');

export default Planning;
