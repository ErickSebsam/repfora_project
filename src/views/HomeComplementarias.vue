<template>
  <div>
    <BtnBack route="/complementarias" />

    <HeaderLayout
      :title="
        tab == 'catalogo'
          ? 'Catálogo'
          : tab == 'solicitud'
          ? 'Registro de solicitud'
          : 'Historial de registros'
      "
    />

    <q-tabs
      v-model="tab"
      class="q-mx-lg text-weight-bolder row"
      dense
      align="justify"
      active-color="lime-2"
      active-bg-color="green-9"
      indicator-color="black"
    >
      <q-tab class="text-green-9 bg-white col-4" name="catalogo"  icon="menu_book"  :label="$q.screen.lt.sm ? '' : 'Catálogo'" />
      <q-tab class="text-green-9 bg-white col-4" name="solicitud" icon="edit_note"  :label="$q.screen.lt.sm ? '' : 'Registro de solicitud'" />
      <q-tab class="text-green-9 bg-white col-4" name="historial" icon="history"    :label="$q.screen.lt.sm ? '' : 'Historial de registros'" />
    </q-tabs>

    <q-tab-panels v-model="tab" keep-alive>

      <!-- Tab Catálogo -->
      <q-tab-panel class="q-px-lg" name="catalogo">

        <!-- Banner catálogo desactualizado -->
        <q-banner v-if="catalogUpdateAlert" class="bg-orange-1 text-orange-9 q-mb-md" rounded>
          <template v-slot:avatar>
            <q-icon name="warning" color="orange" />
          </template>
          El catálogo puede estar desactualizado. Última carga: {{ formatDate(lastUploadDate) }}
        </q-banner>

        <div class="row q-col-gutter-md q-mt-sm">

          <!-- Columna filtros -->
          <div class="col-12 col-md-3">
            <CourseFilters
              v-model="activeFilters"
              :config="FILTER_CONFIG"
              :courses="allCourses"
              :counts="filterCounts"
            />
          </div>

          <!-- Columna lista de cursos -->
          <div class="col-12 col-md-9">

            <!-- Búsqueda + ordenamiento -->
            <div class="row q-gutter-sm q-mb-md">
              <q-input
                v-model="search"
                label="Buscar por nombre o código del curso"
                outlined
                dense
                clearable
                class="col"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-select
                v-model="sortOrder"
                :options="SORT_OPTIONS"
                outlined
                dense
                emit-value
                map-options
                color="green-9"
                class="sort-select"
                label="Ordenar"
              >
                <q-tooltip v-if="!hasSearched" anchor="top middle" self="bottom middle">
                  Realiza una búsqueda primero
                </q-tooltip>
              </q-select>
            </div>

            <!-- Chips de filtros activos -->
            <div v-if="tieneChipsFiltros" class="row q-gutter-sm q-mb-md">
              <q-chip
                v-for="(value, field) in activeFilterChips"
                :key="field"
                :label="getFilterLabel(field, value)"
                removable
                @remove="removeFilter(field)"
                color="green-9"
                text-color="white"
                size="sm"
              />
            </div>

            <!-- Sin búsqueda aún -->
            <div v-if="!hasSearched && !loading" class="text-center q-pa-xl">
              <q-icon name="manage_search" size="64px" color="grey-4" />
              <div class="text-grey-5 q-mt-md" style="font-size: 20px; font-weight: 600">Sin registros aún</div>
              <div class="text-grey-4 q-mt-xs" style="font-size: 14px">Usa el buscador o aplica un filtro para ver los cursos</div>
            </div>

            <!-- Sin resultados -->
            <div v-else-if="hasSearched && cursosFiltrados.length === 0 && !loading" class="text-center q-pa-xl">
              <q-icon name="search_off" size="64px" color="grey-4" />
              <div class="text-grey-6 q-mt-md" style="font-size: 16px">
                No se encontraron cursos con los criterios aplicados
              </div>
            </div>

            <!-- Contador de resultados -->
            <div v-if="hasSearched && !loading" class="text-grey-7 q-mb-md" style="font-size: 14px">
              {{ cursosFiltrados.length }} {{ cursosFiltrados.length === 1 ? 'curso encontrado' : 'cursos encontrados' }}
            </div>

            <!-- Lista de tarjetas -->
            <div style="position: relative; min-height: 100px">
              <div class="column q-gutter-sm">
                <div v-for="course in cursosPagina" :key="course._id" class="col-12">
                  <CourseCard :course="course" @select="openDialog" />
                </div>
              </div>
              <q-inner-loading :showing="loading">
                <q-spinner-gears size="50px" color="green-9" />
              </q-inner-loading>
            </div>

            <!-- Paginación -->
            <div v-if="totalPages > 1" class="q-mt-lg flex justify-center">
              <q-pagination
                v-model="page"
                :max="totalPages"
                :max-pages="5"
                direction-links
                flat
                color="green-9"
                active-color="green-9"
              />
            </div>

          </div>
        </div>

      </q-tab-panel>

      <!-- Tab Registro de solicitud -->
      <q-tab-panel class="q-px-lg" name="solicitud">
        <div class="row q-mt-md">
          <div class="col-12">
            <FormRegistroSolicitud
              :loading="loadingSolicitud"
              :courses="allCourses"
              :environments="[]"
              :prefill="instructorPrefill"
              :curso-confirmado="cursoConfirmado"
              @submit="enviarSolicitud"
              @curso-cambiado="cursoConfirmado = $event"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- Tab Historial de registros -->
      <q-tab-panel class="q-px-lg" name="historial">
        <div class="text-center q-pa-xl">
          <q-icon name="history" size="64px" color="grey-4" />
          <div class="text-grey-5 q-mt-md" style="font-size: 20px; font-weight: 600">Sin registros aún</div>
          <div class="text-grey-4 q-mt-xs" style="font-size: 14px">Tus solicitudes registradas aparecerán aquí</div>
        </div>
      </q-tab-panel>

    </q-tab-panels>

    <!-- Dialog fuera de los tab-panels para evitar conflictos con keep-alive -->
    <DialogCursoDetalle
      v-if="selectedCourse"
      v-model="dialogOpen"
      :course="selectedCourse"
      @confirm="confirmarCurso"
    />

  </div>
