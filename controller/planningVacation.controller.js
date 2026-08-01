import PlanningVacation from '../models/PlanningVacation.js';

/**
 * Obtiene todos los días no programables ordenados por fecha de inicio
 * GET /api/planning/vacations
 */
export const getAllVacations = async (req, res) => {
  try {
    const vacations = await PlanningVacation.find().sort({ start: 1 });
    res.json(vacations);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener días no programables', error: error.message });
  }
};

/**
 * Crea un nuevo rango de días no programables
 * POST /api/planning/vacations
 * Body: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', reason: string, createdBy?: string }
 */
export const createVacation = async (req, res) => {
  try {
    const { start, end, reason, createdBy } = req.body;

    if (!start || !end || !reason) {
      return res.status(400).json({ message: 'Los campos start, end y reason son obligatorios' });
    }

    if (start > end) {
      return res.status(400).json({ message: 'La fecha de inicio no puede ser posterior a la de fin' });
    }

    const vacation = await PlanningVacation.create({
      start,
      end,
      reason: reason.trim(),
      createdBy: createdBy || '',
    });

    res.status(201).json({ message: 'Día no programable registrado correctamente', data: vacation });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear día no programable', error: error.message });
  }
};

/**
 * Actualiza un rango de días no programables existente
 * PUT /api/planning/vacations/:id
 * Body: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', reason: string }
 */
export const updateVacation = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, reason } = req.body;

    if (!start || !end || !reason) {
      return res.status(400).json({ message: 'Los campos start, end y reason son obligatorios' });
    }

    if (start > end) {
      return res.status(400).json({ message: 'La fecha de inicio no puede ser posterior a la de fin' });
    }

    const vacation = await PlanningVacation.findByIdAndUpdate(
      id,
      { start, end, reason: reason.trim() },
      { new: true }
    );

    if (!vacation) {
      return res.status(404).json({ message: 'Día no programable no encontrado' });
    }

    res.json({ message: 'Actualizado correctamente', data: vacation });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar día no programable', error: error.message });
  }
};

/**
 * Elimina un rango de días no programables
 * DELETE /api/planning/vacations/:id
 */
export const deleteVacation = async (req, res) => {
  try {
    const { id } = req.params;
    const vacation = await PlanningVacation.findByIdAndDelete(id);

    if (!vacation) {
      return res.status(404).json({ message: 'Día no programable no encontrado' });
    }

    res.json({ message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar día no programable', error: error.message });
  }
};
