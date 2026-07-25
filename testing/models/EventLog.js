import mongoose from 'mongoose';

const EventLogSchema = new mongoose.Schema({
  jobName: { type: String, required: true, index: true },
  status: { type: String, enum: ['STARTED', 'COMPLETED', 'FAILED'], required: true },
  message: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  executedAt: { type: Date, default: Date.now },
  executionTimeMs: { type: Number },
});

export default mongoose.model('EventLog', EventLogSchema);