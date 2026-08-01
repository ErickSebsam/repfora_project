<template>
  <q-card square flat bordered class="schedule-calendar" style="width: 800px; max-width: 95vw; max-height: 90vh; display: flex; flex-direction: column;">
    <!-- Header Repfora: Cuadrado y Sólido -->
    <q-card-section class="bg-green-9 q-px-lg row items-center justify-between" style="flex: 0 0 auto;">
      <div>
        <h5 class="q-my-none text-white text-weight-bold flex items-center text-uppercase">
          <q-icon name="calendar_month" class="q-mr-sm" />
          PROGRAMACIÓN DE CALENDARIO
        </h5>
        <div class="text-green-1 text-caption q-mt-xs text-weight-medium text-uppercase">
          {{ activityLabel }}
        </div>
      </div>
      <q-btn square icon="close" flat round dense color="white" @click="$emit('close')" />
    </q-card-section>

    <q-separator color="white" size="2px" />

    <!-- Contenedor con Scroll para el Formulario y Calendario -->
    <div class="col scroll" style="overflow-y: auto; flex: 1 1 auto;">
      
      <!-- Banner Informativo de Ventana de Tiempo (REFORA STYLE) -->
      <q-card-section class="q-pa-sm bg-blue-1 text-blue-10 text-center text-weight-bold border-bottom">
        <q-icon name="info" size="xs" class="q-mr-xs" />
        VENTANA DE PROGRAMACIÓN: {{ formatDateCO(lectivaStartDate) }} AL {{ formatDateCO(lectivaEndDate) }}
      </q-card-section>

      <!-- Sección de Entrada de Horas -->
      <q-card-section class="q-pa-md bg-grey-1 border-bottom">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-6">
          <q-input
            square
            filled
            type="number"
            v-model.number="localHours.direct"
            label="Horas Directas"
            min="0"
            color="green-9"
          >
            <template v-slot:prepend><q-icon name="schedule" color="green-9" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-6">
          <q-input
            square
            filled
            type="number"
            v-model.number="localHours.independent"
            label="Horas Indirectas"
            min="0"
            color="grey-8"
          >
            <template v-slot:prepend><q-icon name="psychology" color="grey-8" /></template>
          </q-input>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-md">
        <!-- Fecha de inicio -->
        <div class="col-12 col-md-4">
          <q-input
            square
            filled
            type="date"
            v-model="config.startDate"
            label="Fecha de Inicio"
            :disable="!localHours.direct"
            color="green-9"
          >
            <template v-slot:prepend><q-icon name="event" color="green-9" /></template>
          </q-input>
        </div>

        <!-- Jornada -->
        <div class="col-12 col-md-4">
          <q-select
            square
            filled
            v-model="config.shift"
            :options="shiftOptions"
            label="Jornada"
            emit-value
            map-options
            :display-value="displayShiftLabel"
            :disable="!localHours.direct"
            @update:model-value="handleShiftUpdate"
            color="green-9"
          >
            <template v-slot:prepend><q-icon name="light_mode" color="green-9" /></template>
          </q-select>
        </div>

        <!-- Info calculada -->
        <div class="col-12 col-md-4">
          <q-card square flat bordered class="bg-green-1 q-pa-sm full-height flex flex-center text-center">
            <div>
              <div class="text-caption text-green-9 text-weight-bolder uppercase">Resumen</div>
              <div class="text-subtitle2 text-grey-9 text-weight-medium q-mt-xs" v-if="localHours.direct > 0">
                <span class="text-green-9 text-weight-bolder">{{ localHours.direct }}h</span> directas ÷
                <span class="text-green-9 text-weight-bolder">{{ hoursPerDay }}h</span>/día =
                <span class="text-green-9 text-weight-bolder">{{ daysNeeded }}</span> sesiones
              </div>
              <div class="text-caption text-grey-6" v-else>
                Ingresa horas directas
              </div>
            </div>
          </q-card>
        </div>

        <!-- Días de la semana -->
        <div class="col-12">
          <div class="text-caption text-bold text-green-9 q-mb-sm flex items-center text-uppercase">
            <q-icon name="today" class="q-mr-xs" />
            Días de clase en la semana:
          </div>
          <div class="row q-gutter-sm">
            <q-checkbox
              square
              v-for="day in weekDays"
              :key="day.value"
              v-model="config.selectedDays"
              :val="day.value"
              :label="day.label"
              color="green-9"
              dense
              :disable="!localHours.direct"
              class="text-weight-medium"
            />
          </div>
        </div>

        <!-- Novedades de Horarios Activas (DÍAS CUADRADOS) -->
        <div v-if="globalVacations.length > 0" class="col-12 q-mt-md">
          <q-card flat bordered square class="bg-amber-1 q-pa-md" style="border: 1px solid #ffe082;">
            <div class="text-caption text-bold text-amber-9 q-mb-sm flex items-center justify-between text-uppercase">
              <span class="flex items-center">
                <q-icon name="beach_access" class="q-mr-xs" size="18px" />
                DÍAS NO PROGRAMABLES / VACACIONES
              </span>
              <q-btn
                flat
                square
                dense
                size="sm"
                color="amber-9"
                label="Gestionar"
                icon="settings"
                to="/planning-schedules"
              />
            </div>
            <div class="q-gutter-y-xs q-mt-xs">
              <div v-for="v in globalVacations" :key="v.id" class="text-caption text-amber-9 text-weight-medium">
                • <strong>{{ formatDateCO(v.start) }} al {{ formatDateCO(v.end) }}</strong>: {{ v.reason }}
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Vista Previa de Sesiones -->
    <q-card-section class="bg-grey-1" v-if="localHours.direct > 0">
      <div class="text-subtitle2 text-green-10 text-bold q-mb-md flex items-center text-uppercase">
        <q-icon name="visibility" class="q-mr-sm" />
        VISTA PREVIA Y SELECCIÓN DE SESIONES
      </div>

      <div v-if="sessions.length === 0" class="text-grey text-caption q-pa-lg text-center bg-white border-all">
        <q-icon name="calendar_today" size="3em" color="grey-4" class="q-mb-sm" />
        <div class="text-weight-medium">Selecciona la fecha de inicio y días válidos para generar el calendario.</div>
      </div>

      <!-- CONTENEDOR DE CALENDARIO INLINE -->
      <div v-else class="calendar-wrapper q-pa-sm bg-white border-all">
        <!-- Calendar Header Navigation -->
        <div class="row items-center justify-between q-py-md q-px-md bg-green-1 q-mb-sm">
          <q-btn square flat round dense icon="chevron_left" color="green-9" @click="prevMonth" />
          <div class="text-subtitle1 text-weight-bolder text-green-10 tracking-wide text-uppercase">
            {{ monthName }} — {{ currentYear }}
          </div>
          <q-btn square flat round dense icon="chevron_right" color="green-9" @click="nextMonth" />
        </div>

        <div class="calendar-grid">
          <!-- Week Days Header -->
          <div v-for="day in calendarWeekDays" :key="day" class="weekday-header text-center text-weight-bolder text-green-9 q-py-xs">
            {{ day }}
          </div>

          <!-- Days Grid -->
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index" 
            class="calendar-day"
            :class="{ 
              'inactive-day': !day.currentMonth, 
              'out-of-range-day': day.isOutOfRange,
              'today-day': day.isToday,
              'programmed-day': day.session && !day.isHoliday,
              'holiday-day': day.isHoliday,
              'occupied-day': day.isOccupied,
              'vacation-day': day.isVacation && !day.session,
              'clickable-day': day.currentMonth && !day.isOccupied && !day.isHoliday && !day.isOutOfRange
            }"
            @click="handleDayClick(day)"
          >
            <div class="row justify-between items-center full-width">
              <span class="day-number">{{ day.date.getDate() }}</span>
              <q-badge square v-if="day.isToday" color="green-8" class="today-dot" />
            </div>
            
            <!-- Indicador de horas programadas -->
            <div class="day-hours text-weight-bold" v-if="day.session && !day.isHoliday">
              <q-badge square color="white" text-color="green-10" dense class="q-px-xs text-weight-bolder" style="font-size: 10px;">
                {{ day.session.horas }}h
              </q-badge>
            </div>

            <!-- Indicadores de estado (BADGES CUADRADOS) -->
            <div class="day-status-indicator full-width text-center" v-if="day.isOccupied">
              <span class="micro-badge bg-red-2 text-red-9">Ocupado</span>
            </div>

            <div class="day-status-indicator full-width text-center" v-if="day.isHoliday">
              <span class="micro-badge bg-red-2 text-red-9">Festivo</span>
            </div>

            <div class="day-status-indicator full-width text-center" v-if="day.isOutOfRange && day.currentMonth">
              <span class="micro-badge bg-grey-3 text-grey-7">No Válido</span>
            </div>

            <div class="day-status-indicator full-width text-center" v-if="day.isVacation && !day.session">
              <span class="micro-badge bg-amber-2 text-amber-9 text-weight-bold">Novedad</span>
            </div>

            <q-tooltip v-if="day.isOutOfRange && day.currentMonth" class="bg-grey-9 text-weight-bold">
              🚫 Fuera del rango de la ficha ({{ formatDateCO(lectivaStartDate) }} - {{ formatDateCO(lectivaEndDate) }})
            </q-tooltip>

            <q-tooltip v-if="day.isHoliday" class="bg-red-8 text-weight-bold">
              🚫 Festivo: {{ day.holidayName }}
            </q-tooltip>
          </div>
        </div>
      </div>

      <!-- Resumen de sesiones -->
      <div v-if="sessions.length > 0" class="row q-gutter-md q-mt-md">
        <q-badge square color="green-1" text-color="green-10" class="q-pa-sm text-weight-bolder" style="font-size: 12px; border: 1px solid #c8e6c9;">
          <q-icon name="check_circle" size="xs" class="q-mr-xs" />
          {{ effectiveSessions }} sesiones hábiles
        </q-badge>
        <q-badge square color="blue-1" text-color="blue-10" class="q-pa-sm text-weight-bolder" style="font-size: 12px; border: 1px solid #bbdefb;">
          <q-icon name="schedule" size="xs" class="q-mr-xs" />
          {{ effectiveHours }}h programadas
        </q-badge>
      </div>
    </q-card-section>
    </div> <!-- Fin contenedor con Scroll -->

    <q-separator />

    <!-- Acciones Repfora: Cuadradas y Sólidas -->
    <q-card-actions align="right" class="q-pa-md bg-grey-2" style="flex: 0 0 auto;">
      <q-btn square flat label="CANCELAR" color="grey-8" class="text-bold q-px-lg" @click="$emit('close')" />
      <q-btn
        square
        label="CONFIRMAR PROGRAMACIÓN"
        class="bg-green-9 text-white text-bold q-px-xl"
        icon="save"
        :disabled="localHours.direct > 0 && effectiveSessions === 0"
        @click="confirmSchedule"
        unelevated
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { getDayName, getHoursPerDay, calculateWorkDays, generateSessions, formatDateCO } from '../../utils/dateUtils';
import { isHoliday, getHolidayName } from '../../utils/holidays';
import { usePlanningStore } from '../../store/planning.store';

