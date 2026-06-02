import fs from 'fs/promises';
import path from 'path';
import SofiaPlusClient from '../clients/sofiaPlusClient.js';
import { getAuditableGroups, markAsRated, getFicheScheduleSummary } from '../services/scheduleService.js';
import { cleanStringForComparison, PENDING_KEYWORD, ETAPA_PRACTICA_KEYWORD, extractSofiaEndDate } from '../services/reportAnalyzer.js';
import { parseReportFile, indexWorkbookByOutcome, findOutcomeInIndex } from '../services/reportAnalyzer.js';
import { sendMissingGradesReport, sendCoordinatorReport } from '../services/notificationService.js';
import DailyAuditLog from '../models/DailyAuditLog.js';
import { updateCurrentAuditState, buildOutcomeState } from '../services/currentAuditStateService.js';
import FailedFiche from '../models/FailedFiche.js';
import News from '../models/News.js';

/**
 * Procesa los grupos usando un archivo Excel local (sin conectar a Sofía Plus)
 */
async function processWithLocalReport(localReportPath, groupsToProcess, options) {
  const { skipEmail, skipMarkRated, debugLog, fichesSummary, pendientes, vencidos, log, logError, coordinationReports } = options;
  const allNotifiedInstructors = []; // Acumular todos los instructores notificados

  let workbook;
  try {
    const { workbook: wb, totalRows } = parseReportFile(localReportPath);
    workbook = wb;
    debugLog.summary.totalReportRows += totalRows;
  } catch (error) {
    logError('OFFLINE_PARSE', 'Error parseando archivo local', error);
    throw error;
  }

  const { indexedResults, totalEnFormacion, columnKeys } = indexWorkbookByOutcome(workbook);
  const sofiaEndDate = extractSofiaEndDate(workbook);
  debugLog.summary.totalRowsEnFormacion += totalEnFormacion;

  // Procesar cada grupo
  for (const group of groupsToProcess) {
    const { ficheNumber, schedules, ficheOwner, coordination } = group;
    const ficheOwnerName = ficheOwner?.name || 'Sin líder';
    const ficheOwnerEmail = ficheOwner?.email || '';

    const ficheDebug = {
      ficheNumber,
      ficheId: group.ficheId,
      ficheOwner: group.ficheOwner, // Líder de la ficha
      schedulesCount: schedules.length,
      reportDownloaded: true,
      reportPath: localReportPath,
      outcomes: [],
      pendingItems: [],
      error: null
    };

    log('FICHA_START', `>>> Procesando Ficha: ${ficheNumber}`, {
      schedulesCount: schedules.length
    });

    // Analizar cada Resultado
    for (const sched of schedules) {
      const schedInstructor = sched.instructor;
      const outcomeDebug = {
        scheduleId: sched.scheduleId,
        outcomeText: sched.outcomeText,
        fend: sched.fend,
        omittedLearners: sched.omittedLearners,
        analysis: null,
        result: null
      };

      const analysis = findOutcomeInIndex(indexedResults, sched.outcomeText);

      outcomeDebug.analysis = {
        foundColumn: analysis.foundColumn,
        isRated: analysis.isRated,
        totalLearners: analysis.totalLearners,
        missingCount: analysis.missingLearners?.length || 0,
        missingLearners: analysis.missingLearners,
        totalEnFormacion: analysis.totalEnFormacion
      };

      if (!analysis.foundColumn) {
        log('ANALYZE', `[!] Columna NO encontrada para: "${sched.outcomeText.substring(0, 50)}..."`);
        outcomeDebug.result = 'COLUMN_NOT_FOUND';
        // Agregar a inconsistencias para revisión posterior
        debugLog.inconsistencias.push({
          ficheNumber,
          ficheId: group.ficheId,
          scheduleId: sched.scheduleId,
          outcomeText: sched.outcomeText,
          instructorName: sched.instructor?.name || 'Sin instructor',
          instructorEmail: sched.instructor?.email || '',
          reason: 'Resultado no encontrado en el Excel de Sofía Plus (posible error de tipeo)'
        });
      } else if (analysis.isRated) {
        outcomeDebug.result = 'RATED';
        debugLog.summary.outcomesRated++;

        if (!skipMarkRated) {
          await markAsRated(sched.scheduleId, analysis.gradeDate);
        }
      } else {
        // Filtrar aprendices omitidos de missingLearners
        const omittedDocs = sched.omittedLearners || [];
        const filteredLearners = analysis.missingLearners.filter(l =>
          !omittedDocs.includes(l.document)
        );

        const missingCount = filteredLearners.length;
        const totalCount = analysis.totalEnFormacion; // Usar totalEnFormacion en lugar de totalLearners
        const isTotalMissing = totalCount > 0 && missingCount >= totalCount;

        // Si después de filtrar por omisiones no queda nadie, está calificado
        if (missingCount === 0 && analysis.missingLearners.length > 0) {
          outcomeDebug.result = 'RATED_BY_OMISSION';
          debugLog.summary.outcomesRated++;

          if (!skipMarkRated) {
            await markAsRated(sched.scheduleId, analysis.gradeDate);
          }
        } else {
          // Si faltan todos, no listar aprendices individualmente
          if (isTotalMissing) {
            log('ANALYZE', `[PENDIENTE] Resultado sin evaluar (${totalCount} aprendices)`);
          } else {
            log('ANALYZE', `[PENDIENTE] Faltan ${missingCount} de ${totalCount} aprendices`, {
              missing: filteredLearners
            });
          }

          outcomeDebug.result = 'PENDING';
          debugLog.summary.outcomesPending++;
          debugLog.summary.totalMissingLearners += missingCount;

          // En el reporte, si faltan todos, usar mensaje genérico
          const learnersForReport = isTotalMissing
            ? [{ name: '(Todos)', document: 'Resultado sin evaluar' }]
            : filteredLearners;

          ficheDebug.pendingItems.push({
            outcomeText: sched.outcomeText,
            missingLearners: learnersForReport,
            totalLearners: analysis.totalEnFormacion, // Usar totalEnFormacion
            isTotalMissing: isTotalMissing
          });

          // Verificar si está vencido
          const now = new Date();
          const fend = sched.fend ? new Date(sched.fend) : null;
          const isVencido = fend && now > fend;
          const daysOverdue = isVencido ? Math.floor((now - fend) / (1000 * 60 * 60 * 24)) : 0;

          // Construir objeto de estado para este resultado
          const outcomeState = buildOutcomeState({
            scheduleId: sched.scheduleId,
            ficheNumber,
            ficheId: group.ficheId,
            outcomeText: sched.outcomeText,
            fend: sched.fend,
            missingLearners: learnersForReport.map(l => ({ name: l.name, document: l.document })),
            totalLearners: analysis.totalEnFormacion,
            isTotalMissing,
            daysOverdue,
            instructorName: schedInstructor?.name || 'Sin instructor',
            instructorEmail: schedInstructor?.email || '',
            ficheOwnerName,
            ficheOwnerEmail,
            isVencido
          });

          if (isVencido) {
            // Verificar que no esté duplicado en vencidos
            const isDuplicate = debugLog.vencidos.some(v =>
              v.scheduleId.toString() === sched.scheduleId.toString()
            );
            if (!isDuplicate) {
              debugLog.vencidos.push(outcomeState);
            }

            // Para compatibilidad con el reporte anterior
            const vencedOutcome = {
              ficheNumber,
              outcomeText: sched.outcomeText,
              fend: sched.fend,
              daysOverdue,
              missingCount,
              instructorName: schedInstructor?.name || '',
              instructorEmail: schedInstructor?.email || '',
              ficheOwnerName,
              ficheOwnerEmail,
              instructor: schedInstructor ? { name: schedInstructor.name, email: schedInstructor.email } : null
            };

            const isOldDuplicate = debugLog.vencedOutcomes.some(vo =>
              vo.ficheNumber === ficheNumber && vo.outcomeText === sched.outcomeText
            );

            if (!isOldDuplicate) {
              debugLog.vencedOutcomes.push(vencedOutcome);
              debugLog.summary.totalVencedOutcomes++;
            }
          } else {
            // Pendiente (no vencido)
            const isDuplicate = debugLog.pendientes.some(p =>
              p.scheduleId.toString() === sched.scheduleId.toString()
            );
            if (!isDuplicate) {
              debugLog.pendientes.push(outcomeState);
            }
          }
        }
      }

      ficheDebug.outcomes.push(outcomeDebug);
    }

    if (ficheDebug.pendingItems.length > 0 && skipEmail) {
      log('EMAIL', `[SKIP] No se enviaron correos (modo debug)`, {
        pendingCount: ficheDebug.pendingItems.length
      });
    }

    debugLog.summary.fichesProcessed++;
    debugLog.groups.push(ficheDebug);

    // Calcular resumen de ficha
    if (fichesSummary) {
      const summary = await buildFicheSummary({
        group,
        indexedResults,
        totalEnFormacion,
        accumulators: { pendientes: pendientes || debugLog.pendientes, vencidos: vencidos || debugLog.vencidos },
        logger: { info: log, error: logError },
        sofiaEndDate,
        columnKeys
      });
      fichesSummary.push(summary);
    }
  }

  // Enviar correos consolidados: un correo por instructor con todas sus fichas
  if (!skipEmail) {
    // Agrupar por instructor: instructorId → { instructor, fichas: Map<ficheNumber, { items, coordination }> }
    const itemsByInstructor = new Map();

    for (const group of groupsToProcess) {
      const { ficheNumber, schedules, coordination } = group;
      const ficheDebug = debugLog.groups.find(g => g.ficheNumber === ficheNumber);
      if (!ficheDebug?.pendingItems.length) continue;

      for (const sched of schedules) {
        if (!sched.instructor) continue;
        const pendingItem = ficheDebug.pendingItems.find(p => p.outcomeText === sched.outcomeText);
        if (!pendingItem) continue;

        const instructorId = sched.instructor._id?.toString() || sched.instructor.toString();
        if (!itemsByInstructor.has(instructorId)) {
          itemsByInstructor.set(instructorId, { instructor: sched.instructor, fichas: new Map() });
        }
        const instrData = itemsByInstructor.get(instructorId);
        if (!instrData.fichas.has(ficheNumber)) {
          instrData.fichas.set(ficheNumber, { items: [], coordination });
        }
        instrData.fichas.get(ficheNumber).items.push(pendingItem);
      }
    }

    for (const [, data] of itemsByInstructor.entries()) {
      const emails = [data.instructor.email, data.instructor.emailpersonal].filter(Boolean).join(', ') || 'sin email';
      const fichaItems = Array.from(data.fichas.entries()).map(([ficheNumber, { items }]) => ({ ficheNumber, items }));
      const coordination = Array.from(data.fichas.values())[0]?.coordination;

      log('EMAIL', `Enviando correo a ${emails} (${data.instructor.name}) — ${fichaItems.length} ficha(s)...`);
      const result = await sendMissingGradesReport({
        instructor: data.instructor,
        fichaItems,
        coordination
      });

      if (result.success) {
        allNotifiedInstructors.push({
          instructorName: data.instructor.name,
          instructorEmail: emails,
          fichas: fichaItems.map(f => f.ficheNumber),
          pendingCount: fichaItems.reduce((sum, f) => sum + f.items.length, 0)
        });

        for (const [ficheNumber, { items, coordination: ficheCoord }] of data.fichas.entries()) {
          if (!ficheCoord || !coordinationReports) continue;
          const coordId = ficheCoord._id?.toString() || ficheCoord.toString();
          if (!coordinationReports.has(coordId)) {
            coordinationReports.set(coordId, { coordination: ficheCoord, fichas: new Map() });
          }
          const coordReport = coordinationReports.get(coordId);
          if (!coordReport.fichas.has(ficheNumber)) {
            coordReport.fichas.set(ficheNumber, { instructors: [], outcomes: [] });
          }
          const ficheData = coordReport.fichas.get(ficheNumber);
          if (!ficheData.instructors.some(i => i.email === emails)) {
            ficheData.instructors.push({ name: data.instructor.name, email: emails });
          }
          for (const item of items) {
            ficheData.outcomes.push({
              outcomeText: item.outcomeText,
              daysOverdue: 0,
              instructorName: data.instructor.name
            });
          }
        }
      }

      log('EMAIL', result.success ? `Correo enviado a ${emails}` : `Error enviando a ${emails}: ${result.error}`);
    }
  }

  return allNotifiedInstructors;
}

