<template>
  <q-card flat bordered class="hour-matrix">
    <!-- Header -->
    <q-card-section class="bg-green-9 text-white row items-center no-wrap q-py-sm">
      <q-icon name="bar_chart" size="sm" class="q-mr-sm" />
      <div class="text-subtitle1 text-weight-bold">RESUMEN DE HORAS POR COMPETENCIA</div>
      <q-space />
      <q-badge
        :color="allComplete ? 'green-2' : 'orange-2'"
        :text-color="allComplete ? 'green-10' : 'orange-10'"
        class="text-weight-bold"
      >
        {{ completedCount }}/{{ computedData.length }} completas
      </q-badge>
    </q-card-section>

    <!-- Tabla de competencias -->
    <q-card-section class="q-pa-none">
      <div class="matrix-grid">
        <!-- Header de tabla -->
        <div class="matrix-row matrix-header bg-grey-2">
          <div class="matrix-cell cell-name text-caption text-bold text-grey-8">COMPETENCIA</div>
          <div class="matrix-cell cell-code text-caption text-bold text-grey-8">CÓDIGO</div>
          <div class="matrix-cell cell-hours text-caption text-bold text-grey-8">DIRECTAS</div>
          <div class="matrix-cell cell-hours text-caption text-bold text-grey-8">INDIRECTAS</div>
          <div class="matrix-cell cell-hours text-caption text-bold text-grey-8">ASIGNADAS</div>
          <div class="matrix-cell cell-hours text-caption text-bold text-grey-8">REQUERIDAS</div>
          <div class="matrix-cell cell-status text-caption text-bold text-grey-8">ESTADO</div>
        </div>

        <!-- Filas de competencia -->
        <div
          v-for="comp in computedData"
          :key="comp.code"
          class="matrix-row"
          :class="{
            'row-complete': comp.status === 'complete',
            'row-exceeded': comp.status === 'exceeded',
            'row-pending': comp.status === 'pending',
          }"
        >
          <div class="matrix-cell cell-name">
            <q-tooltip v-if="comp.name.length > 50" max-width="350px">{{ comp.name }}</q-tooltip>
            <span class="text-caption">{{ truncate(comp.name, 50) }}</span>
          </div>
          <div class="matrix-cell cell-code">
            <q-badge
              :color="comp.status === 'complete' ? 'green-9' : comp.status === 'exceeded' ? 'red' : 'grey-6'"
              class="text-weight-bold"
            >
              {{ comp.code }}
            </q-badge>
          </div>
          <div class="matrix-cell cell-hours text-caption text-center">
            <q-icon name="schedule" size="xs" color="blue-8" class="q-mr-xs" />
            {{ comp.directHours }}h
          </div>
          <div class="matrix-cell cell-hours text-caption text-center">
            <q-icon name="schedule" size="xs" color="purple-8" class="q-mr-xs" />
            {{ comp.independentHours }}h
          </div>
          <div class="matrix-cell cell-hours text-weight-bold text-center">
            {{ comp.assignedHours }}h
          </div>
          <div class="matrix-cell cell-hours text-caption text-center">
            {{ comp.requiredHours }}h
          </div>
          <div class="matrix-cell cell-status text-center">
            <q-chip
              v-if="comp.status === 'complete'"
              dense size="sm" color="green-9" text-color="white" icon="check_circle"
            >
              Completo
            </q-chip>
            <q-chip
              v-else-if="comp.status === 'exceeded'"
              dense size="sm" color="red" text-color="white" icon="warning"
            >
              +{{ Math.abs(comp.difference) }}h
            </q-chip>
            <q-chip
              v-else
              dense size="sm" color="amber-8" text-color="white" icon="info"
            >
              -{{ comp.difference }}h
            </q-chip>
          </div>
        </div>

        <!-- Sin datos -->
        <div v-if="computedData.length === 0" class="q-pa-lg text-center text-grey-6">
          <q-icon name="hourglass_empty" size="2em" class="q-mb-sm" />
          <div>No hay competencias cargadas.</div>
        </div>
      </div>
    </q-card-section>

    <!-- Barra de progreso total -->
    <q-card-section v-if="computedData.length > 0" class="bg-grey-1 q-py-sm">
      <div class="row items-center justify-between q-mb-xs">
        <span class="text-caption text-bold">
          Total: {{ totalAssigned }}h / {{ totalRequired }}h
        </span>
        <span
          class="text-caption text-bold"
          :class="totalDifference === 0 ? 'text-green-9' : totalDifference < 0 ? 'text-red' : 'text-amber-8'"
        >
          {{ totalDifference === 0 ? '✅ Completo' : totalDifference < 0 ? `⚠️ Excedido ${Math.abs(totalDifference)}h` : `Faltan ${totalDifference}h` }}
        </span>
      </div>
      <q-linear-progress
        :value="totalRequired > 0 ? Math.min(totalAssigned / totalRequired, 1) : 0"
        :color="totalDifference === 0 ? 'green-9' : totalDifference < 0 ? 'red' : 'amber-8'"
        track-color="grey-3"
        rounded
        size="8px"
      />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** Array completo de content[] del planning (todas las fases) */
  content: {
    type: Array,
    default: () => [],
  },
});

