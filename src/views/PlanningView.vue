<template>
  <div>
    <BtnBack route="/extract" />

    <HeaderLayout title="PLANEACIÓN PEDAGÓGICA AUTOMÁTICA" />

    <!-- Barra de acciones superior -->
    <PlanningActionBar :is-synced="!!store.planning" :is-leader="store.isLeader" :has-template="hasTemplate"
      @save-template="handleSaveTemplate" @import-template="handleImportTemplate" @clear-plan="handleClearPlan"
      @export-excel="exportPlanningToExcel(store.planning?.pedagogicalPlanning, $q)"
      @show-preview="showPreview = true" />

    <!-- TABS PARA FASES -->
    <q-tabs v-model="store.selectedPhase" class="q-mx-lg text-weight-bolder row q-mb-md" dense square align="justify"
      active-color="lime-2" active-bg-color="green-9" indicator-color="black">
      <q-tab v-for="phase in store.phaseCounts" :key="phase.id" :name="phase.id" class="text-green-9 bg-white"
        :icon="phase.icon" square :label="$q.screen.lt.sm ? '' : `${phase.label} (${phase.count})`"
        @click="store.setPhase(phase.id)" />
    </q-tabs>

    <q-tab-panels v-model="store.selectedPhase" keep-alive>
      <q-tab-panel v-for="phase in store.phaseCounts" :key="phase.id" :name="phase.id" class="q-px-lg">

        <!-- Búsqueda -->
        <div class="row q-gutter-sm q-mb-md justify-end">
          <q-input v-model="store.searchQuery" label="Buscar por código de competencia..." outlined square dense
            clearable style="width: 350px">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Tarjetas de Competencia -->
        <div v-if="store.filteredCompetencies.length > 0">
          <CompetenceCard v-for="comp in store.filteredCompetencies" :key="comp.code" :comp="comp"
            :instructors="instructors" @open-scheduler="handleOpenScheduler" />
        </div>

        <div v-else-if="!loading" class="text-center q-pa-xl">
          <q-icon name="search_off" size="64px" color="grey-4" />
          <div class="text-grey-6 q-mt-md" style="font-size: 16px">
            No se encontraron competencias para esta fase
          </div>
        </div>

      </q-tab-panel>
    </q-tab-panels>

    <!-- Dialog: Programar Calendario (Validaciones incluidas internamente) -->
    <ActivitySchedulerDialog v-model="showScheduler" :scheduler-hours="schedulerHours" :scheduler-label="schedulerLabel"
      :scheduler-context="schedulerContext" />

    <!-- Dialog: Previsualizar Programación Global -->
    <q-dialog v-model="showPreview" transition-show="scale" transition-hide="scale"
      content-class="custom-preview-dialog" square>
      <ProgramPreviewModal />
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlanningStore } from '../store/planning.store';
import { InstructorService } from '../services/instructor.service';
import { useQuasar } from 'quasar';
import BtnBack from '../layouts/btnBackLayout.vue';
import HeaderLayout from '../layouts/headerViewsLayout.vue';
import ProgramPreviewModal from '../components/ProgramPreviewModal.vue';
import CompetenceCard from '../components/Planning/CompetenceCard.vue';
import PlanningActionBar from '../components/Planning/PlanningActionBar.vue';
import ActivitySchedulerDialog from '../components/Planning/ActivitySchedulerDialog.vue';
import { exportPlanningToExcel } from '../services/exportPlanningExcel.js';
import { storeUser } from '../store/users';

const route = useRoute();
const router = useRouter();
const store = usePlanningStore();
const userStore = storeUser();
const $q = useQuasar();

// --- Lógica de Plantillas ---
const hasTemplate = ref(false);
const savedTemplate = ref(null);

const handleSaveTemplate = async () => {
  if (!store.planning) return;

  $q.dialog({
    title: '💾 Guardar Planilla del Programa',
    message: `¿Estás seguro de que deseas guardar la planeación actual como la planilla oficial del programa?<br><br>Esto servirá de plantilla de sugerencia para cualquier otra ficha de este programa en el futuro.`,
    html: true,
    ok: { color: 'green-9', label: 'GUARDAR' },
    cancel: { color: 'grey-8', flat: true, label: 'CANCELAR' },
    persistent: true
  }).onOk(async () => {
    $q.loading.show({ message: 'Guardando planilla de programa...' });
    try {
      const savedBy = userStore.email || 'Instructor';
      await store.savePlanningTemplate(savedBy);
      $q.loading.hide();
      $q.notify({ message: '¡Planilla guardada con éxito! 💾', color: 'green-9', icon: 'check_circle' });
    } catch (error) {
      $q.loading.hide();
      $q.notify({ message: 'Error al guardar la planilla', color: 'red-9', icon: 'error' });
    }
  });
};

const handleImportTemplate = async () => {
  if (!savedTemplate.value) return;
  $q.loading.show({ message: 'Importando planilla...' });
  try {
    await store.applyPlanningTemplate(savedTemplate.value);
    $q.loading.hide();
    $q.notify({ message: 'Plantilla aplicada con éxito 🚀', color: 'green-9', icon: 'stars' });
  } catch (error) {
    $q.loading.hide();
    $q.notify({ message: 'Error al importar planilla', color: 'red-9', icon: 'error' });
  }
};

const instructors = ref([]);
const loading = ref(false);

const showScheduler = ref(false);
const schedulerHours = ref({ direct: 0, independent: 0 });
const schedulerLabel = ref('');
const schedulerContext = ref(null);
const showPreview = ref(false);

const handleClearPlan = () => {
  store.clearPlan();
  router.push({ name: 'extract' });
};

const handleOpenScheduler = (payload) => {
  const { comp, rap, act } = payload;
  schedulerHours.value = {
    direct: act.hours?.direct || 0,
    independent: act.hours?.independent || 0
  };
  schedulerLabel.value = act.description;
  schedulerContext.value = { comp, rap, act };
  showScheduler.value = true;
};

onMounted(async () => {
  const fiche = route.query.fiche;
  if (fiche) {
    loading.value = true;
    try {
      await store.loadPlanning(fiche);
      if (store.planning) {
         const programCode = store.planning.pedagogicalPlanning.metadata.programCode;
         savedTemplate.value = await store.fetchPlanningTemplate(programCode);
         hasTemplate.value = !!savedTemplate.value;
      }
    } catch (e) {
      if (e.message === 'PLANNING_NOT_FOUND' || e.response?.status === 404) {
        $q.dialog({
          title: '🚫 Ficha no encontrada',
          message: `La ficha <b>${fiche}</b> no existe en la base de datos. Realice la extracción primero.`,
          html: true,
          ok: { color: 'green-9', label: 'IR A EXTRACCIÓN' },
          persistent: true
        }).onOk(() => {
          router.push({ name: 'extract' });
        });
      }
    } finally {
      loading.value = false;
    }
  }

  try {
    const instList = await InstructorService.getInstructors();
    instructors.value = instList;
  } catch (e) {
    console.error('Error cargando instructores:', e);
  }
});
</script>

<style>
.custom-preview-dialog .q-dialog__inner>div {
  max-width: 1300px !important;
  width: 95vw !important;
}
</style>
