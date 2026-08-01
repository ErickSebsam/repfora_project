<template>
  <div class="auditcopy-container">
    <BtnBack route="/home" />
    <HeaderLayout title="Panel de Auditoría" />

    <!-- Banner con última ejecución + icono settings -->
    <div class="row justify-center q-pt-sm q-pb-md">
      <div class="col-12 col-md-11">
        <div class="update-banner">
          <div class="row items-center q-gutter-sm no-wrap">
            <div class="banner-icon">
              <span class="material-symbols-outlined">sync</span>
            </div>
            <div class="banner-text col">
              <span class="update-label">Última ejecución:</span>
              <span class="update-time q-ml-sm">{{ lastUpdateText }}</span>
            </div>
            <q-btn
              flat
              dense
              round
              color="blue"
              icon="settings"
              class="settings-btn"
              @click="openConfigModal"
            >
              <q-tooltip class="bg-green-7">Configuración</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="row justify-center q-mb-md">
      <div class="col-12 col-md-11">
        <q-tabs
          v-model="activeTab"
          dense
          class="bg-white text-grey-7 shadow-1 rounded-borders audit-tabs"
          active-color="white"
          active-bg-color="green-7"
          indicator-color="transparent"
          align="justify"
          narrow-indicator
          no-caps
          inline-label
          breakpoint="0"
        >
          <q-tab
            v-for="tab in tabs"
            :key="tab.name"
            :name="tab.name"
            :icon="tab.icon"
            :label="tab.label"
            class="audit-tab"
          >
            <q-tooltip class="bg-green-7" v-if="$q.screen.lt.md">{{ tab.label }}</q-tooltip>
          </q-tab>
        </q-tabs>
      </div>
    </div>

    <!-- Tab panels -->
    <div class="row justify-center">
      <div class="col-12 col-md-11">

        <!-- ================= DASHBOARD ================= -->
        <div v-show="activeTab === 'dashboard'" class="tab-content">
          <div class="stats-grid stats-grid-6 q-mb-md">
            <StatItem :value="dashStats.totalFichas" label="Total fichas" marker="blue" />
            <StatItem :value="dashStats.fichasAlDia" label="Fichas al día" marker="green" />
            <StatItem :value="dashStats.fichasConSnc" label="Con atrasos" marker="red" />
            <StatItem :value="dashStats.rapsAlDia" label="RAPs al día" marker="green" />
            <StatItem :value="dashStats.rapsSncParcial" label="Atraso parcial" marker="amber" />
            <StatItem :value="dashStats.rapsSncCritico" label="Atraso crítico" marker="red" />
          </div>

          <div class="filters-panel q-mb-md">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-md-5">
                <q-input
                  v-model="dashSearch"
                  dense
                  outlined
                  label="Buscar ficha..."
                  clearable
                  class="filter-input"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6">search</span>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-5">
                <q-select
                  v-model="dashFilter"
                  :options="dashFilterOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  label="Filtrar por estado"
                  class="filter-select"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6">filter_list</span>
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-md-2 text-right">
                <q-btn unelevated color="green-7" icon="refresh" label="Actualizar" @click="loadDashboard" class="full-width" />
              </div>
            </div>
          </div>

          <div v-if="loadingDash" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">Cargando dashboard...</div>
          </div>
          <div v-else-if="dashFiltered.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon">insights</span>
            <div class="empty-title">Sin datos</div>
            <div class="empty-desc">Aún no hay resumen disponible</div>
          </div>
          <q-table
            v-else
            :rows="dashFiltered"
            :columns="dashColumns"
            row-key="ficheNumber"
            :pagination="{ rowsPerPage: 15 }"
            flat
            bordered
            dense
            class="audit-table"
          >
            <template v-slot:body-cell-estadoGeneral="props">
              <q-td :props="props">
                <span class="tag" :class="estadoTagClass(props.row.estadoGeneral)">
                  {{ estadoLabel(props.row.estadoGeneral) }}
                </span>
              </q-td>
            </template>
          </q-table>
        </div>

        <!-- ================= PROCESO ACTUAL ================= -->
        <div v-show="activeTab === 'proceso'" class="tab-content">
          <div class="stats-grid q-mb-md">
            <StatItem :value="pendientes.length" label="Pendientes" marker="blue" />
            <StatItem :value="vencidosFlat.length" label="Vencidos" marker="red" />
            <StatItem :value="vencidosAgrupados.length" label="Fichas con vencidos" marker="amber" />
            <StatItem :value="estadoStats.totalFichas || 0" label="Fichas auditadas" marker="green" />
          </div>

          <div class="filters-panel q-mb-md">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-md-5">
                <q-input
                  v-model="procSearch"
                  dense
                  outlined
                  label="Buscar ficha o líder..."
                  clearable
                  class="filter-input"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6">search</span>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-5">
                <q-select
                  v-model="procCoord"
                  :options="coordOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  label="Coordinación"
                  class="filter-select"
                  @update:model-value="loadVencidosByCoord"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6">business</span>
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-md-2">
                <q-btn unelevated color="amber-8" icon="play_arrow" label="Ejecutar" @click="runManualAudit" :loading="loadingRun" class="full-width" />
              </div>
              <!-- <div class="col-12 col-md-2">
                <q-btn unelevated color="green-7" icon="refresh" label="Actualizar" @click="loadProceso" class="full-width" />
              </div> -->
            </div>
          </div>

          <div v-if="loadingProc" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">Cargando proceso...</div>
          </div>
          <div v-else-if="procFiltered.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon">check_circle</span>
            <div class="empty-title">Sin resultados vencidos</div>
            <div class="empty-desc">Todas las fichas al día</div>
          </div>
          <q-table
            v-else
            :rows="procFiltered"
            :columns="procColumns"
            row-key="ficheNumber"
            :pagination="{ rowsPerPage: 10 }"
            flat
            bordered
            dense
            class="audit-table q-mb-md"
          >
            <template v-slot:body-cell-count="props">
              <q-td :props="props" align="center">
                <span class="tag tag-red">{{ props.row.outcomes.length }}</span>
              </q-td>
            </template>
          </q-table>
          
          <div class="section-title q-mb-sm">Pendientes (aún no vencen)</div>
          <q-table
            :rows="pendientesView"
            :columns="pendColumns"
            row-key="_key"
            :pagination="{ rowsPerPage: 10 }"
            flat
            bordered
            dense
            class="audit-table"
            no-data-label="Sin pendientes"
          />
        </div>

        <!-- ================= COMPARACIÓN ================= -->
        <div v-show="activeTab === 'comparacion'" class="tab-content">
          <div v-if="compAlert" class="warning-panel q-mb-md">
            <div class="warning-panel-header">
              <span class="material-symbols-outlined warning-icon">info</span>
              <span class="warning-title">{{ compAlert }}</span>
            </div>
          </div>

          <div v-if="compData" class="stats-grid stats-grid-5 q-mb-md">
            <StatItem :value="compData.resumen.mejoraron" label="Mejoraron" marker="green" />
            <StatItem :value="compData.resumen.empeoraron" label="Empeoraron" marker="red" />
            <StatItem :value="compData.resumen.sinCambio" label="Sin cambio" marker="blue" />
            <StatItem :value="compData.resumen.nuevas" label="Nuevas" marker="amber" />
            <StatItem :value="compData.resumen.resueltas" label="Resueltas" marker="green" />
          </div>

          <div v-if="compData" class="filters-panel q-mb-md">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-md-5 text-caption text-grey-7">
                <span class="material-symbols-outlined vertical-middle q-mr-xs">schedule</span>
                <strong>{{ fmtDate(compData.fechaAnterior) }}</strong>
                →
                <strong>{{ fmtDate(compData.fechaActual) }}</strong>
              </div>
              <div class="col-6 col-md-3">
                <q-select
                  v-model="compFilter"
                  :options="compFilterOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  label="Tipo de cambio"
                  class="filter-select"
                />
              </div>
              <div class="col-6 col-md-3">
                <q-input
                  v-model="compSearch"
                  dense
                  outlined
                  label="Buscar ficha..."
                  clearable
                  class="filter-input"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6">search</span>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-1 text-right">
                <q-btn flat round color="green-7" icon="refresh" @click="loadComparacion">
                  <q-tooltip class="bg-green-7">Actualizar</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <div v-if="loadingComp" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">Cargando comparación...</div>
          </div>
          <div v-else-if="!compData" class="empty-state">
            <span class="material-symbols-outlined empty-icon">compare_arrows</span>
            <div class="empty-title">Sin comparación</div>
            <div class="empty-desc">Se requieren al menos 2 ejecuciones</div>
          </div>
          <q-table
            v-else
            :rows="compFiltered"
            :columns="compColumns"
            row-key="ficheNumber"
            :pagination="{ rowsPerPage: 15 }"
            flat
            bordered
            dense
            class="audit-table"
          >
            <template v-slot:body-cell-cambio="props">
              <q-td :props="props">
                <span class="tag" :class="cambioTagClass(props.row.cambio)">
                  {{ props.row.cambio }}
                </span>
              </q-td>
            </template>
          </q-table>
        </div>

        <!-- ================= DESCARGAS ================= -->
        <div v-show="activeTab === 'descargas'" class="tab-content">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="download-card">
                <div class="download-icon">
                  <span class="material-symbols-outlined">table_view</span>
                </div>
                <div class="download-title">Resumen Sede (XLSX)</div>
                <div class="download-desc">
                  Excel con el resumen de todas las fichas del último barrido: Al día, Aún no vence,
                  Atraso parcial, Atraso crítico y Sin programar.
                </div>
                <q-btn
                  unelevated
                  color="green-7"
                  icon="download"
                  label="Descargar XLSX"
                  class="q-mt-md"
                  @click="downloadExcel('/auditoria/resumen-sede/excel')"
                  :loading="loadingDl.xlsx"
                />
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="download-card">
                <div class="download-icon icon-blue">
                  <span class="material-symbols-outlined">folder_zip</span>
                </div>
                <div class="download-title">Por coordinación (ZIP)</div>
                <div class="download-desc">
                  ZIP con un archivo XLSX por cada coordinación más el archivo general con todas las fichas.
                </div>
                <q-btn
                  unelevated
                  color="blue-8"
                  icon="archive"
                  label="Descargar ZIP"
                  class="q-mt-md"
                  @click="downloadExcel('/auditoria/resumen-sede/excel/zip')"
                  :loading="loadingDl.zip"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ================= PLANTILLA CORREO ================= -->
        <div v-show="activeTab === 'plantilla'" class="tab-content">
          <div class="filters-panel q-mb-md">
            <div class="row items-center q-gutter-sm">
              <span class="material-symbols-outlined text-amber-8">info</span>
              <div class="text-caption text-grey-8">
                Variables disponibles:
                <code>{nombreInstructor}</code>
                <code>{fichaNumero}</code>
                <code>{RESULTS_BLOCK}</code>
                <code>{FECHA_AUTOMÁTICA}</code>
                <code>{SUPPORT_EMAILS}</code>
              </div>
            </div>
          </div>

          <div class="template-editor">
            <q-input
              v-model="template.subject"
              label="Asunto"
              dense
              outlined
              class="filter-input q-mb-md"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined text-grey-6">subject</span>
              </template>
            </q-input>
            <q-input
              v-model="template.content"
              label="Contenido"
              outlined
              type="textarea"
              autogrow
              class="filter-input template-content"
              input-style="min-height: 280px; font-family: Consolas, monospace; font-size: 13px;"
            />
            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn outline color="red-7" icon="restart_alt" label="Restaurar defaults" @click="restoreTemplate" />
              <q-btn outline color="grey-7" icon="refresh" label="Recargar" @click="loadTemplate" />
              <q-btn unelevated color="green-7" icon="save" label="Guardar plantilla" @click="saveTemplate" :loading="loadingTpl" />
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ================ MODAL CONFIG ================ -->
    <q-dialog v-model="configModal" persistent :backdrop-filter="'blur(4px)'">
      <q-card class="config-modal">
        <q-card-section class="config-modal-header">
          <div class="row items-center justify-center q-gutter-sm">
            <span class="config-modal-title">Configuración del Sistema</span>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            class="config-modal-close"
            v-close-popup
          />
        </q-card-section>

        <q-card-section class="config-modal-body">
          <div class="config-option" @click="!loadingCfg && (cfgCron = !cfgCron)">
            <div class="config-option-content">
              <div class="config-option-title">Reporte Automático</div>
              <div class="config-option-desc">
                Ejecutar auditoría automáticamente a la 1 AM hora Colombia (diario)
              </div>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: cfgCron }"
            >
              <div class="toggle-slider"></div>
            </div>
          </div>

          <div class="config-option" @click="!loadingCfg && (cfgEmail = !cfgEmail)">
            <div class="config-option-content">
              <div class="config-option-title">Envío de Correos Automáticos</div>
              <div class="config-option-desc">
                Enviar notificaciones por email cuando se detecten resultados vencidos
              </div>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: cfgEmail }"
            >
              <div class="toggle-slider"></div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="config-modal-footer" align="right">
          <q-btn
            flat
            label="Cancelar"
            class="config-btn-cancel"
            v-close-popup
            no-caps
          />
          <q-btn
            unelevated
            label="Guardar Cambios"
            class="config-btn-save"
            icon="save"
            @click="saveConfig"
            :loading="loadingCfg"
            no-caps
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from "vue";
import { useQuasar, QCard, QCardSection } from "quasar";
import { get, post, put } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { storeUser } from "../store/users.js";
import { requestAxios } from "../common/axios.js";
import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

