import mongoose from 'mongoose';
import Planning from '../models/Planning.js';
import Fiche from '../models/Fiche.js';
import Program from '../models/Program.js';
import Competence from '../models/Competence.js';
import Outcome from '../models/Outcome.js';
import Schedule from '../models/Schedule.js';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sendEmail from '../utils/emails/sendEmail.js';
import Instructor from '../models/Instructor.js';
import PlanningTemplate from '../models/PlanningTemplate.js';
import webToken from '../middlewares/webToken.js';
import Notification from '../models/Notification.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeName = (name) => {
  return (name || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

export const cleanTextForComparison = (str) => {
  if (!str) return "";
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]/g, "");
};

export const getSimilarity = (s1, s2) => {
  const a = cleanTextForComparison(s1);
  const b = cleanTextForComparison(s2);

  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.95;

  const bigramsA = new Set();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substring(i, i + 2));

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    if (bigramsA.has(bigram)) intersection++;
  }

  const totalBigrams = (a.length - 1) + (b.length - 1);
  return totalBigrams > 0 ? (2 * intersection) / totalBigrams : 0;
};

export const getShiftFromTime = (tstart) => {
  if (!tstart) return null;
  const hour = parseInt(tstart.split(":")[0], 10);
  if (isNaN(hour)) return null;
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 || hour < 6) return 'night';
  return null;
};

