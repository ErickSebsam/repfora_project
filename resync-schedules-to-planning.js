/**
 * resync-schedules-to-planning.js
 *
 * Vuelve a cruzar cada Planning YA GUARDADO en Mongo contra la colección
 * "schedules" (mismo criterio corregido de planning.controller.js: nombre de
 * competencia + texto del RAP, ya no el código exacto), y actualiza hours.direct
 * y scheduleDetails en cada actividad donde encuentre una programación real.
 *
 * No requiere volver a subir ningún PDF. Sobreescribe lo que ya hubiera en
 * hours/scheduleDetails si encuentra una programación (incluyendo datos
 * cargados a mano con el botón "Programar" de la app).
 *
 * Uso: node resync-schedules-to-planning.js
 */
import dotenv from 'dotenv';
dotenv.config();

import dbConnection from './database.js';
import Planning from './models/Planning.js';
import Fiche from './models/Fiche.js';
import Schedule from './models/Schedule.js';
import './models/Competence.js';
import './models/Outcome.js';
import './models/Instructor.js';
import {
  cleanTextForComparison,
  getSimilarity,
  getShiftFromTime,
  formatDateToYYYYMMDD,
  formatDateDMY,
} from './controller/planning.controller.js';

async function main() {
  await dbConnection();

  const plannings = await Planning.find({});
  console.log(`[RESYNC] ${plannings.length} planning(s) encontrados.`);

  let fichasSinSchedules = 0;
  let fichasSinFiche = 0;
  let actividadesActualizadas = 0;

  for (const planningDoc of plannings) {
    const ficheNumber = planningDoc.pedagogicalPlanning?.fiche;
    if (!ficheNumber) continue;

    const dbFiche = await Fiche.findOne({ number: ficheNumber.toString() }).lean();
    if (!dbFiche) {
      fichasSinFiche++;
      continue;
    }

    const schedulesFound = await Schedule.find({ fiche: dbFiche._id })
      .populate('competence')
      .populate('outcome')
      .populate('instructor')
      .lean();

    if (!schedulesFound || schedulesFound.length === 0) {
      fichasSinSchedules++;
      continue;
    }

    let seActualizoAlgo = false;

    (planningDoc.pedagogicalPlanning?.content || []).forEach(phase => {
      (phase.competencies || []).forEach(comp => {
        (comp.learningOutcomes || []).forEach(rap => {
          const matchedSchedules = schedulesFound.filter(sched => {
            if (!sched.competence || !sched.outcome) return false;

            const compNameDb = cleanTextForComparison(sched.competence.name);
            const compNamePdf = cleanTextForComparison(comp.name);

            const compCoincide =
              compNameDb === compNamePdf ||
              compNameDb.includes(compNamePdf) ||
              compNamePdf.includes(compNameDb) ||
              getSimilarity(compNameDb, compNamePdf) >= 0.85;

            if (!compCoincide) return false;

            const outcomeTextDb = cleanTextForComparison(sched.outcome.outcomes);
            const outcomeTextPdf = cleanTextForComparison(rap.description);

            if (outcomeTextDb === outcomeTextPdf) return true;
            if (outcomeTextDb.includes(outcomeTextPdf) || outcomeTextPdf.includes(outcomeTextDb)) return true;

            return getSimilarity(outcomeTextDb, outcomeTextPdf) >= 0.85;
          });

          if (matchedSchedules.length > 0 && rap.pedagogicalActivities) {
            matchedSchedules.forEach((matchedSchedule, schedIdx) => {
              const targetAct = rap.pedagogicalActivities[schedIdx];
              if (!targetAct) return;

              const assignedDays = (matchedSchedule.events || [])
                .map(evt => formatDateToYYYYMMDD(evt))
                .filter(Boolean);

              targetAct.isScheduledInCalendar = true;

              if (matchedSchedule.instructor) {
                targetAct.suggestedInstructor = {
                  id: matchedSchedule.instructor._id.toString(),
                  name: matchedSchedule.instructor.name,
                  type: matchedSchedule.instructor.bindingtype || '',
                  assignmentStatus: 'confirmed',
                };
              }

              const startDateStr = formatDateDMY(matchedSchedule.fstart);
              const endDateStr = formatDateDMY(matchedSchedule.fend);

              targetAct.hours = {
                direct: matchedSchedule.hourswork || 0,
                independent: targetAct.hours?.independent || 0,
              };

              targetAct.scheduleDetails = {
                assignedDays,
                shift: matchedSchedule.tstart ? getShiftFromTime(matchedSchedule.tstart) : null,
                tstart: matchedSchedule.tstart || null,
                tend: matchedSchedule.tend || null,
                hoursPerDay: matchedSchedule.hourswork || 0,
                calendarNotes: `Programado del ${startDateStr} al ${endDateStr}`,
                isPublished: true,
              };

              seActualizoAlgo = true;
              actividadesActualizadas++;
            });
          }
        });
      });
    });

    if (seActualizoAlgo) {
      planningDoc.markModified('pedagogicalPlanning.content');
      await planningDoc.save();
      console.log(`[RESYNC] Ficha ${ficheNumber}: actualizada.`);
    }
  }

  console.log('\n[RESYNC] Resumen:');
  console.log(`  Actividades actualizadas: ${actividadesActualizadas}`);
  console.log(`  Fichas sin documento Fiche encontrado: ${fichasSinFiche}`);
  console.log(`  Fichas sin schedules en BD: ${fichasSinSchedules}`);

  process.exit(0);
}

main().catch((error) => {
  console.error('[RESYNC] Error:', error);
  process.exit(1);
});