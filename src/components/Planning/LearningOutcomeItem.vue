<template>
  <div>
    <q-card-section class="bg-white q-py-sm">
      <div class="text-overline text-green-8 text-bold text-uppercase">Resultado de Aprendizaje</div>
      <div class="text-subtitle2 text-weight-bold text-green-10">
        {{ rIdx + 1 }}. {{ rap.description }}
      </div>
    </q-card-section>

    <q-expansion-item
      square
      icon="menu_open"
      label="Ver saberes y criterios"
      header-class="text-green-9 text-weight-bold"
      class="q-mx-md q-mb-md bg-grey-1"
    >
      <q-card flat square class="bg-grey-1">
        <q-card-section class="row q-col-gutter-md">
          <!-- Saberes Conceptos y Principios -->
          <div class="col-12 col-md-4">
            <div class="row items-center justify-between">
              <div class="text-bold text-green-9">Saberes Conceptos y Principios</div>
              <q-btn square flat round dense icon="add" size="xs" color="green-9" @click="addListItem('conceptsAndPrinciples', 'Nuevo Concepto')" v-if="store.isLeader" />
            </div>
            <q-scroll-area style="height: 150px; max-height: 150px;" class="q-pr-sm" v-if="displayKnowledge.concepts?.length">
              <div v-for="(s, idx) in displayKnowledge.concepts" :key="idx" class="row items-center no-wrap q-my-xs">
                <div class="col text-caption text-grey-9 text-uppercase">- {{ s }}</div>
                <q-btn square flat round dense icon="edit" size="xs" color="blue-8" @click="editListItem('conceptsAndPrinciples', idx, 'Editar Concepto')" v-if="store.isLeader" />
                <q-btn square flat round dense icon="delete" size="xs" color="red-8" @click="removeListItem('conceptsAndPrinciples', idx)" v-if="store.isLeader" />
              </div>
            </q-scroll-area>
            <div class="text-caption text-grey-5 italic" v-else>No definidos</div>
          </div>

          <!-- Saberes de Proceso -->
          <div class="col-12 col-md-4">
            <div class="row items-center justify-between">
              <div class="text-bold text-green-9">Saberes de Proceso</div>
              <q-btn square flat round dense icon="add" size="xs" color="green-9" @click="addListItem('processes', 'Nuevo Proceso')" v-if="store.isLeader" />
            </div>
            <q-scroll-area style="height: 150px; max-height: 150px;" class="q-pr-sm" v-if="displayKnowledge.processes?.length">
              <div v-for="(s, idx) in displayKnowledge.processes" :key="idx" class="row items-center no-wrap q-my-xs">
                <div class="col text-caption text-grey-9 text-uppercase">- {{ s }}</div>
                <q-btn square flat round dense icon="edit" size="xs" color="blue-8" @click="editListItem('processes', idx, 'Editar Proceso')" v-if="store.isLeader" />
                <q-btn square flat round dense icon="delete" size="xs" color="red-8" @click="removeListItem('processes', idx)" v-if="store.isLeader" />
              </div>
            </q-scroll-area>
            <div class="text-caption text-grey-5 italic" v-else>No definidos</div>
          </div>

          <!-- Criterios de Evaluación -->
          <div class="col-12 col-md-4">
            <div class="row items-center justify-between">
              <div class="text-bold text-green-9">Criterios de Evaluación</div>
              <q-btn square flat round dense icon="add" size="xs" color="green-9" @click="addListItem('evaluationCriteria', 'Nuevo Criterio')" v-if="store.isLeader" />
            </div>
            <q-scroll-area style="height: 150px; max-height: 150px;" class="q-pr-sm" v-if="displayKnowledge.criteria?.length">
              <div v-for="(c, idx) in displayKnowledge.criteria" :key="idx" class="row items-center no-wrap q-my-xs">
                <div class="col text-caption text-grey-9 text-uppercase">- {{ c }}</div>
                <q-btn square flat round dense icon="edit" size="xs" color="blue-8" @click="editListItem('evaluationCriteria', idx, 'Editar Criterio')" v-if="store.isLeader" />
                <q-btn square flat round dense icon="delete" size="xs" color="red-8" @click="removeListItem('evaluationCriteria', idx)" v-if="store.isLeader" />
              </div>
            </q-scroll-area>
            <div class="text-caption text-grey-5 italic" v-else>No definidos</div>
          </div>
          
          <q-separator class="col-12 q-my-sm" color="green-3" />

          <div v-for="(act, aIdx) in rap.pedagogicalActivities" :key="aIdx" class="col-12 row q-col-gutter-md">
            <div class="col-12 text-weight-bold text-green-10 q-mt-sm" v-if="rap.pedagogicalActivities.length > 1">
              ACTIVIDAD {{ aIdx + 1 }}: {{ act.description || act.observations || 'Sin descripción' }}
            </div>
            
            <div class="col-12 col-md-6">
              <div class="row items-center justify-between">
                <div class="text-bold text-green-9">Estrategias Didácticas</div>
                <q-btn square flat round dense icon="add" size="xs" color="green-9" @click="addListItem(act.didacticStrategies, 'Nueva Estrategia')" v-if="store.isLeader || isMyActivity(act)" />
              </div>
              <div v-for="(s, idx) in act.didacticStrategies" :key="idx" class="row items-center no-wrap q-my-xs">
                <div class="col text-caption text-grey-9 text-uppercase">- {{ s }}</div>
                <q-btn square flat round dense icon="edit" size="xs" color="blue-8" @click="editListItem(act.didacticStrategies, idx, 'Editar Estrategia')" v-if="store.isLeader || isMyActivity(act)" />
                <q-btn square flat round dense icon="delete" size="xs" color="red-8" @click="removeListItem(act.didacticStrategies, idx)" v-if="store.isLeader || isMyActivity(act)" />
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="row items-center justify-between">
                <div class="text-bold text-green-9">Evidencias de Aprendizaje</div>
                <q-btn square flat round dense icon="add" size="xs" color="green-9" @click="addListItem(act.learningEvidences, 'Nueva Evidencia')" v-if="store.isLeader || isMyActivity(act)" />
              </div>
              <div v-for="(e, idx) in act.learningEvidences" :key="idx" class="row items-center no-wrap q-my-xs">
                <div class="col text-caption text-grey-9 text-uppercase">- {{ e }}</div>
                <q-btn square flat round dense icon="edit" size="xs" color="blue-8" @click="editListItem(act.learningEvidences, idx, 'Editar Evidencia')" v-if="store.isLeader || isMyActivity(act)" />
                <q-btn square flat round dense icon="delete" size="xs" color="red-8" @click="removeListItem(act.learningEvidences, idx)" v-if="store.isLeader || isMyActivity(act)" />
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="row items-center justify-between">
                <div class="text-bold text-green-9">Ambientes Tipificados</div>
                <q-btn square flat round dense icon="edit" size="xs" color="blue-8" @click="editEnvironmentType(act)" v-if="store.isLeader || isMyActivity(act)" />
              </div>
              <div class="text-caption text-grey-9 text-uppercase">- {{ act.environment?.type || 'No definido' }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="row items-center justify-between">
                <div class="text-bold text-green-9">Materiales</div>
                <q-btn square flat round dense icon="add" size="xs" color="green-9" @click="addListItem(act.environment?.materials, 'Nuevo Material')" v-if="store.isLeader || isMyActivity(act)" />
              </div>
              <div v-for="(m, idx) in act.environment?.materials" :key="idx" class="row items-center no-wrap q-my-xs">
                <div class="col text-caption text-grey-9 text-uppercase">- {{ m }}</div>
                <q-btn square flat round dense icon="edit" size="xs" color="blue-8" @click="editListItem(act.environment.materials, idx, 'Editar Material')" v-if="store.isLeader || isMyActivity(act)" />
                <q-btn square flat round dense icon="delete" size="xs" color="red-8" @click="removeListItem(act.environment.materials, idx)" v-if="store.isLeader || isMyActivity(act)" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <ActivityManager 
      :rap="rap" 
      :comp="comp" 
      :instructors="instructors" 
      @open-scheduler="$emit('open-scheduler', $event)"
    />

    <EditKnowledgeDialog
      v-model="editDialog.isOpen"
      :title="editDialog.title"
      :initial-value="editDialog.initialValue"
      @save="handleDialogSave"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePlanningStore } from '../../store/planning.store';