/* ========== STAT ITEM (componente local con estilo REPFORA) ========== */
const StatItem = {
  props: {
    value: { type: [Number, String], default: 0 },
    label: { type: String, required: true },
    marker: { type: String, default: "green" }, // blue | red | amber | green
  },
  setup(props) {
    return () =>
      h("div", { class: `stat-item stat-${props.marker}` }, [
        h("div", { class: `stat-marker stat-marker-${props.marker}` }),
        h("div", { class: "stat-number" }, props.value ?? 0),
        h("div", { class: "stat-desc" }, props.label),
      ]);
  },
};

const $q = useQuasar();
const userStore = storeUser();

/* ========== STATE ========== */
const activeTab = ref("dashboard");
const lastUpdateText = ref("Cargando...");

const tabs = [
  { name: "dashboard", label: "Dashboard", icon: "dashboard" },
  { name: "proceso", label: "Proceso actual", icon: "schedule" },
  { name: "comparacion", label: "Comparación", icon: "compare_arrows" },
  { name: "descargas", label: "Descargas Excel", icon: "download" },
  { name: "plantilla", label: "Plantilla correo", icon: "email" },
];

// Dashboard
const dashStats = ref({});
const dashFiches = ref([]);
const dashSearch = ref("");
const dashFilter = ref("");
const dashFilterOptions = [
  { label: "Todos los estados", value: "" },
  { label: "Al día", value: "AL DÍA" },
  { label: "Con atrasos", value: "SNC" },
];
const loadingDash = ref(false);

