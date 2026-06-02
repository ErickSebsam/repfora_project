import mongoose from 'mongoose';

const { Schema } = mongoose;

const learnerSchema = new Schema(
  {
    documentNumber: { type: String },
    document: { type: String },
    identificacion: { type: String },
    ficheNumber: { type: String },
    fullName: { type: String }
  },
  {
    collection: 'learners',
    timestamps: false,
    strict: false
  }
);

const Learner = mongoose.models.Learner || mongoose.model('Learner', learnerSchema);

export default Learner;