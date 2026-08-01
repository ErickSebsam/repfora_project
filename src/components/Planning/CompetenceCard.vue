<template>
  <q-card flat bordered square class="q-mb-xl shadow-2 course-card">
    <q-card-section class="q-pa-md section-header">
      <!-- Actividad de Proyecto -->
      <div class="q-mb-sm">
        <div class="text-overline text-green-9 text-bold">ACTIVIDAD DE PROYECTO</div>
        <div class="text-subtitle2 text-grey-10 text-weight-bold" style="line-height: 1.2">
          {{ store.currentPhaseData?.projectActivity || 'Actividad general del proyecto' }}
        </div>
      </div>

      <!-- Nombre de la Competencia y Código -->
      <div class="row items-start no-wrap q-mt-md">
        <div class="col">
          <div class="text-overline text-green-9 text-bold">COMPETENCIA</div>
          <div class="text-h6 text-weight-bolder text-green-10 leading-tight" style="font-size: 1.1rem; line-height: 1.3">
            {{ comp.name || comp.description || comp.nombre || 'Nombre de competencia no disponible' }}
          </div>
        </div>
        <q-badge square color="green-9" class="q-pa-sm text-weight-bold q-ml-md self-start shadow-1" style="font-size: 13px">
          Cód. {{ comp.code }}
        </q-badge>
      </div>

      <!-- Progreso de Horas (Ahora más compacto y visible) -->
      <div class="q-mt-md bg-white q-pa-sm border-green-light" style="border-radius: 0;">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-caption text-weight-bold text-uppercase" :class="progressColor.text">
            Distribución de Horas: {{ progress.assigned }}h asignadas de {{ comp.totalCompetenceHours }}h totales
            <q-icon name="warning" color="orange-9" v-if="progress.assigned > comp.totalCompetenceHours" class="q-ml-xs">
              <q-tooltip>Se ha excedido el tiempo total de la competencia</q-tooltip>
            </q-icon>
          </div>
        </div>
        <q-linear-progress :value="progress.percent" :color="progressColor.bar" size="8px" square track-color="grey-2" />
      </div>
    </q-card-section>

    <q-separator color="green-3" />

    <div v-for="(rap, rIdx) in comp.learningOutcomes" :key="rIdx" class="q-mb-md">
      <LearningOutcomeItem :rap="rap" :comp="comp" :rIdx="rIdx" :instructors="instructors"
        @open-scheduler="$emit('open-scheduler', $event)" />
    </div>
  </q-card>
</template>

<script setup>
import { computed } from 'vue';
import { usePlanningStore } from '../../store/planning.store';
import LearningOutcomeItem from './LearningOutcomeItem.vue';

const props = defineProps({
  comp: { type: Object, required: true },
  instructors: { type: Array, required: true }
});

defineEmits(['open-scheduler']);

const store = usePlanningStore();

const progress = computed(() => store.getCompetenceProgress(props.comp));

const progressColor = computed(() => {
  const p = progress.value;
  if (p.assigned > p.total) return { bar: 'red-8', text: 'text-red-9' };
  if (p.assigned === p.total) return { bar: 'green-6', text: 'text-green-9' };
  if (p.percent > 0.8) return { bar: 'orange-8', text: 'text-orange-9' };
  return { bar: 'green-9', text: 'text-green-9' };
});
</script>

<style scoped>
.section-header {
  background-color: #e8f5e9;
}

.course-card {
  border: 1px solid #e0e0e0;
}
</style>