<template>
  <div>
    <!-- Back Button matching REPFORA views layout -->
    <BtnBack :route="backRoute" />

    <!-- Title layout matching standard Home/HomeSchedules views -->
    <div class="row q-my-xl justify-center row-tittle">
      <div class="col-12 text-center text-h5 text-weight-bold">
        REGISTRO Y PROGRAMACIÓN DE FORMACIÓN ACTUALIZADA
      </div>
      <div class="col-12 text-center text-subtitle1 text-grey-6 q-mt-sm">
        Gestione la planeación pedagógica, programación de instructores y eventos en una sola plataforma interactiva.
      </div>
    </div>

    <!-- ─── ADMINISTRATOR / COORDINATOR / PROGRAMMER VIEW (4 Cards) ─── -->
    <div v-if="isProgramador" class="row justify-center my-row" :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-md'">
      <!-- Card 1: Nueva Planeación -->
      <div
        class="col-10 col-sm-6 col-md-4 col-lg-3 q-my-lg flex"
        :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-lg'"
      >
        <q-card square class="my-card-1 text-center shadow-5 full-width column justify-between">
          <div>
            <q-card-section class="card_style q-py-sm">
              <div class="row items-center justify-center">
                <div class="text-h6 style-text">
                  Nueva Planeación
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <div class="justify-center flex q-my-sm">
              <img src="/images/calendar.png" class="img-card" alt="Nueva Planeación" />
            </div>
            <q-separator />
            <q-card-section class="q-pa-md text-center text-body2 text-grey-7">
              Cargue de programas oficiales, cruce automático con proyecto formativo y diseño del plan de sesiones.
            </q-card-section>
          </div>
          <div>
            <q-separator />
            <router-link to="/extract" style="text-decoration: none; color: black">
              <q-card-actions class="column items-center q-mt-sm q-pb-md">
                <q-btn square class="button_style" style="width: 50%"> VER </q-btn>
              </q-card-actions>
            </router-link>
          </div>
        </q-card>
      </div>

      <!-- Card 2: Programador -->
      <div
        class="col-10 col-sm-6 col-md-4 col-lg-3 q-my-lg flex"
        :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-lg'"
      >
        <q-card square class="my-card-1 text-center shadow-5 full-width column justify-between">
          <div>
            <q-card-section class="card_style q-py-sm">
              <div class="row items-center justify-center">
                <div class="text-h6 style-text">
                  Programador
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <div class="justify-center flex q-my-sm">
              <img src="/images/instructor.png" class="img-card" alt="Programador" />
            </div>
            <q-separator />
            <q-card-section class="q-pa-md text-center text-body2 text-grey-7">
              Gestión integral de instructores, control de disponibilidades horarias y cruce inteligente de fichas.
            </q-card-section>
          </div>
          <div>
            <q-separator />
            <router-link to="/scheduler" style="text-decoration: none; color: black">
              <q-card-actions class="column items-center q-mt-sm q-pb-md">
                <q-btn square class="button_style" style="width: 50%"> VER </q-btn>
              </q-card-actions>
            </router-link>
          </div>
        </q-card>
      </div>

      <!-- Card 3: Horarios -->
      <div
        class="col-10 col-sm-6 col-md-4 col-lg-3 q-my-lg flex"
        :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-lg'"
      >
        <q-card square class="my-card-1 text-center shadow-5 full-width column justify-between">
          <div>
            <q-card-section class="card_style q-py-sm">
              <div class="row items-center justify-center">
                <div class="text-h6 style-text">
                  Horarios
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <div class="justify-center flex q-my-sm">
              <img src="/images/calendar.png" class="img-card" alt="Horarios" />
            </div>
            <q-separator />
            <q-card-section class="q-pa-md text-center text-body2 text-grey-7">
              Configuración horaria de ambientes, fichas de formación, asuetos y actividades especiales.
            </q-card-section>
          </div>
          <div>
            <q-separator />
            <router-link to="/planning-schedules" style="text-decoration: none; color: black">
              <q-card-actions class="column items-center q-mt-sm q-pb-md">
                <q-btn square class="button_style" style="width: 50%"> VER </q-btn>
              </q-card-actions>
            </router-link>
          </div>
        </q-card>
      </div>
    </div>

    <!-- ─── INSTRUCTOR VIEW (2 Columns: Nueva Planeación + Mis Planeaciones) ─── -->
    <div v-else class="row justify-center my-row" :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-md'">
      <!-- Card 1: Nueva Planeación -->
      <div
        class="col-12 col-md-5 q-my-md flex"
        :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-lg'"
      >
        <q-card square class="my-card-1 text-center shadow-5 full-width column justify-between">
          <div>
            <q-card-section class="card_style q-py-sm">
              <div class="row items-center justify-center">
                <div class="text-h6 style-text">
                  Nueva Planeación
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <div class="justify-center flex q-my-md">
              <img src="/images/calendar.png" class="img-card" alt="Nueva Planeación" style="max-height: 180px; object-fit: contain;" />
            </div>
            <q-separator />
            <q-card-section class="q-pa-md text-center text-body2 text-grey-7">
              Cargue de programas oficiales, cruce automático con proyecto formativo y diseño del plan de sesiones.
            </q-card-section>
          </div>
          <div>
            <q-separator />
            <router-link to="/extract" style="text-decoration: none; color: black">
              <q-card-actions class="column items-center q-my-sm q-pb-md">
                <q-btn square class="button_style" style="width: 50%"> VER </q-btn>
              </q-card-actions>
            </router-link>
          </div>
        </q-card>
      </div>

      <!-- Card 2: Mis Planeaciones Guardadas -->
      <div
        class="col-12 col-md-7 q-my-md flex"
        :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-lg'"
      >
        <q-card square class="my-card-1 shadow-5 full-width column justify-between">
          <div>
            <q-card-section class="card_style q-py-sm text-center">
              <div class="row items-center justify-center">
                <div class="text-h6 style-text">
                  Mis Planeaciones
                </div>
              </div>
            </q-card-section>
            <q-separator />
            
            <q-card-section class="q-pa-md scroll" style="max-height: 310px; min-height: 250px;">
              <div v-if="loadingSaved" class="flex flex-center column q-py-xl">
                <q-spinner-dots color="green-9" size="40px" />
                <div class="text-caption text-grey-6 q-mt-sm">Cargando tus planeaciones pedagógicas...</div>
              </div>

              <div v-else-if="filteredSavedPlannings.length === 0" class="flex flex-center column q-py-lg text-center text-grey-6" style="min-height: 180px;">
                <q-icon name="folder_open" size="56px" color="grey-4" class="q-mb-sm" />
                <div class="text-subtitle2 text-weight-bold text-grey-8">No tienes planeaciones activas aún</div>
                <div class="text-caption q-mt-xs text-grey-6" style="max-width: 320px; margin-inline: auto;">
                  Carga los documentos PDF de tu ficha usando el botón <strong>"VER"</strong> de la tarjeta izquierda para generar tu primera planeación pedagógica automática.
                </div>
              </div>

              <q-list v-else separator class="bg-white">
                <q-item 
                  v-for="plan in filteredSavedPlannings" 
                  :key="plan._id"
                  class="q-py-sm list-item-custom"
                  clickable
                  :to="{ name: 'planning', query: { fiche: plan.pedagogicalPlanning.fiche } }"
                >
                  <q-item-section avatar>
                    <q-avatar square color="green-1" text-color="green-10" icon="assignment" size="36px" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-subtitle2 text-weight-bold text-grey-9">
                      Ficha: {{ plan.pedagogicalPlanning.fiche }}
                    </q-item-label>
                    <q-item-label caption lines="1" class="text-grey-7 text-caption">
                      {{ plan.pedagogicalPlanning.metadata.programName }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-btn 
                      flat
                      round
                      square
                      dense
                      color="green-9"
                      icon="edit_calendar"
                      size="sm"
                    >
                      <q-tooltip class="bg-green-9 text-weight-bold">Continuar editando planeación pedagógica</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </div>
        </q-card>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeUser } from '../store/users';