// ============================================================================
// FUNCIÓN CORE Y HELPERS - Refactorización para eliminar duplicación
// ============================================================================

/**
 * Función CORE que contiene toda la lógica compartida entre reviewJudgment y reviewJudgmentDebug
 * @param {Object} config - Configuración inyectada por los adapters
 * @param {Object} config.logger - Sistema de logging (info, error)
 * @param {Object} config.execution - Opciones de ejecución (maxFiches, ficheId, localReportPath, skipEmail, skipMarkRated, skipSaveLog)
 * @param {Object} config.accumulators - Acumuladores de datos (auditReport, pendientes, vencidos, notifiedInstructors, coordinationReports, failedFiches, debugLog)
 * @param {Object} config.postProcessing - Callbacks de finalización (saveMainLog, saveDebugReport, saveVencedOutcomes, updateState, sendCoordinatorReports)
 * @returns {Promise<Object|null>} - Resultado (debugLog si existe, null en producción)
 */
async function reviewJudgmentCore(config) {
  const { logger, execution, accumulators, postProcessing } = config;

  // PASO 1: Obtener grupos auditables
  logger.info('INIT', 'Iniciando proceso de auditoría...');
  const groups = await getAuditableGroups({ ficheId: execution.ficheId });

  if (accumulators.debugLog) {
    accumulators.debugLog.summary.totalGroups = groups.length;
  }

  if (!groups.length) {
    logger.info('GET_GROUPS', 'No hay programaciones pendientes de auditar.');
    if (accumulators.debugLog) {
      accumulators.debugLog.endTime = new Date().toISOString();
      await postProcessing.saveDebugReport(accumulators.debugLog);
      return accumulators.debugLog;
    }
    return null;
  }

  logger.info('GET_GROUPS', `Se encontraron ${groups.length} fichas en BD`);

  // Limitar fichas a procesar
  const groupsToProcess = groups.slice(0, execution.maxFiches);
  logger.info('GET_GROUPS', `Procesando ${groupsToProcess.length} de ${groups.length} fichas`);

  // PASO 2: Procesar (online u offline según localReportPath)
  if (execution.localReportPath) {
    logger.info('OFFLINE_MODE', `Usando archivo local: ${execution.localReportPath}`);
    await processWithLocalReport(execution.localReportPath, groupsToProcess, {
      skipEmail: execution.skipEmail,
      skipMarkRated: execution.skipMarkRated,
      debugLog: accumulators.debugLog,
      fichesSummary: accumulators.fichesSummary,
      pendientes: accumulators.pendientes,
      vencidos: accumulators.vencidos,
      coordinationReports: accumulators.coordinationReports,
      log: logger.info,
      logError: logger.error
    });
  } else {
    await processWithSofiaPlus(groupsToProcess, config);
  }

  // PASO 3: Guardar logs y reportes
  await postProcessing.saveMainLog(accumulators.auditReport);

  if (accumulators.debugLog) {
    await postProcessing.saveDebugReport(accumulators.debugLog);
    await postProcessing.saveVencedOutcomes(accumulators.debugLog.vencedOutcomes);
  }

  // PASO 4: Actualizar estado
  await postProcessing.updateState(accumulators.pendientes, accumulators.vencidos, accumulators.fichesSummary || []);

  // PASO 5: Enviar reportes a coordinadores
  await postProcessing.sendCoordinatorReports(accumulators.coordinationReports);

  return accumulators.debugLog || null;
}