export const formatDateToYYYYMMDD = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateDMY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const isSameInstructorName = (name1, name2) => {
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

const mergePlannings = (dbContent, incomingContent) => {
  if (!dbContent || !Array.isArray(dbContent)) return incomingContent;
  if (!incomingContent || !Array.isArray(incomingContent)) return dbContent;

  const mergedContent = JSON.parse(JSON.stringify(incomingContent));

  mergedContent.forEach(incomingPhase => {
    const dbPhase = dbContent.find(p => p.phase === incomingPhase.phase);
    if (!dbPhase) return;

    incomingPhase.competencies.forEach(incomingComp => {
      const dbComp = dbPhase.competencies?.find(c => c.code === incomingComp.code);
      if (!dbComp) return;

      incomingComp.learningOutcomes.forEach(incomingRap => {
        const dbRap = dbComp.learningOutcomes?.find(
          r => r.description.trim().toUpperCase() === incomingRap.description.trim().toUpperCase()
        );
        if (!dbRap) return;

        incomingRap.pedagogicalActivities.forEach((incomingAct, idx) => {
          const dbAct = dbRap.pedagogicalActivities[idx] || 
                        dbRap.pedagogicalActivities.find(a => (a.description || '').trim() === (incomingAct.description || '').trim());
          
          if (dbAct) {
            if (dbAct.suggestedInstructor && dbAct.suggestedInstructor.id) {
              incomingAct.suggestedInstructor = dbAct.suggestedInstructor;
            }
            if (dbAct.instructors) {
              incomingAct.instructors = dbAct.instructors;
            }
            if (dbAct.hours) {
              incomingAct.hours = dbAct.hours;
            }
            if (dbAct.isScheduledInCalendar !== undefined) {
              incomingAct.isScheduledInCalendar = dbAct.isScheduledInCalendar;
            }
            if (dbAct.scheduleDetails) {
              incomingAct.scheduleDetails = dbAct.scheduleDetails;
            }
            if (dbAct.environment) {
              incomingAct.environment = dbAct.environment;
            }
            if (dbAct.didacticStrategies && dbAct.didacticStrategies.length > 0) {
              incomingAct.didacticStrategies = dbAct.didacticStrategies;
            }
            if (dbAct.learningEvidences && dbAct.learningEvidences.length > 0) {
              incomingAct.learningEvidences = dbAct.learningEvidences;
            }
          }
        });
      });
    });
  });

  return mergedContent;
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const uploadPlanning = async (req, res) => {
  try {
    const { fiche, pedagogicalPlanning } = req.body;
    const targetFiche = fiche || pedagogicalPlanning?.fiche;

    if (!targetFiche) {
      return res.status(400).json({ message: 'Falta el número de ficha' });
    }

    // Detect newly confirmed activities (with all details) instead of just instructor names
    const getConfirmedActivities = (content) => {
      const confirmed = new Map();
      if (!content) return confirmed;
      content.forEach(phase => {
        if (phase.competencies) {
          phase.competencies.forEach(comp => {
            if (comp.learningOutcomes) {
              comp.learningOutcomes.forEach(rap => {
                if (rap.pedagogicalActivities) {
                  rap.pedagogicalActivities.forEach(act => {
                    const sugg = act.suggestedInstructor || act.instructors;
                    if (sugg && sugg.name && sugg.assignmentStatus === 'confirmed') {
                      // Crear una clave única que represente a esta actividad asignada y confirmada
                      const key = `${comp.code}||${rap.description}||${act.description || act.observations || ''}`.trim().toUpperCase();
                      confirmed.set(key, {
                        instructorName: sugg.name.trim().toUpperCase(),
                        phase: phase.phase,
                        competenceCode: comp.code,
                        competenceName: comp.name,
                        rapDescription: rap.description,
                        activityDescription: act.description || act.observations || 'Sin descripción',
                        hoursDirect: act.hours?.direct || 0,
                        hoursIndependent: act.hours?.independent || 0
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
      return confirmed;
    };

    const token = req.headers.token || req.headers.authorization;
    let decoded = null;
    let isInstructor = false;
    let instructorName = "";

    if (token) {
      try {
        decoded = await webToken.decodeAnyToken(token);
        if (decoded && (decoded.rol === "INSTRUCTOR" || decoded.isInstructor)) {
          isInstructor = true;
          const inst = await Instructor.findById(decoded.id);
          if (inst) {
            instructorName = inst.name;
          }
        }
      } catch (err) {
        console.error('Error decoding token in uploadPlanning:', err.message);
      }
    }

    const existingPlanning = await Planning.findOne({ 'pedagogicalPlanning.fiche': targetFiche });
    const oldConfirmedActs = existingPlanning ? getConfirmedActivities(existingPlanning.pedagogicalPlanning?.content) : new Map();
    const newConfirmedActs = getConfirmedActivities(pedagogicalPlanning.content);

    const newlyConfirmedActs = [];
    for (const [key, actData] of newConfirmedActs.entries()) {
      if (!oldConfirmedActs.has(key)) {
        newlyConfirmedActs.push(actData);
      }
    }

    if (!pedagogicalPlanning.timestamps) {
      pedagogicalPlanning.timestamps = {};
    }

    const planningLeaderEmail = (existingPlanning?.pedagogicalPlanning?.leaderEmail || '').trim().toLowerCase();
    const instructorEmail = (decoded?.email || '').trim().toLowerCase();
    const userRole = (decoded?.rol || '').toUpperCase();
    const isAdminOrProgrammer = ['PROGRAMADOR', 'COORDINADOR', 'ADMIN'].includes(userRole);
    const isLeaderOfThisFiche = isAdminOrProgrammer || !!(planningLeaderEmail && instructorEmail && planningLeaderEmail === instructorEmail);

    console.log('--- UPLOAD PLANNING DEBUG ---');
    console.log('Logged user email:', instructorEmail);
    console.log('Logged user role:', userRole);
    console.log('Logged instructor name:', instructorName);
    console.log('Is Leader of this Fiche:', isLeaderOfThisFiche);
    console.log('Is Instructor flag:', isInstructor);

    let planning;
    if (existingPlanning && isInstructor && instructorName && !isLeaderOfThisFiche) {
      console.log('=> ENTERING SAFE MERGE FOR INSTRUCTORS');
      // Realizar la fusión segura (safe merge) para instructores
      if (pedagogicalPlanning.content && Array.isArray(pedagogicalPlanning.content)) {
        existingPlanning.pedagogicalPlanning.content.forEach(existingPhase => {
          const incomingPhase = pedagogicalPlanning.content.find(p => p.phase === existingPhase.phase);
          if (!incomingPhase) return;

          existingPhase.competencies.forEach(existingComp => {
            const incomingComp = incomingPhase.competencies.find(c => c.code === existingComp.code);
            if (!incomingComp) return;

            existingComp.learningOutcomes.forEach(existingRap => {
              const incomingRap = incomingComp.learningOutcomes.find(
                r => r.description.trim().toUpperCase() === existingRap.description.trim().toUpperCase()
              );
              if (!incomingRap) return;

              existingRap.pedagogicalActivities.forEach((existingAct, idx) => {
                const sugg = existingAct.suggestedInstructor || existingAct.instructors;
                const isAssigned = sugg && sugg.name && isSameInstructorName(sugg.name, instructorName);

                if (isAssigned) {
                  const existingDesc = (existingAct.description || existingAct.observations || '').trim().toUpperCase();
                  // Reemplazar búsqueda por descripción con búsqueda por índice para evitar que se pierdan los cambios del instructor
                  const incomingAct = incomingRap.pedagogicalActivities[idx];

                  if (incomingAct) {
                    console.log('>>> EXISTING ACT:', existingAct.description);
                    console.log('>>> INCOMING ACT:', incomingAct.description);

                    if (incomingAct.hours !== undefined) {
                      existingAct.hours = incomingAct.hours;
                    }

                    if (incomingAct.description !== undefined) {
                      existingAct.description = incomingAct.description;
                    }

                    existingAct.didacticStrategies = incomingAct.didacticStrategies || [];
                    existingAct.learningEvidences = incomingAct.learningEvidences || [];
                    existingAct.environment = {
                      type: incomingAct.environment?.type || '',
                      materials: incomingAct.environment?.materials || []
                    };
                    if (incomingAct.observations !== undefined) {
                      existingAct.observations = incomingAct.observations;
                    }
                    // TAREA 3: Persistir datos del calendario del instructor en el safe merge
                    if (incomingAct.scheduleDetails !== undefined) {
                      existingAct.scheduleDetails = incomingAct.scheduleDetails;
                    }
                    if (incomingAct.isScheduledInCalendar !== undefined) {
                      existingAct.isScheduledInCalendar = incomingAct.isScheduledInCalendar;
                    }
                  }
                }
              });
            });
          });
        });
      }

      existingPlanning.pedagogicalPlanning.timestamps.updatedAt = new Date();
      existingPlanning.markModified('pedagogicalPlanning.content');
      await existingPlanning.save();
      planning = existingPlanning;

      // Notificar a todos los programadores y administradores en el sistema (solo en base de datos)
      try {
        const User = mongoose.model('User');
        const programmersAndAdmins = await User.find({ role: { $in: ['PROGRAMADOR', 'ADMIN', 'COORDINADOR'] } });

        for (const user of programmersAndAdmins) {
          if (user.email) {
            const notifProgramador = new Notification({
              sender: instructorName || 'Instructor',
              subject: `El instructor ${instructorName} actualizó su planeación pedagógica de la Ficha ${targetFiche}`,
              fiche: targetFiche,
              recipient: user.email.trim().toLowerCase(),
              read: false
            });
            await notifProgramador.save();
          }
        }
        console.log(`[NOTIFICACIÓN] Creadas notificaciones en BD para ${programmersAndAdmins.length} administradores/programadores.`);
      } catch (notifErr) {
        console.error('[NOTIFICACIÓN ERROR] Error creando notificaciones para el equipo de programación:', notifErr.message);
      }
    } else {
      // Si la planeación ya existe, hacemos un merge inteligente para no borrar asignaciones previas
      if (existingPlanning && existingPlanning.pedagogicalPlanning?.content) {
        pedagogicalPlanning.content = mergePlannings(
          existingPlanning.pedagogicalPlanning.content,
          pedagogicalPlanning.content
        );
        // Preservar metadatos y leaderEmail previos si no vienen en la petición
        if (!pedagogicalPlanning.leaderEmail && existingPlanning.pedagogicalPlanning.leaderEmail) {
          pedagogicalPlanning.leaderEmail = existingPlanning.pedagogicalPlanning.leaderEmail;
        }
      }

      pedagogicalPlanning.timestamps.updatedAt = new Date();
      planning = await Planning.findOneAndUpdate(
        { 'pedagogicalPlanning.fiche': targetFiche },
        { $set: { pedagogicalPlanning } },
        { upsert: true, new: true }
      );
    }


    // (Solo si no es el propio instructor el que guarda para evitar spam de correos)
    if (newlyConfirmedActs.length > 0 && !isInstructor) {
      const programName = pedagogicalPlanning.metadata?.programName || 'Programa de Formación';

      // Agrupar actividades por nombre de instructor
      const actsByInstructor = new Map();
      newlyConfirmedActs.forEach(act => {
        const instName = act.instructorName;
        if (!actsByInstructor.has(instName)) {
          actsByInstructor.set(instName, []);
        }
        actsByInstructor.get(instName).push(act);
      });

      (async () => {
        for (const [instName, acts] of actsByInstructor.entries()) {
          try {
            // TAREA 2: Búsqueda tolerante a tildes y capitalización
            // 1) Intento exacto (case-insensitive)
            let inst = await Instructor.findOne({ name: new RegExp(`^${instName}$`, 'i') });
            // 2) Fallback: busca por la primera palabra significativa y verifica con isSameInstructorName
            if (!inst) {
              const normalizedWords = normalizeName(instName).split(/\s+/).filter(w => w.length > 2);
              if (normalizedWords.length > 0) {
                const candidates = await Instructor.find({ name: new RegExp(normalizedWords[0], 'i') });
                inst = candidates.find(c => isSameInstructorName(c.name, instName)) || null;
              }
            }
            if (inst) {
              const emails = [inst.email, inst.emailpersonal].filter(Boolean);

              if (emails.length > 0) {
                console.log(`[EMAIL] Notificando al instructor: ${inst.name} (${emails.join(', ')}) para ficha ${targetFiche} con ${acts.length} actividades.`);

                // Guardar también una notificación en la base de datos para que sea visible en el sistema (por ej. en el panel de notificaciones)
                try {
                  const dbNotif = new Notification({
                    sender: "Coordinación / Planeación",
                    subject: `Nueva planeación pedagógica asignada y confirmada para la Ficha ${targetFiche}`,
                    fiche: targetFiche,
                    recipient: inst.email || null,
                    read: false
                  });
                  await dbNotif.save();
                  console.log(`[NOTIFICACIÓN] Notificación de BD creada para el instructor ${inst.name} en ficha ${targetFiche}`);
                } catch (notifErr) {
                  console.error(`[NOTIFICACIÓN ERROR] Error guardando notificación en BD:`, notifErr.message);
                }

                for (const email of emails) {
                  try {
                    await sendEmail(
                      process.env.FROM_EMAIL,
                      process.env.SECURY_EMAIL,
                      [email],
                      `Nueva Actividad Asignada y Confirmada - Ficha ${targetFiche}`,
                      {
                        name: inst.name,
                        fiche: targetFiche,
                        programName: programName,
                        url: `${process.env.URL_FRONTEND}/`,
                        activities: acts
                      },
                      "./template/planningNotification.hbs"
                    );
                  } catch (err) {
                    console.error(`[EMAIL ERROR] Error enviando a ${email}:`, err.message);
                  }
                }
              } else {
                console.log(`[EMAIL] No se encontraron correos para el instructor: ${instName}`);
              }
            } else {
              console.log(`[EMAIL] No se encontró el instructor para: ${instName}`);
            }
          } catch (emailError) {
            console.error(`[EMAIL ERROR] Error en proceso de notificación para ${instName}:`, emailError.message);
          }
        }
      })();
    }

    res.json({ message: 'Planeación guardada con éxito', data: planning });
  } catch (error) {
    console.error('[UPLOAD ERROR DETAILED]:', error);
    res.status(500).json({ message: 'Error al guardar planeación', error: error.message });
  }
};

export const getPlanningByFiche = async (req, res) => {
  try {
    const { fiche } = req.params;
    const planning = await Planning.findOne({ 'pedagogicalPlanning.fiche': fiche });
    if (!planning) return res.status(404).json({ message: 'No se encontró la planeación' });

    // Restricciones de seguridad por rol de instructor
    const token = req.headers.token || req.headers.authorization;
    let decoded = null;
    let isInstructor = false;
    let instructorName = "";

    if (token) {
      try {
        decoded = await webToken.decodeAnyToken(token);
        if (decoded && (decoded.rol === "INSTRUCTOR" || decoded.isInstructor)) {
          isInstructor = true;
          const inst = await Instructor.findById(decoded.id);
          if (inst) {
            instructorName = inst.name;
          }
        }
      } catch (err) {
        console.error('Error decoding token in getPlanningByFiche:', err.message);
      }
    }

    if (isInstructor && decoded) {
      const emailLower = (decoded.email || "").trim().toLowerCase();
      const leaderEmail = (planning.pedagogicalPlanning?.leaderEmail || "").trim().toLowerCase();
      // Si el instructor es el líder de esta planeación, le devolvemos todo el documento.
      if (leaderEmail && emailLower === leaderEmail) {
        return res.json(planning);
      }

      // Si no es el líder, filtramos el contenido de la planeación
      // para dejar únicamente las competencias, RAPs y actividades que tiene asignadas y confirmadas.
      if (planning.pedagogicalPlanning && planning.pedagogicalPlanning.content) {
        // Convertir el planning a un objeto JS plano para poder modificarlo libremente
        const planningObj = planning.toObject();

        planningObj.pedagogicalPlanning.content = planningObj.pedagogicalPlanning.content.map(phase => {
          if (!phase.competencies) return phase;

          phase.competencies = phase.competencies.map(comp => {
            if (!comp.learningOutcomes) return comp;

            comp.learningOutcomes = comp.learningOutcomes.map(rap => {
              if (!rap.pedagogicalActivities) return rap;

              // Filtrar actividades pedagógicas asignadas y confirmadas para este instructor
              rap.pedagogicalActivities = rap.pedagogicalActivities.filter(act => {
                const sugg = act.suggestedInstructor || act.instructors;
                const isAssigned = sugg && sugg.name && isSameInstructorName(sugg.name, instructorName);
                const isConfirmed = sugg && sugg.assignmentStatus === 'confirmed';
                return isAssigned && isConfirmed;
              });

              return rap;
            }).filter(rap => rap.pedagogicalActivities.length > 0);

            return comp;
          }).filter(comp => comp.learningOutcomes.length > 0);

          return phase;
        }).filter(phase => phase.competencies && phase.competencies.length > 0);

        return res.json(planningObj);
      }
    }

    res.json(planning);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
};

export const extractFromPDFs = async (req, res) => {
  try {
    const { fiche, leaderEmail } = req.body;
    if (!req.files || !req.files.programPdf || !req.files.projectPdf) {
      return res.status(400).json({ message: 'Faltan archivos esenciales (Programa y Proyecto)' });
    }

    const programPath = path.resolve(req.files.programPdf.tempFilePath);
    const projectPath = path.resolve(req.files.projectPdf.tempFilePath);
    const teamPath = req.files.teamPdf ? path.resolve(req.files.teamPdf.tempFilePath) : null;
    const scriptsDir = path.resolve(__dirname, '../scripts');
    const extractorPath = path.join(scriptsDir, 'extractor.py');

    console.log(`[EXTRACT] Iniciando para ficha ${fiche}. Equipo Ejecutor: ${teamPath ? 'SÍ' : 'NO'}`);

    // Construir comando dinámico
    const pyCmd = process.platform === 'win32' ? 'py' : 'python3';
    let command = teamPath
      ? `${pyCmd} "${extractorPath}" "${programPath}" "${projectPath}" "${teamPath}" "${fiche}"`
      : `${pyCmd} "${extractorPath}" "${programPath}" "${projectPath}" "${fiche}"`;

    exec(command, { timeout: 120000 }, async (error, stdout, stderr) => {
      const cleanup = () => {
        try {
          if (fs.existsSync(programPath)) fs.unlinkSync(programPath);
          if (fs.existsSync(projectPath)) fs.unlinkSync(projectPath);
          if (teamPath && fs.existsSync(teamPath)) fs.unlinkSync(teamPath);
          console.log('[CLEANUP] Archivos temporales eliminados');
        } catch (e) { console.error('Error cleanup:', e.message); }
      };

      if (error) {
        cleanup();
        console.error('[ERROR] Extractor:', stderr || error.message);
        return res.status(500).json({ message: 'Error en la extracción', error: stderr || error.message });
      }

      // CAPTURAR JSON DESDE STDOUT (Sincrónico y Seguro)
      let planningData = null;
      const jsonMatch = stdout.match(/---JSON_START---([\s\S]*?)---JSON_END---/);
      if (jsonMatch) {
        try {
          planningData = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.error('[ERROR] Falló el parseo del JSON extraído:', e.message);
        }
      }

      if (!planningData) {
        cleanup();
        return res.status(500).json({ message: 'No se extrajeron datos válidos del PDF', stdout });
      }

      // GUARDAR O ACTUALIZAR EN BASE DE DATOS
      const finalFiche = planningData.pedagogicalPlanning.fiche || fiche;
      try {
        if (leaderEmail) {
          planningData.pedagogicalPlanning.leaderEmail = leaderEmail.trim().toLowerCase();
        }

        // Asegurar nombres de competencias para evitar errores en UI
        if (planningData.pedagogicalPlanning.content) {
          planningData.pedagogicalPlanning.content.forEach(phase => {
            if (phase.competencies) {
              phase.competencies.forEach(comp => {
                if (!comp.name) comp.name = `COMPETENCIA ${comp.code || 'SIN CODIGO'}`;
              });
            }
          });
        }

        // Revisar en base de datos si los resultados ya están programados
        const dbFiche = await Fiche.findOne({ number: finalFiche.toString() });
        if (dbFiche) {
          // Copiar fechas de inicio/fin de la ficha si están en blanco en el planning extraído
          if (planningData.pedagogicalPlanning) {
            if (!planningData.pedagogicalPlanning.startDate && dbFiche.fstart) {
              planningData.pedagogicalPlanning.startDate = dbFiche.fstart;
            }
            if (planningData.pedagogicalPlanning.metadata) {
              if (!planningData.pedagogicalPlanning.metadata.lectivaStartDate && dbFiche.fstart) {
                planningData.pedagogicalPlanning.metadata.lectivaStartDate = dbFiche.fstart;
              }
              if (!planningData.pedagogicalPlanning.metadata.lectivaEndDate && dbFiche.fend) {
                planningData.pedagogicalPlanning.metadata.lectivaEndDate = dbFiche.fend;
              }
            }
          }

          const schedulesFound = await Schedule.find({ fiche: dbFiche._id })
            .populate("competence")
            .populate("outcome")
            .populate("instructor")
            .lean();

          if (schedulesFound && schedulesFound.length > 0) {
            console.log(`[EXTRACT] Encontradas ${schedulesFound.length} programaciones en Repfora para la ficha ${finalFiche}`);
            if (planningData.pedagogicalPlanning.content) {
              planningData.pedagogicalPlanning.content.forEach(phase => {
                if (phase.competencies) {
                  phase.competencies.forEach(comp => {
                    if (comp.learningOutcomes) {
                      comp.learningOutcomes.forEach(rap => {
                        // Buscar si existe una programación en DB para esta competencia y resultado
                        const matchedSchedules = schedulesFound.filter(sched => {
                          if (!sched.competence || !sched.outcome) return false;

                          // NOTA: competence.number en la BD es un número interno asignado al
                          // cargar el Excel de competencias (uploadfiles.controller.js), no el
                          // código oficial SENA de 9 dígitos que trae el PDF (comp.code). Nunca
                          // van a coincidir entre sí, así que no se usan para filtrar. En su
                          // lugar se compara el NOMBRE de la competencia con el mismo criterio
                          // de similitud que ya se usa para el resultado (RAP), como refuerzo
                          // para evitar falsos positivos entre competencias de programas distintos.
                          const compNameDb = cleanTextForComparison(sched.competence.name);
                          const compNamePdf = cleanTextForComparison(comp.name);

                          const compCoincide =
                            compNameDb === compNamePdf ||
                            compNameDb.includes(compNamePdf) ||
                            compNamePdf.includes(compNameDb) ||
                            getSimilarity(compNameDb, compNamePdf) >= 0.85;

                          if (!compCoincide) return false;

                          // Comparar descripciones de resultados de aprendizaje
                          const outcomeTextDb = cleanTextForComparison(sched.outcome.outcomes);
                          const outcomeTextPdf = cleanTextForComparison(rap.description);

                          if (outcomeTextDb === outcomeTextPdf) return true;
                          if (outcomeTextDb.includes(outcomeTextPdf) || outcomeTextPdf.includes(outcomeTextDb)) return true;

                          const sim = getSimilarity(outcomeTextDb, outcomeTextPdf);
                          return sim >= 0.85;
                        });

                        if (matchedSchedules && matchedSchedules.length > 0) {
                          console.log(`[EXTRACT] Mapeando ${matchedSchedules.length} programación(es) para RAP: "${rap.description.substring(0, 30)}..."`);
                          if (rap.pedagogicalActivities) {
                            matchedSchedules.forEach((matchedSchedule, schedIdx) => {
                              const targetAct = rap.pedagogicalActivities[schedIdx];
                              if (!targetAct) return;

                              // Convertir las fechas UTC de eventos de la programación al formato YYYY-MM-DD
                              const assignedDays = (matchedSchedule.events || [])
                                .map(evt => formatDateToYYYYMMDD(evt))
                                .filter(Boolean);

                              targetAct.isScheduledInCalendar = true;

                              if (matchedSchedule.instructor) {
                                targetAct.suggestedInstructor = {
                                  id: matchedSchedule.instructor._id.toString(),
                                  name: matchedSchedule.instructor.name,
                                  type: matchedSchedule.instructor.bindingtype || '',
                                  assignmentStatus: 'confirmed'
                                };
                              }

                              const startDateStr = formatDateDMY(matchedSchedule.fstart);
                              const endDateStr = formatDateDMY(matchedSchedule.fend);

                              targetAct.hours = {
                                direct: matchedSchedule.hourswork || 0,
                                independent: targetAct.hours?.independent || 0
                              };

                              targetAct.scheduleDetails = {
                                assignedDays: assignedDays,
                                shift: matchedSchedule.tstart ? getShiftFromTime(matchedSchedule.tstart) : null,
                                tstart: matchedSchedule.tstart || null,
                                tend: matchedSchedule.tend || null,
                                hoursPerDay: matchedSchedule.hourswork || 0,
                                calendarNotes: `Programado del ${startDateStr} al ${endDateStr}`,
                                isPublished: true
                              };
                            });
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          }
        }

        if (!planningData.pedagogicalPlanning.timestamps) {
          planningData.pedagogicalPlanning.timestamps = {};
        }
        planningData.pedagogicalPlanning.timestamps.updatedAt = new Date();

        let planning = await Planning.findOneAndUpdate(
          { 'pedagogicalPlanning.fiche': finalFiche },
          { $set: planningData },
          { upsert: true, new: true }
        );

        cleanup();
        console.log(`[EXTRACT] Éxito para ficha ${finalFiche}`);
        return res.json({ message: 'Éxito', data: planning, finalFiche });
      } catch (dbError) {
        cleanup();
        console.error('[ERROR] Error al guardar en BD:', dbError.message);
        return res.status(500).json({ message: 'Error al guardar datos extraídos', error: dbError.message });
      }
    });
  } catch (err) {
    console.error('[ERROR GLOBAL]:', err.message);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};

export const getAllPlannings = async (req, res) => {
  try {
    const token = req.headers.token || req.headers.authorization;
    let decoded = null;
    let isInstructor = false;
    let instructorName = "";

    if (token) {
      try {
        decoded = await webToken.decodeAnyToken(token);
        if (decoded && (decoded.rol === "INSTRUCTOR" || decoded.isInstructor)) {
          isInstructor = true;
          const inst = await Instructor.findById(decoded.id);
          if (inst) {
            instructorName = inst.name;
          }
        }
      } catch (err) {
        console.error('Error decoding token in getAllPlannings:', err.message);
      }
    }

    if (isInstructor && decoded) {
      const emailLower = (decoded.email || "").trim().toLowerCase();

      // Traer todas las planeaciones con el contenido necesario para filtrar en memoria
      const allPlannings = await Planning.find(
        {},
        {
          'pedagogicalPlanning.metadata': 1,
          'pedagogicalPlanning.fiche': 1,
          'pedagogicalPlanning.leaderEmail': 1,
          'pedagogicalPlanning.content': 1
        }
      ).lean();

      // Filtrar en Node.js — garantiza que nombre Y confirmación sean del mismo subdocumento
      const filtered = allPlannings.filter(plan => {
        const p = plan.pedagogicalPlanning;

        // Si es el líder de esta planeación, siempre la ve
        if (emailLower && p.leaderEmail && p.leaderEmail.trim().toLowerCase() === emailLower) {
          return true;
        }

        // Si tiene al menos una actividad confirmada con su nombre
        if (instructorName && p.content) {
          return p.content.some(phase =>
            (phase.competencies || []).some(comp =>
              (comp.learningOutcomes || []).some(rap =>
                (rap.pedagogicalActivities || []).some(act => {
                  const sugg = act.suggestedInstructor || act.instructors;
                  return sugg &&
                    isSameInstructorName(sugg.name, instructorName) &&
                    sugg.assignmentStatus === 'confirmed';
                })
              )
            )
          );
        }

        return false;
      });

      return res.json(filtered.map(plan => ({
        _id: plan._id,
        pedagogicalPlanning: {
          fiche: plan.pedagogicalPlanning.fiche,
          metadata: plan.pedagogicalPlanning.metadata
        }
      })));
    }

    // Para programadores, coordinadores y admins: devolver todo sin filtro
    const plannings = await Planning.find({}, { 'pedagogicalPlanning.metadata': 1, 'pedagogicalPlanning.fiche': 1 });
    res.json(plannings);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener planeaciones', error: error.message });
  }
};

export const scheduleOutcomeInCalendar = async (req, res) => {
  try {
    const { planningId, phaseIndex, competenceIndex, rapIndex, activityIndex } = req.body;
    // Si recibimos formato de índices (nuevo flujo del frontend en SchedulerView)
    if (planningId !== undefined && phaseIndex !== undefined) {
      const planning = await Planning.findById(planningId);
      if (!planning) return res.status(404).json({ message: 'Planeación no encontrada' });

      const phase = planning.pedagogicalPlanning.content[phaseIndex];
      const comp = phase?.competencies[competenceIndex];
      const rap = comp?.learningOutcomes[rapIndex];
      const act = rap?.pedagogicalActivities[activityIndex];

      if (!act) return res.status(404).json({ message: 'Actividad o resultado no encontrado' });

      const sugg = act.suggestedInstructor || act.instructors;
      if (!sugg || sugg.assignmentStatus !== 'confirmed') {
        return res.status(400).json({ message: 'El instructor asignado debe estar CONFIRMADO para poder programar este resultado.' });
      }

      // Marcar como oficialmente programado y publicado
      act.isScheduledInCalendar = true;
      if (!act.scheduleDetails) {
        act.scheduleDetails = {};
      }
      act.scheduleDetails.isPublished = true;

      try {
        // Importar modelos necesarios de forma dinámica para evitar referencias circulares
        const ScheduleModel = (await import('../models/Schedule.js')).default;
        const EnvironmentModel = (await import('../models/Environment.js')).default;
        const FicheModel = (await import('../models/Fiche.js')).default;
        const ProgramModel = (await import('../models/Program.js')).default;
        const CompetenceModel = (await import('../models/Competence.js')).default;
        const OutcomeModel = (await import('../models/Outcome.js')).default;

        const dbFiche = await FicheModel.findOne({ number: planning.pedagogicalPlanning.fiche });
        const dbProgram = await ProgramModel.findOne({ code: planning.pedagogicalPlanning.metadata.programCode });
        const dbCompetence = await CompetenceModel.findOne({ number: comp.code.trim() });
        let dbOutcome = null;
        if (dbCompetence && rap && rap.description) {
          const outcomeText = rap.description.trim();
          dbOutcome = await OutcomeModel.findOne({
            outcomes: { $regex: new RegExp("^" + outcomeText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") },
            competence: dbCompetence._id
          });
        }
        if (!dbCompetence) console.warn(`[PLANNING] Competencia no encontrada: ${comp.code}`);
        if (!dbOutcome) console.warn(`[PLANNING] RAP no encontrado: ${rap.description?.substring(0, 60)}`);

        if (dbFiche && dbProgram && act.suggestedInstructor && act.suggestedInstructor.id) {
          const events = (act.scheduleDetails.assignedDays || []).map(d => new Date(`${d}T00:00:00.000Z`));

          if (events.length > 0) {
            let envId = null;
            if (act.environment?.type) {
              const dbEnv = await EnvironmentModel.findOne({
                name: new RegExp(act.environment.type, 'i')
              });
              if (dbEnv) envId = dbEnv._id;
            }


            // Tiempos por defecto según jornadas reales del SENA
            // (solo aplican si el frontend no envía tstart/tend explícitos)
            let tstart = "06:30", tend = "12:29"; // Mañana por defecto
            if (act.scheduleDetails.shift === "nocturna")         { tstart = "18:30"; tend = "23:29"; }
            else if (act.scheduleDetails.shift === "tarde")       { tstart = "12:30"; tend = "18:29"; }
            else if (act.scheduleDetails.shift === "diurna")      { tstart = "06:30"; tend = "12:29"; }
            else if (act.scheduleDetails.shift === "mixta_manana")       { tstart = "06:30"; tend = "12:29"; }
            else if (act.scheduleDetails.shift === "mixta_manana_tarde") { tstart = "06:30"; tend = "18:29"; }
            else if (act.scheduleDetails.shift === "personalizado")      { tstart = "06:30"; tend = "12:29"; }

            if (act.scheduleDetails.tstart) tstart = act.scheduleDetails.tstart;
            if (act.scheduleDetails.tend) tend = act.scheduleDetails.tend;

            const diffMs = new Date(`2023-01-01T${tend}:00Z`) - new Date(`2023-01-01T${tstart}:00Z`);
            const hoursPerDay = parseFloat((diffMs / 3600000).toFixed(2));
            const hourswork = parseFloat((hoursPerDay * events.length).toFixed(2));

            const existingSchedule = await ScheduleModel.findOne({
              fiche: dbFiche._id,
              instructor: act.suggestedInstructor.id,
              fstart: events[0],
              fend: events[events.length - 1]
            });

            if (existingSchedule) {
              console.warn('[PLANNING] Ya existe un horario para esta actividad, se omite la creación.');
            } else {
              const newSchedule = new ScheduleModel({
                fiche: dbFiche._id,
                program: dbProgram._id,
                competence: dbCompetence ? dbCompetence._id : undefined,
                outcome: dbOutcome ? dbOutcome._id : undefined,
                instructor: act.suggestedInstructor.id,
                supporttext: act.description || act.observations || 'PLANEACIÓN PEDAGÓGICA',
                observation: 'Generado desde el módulo de planeación',
                environment: envId,
                days: [...new Set(events.map(e => e.getDay()))].sort(),
                fstart: events[0],
                fend: events[events.length - 1],
                tstart,
                tend,
                hourswork: hourswork,
                events: events,
                scheduleType: "TITULADA"
              });
              await newSchedule.save();
              const InstructorModel = (await import('../models/Instructor.js')).default;
              const dbInstructor = await InstructorModel.findById(act.suggestedInstructor.id);
              if (dbInstructor) {
                await InstructorModel.findByIdAndUpdate(act.suggestedInstructor.id, {
                  hourswork: dbInstructor.hourswork + hourswork
                });
              }
            }

          }
        }
      } catch (err) {
        console.error('[SYNC SCHEDULE ERROR]:', err);
      }

      await planning.save();
      return res.json({ message: '¡Resultado programado con éxito en el calendario oficial!', data: planning });
    }

    // Flujo alternativo/fallback
    const { fiche, phaseId, competenceCode, outcomeDesc, scheduleData } = req.body;

    if (!fiche || !phaseId || !competenceCode || !outcomeDesc || !scheduleData) {
      return res.status(400).json({
        message: 'Faltan parámetros requeridos: se necesitan fiche, phaseId, competenceCode, outcomeDesc y scheduleData'
      });
    }

    const planning = await Planning.findOne({ 'pedagogicalPlanning.fiche': fiche });
    if (!planning) return res.status(404).json({ message: 'Planeación no encontrada' });

    const phase = planning.pedagogicalPlanning.content.find(p => p.phase === phaseId);
    if (!phase) return res.status(404).json({ message: `Fase '${phaseId}' no encontrada` });

    const comp = phase.competencies.find(c => c.code === competenceCode);
    if (!comp) return res.status(404).json({ message: `Competencia '${competenceCode}' no encontrada en la fase '${phaseId}'` });

    // Comparación robusta insensible a mayúsculas, minúsculas y espacios laterales
    const outcome = comp.learningOutcomes.find(
      o => o.description.trim().toUpperCase() === outcomeDesc.trim().toUpperCase()
    );
    if (!outcome) return res.status(404).json({ message: 'Resultado de aprendizaje no encontrado en esta competencia' });

    if (outcome.pedagogicalActivities && outcome.pedagogicalActivities[0]) {
      // Inicializar scheduleDetails si no existe
      if (!outcome.pedagogicalActivities[0].scheduleDetails) {
        outcome.pedagogicalActivities[0].scheduleDetails = {};
      }
      // Fusionar los datos de programación de forma segura
      outcome.pedagogicalActivities[0].scheduleDetails = {
        ...outcome.pedagogicalActivities[0].scheduleDetails,
        ...scheduleData,
        isPublished: scheduleData.isPublished !== undefined ? scheduleData.isPublished : true
      };

      // Si se está programando, marcar el flag de calendarizado en la raíz de la actividad
      outcome.pedagogicalActivities[0].isScheduledInCalendar = true;
    }

    await planning.save();
    res.json({ message: 'Calendario actualizado con éxito', data: planning });
  } catch (error) {
    console.error('[SCHEDULE OUTCOME ERROR]:', error.message);
    res.status(500).json({ message: 'Error al programar el resultado', error: error.message });
  }
};

export const savePlanningTemplate = async (req, res) => {
  try {
    const { programCode, programName, content, savedBy } = req.body;

    if (!programCode || !programName) {
      return res.status(400).json({ message: 'Faltan datos obligatorios: programCode y programName son requeridos' });
    }

    const template = await PlanningTemplate.findOneAndUpdate(
      { programCode },
      {
        programCode,
        programName,
        content: content || [],
        savedBy: savedBy || '',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Plantilla guardada correctamente', data: template });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar la plantilla', error: error.message });
  }
};

export const getPlanningTemplate = async (req, res) => {
  try {
    const { programCode } = req.params;

    if (!programCode) {
      return res.status(400).json({ message: 'Falta el código de programa' });
    }

    const template = await PlanningTemplate.findOne({ programCode });

    if (!template) {
      return res.status(404).json({ message: 'No existe una plantilla para este código de programa' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la plantilla', error: error.message });
  }
};

/**
 * Aplica una plantilla de programa a la planeación de una ficha específica.
 * Solo agrega fases/competencias/RAPs/actividades que NO existen todavía.
 * NO modifica instructores ni confirmaciones ya establecidas.
 * POST /api/planning/apply-template/:fiche
 * Body: { programCode: string }
 */
export const applyPlanningTemplate = async (req, res) => {
  try {
    const { fiche } = req.params;
    const { programCode } = req.body;

    if (!fiche || !programCode) {
      return res.status(400).json({ message: 'fiche y programCode son obligatorios' });
    }

    const template = await PlanningTemplate.findOne({ programCode });
    if (!template) {
      return res.status(404).json({ message: 'No existe plantilla guardada para este programa' });
    }

    const planning = await Planning.findOne({ 'pedagogicalPlanning.fiche': fiche });
    if (!planning) {
      return res.status(404).json({ message: 'No se encontró la planeación para esta ficha' });
    }

    const existingContent = planning.pedagogicalPlanning.content || [];

    // Helper: clona una actividad eliminando la asignación de instructor y restableciendo horas a 0
    const cleanActivity = (act) => ({
      ...JSON.parse(JSON.stringify(act)),
      hours: { direct: 0, independent: 0 },
      suggestedInstructor: { id: '', name: '', type: '', assignmentStatus: 'pending' },
      isScheduledInCalendar: false,
      scheduleDetails: { isPublished: false },
    });

    for (const templatePhase of template.content) {
      const existingPhase = existingContent.find(p => p.phase === templatePhase.phase);

      if (!existingPhase) {
        // La fase entera no existe: agregarla sin asignaciones de instructor
        const newPhase = JSON.parse(JSON.stringify(templatePhase));
        newPhase.competencies = (newPhase.competencies || []).map(comp => ({
          ...comp,
          learningOutcomes: (comp.learningOutcomes || []).map(rap => ({
            ...rap,
            pedagogicalActivities: (rap.pedagogicalActivities || []).map(cleanActivity),
          })),
        }));
        existingContent.push(newPhase);
        continue;
      }

      // La fase existe: revisar competencias
      for (const templateComp of templatePhase.competencies || []) {
        const existingComp = existingPhase.competencies?.find(c => c.code === templateComp.code);

        if (!existingComp) {
          // Competencia no existe: agregarla sin asignaciones
          const newComp = JSON.parse(JSON.stringify(templateComp));
          newComp.learningOutcomes = (newComp.learningOutcomes || []).map(rap => ({
            ...rap,
            pedagogicalActivities: (rap.pedagogicalActivities || []).map(cleanActivity),
          }));
          if (!existingPhase.competencies) existingPhase.competencies = [];
          existingPhase.competencies.push(newComp);
          continue;
        }

        // Competencia existe: revisar RAPs
        for (const templateRap of templateComp.learningOutcomes || []) {
          const existingRap = existingComp.learningOutcomes?.find(
            r => r.description.trim().toUpperCase() === templateRap.description.trim().toUpperCase()
          );

          if (!existingRap) {
            // RAP no existe: agregarlo sin asignaciones
            const newRap = JSON.parse(JSON.stringify(templateRap));
            newRap.pedagogicalActivities = (newRap.pedagogicalActivities || []).map(cleanActivity);
            if (!existingComp.learningOutcomes) existingComp.learningOutcomes = [];
            existingComp.learningOutcomes.push(newRap);
          } else {
            // Si el RAP ya existe, pero solo tiene la actividad por defecto vacía, la sobrescribimos con las del template
            const hasOnlyDefaultEmpty = !existingRap.pedagogicalActivities ||
              existingRap.pedagogicalActivities.length === 0 ||
              (existingRap.pedagogicalActivities.length === 1 &&
                (!existingRap.pedagogicalActivities[0].description ||
                  existingRap.pedagogicalActivities[0].description === 'Actividad sin descripción' ||
                  existingRap.pedagogicalActivities[0].description.trim() === '') &&
                !existingRap.pedagogicalActivities[0].suggestedInstructor?.id &&
                (Number(existingRap.pedagogicalActivities[0].hours?.direct) || 0) === 0
              );

            if (hasOnlyDefaultEmpty && templateRap.pedagogicalActivities && templateRap.pedagogicalActivities.length > 0) {
              existingRap.pedagogicalActivities = templateRap.pedagogicalActivities.map(cleanActivity);
            }
          }
        }
      }
    }

    planning.pedagogicalPlanning.content = existingContent;
    if (!planning.pedagogicalPlanning.timestamps) {
      planning.pedagogicalPlanning.timestamps = {};
    }
    planning.pedagogicalPlanning.timestamps.updatedAt = new Date();
    planning.markModified('pedagogicalPlanning.content');
    await planning.save();

    res.json({ message: 'Plantilla aplicada correctamente', data: planning });
  } catch (error) {
    res.status(500).json({ message: 'Error al aplicar la plantilla', error: error.message });
  }
};