</template>

<script setup>
// ═══ IMPORTS ══════════════════════════════════════════════════════════════════
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { get, post }  from '../services/api.js'
import { storeUser }  from '../store/users.js'
import BtnBack        from '../layouts/btnBackLayout.vue'
import HeaderLayout   from '../layouts/headerViewsLayout.vue'
import CourseCard     from '../components/Complementarys/CourseCard.vue'
import CourseFilters  from '../components/Complementarys/CourseFilters.vue'
import DialogCursoDetalle    from '../components/Complementarys/DialogCursoDetalle.vue'
import FormRegistroSolicitud from '../components/Complementarys/FormRegistroSolicitud.vue'
import { notifySuccessRequest } from '../common/notify.js'

// ═══ STORE & ESTADO GLOBAL ════════════════════════════════════════════════════
const useStore = storeUser()
const tab      = ref('catalogo')


// ════════════════════════════════════════════════════════════════════════════════
// CATÁLOGO
// ════════════════════════════════════════════════════════════════════════════════

// ─── Constantes ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 11

const FILTER_CONFIG = [
  { field: 'modalidad',            label: 'Modalidad',             type: 'checkbox' },
  { field: 'lineaTecnologica',     label: 'Línea Tecnológica',     type: 'checkbox' },
  { field: 'redConocimiento',      label: 'Red de Conocimiento',   type: 'checkbox' },
  { field: 'apuestasPrioritarias', label: 'Apuestas Prioritarias', type: 'checkbox' },
  { field: 'prfDuracionMaxima',    label: 'Duración', type: 'hours-range', min: 0, max: 2200 },
]

const SORT_OPTIONS = [
  { label: 'Horas: menor a mayor', value: 'horas_asc'  },
  { label: 'Horas: mayor a menor', value: 'horas_desc' },
  { label: 'Nombre: A → Z',        value: 'nombre_asc'  },
  { label: 'Nombre: Z → A',        value: 'nombre_desc' },
]

