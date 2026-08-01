<template>
  <q-card class="calendar-modal shadow-10" style="width: 1300px; max-width: 95vw;">
    <!-- Header -->
    <q-card-section class="bg-white q-pa-md row items-center justify-between border-bottom">
      <div class="row items-center q-gutter-md">
        <q-btn flat round icon="chevron_left" color="green-9" @click="prevMonth" />
        <div class="text-h5 text-weight-bolder text-green-10 text-uppercase">
          {{ monthName }} {{ currentYear }}
        </div>
        <q-btn flat round icon="chevron_right" color="green-9" @click="nextMonth" />
      </div>
      <q-btn icon="close" flat round dense color="grey-7" v-close-popup />
    </q-card-section>

    <!-- Calendar Grid -->
    <q-card-section class="q-pa-none">
      <div class="calendar-grid">
        <!-- Week Days Header -->
        <div v-for="day in weekDays" :key="day" class="weekday-header text-center text-weight-bold text-green-9 q-pa-sm bg-grey-1">
          {{ day }}
        </div>

        <!-- Days -->
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index" 
          class="calendar-day"
          :class="{ 'bg-grey-2': !day.currentMonth, 'today': day.isToday }"
        >
          <div class="day-number q-pa-xs text-weight-bold" :class="day.currentMonth ? 'text-grey-9' : 'text-grey-5'">
            {{ day.date.getDate() }}
          </div>

          <!-- Events List -->
          <div class="events-container q-gutter-y-xs">
            <div 
              v-for="(event, eIdx) in day.events" 
              :key="eIdx"
              class="event-chip q-pa-xs rounded-borders cursor-pointer"
              @click="showEventDetails(event, $event)"
            >
              <div class="event-text ellipsis text-white text-weight-bold">
                {{ event.instructor }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Details Popup -->
    <q-menu v-if="detailsVisible" v-model="detailsVisible" :target="targetElement" persistent anchor="top middle" self="bottom middle" class="details-popup shadow-5">
      <q-card flat style="width: 350px">
        <q-card-section class="bg-green-1 q-pa-sm border-bottom">
          <div class="text-overline text-green-9 text-weight-bolder">DETALLES DE PROGRAMACIÓN</div>
          <q-btn icon="close" flat round dense size="sm" color="green-9" class="absolute-top-right q-ma-xs" v-close-popup />
        </q-card-section>
        
        <q-card-section class="q-pa-md q-gutter-y-sm">
          <div>
            <div class="text-caption text-weight-bold text-green-9">INSTRUCTOR:</div>
            <div class="text-body2 text-uppercase">{{ activeEvent.instructor }}</div>
          </div>
          <div v-if="activeEvent.environment">
            <div class="text-caption text-weight-bold text-green-9">AMBIENTE:</div>
            <div class="text-body2 text-uppercase">{{ activeEvent.environment }}</div>
          </div>
          <div>
            <div class="text-caption text-weight-bold text-green-9">PROGRAMA:</div>
            <div class="text-body2 text-uppercase">{{ programName }}</div>
          </div>
          <div>
            <div class="text-caption text-weight-bold text-green-9">RESULTADO:</div>
            <div class="text-body2 text-uppercase">{{ activeEvent.rap }}</div>
          </div>
          
          <div class="bg-green-10 text-white q-pa-xs text-center text-weight-bold rounded-borders q-mt-md" style="font-size: 10px">
            NOTA: RESULTADO TÉCNICO
          </div>
        </q-card-section>
      </q-card>
    </q-menu>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePlanningStore } from '../store/planning.store';
import { getMonthName } from '../utils/dateUtils';

const store = usePlanningStore();
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());

const weekDays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

// Details Popup State
const detailsVisible = ref(false);
const activeEvent = ref({});
const targetElement = ref(null);

const programName = computed(() => store.planning?.pedagogicalPlanning?.metadata?.programName || 'SENA');

const monthName = computed(() => getMonthName(currentMonth.value));

const scheduledEvents = computed(() => {
  if (!store.planning) return [];
  const events = [];
  const content = store.planning.pedagogicalPlanning.content;

  content.forEach(phase => {
    phase.competencies.forEach(comp => {
      comp.learningOutcomes.forEach(rap => {
        rap.pedagogicalActivities.forEach(act => {
          if (act.scheduleDetails && act.scheduleDetails.assignedDays) {
            act.scheduleDetails.assignedDays.forEach(dayStr => {
              events.push({
                date: dayStr,
                instructor: act.suggestedInstructor?.name || act.instructors?.name || 'SIN ASIGNAR',
                environment: act.environment?.type || 'NO DEFINIDO',
                activity: act.description,
                rap: rap.description,
                competence: comp.name
              });
            });
          }
        });
      });
    });
  });

  return events;
});

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom, 1=Lun...
  
  // Adjust for Monday start (SENA style)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const days = [];
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      currentMonth: false,
      events: []
    });
  }

  // Current month days
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDay; i++) {
    const date = new Date(year, month, i);
    // Timezone safe local date string format YYYY-MM-DD
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push({
      date: date,
      currentMonth: true,
      isToday: dateStr === new Date().toISOString().split('T')[0],
      events: scheduledEvents.value.filter(e => e.date === dateStr)
    });
  }

  // Next month padding to complete 6 rows (42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      currentMonth: false,
      events: []
    });
  }

  return days;
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const showEventDetails = (event, domEvent) => {
  activeEvent.value = event;
  targetElement.value = domEvent.currentTarget;
  detailsVisible.value = true;
};
</script>

<style scoped>
.calendar-modal {
  width: 95vw;
  max-width: 1300px;
  height: auto;
  border-radius: 16px;
  overflow: hidden;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-left: 1px solid #e0e0e0;
  border-top: 1px solid #e0e0e0;
}

.weekday-header {
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.75rem;
}

.calendar-day {
  min-height: 85px; /* Reducido de 120px para ajustar a pantallas de 638px de alto */
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  transition: background 0.2s;
}

.day-number {
  font-size: 0.9rem;
  text-align: right;
}

.today {
  background: #f1f8e9;
}

.events-container {
  padding: 2px;
}

.event-chip {
  background: #c2185b;
  font-size: 9px;
  line-height: 1.1;
  border-radius: 4px;
}

.event-chip:hover {
  filter: brightness(1.1);
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.details-popup {
  border-radius: 8px;
  border: 1px solid #2e7d32;
}
</style>
