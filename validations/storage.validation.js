/**
 * This module contains validation methods for storage monitoring routes.
 * @module validations/storage.validation
 * @requires express-validator/check
 * @requires middlewares/webToken
 * @requires middlewares/validateFields
 * @exports storageVali
 */
import { check } from "express-validator";
import webToken from "../middlewares/webToken.js";
import { validateFields } from "../middlewares/validateFields.js";

const { validateTokenSuper } = webToken;

/**
 * Object containing validation methods for storage monitoring routes.
 * @namespace storageVali
 */
const storageVali = {};

/**
 * Validation method for the token.
 * @memberof storageVali
 * @function validateToken
 * @name validateToken
 * @param {Array} Array of validation checks.
 * @description This function validates that the user has super admin permissions before accessing storage monitoring endpoints.
 */
storageVali.validateToken = [
  check("token").custom(async (token) => {
    await validateTokenSuper(token);
  }),
  validateFields,
];

/**
 * Validation method for the sede parameter.
 * @memberof storageVali
 * @function validateSede
 * @name validateSede
 * @param {Array} Array of validation checks.
 * @description This function validates that the sede parameter is one of the valid options.
 */
storageVali.validateSede = [
  check("sede")
    .isIn(['florida', 'sangel', 'bucaramanga', 'cucuta'])
    .withMessage('Sede debe ser: florida, sangel, bucaramanga, o cucuta'),
  validateFields,
];

export { storageVali };
