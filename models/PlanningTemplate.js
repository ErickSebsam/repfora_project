import mongoose from 'mongoose';

const activityTemplateSchema = new mongoose.Schema({
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

const rapTemplateSchema = new mongoose.Schema({
  description: { type: String, required: true },
  evaluationCriteria: [String],
  pedagogicalActivities: [activityTemplateSchema]
}, { _id: false });

const competenceTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  totalCompetenceHours: { type: Number, required: true },
  knowledge: {
    conceptsAndPrinciples: [String],
    processes: [String]
  },
  learningOutcomes: [rapTemplateSchema]
}, { _id: false });

const phaseTemplateSchema = new mongoose.Schema({
  phase: {
    type: String,
    enum: ['INDUCCION', 'ANALYSIS', 'PLANNING', 'EXECUTION', 'EVALUATION', 'ETAPA_PRODUCTIVA'],
    required: true
  },
  projectActivity: { type: String },
  competencies: [competenceTemplateSchema]
}, { _id: false });

const planningTemplateSchema = new mongoose.Schema({
  programCode: { type: String, required: true, unique: true },
  programName: { type: String, required: true },
  content: [phaseTemplateSchema],
  savedBy: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const PlanningTemplate = mongoose.model('PlanningTemplate', planningTemplateSchema, 'planningTemplates');

export default PlanningTemplate;
