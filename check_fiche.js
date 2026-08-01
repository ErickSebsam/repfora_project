import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URL;

const activitySchema = new mongoose.Schema({
  description: { type: String },
  suggestedInstructor: mongoose.Schema.Types.Mixed,
  instructors: mongoose.Schema.Types.Mixed
}, { _id: false });

const rapSchema = new mongoose.Schema({
  description: { type: String },
  pedagogicalActivities: [activitySchema]
}, { _id: false });

const competenceSchema = new mongoose.Schema({
  name: { type: String },
  code: { type: String },
  learningOutcomes: [rapSchema]
}, { _id: false });

const phaseSchema = new mongoose.Schema({
  phase: { type: String },
  competencies: [competenceSchema]
}, { _id: false });

const planningSchema = new mongoose.Schema({
  pedagogicalPlanning: {
    fiche: { type: String },
    status: { type: String },
    content: [phaseSchema]
  }
});
const Planning = mongoose.model('Planning', planningSchema, 'pedagogicalPlanning');

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const plan = await Planning.findOne({ 'pedagogicalPlanning.fiche': '3190780' });
    if (plan) {
      console.log("Found planning:", JSON.stringify(plan, null, 2));
    } else {
      console.log("Planning not found");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
