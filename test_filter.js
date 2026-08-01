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

const normalizeName = (name) => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

const isSameInstructor = (name1, name2) => {
  if (!name1 || !name2) return false;
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (n1 === n2) return true;
  
  const words1 = n1.split(/\s+/).filter(w => w.length > 2);
  const words2 = n2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const match1 = words1.every(w => words2.includes(w));
  const match2 = words2.every(w => words1.includes(w));
  
  const firstTwo1 = words1.slice(0, 2).join(' ');
  const firstTwo2 = words2.slice(0, 2).join(' ');
  const firstTwoMatch = firstTwo1 && firstTwo2 && firstTwo1 === firstTwo2;
  
  return match1 || match2 || firstTwoMatch;
};

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const plan = await Planning.findOne({ 'pedagogicalPlanning.fiche': '3190780' });
    const p = plan.pedagogicalPlanning;

    const currentUserName = "Deivi Santiago Contreras Bogoya";
    const currentUserId = "6a29cc54c8726b7495cc812d";
    const currentUserEmail = "deivi2023contreras@gmail.com";

    let isSuggested = false;
    p.content.forEach(phase => {
      phase.competencies.forEach(comp => {
        comp.learningOutcomes.forEach(rap => {
          rap.pedagogicalActivities.forEach(act => {
            const sugg = act.suggestedInstructor || act.instructors;
            if (sugg) {
              const suggId = sugg.id;
              const suggName = sugg.name || '';
              const isConfirmed = sugg.assignmentStatus === 'confirmed';
              
              const idMatches = (suggId && currentUserId && suggId === currentUserId);
              const nameMatches = isSameInstructor(suggName, currentUserName);
              
              if (suggName.includes("Deivi") || suggName.includes("Contreras")) {
                console.log(`\nEvaluating Activity under Comp ${comp.code}:`);
                console.log(`- suggName: "${suggName}" | currentUserName: "${currentUserName}"`);
                console.log(`- suggId: "${suggId}" | currentUserId: "${currentUserId}"`);
                console.log(`- isConfirmed (sugg.assignmentStatus === 'confirmed'): ${isConfirmed} (actual status: "${sugg.assignmentStatus}")`);
                console.log(`- idMatches: ${idMatches}`);
                console.log(`- nameMatches: ${nameMatches}`);
              }

              if (((suggId && currentUserId && suggId === currentUserId) || isSameInstructor(suggName, currentUserName)) && isConfirmed) {
                isSuggested = true;
              }
            }
          });
        });
      });
    });

    console.log(`\nFinal isSuggested for Deivi: ${isSuggested}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
