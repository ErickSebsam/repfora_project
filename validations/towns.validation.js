import { check } from "express-validator";
import jwt from "jsonwebtoken";
import webToken from "../middlewares/webToken.js";
import { validateFields } from "../middlewares/validateFields.js";

const { validateToken, validateTokenComplementaria } = webToken;

const townsVali = {};

townsVali.validateHeaders = [
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

export { townsVali };
