import PlanningShift from '../models/PlanningShift.js';

const defaultShifts = [
  { name: 'Mañana / Tarde (6h/día)', code: 'diurna', hoursPerDay: 6, allowedDays: [1, 2, 3, 4, 5], defaultStartTime: '06:00', defaultEndTime: '12:00', isCustom: false },
  { name: 'Noche (5h/día)', code: 'nocturna', hoursPerDay: 5, allowedDays: [1, 2, 3, 4, 5, 6], defaultStartTime: '18:00', defaultEndTime: '22:00', isCustom: false },
  { name: 'Mixta (Mañana) (5h/día)', code: 'mixta_manana', hoursPerDay: 5, allowedDays: [1, 2, 3, 4, 5], defaultStartTime: '07:00', defaultEndTime: '12:00', isCustom: false },
  { name: 'Mixta (Mañana/Tarde) (10h/día)', code: 'mixta_manana_tarde', hoursPerDay: 10, allowedDays: [1, 2, 3, 4, 5], defaultStartTime: '07:00', defaultEndTime: '17:00', isCustom: false },
  { name: 'Jornada Especial (Personalizado)', code: 'personalizado', hoursPerDay: 0, allowedDays: [1, 2, 3, 4, 5, 6, 7], defaultStartTime: '', defaultEndTime: '', isCustom: true }
];

/**
 * Obtiene todas las jornadas. Si no hay registros, siembra las por defecto.
 * GET /api/planning/shifts
 */
export const getAllShifts = async (req, res) => {
  try {
    let shifts = await PlanningShift.find().sort({ createdAt: 1 });
    
    // Si no existen, sembrar por defecto
    if (shifts.length === 0) {
      await PlanningShift.insertMany(defaultShifts);
      shifts = await PlanningShift.find().sort({ createdAt: 1 });
    }
    
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener jornadas', error: error.message });
  }
};

/**
 * Crea una nueva jornada
 * POST /api/planning/shifts
 */
export const createShift = async (req, res) => {
  try {
    const { name, code, hoursPerDay, allowedDays, defaultStartTime, defaultEndTime, isCustom } = req.body;

    if (!name || !code || hoursPerDay === undefined) {
      return res.status(400).json({ message: 'Los campos name, code y hoursPerDay son obligatorios' });
    }

    const existing = await PlanningShift.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una jornada con ese nombre o código' });
    }

    const shift = await PlanningShift.create({
      name: name.trim(),
      code: code.trim().toLowerCase(),
      hoursPerDay,
      allowedDays: allowedDays || [1, 2, 3, 4, 5],
      defaultStartTime: defaultStartTime || '',
      defaultEndTime: defaultEndTime || '',
      isCustom: !!isCustom,
      status: 0
    });

    res.status(201).json({ message: 'Jornada creada con éxito', data: shift });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear jornada', error: error.message });
  }
};

/**
 * Actualiza una jornada existente
 * PUT /api/planning/shifts/:id
 */
export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, hoursPerDay, allowedDays, defaultStartTime, defaultEndTime, isCustom, status } = req.body;

    if (!name || hoursPerDay === undefined) {
      return res.status(400).json({ message: 'Los campos name y hoursPerDay son obligatorios' });
    }

    const shift = await PlanningShift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Jornada no encontrada' });
    }

    // Verificar nombre único si cambia
    if (name !== shift.name) {
      const existingName = await PlanningShift.findOne({ name });
      if (existingName) {
        return res.status(400).json({ message: 'Ya existe una jornada con ese nombre' });
      }
    }

    shift.name = name.trim();
    shift.hoursPerDay = hoursPerDay;
    shift.allowedDays = allowedDays || [1, 2, 3, 4, 5];
    shift.defaultStartTime = defaultStartTime || '';
    shift.defaultEndTime = defaultEndTime || '';
    shift.isCustom = !!isCustom;
    if (status !== undefined) shift.status = status;

    await shift.save();

    res.json({ message: 'Jornada actualizada con éxito', data: shift });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar jornada', error: error.message });
  }
};

/**
 * Elimina una jornada (o la inactiva)
 * DELETE /api/planning/shifts/:id
 */
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Para evitar romper consistencia, no eliminamos del todo, hacemos borrado lógico/inactivación
    // o eliminación directa si el usuario lo prefiere. Hagamos eliminación física pero validando.
    const shift = await PlanningShift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Jornada no encontrada' });
    }
    
    // Evitar eliminar la personalizada por defecto si es crítica
    if (shift.code === 'personalizado') {
      return res.status(400).json({ message: 'No se puede eliminar la jornada personalizada por defecto por ser requerida por el sistema' });
    }

    await PlanningShift.findByIdAndDelete(id);
    res.json({ message: 'Jornada eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar jornada', error: error.message });
  }
};