const dashColumns = [
  { name: "ficheNumber", label: "Ficha", field: "ficheNumber", align: "left", style: "font-weight:600;" },
  { name: "programName", label: "Programa", field: "programName", align: "left" },
  { name: "coordinationName", label: "Coordinacion", field: "coordinationName", align: "left" },
  { name: "estadoGeneral", label: "Estado", field: "estadoGeneral", align: "left" },
  { name: "rapsTotal", label: "Total RAPs", field: "rapsTotal", align: "center" },
  { name: "alDia", label: "Al día", field: "alDia", align: "center" },
  { name: "aunNoVence", label: "No vence", field: "aunNoVence", align: "center" },
  { name: "sncParcial", label: "Atraso parcial", field: "sncParcial", align: "center" },
  { name: "sncCritico", label: "Atraso crítico", field: "sncCritico", align: "center" },
  { name: "sinProgramar", label: "Sin prog.", field: "sinProgramar", align: "center" },
];

// Proceso actual
const estadoStats = ref({});
const pendientes = ref([]);
const vencidosAgrupados = ref([]);
const vencidosFlat = ref([]);
const procSearch = ref("");
const procCoord = ref(null);
const coordOptions = ref([{ label: "Todas las coordinaciones", value: null }]);
const loadingProc = ref(false);
const loadingRun = ref(false);