/**
 * Helper para procesar grupos con Sofia Plus
 * @param {Array} groupsToProcess - Grupos a procesar
 * @param {Object} config - Configuración completa
 */
async function processWithSofiaPlus(groupsToProcess, config) {
  const { logger, execution, accumulators } = config;
  const client = new SofiaPlusClient();

  try {
    logger.info('SOFIA_SESSION', 'Iniciando sesión...');
    await client.startSession();
    for (const group of groupsToProcess) {
      await processGroup(group, client, config);
    }

    // Enviar correos a instructores (agrupados por instructor y ficha)
    const pendingCount = accumulators.pendingItemsForEmail?.length || 0;
    console.log(`[EMAIL_CHECK] Items pendientes para notificar: ${pendingCount} | skipEmail: ${execution.skipEmail}`);
    if (!execution.skipEmail && pendingCount > 0) {
      await sendInstructorEmails(accumulators.pendingItemsForEmail, groupsToProcess, config);
    } else if (!execution.skipEmail && pendingCount === 0) {
      console.log('[EMAIL_CHECK] Sin items pendientes — no se envían correos de instructor');
    }

  } catch (error) {
    logger.error('SOFIA_SESSION', 'Error durante la sesión de Sofía Plus', error);
    console.error('[SOFIA_SESSION_ERROR]', error?.message || error);
  } finally {
    await client.close();
  }
}

/**
 * Helper para enviar correos a instructores
 * Agrupa todos los pendientes por instructor (sin importar la ficha) y envía un solo correo por instructor.
 */