const $q = useQuasar();
const store = usePlanningStore();

const props = defineProps({
  initialHours: { type: Object, default: () => ({ direct: 0, independent: 0 }) },
  initialShift: { type: String, default: 'diurna' },
  activityLabel: { type: String, default: 'Actividad de aprendizaje' },
  currentActivity: { type: Object, default: null }
});

const emit = defineEmits(['close', 'confirm']);

// --- Metadatos de la ficha ---
const lectivaStartDate = computed(() => store.planning?.pedagogicalPlanning?.metadata?.lectivaStartDate || '2024-01-01');
const lectivaEndDate = computed(() => store.planning?.pedagogicalPlanning?.metadata?.lectivaEndDate || '2025-12-31');

const occupiedDates = computed(() => {
  if (!store.planning) return [];
  const dates = [];
  const content = store.planning.pedagogicalPlanning.content;

  content.forEach(phase => {
    phase.competencies.forEach(comp => {
      comp.learningOutcomes.forEach(rap => {
        rap.pedagogicalActivities.forEach(act => {
          if (props.currentActivity && act === props.currentActivity) return;
          if (act.scheduleDetails && act.scheduleDetails.assignedDays) {
            act.scheduleDetails.assignedDays.forEach(dayStr => dates.push(dayStr));
          }
        });
      });
    });
  });
  return dates;
});