const procColumns = [
  { name: "ficheNumber", label: "Ficha", field: "ficheNumber", align: "left", style: "font-weight:600;" },
  { name: "instructorName", label: "Líder", field: "instructorName", align: "left" },
  { name: "instructorEmail", label: "Email", field: "instructorEmail", align: "left" },
  { name: "count", label: "Resultados Vencidos", field: r => r.outcomes.length, align: "center" },
];

const pendColumns = [
  { name: "ficheNumber", label: "Ficha", field: "ficheNumber", align: "left" },
  { name: "outcomeText", label: "Resultado", field: "outcomeText", align: "left" },
  { name: "instructor", label: "Líder", field: r => r.ficheOwnerName || r.instructorName || "—", align: "left" },
  { name: "endDate", label: "Fecha fin", field: r => fmtDate(r.endDate), align: "center" },
];

// Comparación
const compData = ref(null);
const compAlert = ref("");
const compFilter = ref("");
const compSearch = ref("");
const loadingComp = ref(false);
const compFilterOptions = [
  { label: "Todos los cambios", value: "" },
  { label: "Mejoraron", value: "MEJORÓ" },
  { label: "Empeoraron", value: "EMPEORÓ" },
  { label: "Sin cambio", value: "SIN CAMBIO" },
  { label: "Nuevas", value: "NUEVA" },
  { label: "Resueltas", value: "RESUELTA" },
];
const compColumns = [
  { name: "ficheNumber", label: "Ficha", field: "ficheNumber", align: "left", style: "font-weight:600;" },
  { name: "cambio", label: "Cambio", field: "cambio", align: "left" },
  { name: "prevSnc", label: "Atrasos antes", field: r => (r.anterior?.sncParcial || 0) + (r.anterior?.sncCritico || 0), align: "center" },
  { name: "currSnc", label: "Atrasos ahora", field: r => (r.actual?.sncParcial || 0) + (r.actual?.sncCritico || 0), align: "center" },
  {
    name: "delta",
    label: "Δ",
    field: r => (r.delta == null ? "—" : r.delta > 0 ? "−" + r.delta : r.delta < 0 ? "+" + Math.abs(r.delta) : "0"),
    align: "center",
  },
];