async function sendInstructorEmails(pendingItemsForEmail, groupsToProcess, config) {
  const { logger, accumulators } = config;

  // Construir mapa de scheduleId → { ficheNumber, coordination }
  const scheduleToFiche = new Map();
  for (const group of groupsToProcess) {
    for (const s of group.schedules) {
      scheduleToFiche.set(s.scheduleId.toString(), {
        ficheNumber: group.ficheNumber,
        coordination: group.coordination
      });
    }
  }

  // Agrupar por instructor: instructorId → { instructor, fichas: Map<ficheNumber, { items, coordination }> }
  const itemsByInstructor = new Map();

  for (const item of pendingItemsForEmail) {
    if (!item.instructor) continue;

    const ficheInfo = scheduleToFiche.get(item.scheduleId?.toString());
    if (!ficheInfo) continue;

    const { ficheNumber, coordination } = ficheInfo;
    const instructorId = item.instructor._id?.toString() || item.instructor.toString();

    if (!itemsByInstructor.has(instructorId)) {
      itemsByInstructor.set(instructorId, { instructor: item.instructor, fichas: new Map() });
    }

    const instrData = itemsByInstructor.get(instructorId);
    if (!instrData.fichas.has(ficheNumber)) {
      instrData.fichas.set(ficheNumber, { items: [], coordination });
    }
    instrData.fichas.get(ficheNumber).items.push(item);
  }

  // Enviar un correo por instructor con todas sus fichas
  for (const [, data] of itemsByInstructor.entries()) {
    const emails = [data.instructor.email, data.instructor.emailpersonal].filter(Boolean).join(', ') || 'sin email';
    const fichaItems = Array.from(data.fichas.entries()).map(([ficheNumber, { items }]) => ({ ficheNumber, items }));
    const coordination = Array.from(data.fichas.values())[0]?.coordination;

    logger.info('EMAIL', `Enviando correo a ${emails} (${data.instructor.name}) — ${fichaItems.length} ficha(s)...`);

    const result = await sendMissingGradesReport({
      instructor: data.instructor,
      fichaItems,
      coordination
    });

    if (result.success) {
      if (accumulators.notifiedInstructors) {
        accumulators.notifiedInstructors.push({
          instructorName: data.instructor.name,
          instructorEmail: emails,
          fichas: fichaItems.map(f => f.ficheNumber),
          pendingCount: fichaItems.reduce((sum, f) => sum + f.items.length, 0)
        });
      }

      // Acumular en reporte por coordinación (se mantiene por ficha)
      for (const [ficheNumber, { items, coordination: ficheCoord }] of data.fichas.entries()) {
        if (!ficheCoord || !accumulators.coordinationReports) continue;
        const coordId = ficheCoord._id?.toString() || ficheCoord.toString();
        if (!accumulators.coordinationReports.has(coordId)) {
          accumulators.coordinationReports.set(coordId, { coordination: ficheCoord, fichas: new Map() });
        }
        const coordReport = accumulators.coordinationReports.get(coordId);
        if (!coordReport.fichas.has(ficheNumber)) {
          coordReport.fichas.set(ficheNumber, { instructors: [], outcomes: [] });
        }
        const ficheData = coordReport.fichas.get(ficheNumber);
        if (!ficheData.instructors.some(i => i.email === emails)) {
          ficheData.instructors.push({ name: data.instructor.name, email: emails });
        }
        for (const item of items) {
          ficheData.outcomes.push({
            outcomeText: item.outcomeText,
            daysOverdue: item.daysOverdue || 0,
            instructorName: data.instructor.name
          });
        }
      }
    }

    logger.info('EMAIL', result.success ? `Correo enviado a ${emails}` : `Error enviando a ${emails}: ${result.error}`);
  }
}

/**
 * Construye el resumen de una ficha con las categorías del RESUMEN SEDE:
 * AL DÍA, AÚN NO VENCE, SNC PARCIAL, SNC CRÍTICO, SIN PROGRAMAR
 *
 * Todas las categorías se calculan directamente del Excel de Sofía Plus,
 * excepto AÚN NO VENCE y SIN PROGRAMAR que usan schedules de BD
 * (pero retornan 0 si la fecha final del programa ya pasó).
 */
async function buildFicheSummary({
  group, indexedResults, totalEnFormacion, accumulators, logger,
  sofiaEndDate = null, columnKeys = {}
}) {
  const { ficheNumber, ficheId, coordination, programName } = group;
  const now = new Date();
  const isExpired = sofiaEndDate instanceof Date && now > sofiaEndDate;

  const { keyState, keyGrade, keyCompetencia, keyDoc } = columnKeys;

  // Valores limpiados de las keywords para comparación rápida
  const CLEAN_PENDING   = cleanStringForComparison(PENDING_KEYWORD);        // 'porevaluar'
  const CLEAN_PRACTICA  = cleanStringForComparison(ETAPA_PRACTICA_KEYWORD); // 'etapapractica'

  // Documentos de aprendices con novedad activa (DESERCIÓN, RETIRO, TRASLADO, APLAZAMIENTO)
  const EXCLUDED_TPNEW = ['DESERCIÓN', 'RETIRO VOLUNTARIO', 'TRASLADO', 'APLAZAMIENTO'];
  const excludedNews = await News.find({
    fiche: ficheId,
    tpnew: { $in: EXCLUDED_TPNEW }
  }).select('document').lean();
  const excludedDocs = new Set(excludedNews.map(n => String(n.document).toUpperCase().trim()));

  let docKey = keyDoc;
  if (!docKey) {
    const firstOutcome = Object.values(indexedResults)[0];
    const sampleRow = firstOutcome?.rows?.[0];
    if (sampleRow) {
      docKey = Object.keys(sampleRow).find(k =>
        cleanStringForComparison(k).includes('numerodedocumento') ||
        cleanStringForComparison(k) === 'documento'
      ) || null;
    }
  }

  let totalElegibles = 0, sncParcial = 0, sncCritico = 0, rapsConExclusiones = 0;

  for (const outcome of Object.values(indexedResults)) {
    // Excluir resultados de ETAPA PRACTICA
    if (keyCompetencia) {
      const compClean = cleanStringForComparison(outcome.competencia || '');
      if (compClean.includes(CLEAN_PRACTICA)) continue;
    }

    // Aprendices EN FORMACION para este resultado
    const enFormacion = outcome.rows.filter(r => {
      const st = keyState ? cleanStringForComparison(String(r[keyState] || '')) : '';
      return st.includes('formacion');
    });
    if (enFormacion.length === 0) continue;

    totalElegibles++;

    const porEvaluar = enFormacion.filter(r => cleanStringForComparison(String(r[keyGrade] || '')) === CLEAN_PENDING);

    // Filtrar excluidos por "Número de Documento" del Excel vs News.document
    const porEvaluarValidos = excludedDocs.size > 0
      ? porEvaluar.filter(r => {
          const doc = docKey ? String(r[docKey] ?? '').toUpperCase().trim() : '';
          return !excludedDocs.has(doc);
        })
      : porEvaluar;

    if (porEvaluar.length > porEvaluarValidos.length) rapsConExclusiones++;

    if (porEvaluarValidos.length === enFormacion.length) {
      sncCritico++;
    } else if (porEvaluarValidos.length > 0) {
      sncParcial++;
    }
  }

  const alDia = totalElegibles - sncParcial - sncCritico;

  // AÚN NO VENCE y SIN PROGRAMAR: 0 si el programa ya venció
  let aunNoVence = 0;
  let allSchedules = [];
  if (!isExpired) {
    const dbSummary = await getFicheScheduleSummary(ficheId, now);
    aunNoVence = dbSummary.aunNoVence;
    allSchedules = dbSummary.allSchedules;
  }

  const rapsTotal = Object.keys(indexedResults).length;
  let sinProgramar = 0;
  if (!isExpired) {
    const scheduledKeys = new Set(
      allSchedules
        .map(s => cleanStringForComparison(s.outcome?.outcomes || ''))
        .filter(Boolean)
    );
    sinProgramar = Object.keys(indexedResults).filter(key => !scheduledKeys.has(key)).length;
  }

  const estadoGeneral = sncCritico > 0 ? 'SNC CRÍTICO' : sncParcial > 0 ? 'SNC PARCIAL' : 'AL DÍA';

  logger.info('FICHA_SUMMARY', `Ficha ${ficheNumber}: AL_DÍA=${alDia} AÚN_NO_VENCE=${aunNoVence} SNC_PARCIAL=${sncParcial} SNC_CRÍTICO=${sncCritico} SIN_PROGRAMAR=${sinProgramar} EXCL=${rapsConExclusiones} ESTADO=${estadoGeneral}${isExpired ? ' [PROGRAMA VENCIDO]' : ''}`);

  return {
    ficheNumber,
    ficheId,
    programName: programName || '',
    coordinationId: coordination?._id || null,
    coordinationName: coordination?.name || '',
    aprendicesActivos: totalEnFormacion,
    rapsTotal,
    alDia,
    aunNoVence,
    sncParcial,
    sncCritico,
    sinProgramar,
    rapsConExclusiones,
    estadoGeneral
  };
}