import { storeUser } from '../../store/users';
import { useQuasar } from 'quasar';
import ActivityManager from './ActivityManager.vue';
import EditKnowledgeDialog from './EditKnowledgeDialog.vue';

// ── Helpers para identificar si el usuario es el instructor de una actividad ──
const decodeTokenSafely = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    return JSON.parse(atob(padded));
  } catch (e) {
    return null;
  }
};

const _normalizeName = (name) => {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const _isSameInstructor = (name1, name2) => {
  if (!name1 || !name2) return false;
  const n1 = _normalizeName(name1);
  const n2 = _normalizeName(name2);
  if (n1 === n2) return true;
  const words1 = n1.split(/\s+/).filter(w => w.length > 2);
  const words2 = n2.split(/\s+/).filter(w => w.length > 2);
  if (words1.length === 0 || words2.length === 0) return false;
  const match1 = words1.every(w => words2.includes(w));
  const match2 = words2.every(w => words1.includes(w));
  const firstTwo1 = words1.slice(0, 2).join(' ');
  const firstTwo2 = words2.slice(0, 2).join(' ');
  return match1 || match2 || (firstTwo1 && firstTwo2 && firstTwo1 === firstTwo2);
};

/**
 * Devuelve true si la actividad está confirmada y asignada al usuario actual.
 * Permite a los instructores ver sus propios botones de edición.
 */
const isMyActivity = (act) => {
  const userStore = storeUser();
  const token = userStore.token;
  if (!token) return false;
  const decoded = decodeTokenSafely(token);
  if (!decoded) return false;

  let instructorName = userStore.instructorData?.name || userStore.newConsult?.name || '';
  if (!instructorName && decoded.name) instructorName = decoded.name;
  if (!instructorName) return false;

  const sugg = act.suggestedInstructor || act.instructors;
  if (!sugg || !sugg.name) return false;
  const isAssigned = _isSameInstructor(sugg.name, instructorName);
  const isConfirmed = sugg.assignmentStatus === 'confirmed';
  return isAssigned && isConfirmed;
};

const props = defineProps({
  rap: { type: Object, required: true },
  comp: { type: Object, required: true },
  rIdx: { type: Number, required: true },
  instructors: { type: Array, required: true }
});

defineEmits(['open-scheduler']);

const store = usePlanningStore();
const $q = useQuasar();

// Estado para el diálogo de edición personalizado
const editDialog = ref({
  isOpen: false,
  title: '',
  initialValue: '',
  onSave: null
});

// Fallback robusto y lógica de "Pool" distribuido para saberes y criterios
const displayKnowledge = computed(() => {
  // 1. Obtener los pools globales de la competencia (Source of Truth del nuevo extractor)
  const k = props.comp.knowledge || props.comp.Knowledge || props.comp.conocimientos || {};
  
  // Debug total para ver qué llega a la UI
  console.log(`[DEBUG UI] Competencia ${props.comp.code}:`, {
    hasKnowledgeField: !!props.comp.knowledge,
    hasCriteriaField: !!props.comp.evaluationCriteria,
    criteriaCount: props.comp.evaluationCriteria?.length || 0,
    fullComp: props.comp
  });

  const globalPools = {
    conceptsAndPrinciples: k.conceptsAndPrinciples || k.conceptos_y_principios || k.conceptos || k.saberes || k['4.6.2'] || k.del_saber || k.conocimientos_del_saber || [],
    processes: k.processes || k.procesos || k.procedimientos || k['4.6.1'] || k.de_proceso || k.conocimientos_de_proceso || [],
    // Aceptamos cualquier variante de nombre que el backend pueda enviar
    evaluationCriteria: props.comp.evaluationCriteria || props.comp.criterios_de_evaluacion || props.comp['4.7'] || props.comp.criteria || []
  };

  // 2. Función para filtrar lo que debe ver este RA específico
  const filterList = (fieldNameInRAP) => {
    const globalPool = globalPools[fieldNameInRAP] || [];
    const localList = props.rap[fieldNameInRAP] || [];

    // Si el pool está vacío, retornar vacío
    if (globalPool.length === 0) return [];

    // Caso A: Hay prefijos específicos "RA X:" o "R.A. X:" en el pool global
    const prefix = `RA ${props.rIdx + 1}:`;
    const prefixAlt = `R.A. ${props.rIdx + 1}:`;
    const specific = globalPool.filter(item => {
      const upperItem = String(item).toUpperCase();
      return upperItem.includes(prefix) || upperItem.includes(prefixAlt);
    });
    if (specific.length > 0) return specific;

    // Caso B: Lógica de "Lo que se dejó en RAs anteriores se oculta aquí"
    const takenInPrevious = new Set();
    for (let i = 0; i < props.rIdx; i++) {
      const prevRap = props.comp.learningOutcomes[i];
      const prevList = prevRap[fieldNameInRAP] || [];
      
      // Si el RA anterior tiene una lista "limpiada" (menor que el pool), sus items están tomados
      if (prevList.length > 0 && prevList.length < globalPool.length) {
        prevList.forEach(item => takenInPrevious.add(String(item).trim()));
      }
    }

    // Si este RA tiene su propia lista definida (ya empezó limpieza), mostrar esa
    if (localList.length > 0 && localList.length < globalPool.length) {
      return localList;
    }

    // Si no, mostrar el pool filtrando lo de los anteriores
    return globalPool.filter(item => !takenInPrevious.has(String(item).trim()));
  };

  return {
    concepts: filterList('conceptsAndPrinciples'),
    processes: filterList('processes'),
    criteria: filterList('evaluationCriteria')
  };
});

// Función para inicializar la lista local antes de editar/borrar
const ensureAndGetList = (fieldName) => {
  const sourceMap = {
    'conceptsAndPrinciples': 'concepts',
    'processes': 'processes',
    'evaluationCriteria': 'criteria'
  };
  
  const currentDisplayed = displayKnowledge.value[sourceMap[fieldName]] || [];
  
  if (!props.rap[fieldName] || props.rap[fieldName].length === 0 || props.rap[fieldName].length >= currentDisplayed.length) {
    props.rap[fieldName] = [...currentDisplayed];
  }
  return props.rap[fieldName];
};

const handleDialogSave = async (data) => {
  if (editDialog.value.onSave) {
    await editDialog.value.onSave(data);
  }
};

const addListItem = (listOrFieldName, promptTitle) => {
  let list;
  if (typeof listOrFieldName === 'string') {
    list = ensureAndGetList(listOrFieldName);
  } else {
    list = listOrFieldName;
  }
  
  if (!list) return;

  editDialog.value = {
    isOpen: true,
    title: promptTitle,
    initialValue: '',
    onSave: async (data) => {
      list.push(data);
      await store.saveDraft();
      $q.notify({ message: 'Elemento añadido ✅', color: 'green-7', position: 'bottom-right' });
    }
  };
};

const editListItem = (listOrFieldName, index, promptTitle) => {
  let list;
  if (typeof listOrFieldName === 'string') {
    list = ensureAndGetList(listOrFieldName);
  } else {
    list = listOrFieldName;
  }

  editDialog.value = {
    isOpen: true,
    title: promptTitle,
    initialValue: list[index],
    onSave: async (data) => {
      list[index] = data;
      await store.saveDraft();
      $q.notify({ message: 'Elemento actualizado ✏️', color: 'blue-7', position: 'bottom-right' });
    }
  };
};

const removeListItem = async (listOrFieldName, index) => {
  let list;
  if (typeof listOrFieldName === 'string') {
    list = ensureAndGetList(listOrFieldName);
  } else {
    list = listOrFieldName;
  }
  
  list.splice(index, 1);
  await store.saveDraft(); // Guardado inmediato para reactividad
  $q.notify({ message: 'Elemento eliminado 🗑️', color: 'grey-7', position: 'bottom-right' });
};

const editEnvironmentType = (act) => {
  editDialog.value = {
    isOpen: true,
    title: 'Ambiente Tipificado',
    initialValue: act.environment?.type || '',
    onSave: async (data) => {
      if (!act.environment) act.environment = { type: '', materials: [] };
      act.environment.type = data;
      await store.saveDraft();
      $q.notify({ message: 'Ambiente actualizado ✏️', color: 'blue-7', position: 'bottom-right' });
    }
  };
};
</script>
