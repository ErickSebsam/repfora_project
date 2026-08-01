import ComplementaryParametro from "../models/ComplementaryParametro.js";

const complementaryParametroHelper = {};

complementaryParametroHelper.validateExistParametroById = async (id) => {
  try {
    const parametro = await ComplementaryParametro.findById(id);
    if (!parametro) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("El parametro no existe");
  }
};

complementaryParametroHelper.validateNombreUniqueByTipo = async (
  nombre,
  tipo,
  currentId = null
) => {
  try {
    const parametro = await ComplementaryParametro.findOne({
      nombre: nombre.toUpperCase().trim(),
      tipo,
      status: 0,
    });
    if (parametro && currentId && parametro._id.toString() !== currentId) {
      throw new Error();
    } else if (parametro && !currentId) {
      throw new Error();
    }
  } catch (error) {
    throw new Error(
      `El nombre '${nombre}' ya existe para el tipo '${tipo}'`
    );
  }
};

export { complementaryParametroHelper };
