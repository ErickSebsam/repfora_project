<template>
  <div>
    <!-- ÁREA EDITABLE PARA EL INSTRUCTOR (ASIGNACIÓN) -->
    <q-card-section square class="q-mx-md q-mb-md q-pa-md border-green bg-white shadow-1" v-if="store.isLeader">
      <div class="text-weight-bold text-green-9 q-mb-md text-uppercase">
        {{ isEditingAct ? 'Modificar asignación de instructor y actividad' : 'Asignación de instructor y actividad' }}
      </div>

      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-4">
          <q-select square outlined v-model="formState.instructor" :options="filteredInstructors" option-label="name"
            label="Instructor Sugerido" bg-color="white" dense use-input input-debounce="0" color="green-9"
            @filter="filterInstructors">
            <template v-slot:prepend><q-icon name="person" color="green-9" /></template>
          </q-select>
        </div>
        <div class="col-12 col-md-6">
          <q-input square outlined v-model="formState.newActivity"
            label="Descripción de la actividad (Sugerido por Instructor)" bg-color="white" dense color="green-9">
            <template v-slot:prepend><q-icon name="add_task" color="green-9" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-2 row items-center q-gutter-x-sm no-wrap">
          <q-btn square :class="isEditingAct ? 'bg-blue-9' : 'bg-green-9'"
            :label="isEditingAct ? 'ACTUALIZAR' : 'GUARDAR'" class="col text-bold text-white"
            @click="handleSaveActivity" unelevated />
          <q-btn v-if="isEditingAct" flat round square dense color="grey-7" icon="close" @click="cancelEditAct">
            <q-tooltip class="bg-grey-9">Cancelar edición</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Lista de actividades registradas -->
      <div class="q-mt-md" v-if="rap.pedagogicalActivities.length > 0">
        <q-list bordered separator square>
          <q-item v-for="(act, aIdx) in rap.pedagogicalActivities" :key="aIdx" square>
            <q-item-section>
              <div class="text-weight-bold">{{ act.description || act.observations || 'Actividad sin descripción' }}</div>
              <div class="text-caption text-grey-7" v-if="act.suggestedInstructor?.name || act.instructors?.name || (Array.isArray(act.instructors) && act.instructors.length > 0)">
                Instructor: {{ act.suggestedInstructor?.name || (Array.isArray(act.instructors) ? act.instructors.map(i => i.name).join(', ') : act.instructors?.name) }} | Horas: {{ act.hours?.direct }}D / {{
                  act.hours?.independent
                }}I
              </div>
              <div class="text-caption text-green-9 text-weight-bold q-mt-xs"
                v-if="act.scheduleDetails && act.scheduleDetails.assignedDays && act.scheduleDetails.assignedDays.length > 0">
                <q-icon name="calendar_month" class="q-mr-xs" size="16px" />
                Fechas Asignadas: {{ act.scheduleDetails.assignedDays.join(', ') }}
              </div>
              <div class="text-caption text-grey-6 italic q-mt-xs" v-else>
                <q-icon name="calendar_today" class="q-mr-xs" size="16px" />
                Sin fechas asignadas aún
              </div>
            </q-item-section>
            <q-item-section side v-if="store.isLeader">
              <div class="row q-gutter-xs">
                <q-btn square flat round color="green-9" icon="calendar_month" size="sm"
                  @click="$emit('open-scheduler', { comp, rap, act })">
                  <q-tooltip class="bg-green-9 text-weight-bold">Programar fechas y horas</q-tooltip>
                </q-btn>
                <q-btn square flat round color="blue-8" icon="edit" size="sm" @click="editActivity(act, aIdx)">
                  <q-tooltip class="bg-blue-8 text-weight-bold">Editar instructor y descripción</q-tooltip>
                </q-btn>
                <q-btn square flat round color="red-8" icon="delete" size="sm" @click="deleteActivity(aIdx)">
                  <q-tooltip class="bg-red-8 text-weight-bold">Eliminar actividad</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>

    <!-- ÁREA DE LECTURA PARA EL INSTRUCTOR SUGERIDO -->
    <q-card-section square class="q-mx-md q-mb-md q-pa-md border-all bg-white shadow-1"
      v-if="!store.isLeader && rap.pedagogicalActivities.length > 0">
      <div class="text-weight-bold text-green-9 q-mb-sm text-uppercase">
        Actividades Asignadas y Fechas
      </div>
      <q-list bordered separator square>
        <q-item v-for="(act, aIdx) in rap.pedagogicalActivities" :key="aIdx" square>
          <q-item-section>
            <div class="text-weight-bold text-grey-9">{{ act.description || act.observations || 'Actividad sin descripción' }}</div>
            <div class="text-caption text-grey-7" v-if="act.suggestedInstructor?.name || act.instructors?.name || (Array.isArray(act.instructors) && act.instructors.length > 0)">
              Instructor Responsable: <strong>{{ act.suggestedInstructor?.name || (Array.isArray(act.instructors) ? act.instructors.map(i => i.name).join(', ') : act.instructors?.name) }}</strong> | Horas Directas: <strong>{{
                act.hours?.direct }}h</strong>
            </div>

            <div class="text-caption text-green-9 text-weight-bold q-mt-xs"
              v-if="act.scheduleDetails && act.scheduleDetails.assignedDays && act.scheduleDetails.assignedDays.length > 0">
              <q-icon name="calendar_month" class="q-mr-xs" size="16px" />
              Fechas Asignadas por el Líder: {{ act.scheduleDetails.assignedDays.join(', ') }} (Jornada: {{
                act.scheduleDetails.shift === 'nocturna' ? 'Noche' :
                act.scheduleDetails.shift === 'mixta_manana' ? 'Mixta Mañana' :
                act.scheduleDetails.shift === 'mixta_manana_tarde' ? 'Mixta Mañana Tarde' : 'Mañana / Tarde' }})
            </div>
            <div class="text-caption text-grey-6 italic q-mt-xs" v-else>
              <q-icon name="calendar_today" class="q-mr-xs" size="16px" />
              Sin fechas asignadas aún
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { usePlanningStore } from '../../store/planning.store';
import { useQuasar } from 'quasar';

