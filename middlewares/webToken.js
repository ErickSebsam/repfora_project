import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Instructor from "../models/Instructor.js";

const webToken = {};

webToken.generateToken = async (user = "") => {
  const payload = {
    id: user._id || "123456789",
    rol: user.role || "USER",
    email: user.email || "",
    super: user.super || 0,
  };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "48h",
      algorithm: "HS256",
    });
    return token;
  } catch (err) {
    throw new Error("Error al generar el token");
  }
};

webToken.validateToken = async (
  token,
  isAdmin = true,
  isSuper = false,
  isEvaluador = false,
  isNovedades = false
) => {
  try {
    if (!token) {
      throw new Error("No se ha enviado el token");
    }
  } catch (err) {
    throw new Error("No se ha enviado el token");
  }

  try {
    const result = jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });

    if (result.rol !== "USER") {
      let user;
      if (result.rol === "INSTRUCTOR") {
        user = await Instructor.findById(result.id);
      } else {
        user = await User.findById(result.id);
      }

      if (!user) throw new Error("Usuario no encontrado");

      if (user.status !== 0) throw new Error("el usuario está inactivo");
    }

    if (isAdmin && result.rol === "USER") {
      throw new Error("No tienes permisos para realizar esta acción!");
    }

    if (result.rol !== "ETAPA PRODUCTIVA") {
      if (isSuper && result.rol !== "COORDINADOR") {
        throw new Error("No tienes permisos para realizar esta acción!!");
      }
    }

    if (
      isEvaluador &&
      ["COORDINADOR", "PROGRAMADOR", "EVALUADOR", "NOVEDADES"].indexOf(
        result.rol
      ) === -1
    ) {
      throw new Error("No tienes permisos para realizar esta acción!!!");
    }

    if (
      isNovedades &&
      ["COORDINADOR", "PROGRAMADOR", "EVALUADOR", "NOVEDADES"].indexOf(
        result.rol
      ) === -1
    ) {
      throw new Error("No tienes permisos para realizar esta acción!!!!");
    }
  } catch (err) {
    console.log(err.message);
    throw new Error(err.message);
  }
};

webToken.generateTokenComplementaria = async (instructor) => {
  const payload = {
    id: instructor._id,
    rol: "INSTRUCTOR",
    email: instructor.email,
    scope: "VERIFY",
  };
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
      algorithm: "HS256",
    });
    return token;
  } catch (err) {
    throw new Error("Error al generar el token temporal");
  }
};

webToken.validateTokenComplementaria = async (token) => {
  try {
    if (!token) throw new Error("No se ha enviado el token");
    const result = jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });
    if (result.scope !== "VERIFY") {
      throw new Error("El token no es válido para realizar esta acción.");
    }
    let user = await Instructor.findById(result.id);
    if (!user) throw new Error("Instructor no encontrado");
    if (user.status !== 0) throw new Error("El instructor está inactivo");
    return result;
  } catch (err) {
    console.log(err.message);
    throw new Error(err.message);
  }
};

webToken.validateTokenInst = async (token) => {
  try {
    if (!token) {
      throw new Error("No se ha enviado el token");
    }
  } catch (err) {
    throw new Error("No se ha enviado el token");
  }

  try {
    const result = jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });

    const user = await Instructor.findOne({ numdocument: result.id });

    if (!user) throw new Error("Instructor no encontrado");

    if (user.status !== 0) throw new Error("el instructor está inactivo");

  } catch (err) {
    console.log(err.message);
    throw new Error(err.message);
  }
};

webToken.validateTokenSuper = async (token) => {
  try {
    if (!token) {
      throw new Error("No se ha enviado el token");
    }

    const result = jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });

    let user = await User.findById(result.id);

    if (!user) throw new Error("Usuario no encontrado");
    if (user.status !== 0) throw new Error("el usuario está inactivo");

    if (user.super !== 1)
      throw new Error("No tienes permisos para realizar esta acción");
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

webToken.generateTempToken = async (fiche, fstart, fend) => {
  const payload = {
    fiche: fiche,
    fstart: fstart,
    fend: fend,
  };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "100y",
      algorithm: "HS256",
    });
    return token;
  } catch (err) {
    throw new Error("Error al generar el token");
  }
};

webToken.validateTempToken = async (token) => {
  try {
    if (!token) {
      throw new Error();
    }
    const result = jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });
    return result;
  } catch (err) {
    console.log(err);
    throw new Error("No se ha enviado el token");
  }
};

webToken.generateTokenResetPass = async (user) => {
  const payload = {
    email: user.email,
    id: user._id,
  };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5m",
      algorithm: "HS256",
    });
    return token;
  } catch (err) {
    throw new Error("Error al generar el token");
  }
};

webToken.tokenResetPass = async (token) => {
  try {
    if (!token) {
      throw new Error();
    }

    const result = jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });

    const user = await User.findById(result.id);

    if (result.email !== user.email && result.id !== user._id) {
      throw new Error("Token invalido");
    }

    return result;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error(
        "El token ha expirado, por favor solicite nuevamente resetear su contraseña"
      );
    } else {
      throw new Error("No se ha enviado el token");
    }
  }
};

webToken.tokenResetPassInst = async (token) => {
  try {
    if (!token) {
      throw new Error();
    }

    const result = jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });

    const user = await Instructor.findById(result.id);

    if (result.email !== user.email && result.id !== user._id) {
      throw new Error("Token invalido");
    }

    return result;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error(
        "El token ha expirado, por favor solicite nuevamente resetear su contraseña"
      );
    } else {
      throw new Error("No se ha enviado el token");
    }
  }
};

export default webToken;
