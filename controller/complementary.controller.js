import AppSettings from "../models/AppSettings.js";
import ComplementaryCatalog from "../models/ComplementaryCatalog.js";
import ComplementaryRequest from "../models/ComplementaryRequest.js";
import Instructor from "../models/Instructor.js";
import Program from "../models/Program.js";
import Schedule from "../models/Schedule.js";
import jwt from "jsonwebtoken";
import xlsx from "xlsx";
import sendEmail from "../utils/emails/sendEmail.js";
import registerAction from "../middlewares/binnacle.js";
import webToken from "../middlewares/webToken.js";
import { complementaryHelper } from "../helpers/complementary.helper.js";
import { complementaryScheduleHelper } from "../helpers/complementarySchedule.helper.js";
import { calculateNumHoursWork } from "../utils/functions/dates.js";
import { notifyApproval, notifyRejection, notifyFichaAssigned, notifyNewRequest } from "../services/complementaryNotificationService.js";
import User from "../models/User.js";

const compCtrl = {};

//send access code to instructor emails (email + emailpersonal) — no requiere token
compCtrl.sendCode = async (req, res) => {
  const { email } = req.body;
  try {
    const instructor = await complementaryHelper.findInstructorByEmail(email);

    if (!instructor) {
      return res.status(401).json({ msg: "Instructor no encontrado" });
    }

    const code = complementaryHelper.generateSixDigitCode();
    instructor.accessCode = code;
    instructor.accessCodeCreatedAt = new Date();
    await instructor.save();

    const fromEmail = process.env.FROM_EMAIL;
    const fromPass = process.env.SECURY_EMAIL;
    const subject = "CODIGO DE ACCESO - COMPLEMENTARIAS SENA";
    const template = "./template/complementaryAccessCode.hbs";

    const sendResults = { email: false, emailpersonal: false };

    if (instructor.email) {
      try {
        await sendEmail(fromEmail, fromPass, [instructor.email], subject, { code }, template);
        sendResults.email = true;
      } catch (err) {
        console.log("[EMAIL] Error enviando a email institucional:", err.message);
      }
    }

    if (instructor.emailpersonal) {
      try {
        await sendEmail(fromEmail, fromPass, [instructor.emailpersonal], subject, { code }, template);
        sendResults.emailpersonal = true;
      } catch (err) {
        console.log("[EMAIL] Error enviando a email personal:", err.message);
      }
    }

    // Dev mode / Local bypass: if email failed to send, log code to console and return it for seamless testing
    if (!sendResults.email && !sendResults.emailpersonal) {
      console.log(`\n=================================================`);
      console.log(`[DEV BYPASS] CÓDIGO GENERADO PARA ${instructor.email}: ${code}`);
      console.log(`=================================================\n`);
      
      return res.json({
        msg: "El servidor de correo local falló, pero se generó el código para pruebas",
        emails: [instructor.email, instructor.emailpersonal].filter(Boolean),
        devCode: code
      });
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
  const { status, prfDenominacion, prfCodigo, lineaTecnologica, redConocimiento } = req.query;
  try {
    const filter = {};
    if (status !== undefined) filter.status = Number(status);
    if (prfCodigo) filter.prfCodigo = Number(prfCodigo);
    if (prfDenominacion) filter.prfDenominacion = { $regex: prfDenominacion, $options: "i" };
    if (lineaTecnologica) filter.lineaTecnologica = { $regex: lineaTecnologica, $options: "i" };
    if (redConocimiento) filter.redConocimiento = { $regex: redConocimiento, $options: "i" };

    const catalogs = await ComplementaryCatalog.find(filter).sort({ createdAt: -1 });

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

    res.json({ data: catalogs, catalogUpdateAlert, lastUploadDate });
  } catch (error) {
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

//upload excel with catalog courses — reemplazo completo del catálogo
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

    let created = 0;
    let skippedVirtual = 0;
    let errors = 0;

    await ComplementaryCatalog.deleteMany({});

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

    for (const row of normalizedRows) {
      try {
        const prfCodigo = row.PRF_CODIGO;
        const prfVersion = row.PRF_VERSION;
        const modalidad = (row.MODALIDAD || "").toString().toUpperCase().trim();

        if (!prfCodigo || !prfVersion) {
          errors++;
          continue;
        }

        if (modalidad === "VIRTUAL") {
          skippedVirtual++;
          continue;
        }

        const newCatalog = new ComplementaryCatalog({
          prfCodigo,
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
        created++;
      } catch (error) {
        if (errors < 3) console.log("Error en fila:", error.message);
        errors++;
      }
    }

    await registerAction(
      "CATALOGO COMPLEMENTARIO",
      { event: "CARGA MASIVA EXCEL", data: { created, skippedVirtual, errors, total: rows.length } },
      req.headers.token
    );

    const settings = await AppSettings.findOne();
    if (settings) {
      settings.catalogLastUploadDate = new Date();
      await settings.save();
    } else {
      await AppSettings.create({ catalogLastUploadDate: new Date() });
    }

    res.json({
      msg: "Carga masiva completada",
      data: { created, skippedVirtual, errors, total: rows.length },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== Coordinador de complementarias ====================

compCtrl.getComplementaryCoordinator = async (req, res) => {
  try {
    const coordinator = await User.findOne({
      status: 0,
      email: "overgarar@sena.edu.co",
    }).populate("coordinations");
    res.json({ coordinator });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// ==================== RF-03: Solicitudes de complementarias ====================

//register new complementary request
compCtrl.registerRequest = async (req, res) => {
  const {
    catalogCourse,
    environment,
    formationDocument,
    competencies,
    outcomes,
    learningActivity,
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
    const decoded = await webToken.validateTokenComplementaria(req.headers.token);
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

    const newRequest = new ComplementaryRequest({
      catalogCourse,
      catalogCourseName: catalog.prfDenominacion,
      catalogCourseCode: String(catalog.prfCodigo),
      catalogCourseVersion: String(catalog.prfVersion),
      instructor: instructor._id,
      environment: environment || null,
      formationDocument: formationDocument || "",
      competencies: competencies || [],
      outcomes: outcomes || [],
      learningActivity: (learningActivity || "").toUpperCase().trim(),
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      fechaInscripcion: fechaInscripcion || null,
      fechaMatriculaInicio: fechaMatriculaInicio || null,
      fechaMatriculaFin: fechaMatriculaFin || null,
      municipio: (municipio || "").toUpperCase().trim(),
      vereda: (vereda || "").toUpperCase().trim(),
      direccion: (direccion || "").toUpperCase().trim(),
      nombreEmpresa: (nombreEmpresa || "").toUpperCase().trim(),
      nitEmpresa: (nitEmpresa || "").toUpperCase().trim(),
      contactoEmpresa: (contactoEmpresa || "").toUpperCase().trim(),
      telefonoEmpresa: (telefonoEmpresa || "").toUpperCase().trim(),
      numAprendices: numAprendices || 0,
      tipoPrograma: (tipoPrograma || "").toUpperCase().trim(),
      tipoPoblacion: (tipoPoblacion || "").toUpperCase().trim(),
      requisitosIngreso: (requisitosIngreso || "").toUpperCase().trim(),
      recursosNecesarios: (recursosNecesarios || "").toUpperCase().trim(),
      proyectoAsociado: (proyectoAsociado || "").toUpperCase().trim(),
    });

    newRequest.history.push({
      previousState: "",
      newState: "PENDIENTE",
      changedBy: decoded.email,
      changedByRole: decoded.rol,
      observations: "Solicitud creada",
    });

    await newRequest.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "REGISTRAR SOLICITUD",
        data: { id: newRequest._id, catalogCourseName: newRequest.catalogCourseName, instructor: decoded.email },
      },
      req.headers.token
    );

    const instructorName = instructor.name || decoded.email;
    await notifyNewRequest(newRequest, instructorName);

    res.json({ msg: "Solicitud registrada correctamente", data: newRequest });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//get all requests (admin ve todo, instructor solo las suyas)
compCtrl.getRequests = async (req, res) => {
  const { state, instructor } = req.query;
  try {
    let decoded;
    let isInstructor = false;

    try {
      decoded = await webToken.validateTokenComplementaria(req.headers.token);
      isInstructor = true;
    } catch {
      decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    }

    const filter = { status: 0 };
    if (state) filter.state = state;

    if (isInstructor || decoded.rol === "INSTRUCTOR") {
      const instructorDoc = await complementaryHelper.findInstructorByEmail(
        decoded.email
      );
      if (!instructorDoc) {
        return res.status(401).json({ msg: "Instructor no encontrado" });
      }
      filter.instructor = instructorDoc._id;
    } else {
      if (instructor) filter.instructor = instructor;
    }

    const requests = await ComplementaryRequest.find(filter)
      .populate("catalogCourse", "prfDenominacion prfCodigo prfVersion")
      .populate("instructor", "name email numdocument")
      .populate("environment", "name")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//get request by id (admin ve cualquiera, instructor solo las suyas)
compCtrl.getRequestId = async (req, res) => {
  const { id } = req.params;
  try {
    let decoded;
    let isInstructor = false;

    try {
      decoded = await webToken.validateTokenComplementaria(req.headers.token);
      isInstructor = true;
    } catch {
      decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    }

    const request = await ComplementaryRequest.findById(id)
      .populate("catalogCourse")
      .populate("instructor", "name email numdocument phone")
      .populate("environment", "name");

    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    if (isInstructor || decoded.rol === "INSTRUCTOR") {
      const instructorDoc = await complementaryHelper.findInstructorByEmail(
        decoded.email
      );
      if (
        !instructorDoc ||
        request.instructor._id.toString() !== instructorDoc._id.toString()
      ) {
        return res
          .status(401)
          .json({ msg: "No tiene permisos para ver esta solicitud" });
      }
    }

    res.json(request);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

//get requests by instructor (from token)
compCtrl.getInstructorRequests = async (req, res) => {
  try {
    const decoded = await webToken.validateTokenComplementaria(req.headers.token);
    const instructor = await complementaryHelper.findInstructorByEmail(
      decoded.email
    );
    if (!instructor) {
      return res.status(401).json({ msg: "Instructor no encontrado" });
    }

    const requests = await ComplementaryRequest.find({
      instructor: instructor._id,
      status: 0,
    })
      .populate("catalogCourse", "prfDenominacion prfCodigo prfVersion")
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
    const decoded = await webToken.validateTokenComplementaria(req.headers.token);

    await ComplementaryRequest.findByIdAndUpdate(id, {
      environment: environment || null,
      formationDocument: formationDocument || "",
      competencies: competencies || [],
      outcomes: outcomes || [],
      learningActivity: (learningActivity || "").toUpperCase().trim(),
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      fechaInscripcion: fechaInscripcion || null,
      fechaMatriculaInicio: fechaMatriculaInicio || null,
      fechaMatriculaFin: fechaMatriculaFin || null,
      municipio: (municipio || "").toUpperCase().trim(),
      vereda: (vereda || "").toUpperCase().trim(),
      direccion: (direccion || "").toUpperCase().trim(),
      nombreEmpresa: (nombreEmpresa || "").toUpperCase().trim(),
      nitEmpresa: (nitEmpresa || "").toUpperCase().trim(),
      contactoEmpresa: (contactoEmpresa || "").toUpperCase().trim(),
      telefonoEmpresa: (telefonoEmpresa || "").toUpperCase().trim(),
      numAprendices: numAprendices || 0,
      tipoPrograma: (tipoPrograma || "").toUpperCase().trim(),
      tipoPoblacion: (tipoPoblacion || "").toUpperCase().trim(),
      requisitosIngreso: (requisitosIngreso || "").toUpperCase().trim(),
      recursosNecesarios: (recursosNecesarios || "").toUpperCase().trim(),
      proyectoAsociado: (proyectoAsociado || "").toUpperCase().trim(),
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
    const decoded = await webToken.validateTokenComplementaria(req.headers.token);
    const request = await ComplementaryRequest.findById(id);

    request.state = "PENDIENTE";
    request.history.push({
      previousState: "RECHAZADA",
      newState: "PENDIENTE",
      changedBy: decoded.email,
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
    const decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    if (decoded.rol !== "COORDINADOR" && decoded.rol !== "PROGRAMADOR") {
      return res
        .status(403)
        .json({ msg: "Solo un coordinador o programador puede realizar esta acción" });
    }

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
      changedBy: decoded.email,
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
    const decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    if (decoded.rol !== "COORDINADOR" && decoded.rol !== "PROGRAMADOR") {
      return res
        .status(403)
        .json({ msg: "Solo un coordinador o programador puede realizar esta acción" });
    }

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
      changedBy: decoded.email,
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

//assign ficha number to approved request — APROBADA → FICHA_ASIGNADA (solo ADMIN)
compCtrl.assignFicha = async (req, res) => {
  const { id } = req.params;
  const {
    fichaNumber,
    fechaInicio,
    fechaFin,
    fechaInscripcion,
    fechaMatriculaInicio,
    fechaMatriculaFin,
  } = req.body;
  try {
    const decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    if (decoded.rol !== "ADMIN" && decoded.rol !== "PROGRAMADOR") {
      return res
        .status(403)
        .json({ msg: "Solo un administrador puede asignar fichas" });
    }

    const request = await ComplementaryRequest.findById(id);
    if (!request || request.state !== "APROBADA") {
      return res
        .status(400)
        .json({ msg: "La solicitud no existe o no está en estado APROBADA" });
    }

    request.fichaNumber = fichaNumber.toUpperCase().trim();
    request.fechaInicio = fechaInicio;
    request.fechaFin = fechaFin;
    request.fechaInscripcion = fechaInscripcion;
    request.fechaMatriculaInicio = fechaMatriculaInicio;
    request.fechaMatriculaFin = fechaMatriculaFin;
    request.state = "FICHA_ASIGNADA";
    request.history.push({
      previousState: "APROBADA",
      newState: "FICHA_ASIGNADA",
      changedBy: decoded.email,
      changedByRole: decoded.rol,
      observations: `Ficha ${fichaNumber} asignada`,
    });
    await request.save();

    await registerAction(
      "COMPLEMENTARIAS",
      {
        event: "ASIGNAR FICHA",
        data: {
          id: request._id,
          fichaNumber: request.fichaNumber,
          catalogCourseName: request.catalogCourseName,
          assignedBy: decoded.email,
        },
      },
      req.headers.token
    );

    await notifyFichaAssigned(request);

    res.json({ msg: "Ficha asignada correctamente", data: request });
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
    const decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    if (decoded.rol !== "ADMIN" && decoded.rol !== "PROGRAMADOR") {
      return res
        .status(403)
        .json({ msg: "Solo un administrador puede cambiar el estado" });
    }

    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    const previousState = request.state;
    request.state = newState;
    request.history.push({
      previousState,
      newState,
      changedBy: decoded.email,
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
          changedBy: decoded.email,
          observations: observations || "",
        },
      },
      req.headers.token
    );

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
    const decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    if (decoded.rol !== "ADMIN" && decoded.rol !== "COORDINADOR" && decoded.rol !== "PROGRAMADOR") {
      return res
        .status(403)
        .json({ msg: "Solo un administrador o coordinador puede cerrar una ficha" });
    }

    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      return res.status(400).json({ msg: "La solicitud no existe" });
    }

    if (request.state !== "PROGRAMADA") {
      return res
        .status(400)
        .json({ msg: "La solicitud debe estar en estado PROGRAMADA para poder cerrarla" });
    }

    // Buscar schedules asociados a esta solicitud
    const Schedule = (await import("../models/Schedule.js")).default;
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
      changedBy: decoded.email,
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
    const decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    if (decoded.rol !== "ADMIN" && decoded.rol !== "PROGRAMADOR") {
      return res
        .status(403)
        .json({ msg: "Solo un administrador o programador puede programar horarios complementarios" });
    }

    // 1. Validar que la solicitud sea programable
    const request = await complementaryScheduleHelper.validateRequestProgrammable(id);

    // 2. Validar que no exista ya un schedule activo para esta solicitud
    await complementaryScheduleHelper.validateNoDuplicateSchedule(id);

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

    // 8. Crear el Schedule complementario
    const newSchedule = new Schedule({
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

    // 10. Avanzar estado si es necesario
    if (request.state === "FICHA_ASIGNADA" || request.state === "INSCRIPCION") {
      const previousState = request.state;
      request.state = "PROGRAMADA";
      request.history.push({
        previousState,
        newState: "PROGRAMADA",
        changedBy: decoded.email,
        changedByRole: decoded.rol,
        observations: "Estado avanzado automáticamente al programar horario",
      });
      await request.save();
    }

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
  try {
    const matchStage = { status: 0 };
    if (estado) matchStage.state = estado;

    const fichas = await ComplementaryRequest.find(matchStage)
      .populate("instructor", "name email numdocument")
      .select("fichaNumber catalogCourseName catalogCourseCode state fechaInicio fechaFin instructor")
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

// ==================== RF-10: Reprogramacion de ficha ====================

compCtrl.rescheduleFicha = async (req, res) => {
  const { id } = req.params;
  const { fstart, fend, tstart, tend, days, events } = req.body;
  try {
    const decoded = jwt.verify(req.headers.token, process.env.JWT_SECRET);
    if (decoded.rol !== "ADMIN" && decoded.rol !== "COORDINADOR" && decoded.rol !== "PROGRAMADOR") {
      return res.status(403).json({ msg: "No tienes permisos para realizar esta accion" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule || schedule.status !== 0) {
      return res.status(400).json({ msg: "El horario no existe o esta inactivo" });
    }
    if (schedule.scheduleType !== "COMPLEMENTARIA") {
      return res.status(400).json({ msg: "Solo se pueden reprogramar horarios complementarios" });
    }

    const newFstart = new Date(fstart);
    if (newFstart < schedule.fstart) {
      return res.status(400).json({
        msg: "La nueva fecha de inicio no puede ser anterior a la fecha de inicio original",
      });
    }

    const previousHours = schedule.hourswork || 0;

    if (fstart) schedule.fstart = fstart;
    if (fend) schedule.fend = fend;
    if (tstart) schedule.tstart = tstart;
    if (tend) schedule.tend = tend;
    if (days) schedule.days = days;
    if (events) schedule.events = events;

    const newHours = calculateNumHoursWork(schedule.tstart, schedule.tend, schedule.events.length);
    schedule.hourswork = newHours;

    await schedule.save();

    const diferencia = newHours - previousHours;
    if (diferencia !== 0) {
      const instructor = await Instructor.findById(schedule.instructor);
      if (instructor) {
        instructor.hourswork = Math.max(0, instructor.hourswork + diferencia);
        await instructor.save();
      }
    }

    if (schedule.complementaryRequest) {
      await ComplementaryRequest.findByIdAndUpdate(schedule.complementaryRequest, {
        $push: {
          history: {
            previousState: "PROGRAMADA",
            newState: "PROGRAMADA",
            changedBy: decoded.email,
            changedByRole: decoded.rol,
            observations: `Ficha reprogramada. Nuevo rango: ${new Date(fstart).toLocaleDateString("es-CO")} - ${new Date(fend).toLocaleDateString("es-CO")}`,
          },
        },
      });
    }

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
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

export { compCtrl };