/**
 * Helper para procesar una ficha/grupo individual
 * @param {Object} group - Grupo a procesar
 * @param {Object} client - Cliente de Sofia Plus
 * @param {Object} config - Configuración completa
 */
async function processGroup(group, client, config) {
  const { logger, execution, accumulators } = config;
  const { ficheNumber, schedules, ficheOwner, coordination } = group;
  const ficheOwnerName = ficheOwner?.name || 'Sin líder';
  const ficheOwnerEmail = ficheOwner?.email || '';

  logger.info('FICHA_START', `>>> Procesando Ficha: ${ficheNumber}`, {
    schedulesCount: schedules.length,
    ficheOwner: ficheOwnerName
  });

  let workbook, reportPath;

  try {
    reportPath = await client.downloadReport(ficheNumber);

    const { workbook: wb, totalRows } = parseReportFile(reportPath);
    workbook = wb;
    if (accumulators.debugLog?.summary) {
      accumulators.debugLog.summary.totalReportRows += totalRows;
    }

    const { indexedResults, totalEnFormacion, columnKeys } = indexWorkbookByOutcome(workbook);
    const sofiaEndDate = extractSofiaEndDate(workbook);
    if (accumulators.debugLog?.summary) {
      accumulators.debugLog.summary.totalRowsEnFormacion += totalEnFormacion;
    }

    // Procesar cada schedule
    for (const sched of schedules) {
      await processSchedule(sched, indexedResults, group, config);
    }

    // === CALCULAR RESUMEN DE FICHA ===
    const ficheSummary = await buildFicheSummary({
      group,
      indexedResults,
      totalEnFormacion,
      accumulators,
      logger,
      sofiaEndDate,
      columnKeys
    });
    if (!accumulators.fichesSummary) accumulators.fichesSummary = [];
    accumulators.fichesSummary.push(ficheSummary);

    if (reportPath) {
      try {
        await fs.unlink(reportPath);
      } catch (err) {
        logger.error('CLEANUP', `No se pudo eliminar archivo: ${err.message}`);
      }
    }

    if (accumulators.debugLog?.summary) {
      accumulators.debugLog.summary.fichesProcessed++;
    }

  } catch (error) {
    logger.error('DOWNLOAD', `Error descargando/procesando ficha ${ficheNumber}`, error);

    // Si la ficha no existe en Sofía Plus, marcar todos sus schedules como rated
    // para que no vuelvan a aparecer en futuras ejecuciones
    if (error.code === 'FICHA_NOT_FOUND') {
      logger.info('FICHA_NOT_FOUND', `Ficha ${ficheNumber} no existe en Sofía Plus. Marcando ${schedules.length} schedules como rated...`);
      for (const sched of schedules) {
        try {
          await markAsRated(sched.scheduleId, new Date());
        } catch (rateErr) {
          logger.error('FICHA_NOT_FOUND', `No se pudo marcar schedule ${sched.scheduleId} como rated`, rateErr);
        }
      }
    }

    // Agregar a lista de fichas fallidas
    if (accumulators.failedFiches) {
      accumulators.failedFiches.push({
        ficheNumber,
        error: error.message
      });
    }

    // Guardar en BD para seguimiento (el administrador revisa y excluye manualmente)
    try {
      await FailedFiche.findOneAndUpdate(
        { ficheNumber },
        { ficheNumber, error: error.message },
        { upsert: true, new: true }
      );
    } catch (err) {
      logger.error('DB', `No se pudo guardar ficha fallida ${ficheNumber}`, err);
    }

    if (accumulators.debugLog?.summary) {
      accumulators.debugLog.summary.fichesWithErrors++;
    }
  }
}

/**
 * Helper para procesar un schedule/resultado individual
 * @param {Object} sched - Schedule a procesar
 * @param {Object} indexedResults - Resultados indexados del Excel
 * @param {Object} group - Grupo padre
 * @param {Object} config - Configuración completa
 */