const props = defineProps({
  comp: { type: Object, required: true },
  rap: { type: Object, required: true },
  instructors: { type: Array, required: true }
});

defineEmits(['open-scheduler']);

const store = usePlanningStore();
const $q = useQuasar();

const formState = reactive({
  instructor: null,
  newActivity: ''
});

const filteredInstructors = ref(props.instructors);
const editingActIdx = ref(null);
const isEditingAct = ref(false);

const normalize = (text) => {
  return (text || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const filterInstructors = (val, update) => {
  if (val === '') {
    update(() => {
      filteredInstructors.value = props.instructors;
    });
    return;
  }
  update(() => {
    const needle = normalize(val);
    filteredInstructors.value = props.instructors.filter(
      v => normalize(v.name).indexOf(needle) > -1
    );
  });
};

const handleSaveActivity = async () => {
  if (!formState.instructor) {
    $q.notify({ message: 'Debe seleccionar un instructor sugerido', color: 'red-8' });
    return;
  }

  if (isEditingAct.value && editingActIdx.value !== null) {
    const act = props.rap.pedagogicalActivities[editingActIdx.value];
    if (act) {
      act.description = formState.newActivity || '';
      act.suggestedInstructor = {
        id: formState.instructor._id,
        name: formState.instructor.name,
        assignmentStatus: act.suggestedInstructor?.assignmentStatus || 'pending'
      };
    }
    isEditingAct.value = false;
    editingActIdx.value = null;
    $q.notify({ message: 'Asignación actualizada con éxito ✅', color: 'blue-9' });
  } else {
    const newAct = {
      description: formState.newActivity || '',
      suggestedInstructor: {
        id: formState.instructor._id,
        name: formState.instructor.name,
        assignmentStatus: 'pending'
      },
      hours: { direct: 0, independent: 0 }
    };
    store.addActivityToRAP(props.comp.code, props.rap.description, newAct);
    $q.notify({ message: 'Asignación registrada ✅', color: 'green-9' });
  }

  await store.saveDraft();
  formState.newActivity = '';
};

const editActivity = (act, aIdx) => {
  formState.newActivity = act.description || '';
  
  const instructorId = act.suggestedInstructor?.id || act.instructors?.id;
  const instructorName = act.suggestedInstructor?.name || (Array.isArray(act.instructors) ? act.instructors[0]?.name : act.instructors?.name);
  
  let found = null;

  // 1. Intentar match por ID exacto (_id)
  if (instructorId) {
    found = props.instructors.find(i => i._id === instructorId);
  }
  
  // 2. Fallback: Match inteligente por nombre si no hubo match por ID
  if (!found && instructorName) {
    const needle = normalize(instructorName);
    
    // Buscar el instructor que mejor coincida (buscamos si el nombre de la BD contiene lo que tenemos o viceversa)
    found = props.instructors.find(i => {
      const dbName = normalize(i.name);
      return dbName.includes(needle) || needle.includes(dbName);
    });
  }

  // 3. Resetear filtro y asignar el objeto encontrado (debe ser la misma referencia de la lista)
  filteredInstructors.value = props.instructors;
  formState.instructor = found || null;
  
  isEditingAct.value = true;
  editingActIdx.value = aIdx;
};

const cancelEditAct = () => {
  formState.newActivity = '';
  isEditingAct.value = false;
  editingActIdx.value = null;
};

const deleteActivity = async (aIdx) => {
  props.rap.pedagogicalActivities.splice(aIdx, 1);
  await store.saveDraft();
  $q.notify({ message: 'Actividad eliminada 🗑️', color: 'orange-9' });
};
</script>

<style scoped>
.border-green {
  border: 1px solid #2e7d32;
}

.border-all {
  border: 1px solid #e0e0e0;
}
</style>
