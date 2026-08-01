<template>
  <q-dialog v-model="isOpen" persistent square>
    <ScheduleCalendar
      v-if="isOpen"
      :initial-hours="schedulerHours"
      :activity-label="schedulerLabel"
      :current-activity="schedulerContext?.act"
      @close="isOpen = false"
      @confirm="handleScheduleConfirm"
    />
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { usePlanningStore } from '../../store/planning.store';
import { InstructorService } from '../../services/instructor.service';
import ScheduleCalendar from '../PlanningCalendar/ScheduleCalendar.vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  schedulerHours: { type: Object, required: true },
  schedulerLabel: { type: String, required: true },
  schedulerContext: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const store = usePlanningStore();
const $q = useQuasar();

const handleScheduleConfirm = async (data) => {
  const { comp, act } = props.schedulerContext;
  
  // 1. Regla R1: Validar exceso de horas en la competencia
  const progress = store.getCompetenceProgress(comp);
  const alreadyAssignedOtherActs = progress.assigned - (act.hours?.direct || 0) - (act.hours?.independent || 0);
  const newTotal = alreadyAssignedOtherActs + Number(data.hours.direct) + Number(data.hours.independent);

  if (newTotal > comp.totalCompetenceHours) {
    const proceed = await new Promise(resolve => {
      $q.dialog({
        title: '⚠️ Exceso de Horas ',
        message: `El total de horas asignadas (${newTotal}h) superaría el límite de la competencia (${comp.totalCompetenceHours}h). ¿Desea continuar?`,
        cancel: { color: 'grey-8', flat: true, label: 'Cancelar' },
        ok: { color: 'red-8', label: 'Sí, continuar' },
        persistent: true
      }).onOk(() => resolve(true)).onCancel(() => resolve(false));
    });
    if (!proceed) return;
  }

  // 2. Regla R4: Detección de Conflictos de Horario del Instructor
  $q.loading.show({ message: 'Verificando disponibilidad del instructor...' });
  try {
    const dates = data.sessions.map(s => s.fecha);
    const instructorId = act.suggestedInstructor?.id || act.instructors?.id;
    const currentFiche = store.planning?.pedagogicalPlanning?.fiche;

    if (instructorId && dates.length > 0) {
      const availability = await InstructorService.checkAvailability(instructorId, dates, data.shift, currentFiche);
      
      if (availability.hasConflict) {
        $q.loading.hide(); 
        
        const conflictMsg = availability.conflicts.map(c => 
          `• Ficha ${c.fiche}: ${c.activity} (Días: ${c.conflictingDays.join(', ')})`
        ).join('<br>');

        const proceedConflict = await new Promise(resolve => {
          $q.dialog({
            title: '🚫 Conflicto de Horario ',
            message: `El instructor ya tiene asignaciones en el mismo horario:<br><br>${conflictMsg}<br><br>¿Desea ignorar el conflicto y guardar?`,
            html: true,
            cancel: { color: 'grey-8', flat: true, label: 'Cancelar' },
            ok: { color: 'orange-9', label: 'Ignorar y Guardar' },
            persistent: true
          }).onOk(() => resolve(true)).onCancel(() => resolve(false));
        });
        if (!proceedConflict) return;
      }
    }
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
  } finally {
    $q.loading.hide();
  }

  saveActivitySchedule(data);
};

const saveActivitySchedule = async (data) => {
  const { act } = props.schedulerContext;
  
  act.hours = { 
    direct: Number(data.hours.direct), 
    independent: Number(data.hours.independent) 
  };
  
  act.scheduleDetails = {
    assignedDays: data.sessions.map(s => s.fecha),
    shift: data.shift,
    vacation: data.vacation ? { ...data.vacation } : null
  };

  await store.saveDraft();
  isOpen.value = false;
  $q.notify({ message: 'Programación guardada en base de datos ✅', color: 'green-9' });
};
</script>
