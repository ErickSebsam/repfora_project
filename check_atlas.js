import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URL;

const instructorSchema = new mongoose.Schema({
  name: String,
  email: String,
  numdocument: String,
  emailpersonal: String
});
const Instructor = mongoose.model('Instructor', instructorSchema, 'instructors');

const activitySchema = new mongoose.Schema({
  description: { type: String },
  suggestedInstructor: {
    id: { type: String },
    name: { type: String },
    type: { type: String },
    assignmentStatus: { type: String }
  }
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
    console.log("Connecting to Atlas MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // Find instructor by document
    const inst = await Instructor.findOne({ numdocument: "1022351655" });
    if (inst) {
      console.log("\n=== FOUND INSTRUCTOR IN ATLAS ===");
      console.log(`- ID: ${inst._id}`);
      console.log(`- Name: "${inst.name}"`);
      console.log(`- Doc: "${inst.numdocument}"`);
      console.log(`- Email: "${inst.email}"`);
    } else {
      console.log("\nInstructor 1022351655 NOT found in Atlas!");
    }

    // List all planning assignments for "Deivi"
    const plannings = await Planning.find();
    console.log(`\n=== SEARCHING PLANNINGS IN ATLAS (${plannings.length} documents) ===`);
    let found = 0;
    plannings.forEach(p => {
      p.pedagogicalPlanning?.content?.forEach(ph => {
        ph.competencies?.forEach(comp => {
          comp.learningOutcomes?.forEach(rap => {
            rap.pedagogicalActivities?.forEach(act => {
              if (act.suggestedInstructor?.name) {
                const name = act.suggestedInstructor.name.toLowerCase();
                if (name.includes('deivi') || name.includes('santiago') || name.includes('contreras')) {
                  console.log(`- Fiche: ${p.pedagogicalPlanning.fiche} | Comp: ${comp.code} | Status: ${p.pedagogicalPlanning.status}`);
                  console.log(`  Instructor in Planning: "${act.suggestedInstructor.name}" (ID: ${act.suggestedInstructor.id}, Status: ${act.suggestedInstructor.assignmentStatus})`);
                  found++;
                }
              }
            });
          });
        });
      });
    });
    console.log(`Found ${found} matches.`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