import { useQuasar } from 'quasar';
import { PlanningService } from '../services/planning.service';
import BtnBack from "../layouts/btnBackLayout.vue";

const router = useRouter();
const useUser = storeUser();
const $q = useQuasar();

// ── Estado de Planeaciones Guardadas (Para el Instructor) ──
const savedPlannings = ref([]);
const loadingSaved = ref(false);

// Helper para decodificar token JWT de forma segura
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
    console.error('Error decoding JWT token in PlanningDashboard:', e);
    return null;
  }
};

const userRole = computed(() => {
  const token = useUser.token;
  if (token) {
    const decoded = decodeTokenSafely(token);
    if (decoded) {
      return decoded.rol || 'USER';
    }
  }
  return useUser.getRole();
});

const userName = computed(() => {
  if (useUser.instructorData?.name) {
    return useUser.instructorData.name;
  }
  if (useUser.newConsult?.name) {
    return useUser.newConsult.name;
  }
  const token = useUser.token;
  if (token) {
    const decoded = decodeTokenSafely(token);
    if (decoded) {
      return decoded.name || decoded.email || 'Usuario';
    }
  }
  return 'Usuario';
});

const isProgramador = computed(() => {
  const role = userRole.value;
  return role === 'PROGRAMADOR' || role === 'COORDINADOR' || role === 'ADMIN';
});

