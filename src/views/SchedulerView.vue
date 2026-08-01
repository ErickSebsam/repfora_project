<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Topbar matching REPFORA image exactly -->
    <q-header elevated class="bg-green-9 text-white">
      <q-toolbar class="q-px-lg" style="height: 64px;">
        <q-btn flat round dense icon="arrow_back" to="/" class="q-mr-sm">
          <q-tooltip class="bg-grey-9">Volver al Dashboard</q-tooltip>
        </q-btn>
        
        <q-toolbar-title class="text-weight-bolder text-h6 tracking-wide">
          REPFORA — MÓDULO PROGRAMADOR
        </q-toolbar-title>

        <!-- Simulated notification count badge -->
        <q-btn flat round dense icon="notifications" class="q-mr-sm">
          <q-badge floating color="orange" rounded>2</q-badge>
        </q-btn>

        <q-btn flat round dense icon="logout">
          <q-tooltip class="bg-red-8">Cerrar Sesión</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container class="bg-grey-2">
      <q-page class="q-pa-md">
        <div class="row q-col-gutter-md fill-height" style="min-height: calc(100vh - 100px);">
          
          <!-- LEFT SIDEBAR: List of Fichas (Plannings) -->
          <div class="col-12 col-md-3">
            <q-card flat bordered class="full-height column" style="min-height: 400px; border-radius: 12px; background: white;">
              <q-card-section class="bg-green-10 text-white q-py-md text-subtitle2 text-weight-bolder text-uppercase">
                <q-icon name="view_list" class="q-mr-xs" size="18px" />
                Fichas en Planeación
              </q-card-section>
              
              <q-card-section class="q-py-sm">
                <q-input dense outlined v-model="searchFiche" placeholder="Buscar ficha..." class="bg-white">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </q-card-section>

              <q-separator />

              <q-card-section class="col q-pa-none scroll" style="max-height: 550px;">
                <q-list v-if="loadingPlannings" class="q-pa-md text-center">
                  <q-spinner-dots color="green-9" size="40px" />
                  <div class="text-grey-6 q-mt-sm">Cargando fichas...</div>
                </q-list>

                <q-list v-else-if="filteredPlannings.length === 0" class="q-pa-md text-center">
                  <q-icon name="sentiment_dissatisfied" color="grey-5" size="40px" />
                  <div class="text-grey-6 q-mt-sm">No se encontraron fichas</div>
                </q-list>

                <q-list v-else separator class="q-py-xs">
                  <q-item 
                    v-for="plan in filteredPlannings" 
                    :key="plan._id"
                    clickable
                    v-ripple
                    :active="selectedPlanning?._id === plan._id"
                    active-class="bg-green-1 text-green-10 text-weight-bold"
                    @click="selectPlanning(plan)"
                    class="q-py-md"
                  >
                    <q-item-section avatar>
                      <q-avatar color="green-9" text-color="white" icon="badge" size="40px" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-subtitle2 text-weight-bold">
                        Ficha: {{ plan.pedagogicalPlanning.fiche }}
                      </q-item-label>
                      <q-item-label caption lines="1" class="text-grey-7">
                        {{ plan.pedagogicalPlanning.metadata.programName }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-badge 
                        :color="getPlanningFicheStatusColor(plan)" 
                        text-color="white"
                        class="text-weight-bold text-uppercase"
                        size="sm"
                      >
                        {{ getPlanningFicheStatusLabel(plan) }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- RIGHT AREA: Details & Scheduler Activities Confirmation -->
          <div class="col-12 col-md-9 column justify-between">
            
            <!-- EMPTY STATE -->
            <q-card v-if="!selectedPlanning" flat bordered class="col flex flex-center text-center bg-white" style="border-radius: 12px; height: 100%;">
              <q-card-section class="q-pa-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" width="220" height="160" class="q-mb-md">
                  <rect x="30" y="20" width="140" height="110" rx="12" fill="#f1f8e9" stroke="#66bb6a" stroke-width="2.5" />
                  <line x1="50" y1="50" x2="150" y2="50" stroke="#a5d6a7" stroke-width="4" stroke-linecap="round" />
                  <line x1="50" y1="75" x2="120" y2="75" stroke="#a5d6a7" stroke-width="4" stroke-linecap="round" />
                  <circle cx="100" cy="110" r="18" fill="#66bb6a" />
                  <path d="M94 110 l4 4 l8 -8" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="text-h5 text-weight-bolder text-green-10">Módulo de Coordinador y Programador</div>
                <div class="text-subtitle1 text-grey-6 q-mt-sm" style="max-width: 500px; margin-inline: auto;">
                  Selecciona una ficha de la barra lateral izquierda para comenzar a validar y confirmar la programación de los instructores.
                </div>
              </q-card-section>
            </q-card>

            <!-- SELECTED FICHE WORKSPACE -->
            <div v-else class="column q-gutter-y-md col">
              <!-- LOADING STATE FOR PLAN DETAILS -->
              <q-card v-if="loadingSelectedPlanning" flat bordered class="col flex flex-center text-center bg-white" style="border-radius: 12px; height: 100%;">
                <q-card-section class="q-pa-xl">
                  <q-spinner-cube color="green-9" size="60px" />
                  <div class="text-h6 text-green-10 text-weight-bolder q-mt-md">Cargando planeación pedagógica...</div>
                  <div class="text-caption text-grey-6 q-mt-sm">
                    Obteniendo todas las competencias, actividades e instructores asignados a esta ficha...
                  </div>
                </q-card-section>
              </q-card>

              <!-- ACTUAL CONTENT WHEN LOADED -->
              <template v-else>
              <!-- Fiche Metadata Card -->
              <q-card flat bordered style="border-radius: 12px; background: white;">
                <q-card-section class="row items-center justify-between q-py-md bg-green-5 border-bottom">
                  <div>
                    <div class="text-subtitle2 text-green-10 text-weight-bolder text-uppercase">PROGRAMA ACADÉMICO</div>
                    <div class="text-h5 text-weight-bolder text-grey-9">
                      {{ selectedPlanning.pedagogicalPlanning.metadata.programName }}
                    </div>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      <strong>Código:</strong> {{ selectedPlanning.pedagogicalPlanning.metadata.programCode }} |
                      <strong>Versión:</strong> {{ selectedPlanning.pedagogicalPlanning.metadata.version || '1' }} |
                      <strong>Ficha:</strong> {{ selectedPlanning.pedagogicalPlanning.fiche }}
                    </div>
                  </div>

                  <!-- Programar Ficha Button (Locked initially) -->
                  <div class="row items-center q-gutter-x-md">
                    <div class="text-right">
                      <div class="text-caption text-grey-7">Estado de Programación</div>
                      <q-chip 
                        :color="isAllConfirmed ? 'green-9' : 'orange-9'" 
                        text-color="white" 
                        class="text-weight-bold text-uppercase"
                      >
                        {{ isAllConfirmed ? 'COMPLETA' : 'PENDIENTE CONFIRMACIÓN' }}
                      </q-chip>
                    </div>

                    <q-btn 
                      class="q-px-lg text-weight-bolder shadow-2 text-uppercase"
                      :class="isAllConfirmed ? 'bg-green-9 text-white hover-grow' : 'bg-grey-5 text-white'"
                      label="PROGRAMAR FICHA" 
                      size="md"
                      :disabled="!isAllConfirmed"
                      @click="triggerFicheScheduling"
                    >
                      <q-tooltip class="bg-grey-9 text-weight-bold">
                        {{ isAllConfirmed ? 'Habilitado: Haz clic para publicar y programar definitivamente esta ficha.' : 'Bloqueado: Se habilitará cuando todos los instructores estén CONFIRMADOS.' }}
                      </q-tooltip>
                    </q-btn>
                  </div>
                </q-card-section>

                <q-separator />

                <!-- Progress Section -->
                <q-card-section class="q-py-md">
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-grey-8 text-weight-bold flex items-center">
                      <q-icon name="check_circle_outline" color="green-9" class="q-mr-sm" size="20px" />
                      Progreso de Confirmación: 
                      <strong class="text-green-9 q-ml-xs">{{ confirmedCount }} / {{ totalActivitiesCount }} actividades confirmadas</strong>
                    </div>
                    <q-badge color="green-9" class="text-weight-bold" style="font-size: 13px;">
                      {{ completionPercentage }}%
                    </q-badge>
                  </div>
                  <q-linear-progress :value="confirmedCount / totalActivitiesCount" color="green-9" track-color="grey-3" class="rounded-borders" style="height: 10px;" />
                </q-card-section>
              </q-card>

              <!-- Notifications Banner Simulator (Pulsing card) -->
              <transition-group name="slide">
                <q-card 
                  v-if="simulatedNotification" 
                  flat 
                  bordered 
                  class="bg-blue-1 border-blue text-blue-10 q-pa-md flex items-center justify-between"
                  style="border-radius: 12px; border: 1px solid #90caf9;"
                  :key="'notif'"
                >
                  <div class="row items-center col q-gutter-x-md">
                    <q-avatar color="blue-9" text-color="white" icon="send" size="36px" class="animate-pulse" />
                    <div>
                      <div class="text-weight-bold text-subtitle2">Notificación Enviada de Forma Exitosa 🚀</div>
                      <div class="text-caption">
                        Se ha notificado vía portal institucional al instructor <strong>{{ simulatedNotification.instructor }}</strong>. Se le habilitó el acceso para diligenciar su planeación pedagógica de la ficha <strong>{{ selectedPlanning.pedagogicalPlanning.fiche }}</strong>.
                      </div>
                    </div>
                  </div>
                  <q-btn flat round icon="close" size="sm" color="blue-10" @click="simulatedNotification = null" />
                </q-card>
              </transition-group>

              <!-- Activities Table/List -->
              <q-card flat bordered class="col column bg-white" style="border-radius: 12px; min-height: 350px;">
                <q-card-section class="bg-grey-1 text-grey-9 q-py-sm text-subtitle2 text-weight-bolder flex justify-between items-center border-bottom">
                  <div>DETALLES DE COMPETENCIAS Y RESULTADOS SUGERIDOS</div>
                  <div class="text-caption text-grey-7">Diligencia la verificación de instructores</div>
                </q-card-section>

                <q-card-section class="col q-pa-none scroll" style="max-height: 400px;">
                  <table class="scheduler-table">
                    <thead>
                      <tr>
                        <th style="width: 80px;">FASE</th>
                        <th style="width: 180px;">COMPETENCIA</th>
                        <th>RESULTADO (RAP) Y ACTIVIDAD</th>
                        <th style="width: 100px; text-align: center;">HORAS</th>
                        <th style="width: 150px;">DÍAS ASIGNADOS</th>
                        <th style="width: 180px;">INSTRUCTOR ASIGNADO</th>
                        <th style="width: 140px; text-align: center;">ESTADO</th>
                        <th style="width: 160px; text-align: center;">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(phase, phIdx) in selectedPlanning.pedagogicalPlanning.content" :key="phIdx">
                        <template v-for="(comp, coIdx) in phase.competencies" :key="coIdx">
                          <template v-for="(rap, rapIdx) in comp.learningOutcomes" :key="rapIdx">
                            <tr v-for="(act, acIdx) in rap.pedagogicalActivities" :key="acIdx">
                              
                              <!-- FASE -->
                              <td class="text-weight-bold text-uppercase text-caption text-grey-7">
                                {{ phase.phase }}
                              </td>

                              <!-- COMPETENCIA -->
                              <td class="text-caption">
                                <div class="text-weight-bold text-green-10" style="line-height: 1.2;">{{ comp.code }}</div>
                                <div class="text-grey-7 ellipsis-2-lines" style="font-size: 11px; line-height: 1.1;">{{ comp.name }}</div>
                              </td>

                              <!-- RAP & ACTIVITY -->
                              <td>
                                <div class="text-weight-bolder text-grey-9 text-caption q-mb-xs" style="line-height: 1.2;">
                                  RAP: {{ rap.description }}
                                </div>
                                <div class="text-grey-7 bg-grey-1 q-pa-xs rounded-borders text-caption" style="font-size: 12px; line-height: 1.2; border: 1px solid #f0f0f0;">
                                  <strong>Actividad:</strong> {{ act.description || act.observations || 'Sin descripción' }}
                                </div>
                              </td>

                              <!-- HORAS -->
                              <td class="text-center">
                                <q-badge outline color="green-9" class="text-weight-bold text-caption">
                                  {{ act.hours?.direct || 0 }}h directas
                                </q-badge>
                              </td>

                              <!-- DÍAS ASIGNADOS -->
                              <td>
                                <div v-if="act.scheduleDetails && act.scheduleDetails.assignedDays && act.scheduleDetails.assignedDays.length > 0">
                                  <div class="text-weight-bold text-caption text-grey-8">
                                    {{ act.scheduleDetails.assignedDays.length }} sesiones
                                  </div>
                                  <div class="text-grey-6 text-caption ellipsis-2-lines" style="font-size: 10px; line-height: 1;">
                                    {{ formatDaysList(act.scheduleDetails.assignedDays) }}
                                  </div>
                                </div>
                                <div v-else class="text-grey-5 text-caption italic">
                                  Sin programar
                                </div>
                              </td>

                              <!-- INSTRUCTOR SUGERIDO -->
                              <td>
                                <div v-if="(act.suggestedInstructor && act.suggestedInstructor.name) || (act.instructors && act.instructors.name)">
                                  <div class="text-weight-bold text-grey-9 text-caption">
                                    {{ act.suggestedInstructor?.name || act.instructors?.name }}
                                  </div>
                                  <div class="text-caption text-grey-6 text-uppercase" style="font-size: 10px;">
                                    {{ act.suggestedInstructor?.type || act.instructors?.type || 'Sugerido' }}
                                  </div>
                                </div>
                                <div v-else class="text-red-8 text-weight-bold text-caption">
                                  ❌ SIN ASIGNAR
                                </div>
                              </td>

                              <!-- ESTADO -->
                              <td class="text-center">
                                <q-chip 
                                  :color="getStatusColor(act.suggestedInstructor?.assignmentStatus || act.instructors?.assignmentStatus)" 
                                  text-color="white" 
                                  dense 
                                  square
                                  class="text-weight-bold text-caption text-uppercase"
                                  style="font-size: 11px; padding: 4px 8px;"
                                >
                                  <q-icon :name="getStatusIcon(act.suggestedInstructor?.assignmentStatus || act.instructors?.assignmentStatus)" class="q-mr-xs" />
                                  {{ getStatusLabel(act.suggestedInstructor?.assignmentStatus || act.instructors?.assignmentStatus) }}
                                </q-chip>
                              </td>

                              <!-- ACCIONES -->
                              <td class="text-center">
                                <div class="row justify-center q-gutter-xs">
                                  <!-- Confirm button -->
                                  <q-btn 
                                    flat 
                                    round 
                                    dense 
                                    color="green-9" 
                                    icon="check" 
                                    size="sm" 
                                    :disabled="(act.suggestedInstructor?.assignmentStatus || act.instructors?.assignmentStatus) === 'confirmed' || !(act.suggestedInstructor?.name || act.instructors?.name)"
                                    @click="confirmInstructor(phase, comp, rap, act)"
                                  >
                                    <q-tooltip class="bg-green-9">Confirmar Instructor</q-tooltip>
                                  </q-btn>

                                  <!-- Programar en Calendario Button -->
                                  <q-btn 
                                    flat 
                                    round 
                                    dense 
                                    color="teal-9" 
                                    icon="calendar_month" 
                                    size="sm"
                                    :disabled="!act.scheduleDetails?.assignedDays?.length || (act.suggestedInstructor?.assignmentStatus || act.instructors?.assignmentStatus) !== 'confirmed'"
                                    @click="scheduleOutcomeToCalendar(phase, comp, rap, act, phIdx, coIdx, rapIdx, acIdx)"
                                  >
                                    <q-tooltip class="bg-teal-9">
                                      {{ act.scheduleDetails?.assignedDays?.length ? ((act.suggestedInstructor?.assignmentStatus || act.instructors?.assignmentStatus) === 'confirmed' ? 'Programar este Resultado en el Calendario de Horarios' : 'Se habilitará cuando el instructor esté CONFIRMADO') : 'Sin programar (el instructor no ha asignado fechas)' }}
                                    </q-tooltip>
                                  </q-btn>

                                  <!-- Change/Reassign button -->
                                  <q-btn 
                                    flat 
                                    round 
                                    dense 
                                    color="blue-8" 
                                    icon="person_add" 
                                    size="sm" 
                                    @click="openReassignModal(phase, comp, rap, act)"
                                  >
                                    <q-tooltip class="bg-blue-8">Reasignar/Cambiar Instructor</q-tooltip>
                                  </q-btn>

                                  <!-- Reject button -->
                                  <q-btn 
                                    flat 
                                    round 
                                    dense 
                                    color="red-8" 
                                    icon="close" 
                                    size="sm"
                                    :disabled="(act.suggestedInstructor?.assignmentStatus || act.instructors?.assignmentStatus) === 'rejected' || !(act.suggestedInstructor?.name || act.instructors?.name)"
                                    @click="rejectInstructor(phase, comp, rap, act)"
                                  >
                                    <q-tooltip class="bg-red-8">Rechazar Instructor</q-tooltip>
                                  </q-btn>
                                </div>
                              </td>

                            </tr>
                          </template>
                        </template>
                      </template>
                    </tbody>
                  </table>
                </q-card-section>
              </q-card>
              </template>
            </div>

          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- REASSIGN INSTRUCTOR DIALOG -->
    <q-dialog v-model="showReassignModal" persistent>
      <q-card style="width: 500px; max-width: 90vw; border-radius: 12px;">
        <q-card-section class="bg-blue-9 text-white q-py-md">
          <div class="text-h6 text-weight-bolder">REASIGNAR INSTRUCTOR</div>
          <div class="text-caption text-blue-2">Elija un instructor calificado para este resultado y verifique disponibilidad.</div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-subtitle2 text-grey-8 q-mb-sm">Actividad a programar:</div>
          <div class="q-pa-md bg-grey-2 rounded-borders text-caption q-mb-md">
            <strong>RAP:</strong> {{ reassignContext?.rap?.description }} <br />
            <strong>Actividad:</strong> {{ reassignContext?.act?.description }}
          </div>

          <!-- Select Instructor -->
          <q-select 
            filled 
            v-model="reassignInstructor" 
            :options="instructorsList" 
            option-label="name" 
            label="Seleccione un Instructor..." 
            class="q-mb-md" 
            emit-value
            map-options
            @update:model-value="checkInstructorConflicts"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">No se encontraron instructores activos</q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Conflict Checker State -->
          <div v-if="checkingConflicts" class="text-center q-pa-md">
            <q-spinner-dots color="blue-8" size="30px" />
            <div class="text-caption text-grey-7 q-mt-xs">Verificando cruces de horario en la base de datos...</div>
          </div>

          <div v-else-if="conflictResult" class="q-pa-md rounded-borders border-all" :class="conflictResult.hasConflict ? 'bg-red-1 text-red-9 border-red' : 'bg-green-1 text-green-10 border-green'">
            <div class="flex items-center text-weight-bold">
              <q-icon :name="conflictResult.hasConflict ? 'warning' : 'check_circle'" class="q-mr-xs" size="20px" />
              {{ conflictResult.hasConflict ? '¡Cruce de horario detectado!' : '¡Instructor disponible sin cruces!' }}
            </div>
            
            <div v-if="conflictResult.hasConflict" class="q-mt-sm text-caption">
              El instructor ya tiene clases asignadas en las siguientes fechas de esta u otras fichas:
              <ul class="q-my-xs q-pl-md">
                <li v-for="(conf, idx) in conflictResult.conflicts" :key="idx">
                  <strong>Ficha {{ conf.fiche }}:</strong> {{ conf.activity }} — <br />
                  <span class="text-red-7">Días de cruce: {{ conf.conflictingDays.join(', ') }}</span>
                </li>
              </ul>
              <div class="text-weight-bold text-red-10 q-mt-xs" style="font-size: 11px;">
                ⚠️ Nota: Puede proceder con la reasignación si desea forzar el cruce bajo su supervisión.
              </div>
            </div>
            <div v-else class="text-caption q-mt-xs">
              No se detectaron cruces de horario para el instructor seleccionado en las fechas indicadas.
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md border-top">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn 
            class="bg-blue-9 text-white text-weight-bolder" 
            label="Confirmar Asignación" 
            :disabled="!reassignInstructor"
            @click="applyReassignment" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { PlanningService } from '../services/planning.service';
import { InstructorService } from '../services/instructor.service';

const $q = useQuasar();

// ── Estado ──
const plannings = ref([]);
const instructorsList = ref([]);
const searchFiche = ref('');
const loadingPlannings = ref(false);
const selectedPlanning = ref(null);
const loadingSelectedPlanning = ref(false);

// Simulación de alertas de envío al instructor
const simulatedNotification = ref(null);

// Reasignación
const showReassignModal = ref(false);
const reassignInstructor = ref(null);
const reassignContext = ref(null); // { phase, comp, rap, act }
const checkingConflicts = ref(false);
const conflictResult = ref(null);

// ── Métodos de Carga Inicial ──
const fetchPlannings = async () => {
  loadingPlannings.value = true;
  try {
    const data = await PlanningService.getAllPlannings();
    plannings.value = data;
  } catch (error) {
    console.error('Error plannings:', error);
    $q.notify({ message: 'Error al obtener fichas', color: 'red-8' });
  } finally {
    loadingPlannings.value = false;
  }
};

const fetchInstructors = async () => {
  try {
    const data = await InstructorService.getInstructors();
    instructorsList.value = data;
  } catch (error) {
    console.error('Error list:', error);
  }
};

onMounted(() => {
  fetchPlannings();
  fetchInstructors();
});

// ── Búsqueda y Filtros ──
const filteredPlannings = computed(() => {
  if (!searchFiche.value) return plannings.value;
  return plannings.value.filter(p => 
    p.pedagogicalPlanning.fiche.toLowerCase().includes(searchFiche.value.toLowerCase()) ||
    p.pedagogicalPlanning.metadata.programName.toLowerCase().includes(searchFiche.value.toLowerCase())
  );
});

const selectPlanning = async (plan) => {
  selectedPlanning.value = plan; // Show instant metadata preview
  simulatedNotification.value = null;
  if (!plan) return;

  loadingSelectedPlanning.value = true;
  try {
    const fiche = plan.pedagogicalPlanning?.fiche || plan.fiche;
    const fullPlan = await PlanningService.getPlanningByFiche(fiche);
    if (fullPlan) {
      selectedPlanning.value = fullPlan;
    }
  } catch (error) {
    console.error('Error fetching full planning:', error);
    $q.notify({ message: 'Error al obtener la planeación completa', color: 'red-8' });
  } finally {
    loadingSelectedPlanning.value = false;
  }
};

// ── Estados de Ficha ──
const getPlanningFicheStatusLabel = (plan) => {
  const acts = getAllActivitiesFromPlan(plan);
  const total = acts.length;
  const confirmed = acts.filter(a => (a.suggestedInstructor || a.instructors)?.assignmentStatus === 'confirmed').length;
  
  if (confirmed === 0) return 'DRAFT';
  if (confirmed === total) return 'COMPLETO';
  return 'PROCESANDO';
};

const getPlanningFicheStatusColor = (plan) => {
  const status = getPlanningFicheStatusLabel(plan);
  if (status === 'COMPLETO') return 'green-9';
  if (status === 'PROCESANDO') return 'orange-8';
  return 'blue-grey-6';
};

// ── Cálculos de Ficha Activa ──
const getAllActivitiesFromPlan = (plan) => {
  const acts = [];
  if (!plan || !plan.pedagogicalPlanning || !plan.pedagogicalPlanning.content) return acts;
  plan.pedagogicalPlanning.content.forEach(phase => {
    if (phase.competencies) {
      phase.competencies.forEach(comp => {
        if (comp.learningOutcomes) {
          comp.learningOutcomes.forEach(rap => {
            if (rap.pedagogicalActivities) {
              rap.pedagogicalActivities.forEach(act => {
                acts.push(act);
              });
            }
          });
        }
      });
    }
  });
  return acts;
};

const totalActivitiesCount = computed(() => {
  return getAllActivitiesFromPlan(selectedPlanning.value).length;
});

const confirmedCount = computed(() => {
  return getAllActivitiesFromPlan(selectedPlanning.value)
    .filter(a => (a.suggestedInstructor || a.instructors)?.assignmentStatus === 'confirmed').length;
});

const isAllConfirmed = computed(() => {
  const total = totalActivitiesCount.value;
  return total > 0 && confirmedCount.value === total;
});

const completionPercentage = computed(() => {
  const total = totalActivitiesCount.value;
  if (!total) return 0;
  return Math.round((confirmedCount.value / total) * 100);
});

// ── Formateadores ──
const formatDaysList = (days) => {
  if (!days || days.length === 0) return '';
  return days.join(', ');
};

const getStatusColor = (status) => {
  if (status === 'confirmed') return 'green-9';
  if (status === 'rejected') return 'red-8';
  return 'orange-8';
};

const getStatusIcon = (status) => {
  if (status === 'confirmed') return 'check';
  if (status === 'rejected') return 'close';
  return 'hourglass_empty';
};

const getStatusLabel = (status) => {
  if (status === 'confirmed') return 'Confirmado';
  if (status === 'rejected') return 'Rechazado';
  return 'Pendiente';
};

// ── ACCIONES CORE DEL PROGRAMADOR ──

// 1. Confirmar Instructor
const confirmInstructor = async (phase, comp, rap, act) => {
  const sugg = act.suggestedInstructor || act.instructors;
  if (!sugg || !sugg.name) return;
  
  // Modificar estado local
  const originalStatus = sugg.assignmentStatus;
  sugg.assignmentStatus = 'confirmed';

  try {
    await saveActivePlanningChanges();
    
    // Simular el banner de alerta/notificación al instructor
    simulatedNotification.value = {
      instructor: sugg.name,
      fiche: selectedPlanning.value.pedagogicalPlanning.fiche
    };

    $q.notify({
      message: `¡Asignación confirmada para ${sugg.name}!`,
      color: 'green-9',
      icon: 'check_circle',
      timeout: 3000
    });
  } catch (error) {
    if (sugg) sugg.assignmentStatus = originalStatus; // Rollback
    $q.notify({ message: 'Error al confirmar asignación', color: 'red-8' });
  }
};

// 2. Rechazar Instructor
const rejectInstructor = async (phase, comp, rap, act) => {
  const sugg = act.suggestedInstructor || act.instructors;
  const originalStatus = sugg?.assignmentStatus;
  if (sugg) sugg.assignmentStatus = 'rejected';

  try {
    await saveActivePlanningChanges();
    simulatedNotification.value = null;

    $q.notify({
      message: `Asignación rechazada para ${sugg?.name || 'Instructor'}.`,
      color: 'red-8',
      icon: 'cancel'
    });
  } catch (error) {
    if (sugg) sugg.assignmentStatus = originalStatus; // Rollback
    $q.notify({ message: 'Error al procesar rechazo', color: 'red-8' });
  }
};

// 3. Reasignar Instructor Modals & conflict checks
const openReassignModal = (phase, comp, rap, act) => {
  reassignContext.value = { phase, comp, rap, act };
  reassignInstructor.value = null;
  conflictResult.value = null;
  showReassignModal.value = true;
};

const checkInstructorConflicts = async (instructor) => {
  if (!instructor || !reassignContext.value) {
    conflictResult.value = null;
    return;
  }
  
  const { act } = reassignContext.value;
  const dates = act.scheduleDetails?.assignedDays || [];
  const shift = act.scheduleDetails?.shift || 'diurna';
  const currentFiche = selectedPlanning.value.pedagogicalPlanning.fiche;

  if (dates.length === 0) {
    // Si la actividad no tiene fechas, no puede haber conflictos
    conflictResult.value = { hasConflict: false, conflicts: [] };
    return;
  }

  checkingConflicts.value = true;
  try {
    const result = await InstructorService.checkAvailability(instructor.id, dates, shift, currentFiche);
    conflictResult.value = result;
  } catch (error) {
    console.error('Error conflict checker:', error);
  } finally {
    checkingConflicts.value = false;
  }
};

const applyReassignment = async () => {
  if (!reassignContext.value || !reassignInstructor.value) return;

  const { act } = reassignContext.value;
  const instructor = reassignInstructor.value;

  // Cambiar el instructor en el objeto
  act.suggestedInstructor = {
    id: instructor.id,
    name: instructor.name,
    type: instructor.type || 'REASIGNADO',
    assignmentStatus: 'confirmed'
  };

  try {
    await saveActivePlanningChanges();
    showReassignModal.value = false;

    // Simular el banner
    simulatedNotification.value = {
      instructor: instructor.name,
      fiche: selectedPlanning.value.pedagogicalPlanning.fiche
    };

    $q.notify({
      message: `¡Instructor reasignado con éxito a ${instructor.name}!`,
      color: 'green-9',
      icon: 'check_circle'
    });
  } catch (error) {
    $q.notify({ message: 'Error al aplicar reasignación', color: 'red-8' });
  }
};

// ── Guardado unificado en la Base de Datos ──
const saveActivePlanningChanges = async () => {
  if (!selectedPlanning.value) return;
  
  // Usar el servicio para guardar toda la planeación
  await PlanningService.saveDraft({
    pedagogicalPlanning: selectedPlanning.value.pedagogicalPlanning
  });

  // Recargar la lista por detrás para mantener sincronía en la barra lateral
  const data = await PlanningService.getAllPlannings();
  plannings.value = data;

  // Obtener la planeación completa y actualizada para mantener el contenido del workspace
  const fiche = selectedPlanning.value.pedagogicalPlanning?.fiche || selectedPlanning.value.fiche;
  const fullPlan = await PlanningService.getPlanningByFiche(fiche);
  if (fullPlan) {
    selectedPlanning.value = fullPlan;
  }
};

// ── Programar Resultado en el Calendario Oficial ──
const scheduleOutcomeToCalendar = async (phase, comp, rap, act, phaseIndex, competenceIndex, rapIndex, activityIndex) => {
  $q.dialog({
    title: '📅 PROGRAMAR RESULTADO EN CALENDARIO',
    message: `¿Deseas programar definitivamente el Resultado de Aprendizaje "${rap.description}" en el Calendario oficial de Horarios de la Ficha ${selectedPlanning.value.pedagogicalPlanning.fiche}?`,
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-8'
    },
    ok: {
      label: 'Sí, Programar',
      color: 'green-9',
      flat: false
    },
    persistent: true
  }).onOk(async () => {
    $q.loading.show({ message: 'Registrando horario en el calendario oficial de Horarios SENA...' });
    try {
      const response = await PlanningService.scheduleOutcome({
        planningId: selectedPlanning.value._id,
        phaseIndex,
        competenceIndex,
        rapIndex,
        activityIndex
      });
      
      $q.notify({
        message: response.message || '¡Resultado programado con éxito en el calendario oficial!',
        color: 'green-10',
        icon: 'stars',
        timeout: 4000
      });
    } catch (error) {
      console.error('Error scheduleOutcome:', error);
      $q.notify({
        message: error.response?.data?.message || 'Error al programar el resultado en el calendario',
        color: 'red-8',
        icon: 'warning',
        timeout: 4000
      });
    } finally {
      $q.loading.hide();
    }
  });
};

// ── Finalización: Programar Ficha ──
const triggerFicheScheduling = () => {
  $q.dialog({
    title: '🎉 PROGRAMAR FICHA DEFINITIVAMENTE',
    message: `¡Todas las asignaciones de instructores están confirmadas! ¿Desea proceder a fijar la programación final de la Ficha ${selectedPlanning.value.pedagogicalPlanning.fiche} y sincronizar agendas de forma oficial?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    $q.notify({
      message: '¡Ficha Programada con Éxito en el Sistema! Agendas publicadas.',
      color: 'green-10',
      icon: 'stars',
      timeout: 5000
    });
  });
};
</script>

<style scoped>
.fill-height {
  height: 100%;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.border-top {
  border-top: 1px solid #e0e0e0;
}

.border-all {
  border: 1px solid #e0e0e0;
}

.border-blue {
  border-color: #90caf9 !important;
}

.border-green {
  border-color: #a5d6a7 !important;
}

.border-red {
  border-color: #ef5350 !important;
}

/* Scheduler Table Styling */
.scheduler-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.scheduler-table th {
  background-color: #f5f5f5;
  color: #333333;
  font-weight: bold;
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #e0e0e0;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.scheduler-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eeeeee;
  vertical-align: middle;
}

.scheduler-table tr:hover {
  background-color: #fafafa;
}

.hover-grow {
  transition: transform 0.2s ease-in-out;
}

.hover-grow:hover {
  transform: scale(1.03);
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(21, 101, 192, 0.5);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(21, 101, 192, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(21, 101, 192, 0);
  }
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.italic {
  font-style: italic;
}
</style>