async function processSchedule(sched, indexedResults, group, config) {
  const { logger, execution, accumulators } = config;
  const { ficheNumber, ficheOwner, coordination } = group;
  const ficheOwnerName = ficheOwner?.name || 'Sin líder';
  const ficheOwnerEmail = ficheOwner?.email || '';
  const schedInstructor = sched.instructor;

  const analysis = findOutcomeInIndex(indexedResults, sched.outcomeText);

  if (!analysis.foundColumn) {
    logger.info('ANALYZE', `[!] Columna NO encontrada para: "${sched.outcomeText.substring(0, 50)}..."`);

    // Agregar a inconsistencias
    const inconsistencia = {
      ficheNumber,
      ficheId: group.ficheId,
      scheduleId: sched.scheduleId,
      outcomeText: sched.outcomeText,
      instructorName: sched.instructor?.name || 'Sin instructor',
      instructorEmail: sched.instructor?.email || '',
      reason: 'Resultado no encontrado en el Excel de Sofía Plus (posible error de tipeo)'
    };

    if (accumulators.auditReport.inconsistencias) {
      accumulators.auditReport.inconsistencias.push(inconsistencia);
    }
    if (accumulators.debugLog?.inconsistencias) {
      accumulators.debugLog.inconsistencias.push(inconsistencia);
    }

    return;
  }

  if (analysis.isRated) {
    // logger.info('ANALYZE', `[OK] Calificado: Schedule ${sched.scheduleId}`);

    if (!execution.skipMarkRated) {
      await markAsRated(sched.scheduleId, analysis.gradeDate);
    }

    if (accumulators.debugLog?.summary) {
      accumulators.debugLog.summary.outcomesRated++;
    }

    return;
  }

  // === DETECTADO PENDIENTE ===
  const omittedDocs = sched.omittedLearners || [];
  const filteredLearners = analysis.missingLearners.filter(l =>
    !omittedDocs.includes(l.document)
  );

  const missingCount = filteredLearners.length;
  const totalCount = analysis.totalEnFormacion;
  const isTotalMissing = totalCount > 0 && missingCount >= totalCount;

  // Si después de filtrar por omisiones no queda nadie, está calificado
  if (missingCount === 0 && analysis.missingLearners.length > 0) {
    logger.info('ANALYZE', `[OK] Todos los aprendices sin nota están omitidos - Resultado calificado por omisión`);
    await markAsRated(sched.scheduleId, analysis.gradeDate);
    return;
  }

  // Para el correo y log: si faltan todos, usar mensaje genérico
  const learnersForReport = isTotalMissing
    ? [{ name: '(Todos)', document: 'Resultado sin evaluar' }]
    : filteredLearners;

  // Verificar si está vencido
  const now = new Date();
  const fend = sched.fend ? new Date(sched.fend) : null;
  const isVencido = fend && now > fend;
  const daysOverdue = isVencido ? Math.floor((now - fend) / (1000 * 60 * 60 * 24)) : 0;

  // Construir objeto de estado para el registro único
  const outcomeState = buildOutcomeState({
    scheduleId: sched.scheduleId,
    ficheNumber,
    ficheId: group.ficheId,
    outcomeText: sched.outcomeText,
    fend: sched.fend,
    missingLearners: learnersForReport.map(l => ({ name: l.name, document: l.document })),
    totalLearners: totalCount,
    isTotalMissing,
    daysOverdue,
    instructorName: schedInstructor?.name || 'Sin instructor',
    instructorEmail: schedInstructor?.email || '',
    ficheOwnerName,
    ficheOwnerEmail,
    isVencido
  });

  if (isVencido) {
    // Verificar duplicados
    const isDuplicate = accumulators.vencidos.some(v =>
      v.scheduleId.toString() === sched.scheduleId.toString()
    );
    if (!isDuplicate) {
      accumulators.vencidos.push(outcomeState);
    }
    logger.info('ANALYZE', `[VENCIDO] ${daysOverdue} días vencido`);
  } else {
    const isDuplicate = accumulators.pendientes.some(p =>
      p.scheduleId.toString() === sched.scheduleId.toString()
    );
    if (!isDuplicate) {
      accumulators.pendientes.push(outcomeState);
    }
  }

  if (isTotalMissing) {
    logger.info('ANALYZE', `[PENDIENTE] Resultado sin evaluar (${totalCount} aprendices)`);
  } else {
    logger.info('ANALYZE', `[PENDIENTE] Faltan ${missingCount} de ${totalCount} aprendices`);
  }

  // Preparar datos para email y log
  const itemData = {
    scheduleId: sched.scheduleId,
    ficheNumber,
    outcomeText: sched.outcomeText,
    missingLearners: learnersForReport,
    totalLearners: totalCount,
    isTotalMissing: isTotalMissing,
    instructor: schedInstructor,
    daysOverdue
  };

  // Agregar a acumuladores para email
  if (!accumulators.pendingItemsForEmail) {
    accumulators.pendingItemsForEmail = [];
  }
  accumulators.pendingItemsForEmail.push(itemData);

  // Agregar a acumuladores para log global
  if (accumulators.auditReport.details) {
    // Buscar o crear entrada para esta ficha
    let ficheEntry = accumulators.auditReport.details.find(d => d.ficheNumber === ficheNumber);
    if (!ficheEntry) {
      ficheEntry = {
        ficheNumber,
        ficheId: group.ficheId,
        pendingOutcomes: []
      };
      accumulators.auditReport.details.push(ficheEntry);
    }

    ficheEntry.pendingOutcomes.push({
      scheduleId: sched.scheduleId,
      outcomeText: sched.outcomeText,
      isTotalMissing: isTotalMissing,
      missingLearners: learnersForReport.map(l => ({
        name: l.name,
        document: l.document
      }))
    });

    accumulators.auditReport.totalOutcomesPending++;
  }

  if (accumulators.debugLog?.summary) {
    accumulators.debugLog.summary.outcomesPending++;
    accumulators.debugLog.summary.totalMissingLearners += missingCount;
  }

  // Agregar a vencedOutcomes para compatibilidad
  if (isVencido && accumulators.debugLog?.vencedOutcomes) {
    const vencedOutcome = {
      ficheNumber,
      outcomeText: sched.outcomeText,
      fend: sched.fend,
      daysOverdue,
      missingCount,
      instructorName: schedInstructor?.name || '',
      instructorEmail: schedInstructor?.email || '',
      ficheOwnerName,
      ficheOwnerEmail,
      instructor: schedInstructor ? { name: schedInstructor.name, email: schedInstructor.email } : null
    };

    const isOldDuplicate = accumulators.debugLog.vencedOutcomes.some(vo =>
      vo.ficheNumber === ficheNumber && vo.outcomeText === sched.outcomeText
    );

    if (!isOldDuplicate) {
      accumulators.debugLog.vencedOutcomes.push(vencedOutcome);
      accumulators.debugLog.summary.totalVencedOutcomes++;
    }
  }
}

