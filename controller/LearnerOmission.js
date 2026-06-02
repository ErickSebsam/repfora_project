import LearnerOmission from '../models/LearnerOmission.js';

export async function omitLearner(req, res) {
  const { scheduleId, learnerDocument } = req.body;

  try {
    // Usamos findOneAndUpdate con upsert: true para crear si no existe
    // y evitar errores de duplicados si le dan clic varias veces.
    await LearnerOmission.findOneAndUpdate(
      { schedule: scheduleId, documentNumber: learnerDocument },
      { schedule: scheduleId, documentNumber: learnerDocument },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Aprendiz omitido correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