// Descargas
const loadingDl = ref({ xlsx: false, zip: false });

// Plantilla
const template = ref({ subject: "", content: "" });
const templateDefaults = ref({ subject: "", content: "" });
const loadingTpl = ref(false);

// Modal config
const configModal = ref(false);
const cronStatus = ref({ enabled: false, schedule: "" });
const emailStatus = ref({ enabled: false });
const cfgCron = ref(false);
const cfgEmail = ref(false);
const loadingCfg = ref(false);

/* ========== HELPERS ========== */
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function estadoLabel(e) {
  return { "AL DÍA": "Al día", "SNC PARCIAL": "Atraso parcial", "SNC CRÍTICO": "Atraso crítico" }[e] || e || "—";
}
function estadoTagClass(e) {
  if (e === "AL DÍA") return "tag-green";
  if (e === "SNC CRÍTICO") return "tag-red";
  if (e === "SNC PARCIAL") return "tag-amber";
  return "tag-grey";
}
function cambioTagClass(c) {
  return {
    "MEJORÓ": "tag-green",
    "EMPEORÓ": "tag-red",
    "SIN CAMBIO": "tag-grey",
    "NUEVA": "tag-blue",
    "RESUELTA": "tag-green",
  }[c] || "tag-grey";
}

/* ========== COMPUTED FILTERS ========== */
const dashFiltered = computed(() => {
  let r = dashFiches.value;
  const s = dashSearch.value?.toLowerCase();
  if (s) r = r.filter(f => String(f.ficheNumber || "").toLowerCase().includes(s));
  if (dashFilter.value === "AL DÍA") r = r.filter(f => f.estadoGeneral === "AL DÍA");
  if (dashFilter.value === "SNC") r = r.filter(f => f.estadoGeneral !== "AL DÍA");
  return r;
});

const procFiltered = computed(() => {
  const s = procSearch.value?.toLowerCase();
  console.log(vencidosAgrupados.value);
  if (!s) return vencidosAgrupados.value;
  return vencidosAgrupados.value.filter(g =>
    String(g.ficheNumber || "").toLowerCase().includes(s) ||
    String(g.instructorName || "").toLowerCase().includes(s)
  );
});

const pendientesView = computed(() =>
  pendientes.value.slice(0, 100).map((p, i) => ({ ...p, _key: p.scheduleId || `p-${i}` }))
);

const compFiltered = computed(() => {
  let r = compData.value?.detalle || [];
  if (compFilter.value) r = r.filter(d => d.cambio === compFilter.value);
  const s = compSearch.value?.toLowerCase();
  if (s) r = r.filter(d => String(d.ficheNumber || "").toLowerCase().includes(s));
  return r;
});

