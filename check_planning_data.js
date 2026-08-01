import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Planning from "./models/Planning.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB.");

    const plannings = await Planning.find();
    console.log(`Found ${plannings.length} plannings in database.\n`);

    plannings.forEach(p => {
      const pp = p.pedagogicalPlanning;
      if (!pp) {
        console.log(`Planning ID ${p._id} has no pedagogicalPlanning field!`);
        return;
      }

      console.log(`Checking Planning for Fiche: ${pp.fiche}`);
      console.log(`  Status: ${pp.status}`);
      console.log(`  LeaderEmail: ${pp.leaderEmail}`);
      
      if (!pp.content) {
        console.log(`  [WARNING] pp.content is undefined/null!`);
        return;
      }

      console.log(`  Phases: ${pp.content.length}`);
      pp.content.forEach((phase, phaseIdx) => {
        console.log(`    Phase ${phaseIdx + 1}: ${phase.phase}`);
        
        if (!phase.competencies) {
          console.log(`      [WARNING] phase.competencies is undefined/null!`);
          return;
        }

        console.log(`      Competencies: ${phase.competencies.length}`);
        phase.competencies.forEach((comp, compIdx) => {
          console.log(`        Comp ${compIdx + 1}: ${comp.code} - ${comp.name}`);
          
          if (!comp.learningOutcomes) {
            console.log(`          [WARNING] comp.learningOutcomes is undefined/null!`);
            return;
          }

          console.log(`          LearningOutcomes (RAPs): ${comp.learningOutcomes.length}`);
          comp.learningOutcomes.forEach((outcome, outcomeIdx) => {
            console.log(`            Outcome ${outcomeIdx + 1}: ${outcome.description.substring(0, 40)}...`);
            
            if (!outcome.pedagogicalActivities) {
              console.log(`              [CRITICAL] outcome.pedagogicalActivities is undefined/null!`);
            } else {
              console.log(`              PedagogicalActivities: ${outcome.pedagogicalActivities.length}`);
            }
          });
        });
      });
    });

  } catch (error) {
    console.error("Error in script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