/** Extrae y calcula datos de todas las competencias en todas las fases */
const computedData = computed(() => {
  const map = {};

  props.content.forEach((phase) => {
    (phase.competencies || []).forEach((comp) => {
      if (!map[comp.code]) {
        map[comp.code] = {
          code: comp.code,
          name: comp.name,
          requiredHours: comp.totalCompetenceHours || 0,
          directHours: 0,
          independentHours: 0,
        };
      }

      (comp.learningOutcomes || []).forEach((rap) => {
        (rap.pedagogicalActivities || []).forEach((act) => {
          map[comp.code].directHours += Number(act.hours?.direct) || 0;
          map[comp.code].independentHours += Number(act.hours?.independent) || 0;
        });
      });
    });
  });

  return Object.values(map).map((c) => {
    const assigned = c.directHours + c.independentHours;
    const diff = c.requiredHours - assigned;
    return {
      ...c,
      assignedHours: assigned,
      difference: diff,
      status: diff === 0 ? 'complete' : diff < 0 ? 'exceeded' : 'pending',
    };
  });
});

const allComplete = computed(() => computedData.value.every((c) => c.status === 'complete'));
const completedCount = computed(() => computedData.value.filter((c) => c.status === 'complete').length);
const totalAssigned = computed(() => computedData.value.reduce((s, c) => s + c.assignedHours, 0));
const totalRequired = computed(() => computedData.value.reduce((s, c) => s + c.requiredHours, 0));
const totalDifference = computed(() => totalRequired.value - totalAssigned.value);

const truncate = (str, max) => (str.length > max ? str.slice(0, max) + '…' : str);
</script>

<style scoped>
.hour-matrix {
  border-radius: 8px;
  overflow: hidden;
}

.matrix-grid {
  overflow-x: auto;
}

.matrix-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  min-height: 44px;
  transition: background-color 0.2s ease;
}

.matrix-row:not(.matrix-header):hover {
  background-color: #f5f5f5;
}

.matrix-header {
  border-bottom: 2px solid #bdbdbd;
}

.matrix-cell {
  padding: 8px 12px;
  flex-shrink: 0;
}

.cell-name {
  flex: 1 1 280px;
  min-width: 200px;
}

.cell-code {
  flex: 0 0 120px;
  text-align: center;
}

.cell-hours {
  flex: 0 0 90px;
}

.cell-status {
  flex: 0 0 120px;
}

.row-complete {
  border-left: 4px solid #2e7d32;
}

.row-exceeded {
  border-left: 4px solid #c62828;
  background-color: #ffebee;
}

.row-pending {
  border-left: 4px solid #f57c00;
}
</style>
