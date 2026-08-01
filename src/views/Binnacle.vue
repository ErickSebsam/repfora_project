<template>
  <div class="drop-area">
    <BtnBack route="/home" />

    <HeaderLayout title="Bitácora" />

    <!-- TABLE INFO -->
    <div class="row justify-center">
      <div class="col-10 items-center">
        <q-form
          @submit.prevent.stop="showLog()"
          class="flex justify-around row"
        >
          <q-select
            filled
            outlined
            use-input
            dense
            v-model="selectedAction"
            hide-selected
            fill-input
            label="Seleccione una acción"
            :options="optionsAction"
            :popup-content-style="{ width: '300px' }"
            lazy-rules
            :rules="[(val) => !!val || 'El campo es requerido']"
            class="q-pt-md"
          >
            <template v-slot:append>
              <q-icon
                class="cursor-pointer"
                name="clear"
                @click="selectedAction = ''"
              />
            </template>
          </q-select>

          <q-input
            class="q-pt-md"
            filled
            dense
            placeholder="aaaa/mm/dd"
            v-model="fStart"
            mask="date"
            label="Fecha inicio"
            :rules="['date']"
            lazy-rules
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date v-model="fStart" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            class="q-pt-md"
            filled
            placeholder="aaaa/mm/dd"
            v-model="fEnd"
            dense
            mask="date"
            label="Fecha inicio"
            :rules="['date']"
            lazy-rules
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date v-model="fEnd" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <div class="items-center flex">
            <q-btn color="green-9" label="Buscar" icon="search" type="submit" />
          </div>
        </q-form>
      </div>
      <div class="col-10 q-mb-lg">
        <q-table
          style="height: 70vh"
          flat
          bordered
          no-data-label="Sin registros aún"
          :rows="rows"
          :columns="columns"
          row-key="index"
          :rows-per-page-options="[0]"
          separator="cell"
          hide-bottom
          class="table-judgment my-sticky-header-table"
        >
          <template v-slot:top="">
            <q-btn
              color="green-9"
              :label="modeDev ? 'Vista Reducida' : 'Vista Detallada'"
              icon="settings"
              @click="modeDev = !modeDev"
            />
          </template>
          <template v-slot:body-cell-information="props">
            <q-td :props="props">
              <div v-if="!modeDev">
                {{ props.row.information.event }}
              </div>
              <div v-else>
                {{ props.row.information.event }}
                <br />
                <br />
                {{
                  props.row.information.data ? props.row.information.data : ""
                }}
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount } from "vue";
import { get, post } from "../services/api.js";
import { useQuasar } from "quasar";
import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

let selectedAction = ref("");
let fStart = ref("");
let fEnd = ref("");
let modeDev = ref(false);
let rows = ref([]);
let optionsAction = ref([
  { label: "TODOS", value: "TODOS" },
  { label: "BASE DE DATOS", value: "DATABASE" },
  { label: "COMPETENCIAS", value: "COMPETENCIA" },
  { label: "COORDINACIÓN", value: "COORDINACION" },
  { label: "AMBIENTES", value: "AMBIENTE" },
  { label: "FICHAS", value: "FICHA" },
  { label: "INSTRUCTORES", value: "INSTRUCTOR" },
  { label: "OTROS HORARIOS", value: "OTROS HORARIOS" },
  { label: "HORARIOS", value: "HORARIO" },
  { label: "RESULTADOS", value: "RESULTADO" },
  { label: "PROGRAMAS", value: "PROGRAMA" },
  { label: "REPORTES", value: "REPORTES" },
  { label: "CARGAS MASIVAS", value: "CARGA MASIVA" },
  {
    label: "CARGA DE JUICIOS EVALUATIVOS",
    value: "CARGA DE JUICIOS EVALUATIVOS",
  },
  { label: "RESUMEN DE PROGRAMAS", value: "RESUMEN DE PROGRAMAS" },
  { label: "INGRESO AL SISTEMA", value: "LOGIN" },
  { label: "USUARIOS", value: "USUARIO" },
]);

let columns = ref([
  {
    name: "user",
    label: "Usuario",
    field: "user",
    align: "center",
    sortable: true,
  },
  {
    name: "action",
    label: "Acción",
    field: "action",
    align: "center",
    sortable: true,
  },
  {
    name: "information",
    label: "Información Adicional",
    field: "information",
    align: "center",
    sortable: true,
    style: "max-width: 300px; white-space: normal; word-wrap: break-word;",
  },
  {
    name: "createdAt",
    label: "Fecha",
    field: (row) => formatLocalDate(row.createdAt),
    align: "center",
    sortable: true,
  },
]);

const formatLocalDate = (date) => {
  const newDate = new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return newDate;
};

onBeforeMount(() => {
  getLog();
});

async function getLog() {
  try {
    const data = await get("/binnacle");
    rows.value = data;
  } catch (error) {}
}

async function showLog() {
  let data = {
    type: selectedAction.value.value,
    datestart: fStart.value,
    dateend: fEnd.value,
  };
  try {
    const data2 = await post("/binnacle/filterbinnacle", data);
    rows.value = data2;
  } catch (error) {}
}
</script>

<style scoped>
</style>