const localHours = reactive({
  direct: props.initialHours.direct || 0,
  independent: props.initialHours.independent || 0
});

const config = ref({
  startDate: new Date().toISOString().split('T')[0],
  shift: props.initialShift,
  selectedDays: [1, 2, 3, 4, 5],
});

const previousShift = ref(config.value.shift);

const displayShiftLabel = computed(() => {
  if (config.value.shift === 'mixta_manana') return 'Mixta (Mañana)';
  if (config.value.shift === 'mixta_manana_tarde') return 'Mixta (Mañana/Tarde)';
  if (config.value.shift === 'mixta') return 'Mixta';
  const matched = shiftOptions.find(o => o.value === config.value.shift);
  return matched ? matched.label : config.value.shift;
});

const handleShiftUpdate = (val) => {
  if (val === 'mixta') {
    $q.dialog({
      title: 'Jornada Mixta',
      message: 'Seleccione el tipo de Jornada Mixta:',
      options: {
        type: 'radio',
        model: 'mixta_manana',
        items: [
          { label: 'Mañana (7:00 AM - 12:00 PM)', value: 'mixta_manana' },
          { label: 'Mañana y Tarde (7:00 AM - 12:00 PM / 1:00 PM - 5:59 PM)', value: 'mixta_manana_tarde' }
        ]
      },
      cancel: true,
      persistent: true
    }).onOk(selectedVal => {
      config.value.shift = selectedVal;
      previousShift.value = selectedVal;
    }).onCancel(() => {
      config.value.shift = previousShift.value;
    });
  } else {
    previousShift.value = val;
  }
};