const backRoute = computed(() => {
  return isProgramador.value ? '/home' : '/home/instructor';
});

const currentUserId = computed(() => {
  if (useUser.instructorData?._id) {
    return useUser.instructorData._id;
  }
  if (useUser.newConsult?.value) {
    return useUser.newConsult.value;
  }
  const token = useUser.token;
  if (token) {
    const decoded = decodeTokenSafely(token);
    if (decoded) {
      return decoded.id || '';
    }
  }
  return '';
});

// Filtrar planeaciones para mostrar únicamente las creadas por este instructor o donde esté sugerido
const filteredSavedPlannings = computed(() => {
  if (isProgramador.value) return [];

  // El backend ya devuelve únicamente las fichas que corresponden al instructor
  // (por leaderEmail o por actividad confirmada). No necesitamos re-filtrar aquí.
  return savedPlannings.value.filter(plan => {
    const p = plan.pedagogicalPlanning;
    return !!(p && p.fiche);
  });
});

// Cargar planeaciones guardadas desde base de datos
const fetchSavedPlannings = async () => {
  if (isProgramador.value) return; // Los programadores no requieren ver este listado directo aquí
  
  loadingSaved.value = true;
  try {
    const data = await PlanningService.getAllPlannings();
    savedPlannings.value = data;
  } catch (error) {
    console.error('[ERROR] fetchSavedPlannings:', error);
    $q.notify({
      message: 'Error al conectar para cargar planeaciones guardadas',
      color: 'red-8',
      icon: 'error'
    });
  } finally {
    loadingSaved.value = false;
  }
};

onMounted(() => {
  fetchSavedPlannings();
});
</script>

<style scoped>
.card_style {
  background-color: var(--color_card) !important;
  color: var(--color_text_card);
}

.img-card {
  display: flex;
  width: 50% !important;
  aspect-ratio: 4/3 !important;
  object-fit: cover;
  max-width: 50% !important;
  border: 0;
  margin: 0 auto;
}

.button_style {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

.my-row {
  margin-top: 50px;
}

.row-tittle {
  margin-top: 50px;
}

.style-text {
  text-transform: capitalize !important;
}

.list-item-custom {
  transition: background-color 0.2s;
  border: 1px solid #f5f5f5;
  margin-bottom: 8px;
  border-radius: 0 !important;
}

.list-item-custom:hover {
  background-color: #f1f8e9;
  border-color: #c8e6c9;
}
</style>