/* ========== LOADERS ========== */
async function loadDashboard() {
  loadingDash.value = true;
  const r = await get("/auditoria/resumen-sede");
  console.log("respuesta dashboard ");
  console.log(r);
  if (r) {
    dashStats.value = r.data?.estadisticas || {};
    dashFiches.value = r.data?.fichas || [];
    lastUpdateText.value = r.executionDate ? fmtDate(r.executionDate) : (r.msg || "Sin datos");
  }
  loadingDash.value = false;
}

async function loadProceso() {
  loadingProc.value = true;
  const [estadoR, grR, coordsR] = await Promise.all([
    get("/auditoria/estado"),
    get("/auditoria/vencidos/agrupados"),
    get("/auditoria/coordinaciones"),
  ]);
  console.log("respuesta proceso ");
  console.log(estadoR);
  console.log(grR);
  
  if (estadoR) {
    estadoStats.value = estadoR.estadisticas || {};
    pendientes.value = estadoR.data?.pendientes || [];
    vencidosFlat.value = estadoR.data?.vencidos || [];
  }
  if (grR) vencidosAgrupados.value = grR.data || [];
  if (coordsR && coordOptions.value.length <= 1) {
    coordOptions.value = [
      { label: "Todas las coordinaciones", value: null },
      ...(coordsR.data || []).map(c => ({ label: c.name, value: c._id })),
    ];
  }
  loadingProc.value = false;
}

async function loadVencidosByCoord() {
  if (!procCoord.value) return loadProceso();
  loadingProc.value = true;
  const r = await get(`/auditoria/vencidos/coordinacion/${procCoord.value}`);
  if (r) vencidosAgrupados.value = r.data || [];
  loadingProc.value = false;
}

async function runManualAudit() {
  $q.dialog({
    title: "Ejecutar auditoría",
    message: "¿Iniciar una auditoría manual ahora?",
    cancel: true,
    ok: { color: "green-7", unelevated: true, label: "Ejecutar" },
  }).onOk(async () => {
    loadingRun.value = true;
    await post("/auditoria/cron/run", {});
    notifySuccessRequest("Auditoría iniciada correctamente");
    loadingRun.value = false;
  });
}

async function loadComparacion() {
  loadingComp.value = true;
  const r = await get("/auditoria/comparacion");
  if (r) {
    if (!r.data) {
      compAlert.value = r.msg || "Sin datos";
      compData.value = null;
    } else {
      compAlert.value = "";
      compData.value = r.data;
    }
  }
  loadingComp.value = false;
}

async function loadTemplate() {
  const r = await get("/auditoria/email/template");
  if (r) {
    template.value = { ...(r.data || {}) };
    templateDefaults.value = { ...(r.defaults || {}) };
  }
}

async function saveTemplate() {
  if (!template.value.subject || !template.value.content) {
    $q.notify({ type: "negative", message: "Asunto y contenido son obligatorios" });
    return;
  }
  loadingTpl.value = true;
  await put("/auditoria/email/template", template.value);
  notifySuccessRequest("Plantilla guardada correctamente");
  loadingTpl.value = false;
}

function restoreTemplate() {
  $q.dialog({
    title: "Restaurar plantilla",
    message: "¿Cargar los valores por defecto? (debes guardar para aplicar)",
    cancel: true,
    ok: { color: "green-7", unelevated: true, label: "Restaurar" },
  }).onOk(() => {
    template.value = { ...templateDefaults.value };
    $q.notify({ type: "info", message: "Valores por defecto cargados. Guarda para aplicar." });
  });
}

async function downloadExcel(path) {
  const key = path.endsWith("/zip") ? "zip" : "xlsx";
  loadingDl.value[key] = true;
  try {
    const res = await requestAxios.get(path, {
      headers: { token: userStore.token },
      responseType: "blob",
    });
    const disp = res.headers["content-disposition"] || "";
    const match = disp.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : (key === "zip" ? "resumen-coordinaciones.zip" : "resumen-sede.xlsx");
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    $q.notify({ type: "negative", message: "Error descargando archivo" });
  }
  loadingDl.value[key] = false;
}

/* ========== MODAL CONFIG ========== */
async function loadStatuses() {
  const [c, e] = await Promise.all([get("/auditoria/cron/status"), get("/auditoria/email/status")]);
  if (c) cronStatus.value = c;
  if (e) emailStatus.value = e;
  cfgCron.value = !!cronStatus.value.enabled;
  cfgEmail.value = !!emailStatus.value.enabled;
}