/**
 * Versión DEBUG de reviewJudgment que genera un archivo de resumen detallado
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.skipEmail - Si es true, no envía correos (default: true en debug)
 * @param {boolean} options.skipMarkRated - Si es true, no marca como calificado (default: true en debug)
 * @param {boolean} options.skipSaveLog - Si es true, no guarda en DailyAuditLog (default: true en debug)
 * @param {string} options.localReportPath - Ruta a un archivo Excel local para usar en lugar de descargar de Sofía
 * @returns {Object} Resumen completo del proceso
 */
export async function reviewJudgmentDebug(options = {}) {
  const {
    skipEmail = true,
    skipMarkRated = true,
    skipSaveLog = true,
    maxFiches = parseInt(process.env.MAX_GROUPS_TO_PROCESS, 10) || 5,
    ficheId: ficheIdRaw = null,
    localReportPath = null
  } = options;

  // Limpiar ficheId de espacios y saltos de línea
  let ficheId = null;
  if (ficheIdRaw && typeof ficheIdRaw === 'string') {
    ficheId = ficheIdRaw.trim();
  }

  // === ACUMULADORES DE DEBUG ===
  const debugLog = {
    startTime: new Date().toISOString(),
    endTime: null,
    options: { skipEmail, skipMarkRated, skipSaveLog, maxFiches, ficheId },
    steps: [],
    groups: [],
    errors: [],
    vencedOutcomes: [],
    inconsistencias: [],
    pendientes: [],
    vencidos: [], 
    summary: {
      totalGroups: 0,
      totalSchedules: 0,
      fichesProcessed: 0,
      fichesWithErrors: 0,
      outcomesRated: 0,
      outcomesPending: 0,
      totalMissingLearners: 0,
      totalReportRows: 0,
      totalRowsEnFormacion: 0,
      totalVencedOutcomes: 0
    }
  };

  // === LOGGER ESTRUCTURADO (guarda en debugLog.steps) ===
  const logger = {
    info: (step, message, data) => {
      const entry = {
        timestamp: new Date().toISOString(),
        step,
        message,
        data
      };
      debugLog.steps.push(entry);
    },
    error: (step, message, error) => {
      const entry = {
        timestamp: new Date().toISOString(),
        step,
        message,
        error: error?.message || String(error),
        stack: error?.stack
      };
      debugLog.errors.push(entry);
      console.error(`[DEBUG][ERROR][${step}] ${message}`, error);
    }
  };

  // === CONFIGURACIÓN PARA DEBUG ===
  const config = {
    logger,
    execution: {
      maxFiches,
      ficheId,
      localReportPath,
      skipEmail,
      skipMarkRated,
      skipSaveLog
    },
    accumulators: {
      auditReport: debugLog,
      pendientes: debugLog.pendientes,
      vencidos: debugLog.vencidos,
      fichesSummary: [],
      notifiedInstructors: [],
      coordinationReports: new Map(),
      failedFiches: [],
      pendingItemsForEmail: [],
      debugLog
    },
    postProcessing: {
      saveMainLog: async (data) => {
        if (!skipSaveLog && debugLog.groups.some(g => g.pendingItems?.length > 0)) {
          logger.info('SAVE_LOG', 'Guardando reporte en DailyAuditLog...');
          const auditLogData = {
            executionDate: new Date(),
            totalFichesWithIssues: debugLog.groups.filter(g => g.pendingItems?.length > 0).length,
            totalOutcomesPending: debugLog.summary.outcomesPending,
            details: debugLog.groups.filter(g => g.pendingItems?.length > 0).map(g => ({
              ficheNumber: g.ficheNumber,
              ficheId: g.ficheId,
              pendingOutcomes: g.pendingItems.map(p => ({
                scheduleId: p.scheduleId,
                outcomeText: p.outcomeText,
                isTotalMissing: p.isTotalMissing,
                missingLearners: p.missingLearners.map(l => ({
                  name: l.name,
                  document: l.document
                }))
              }))
            })),
            inconsistencias: debugLog.inconsistencias
          };

          try {
            await DailyAuditLog.create(auditLogData);
            logger.info('SAVE_LOG', 'Reporte guardado en DailyAuditLog correctamente');
          } catch (saveError) {
            logger.error('SAVE_LOG', 'Error guardando reporte en DailyAuditLog', saveError);
          }
        } else {
          logger.info('SAVE_LOG', '[SKIP] No se guardó en BD (modo debug o sin pendientes)');
        }
      },
      saveDebugReport: async (log) => {
        const reportPath = await saveDebugReport(log);
        logger.info('REPORT', `Reporte guardado en: ${reportPath}`);
        return reportPath;
      },
      saveVencedOutcomes: async (outcomes) => {
        if (outcomes.length > 0) {
          const vencedPath = await saveVencedOutcomes(outcomes);
          logger.info('REPORT', `Vencidos guardados en: ${vencedPath}`);
        }
      },
      updateState: async (pend, venc, summary) => {
        try {
          await updateCurrentAuditState(pend, venc, summary);
          logger.info('UPDATE_STATE', `Registro único actualizado: ${pend.length} pendientes, ${venc.length} vencidos, ${summary?.length || 0} fichas resumidas`);
        } catch (error) {
          logger.error('UPDATE_STATE', 'Error actualizando registro único', error);
        }
      },
      sendCoordinatorReports: async () => {
        // No-op en debug
      }
    }
  };

  try {
    // === LLAMAR A LA FUNCIÓN CORE ===
    await reviewJudgmentCore(config);

  } catch (error) {
    logger.error('CRITICAL', 'Error crítico en reviewJudgmentDebug', error);
  }

  debugLog.endTime = new Date().toISOString();
  return debugLog;
}

// ============================================================================
/**
 * Guarda el reporte de debug en un archivo JSON
 */
