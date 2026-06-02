import Learner from '../models/Learner.js';

function buildFicheMatchers(ficheNumber) {
  if (!ficheNumber) return [];
  return [
    { ficheNumber },
    { ficha: ficheNumber },
    { number: ficheNumber },
    { fiche: ficheNumber }
  ];
}

export async function markLearnersPresence(learners, { ficheNumber } = {}) {
  if (!learners?.length) {
    return [];
  }

  const documents = Array.from(
    new Set(
      learners
        .map(learner => learner.documentNumber || learner.document || learner.identificacion)
        .filter(Boolean)
        .map(String)
    )
  );

  const foundDocuments = new Set();

  if (documents.length) {
    const ficheMatchers = buildFicheMatchers(ficheNumber);
    const query = {
      $or: [
        { documentNumber: { $in: documents } },
        { document: { $in: documents } },
        { identificacion: { $in: documents } }
      ]
    };

    if (ficheMatchers.length) {
      query.$and = [{ $or: ficheMatchers }];
    }

    const existingLearners = await Learner.find(query).lean();

    existingLearners.forEach(record => {
      const identifier =
        record.documentNumber || record.document || record.identificacion;
      if (identifier) {
        foundDocuments.add(String(identifier));
      }
    });
  }

  return learners.map(learner => ({
    ...learner,
    foundInDatabase: learner.documentNumber
      ? foundDocuments.has(String(learner.documentNumber))
      : false
  }));
}