// ── Estado de vacaciones globales cargadas de localStorage ──
// Forzar que la fecha de inicio esté dentro del rango
watch(() => config.value.startDate, (newVal) => {
  if (newVal < lectivaStartDate.value) config.value.startDate = lectivaStartDate.value;
  if (newVal > lectivaEndDate.value) config.value.startDate = lectivaEndDate.value;
}, { immediate: true });

const globalVacations = ref([]);
const loadGlobalVacations = () => {
  try {
    const data = localStorage.getItem('planning_vacations');
    globalVacations.value = data ? JSON.parse(data) : [];
  } catch (e) { globalVacations.value = []; }
};
loadGlobalVacations();

const shiftOptions = [
  { label: 'Mañana / Tarde (6h/día)', value: 'diurna' },
  { label: 'Noche (5h/día)', value: 'nocturna' },
  { label: 'Mixta', value: 'mixta' },
];

const weekDays = [
  { label: 'Lun', value: 1 }, { label: 'Mar', value: 2 }, { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 }, { label: 'Vie', value: 5 }, { label: 'Sáb', value: 6 },
];

const hoursPerDay = computed(() => getHoursPerDay(config.value.shift));
const daysNeeded = computed(() => calculateWorkDays(localHours.direct, config.value.shift));
const sessions = ref([]);

watch(
  [() => config.value.startDate, () => config.value.shift, () => config.value.selectedDays, () => localHours.direct],
  () => {
    if (!localHours.direct || localHours.direct <= 0 || config.value.selectedDays.length === 0 || !config.value.startDate) {
      sessions.value = [];
      return;
    }
    sessions.value = generateSessions(
      localHours.direct,
      config.value.startDate,
      config.value.selectedDays,
      config.value.shift,
      occupiedDates.value,
      globalVacations.value
    ).filter(s => s.fecha >= lectivaStartDate.value && s.fecha <= lectivaEndDate.value);
  },
  { immediate: true, deep: true }
);

const effectiveSessions = computed(() => sessions.value.filter((s) => !s.festivo).length);
const effectiveHours = computed(() =>
  sessions.value.filter((s) => !s.festivo).reduce((sum, s) => sum + s.horas, 0)
);

const confirmSchedule = () => {
  emit('confirm', {
    sessions: sessions.value,
    shift: config.value.shift,
    hours: { ...localHours },
    startDate: config.value.startDate,
    selectedDays: config.value.selectedDays,
    vacation: globalVacations.value
  });
};

import { getMonthName } from '../../utils/dateUtils';
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const calendarWeekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const monthName = computed(() => getMonthName(currentMonth.value));

