import News from "../models/News.js";
import Improvement from "../models/Improvement.js";

const newHelper = {};

newHelper.validateExistNew = async (id,req) => {
  try {
    const newSearch = await News.findById(id);
    
    if (!newSearch) {
      throw new Error();
    }
    req.newbd=newSearch
  } catch (error) {
    throw new Error("La novedad no existe");
  }
};

newHelper.validateActiveNew = async (id) => {
  try {
    const newSearch = await News.findById(id, { status: 0 });
    if (!newSearch) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La novedad no existe");
  }
};

newHelper.validateExistImprovement = async (id) => {
  try {
    const ImprovementSearch = await Improvement.findById(id, { status: 0 });
    if (!ImprovementSearch) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La novedad no existe");
  }
};

newHelper.validateDuplicateNew = async (document, tpnew, fiche) => {
  const validationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${validationId}] validateDuplicateNew START - document: ${document}, tpnew: ${tpnew}, fiche: ${fiche}`);

  try {
    const searchNew = await News.find({
      document: document,
      tpnew: tpnew,
      fiche: fiche,
      status: 0,
      state: { $nin: ["APROBADA", "NO APROBADA"] },
    });

    console.log(`[${validationId}] validateDuplicateNew - Query:`, {
      document,
      tpnew,
      fiche,
      status: 0,
      state: { $nin: ["APROBADA", "NO APROBADA"] }
    });

    if (searchNew.length > 0) {
      console.log(`[${validationId}] validateDuplicateNew - DUPLICATE FOUND - Count: ${searchNew.length}`);
      searchNew.forEach((n, idx) => {
        console.log(`  [${idx + 1}] _id: ${n._id}, code: ${n.code}, state: ${n.state}, status: ${n.status}, createdAt: ${n.createdAt}`);
      });
      throw new Error();
    }

    console.log(`[${validationId}] validateDuplicateNew - No duplicate found, validation passes`);
  } catch (error) {
    console.log(`[${validationId}] validateDuplicateNew ERROR:`, error.message);
    throw new Error("La novedad ya ha sido registrada con anterioridad");
  }
};

export { newHelper };
