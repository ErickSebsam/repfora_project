import { check } from "express-validator";
import jwt from "jsonwebtoken";
import webToken from "../middlewares/webToken.js";
import { validateFields } from "../middlewares/validateFields.js";

const { validateToken } = webToken;

const complementaryAuditVali = {};

complementaryAuditVali.validateAuditDF14 = [
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede auditar archivos DF14");
    }
  }),
  validateFields,
];

export { complementaryAuditVali };