async function openConfigModal() {
  await loadStatuses();
  configModal.value = true;
}

async function saveConfig() {
  loadingCfg.value = true;
  if (cfgCron.value !== cronStatus.value.enabled) {
    await post("/auditoria/cron/toggle", { enabled: cfgCron.value });
    notifySuccessRequest(cfgCron.value ? "Cron activado correctamente" : "Cron desactivado correctamente");
  }
  if (cfgEmail.value !== emailStatus.value.enabled) {
    await post("/auditoria/email/toggle", { enabled: cfgEmail.value });
    notifySuccessRequest(cfgEmail.value ? "Envío de correos activado correctamente" : "Envío de correos desactivado correctamente");
  }
  await loadStatuses();
  loadingCfg.value = false;
  configModal.value = false;
}

/* ========== INIT ========== */
onMounted(async () => {
  await loadDashboard();
  await loadProceso();
  await loadComparacion();
  await loadTemplate();
  await loadStatuses();
});
</script>

<style scoped>
.auditcopy-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  max-width: 100%;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

.update-banner {
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  padding: 12px 16px;
  border-radius: 12px;
  border-left: 4px solid #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.update-banner:hover {
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.banner-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4caf50;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.2);
  flex-shrink: 0;
}

.banner-icon .material-symbols-outlined { font-size: 20px; }

.update-label {
  font-size: 13px;
  color: #78909c;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.update-time {
  font-weight: 600;
  color: #37474f;
  font-size: 13px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 2px 10px;
  border-radius: 12px;
}

.settings-btn {
  margin-left: auto;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: #f5f5f5 !important;
  transform: rotate(45deg);
}

.audit-tabs {
  border: none;
  border-radius: 16px !important;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
}

.audit-tab {
  min-height: 52px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-weight: 500;
}

.audit-tab::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
  border-radius: 3px 3px 0 0;
  transition: width 0.3s ease;
}

.audit-tab:hover::before {
  width: 60%;
}

.audit-tab:hover {
  background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);
}

