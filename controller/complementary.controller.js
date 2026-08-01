import AppSettings from "../models/AppSettings.js";
import ComplementaryCatalog from "../models/ComplementaryCatalog.js";
import ComplementaryParametro from "../models/ComplementaryParametro.js";
import ComplementaryRequest from "../models/ComplementaryRequest.js";
import Environment from "../models/Environment.js";
import Fiche from "../models/Fiche.js";
import Instructor from "../models/Instructor.js";
import Program from "../models/Program.js";
import Schedule from "../models/Schedule.js";
import OtherSchedules from "../models/OthersSchedule.js";
import xlsx from "xlsx";
import sendEmail from "../utils/emails/sendEmail.js";
import registerAction from "../middlewares/binnacle.js";
import webToken from "../middlewares/webToken.js";
import {
  complementaryHelper,
  complementaryScheduleHelper,
  complementaryAuditHelper,
  complementaryExtractor,
} from "../helpers/complementary.helper.js";
import { sendMissingRouteNotification, sendMissingJudgmentsNotification } from "../services/notificationService.js";
import { runDf14aReport } from "../cron/df14a-report.js";
import { coordinationHelper } from "../helpers/coordination.helper.js";
import { ficheHelper } from "../helpers/fiche.helper.js";
import { calculateNumHoursWork, dateFormater } from "../utils/functions/dates.js";
import { notifyApproval, notifyRejection, notifyFichaAssigned, notifyNewRequest, notifyCancellation, notifyScheduled, notifyResubmit, notifyExecution, notifyExtensionRequest, notifyExtensionResolved } from "../services/complementaryNotificationService.js";
import User from "../models/User.js";
import Df14aReportHistory from "../models/Df14aReportHistory.js";
import { jobStore } from "../utils/jobStore.js";
import path from 'path';
import fs from 'fs';

const compCtrl = {};

