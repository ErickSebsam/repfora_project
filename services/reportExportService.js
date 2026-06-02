import fs from 'fs/promises';
import path from 'path'; 

export async function exportReportToJson(reportPath, { ficheNumber, learners }) {
  if (!reportPath) {
    throw new Error('Se requiere la ruta del reporte para exportar a JSON.');
  }

  const extension = path.extname(reportPath);
  const baseName = path.basename(reportPath, extension);
  const destination = path.join(path.dirname(reportPath), `${baseName}.json`);

  const payload = {
    ficheNumber: ficheNumber || null,
    generatedAt: new Date().toISOString(),
    sourceFile: path.basename(reportPath),
    totals: {
      learners: learners?.length || 0,
      graded: learners?.filter(item => item.stateType === 'graded').length || 0,
      pending: learners?.filter(item => item.stateType === 'pending').length || 0,
      withNovelty: learners?.filter(item => item.noveltyNormalized?.length).length || 0
    },
    learners: learners?.map(learner => ({
      name: learner.name,
      documentNumber: learner.documentNumber,
      status: learner.status,
      stateType: learner.stateType,
      novelty: learner.novelty,
      gradeDate: learner.gradeDate,
      qualifiableDate: learner.qualifiableDate,
      foundInDatabase: learner.foundInDatabase ?? false
    })) || []
  };

  await fs.writeFile(destination, JSON.stringify(payload, null, 2), 'utf-8');

  return destination;
}