async function saveDebugReport(debugLog) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `audit-debug-${timestamp}.json`;
  const outputDir = process.env.OUTPUTDIR || './tmp';
  const filePath = path.join(outputDir, fileName);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(debugLog, null, 2), 'utf-8');
    const s = debugLog.summary;
    console.log(`[DEBUG_REPORT] ${filePath} | fichas:${s.fichesProcessed} calificados:${s.outcomesRated} pendientes:${s.outcomesPending} vencidos:${s.totalVencedOutcomes} errores:${s.fichesWithErrors}`);
    return filePath;
  } catch (error) {
    console.error('Error guardando reporte de debug:', error);
    return null;
  }
}

/**
 * Guarda el reporte de resultados vencidos en un archivo JSON separado
 */
async function saveVencedOutcomes(vencedOutcomes) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `vencidos-${timestamp}.json`;
  const outputDir = process.env.OUTPUTDIR || './tmp';
  const filePath = path.join(outputDir, fileName);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(vencedOutcomes, null, 2), 'utf-8');
    console.log(`[VENCIDOS_REPORT] ${filePath} | total:${vencedOutcomes.length}`);
    return filePath;
  } catch (error) {
    console.error('Error guardando reporte de vencidos:', error);
    return null;
  }
}

/**
 * Versión PRODUCCIÓN de reviewJudgment
 * Ejecuta la auditoría completa y guarda resultados en BD
 * @param {Object} options
 * @param {number} [options.maxFiches] - Límite de fichas a procesar (override del env MAX_GROUPS_TO_PROCESS)
 * @param {string} [options.ficheId]  - Si se pasa, solo procesa esa ficha específica
 */
export async function reviewJudgment(options = {}) {
  const startTime = Date.now();
  console.log('Iniciando proceso de auditoría de juicios...');

  // Sin parámetro → todas las fichas; con parámetro → ese número
  const MAX_FICHES = options.maxFiches ?? Infinity;
  const ficheIdRaw = options.ficheId ?? null;
  const ficheId = ficheIdRaw && typeof ficheIdRaw === 'string' ? ficheIdRaw.trim() : null;

  // === ACUMULADORES DE PRODUCCIÓN ===
  const globalAuditReport = {
    executionDate: new Date(),
    details: [],
    totalOutcomesPending: 0,
    inconsistencias: []
  };

  const pendientes = [];
  const vencidos = [];
  const fichesSummary = [];
  const failedFiches = [];
  const coordinationReports = new Map();
  const notifiedInstructors = [];
  const pendingItemsForEmail = [];

  // === LOGGER SIMPLE (console.log directo) ===
  const logger = {
    info: (step, message, data) => console.log(message),
    error: (step, message, error) => console.error(message, error)
  };

  // === CONFIGURACIÓN PARA PRODUCCIÓN ===
  const config = {
    logger,
    execution: {
      maxFiches: MAX_FICHES,
      ficheId: ficheId,
      localReportPath: null,
      skipEmail: false,
      skipMarkRated: false,
      skipSaveLog: false
    },
    accumulators: {
      auditReport: globalAuditReport,
      pendientes,
      vencidos,
      fichesSummary,
      notifiedInstructors,
      coordinationReports,
      failedFiches,
      pendingItemsForEmail,
      debugLog: null
    },
    postProcessing: {
      saveMainLog: async (data) => {
        if (data.details.length > 0 || data.inconsistencias.length > 0) {
          data.totalFichesWithIssues = data.details.length;
          try {
            await DailyAuditLog.create(data);
            console.log(`[EXITO] Reporte de auditoría global guardado. (${data.totalFichesWithIssues} fichas afectadas, ${data.inconsistencias.length} inconsistencias)`);
          } catch (saveError) {
            console.error('Error guardando el reporte global en Mongo:', saveError);
          }
        } else {
          console.log('[INFO] Auditoría terminada sin pendientes ni inconsistencias. No se generó reporte en BD.');
        }
      },
      saveDebugReport: async () => {}, // No-op en producción
      saveVencedOutcomes: async () => {}, // No-op en producción
      updateState: async (pend, venc) => {
        try {
          await updateCurrentAuditState(pend, venc, fichesSummary);
          console.log(`[AUDIT_STATE] Ejecución guardada: ${pend.length} pendientes, ${venc.length} vencidos, ${fichesSummary.length} fichas resumidas`);
        } catch (error) {
          console.error('[AUDIT_STATE] Error actualizando registro único:', error);
        }
      },
      sendCoordinatorReports: async (map) => {
        if (map.size === 0) return;

        console.log('[COORD_REPORT] Enviando resúmenes a coordinadores...');
        let coordSent = 0;
        let coordFailed = 0;
        for (const [coordId, report] of map.entries()) {
          const coordFichesSummary = fichesSummary.filter(f =>
            f.coordinationId && f.coordinationId.toString() === coordId
          );
          const coordFicheNumbers = new Set(coordFichesSummary.map(f => String(f.ficheNumber)));
          const coordPendientes   = pendientes.filter(p => coordFicheNumbers.has(String(p.ficheNumber)));
          const coordVencidos     = vencidos.filter(v => coordFicheNumbers.has(String(v.ficheNumber)));
          const result = await sendCoordinatorReport(report.coordination, report.fichas, coordFichesSummary, coordPendientes, coordVencidos);
          if (result.success) {
            coordSent++;
          } else {
            coordFailed++;
          }
        }
        console.log(`[COORD_REPORT] Resúmenes enviados: ${coordSent} exitosos, ${coordFailed} fallidos`);
      }
    }
  };

  try {
    // === LLAMAR A LA FUNCIÓN CORE ===
    await reviewJudgmentCore(config);

  } catch (error) {
    console.error('Error crítico en reviewJudgment:', error);
  }

  // === REPORTAR FICHAS FALLIDAS ===
  if (failedFiches.length > 0) {
    console.warn(`[FICHAS_FALLIDAS] ${failedFiches.length} fichas fallaron: ${failedFiches.map(f => `${f.ficheNumber}(${f.error})`).join(', ')}`);
  }

  const elapsed = Date.now() - startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = ((elapsed % 60000) / 1000).toFixed(1);
  console.log(`[AUDIT] Proceso completado en ${minutes}m ${seconds}s (${(elapsed / 1000).toFixed(1)}s total)`);
}