// ─── Estado ───────────────────────────────────────────────────────────────────
const allCourses         = ref([])
const courses            = ref([])
const loading            = ref(false)
const catalogUpdateAlert = ref(false)
const lastUploadDate     = ref(null)
const dialogOpen         = ref(false)
const selectedCourse     = ref(null)
const activeFilters      = ref({})
const search             = ref('')
const sortOrder          = ref(null)
const page               = ref(1)
const hasSearched        = ref(false)

// ─── Carga ────────────────────────────────────────────────────────────────────
async function iniciarCatalogo() {
  loading.value = true
  try {
    const res = await get('/complementary/catalog', { status: 0 })
    allCourses.value         = res.data
    catalogUpdateAlert.value = res.catalogUpdateAlert
    lastUploadDate.value     = res.lastUploadDate
  } catch {}
  loading.value = false
}

async function fetchCat(searchText = '') {
  loading.value = true
  const params = { status: 0 }
  if (searchText) {
    const isNumeric = /^\d+$/.test(searchText.trim())
    if (isNumeric) params.prfCodigo       = searchText.trim()
    else           params.prfDenominacion = searchText.trim()
  }
  try {
    const res = await get('/complementary/catalog', params)
    courses.value = res.data
  } catch {}
  loading.value = false
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
function matchCheckbox(course, field) {
  const val = activeFilters.value[field]
  if (!val || val.length === 0) return true
  return val.includes(course[field])
}

function matchHoursRange(course, field) {
  const cfg = FILTER_CONFIG.find(f => f.field === field)
  const min = activeFilters.value[field + 'Min'] ?? cfg?.min ?? 0
  const max = activeFilters.value[field + 'Max'] ?? cfg?.max ?? 2200
  const h   = course[field]
  if (h == null) return true
  return h >= min && h <= max
}

const tieneAlgunFiltro = computed(() => {
  const hayCheckbox = FILTER_CONFIG
    .filter(f => f.type === 'checkbox')
    .some(f => (activeFilters.value[f.field] || []).length > 0)
  const cfgHoras = FILTER_CONFIG.find(f => f.type === 'hours-range')
  const hayHoras = cfgHoras && (
    (activeFilters.value[cfgHoras.field + 'Min'] !== undefined &&
     activeFilters.value[cfgHoras.field + 'Min'] !== cfgHoras.min) ||
    (activeFilters.value[cfgHoras.field + 'Max'] !== undefined &&
     activeFilters.value[cfgHoras.field + 'Max'] !== cfgHoras.max)
  )
  return hayCheckbox || hayHoras
})

const cursosFiltrados = computed(() =>
  courses.value.filter(course => {
    const q = search.value?.toLowerCase()
    const coincideBusqueda = !q
      || course.prfDenominacion?.toLowerCase().includes(q)
      || String(course.prfCodigo).includes(q)
    return coincideBusqueda
      && matchCheckbox(course, 'modalidad')
      && matchCheckbox(course, 'lineaTecnologica')
      && matchCheckbox(course, 'redConocimiento')
      && matchCheckbox(course, 'apuestasPrioritarias')
      && matchHoursRange(course, 'prfDuracionMaxima')
  })
)

const filterCounts = computed(() => {
  const counts = {}
  FILTER_CONFIG.forEach(f => {
    if (f.type === 'checkbox') {
      counts[f.field] = {}
      allCourses.value.forEach(c => {
        const val = c[f.field]
        if (val) counts[f.field][val] = (counts[f.field][val] || 0) + 1
      })
    }
  })
  return counts
})

const activeFilterChips = computed(() => {
  const chips = {}
  FILTER_CONFIG.forEach(({ field }) => {
    const val = activeFilters.value[field]
    if (Array.isArray(val) && val.length > 0) chips[field] = val
  })
  return chips
})

const tieneChipsFiltros = computed(() => Object.keys(activeFilterChips.value).length > 0)

function removeFilter(field) {
  const updated = { ...activeFilters.value }
  const cfg = FILTER_CONFIG.find(f => f.field === field)
  if (cfg?.type === 'checkbox')         updated[field] = []
  else if (cfg?.type === 'hours-range') {
    updated[field + 'Min'] = cfg.min
    updated[field + 'Max'] = cfg.max
  }
  activeFilters.value = updated
}

function getFilterLabel(field, value) {
  const cfg   = FILTER_CONFIG.find(f => f.field === field)
  const label = cfg?.label || field
  if (Array.isArray(value)) return `${label}: ${value.join(', ')}`
  return `${label}: ${value}`
}

// ─── Ordenamiento y paginación ────────────────────────────────────────────────
const cursosOrdenados = computed(() => {
  const list = [...cursosFiltrados.value]
  if (sortOrder.value === 'horas_asc')   return list.sort((a, b) => a.prfDuracionMaxima - b.prfDuracionMaxima)
  if (sortOrder.value === 'horas_desc')  return list.sort((a, b) => b.prfDuracionMaxima - a.prfDuracionMaxima)
  if (sortOrder.value === 'nombre_asc')  return list.sort((a, b) => a.prfDenominacion.localeCompare(b.prfDenominacion))
  if (sortOrder.value === 'nombre_desc') return list.sort((a, b) => b.prfDenominacion.localeCompare(a.prfDenominacion))
  return list
})

const cursosPagina = computed(() =>
  cursosOrdenados.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)

const totalPages = computed(() => Math.ceil(cursosOrdenados.value.length / PAGE_SIZE))

// ─── Búsqueda con debounce ────────────────────────────────────────────────────
let debounceTimer = null

function triggerSearch() {
  const hasQuery = search.value || tieneAlgunFiltro.value
  if (!hasQuery) {
    courses.value     = []
    hasSearched.value = false
    return
  }
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    hasSearched.value = true
    await fetchCat(search.value)
    page.value = 1
  }, 400)
}

