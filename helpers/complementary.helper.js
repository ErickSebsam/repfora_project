import Instructor from "../models/Instructor.js";
import ComplementaryCatalog from "../models/ComplementaryCatalog.js";
import ComplementaryRequest from "../models/ComplementaryRequest.js";

const complementaryHelper = {};

complementaryHelper.findInstructorByEmail = async (email) => {
  try {
    const instructor = await Instructor.findOne({
      $or: [
        { email: { $regex: `^${email}$`, $options: "i" } },
        { emailpersonal: { $regex: `^${email}$`, $options: "i" } },
      ],
      status: 0,
    });
    return instructor;
  } catch (error) {
    throw new Error("Error al buscar instructor");
  }
};

complementaryHelper.generateSixDigitCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

complementaryHelper.validateCodeMatch = (accessCode, accessCodeCreatedAt, inputCode) => {
  if (!accessCode) {
    throw new Error("No tiene codigo de verificacion activo");
  }
  if (accessCode !== inputCode) {
    throw new Error("Codigo de verificacion incorrecto");
  }
  const now = new Date();
  const expiration = new Date(accessCodeCreatedAt.getTime() + 5 * 60 * 1000);
  if (now > expiration) {
    throw new Error("El codigo de verificacion ha expirado");
  }
};

complementaryHelper.clearAccessCode = async (instructor) => {
  try {
    instructor.accessCode = null;
    instructor.accessCodeCreatedAt = null;
    await instructor.save();
  } catch (error) {
    throw new Error("Error al limpiar codigo de acceso");
  }
};

complementaryHelper.validateExistCatalogById = async (id) => {
  try {
    const catalog = await ComplementaryCatalog.findById(id, { status: 0 });
    if (!catalog) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("El curso del catálogo no existe");
  }
};

complementaryHelper.validateExistRequestById = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La solicitud no existe");
  }
};

complementaryHelper.validateRequestOwner = async (id, instructorEmail) => {
  try {
    const instructor = await complementaryHelper.findInstructorByEmail(
      instructorEmail
    );
    if (!instructor) {
      throw new Error();
    }
    const request = await ComplementaryRequest.findById(id);
    if (!request || request.instructor.toString() !== instructor._id.toString()) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La solicitud no pertenece al instructor");
  }
};

complementaryHelper.validateRequestRejected = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id);
    if (!request || request.state !== "RECHAZADA") {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La solicitud no está en estado RECHAZADA");
  }
};

complementaryHelper.validateRequestPending = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    if (request.state !== "PENDIENTE") throw new Error();
  } catch (error) {
    throw new Error("La solicitud no existe o no está en estado PENDIENTE");
  }
};

// ==================== RF-05: Asignación de ficha ====================

complementaryHelper.validateRequestApproved = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    if (request.state !== "APROBADA") throw new Error();
  } catch (error) {
    throw new Error("La solicitud no existe o no está en estado APROBADA");
  }
};

complementaryHelper.validateFichaNumberUnique = async (fichaNumber, excludeId = "") => {
  try {
    const existing = await ComplementaryRequest.findOne({
      fichaNumber: fichaNumber.toUpperCase().trim(),
      status: 0,
      state: { $nin: ["CANCELADA"] },
    });
    if (existing) {
      if (excludeId && existing._id.toString() === excludeId) return;
      throw new Error();
    }
  } catch (error) {
    throw new Error("El número de ficha ya está asignado a otra solicitud activa");
  }
};

complementaryHelper.validateStateTransition = async (id, newState) => {
  const validTransitions = {
    APROBADA: ["FICHA_ASIGNADA", "CANCELADA"],
    FICHA_ASIGNADA: ["INSCRIPCION", "CANCELADA"],
    INSCRIPCION: ["PROGRAMADA", "CANCELADA"],
    PROGRAMADA: ["CANCELADA"],
  };
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    const allowed = validTransitions[request.state];
    if (!allowed || !allowed.includes(newState)) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("Transición de estado no válida");
  }
};

export { complementaryHelper };