.audit-tab.q-tab--active {
  background: linear-gradient(135deg, #4caf50 0%, #43a047 100%) !important;
  color: white !important;
}

.audit-tab.q-tab--active::before {
  width: 80%;
}

@media (max-width: 1024px) {
  .audit-tab { padding: 0 14px; }
}

@media (max-width: 700px) {
  .audit-tab { padding: 0 10px; min-height: 48px; }
  .audit-tab :deep(.q-tab__label) { font-size: 11px; margin-left: 4px; }
}

@media (max-width: 400px) {
  .audit-tab :deep(.q-tab__label) { display: none; }
  .audit-tab { min-width: 48px; padding: 0; min-height: 48px; }
  .audit-tab :deep(.q-tab__icon) { font-size: 24px; }
}

.tab-content {
  animation: slideUpFade 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stats-grid-5 { grid-template-columns: repeat(5, 1fr); }
.stats-grid-6 { grid-template-columns: repeat(6, 1fr); }

@media (max-width: 1024px) {
  .stats-grid-6 { grid-template-columns: repeat(3, 1fr); }
  .stats-grid-5 { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid, .stats-grid-5, .stats-grid-6 {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.stat-item {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 12px 12px 0 0;
  transition: height 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-item:hover::before {
  height: 100%;
  opacity: 0.05;
}

.stat-blue::before { background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%); }
.stat-red::before { background: linear-gradient(90deg, #d32f2f 0%, #ef5350 100%); }
.stat-amber::before { background: linear-gradient(90deg, #f57c00 0%, #ff9800 100%); }
.stat-green::before { background: linear-gradient(90deg, #388e3c 0%, #66bb6a 100%); }

.stat-marker {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  opacity: 0.12;
  transition: all 0.3s ease;
}

.stat-item:hover .stat-marker { opacity: 0.2; transform: scale(1.1); }

.stat-marker-blue  { background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); }
.stat-marker-red   { background: linear-gradient(135deg, #d32f2f 0%, #ef5350 100%); }
.stat-marker-amber { background: linear-gradient(135deg, #f57c00 0%, #ff9800 100%); }
.stat-marker-green { background: linear-gradient(135deg, #388e3c 0%, #66bb6a 100%); }

.stat-number {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 6px;
  transition: transform 0.3s ease;
}

.stat-item:hover .stat-number { transform: scale(1.05); }

.stat-blue  .stat-number { color: #1976d2; }
.stat-red   .stat-number { color: #d32f2f; }
.stat-amber .stat-number { color: #f57c00; }
.stat-green .stat-number { color: #388e3c; }

.stat-desc {
  font-size: 12px;
  color: #78909c;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.filters-panel {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-input :deep(.q-field__control),
.filter-select :deep(.q-field__control) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.filter-input :deep(.q-field__control:hover),
.filter-select :deep(.q-field__control:hover) {
  border-color: #4caf50;
}

.filter-input :deep(.q-field--focused .q-field__control),
.filter-select :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.audit-table {
  background: #ffffff;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.audit-table :deep(thead tr th) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  color: #37474f;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 12px 16px;
}

.audit-table :deep(tbody tr:hover td) {
  background: #fafbfc;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #37474f;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding-left: 4px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 16px;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tag-green {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
}

.tag-red {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #c62828;
}

.tag-amber {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
}

.tag-blue {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1565c0;
}

.tag-grey {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #424242;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 72px;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-title { font-size: 18px; font-weight: 700; color: #455a64; margin-bottom: 6px; letter-spacing: 0.3px; }
.empty-desc { font-size: 14px; color: #90a4ae; font-weight: 500; }

.warning-panel {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.4);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15);
}

.warning-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffecb3 0%, #ffe082 100%);
  border-bottom: 1px solid rgba(255, 193, 7, 0.3);
}

.warning-icon { color: #8d6e63; font-size: 22px; }
.warning-title { font-weight: 700; color: #8d6e63; font-size: 15px; letter-spacing: 0.3px; }

.download-card {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.download-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.download-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #4caf50;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.2);
}

.download-icon.icon-blue {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.2);
}

.download-icon .material-symbols-outlined { font-size: 26px; }
.download-title { font-size: 16px; font-weight: 700; color: #263238; margin-bottom: 6px; }
.download-desc { font-size: 13px; color: #78909c; line-height: 1.5; }

.template-editor {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.template-editor :deep(.q-field__control) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.template-editor :deep(.q-field__control:hover) {
  border-color: #4caf50;
}

.template-editor :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

code {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  margin-right: 4px;
  font-weight: 700;
}

.config-modal {
  max-width: 520px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.config-modal-header {
  background: linear-gradient(135deg, #4a7c59 0%, #5d8a6a 100%);
  color: white;
  padding: 28px;
  position: relative;
}

.config-modal-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.config-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  color: white;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.config-modal-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

.config-modal-body {
  padding: 24px 28px;
  background: #ffffff;
}

.config-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-radius: 14px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.config-option:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #e0e2e5 100%);
  border-color: rgba(74, 124, 89, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.config-option:last-child {
  margin-bottom: 0;
}

.config-option-content {
  flex: 1;
  padding-right: 20px;
}

.config-option-title {
  font-size: 16px;
  font-weight: 700;
  color: #263238;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}

.config-option-desc {
  font-size: 13px;
  color: #78909c;
  font-weight: 500;
  line-height: 1.4;
}

.toggle-switch {
  width: 56px;
  height: 30px;
  background: linear-gradient(135deg, #cfd8dc 0%, #b0bec5 100%);
  border-radius: 15px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.toggle-switch.active {
  background: linear-gradient(135deg, #4a7c59 0%, #5d8a6a 100%);
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
}

.toggle-slider {
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  border-radius: 50%;
  position: absolute;
  top: 4px;
  left: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(26px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.config-modal-footer {
  padding: 20px 28px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  gap: 12px;
}

.config-btn-cancel {
  background: linear-gradient(135deg, #78909c 0%, #607d8b 100%);
  color: white;
  border-radius: 10px;
  padding: 12px 28px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.config-btn-cancel:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(120, 144, 156, 0.4);
}

.config-btn-save {
  background: linear-gradient(135deg, #4a7c59 0%, #5d8a6a 100%);
  color: white;
  border-radius: 10px;
  padding: 12px 28px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.config-btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #bdbdbd;
}

.status-dot.active {
  background: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

.vertical-middle { vertical-align: middle; font-size: 16px; }

*:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

.q-btn:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