watch([search, activeFilters], triggerSearch, { deep: true })

// ─── Dialog detalle ───────────────────────────────────────────────────────────
function openDialog(course) {
  selectedCourse.value = course
  dialogOpen.value     = true
}

async function confirmarCurso(course) {
  dialogOpen.value      = false
  cursoConfirmado.value = course
  await nextTick()
  tab.value = 'solicitud'
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}


// ════════════════════════════════════════════════════════════════════════════════
// REGISTRO DE SOLICITUD
// ════════════════════════════════════════════════════════════════════════════════

// ─── Estado ───────────────────────────────────────────────────────────────────
const cursoConfirmado  = ref(null)
const loadingSolicitud = ref(false)

const instructorPrefill = computed(() => {
  const i = useStore.instructorData || {}
  return {
    correoInstructor:            i.email        || "",
    correoPersonalInstructor:    i.emailpersonal || "",
    cedulaInstructor:            i.numdocument   || "",
    nombreInstructor:            i.name          || "",
    telefonoInstructor:          i.phone         || "",
  }
})

// ─── Envío ────────────────────────────────────────────────────────────────────
async function enviarSolicitud(formData) {
  console.log("=== [solicitud] token:", useStore.token, "| email:", useStore.email, "| instructor:", useStore.newConsult)
  console.log("=== [solicitud] formData:", { ...formData })
  loadingSolicitud.value = true
  try {
    const res = await post("/complementary/requests/register", formData)
    console.log("=== [solicitud] respuesta:", res)
    if (res?.msg) notifySuccessRequest(res.msg)
  } catch (err) {
    console.log("=== [solicitud] error:", err?.response?.data)
  } finally {
    loadingSolicitud.value = false
  }
}


// ═══ INIT ═════════════════════════════════════════════════════════════════════
onMounted(() => {
  console.log("=== [HomeComplementarias] email:", useStore.email)
  console.log("=== [HomeComplementarias] newConsult:", useStore.newConsult)
  iniciarCatalogo()
})
</script>

<style>
.sort-select { min-width: 170px; }
</style>