//send access code to instructor emails (email + emailpersonal) — no requiere token
compCtrl.sendCode = async (req, res) => {
  const { email, module } = req.body;
  try {
    const instructor = await complementaryHelper.findInstructorByEmail(email);

    if (!instructor) {
      return res.status(401).json({ msg: "Instructor no encontrado" });
    }

    const code = complementaryHelper.generateSixDigitCode();
    instructor.accessCode = code;
    instructor.accessCodeCreatedAt = new Date();
    await instructor.save();

    const moduleName =
      module === "planning"
        ? "Planeación Pedagógica SENA"
        : "Formación Complementaria SENA";

    const fromEmail = process.env.FROM_EMAIL;
    const fromPass = process.env.SECURY_EMAIL;
    const subject =
      module === "planning"
        ? "CODIGO DE ACCESO - PLANEACION PEDAGOGICA SENA"
        : "CODIGO DE ACCESO - COMPLEMENTARIAS SENA";
    const template = "./template/complementaryAccessCode.hbs";

    const sendResults = { email: false, emailpersonal: false };

    if (instructor.email) {
      try {
        await sendEmail(
          fromEmail,
          fromPass,
          [instructor.email],
          subject,
          { code, moduleName },
          template
        );
        sendResults.email = true;
      } catch (err) {
        console.log(
          "[EMAIL] Error enviando a email institucional:",
          err.message
        );
      }
    }

    if (instructor.emailpersonal) {
      try {
        await sendEmail(
          fromEmail,
          fromPass,
          [instructor.emailpersonal],
          subject,
          { code, moduleName },
          template
        );
        sendResults.emailpersonal = true;
      } catch (err) {
        console.log("[EMAIL] Error enviando a email personal:", err.message);
      }
    }

    if (!sendResults.email && !sendResults.emailpersonal) {
      return res.status(400).json({ msg: "No fue posible enviar el código de verificación. Intente nuevamente" });
    }

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "ENVIAR CODIGO DE ACCESO",
        data: { email: instructor.email, numdocument: instructor.numdocument, enviadoA: sendResults },
      },
      null
    );

    res.json({
      msg: "Codigo de verificacion enviado correctamente",
      emails: [instructor.email, instructor.emailpersonal].filter(Boolean),
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//verify access code and grant access — no requiere token previo, devuelve token COMPLEMENTARIA
compCtrl.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  try {
    const instructor = await complementaryHelper.findInstructorByEmail(email);

    if (!instructor) {
      return res.status(401).json({ msg: "Instructor no encontrado" });
    }

    complementaryHelper.validateCodeMatch(
      instructor.accessCode,
      instructor.accessCodeCreatedAt,
      code
    );

    await complementaryHelper.clearAccessCode(instructor);

    const token = await webToken.generateTokenComplementaria(instructor);

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "VERIFICAR CODIGO DE ACCESO",
        data: { email: instructor.email, numdocument: instructor.numdocument },
      },
      null
    );

    res.json({
      msg: "Acceso a complementarias concedido",
      token,
      instructor: {
        _id: instructor._id,
        name: instructor.name,
        tpdocument: instructor.tpdocument,
        numdocument: instructor.numdocument,
        email: instructor.email,
        emailpersonal: instructor.emailpersonal,
        phone: instructor.phone,
        knowledge: instructor.knowledge,
        thematicarea: instructor.thematicarea,
        bindingtype: instructor.bindingtype,
        caphour: instructor.caphour,
        hourswork: instructor.hourswork,
      },
    });
  } catch (error) {
    console.log(error);
    if (
      error.message.includes("incorrecto") ||
      error.message.includes("expirado") ||
      error.message.includes("No tiene codigo")
    ) {
      return res.status(401).json({ msg: error.message });
    }
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//get all catalogs with filters and monthly alert
compCtrl.getCatalogs = async (req, res) => {
  const {
    status,
    prfDenominacion,
    prfCodigo,
    lineaTecnologica,
    redConocimiento,
    // params nuevos (opcionales, para modo paginado)
    page,
    limit,
    q,
    orden,
    modalidad,
    apuestasPrioritarias,
    horasMin,
    horasMax,
  } = req.query;
  try {
    // Modo paginado: se activa SOLO si llega page/limit. Sin esto, comportamiento = hoy.
    const esModoPaginado = page !== undefined || limit !== undefined;

    const filter = {};
    if (status !== undefined) filter.status = Number(status);
    if (prfCodigo) filter.prfCodigo = Number(prfCodigo);
    if (prfDenominacion) filter.prfDenominacion = { $regex: prfDenominacion, $options: "i" };

    // lineaTecnologica / redConocimiento: colision de nombres.
    //   - Sin paginacion: regex parcial (comportamiento actual, compatible hacia atras).
    //   - Con paginacion: interpretados como $in (CSV).
    const csvToIn = (val) => (val ? val.split(",").map((s) => s.trim()).filter(Boolean) : []);
    if (esModoPaginado) {
      const lineaArr = csvToIn(lineaTecnologica);
      const redArr = csvToIn(redConocimiento);
      const modArr = csvToIn(modalidad);
      const apuestasArr = csvToIn(apuestasPrioritarias);
      if (lineaArr.length) filter.lineaTecnologica = { $in: lineaArr };
      if (redArr.length) filter.redConocimiento = { $in: redArr };
      if (modArr.length) filter.modalidad = { $in: modArr };
      if (apuestasArr.length) filter.apuestasPrioritarias = { $in: apuestasArr };

      // Rango de horas (prfDuracionMaxima)
      const hMin = horasMin !== undefined && horasMin !== "" ? Number(horasMin) : null;
      const hMax = horasMax !== undefined && horasMax !== "" ? Number(horasMax) : null;
      const rango = {};
      if (hMin !== null && !isNaN(hMin)) rango.$gte = hMin;
      if (hMax !== null && !isNaN(hMax)) rango.$lte = hMax;
      if (Object.keys(rango).length) filter.prfDuracionMaxima = rango;

      // Busqueda q: digitos -> codigo (prfCodigoStr, literal con ceros) ; texto -> nombre
      const qTrim = (q || "").trim();
      if (qTrim) {
        const esNumerico = /^\d+$/.test(qTrim);
        if (esNumerico) {
          filter.prfCodigoStr = { $regex: qTrim, $options: "i" };
        } else {
          filter.prfDenominacion = { $regex: qTrim, $options: "i" };
        }
      }
    } else {
      if (lineaTecnologica) filter.lineaTecnologica = { $regex: lineaTecnologica, $options: "i" };
      if (redConocimiento) filter.redConocimiento = { $regex: redConocimiento, $options: "i" };
    }

    // Orden
    const ordenMap = {
      nombre_asc: { prfDenominacion: 1 },
      nombre_desc: { prfDenominacion: -1 },
      horas_asc: { prfDuracionMaxima: 1 },
      horas_desc: { prfDuracionMaxima: -1 },
    };
    const sortOptions = esModoPaginado && ordenMap[orden] ? ordenMap[orden] : { createdAt: -1 };

    // Query base
    let query = ComplementaryCatalog.find(filter).sort(sortOptions);

    // Paginacion (solo en modo paginado)
    let total = null;
    let pageNum = null;
    let limitNum = null;
    if (esModoPaginado) {
      pageNum = Number(page) || 1;
      limitNum = Number(limit) || 11;
      if (pageNum < 1) pageNum = 1;
      if (limitNum < 1) limitNum = 11;
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const catalogs = await query;

    // catalogUpdateAlert / lastUploadDate (se mantiene igual que hoy)
    const settings = await AppSettings.findOne();
    let catalogUpdateAlert = false;
    let lastUploadDate = null;
    if (settings && settings.catalogLastUploadDate) {
      lastUploadDate = settings.catalogLastUploadDate;
      const daysSinceUpload = (Date.now() - new Date(lastUploadDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpload > 30) {
        catalogUpdateAlert = true;
      }
    }

    // Modo paginado: total + facetas globales (counts sobre catálogo activo completo)
    if (esModoPaginado) {
      total = await ComplementaryCatalog.countDocuments(filter);

      const countsAgg = await ComplementaryCatalog.aggregate([
        { $match: { status: 0 } },
        {
          $facet: {
            modalidad: [{ $group: { _id: "$modalidad", count: { $sum: 1 } } }],
            lineaTecnologica: [{ $group: { _id: "$lineaTecnologica", count: { $sum: 1 } } }],
            redConocimiento: [{ $group: { _id: "$redConocimiento", count: { $sum: 1 } } }],
            apuestasPrioritarias: [{ $group: { _id: "$apuestasPrioritarias", count: { $sum: 1 } } }],
          },
        },
      ]);

      // Transformar [{_id,count}] -> { valor: count }
      const toMap = (arr) =>
        (arr || []).reduce((acc, item) => {
          if (item._id !== null && item._id !== undefined && item._id !== "") {
            acc[item._id] = item.count;
          }
          return acc;
        }, {});
      const facet = countsAgg[0] || {};
      const counts = {
        modalidad: toMap(facet.modalidad),
        lineaTecnologica: toMap(facet.lineaTecnologica),
        redConocimiento: toMap(facet.redConocimiento),
        apuestasPrioritarias: toMap(facet.apuestasPrioritarias),
      };

      return res.json({
        data: catalogs,
        total,
        page: pageNum,
        limit: limitNum,
        counts,
        catalogUpdateAlert,
        lastUploadDate,
      });
    }

    // Modo sin paginacion: respuesta identica a la version anterior
    res.json({ data: catalogs, catalogUpdateAlert, lastUploadDate });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//get catalog by id
compCtrl.getCatalogId = async (req, res) => {
  const { id } = req.params;
  try {
    const catalog = await ComplementaryCatalog.findById(id);
    res.json(catalog);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//upload excel with catalog courses — reemplazo completo del catálogo (polling con jobId)
compCtrl.uploadExcel = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ msg: "No se ha subido ningún archivo" });
    }

    const filePath = req.files.file.tempFilePath || null;
    const workbook = filePath
      ? xlsx.readFile(filePath)
      : xlsx.read(req.files.file.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) {
      return res.status(400).json({ msg: "El archivo Excel no tiene datos" });
    }

    // Normalizar encabezados: quitar acentos, espacios, paréntesis → guiones bajos
    const normalizeKey = (key) =>
      key
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    const normalizedRows = rows.map((row) => {
      const newRow = {};
      for (const [key, val] of Object.entries(row)) {
        newRow[normalizeKey(key)] = val;
      }
      return newRow;
    });

    // Crear job y responder inmediatamente con jobId
    const { jobId, state } = jobStore.createJob();
    state.total = normalizedRows.length;
    const token = req.headers.token;

    res.json({ msg: "Carga masiva iniciada", jobId });

    // Procesamiento en background
    (async () => {
      try {
        const parseDate = (val) => {
          if (!val || (typeof val === "string" && val.trim() === "") || val === "(en blanco)") return null;
          if (typeof val === "number") {
            const date = new Date((val - 25569) * 86400 * 1000);
            return isNaN(date.getTime()) ? null : date;
          }
          const date = new Date(val);
          return isNaN(date.getTime()) ? null : date;
        };

        const parseNum = (val) => {
          const n = Number(val);
          return isNaN(n) ? 0 : n;
        };

        await ComplementaryCatalog.deleteMany({});

        for (let i = 0; i < normalizedRows.length; i++) {
          const row = normalizedRows[i];
          try {
            const prfCodigo = row.PRF_CODIGO;
            const prfVersion = row.PRF_VERSION;
            const modalidad = (row.MODALIDAD || "").toString().toUpperCase().trim();

            if (!prfCodigo || !prfVersion) {
              state.errorDetails.push({ row: i + 2, reason: "Falta PRF_CODIGO o PRF_VERSION" });
              state.errors++;
              state.percent = Math.round(((i + 1) / state.total) * 100);
              continue;
            }

            if (modalidad === "VIRTUAL") {
              state.skippedVirtual++;
              state.percent = Math.round(((i + 1) / state.total) * 100);
              continue;
            }

            const newCatalog = new ComplementaryCatalog({
              prfCodigo,
              // Guardar el código crudo del Excel como String para conservar ceros a la izquierda (búsqueda literal).
              prfCodigoStr: (prfCodigo ?? "").toString().trim(),
              prfVersion,
              codVer: (row.COD_VER || "").toString().toUpperCase().trim(),
              tipoFormacion: row.TIPO_DE_FORMACION || "",
              prfDenominacion: (row.PRF_DENOMINACION || "").toString().toUpperCase().trim(),
              nivelFormacion: row.NIVEL_DE_FORMACION || "",
              prfDuracionMaxima: parseNum(row.PRF_DURACION_MAXIMA),
              prfDurEtapaLectiva: parseNum(row.PRF_DUR_ETAPA_LECTIVA),
              prfDurEtapaProd: parseNum(row.PRF_DUR_ETAPA_PROD),
              prfFchRegistro: parseDate(row.PRF_FCH_REGISTRO),
              fechaActivoEnEjecucion: parseDate(row.FECHA_ACTIVO_EN_EJECUCION),
              prfEdadMinRequerida: row.PRF_EDAD_MIN_REQUERIDA ? parseNum(row.PRF_EDAD_MIN_REQUERIDA) : null,
              prfGradoMinRequerido: row.PRF_GRADO_MIN_REQUERIDO || "",
              prfDescripcionRequisito: row.PRF_DESCRIPCION_REQUISITO || "",
              prfResolucion: row.PRF_RESOLUCION === "(en blanco)" ? "" : (row.PRF_RESOLUCION || ""),
              prfFechaResolucion: parseDate(row.PRF_FECHA_RESOLUCION),
              prfApoyoFic: row.PRF_APOYO_FIC || "",
              prfCreditos: parseNum(row.PRF_CREDITOS),
              prfAlamedida: row.PRF_ALAMEDIDA || "",
              lineaTecnologica: row.LINEA_TECNOLOGICA || "",
              redTecnologica: row.RED_TECNOLOGICA || "",
              redConocimiento: row.RED_DE_CONOCIMIENTO || "",
              modalidad: row.MODALIDAD || "",
              apuestasPrioritarias: row.APUESTAS_PRIORITARIAS || "",
              fic: row.FIC || "",
            });
            await newCatalog.save();
            state.created++;
          } catch (error) {
            state.errorDetails.push({ row: i + 2, reason: error.message || "Error desconocido al guardar" });
            state.errors++;
          }
          state.percent = Math.round(((i + 1) / state.total) * 100);
        }

        await registerAction(
          "CATALOGO COMPLEMENTARIO",
          { event: "CARGA MASIVA EXCEL", data: { created: state.created, skippedVirtual: state.skippedVirtual, errors: state.errors, total: state.total } },
          token
        );

        const settings = await AppSettings.findOne();
        if (settings) {
          settings.catalogLastUploadDate = new Date();
          await settings.save();
        } else {
          await AppSettings.create({ catalogLastUploadDate: new Date() });
        }

        state.done = true;
        jobStore.scheduleCleanup(jobId);
      } catch (error) {
        console.log(error);
        state.done = true;
        state.failed = true;
        state.error = error.message || "Error desconocido en el procesamiento";
        jobStore.scheduleCleanup(jobId);
      }
    })();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//consultar progreso de la carga masiva por jobId
compCtrl.getUploadStatus = async (req, res) => {
  const { jobId } = req.params;
  try {
    const state = jobStore.getJob(jobId);
    if (!state) {
      return res.status(404).json({ msg: "Trabajo no encontrado o ya expirado" });
    }
    res.json(state);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== Extracción de competencias desde PDF (PRF — Diseño de Acciones de Formación Complementaria) ====================

compCtrl.extractCompetencies = async (req, res) => {
  // pdfPath se declara FUERA del try para que el finally pueda borrarlo en TODOS los caminos:
  // éxito, error de extracción o excepción en el helper de Node.js.
  let pdfPath;

  try {
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ msg: "No se ha subido ningún archivo PDF" });
    }

    pdfPath = path.resolve(req.files.pdf.tempFilePath);

    console.log(`[EXTRACT-COMP] Iniciando extracción de competencias desde PDF (Node.js)`);

    // Extracción 100% Node.js (pdfjs-dist) — ver helpers/complementary.helper.js (sección Extractor).
    // Reemplaza la invocación al script Python complementary_extractor.py, que se conserva
    // intacto en scripts/ pero deja de invocarse desde este endpoint.
    const extractedData = await complementaryExtractor.extractFromPdf(pdfPath);

    if (!extractedData) {
      return res.status(500).json({ msg: "No se extrajeron datos válidos del PDF" });
    }

    // Si el extractor reportó un error interno, propagarlo
    if (extractedData._error) {
      console.error('[EXTRACT-COMP] Error interno del extractor:', extractedData._error);
      return res.status(500).json({ msg: "No fue posible terminar la operacion" });
    }

    console.log(`[EXTRACT-COMP] Éxito. ${extractedData.competencies?.length || 0} competencias extraídas`);
    // IMPORTANTE: aquí solo se DEVUELVE el resultado al cliente (no se persiste en BD).
    // La persistencia ocurre después vía PUT /requests/:id/formation-data → normalizeCompetencies,
    // una vez el FRONT confirma las competencias extraídas.
    return res.json({ msg: "Competencias extraídas correctamente", data: extractedData });
  } catch (error) {
    // Cubre cualquier excepción en el helper de extracción.
    console.error('[EXTRACT-COMP ERROR]:', error.message);
    return res.status(500).json({ msg: "No fue posible terminar la operacion" });
  } finally {
    // Limpieza garantizada del PDF temporal en TODOS los caminos (éxito, error).
    if (pdfPath) {
      try {
        await fs.promises.unlink(pdfPath);
      } catch (e) {
        // Ya borrado o nunca existió: no es letal
      }
    }
  }
};

// ==================== Coordinador de complementarias ====================

compCtrl.getComplementaryCoordinator = async (req, res) => {
  try {
    const coordinator = await complementaryHelper.findComplementaryCoordinator();
    if (!coordinator) {
      return res.status(404).json({ msg: "Coordinador de complementarias no encontrado" });
    }
    await coordinator.populate("coordinations");
    res.json({ coordinator });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-03: Solicitudes de complementarias ====================

//register new complementary request — instructor solo llena datos básicos, coordinador completa después
compCtrl.registerRequest = async (req, res) => {
  const {
    catalogCourse,
    environment,
    formationDocument,
    prfDuracionMaxima,
    supervisor,
    instructores: instructoresIds,
    departamento,
    municipio,
    vereda,
    direccion,
    nombreEmpresa,
    nitEmpresa,
    contactoEmpresa,
    telefonoEmpresa,
    numAprendices,
    tipoPrograma,
    tipoPoblacion,
    requisitosIngreso,
    recursosNecesarios,
    competencies,
    outcomes,
    learningActivity,
    sesiones,
    proyectoAsociado,
    fechaInicio,
    fechaFin,
  } = req.body;
  try {
    const decoded = await webToken.decodeComplementariaToken(req.headers.token);
    const instructor = await complementaryHelper.findInstructorByEmail(
      decoded.email
    );
    if (!instructor) {
      return res.status(401).json({ msg: "Instructor no encontrado" });
    }

    const catalog = await ComplementaryCatalog.findById(catalogCourse);
    if (!catalog) {
      return res.status(400).json({ msg: "El curso del catálogo no existe" });
    }

    // Validar supervisor (ObjectId de User con rol COORDINADOR) si viene
    let supervisorNombre = "";
    if (supervisor) {
      const supervisorUser = await User.findOne({
        _id: supervisor,
        role: "COORDINADOR",
        status: 0,
      });
      if (!supervisorUser) {
        return res.status(400).json({ msg: "El supervisor seleccionado no es un coordinador válido" });
      }
      supervisorNombre = supervisorUser.name;
    }

    // Construir array de instructores: principal (desde JWT) + adicionales (desde body)
    const instructores = [{
      instructor: instructor._id,
      nombre: instructor.name || "",
      documento: instructor.numdocument || "",
      email: instructor.email || instructor.emailpersonal || "",
      esPrincipal: true,
    }];

    // Agregar instructores adicionales si vienen en el body
    if (Array.isArray(instructoresIds) && instructoresIds.length > 0) {
      for (const instId of instructoresIds) {
        // Evitar duplicar al instructor principal
        if (instId.toString() === instructor._id.toString()) continue;
        const instData = await Instructor.findById(instId);
        if (instData) {
          instructores.push({
            instructor: instData._id,
            nombre: instData.name || "",
            documento: instData.numdocument || "",
            email: instData.email || instData.emailpersonal || "",
            esPrincipal: false,
          });
        }
      }
    }

    const normalizedCompetencies = complementaryHelper.normalizeCompetencies(competencies);
    const derivedOutcomes = (
      (outcomes && outcomes.length > 0)
        ? outcomes
        : (competencies || []).flatMap((c) => c.resultados || [])
    ).map((o) => String(o).toUpperCase().trim());
    const mappedSesiones = (sesiones || []).map((s) => {
      const rawRes = s.resultados || s.resultado || [];
      const resultadosArray = Array.isArray(rawRes) ? rawRes : [rawRes];
      return {
        fecha: s.fecha || "",
        horaInicio: s.horaInicio || "",
        horaFin: s.horaFin || "",
        totalHoras: s.totalHoras || 0,
        instructor: s.instructor || instructor._id,
        competencia: (s.competencia || "").toUpperCase().trim(),
        resultados: resultadosArray.map((r) => String(r).toUpperCase().trim()),
        actividadAprendizaje: (s.actividadAprendizaje || "").toUpperCase().trim(),
      };
    });

    const maxDuracion = catalog.prfDuracionMaxima || prfDuracionMaxima || 0;
    complementaryHelper.validateSesionesHours(mappedSesiones, maxDuracion);

    const newRequest = new ComplementaryRequest({
      catalogCourse,
      catalogCourseName: catalog.prfDenominacion,
      catalogCourseCode: String(catalog.prfCodigo),
      catalogCourseVersion: String(catalog.prfVersion),
      prfDuracionMaxima: maxDuracion,
      instructor: instructor._id,
      instructores,
      ...complementaryHelper.normalizeRequestFields(req.body),
      // Sobreescribir supervisorNombre con el del usuario encontrado
      supervisorNombre,
      supervisor: supervisor || null,
      environment: environment || null,
      formationDocument: formationDocument || "",
      competencies: normalizedCompetencies,
      outcomes: derivedOutcomes,
      learningActivity: (learningActivity || "").toUpperCase().trim(),
      sesiones: mappedSesiones,
      // Fechas de inicio/fin las pone el instructor en el formulario de registro
      fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      // Inscripción y matrícula las asigna el admin en assignFicha
      fechaInscripcion: null,
      fechaMatriculaInicio: null,
      fechaMatriculaFin: null,
      numAprendices: numAprendices || 0,
      proyectoAsociado: (proyectoAsociado || "").toUpperCase().trim(),
    });

    // Generar numeroSolicitud consecutivo
    const count = await ComplementaryRequest.countDocuments();
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    newRequest.numeroSolicitud = `${String(count + 1).padStart(7, "0")}-${dateStr}`;

    newRequest.history.push({
      previousState: "",
      newState: "PENDIENTE",
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: "Solicitud creada",
    });

    await newRequest.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "REGISTRAR SOLICITUD",
        data: { id: newRequest._id, catalogCourseName: newRequest.catalogCourseName, instructor: decoded.email, instructores: instructores.length },
      },
      req.headers.token
    );

    const instructorName = instructor.name || decoded.email;
    const coordinator = await complementaryHelper.findComplementaryCoordinator();
    const programmers = await complementaryHelper.findComplementaryProgrammers();
    await notifyNewRequest(newRequest, instructorName);

    await newRequest.populate([
      { path: "catalogCourse" },
      { path: "instructor", select: "-password" },
      { path: "instructores.instructor", select: "-password" },
      { path: "environment", select: "name" }
    ]);

    res.json({
      msg: "Solicitud registrada correctamente",
      data: newRequest,
      notified: {
        coordinator: coordinator
          ? { name: coordinator.name, email: coordinator.email }
          : null,
        programmers: programmers.map((p) => ({ name: p.name, email: p.email })),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error.message || "No fue posible terminar la operacion" });
  }
};

//get all requests (admin ve todo, instructor solo las suyas)
compCtrl.getRequests = async (req, res) => {
  const { state, instructor, fichaNumber, sortBy, sortOrder, page, limit, q, orden } = req.query;
  try {
    const { isInstructor, ...decoded } = await webToken.decodeAnyToken(req.headers.token);

    const filter = { status: 0 };
    if (state) {
      // Soporta "APROBADA" o "APROBADA,PROGRAMADA" (múltiples estados separados por coma)
      const statesArray = state.split(',').map(s => s.trim()).filter(Boolean);
      filter.state = statesArray.length === 1 ? statesArray[0] : { $in: statesArray };
    }

    // Filtro por número de ficha (búsqueda parcial e insensible a mayúsculas)
    if (fichaNumber) {
      filter.fichaNumber = { $regex: String(fichaNumber).trim(), $options: "i" };
    }

    // Busqueda por nombre del curso (campo denormalizado catalogCourseName)
    const qTrim = (q || "").trim();
    if (qTrim) {
      filter.catalogCourseName = { $regex: qTrim, $options: "i" };
    }

    if (isInstructor || decoded.rol === "INSTRUCTOR") {
      const instructorDoc = await complementaryHelper.findInstructorByEmail(
        decoded.email
      );
      if (!instructorDoc) {
        return res.status(401).json({ msg: "Instructor no encontrado" });
      }
      // Buscar solicitudes donde el instructor es principal O está en el array de instructores
      filter.$or = [
        { instructor: instructorDoc._id },
        { "instructores.instructor": instructorDoc._id },
      ];
    } else {
      if (instructor) {
        // Admin filtra por instructor: buscar como principal o en el array
        filter.$or = [
          { instructor: instructor },
          { "instructores.instructor": instructor },
        ];
      }
    }

    // Configurar ordenamiento dinámico
    // orden (modo paginado): inicio_asc | inicio_desc mapea a fechaInicio
    const ordenMap = {
      inicio_asc: { fechaInicio: 1 },
      inicio_desc: { fechaInicio: -1 },
    };
    const sortOptions =
      page !== undefined && ordenMap[orden]
        ? ordenMap[orden]
        : (() => {
            const sortField = sortBy || "createdAt";
            const sortDir = sortOrder === "asc" ? 1 : -1;
            return { [sortField]: sortDir };
          })();

    // Modo paginado: solo admin (instructor sigue recibiendo todas las suyas sin paginar).
    // Se activa SOLO si llega page/limit y NO es instructor.
    const esModoPaginado = page !== undefined && !isInstructor && decoded.rol !== "INSTRUCTOR";

    let query = ComplementaryRequest.find(filter)
      .select("numeroSolicitud fichaNumber fichaCaracterizacion fechaInicio fechaFin catalogCourseName catalogCourseCode state municipio ambienteNombre instructor instructores environment visto createdAt")
      .populate("catalogCourse", "prfDenominacion prfCodigo prfVersion")
      .populate("instructor", "name email numdocument")
      .populate("instructores.instructor", "name email numdocument")
      .populate("environment", "name")
      .sort(sortOptions);

    if (esModoPaginado) {
      let pageNum = Number(page) || 1;
      let limitNum = Number(limit) || 10;
      if (pageNum < 1) pageNum = 1;
      if (limitNum < 1) limitNum = 10;
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);

      const [requests, total] = await Promise.all([
        query,
        ComplementaryRequest.countDocuments(filter),
      ]);

      return res.json({ data: requests, total, page: pageNum, limit: limitNum });
    }

    const requests = await query;
    res.json(requests);
  } catch (error) {
    res.status(400).json({ msg: error.message || "No fue posible terminar la operacion" });
  }
};

// Contadores de solicitudes por estado (para tabs del listado).
// Admin: todas. Instructor: solo las suyas (igual que getRequests).
compCtrl.getRequestCounts = async (req, res) => {
  try {
    const { isInstructor, ...decoded } = await webToken.decodeAnyToken(req.headers.token);

    const match = { status: 0 };
    if (isInstructor || decoded.rol === "INSTRUCTOR") {
      const instructorDoc = await complementaryHelper.findInstructorByEmail(decoded.email);
      if (!instructorDoc) {
        return res.status(401).json({ msg: "Instructor no encontrado" });
      }
      match.$or = [
        { instructor: instructorDoc._id },
        { "instructores.instructor": instructorDoc._id },
      ];
    }

    // Inicializar todos los estados del enum en 0 (las tabs sin docs también aparecen).
    const ESTADOS = [
      "PENDIENTE",
      "APROBADA",
      "RECHAZADA",
      "FICHA_ASIGNADA",
      "INSCRIPCION",
      "PROGRAMADA",
      "CANCELADA",
      "CERRADA",
    ];
    const counts = ESTADOS.reduce((acc, e) => {
      acc[e] = 0;
      return acc;
    }, {});

    const rows = await ComplementaryRequest.aggregate([
      { $match: match },
      { $group: { _id: "$state", count: { $sum: 1 } } },
    ]);
    for (const row of rows) {
      if (row._id) counts[row._id] = row.count;
    }

    res.json(counts);
  } catch (error) {
    res.status(400).json({ msg: error.message || "No fue posible terminar la operacion" });
  }
};

//get request by id (admin ve cualquiera, instructor solo las suyas)
compCtrl.getRequestId = async (req, res) => {
  const { id } = req.params;
  try {
    const { isInstructor, ...decoded } = await webToken.decodeAnyToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id)
      .populate("catalogCourse")
      .populate("instructor", "-password")
      .populate("instructores.instructor", "-password")
      .populate("supervisor", "name email")
      .populate("environment", "name");

    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    if (isInstructor || decoded.rol === "INSTRUCTOR") {
      const instructorDoc = await complementaryHelper.findInstructorByEmail(
        decoded.email
      );
      if (!instructorDoc) {
        return res.status(401).json({ msg: "No tiene permisos para ver esta solicitud" });
      }
      const isOwner = complementaryHelper.isInstructorInRequest(request, instructorDoc._id);
      if (!isOwner) {
        return res
          .status(401)
          .json({ msg: "No tiene permisos para ver esta solicitud" });
      }
    }

    if (!request.visto) {
      request.visto = true;
      await request.save();
    }

    res.json(request);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//get requests by instructor (from token)
compCtrl.getInstructorRequests = async (req, res) => {
  try {
    const decoded = await webToken.decodeComplementariaToken(req.headers.token);
    const instructor = await complementaryHelper.findInstructorByEmail(
      decoded.email
    );
    if (!instructor) {
      return res.status(401).json({ msg: "Instructor no encontrado" });
    }

    const requests = await ComplementaryRequest.find({
      $or: [
        { instructor: instructor._id },
        { "instructores.instructor": instructor._id },
      ],
      status: 0,
    })
      .select("numeroSolicitud fichaNumber fichaCaracterizacion fechaInicio fechaFin catalogCourseName catalogCourseCode state municipio ambienteNombre instructor instructores environment visto createdAt")
      .populate("catalogCourse", "prfDenominacion prfCodigo prfVersion")
      .populate("instructor", "name email numdocument")
      .populate("instructores.instructor", "name email numdocument")
      .populate("environment", "name")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//update request (only if RECHAZADA, only owner instructor)
compCtrl.updateRequest = async (req, res) => {
  const { id } = req.params;
  const {
    environment,
    formationDocument,
    competencies,
    outcomes,
    learningActivity,
    supervisorNombre,
    ambienteNombre,
    ambienteDireccion,
    fechaInicio,
    fechaFin,
    fechaInscripcion,
    fechaMatriculaInicio,
    fechaMatriculaFin,
    municipio,
    vereda,
    direccion,
    nombreEmpresa,
    nitEmpresa,
    contactoEmpresa,
    telefonoEmpresa,
    numAprendices,
    tipoPrograma,
    tipoPoblacion,
    requisitosIngreso,
    recursosNecesarios,
    proyectoAsociado,
  } = req.body;
  try {
    const decoded = await webToken.decodeComplementariaToken(req.headers.token);

    await ComplementaryRequest.findByIdAndUpdate(id, {
      ...complementaryHelper.normalizeRequestFields(req.body),
      environment: environment || null,
      formationDocument: formationDocument || "",
      competencies: complementaryHelper.normalizeCompetencies(competencies || []),
      outcomes: outcomes || [],
      fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      fechaInscripcion: fechaInscripcion || null,
      fechaMatriculaInicio: fechaMatriculaInicio || null,
      fechaMatriculaFin: fechaMatriculaFin || null,
      numAprendices: numAprendices || 0,
    });

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "EDITAR SOLICITUD RECHAZADA",
        data: { id, instructor: decoded.email },
      },
      req.headers.token
    );
    res.json({ msg: "Solicitud actualizada correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//resubmit request (RECHAZADA → PENDIENTE)
compCtrl.resubmitRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const decoded = await webToken.decodeComplementariaToken(req.headers.token);
    const request = await ComplementaryRequest.findById(id);

    request.state = "PENDIENTE";
    request.history.push({
      previousState: "RECHAZADA",
      newState: "PENDIENTE",
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: "Solicitud reenviada por el instructor",
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "REENVIAR SOLICITUD",
        data: { id, instructor: decoded.email },
      },
      req.headers.token
    );

    const instructor = await complementaryHelper.findInstructorByEmail(decoded.email);
    const instructorName = instructor?.name || decoded.email;
    await notifyResubmit(request, instructorName);

    res.json({ msg: "Solicitud reenviada correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-04: Aprobación de solicitudes ====================

//approve request — PENDIENTE → APROBADA + crear Program (solo COORDINADOR y ADMIN)
compCtrl.approveRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id);
    if (!request || request.state !== "PENDIENTE") {
      return res
        .status(400)
        .json({ msg: "La solicitud no existe o no está en estado PENDIENTE" });
    }

    request.state = "APROBADA";
    request.history.push({
      previousState: "PENDIENTE",
      newState: "APROBADA",
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: "Solicitud aprobada",
    });
    await request.save();

    const newProgram = new Program({
      code: request.catalogCourseCode,
      name: request.catalogCourseName,
      version: request.catalogCourseVersion,
    });
    await newProgram.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "APROBAR SOLICITUD",
        data: {
          id: request._id,
          catalogCourseName: request.catalogCourseName,
          approvedBy: decoded.email,
          programId: newProgram._id,
        },
      },
      req.headers.token
    );

    await notifyApproval(request);

    res.json({ msg: "Solicitud aprobada correctamente", data: request });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//reject request — PENDIENTE → RECHAZADA + observaciones obligatorias (solo COORDINADOR y ADMIN)
compCtrl.rejectRequest = async (req, res) => {
  const { id } = req.params;
  const { observations } = req.body;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id);
    if (!request || request.state !== "PENDIENTE") {
      return res
        .status(400)
        .json({ msg: "La solicitud no existe o no está en estado PENDIENTE" });
    }

    request.state = "RECHAZADA";
    request.history.push({
      previousState: "PENDIENTE",
      newState: "RECHAZADA",
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: observations.toUpperCase().trim(),
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "RECHAZAR SOLICITUD",
        data: {
          id: request._id,
          catalogCourseName: request.catalogCourseName,
          rejectedBy: decoded.email,
          observations,
        },
      },
      req.headers.token
    );

    await notifyRejection(request, observations);

    res.json({ msg: "Solicitud rechazada correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-05: Asignación de ficha y gestión de estados ====================

//get all coordinators for supervisor dropdown — cualquier token válido
compCtrl.getCoordinators = async (req, res) => {
  try {
    const coordinators = await complementaryHelper.findAllCoordinators();
    res.json(coordinators);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//assign ficha number to approved request — APROBADA → FICHA_ASIGNADA (solo ADMIN)
//Ahora también asigna las fechas del programa (antes las llenaba el instructor)
compCtrl.assignFicha = async (req, res) => {
  const { id } = req.params;
  const {
    codigoSolicitud,
    fichaCaracterizacion,
    fechaInicio,
    fechaFin,
    fechaInscripcion,
    fechaMatriculaInicio,
    fechaMatriculaFin,
    tipoPrograma,
    tipoPoblacion,
  } = req.body;
  let newFiche = null;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id);
    if (!request || request.state !== "APROBADA") {
      return res
        .status(400)
        .json({ msg: "La solicitud no existe o no está en estado APROBADA" });
    }

    // Normalizar y validar unicidad del número de ficha (fichaCaracterizacion) contra la colección Fiche
    const normalizedNumber = String(fichaCaracterizacion).toUpperCase().trim();
    await ficheHelper.uniqueNumberFiche(normalizedNumber);

    // Coordinación PROGRAMAS ESPECIALES — requerida por el modelo Fiche
    const coord = await coordinationHelper.findCoordinationByName(
      "PROGRAMAS ESPECIALES"
    );
    if (!coord) {
      return res
        .status(400)
        .json({ msg: "No existe la coordinación PROGRAMAS ESPECIALES" });
    }

    // Program creado en la aprobación (RF-04). Defensa: crearlo si no existe
    let dbProgram = await Program.findOne({
      code: request.catalogCourseCode,
      name: request.catalogCourseName,
    });
    if (!dbProgram) {
      dbProgram = await new Program({
        code: request.catalogCourseCode,
        name: request.catalogCourseName,
        version: request.catalogCourseVersion,
      }).save();
    }

    // Crear el Fiche vinculado a PROGRAMAS ESPECIALES antes de mutar el request
    // (si el guardado del request falla luego, se elimina el Fiche en el catch)
    newFiche = new Fiche({
      number: normalizedNumber,
      program: dbProgram._id,
      owner: request.instructor,
      coordination: coord._id,
      fstart: fechaInicio,
      fend: fechaFin,
    });
    await newFiche.save();

    request.fichaNumber = normalizedNumber;
    request.fichaCaracterizacion = normalizedNumber;
    request.codigoSolicitud = String(codigoSolicitud).toUpperCase().trim();
    if (tipoPrograma) request.tipoPrograma = tipoPrograma.trim();
    if (tipoPoblacion) request.tipoPoblacion = tipoPoblacion.trim();
    // Fechas del programa — asignadas por el admin en este paso
    request.fechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    request.fechaFin = fechaFin ? new Date(fechaFin) : null;
    request.fechaInscripcion = fechaInscripcion ? new Date(fechaInscripcion) : null;
    request.fechaMatriculaInicio = fechaMatriculaInicio ? new Date(fechaMatriculaInicio) : null;
    request.fechaMatriculaFin = fechaMatriculaFin ? new Date(fechaMatriculaFin) : null;
    request.state = "FICHA_ASIGNADA";
    request.history.push({
      previousState: "APROBADA",
      newState: "FICHA_ASIGNADA",
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: `Ficha asignada — ${request.numeroSolicitud}`,
    });
    await request.save();

    await registerAction(
      "FICHA",
      {
        event: "REGISTRAR FICHA COMPLEMENTARIA",
        data: newFiche,
      },
      req.headers.token
    );

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "ASIGNAR FICHA",
        data: {
          id: request._id,
          numeroSolicitud: request.numeroSolicitud,
          fichaNumber: request.fichaNumber,
          fichaCaracterizacion: request.fichaCaracterizacion,
          catalogCourseName: request.catalogCourseName,
          assignedBy: decoded.email,
          fechaInicio,
          fechaFin,
        },
      },
      req.headers.token
    );

    await notifyFichaAssigned(request);

    await request.populate([
      { path: "catalogCourse" },
      { path: "instructor", select: "-password" },
      { path: "instructores.instructor", select: "-password" },
      { path: "supervisor", select: "name email" },
      { path: "environment", select: "name" }
    ]);

    res.json({
      msg: "Ficha asignada correctamente",
      data: request,
      fiche: newFiche,
    });
  } catch (error) {
    // Rollback: el proyecto no usa transacciones Mongo, se elimina el Fiche si se creó
    if (newFiche?._id) {
      await Fiche.findByIdAndDelete(newFiche._id).catch(() => {});
    }
    console.log(error);
    if (error?.message === "El número de ficha ya existe") {
      return res.status(400).json({ msg: error.message });
    }
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== Coordinador completa datos de formación post-aprobación ====================

//coordinador agrega competencias, resultados, sesiones — marca formationDataCompleted = true
compCtrl.addFormationData = async (req, res) => {
  const { id } = req.params;
  const {
    competencies,
    outcomes,
    learningActivity,
    sesiones,
    proyectoAsociado,
    tipoPrograma,
    tipoPoblacion,
  } = req.body;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    // Verificar que se pueden agregar datos de formación
    if (request.state !== "APROBADA" && request.state !== "FICHA_ASIGNADA") {
      return res.status(400).json({
        msg: "La solicitud debe estar en estado APROBADA o FICHA_ASIGNADA para agregar datos de formación",
      });
    }

    if (request.formationDataCompleted) {
      return res.status(400).json({
        msg: "Los datos de formación ya fueron completados para esta solicitud",
      });
    }

    // Guardar datos de formación
    request.competencies = complementaryHelper.normalizeCompetencies(competencies);
    request.outcomes = outcomes.map((o) => o.toUpperCase().trim());
    request.learningActivity = (learningActivity || "").toUpperCase().trim();
    request.proyectoAsociado = (proyectoAsociado || "").toUpperCase().trim();
    
    if (tipoPrograma) request.tipoPrograma = tipoPrograma.trim();
    if (tipoPoblacion) request.tipoPoblacion = tipoPoblacion.trim();

    // Sesiones con campos expandidos (competencia + resultados + instructor por sesión)
    if (sesiones && sesiones.length > 0) {
      request.sesiones = sesiones.map((s) => {
        const rawRes = s.resultados || s.resultado || [];
        const resultadosArray = Array.isArray(rawRes) ? rawRes : [rawRes];
        return {
          fecha: s.fecha || "",
          horaInicio: s.horaInicio || "",
          horaFin: s.horaFin || "",
          totalHoras: s.totalHoras || 0,
          instructor: s.instructor || request.instructor,
          competencia: (s.competencia || "").toUpperCase().trim(),
          resultados: resultadosArray.map((r) => String(r).toUpperCase().trim()),
          actividadAprendizaje: (s.actividadAprendizaje || "").toUpperCase().trim(),
        };
      });
    }

    request.formationDataCompleted = true;
    request.history.push({
      previousState: request.state,
      newState: request.state,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: "Datos de formación completados por coordinador",
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "COMPLETAR DATOS DE FORMACIÓN",
        data: {
          id: request._id,
          numeroSolicitud: request.numeroSolicitud,
          catalogCourseName: request.catalogCourseName,
          competencias: competencies.length,
          resultados: outcomes.length,
          sesiones: sesiones ? sesiones.length : 0,
          completedBy: decoded.email,
        },
      },
      req.headers.token
    );

    await request.populate([
      { path: "catalogCourse" },
      { path: "instructor", select: "-password" },
      { path: "instructores.instructor", select: "-password" },
      { path: "supervisor", select: "name email" },
      { path: "environment", select: "name" }
    ]);

    res.json({
      msg: "Datos de formación guardados correctamente",
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//change state manually — avance de estados y cancelación (solo ADMIN)
compCtrl.changeState = async (req, res) => {
  const { id } = req.params;
  const { newState, observations } = req.body;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    const previousState = request.state;
    request.state = newState;
    request.history.push({
      previousState,
      newState,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: observations ? observations.toUpperCase().trim() : `Estado cambiado a ${newState}`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "CAMBIAR ESTADO SOLICITUD",
        data: {
          id: request._id,
          fichaNumber: request.fichaNumber,
          previousState,
          newState,
          changedBy: decoded.id,
          observations: observations || "",
        },
      },
      req.headers.token
    );

    // Enviar notificación por correo si la solicitud fue cancelada
    if (newState === "CANCELADA") {
      await notifyCancellation(request, previousState, observations || "");
    }

    // Notificación cuando la ficha pasa a EJECUCION
    if (newState === "EJECUCION") {
      await notifyExecution(request);
    }

    await request.populate([
      { path: "catalogCourse" },
      { path: "instructor", select: "-password" },
      { path: "instructores.instructor", select: "-password" },
      { path: "supervisor", select: "name email" },
      { path: "environment", select: "name" }
    ]);

    res.json({ msg: "Estado actualizado correctamente", data: request });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-12: Cierre de ficha complementaria ====================

compCtrl.closeFicha = async (req, res) => {
  const { id } = req.params;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    if (request.state !== "EJECUCION" && request.state !== "PROGRAMADA") {
      return res
        .status(400)
        .json({ msg: "La solicitud debe estar en estado EJECUCION o PROGRAMADA para poder cerrarla" });
    }

    // Buscar schedules asociados a esta solicitud
    const schedules = await Schedule.find({
      complementaryRequest: id,
      status: 0,
    });

    // Verificar que todos los outcomes esten evaluados
    const pendingSchedules = schedules.filter((s) => !s.rated);
    if (pendingSchedules.length > 0) {
      return res.status(400).json({
        msg: "Hay resultados de aprendizaje sin evaluar. No se puede cerrar la ficha",
        pending: pendingSchedules.map((s) => ({
          _id: s._id,
          outcome: s.outcome,
          tstart: s.tstart,
          tend: s.tend,
          days: s.days,
        })),
      });
    }

    // Todos evaluados — cerrar ficha
    const previousState = request.state;
    request.state = "CERRADA";
    request.history.push({
      previousState,
      newState: "CERRADA",
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: "Ficha complementaria cerrada — todos los resultados evaluados",
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "CERRAR FICHA COMPLEMENTARIA",
        data: {
          id: request._id,
          fichaNumber: request.fichaNumber,
          catalogCourseName: request.catalogCourseName,
          closedBy: decoded.email,
          totalSchedules: schedules.length,
        },
      },
      req.headers.token
    );

    await request.populate([
      { path: "catalogCourse" },
      { path: "instructor", select: "-password" },
      { path: "instructores.instructor", select: "-password" },
      { path: "supervisor", select: "name email" },
      { path: "environment", select: "name" }
    ]);

    res.json({
      msg: "Ficha complementaria cerrada correctamente",
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-08: Programación horaria complementaria ====================

compCtrl.scheduleComplementary = async (req, res) => {
  const { id } = req.params;
  const {
    instructor,
    environment,
    days,
    fstart,
    fend,
    tstart,
    tend,
    events,
    supporttext,
    observation,
  } = req.body;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    // 1. Validar que la solicitud sea programable
    const request = await complementaryScheduleHelper.validateRequestProgrammable(id);

    // 2. Validar que no exista ya un schedule activo para este instructor en esta solicitud
    await complementaryScheduleHelper.validateNoDuplicateInstructorSchedule(id, instructor);

    // 3. Validar disponibilidad del instructor contra TODA la colección Schedule
    await complementaryScheduleHelper.validateInstructorAvailability(
      instructor, fstart, fend, tstart, tend, days
    );

    // 4. Validar disponibilidad del ambiente (si viene) contra TODA la colección Schedule
    if (environment) {
      await complementaryScheduleHelper.validateEnvironmentAvailability(
        environment, fstart, fend, tstart, tend, days
      );
    }

    
    // 5. Calcular horas de trabajo
    const eventDates = events
      .filter((e) => e.idInstructor === instructor && e.autogenerated)
      .map((e) => e.start)
      .filter(Boolean);
    const hourswork = calculateNumHoursWork(tstart, tend, eventDates.length);

    // 6. Validar límite de horas del curso
    await complementaryScheduleHelper.validateHoursLimit(id, instructor, hourswork);

    // 7. Buscar el Program creado en RF-04
    const dbProgram = await Program.findOne({
      code: request.catalogCourseCode,
      name: request.catalogCourseName,
    });
    if (!dbProgram) {
      return res.status(400).json({
        msg: "No se encontró el programa asociado a esta solicitud. Verifique que la solicitud fue aprobada correctamente",
      });
    }

    // Vincular la ficha complementaria creada en assignFicha (búsqueda por número)
    const dbFiche = request.fichaNumber
      ? await Fiche.findOne({ number: request.fichaNumber, status: 0 })
      : null;

    // 8. Crear el Schedule complementario
    const newSchedule = new Schedule({
      fiche: dbFiche?._id || undefined,
      program: dbProgram._id,
      instructor,
      supporttext: (supporttext || "PLANEACIÓN COMPLEMENTARIA").toUpperCase().trim(),
      observation: (observation || "PROGRAMADO DESDE EL MÓDULO DE COMPLEMENTARIAS").toUpperCase().trim(),
      environment: environment || undefined,
      days,
      fstart: eventDates.length > 0 ? new Date(eventDates[0]) : new Date(fstart),
      fend: eventDates.length > 0 ? new Date(eventDates[eventDates.length - 1]) : new Date(fend),
      tstart,
      tend,
      hourswork,
      events: eventDates.map((d) => new Date(d)),
      scheduleType: "COMPLEMENTARIA",
      complementaryRequest: request._id,
      status: 0,
    });
    await newSchedule.save();

    // 9. Actualizar horas del instructor
    const dbInstructor = await Instructor.findById(instructor);
    if (dbInstructor) {
      dbInstructor.hourswork = (dbInstructor.hourswork || 0) + hourswork;
      await dbInstructor.save();
    }

    // 10. Avanzar estado si es necesario (solo desde MATRICULADA)
    if (request.state === "MATRICULADA") {
      const previousState = request.state;
      request.state = "PROGRAMADA";
      request.history.push({
        previousState,
        newState: "PROGRAMADA",
        changedBy: decoded.id,
        changedByRole: decoded.rol,
        observations: "Estado avanzado automáticamente al programar horario",
      });
      await request.save();
    }

    // 11. Notificar al instructor por correo
    await notifyScheduled(request, newSchedule);

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "PROGRAMAR HORARIO COMPLEMENTARIO",
        data: {
          scheduleId: newSchedule._id,
          requestId: request._id,
          fichaNumber: request.fichaNumber,
          catalogCourseName: request.catalogCourseName,
          hourswork,
          programmedBy: decoded.email,
        },
      },
      req.headers.token
    );

    res.json({
      msg: "Horario complementario programado correctamente",
      data: newSchedule,
    });
  } catch (error) {
    console.log(error);
    if (
      error.message.includes("programación") ||
      error.message.includes("ambiente") ||
      error.message.includes("solicitud") ||
      error.message.includes("horas") ||
      error.message.includes("programa")
    ) {
      return res.status(400).json({ msg: error.message });
    }
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-12: Evaluación de resultados (rated) ====================

// Obtener schedules de una solicitud con su estado de evaluación
compCtrl.getRequestSchedules = async (req, res) => {
  const { id } = req.params;
  try {
    const schedules = await Schedule.find({
      complementaryRequest: id,
      status: 0,
    })
      .populate("instructor", "name email numdocument")
      .populate("environment", "name")
      .sort({ fstart: 1 });

    const totalSchedules = schedules.length;
    const rated = schedules.filter((s) => s.rated).length;
    const pending = totalSchedules - rated;

    res.json({ totalSchedules, rated, pending, data: schedules });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Horarios consolidados de un instructor, clasificados por tipo (titulada, complementaria, otros).
// El frontend usa este endpoint para mostrar la carga horaria completa del instructor sin
// importar el origen del horario. Schedule agrupa titulada + complementaria (diferenciadas por
// scheduleType); los "otros" viven en la colección OtherSchedules.
compCtrl.getInstructorAllSchedules = async (req, res) => {
  const { instructorId } = req.params;
  try {
    // Titulada: horarios del programa regular del instructor.
    const titulada = await Schedule.find({
      instructor: instructorId,
      scheduleType: "TITULADA",
      status: 0,
    })
      .populate("instructor", "name email numdocument")
      .populate("environment", "name")
      .populate("fiche", "number program")
      .sort({ fstart: 1 });

    // Complementaria: horarios derivados de una solicitud de complementaria.
    const complementaria = await Schedule.find({
      instructor: instructorId,
      scheduleType: "COMPLEMENTARIA",
      status: 0,
    })
      .populate("instructor", "name email numdocument")
      .populate("environment", "name")
      .populate("complementaryRequest", "fichaNumber catalogCourseName")
      .sort({ fstart: 1 });

    // Otros: actividades externas/contractuales (colección aparte, sin ambiente ni ficha).
    const otros = await OtherSchedules.find({
      instructor: instructorId,
      status: 0,
    }).sort({ fstart: 1 });

    res.json({
      titulada,
      complementaria,
      otros,
      total: titulada.length + complementaria.length + otros.length,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Marcar un schedule individual como evaluado (rated)
compCtrl.rateSchedule = async (req, res) => {
  const { id, scheduleId } = req.params;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    // Validar que la solicitud está en EJECUCION o PROGRAMADA
    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }
    if (request.state !== "EJECUCION" && request.state !== "PROGRAMADA") {
      return res.status(400).json({
        msg: "La solicitud debe estar en estado EJECUCION o PROGRAMADA para evaluar resultados",
      });
    }

    // Validar que el schedule pertenece a esta solicitud y no está evaluado
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      complementaryRequest: id,
      status: 0,
    });
    if (!schedule) {
      return res.status(400).json({ msg: "El horario no existe o no pertenece a esta solicitud" });
    }
    if (schedule.rated) {
      return res.status(400).json({ msg: "El resultado ya fue evaluado" });
    }

    // Marcar como evaluado
    schedule.rated = true;
    schedule.dateRating = new Date();
    schedule.statusRating = "Calificado";
    schedule.ratedByProcess = "manual_complementary";
    await schedule.save();

    // Registrar en history de la solicitud
    request.history.push({
      previousState: request.state,
      newState: request.state,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: `Resultado evaluado — Schedule ${scheduleId}`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "EVALUAR RESULTADO",
        data: {
          requestId: id,
          scheduleId,
          fichaNumber: request.fichaNumber,
          evaluatedBy: decoded.email,
        },
      },
      req.headers.token
    );

    res.json({
      msg: "Resultado evaluado correctamente",
      data: schedule,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Marcar TODOS los schedules de una solicitud como evaluados
compCtrl.rateAllSchedules = async (req, res) => {
  const { id } = req.params;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    // Validar que la solicitud está en EJECUCION o PROGRAMADA
    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }
    if (request.state !== "EJECUCION" && request.state !== "PROGRAMADA") {
      return res.status(400).json({
        msg: "La solicitud debe estar en estado EJECUCION o PROGRAMADA para evaluar resultados",
      });
    }

    // Marcar todos los schedules pendientes como evaluados
    const result = await Schedule.updateMany(
      { complementaryRequest: id, status: 0, rated: { $ne: true } },
      {
        $set: {
          rated: true,
          dateRating: new Date(),
          statusRating: "Calificado",
          ratedByProcess: "manual_complementary_bulk",
        },
      }
    );

    // Registrar en history de la solicitud
    request.history.push({
      previousState: request.state,
      newState: request.state,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: `Evaluación masiva — ${result.modifiedCount} resultados evaluados`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "EVALUAR TODOS LOS RESULTADOS",
        data: {
          requestId: id,
          fichaNumber: request.fichaNumber,
          evaluatedBy: decoded.email,
          totalModified: result.modifiedCount,
        },
      },
      req.headers.token
    );

    res.json({
      msg: `${result.modifiedCount} resultados evaluados correctamente`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-12: Subida de eventos mensuales ====================

// Agregar eventos mensuales al schedule de una solicitud en EJECUCION
compCtrl.addEvents = async (req, res) => {
  const { id } = req.params;
  const { eventos } = req.body;
  try {
    // 1. Determinar quién hace la petición (admin o instructor)
    const { isInstructor, ...decoded } = await webToken.decodeAnyToken(req.headers.token);

    // 2. Validar que la solicitud está en EJECUCION
    const request = await complementaryScheduleHelper.validateRequestInExecutionForEvents(id);

    // 3. Si es instructor, validar que pertenece a la solicitud (principal o co-instructor)
    if (isInstructor || decoded.rol === "INSTRUCTOR") {
      const instructor = await complementaryHelper.findInstructorByEmail(decoded.email);
      if (!instructor) {
        return res.status(401).json({ msg: "No tiene permisos para agregar eventos a esta solicitud" });
      }
      const isOwner = complementaryHelper.isInstructorInRequest(request, instructor._id);
      if (!isOwner) {
        return res.status(401).json({ msg: "No tiene permisos para agregar eventos a esta solicitud" });
      }
    }

    // 4. Buscar schedule activo de la solicitud
    const schedule = await complementaryScheduleHelper.findActiveScheduleForRequest(id);

    // 5. Validar que las fechas son válidas y están dentro del rango
    if (!eventos || !Array.isArray(eventos) || eventos.length === 0) {
      return res.status(400).json({ msg: "Los eventos son obligatorios y deben ser un array no vacío" });
    }
    complementaryScheduleHelper.validateEventDates(eventos, schedule);

    // 6. Filtrar duplicados (comparar solo la fecha sin hora)
    const existingDates = new Set(
      schedule.events.map((e) => e.toISOString().split("T")[0])
    );
    const nuevosEventos = eventos.filter((ev) => {
      const dateStr = new Date(ev).toISOString().split("T")[0];
      return !existingDates.has(dateStr);
    });

    if (nuevosEventos.length === 0) {
      return res.json({ msg: "Todos los eventos ya existen en el schedule", added: 0 });
    }

    // 7. Agregar nuevos eventos al array existente
    schedule.events.push(...nuevosEventos.map((e) => new Date(e)));

    // 8. Recalcular horas de trabajo
    const previousHours = schedule.hourswork || 0;
    const newHours = calculateNumHoursWork(schedule.tstart, schedule.tend, schedule.events.length);
    schedule.hourswork = newHours;
    await schedule.save();

    // 9. Actualizar horas del instructor (diferencia)
    const diferencia = newHours - previousHours;
    if (diferencia !== 0) {
      const dbInstructor = await Instructor.findById(schedule.instructor);
      if (dbInstructor) {
        dbInstructor.hourswork = Math.max(0, (dbInstructor.hourswork || 0) + diferencia);
        await dbInstructor.save();
      }
    }

    // 10. Registrar en history de la solicitud
    request.history.push({
      previousState: request.state,
      newState: request.state,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: `Eventos agregados: ${nuevosEventos.length} nuevos (total: ${schedule.events.length})`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "AGREGAR EVENTOS MENSUALES",
        data: {
          requestId: id,
          fichaNumber: request.fichaNumber,
          addedEvents: nuevosEventos.length,
          totalEvents: schedule.events.length,
          addedBy: decoded.email || "instructor",
          previousHours,
          newHours,
        },
      },
      req.headers.token
    );

    res.json({
      msg: `${nuevosEventos.length} eventos agregados correctamente`,
      added: nuevosEventos.length,
      duplicatesSkipped: eventos.length - nuevosEventos.length,
      totalEvents: schedule.events.length,
      previousHours,
      newHours,
    });
  } catch (error) {
    console.log(error);
    if (
      error.message.includes("EJECUCION") ||
      error.message.includes("no existe") ||
      error.message.includes("horario") ||
      error.message.includes("Fechas inválidas") ||
      error.message.includes("Fuera del rango")
    ) {
      return res.status(400).json({ msg: error.message });
    }
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Obtener resumen de eventos por mes de una solicitud
compCtrl.getEventsSummary = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    const schedule = await Schedule.findOne({
      complementaryRequest: id,
      status: 0,
    });

    if (!schedule) {
      return res.json({
        fichaNumber: request.fichaNumber || "",
        catalogCourseName: request.catalogCourseName,
        totalHorasProgramadas: 0,
        totalHorasEjecutadas: 0,
        horasRestantes: 0,
        eventosPorMes: [],
        msg: "No hay horario programado para esta solicitud",
      });
    }

    // Calcular horas por cada evento (horas diarias = diferencia entre tstart y tend)
    const horasPorEvento = calculateNumHoursWork(schedule.tstart, schedule.tend, 1);

    // Agrupar eventos por mes
    const eventosPorMes = {};
    for (const event of schedule.events) {
      const d = new Date(event);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!eventosPorMes[key]) {
        eventosPorMes[key] = {
          mes: d.getUTCMonth() + 1,
          anio: d.getUTCFullYear(),
          totalEventos: 0,
          horas: 0,
        };
      }
      eventosPorMes[key].totalEventos++;
      eventosPorMes[key].horas += horasPorEvento;
    }

    // Convertir a array ordenado por fecha
    const eventosArray = Object.values(eventosPorMes).sort((a, b) => {
      if (a.anio !== b.anio) return a.anio - b.anio;
      return a.mes - b.mes;
    });

    // Redondear horas
    eventosArray.forEach((m) => {
      m.horas = Math.round(m.horas * 100) / 100;
    });

    const totalHorasEjecutadas = Math.round(schedule.events.length * horasPorEvento * 100) / 100;
    const horasRestantes = request.prfDuracionMaxima
      ? Math.round((request.prfDuracionMaxima - totalHorasEjecutadas) * 100) / 100
      : 0;

    res.json({
      fichaNumber: request.fichaNumber || "",
      catalogCourseName: request.catalogCourseName,
      fechaInicio: schedule.fstart,
      fechaFin: schedule.fend,
      totalHorasProgramadas: request.prfDuracionMaxima || schedule.hourswork,
      totalHorasEjecutadas,
      horasRestantes: Math.max(0, horasRestantes),
      totalEventos: schedule.events.length,
      eventosPorMes: eventosArray,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-12: Solicitud de ampliación de ficha ====================

// Instructor solicita ampliación de fecha fin
compCtrl.requestExtension = async (req, res) => {
  const { id } = req.params;
  const { newFechaFin, reason } = req.body;
  try {
    const decoded = await webToken.decodeComplementariaToken(req.headers.token);

    // 1. Validar que la solicitud existe y está en EJECUCION
    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }
    if (request.state !== "EJECUCION") {
      return res.status(400).json({
        msg: "La solicitud debe estar en estado EJECUCION para solicitar ampliación",
      });
    }

    // 2. Validar que el instructor pertenece a la solicitud (principal o co-instructor)
    const instructor = await complementaryHelper.findInstructorByEmail(decoded.email);
    if (!instructor) {
      return res.status(401).json({ msg: "No tiene permisos para solicitar ampliación en esta ficha" });
    }
    const isOwner = complementaryHelper.isInstructorInRequest(request, instructor._id);
    if (!isOwner) {
      return res.status(401).json({ msg: "No tiene permisos para solicitar ampliación en esta ficha" });
    }

    // 3. Validar que newFechaFin es posterior a fechaFin actual
    if (new Date(newFechaFin) <= new Date(request.fechaFin)) {
      return res.status(400).json({
        msg: "La nueva fecha de fin debe ser posterior a la fecha de fin actual",
      });
    }

    // 4. Validar que no hay otra solicitud de ampliación pendiente
    const hasPending = request.extensionRequests.some((ext) => ext.status === "PENDIENTE");
    if (hasPending) {
      return res.status(400).json({
        msg: "Ya existe una solicitud de ampliación pendiente para esta ficha",
      });
    }

    // 5. Crear la solicitud de ampliación
    request.extensionRequests.push({
      requestedBy: instructor._id,
      newFechaFin: new Date(newFechaFin),
      reason: reason.toUpperCase().trim(),
      status: "PENDIENTE",
    });

    // 6. Registrar en history
    request.history.push({
      previousState: request.state,
      newState: request.state,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: `Solicitud de ampliación — nueva fecha fin: ${new Date(newFechaFin).toLocaleDateString("es-CO")}`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "SOLICITAR AMPLIACIÓN",
        data: {
          requestId: id,
          fichaNumber: request.fichaNumber,
          instructor: decoded.email,
          currentFechaFin: request.fechaFin,
          newFechaFin,
          reason,
        },
      },
      req.headers.token
    );

    res.json({
      msg: "Solicitud de ampliación registrada correctamente",
      extensionRequest: request.extensionRequests[request.extensionRequests.length - 1],
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Admin/Coordinador resuelve solicitud de ampliación (aprobar o rechazar)
compCtrl.resolveExtension = async (req, res) => {
  const { id, extId } = req.params;
  const { status, observations } = req.body;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    // 1. Buscar solicitud y extensión
    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    const extension = request.extensionRequests.id(extId);
    if (!extension) {
      return res.status(400).json({ msg: "La solicitud de ampliación no existe" });
    }
    if (extension.status !== "PENDIENTE") {
      return res.status(400).json({ msg: "La solicitud de ampliación ya fue resuelta" });
    }

    // 2. Resolver
    extension.status = status;
    extension.resolvedBy = decoded.id;
    extension.resolvedDate = new Date();
    extension.resolvedObservations = (observations || "").toUpperCase().trim();

    // 3. Si se APRUEBA, actualizar fechaFin en la solicitud y en el Schedule
    if (status === "APROBADA") {
      request.fechaFin = extension.newFechaFin;

      // Actualizar fend del Schedule asociado
      const schedule = await Schedule.findOne({
        complementaryRequest: id,
        status: 0,
      });
      if (schedule) {
        schedule.fend = extension.newFechaFin;
        await schedule.save();
      }
    }

    // 4. Registrar en history
    request.history.push({
      previousState: request.state,
      newState: request.state,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: `Ampliación ${status} — ${observations || "Sin observaciones"}`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: `AMPLIACIÓN ${status}`,
        data: {
          requestId: id,
          fichaNumber: request.fichaNumber,
          extId,
          resolvedBy: decoded.email,
          newFechaFin: extension.newFechaFin,
          observations: observations || "",
        },
      },
      req.headers.token
    );

    res.json({
      msg: `Solicitud de ampliación ${status === "APROBADA" ? "aprobada" : "rechazada"} correctamente`,
      extensionRequest: extension,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Obtener historial de solicitudes de ampliación
compCtrl.getExtensionRequests = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await ComplementaryRequest.findById(id)
      .select("extensionRequests fichaNumber numeroSolicitud catalogCourseName fechaFin");

    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    res.json({
      fichaNumber: request.fichaNumber,
      numeroSolicitud: request.numeroSolicitud,
      catalogCourseName: request.catalogCourseName,
      fechaFinActual: request.fechaFin,
      extensionRequests: request.extensionRequests,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-10: Reportes ====================

compCtrl.getFichasSinRuta = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  try {
    const filter = {
      state: { $in: ["FICHA_ASIGNADA", "INSCRIPCION"] },
      status: 0,
    };
    if (fechaInicio || fechaFin) {
      filter.fechaInicio = {};
      if (fechaInicio) filter.fechaInicio.$gte = new Date(fechaInicio);
      if (fechaFin) filter.fechaInicio.$lte = new Date(fechaFin);
    }

    const solicitudes = await ComplementaryRequest.find(filter)
      .populate("instructor", "name email numdocument")
      .populate("instructores.instructor", "name email numdocument")
      .sort({ createdAt: -1 });

    const solicitudesIds = solicitudes.map((s) => s._id);
    const schedules = await Schedule.find({
      complementaryRequest: { $in: solicitudesIds },
      status: 0,
    }).select("complementaryRequest");

    const conSchedule = new Set(schedules.map((s) => s.complementaryRequest.toString()));
    const fichasSinRuta = solicitudes.filter(
      (s) => !conSchedule.has(s._id.toString())
    );

    res.json({
      msg: "Reporte generado correctamente",
      total: fichasSinRuta.length,
      data: fichasSinRuta,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.getProyeccionMensual = async (req, res) => {
  const { mes, anio } = req.query;
  try {
    const anioNum = Number(anio) || new Date().getFullYear();
    const mesNum = Number(mes);

    const matchStage = {
      status: 0,
      state: { $nin: ["RECHAZADA", "CANCELADA"] },
    };

    if (mesNum >= 1 && mesNum <= 12) {
      const inicio = new Date(anioNum, mesNum - 1, 1);
      const fin = new Date(anioNum, mesNum, 0, 23, 59, 59);
      matchStage.fechaInicio = { $gte: inicio, $lte: fin };
    } else {
      const inicio = new Date(anioNum, 0, 1);
      const fin = new Date(anioNum, 11, 31, 23, 59, 59);
      matchStage.fechaInicio = { $gte: inicio, $lte: fin };
    }

    const proyeccion = await ComplementaryRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            mes: { $month: "$fechaInicio" },
            anio: { $year: "$fechaInicio" },
            estado: "$state",
          },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { "_id.anio": 1, "_id.mes": 1 } },
    ]);

    res.json({
      msg: "Reporte generado correctamente",
      anio: anioNum,
      data: proyeccion,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.getFichasPorEstado = async (req, res) => {
  const { estado } = req.query;

  // Prevenir colapso: estado es obligatorio para no descargar toda la colección
  if (!estado) {
    return res.status(400).json({ msg: "El parámetro 'estado' es obligatorio" });
  }

  try {
    const matchStage = { status: 0, state: estado };

    const fichas = await ComplementaryRequest.find(matchStage)
      .populate("instructor", "name email numdocument")
      .populate("instructores.instructor", "name email numdocument")
      .select("fichaNumber catalogCourseName catalogCourseCode state fechaInicio fechaFin instructor instructores")
      .sort({ createdAt: -1 });

    const resumen = await ComplementaryRequest.aggregate([
      { $match: { status: 0 } },
      { $group: { _id: "$state", cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
    ]);

    res.json({
      msg: "Reporte generado correctamente",
      resumen,
      total: fichas.length,
      data: fichas,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.getHorasPorMes = async (req, res) => {
  const { instructor, mes, anio } = req.query;
  try {
    const anioNum = Number(anio) || new Date().getFullYear();
    const mesNum = Number(mes);

    const scheduleFilter = {
      scheduleType: "COMPLEMENTARIA",
      status: 0,
    };

    if (instructor) scheduleFilter.instructor = instructor;

    if (mesNum >= 1 && mesNum <= 12) {
      const inicio = new Date(anioNum, mesNum - 1, 1);
      const fin = new Date(anioNum, mesNum, 0, 23, 59, 59);
      scheduleFilter.fstart = { $gte: inicio, $lte: fin };
    } else {
      const inicio = new Date(anioNum, 0, 1);
      const fin = new Date(anioNum, 11, 31, 23, 59, 59);
      scheduleFilter.fstart = { $gte: inicio, $lte: fin };
    }

    const schedules = await Schedule.find(scheduleFilter)
      .populate("instructor", "name email numdocument")
      .populate("complementaryRequest", "catalogCourseName fichaNumber prfDuracionMaxima");

    const porInstructor = {};
    for (const schedule of schedules) {
      const instId = schedule.instructor?._id?.toString();
      if (!instId) continue;
      if (!porInstructor[instId]) {
        porInstructor[instId] = {
          instructor: schedule.instructor,
          horasTotales: 0,
          fichas: [],
        };
      }
      porInstructor[instId].horasTotales += schedule.hourswork || 0;
      porInstructor[instId].fichas.push({
        fichaNumber: schedule.complementaryRequest?.fichaNumber || "",
        curso: schedule.complementaryRequest?.catalogCourseName || "",
        horas: schedule.hourswork || 0,
        fechaInicio: schedule.fstart,
        fechaFin: schedule.fend,
      });
    }

    const data = Object.values(porInstructor);

    res.json({
      msg: "Reporte generado correctamente",
      anio: anioNum,
      mes: mesNum || "Todos",
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.getDashboardSummary = async (req, res) => {
  try {
    // 1. Fichas sin ruta (solicitudes en estado FICHA_ASIGNADA o INSCRIPCION sin Schedule activo)
    const solicitudesSinRuta = await ComplementaryRequest.find({
      state: { $in: ["FICHA_ASIGNADA", "INSCRIPCION"] },
      status: 0,
    }).select("_id");
    const solicitudesSinRutaIds = solicitudesSinRuta.map((s) => s._id);
    const schedulesConRuta = await Schedule.find({
      complementaryRequest: { $in: solicitudesSinRutaIds },
      status: 0,
    }).select("complementaryRequest");
    const conScheduleIds = new Set(schedulesConRuta.map((s) => s.complementaryRequest.toString()));
    const fichasSinRutaCount = solicitudesSinRuta.filter(
      (s) => !conScheduleIds.has(s._id.toString())
    ).length;

    // 2. Juicios / Resultados pendientes y calificados en schedules complementarios
    const juiciosPendientesCount = await Schedule.countDocuments({
      scheduleType: "COMPLEMENTARIA",
      status: 0,
      rated: { $ne: true }
    });
    const juiciosCalificadosCount = await Schedule.countDocuments({
      scheduleType: "COMPLEMENTARIA",
      status: 0,
      rated: true
    });

    // 3. Fichas activas y cerradas
    const totalFichasActivas = await ComplementaryRequest.countDocuments({
      status: 0,
      state: { $nin: ["RECHAZADA", "CANCELADA", "CERRADA"] }
    });
    const totalFichasCerradas = await ComplementaryRequest.countDocuments({
      status: 0,
      state: "CERRADA"
    });

    // 4. Horas totales programadas y evaluadas (en schedules de tipo COMPLEMENTARIA)
    const hoursAggregate = await Schedule.aggregate([
      {
        $match: {
          scheduleType: "COMPLEMENTARIA",
          status: 0
        }
      },
      {
        $group: {
          _id: null,
          totalHoras: { $sum: "$hourswork" },
          totalHorasEvaluadas: {
            $sum: {
              $cond: [{ $eq: ["$rated", true] }, "$hourswork", 0]
            }
          }
        }
      }
    ]);
    const totalHorasProgramadas = Math.round((hoursAggregate[0]?.totalHoras || 0) * 100) / 100;
    const totalHorasCalificadas = Math.round((hoursAggregate[0]?.totalHorasEvaluadas || 0) * 100) / 100;

    // 5. Distribución de fichas por estado (todas las solicitudes con status: 0)
    const fichasPorEstado = await ComplementaryRequest.aggregate([
      { $match: { status: 0 } },
      { $group: { _id: "$state", cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } }
    ]);
    const formattedFichasPorEstado = fichasPorEstado.map(f => ({
      estado: f._id,
      cantidad: f.cantidad
    }));

    // 6. Proyección mensual (fichas que inician agrupadas por mes/año, excluye RECHAZADA y CANCELADA)
    const proyeccion = await ComplementaryRequest.aggregate([
      {
        $match: {
          status: 0,
          state: { $nin: ["RECHAZADA", "CANCELADA"] },
          fechaInicio: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            mes: { $month: "$fechaInicio" },
            anio: { $year: "$fechaInicio" }
          },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { "_id.anio": 1, "_id.mes": 1 } }
    ]);
    const formattedProyeccion = proyeccion.map(p => ({
      mes: p._id.mes,
      anio: p._id.anio,
      cantidad: p.cantidad
    }));

    // 7. Ranking de instructores por horas en complementarias (Top 5)
    const topInstructores = await Schedule.aggregate([
      {
        $match: {
          scheduleType: "COMPLEMENTARIA",
          status: 0
        }
      },
      {
        $group: {
          _id: "$instructor",
          horasTotales: { $sum: "$hourswork" },
          fichasCount: { $addToSet: "$complementaryRequest" }
        }
      },
      { $sort: { horasTotales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "instructors",
          localField: "_id",
          foreignField: "_id",
          as: "instructorData"
        }
      },
      { $unwind: "$instructorData" },
      {
        $project: {
          _id: 1,
          horasTotales: 1,
          fichasCount: { $size: "$fichasCount" },
          name: "$instructorData.name",
          email: "$instructorData.email",
          numdocument: "$instructorData.numdocument"
        }
      }
    ]);

    topInstructores.forEach(ti => {
      ti.horasTotales = Math.round(ti.horasTotales * 100) / 100;
    });

    res.json({
      success: true,
      msg: "Resumen de dashboard generado correctamente",
      summary: {
        fichasSinRuta: fichasSinRutaCount,
        juiciosPendientes: juiciosPendientesCount,
        juiciosCalificados: juiciosCalificadosCount,
        totalFichasActivas,
        totalFichasCerradas,
        totalHorasProgramadas,
        totalHorasCalificadas
      },
      fichasPorEstado: formattedFichasPorEstado,
      proyeccionMensual: formattedProyeccion,
      topInstructoresHoras: topInstructores
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible generar el resumen del dashboard" });
  }
};

// ==================== RF-10: Reprogramacion de ficha ====================

compCtrl.rescheduleFicha = async (req, res) => {
  const { id } = req.params;
  const { fstart, fend, tstart, tend, days, events } = req.body;
  try {
    const decoded = webToken.decodeToken(req.headers.token);

    // 1. Carga y validaciones iniciales (igual que antes)
    const schedule = await Schedule.findById(id);
    if (!schedule || schedule.status !== 0) {
      return res.status(400).json({ msg: "El horario no existe o esta inactivo" });
    }
    if (schedule.scheduleType !== "COMPLEMENTARIA") {
      return res.status(400).json({ msg: "Solo se pueden reprogramar horarios complementarios" });
    }

    // 2. Regla de negocio: no se retrocede la fecha de inicio original (igual que antes)
    const newFstart = new Date(fstart);
    if (newFstart < schedule.fstart) {
      return res.status(400).json({
        msg: "La nueva fecha de inicio no puede ser anterior a la fecha de inicio original",
      });
    }

    // 3. Cargar el request vinculado (para límite de horas e historial real)
    if (!schedule.complementaryRequest) {
      return res.status(400).json({ msg: "El horario no tiene solicitud complementaria asociada" });
    }
    const request = await ComplementaryRequest.findById(schedule.complementaryRequest);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud complementaria asociada no existe" });
    }

    // 4. Filtrar eventos con el MISMO criterio que scheduleComplementary y updateSchedule
    //    (idInstructor === instructor del schedule Y autogenerated) para calcular horas reales
    const eventDates = (events || [])
      .filter((e) => e.idInstructor == schedule.instructor && e.autogenerated)
      .map((e) => e.start)
      .filter(Boolean);

    //    Rango efectivo del schedule (mismo criterio que scheduleComplementary: si hay
    //    eventos, derivar de la primera/última fecha real de clase; si no, del body).
    //    Este rango es el que también se sincroniza con request.fechaInicio/fechaFin,
    //    ya que ambos representan el rango real de clases de la ficha.
    const effectiveFstart =
      eventDates.length > 0 ? new Date(eventDates[0]) : new Date(fstart);
    const effectiveFend =
      eventDates.length > 0
        ? new Date(eventDates[eventDates.length - 1])
        : new Date(fend);

    // 5. Disponibilidad del instructor contra TODA la colección Schedule (excluyéndose)
    await complementaryScheduleHelper.validateInstructorAvailability(
      schedule.instructor, fstart, fend, tstart, tend, days, id
    );

    // 6. Disponibilidad del ambiente (si el schedule ya tiene uno; no cambia en reschedule)
    if (schedule.environment) {
      await complementaryScheduleHelper.validateEnvironmentAvailability(
        schedule.environment, fstart, fend, tstart, tend, days, id
      );
    }

    // 7. Horas nuevas con el conteo correcto de eventos
    const newHours = calculateNumHoursWork(tstart, tend, eventDates.length);

    // 8. Límite de horas del curso (excluyendo el propio schedule para no duplicar)
    await complementaryScheduleHelper.validateHoursLimit(
      schedule.complementaryRequest, schedule.instructor, newHours, id
    );

    // 9. Mutación: guardar events como [Date] (alineado al modelo) y recalcular hourswork
    const previousHours = schedule.hourswork || 0;
    schedule.fstart = effectiveFstart;
    schedule.fend = effectiveFend;
    schedule.tstart = tstart;
    schedule.tend = tend;
    schedule.days = days;
    schedule.events = eventDates.map((d) => new Date(d));
    schedule.hourswork = newHours;
    await schedule.save();

    // 10. Ajustar horas del instructor por diferencia (igual que antes, lógica correcta)
    const diferencia = newHours - previousHours;
    if (diferencia !== 0) {
      const instructor = await Instructor.findById(schedule.instructor);
      if (instructor) {
        instructor.hourswork = Math.max(0, instructor.hourswork + diferencia);
        await instructor.save();
      }
    }

    // 11. Sincronizar fechaInicio/fechaFin/sesiones del request con el rango del schedule.
    //     Las tres propiedades hablan del mismo rango real de clases, así que deben
    //     mantenerse coherentes después de cada reprogramación.
    request.fechaInicio = effectiveFstart;
    request.fechaFin = effectiveFend;

    // Recalcular horas por sesión individual (tstart→tend = 1 evento)
    const horasPorSesion = calculateNumHoursWork(tstart, tend, 1);

    // Reconstruir sesiones a partir de los eventDates reales.
    // Si ya existían sesiones (guardadas por addFormationData), se preserva el
    // contenido pedagógico (competencia, resultados, actividadAprendizaje, instructor)
    // del índice correspondiente; solo se actualizan fecha, horas e hilo de tiempo.
    // Si no hay sesiones previas, se generan entradas vacías como punto de partida.
    if (eventDates.length > 0) {
      const previousSesiones = request.sesiones || [];
      request.sesiones = eventDates.map((date, index) => {
        const existing = previousSesiones[index];
        return {
          fecha: new Date(date).toISOString().split("T")[0],
          horaInicio: tstart,
          horaFin: tend,
          totalHoras: horasPorSesion,
          instructor: existing?.instructor || schedule.instructor,
          competencia: existing?.competencia || "",
          resultados: existing?.resultados || [],
          actividadAprendizaje: existing?.actividadAprendizaje || "",
        };
      });
    }

    request.history.push({
      previousState: request.state,
      newState: request.state,
      changedBy: decoded.id,
      changedByRole: decoded.rol,
      observations: `Ficha reprogramada. Nuevo rango: ${effectiveFstart.toLocaleDateString("es-CO")} - ${effectiveFend.toLocaleDateString("es-CO")}`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "REPROGRAMAR FICHA",
        data: { scheduleId: id, previousHours, newHours, rescheduledBy: decoded.email },
      },
      req.headers.token
    );

    res.json({ msg: "Horario reprogramado correctamente", data: schedule });
  } catch (error) {
    console.log(error);
    // Reenviar mensajes de validación de negocio (alineado con scheduleComplementary)
    if (
      error?.message &&
      (error.message.includes("programación") ||
        error.message.includes("ambiente") ||
        error.message.includes("solicitud") ||
        error.message.includes("horas") ||
        error.message.includes("programa"))
    ) {
      return res.status(400).json({ msg: error.message });
    }
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== CRUD Parámetros (Tipos de Programa / Población) ====================

compCtrl.getParametros = async (req, res) => {
  try {
    const { tipo } = req.query;
    const filter = { status: 0 };
    if (tipo) {
      filter.tipo = tipo;
    }
    const parametros = await ComplementaryParametro.find(filter).sort({
      tipo: 1,
      nombre: 1,
    });
    res.json(parametros);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.getParametroById = async (req, res) => {
  const { id } = req.params;
  try {
    const parametro = await ComplementaryParametro.findById(id);
    res.json(parametro);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.registerParametro = async (req, res) => {
  const { nombre, tipo } = req.body;
  try {
    const nuevoParametro = new ComplementaryParametro({
      nombre: nombre.toUpperCase().trim(),
      tipo,
    });
    await nuevoParametro.save();

    await registerAction(
      "PARAMETRO",
      { event: "REGISTRAR PARAMETRO", data: nuevoParametro },
      req.headers.token
    );

    res.json({ msg: "Registro creado correctamente", data: nuevoParametro });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.updateParametro = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo } = req.body;
  try {
    const parametro = await ComplementaryParametro.findByIdAndUpdate(
      id,
      { nombre: nombre.toUpperCase().trim(), tipo },
      { new: true }
    );

    await registerAction(
      "PARAMETRO",
      { event: "ACTUALIZAR PARAMETRO", data: parametro },
      req.headers.token
    );

    res.json({ msg: "Registro actualizado correctamente", data: parametro });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.activateParametro = async (req, res) => {
  const { id } = req.params;
  try {
    const parametro = await ComplementaryParametro.findByIdAndUpdate(
      id,
      { status: 0 },
      { new: true }
    );

    await registerAction(
      "PARAMETRO",
      { event: "ACTIVAR PARAMETRO", data: parametro },
      req.headers.token
    );

    res.json({ msg: "Registro activado correctamente", data: parametro });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

compCtrl.deactivateParametro = async (req, res) => {
  const { id } = req.params;
  try {
    const parametro = await ComplementaryParametro.findByIdAndUpdate(
      id,
      { status: 1 },
      { new: true }
    );

    await registerAction(
      "PARAMETRO",
      { event: "DESACTIVAR PARAMETRO", data: parametro },
      req.headers.token
    );

    res.json({ msg: "Registro desactivado correctamente", data: parametro });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-10: Reporte de complementarias por municipio y fecha ====================

// Reporte de "visita a municipios": devuelve las complementarias con clase en una fecha y
// municipio específicos, filtrando solo las fichas cuya coordinación es PROGRAMAS ESPECIALES.
compCtrl.getComplementariasPorFecha = async (req, res) => {
  const { town, fecha } = req.query;
  try {
    // Normalizar la fecha consultada a UTC y obtener el rango completo del día.
    const inicioDia = dateFormater(fecha);
    const finDia = new Date(inicioDia);
    finDia.setUTCHours(23, 59, 59, 999);

    const coord = await coordinationHelper.findCoordinationByName(
      "PROGRAMAS ESPECIALES"
    );
    if (!coord) {
      return res
        .status(400)
        .json({ msg: "No existe la coordinación PROGRAMAS ESPECIALES" });
    }

    // Precargar los ambientes del municipio y las fichas de PROGRAMAS ESPECIALES para acotar
    // la consulta de schedules en Mongo (evita traer y filtrar en JS registros irrelevantes).
    const ambientes = await Environment.find({ town, status: 0 }).select("_id");
    const ambienteIds = ambientes.map((a) => a._id);
    if (ambienteIds.length === 0) {
      return res.json({
        msg: "Reporte generado correctamente",
        total: 0,
        data: [],
      });
    }

    const fichas = await Fiche.find({
      coordination: coord._id,
      status: 0,
    }).select("_id");
    const fichaIds = fichas.map((f) => f._id);
    if (fichaIds.length === 0) {
      return res.json({
        msg: "Reporte generado correctamente",
        total: 0,
        data: [],
      });
    }

    // Schedules complementarios del municipio + coordinación con clase ese día.
    // El instructor se toma del Schedule (quien realmente da la clase), no del owner de la ficha.
    const schedules = await Schedule.find({
      scheduleType: "COMPLEMENTARIA",
      status: 0,
      fiche: { $in: fichaIds },
      environment: { $in: ambienteIds },
      fstart: { $lte: finDia },
      fend: { $gte: inicioDia },
      events: { $elemMatch: { $gte: inicioDia, $lte: finDia } },
    })
      .populate({ path: "fiche", populate: { path: "program" } })
      .populate("environment", "name")
      .populate("instructor", "name email phone")
      .sort({ fstart: 1 });

    // Ya filtrado en Mongo: solo se arma la respuesta.
    const data = schedules.map((s) => ({
      horario: {
        days: s.days,
        tstart: s.tstart,
        tend: s.tend,
        fstart: s.fstart,
        fend: s.fend,
        hourswork: s.hourswork,
        environment: { name: s.environment?.name },
      },
      fichaNumero: s.fiche?.number,
      fichaNombre: s.fiche?.program?.name,
      instructor: {
        name: s.instructor?.name,
        email: s.instructor?.email,
        phone: s.instructor?.phone,
      },
    }));

    res.json({
      msg: "Reporte generado correctamente",
      total: data.length,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-10: Auditoría DF-14 / DF-14A ====================
// Movido desde controller/complementaryAudit.controller.js (consolidación del módulo).
// El helper (complementaryAuditHelper) y las validaciones (validateAuditDF14 / Test)
// se unificaron en helpers/complementary.helper.js y validations/complementary.validation.js.

// Mutex (Capa 3): evita que dos auditorías DF14 corran en simultáneo y pisen
// los campos `rated` de los Schedule. El job corre en background, por lo que esta
// bandera se libera en el finally del procesamiento asíncrono.
let df14AuditRunning = false;

// Procesa un archivo DF14 subido para auditoría masiva de Rutas y Juicios.
// Patrón job en background (igual que uploadExcel): responde INMEDIATAMENTE con un
// jobId y procesa en segundo plano. Así se evita el 504 Gateway Timeout del túnel
// (frontend en otro PC <-> backend <-> Dev Tunnel), que cortaba la petición larga.
// El progreso se consulta con GET /reports/audit-df14/status/:jobId (polling).
compCtrl.processDF14 = async (req, res) => {
  try {
    // Capa 3: solo una auditoría a la vez.
    if (df14AuditRunning) {
      return res.status(409).json({ msg: "Ya hay una auditoría DF14 en curso. Espere a que termine." });
    }

    if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
      return res.status(400).json({ msg: "No se ha subido ningún archivo." });
    }

    const file = req.files.file;

    // Obtener quién disparó la acción
    let triggeredBy = "Unknown User";
    try {
      const token = req.headers.token;
      if (token) {
        const decoded = await webToken.decodeAnyToken(token);
        if (decoded && decoded.email) {
          triggeredBy = decoded.email;
        }
      }
    } catch (e) {
      console.warn("[AUDIT-DF14] No se pudo decodificar token para historial:", e.message);
    }

    // Crear job y responder inmediatamente con jobId (ya no hay timeout del túnel).
    const { jobId, state } = jobStore.createJob();
    // Extender el estado con campos específicos del DF14. El Map del jobStore guarda
    // el objeto por referencia, así que estas mutaciones las lee el endpoint de status.
    state.total = 0;
    state.totalProcesadas = 0;
    state.fichasEvaluadas = 0;
    state.fichasNoEncontradas = 0;
    state.faltanRutas = [];
    state.faltanJuicios = [];
    state.detalles = [];
    state.notificacionRutas = null;
    state.notificacionJuicios = null;
    state.summary = null;

    df14AuditRunning = true;
    res.json({ msg: "Auditoría DF14 iniciada", jobId });

    // Procesamiento en background (no bloquea la respuesta).
    (async () => {
      try {
        // 1) Parse del Excel.
        let auditData;
        try {
          auditData = await complementaryAuditHelper.parseDF14(file.tempFilePath);
        } catch (error) {
          state.failed = true;
          state.error = error.message || "Error procesando el archivo Excel.";
          state.done = true;
          jobStore.scheduleCleanup(jobId);
          return;
        }

        if (!auditData || auditData.length === 0) {
          state.failed = true;
          state.error = "No se encontraron fichas de 'Curso especial' válidas en el archivo.";
          state.done = true;
          jobStore.scheduleCleanup(jobId);
          return;
        }

        state.total = auditData.length;

        const results = {
          totalProcesadas: auditData.length,
          fichasEvaluadas: 0,
          fichasNoEncontradas: 0,
          faltanRutas: [],
          faltanJuicios: [],
          detalles: []
        };

        const noEncontradasList = [];

        // Capa 2: un solo query con $in + Map, en vez de N findOne (10x más rápido).
        const fichaNumbers = auditData.map((item) => item.fichaNumber);
        const foundRequests = await ComplementaryRequest.find({ fichaNumber: { $in: fichaNumbers } })
          .populate("instructor", "name email emailpersonal");
        const requestMap = new Map(foundRequests.map((r) => [r.fichaNumber, r]));

        for (let i = 0; i < auditData.length; i++) {
          const item = auditData[i];
          // Find corresponding ComplementaryRequest (vía Map, sin query por ficha)
          const request = requestMap.get(item.fichaNumber);

          if (!request) {
            results.fichasNoEncontradas++;
            results.detalles.push(`Ficha ${item.fichaNumber} no encontrada en el sistema.`);
            noEncontradasList.push({
              fichaNumber: item.fichaNumber,
              enTransito: item.enTransito || 0,
              enFormacion: item.enFormacion || 0
            });
            state.percent = Math.round(((i + 1) / auditData.length) * 100);
            continue;
          }

          const fichaData = {
            fichaNumber: item.fichaNumber,
            instructorName: request.instructorName || (request.instructor ? request.instructor.name : "Instructor"),
            courseName: request.catalogCourseName,
            email: request.instructor ? request.instructor.email : null,
          };

          let handled = false;

          // Proceso A: Rutas
          if (item.enTransito > 0) {
            results.faltanRutas.push({
              ...fichaData,
              pendientes: item.enTransito
            });
            results.detalles.push(`Ficha ${item.fichaNumber}: Reportada por Rutas (${item.enTransito} en tránsito).`);
            handled = true;
          }

          // Proceso B: Juicios (solo si ESTADO_FICHA = "Terminada" o "Terminada por fecha").
          // NIVEL_FORMACION = CURSO ESPECIAL ya está filtrado por parseDF14.
          const ESTADOS_JUICIOS = ["terminada", "terminada por fecha"];
          if (ESTADOS_JUICIOS.includes(item.estado)) {
            if (item.enFormacion > 0) {
              // Report missing judgments
              results.faltanJuicios.push({
                ...fichaData,
                pendientes: item.enFormacion
              });
              results.detalles.push(`Ficha ${item.fichaNumber}: Reportada por Juicios (${item.enFormacion} pendientes).`);
              handled = true;
            } else if (item.enFormacion === 0) {
              // Everything evaluated. Mark schedules as rated
              const updateResult = await Schedule.updateMany(
                { complementaryRequest: request._id, status: 0, rated: { $ne: true } },
                {
                  $set: {
                    rated: true,
                    dateRating: new Date(),
                    statusRating: "Calificado",
                    ratedByProcess: "audit_df14_bulk"
                  }
                }
              );

              if (updateResult.modifiedCount > 0) {
                results.fichasEvaluadas++;
                results.detalles.push(`Ficha ${item.fichaNumber}: ${updateResult.modifiedCount} horarios marcados como Evaluados.`);
                handled = true;
              }
            }
          }

          if (!handled) {
            results.detalles.push(`Ficha ${item.fichaNumber}: Al día, sin acciones requeridas.`);
          }

          // Actualizar progreso para el polling del frontend.
          state.percent = Math.round(((i + 1) / auditData.length) * 100);
        }

        // Enviar notificaciones por correo si hay fichas con problemas
        let notificacionRutas = null;
        let notificacionJuicios = null;

        if (results.faltanRutas.length > 0) {
          console.log(`[AUDIT-DF14] Enviando notificaciones de rutas (${results.faltanRutas.length} fichas)...`);
          const recordsRutas = results.faltanRutas.map(f => ({
            fichaNumber: f.fichaNumber,
            estado: 'en ejecucion',
            enTransito: f.pendientes
          }));
          try {
            notificacionRutas = await sendMissingRouteNotification(recordsRutas);
            console.log(`[AUDIT-DF14] Notificaciones rutas: ${notificacionRutas.sent} enviadas, ${notificacionRutas.failed} fallidas`);
          } catch (err) {
            console.error("[AUDIT-DF14] Error enviando notificaciones de rutas:", err.message);
          }
        }

        if (results.faltanJuicios.length > 0) {
          console.log(`[AUDIT-DF14] Enviando notificaciones de juicios (${results.faltanJuicios.length} fichas)...`);
          const recordsJuicios = results.faltanJuicios.map(f => ({
            fichaNumber: f.fichaNumber,
            estado: 'en ejecucion',
            enFormacion: f.pendientes
          }));
          try {
            notificacionJuicios = await sendMissingJudgmentsNotification(recordsJuicios);
            console.log(`[AUDIT-DF14] Notificaciones juicios: ${notificacionJuicios.sent} enviadas, ${notificacionJuicios.failed} fallidas`);
          } catch (err) {
            console.error("[AUDIT-DF14] Error enviando notificaciones de juicios:", err.message);
          }
        }

        // Volcar resultados al estado del job (lo lee el endpoint de status/polling).
        state.totalProcesadas = results.totalProcesadas;
        state.fichasEvaluadas = results.fichasEvaluadas;
        state.fichasNoEncontradas = results.fichasNoEncontradas;
        state.faltanRutas = results.faltanRutas;
        state.faltanJuicios = results.faltanJuicios;
        state.detalles = results.detalles;
        state.notificacionRutas = notificacionRutas ? {
          enviados: notificacionRutas.sent,
          fallidos: notificacionRutas.failed,
          noEncontrados: notificacionRutas.notFound
        } : null;
        state.notificacionJuicios = notificacionJuicios ? {
          enviados: notificacionJuicios.sent,
          fallidos: notificacionJuicios.failed,
          noEncontrados: notificacionJuicios.notFound
        } : null;
        state.summary = "Auditoría masiva completada exitosamente.";

        // Mapear al esquema del historial
        const sinRuta = results.faltanRutas.map(r => ({
          fichaNumber: r.fichaNumber,
          courseName: r.courseName || "Programa complementario",
          instructorName: r.instructorName || "Instructor",
          instructorEmail: r.email,
          pendientes: r.pendientes || 0
        }));

        const sinJuicios = results.faltanJuicios.map(j => ({
          fichaNumber: j.fichaNumber,
          courseName: j.courseName || "Programa complementario",
          instructorName: j.instructorName || "Instructor",
          instructorEmail: j.email,
          pendientes: j.pendientes || 0
        }));

        // Registrar en la BD Df14aReportHistory
        await Df14aReportHistory.create({
          type: "manual_upload",
          triggeredBy,
          totalProcessed: results.totalProcesadas || 0,
          fichesEvaluated: results.fichasEvaluadas || 0,
          fichesNotFound: results.fichasNoEncontradas || 0,
          totalSinRuta: sinRuta.length,
          totalSinJuicios: sinJuicios.length,
          sinRuta,
          sinJuicios,
          fichasNoEncontradas: noEncontradasList,
          notificacionRutas: notificacionRutas ? {
            enviados: notificacionRutas.sent || 0,
            fallidos: notificacionRutas.failed || 0,
            noEncontrados: notificacionRutas.notFound?.length || 0
          } : { enviados: 0, fallidos: 0, noEncontrados: 0 },
          notificacionJuicios: notificacionJuicios ? {
            enviados: notificacionJuicios.sent || 0,
            fallidos: notificacionJuicios.failed || 0,
            noEncontrados: notificacionJuicios.notFound?.length || 0
          } : { enviados: 0, fallidos: 0, noEncontrados: 0 },
          summary: `Reporte DF14 manual cargado. ${sinRuta.length} sin ruta, ${sinJuicios.length} con juicios pendientes, ${results.fichasEvaluadas} fichas evaluadas.`
        });

        state.done = true;
        jobStore.scheduleCleanup(jobId);
      } catch (error) {
        console.error("[AUDIT-DF14] Error general:", error);
        state.failed = true;
        state.error = "Error interno procesando auditoría DF14";
        state.done = true;
        jobStore.scheduleCleanup(jobId);
      } finally {
        // Capa 3: limpieza del temp file SIEMPRE (éxito o error) y liberar mutex.
        try {
          if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
            fs.unlinkSync(file.tempFilePath);
          }
        } catch (e) {
          console.error("[AUDIT-DF14] Error limpiando archivo temporal:", e.message);
        }
        df14AuditRunning = false;
      }
    })();
  } catch (error) {
    console.error("[AUDIT-DF14] Error general:", error);
    df14AuditRunning = false;
    return res.status(500).json({ msg: "Error interno procesando auditoría DF14" });
  }
};

// Consultar el progreso/resultado de una auditoría DF14 por jobId (polling).
// Clon del patrón de getUploadStatus (carga masiva de catálogo).
compCtrl.getDF14Status = async (req, res) => {
  const { jobId } = req.params;
  try {
    const state = jobStore.getJob(jobId);
    if (!state) {
      return res.status(404).json({ msg: "Auditoría no encontrada o ya expirada" });
    }
    res.json(state);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

/**
 * Ejecuta el reporte DF-14A desde SOFIA Plus de forma manual (endpoint de prueba/demo).
 * Dispara el mismo flujo que el cron mensual (cron/df14a-report.js → runDf14aReport):
 * login Playwright → descarga → procesamiento → notificaciones reales a instructores.
 *
 * Útil para probar el scraping y mostrar resultados sin esperar al día 1 del mes.
 * Roles permitidos: ADMIN y PROGRAMADOR (credenciales SOFIA sensibles + coste de Playwright).
 */
compCtrl.runDf14aTest = async (req, res) => {
  // Playwright (login + navegación + descarga + posibles reintentos) puede tardar varios
  // minutos: desactivar el timeout del socket para esta petición concreta.
  req.setTimeout(0);
  try {
    let triggeredBy = "Unknown Admin/Programador";
    try {
      const token = req.headers.token;
      if (token) {
        const decoded = await webToken.decodeAnyToken(token);
        if (decoded && decoded.email) {
          triggeredBy = decoded.email;
        }
      }
    } catch (e) {
      console.warn("[DF14A-TEST] No se pudo decodificar token para historial:", e.message);
    }

    const result = await runDf14aReport({ source: "endpoint", triggeredBy });

    if (result.skipped) {
      return res.status(409).json({ msg: "Ya hay una ejecución DF-14A en curso. Intente más tarde." });
    }

    return res.json({
      msg: "DF-14A procesado correctamente.",
      sinRuta: result.sinRuta,
      sinJuicios: result.sinJuicios,
      notificacionRutas: result.notificationRutas
        ? {
            enviados: result.notificationRutas.sent,
            fallidos: result.notificationRutas.failed,
            noEncontrados: result.notificationRutas.notFound,
          }
        : null,
      notificacionJuicios: result.notificationJuicios
        ? {
            enviados: result.notificationJuicios.sent,
            fallidos: result.notificationJuicios.failed,
            noEncontrados: result.notificationJuicios.notFound,
          }
        : null,
    });
  } catch (error) {
    // Mensaje claro si faltan credenciales SOFIA; genérico para el resto (consistencia con el módulo).
    const msg =
      error.message && error.message.includes("credenciales SOFIA")
        ? error.message
        : "No fue posible terminar la operacion";
    console.error("[DF14A-TEST] Error:", error.message);
    return res.status(500).json({ msg });
  }
};

/**
 * Endpoint de prueba simple para el DF-14A.
 * No requiere token de autenticación (público) y responde de forma inmediata,
 * ejecutando el scraper en segundo plano sin devolver datos al frontend.
 */
compCtrl.runDf14aTestSimple = async (req, res) => {
  try {
    let triggeredBy = "Public Simple Endpoint";
    try {
      const token = req.headers.token;
      if (token) {
        const decoded = await webToken.decodeAnyToken(token);
        if (decoded && decoded.email) {
          triggeredBy = decoded.email;
        }
      }
    } catch (e) {}

    // Ejecutar en segundo plano sin esperar a que termine Playwright (que puede tardar minutos)
    runDf14aReport({ source: "simple-endpoint", triggeredBy }).catch((error) => {
      console.error("[DF14A-SIMPLE] Error en ejecución de fondo:", error.message);
    });

    return res.json({
      msg: "Ejecución de DF-14A iniciada en segundo plano con éxito.",
    });
  } catch (error) {
    console.error("[DF14A-SIMPLE] Error:", error.message);
    return res.status(500).json({ msg: "No fue posible iniciar la operación" });
  }
};


// Obtiene todos los horarios de un instructor clasificados por tipo:
// titulada (Schedule sin complementaryRequest), complementaria (Schedule con complementaryRequest),
// otros (OtherSchedules).
compCtrl.getInstructorAllSchedules = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Ventana de fechas opcional (desde/hasta en YYYY-MM-DD). Si falta alguno de
    // los dos no se filtra (compatible hacia atras: trae todo el historico).
    // Se normaliza a inicio/fin de dia para que el cruce de rangos sea inclusivo
    // y no se caigan horarios vespertinos/nocturnos por el huso horario.
    const { desde, hasta } = req.query;
    const filtroVentana =
      desde && hasta
        ? {
            fstart: { $lte: new Date(`${hasta}T23:59:59`) },
            fend: { $gte: new Date(`${desde}T00:00:00`) },
          }
        : {};

    const schedules = await Schedule.find({
      instructor: instructorId,
      status: 0,
      ...filtroVentana,
    })
      .populate("fiche", "number")
      .populate("complementaryRequest", "fichaNumber catalogCourseName state")
      .sort({ createdAt: -1 });

    const titulada = schedules.filter((s) => !s.complementaryRequest);
    const complementaria = schedules.filter((s) => s.complementaryRequest);

    const otros = await OtherSchedules.find({
      instructor: instructorId,
      status: 0,
      ...filtroVentana,
    }).sort({ createdAt: -1 });

    res.json({ titulada, complementaria, otros });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};



// ==================== RF-13: Solicitud de ampliacion de ficha complementaria ====================

// Instructor solicita ampliacion de la fecha fin. No especifica nueva fecha;
// solo escribe observaciones libres con el motivo. La nueva fecha la define
// el coordinador en el paso de reprogramacion posterior.
compCtrl.requestExtension = async (req, res) => {
  const { id } = req.params;
  const { observaciones } = req.body;
  try {
    const decoded = await webToken.decodeComplementariaToken(req.headers.token);
    const instructor = await complementaryHelper.findInstructorByEmail(decoded.email);
    if (!instructor) {
      return res.status(401).json({ msg: "Instructor no encontrado" });
    }

    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "Solicitud no encontrada" });
    }

    // Verificar que el instructor pertenece a la ficha
    const esPropietario = complementaryHelper.isInstructorInRequest(request, instructor._id);
    if (!esPropietario) {
      return res.status(401).json({ msg: "No tienes permisos sobre esta ficha" });
    }

    request.extensionRequests.push({
      requestedBy: instructor._id,
      observaciones: observaciones.trim(),
      status: "PENDIENTE",
    });

    await request.save();

    // Notificar al coordinador y programadores
    try {
      await notifyExtensionRequest(request, instructor.name || decoded.email);
    } catch (emailErr) {
      console.log("[EMAIL] Error notificando solicitud de ampliacion:", emailErr.message);
    }

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "SOLICITAR AMPLIACION",
        data: { requestId: id, fichaNumber: request.fichaNumber, instructor: decoded.email, observaciones: observaciones.trim() },
      },
      req.headers.token
    );

    res.json({ msg: "Solicitud de ampliacion registrada correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error.message || "No fue posible terminar la operacion" });
  }
};

// Coordinador o admin resuelve la solicitud de ampliacion (APROBADA o RECHAZADA).
// Al aprobar, el frontend debe redirigir a la vista de reprogramacion (requiresReschedule: true).
// Al rechazar, es obligatorio enviar observations con el motivo.
// La solicitud muere al resolverse; si el instructor quiere volver a pedir, crea una nueva.
compCtrl.resolveExtension = async (req, res) => {
  const { id, extId } = req.params;
  const { status, observations } = req.body;
  try {
    const decoded = await webToken.decodeToken(req.headers.token);

    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "Solicitud no encontrada" });
    }

    const extension = request.extensionRequests.id(extId);
    if (!extension) {
      return res.status(400).json({ msg: "Solicitud de ampliacion no encontrada" });
    }

    if (extension.status !== "PENDIENTE") {
      return res.status(400).json({ msg: "La solicitud de ampliacion ya fue resuelta" });
    }

    if (status === "RECHAZADA" && !observations) {
      return res.status(400).json({ msg: "Las observaciones son obligatorias al rechazar una ampliacion" });
    }

    extension.status = status;
    extension.resolvedBy = decoded.id;
    extension.resolvedDate = new Date();
    extension.resolvedObservations = observations ? observations.trim() : "";

    await request.save();

    // Notificar al instructor
    try {
      await notifyExtensionResolved(request, extension);
    } catch (emailErr) {
      console.log("[EMAIL] Error notificando resolucion de ampliacion:", emailErr.message);
    }

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: `RESOLUCION AMPLIACION: ${status}`,
        data: {
          requestId: id,
          extId,
          fichaNumber: request.fichaNumber,
          status,
          resolvedBy: decoded.email,
          observations: extension.resolvedObservations,
        },
      },
      req.headers.token
    );

    res.json({
      msg: `Solicitud de ampliacion ${status === "APROBADA" ? "aprobada" : "rechazada"} correctamente`,
      status,
      // El frontend usa requiresReschedule para redirigir a la vista de reprogramacion
      requiresReschedule: status === "APROBADA",
      requestId: id,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error.message || "No fue posible terminar la operacion" });
  }
};

// Lista todas las solicitudes de ampliacion de una ficha (historial completo).
// Accesible por instructores (token complementaria) y por admin/coordinador/programador (token normal).
compCtrl.getExtensionRequests = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await ComplementaryRequest.findById(id)
      .select("extensionRequests fichaNumber catalogCourseName state")
      .populate("extensionRequests.requestedBy", "name numdocument email")
      .populate("extensionRequests.resolvedBy", "name email");

    if (!request) {
      return res.status(400).json({ msg: "Solicitud no encontrada" });
    }

    res.json({
      extensionRequests: request.extensionRequests,
      fichaNumber: request.fichaNumber,
      catalogCourseName: request.catalogCourseName,
      state: request.state,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Listar historial de reportes DF14A
compCtrl.getDf14aHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.type) {
      query.type = req.query.type;
    }

    const total = await Df14aReportHistory.countDocuments(query);
    const history = await Df14aReportHistory.find(query)
      .select("executionDate type triggeredBy totalProcessed fichesEvaluated fichesNotFound totalSinRuta totalSinJuicios summary createdAt")
      .sort({ executionDate: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      msg: "Historial de reportes DF14A obtenido con éxito",
      total,
      page,
      pages: Math.ceil(total / limit),
      data: history
    });
  } catch (error) {
    console.error("[DF14A-HISTORY] Error:", error.message);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Obtener detalle de un reporte DF14A específico por ID
compCtrl.getDf14aHistoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const report = await Df14aReportHistory.findById(id);
    if (!report) {
      return res.status(404).json({ msg: "Reporte no encontrado" });
    }
    res.json({
      msg: "Reporte DF14A obtenido con éxito",
      data: report
    });
  } catch (error) {
    console.error("[DF14A-HISTORY-ID] Error:", error.message);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

export { compCtrl };