watch(() => config.value.startDate, (newVal) => {
  if (newVal) {
    const d = new Date(newVal + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      currentMonth.value = d.getMonth();
      currentYear.value = d.getFullYear();
    }
  }
}, { immediate: true });

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const days = [];
  
  const getVacationReasonForDate = (dateStr) => {
    const match = globalVacations.value.find(v => dateStr >= v.start && dateStr <= v.end);
    return match ? match.reason : null;
  };

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), currentMonth: false });
  }

  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDay; i++) {
    const date = new Date(year, month, i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const session = sessions.value.find(s => s.fecha === dateStr);
    const isOccupied = occupiedDates.value.includes(dateStr);
    const holiday = isHoliday(dateStr);
    const holidayName = getHolidayName(dateStr);
    const vacationReason = getVacationReasonForDate(dateStr);
    const isOutOfRange = dateStr < lectivaStartDate.value || dateStr > lectivaEndDate.value;

    days.push({
      date,
      currentMonth: true,
      isToday: dateStr === new Date().toISOString().split('T')[0],
      session: session || null,
      isOccupied,
      isHoliday: holiday,
      holidayName,
      isVacation: !!vacationReason,
      vacationReason,
      isOutOfRange
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ date: new Date(year, month + 1, i), currentMonth: false });
  }
  return days;
});

const handleDayClick = (day) => {
  if (!day.currentMonth || day.isOccupied || day.isOutOfRange) return;

  const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;

  if (day.isHoliday) {
    $q.notify({ message: `Día festivo bloqueado.`, color: 'red-9', position: 'top' });
    return;
  }

  const sessionIndex = sessions.value.findIndex(s => s.fecha === dateStr);
  if (sessionIndex !== -1) {
    sessions.value.splice(sessionIndex, 1);
  } else {
    const currentProgrammedHours = sessions.value.filter(s => !s.festivo).reduce((sum, s) => sum + s.horas, 0);
    const remainingHours = localHours.direct - currentProgrammedHours;

    if (remainingHours <= 0) {
      $q.notify({ message: 'Ya se han programado todas las horas requeridas.', color: 'warning', position: 'top' });
      return;
    }

    const hrs = Math.min(hoursPerDay.value, remainingHours);
    const addSess = () => {
      sessions.value.push({ fecha: dateStr, horas: hrs, festivo: false });
      sessions.value.sort((a, b) => a.fecha.localeCompare(b.fecha));
    };

    if (day.isVacation) {
      $q.dialog({
        title: '⚠️ Programar en Vacaciones / Novedad',
        message: `¿Está seguro de que desea programar clases en este día de vacaciones?`,
        html: true,
        cancel: { color: 'grey-8', flat: true, label: 'Cancelar' },
        ok: { color: 'amber-9', label: 'Sí, Programar' },
        persistent: true
      }).onOk(addSess);
    } else addSess();
  }
};

const prevMonth = () => { if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; } else currentMonth.value--; };
const nextMonth = () => { if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; } else currentMonth.value++; };
</script>

<style scoped>
.schedule-calendar { overflow: hidden; }
.border-bottom { border-bottom: 1px solid #e0e0e0; }
.calendar-wrapper { border: 1px solid #e0e0e0; background: white; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border-left: 1px solid #e0e0e0; border-top: 1px solid #e0e0e0; }
.weekday-header { border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; font-size: 0.85rem; background: #f1f8e9; }
.calendar-day { min-height: 70px; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-radius: 0 !important; }
.day-number { font-size: 0.8rem; font-weight: 700; color: #555; }
.inactive-day { background-color: #fafafa; color: #ccc; }
.out-of-range-day { background-color: #f5f5f5; color: #bbb; cursor: not-allowed; opacity: 0.6; }
.programmed-day { background-color: #2e7d32 !important; color: white !important; }
.holiday-day, .occupied-day { background-color: #ffebee !important; color: #c62828 !important; }
.vacation-day { background-color: #fff8e1 !important; color: #b78103 !important; }
.clickable-day { cursor: pointer; }
.micro-badge { font-size: 8px; font-weight: 800; padding: 2px 4px; text-transform: uppercase; border-radius: 0 !important; }
.q-btn, .q-card, .q-badge, .q-field__control { border-radius: 0 !important; }
</style>
