<template>
  <div>
    <BtnBack route="/home" />
    <HeaderLayout title="Fichas" />

    <div class="row justify-center">
      <div
        class="col-sm-2 col-md-1 col-12 justify-center flex justify-sm-start"
      >
        <q-btn
          class="bg-green-9 text-white"
          @click="(prompt = true), cleanForm(), (edit = false)"
          ><span
            class="material-symbols-outlined q-mr-sm"
            style="font-size: 20px"
          >
            add_circle
          </span>
          Crear
        </q-btn>
      </div>
      <div
        class="col-sm-8 col-md-9 col-12 flex"
        :class="
          $q.screen.width < 600 ? 'justify-center q-mt-md' : 'justify-end'
        "
      >
        <q-select
          filled
          style="width: 350px"
          outlined
          use-input
          dense
          v-model="ficheSelected"
          hide-selected
          fill-input
          label="Seleccione la ficha"
          :options="ficheOptions"
          @filter="filterFiche"
          :popup-content-style="{ width: '300px' }"
          @update:model-value="searchFiche()"
        >
          <template v-slot:append>
            <q-icon
              v-if="ficheSelected.length !== 0"
              class="cursor-pointer"
              name="clear"
              @click.stop.prevent="ficheSelected = []"
            />
          </template>
        </q-select>
      </div>
    </div>
    <!-- TABLE INFO -->
    <div class="row q-mt-md">
      <div class="col-1"></div>
      <div class="col-10 q-mb-lg">
        <q-table
          flat
          bordered
          no-data-label="Sin registros aún"
          :rows="ficheSelected.length == 0 ? rows : rowsFilter"
          :columns="columns"
          row-key="index"
          class="q-mx-md my-sticky-header-table"
          rows-per-page-label="Numero de documentos"
          :rows-per-page-options="[10, 20, 30, 40, 50, 0]"
          :pagination="{
            rowsPerPage: 50,
          }"
        >
          <template v-slot:body-cell-program="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip v-if="props.value.length > 38" max-width="350px">
                  {{ props.value }}
                </q-tooltip>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <div>
                <q-badge v-if="props.value === 'Activo'" class="bg-green-10">{{
                  props.value
                }}</q-badge>
                <q-badge v-else class="bg-red">{{ props.value }}</q-badge>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-options="props">
            <q-td :props="props">
              <div>
                <q-btn
                  round
                  icon="edit"
                  class="q-mx-md"
                  size="xs"
                  color="green-10"
                  @click="showInfo(props.row)"
                ></q-btn>
                <q-btn
                  v-if="props.row.status === 1"
                  round
                  size="xs"
                  color="green-10"
                  @click="activarDesactivar(props.row)"
                  ><span
                    class="material-symbols-outlined"
                    style="font-size: 18px"
                  >
                    check
                  </span></q-btn
                >
                <q-btn
                  v-else
                  round
                  size="xs"
                  color="red"
                  @click="activarDesactivar(props.row)"
                  ><span
                    class="material-symbols-outlined"
                    style="font-size: 18px"
                  >
                    close
                  </span></q-btn
                >
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
      <div class="col-1"></div>
    </div>

    <q-dialog v-model="prompt">
      <q-card>
        <q-card-section class="bg-green-9 q-px-lg">
          <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
            {{ edit ? "MODIFICA LA INFORMACIÓN" : "DILIGENCIA LA INFORMACIÓN" }}
          </h5>
        </q-card-section>
        <div class="q-pa-md">
          <q-form
            @submit.prevent.stop="edit ? putFiches() : postFiches()"
            novalidate
          >
            <div>
              <q-input
                filled
                type="number"
                v-model="number"
                label="Número de ficha"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                  (val) => val > 0 || 'El campo debe ser mayor a 0',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> 123 </span>
                </template>
              </q-input>

              <q-select
                type="text"
                filled
                v-model="owner"
                use-input
                options-dense
                :options="filterInstructors"
                @filter="filterInstru"
                label="Instructor líder"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined">
                    interactive_space
                  </span>
                </template>
              </q-select>

              <q-select
                type="text"
                filled
                v-model="program"
                use-input
                options-dense
                :options="filterOptions"
                @filter="filterFn"
                label="Programa"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
                :popup-content-style="{ width: '300px' }"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> home_storage </span>
                </template>
              </q-select>

              <q-select
                type="text"
                filled
                v-model="coordination"
                use-input
                options-dense
                :options="coordinationOptions"
                @filter="filterFn"
                label="Coodinación"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> home_storage </span>
                </template>
              </q-select>

              <q-input
                filled
                placeholder="aaaa/mm/dd"
                v-model="fStart"
                mask="date"
                label="Fecha inicio"
                :rules="['date']"
                lazy-rules
                @update:model-value="clearDataCalender()"
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
                          <q-btn
                            v-close-popup
                            label="Close"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
                <template v-slot:prepend>
                  <span class="material-symbols-outlined">
                    event_upcoming
                  </span>
                </template>
              </q-input>

              <q-input
                filled
                placeholder="aaaa/mm/dd"
                v-model="fEnd"
                mask="date"
                label="Fecha Fin"
                :rules="['date']"
                lazy-rules
                @update:model-value="clearDataCalender()"
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
                          <q-btn
                            v-close-popup
                            label="Close"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> event_busy </span>
                </template>
              </q-input>

              <div class="justify-center flex">
                <q-btn
                  icon="save_as"
                  label="GUARDAR"
                  type="submit"
                  class="q-mt-md q-mb-sm q-mx-sm save_as"
                  :loading="loading"
                >
                  <template v-slot:loading>
                    <q-spinner-oval color="white" size="1em" />
                  </template>
                </q-btn>

                <q-btn
                  type="button"
                  class="q-mt-md q-mb-sm q-mx-sm"
                  to=""
                  v-close-popup
                  ><span
                    class="material-symbols-outlined q-mr-sm"
                    style="font-size: 23px"
                  >
                    cancel </span
                  >CERRAR</q-btn
                >
              </div>
            </div>
          </q-form>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { onBeforeMount, ref } from "vue";
import { get, post, put } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

let prompt = ref(false);
let edit = ref(false);
let number = ref();
let program = ref();
let owner = ref();
let index = ref();
let coordination = ref();
let fStart = ref();
let fEnd = ref();
let ownerOptions = ref([]);
let programOptions = ref([]);
let coordinationOptions = ref([]);
let loading = ref(false);
let filterOptions = ref([]);
let filterInstructors = ref([]);

let ficheSelected = ref([]);
let ficheOptions = ref([]);
let ficheOpt = [];
let rowsFilter = ref([]);

let columns = ref([
  {
    name: "index",
    label: "N°",
    field: "index",
    align: "center",
  },
  {
    name: "number",
    label: "NÚMERO",
    field: "number",
    align: "center",
    sortable: true,
  },
  {
    name: "program",
    label: "PROGRAMA",
    field: (row) => row.program.name,
    align: "center",
    style:
      "max-width: 360px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "owner",
    label: "INSTRUCTOR LÍDER",
    field: (row) => row.owner.name,
    align: "center",
    sortable: true,
  },
  {
    name: "coordination",
    label: "COORDINACIÓN",
    field: (row) => row.coordination.name,
    align: "center",
    sortable: true,
  },
  {
    name: "fstart",
    label: "FECHA INICIO ETAPA LECTIVA",
    field: (row) => (row.fstart ? row.fstart.split("T")[0] : ""),
    align: "center",
    sortable: true,
  },
  {
    name: "fend",
    label: "FECHA FIN ETAPA LECTIVA",
    field: (row) => (row.fend ? row.fend.split("T")[0] : ""),
    align: "center",
    sortable: true,
  },
  {
    name: "status",
    label: "ESTADO",
    field: (row) => (row.status == 1 ? "Inactivo" : "Activo"),
    align: "center",
    sortable: true,
  },
  {
    name: "options",
    label: "OPCIONES",
    align: "center",
  },
]);

let rows = ref([]);

onBeforeMount(async () => {
  await getFiches();
  await getPrograms();
  await getInstructors();
  await getUsers();
});

// get
async function getFiches() {
  const data = await get("/fiches");

  rows.value = data;
  ficheOpt = [];
  rows.value.forEach((row, index) => {
    row.index = index + 1;
    ficheOpt.push({
      label: `${row.number}: ${row.program.name}`,
      value: row._id,
    });
  });

  ficheOptions.value = ficheOpt;
}

async function postFiches() {
  loading.value = true;
  await post("/fiches/register", {
    number: number.value,
    program: program.value.value,
    owner: owner.value.value,
    coordination: coordination.value.value,
    fstart: fStart.value,
    fend: fEnd.value,
  });
  notifySuccessRequest("Ficha registrada correctamente");
  prompt.value = false;
  edit.value = false;

  cleanForm();
  await getFiches();
  loading.value = false;
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    await put("/fiches/inactive/" + data._id, null);
    notifySuccessRequest("Ficha desactivada correctamente");
    await getFiches();
  } else {
    await put("/fiches/active/" + data._id, null);
    notifySuccessRequest("Ficha activada correctamente");
    await getFiches();
  }
  searchFiche();
}

async function putFiches() {
  loading.value = true;

  await put("/fiches/update/" + index.value, {
    number: number.value,
    program: program.value.value,
    owner: owner.value.value,
    coordination: coordination.value.value,
    fstart: fStart.value,
    fend: fEnd.value,
  });
  notifySuccessRequest("Ficha actualizada correctamente");
  prompt.value = false;
  edit.value = false;
  cleanForm();
  await getFiches();
  searchFiche();

  loading.value = false;
}

async function getPrograms() {
  const data = await get("/programs?status=0");

  data.forEach((row, index) => {
    programOptions.value.push({
      label: `${row.code}  v${row.version} : ${row.name}`,
      value: row._id,
    });
    filterOptions.value = programOptions.value;
  });
}

async function getInstructors() {
  const data = await get("/instructors?status=0");

  data.forEach((row, index) => {
    ownerOptions.value.push({ label: row.name, value: row._id });
    filterInstructors.value = ownerOptions.value;
  });
}

async function getUsers() {
  const data = await get("/coordinations?status=0");

  data.forEach((row, index) => {
    coordinationOptions.value.push({ label: row.name, value: row._id });
  });
}

function showInfo(data) {
  index.value = data._id;
  number.value = data.number;
  program.value = {
    label: data.program.name,
    value: data.program._id,
  };
  owner.value = {
    label: data.owner.name,
    value: data.owner._id,
  };
  coordination.value = {
    label: data.coordination.name,
    value: data.coordination._id,
  };
  fStart.value = data.fstart
    ? data.fstart.split("T")[0].replace(/-/g, "/")
    : "";
  fEnd.value = data.fend ? data.fend.split("T")[0].replace(/-/g, "/") : "";

  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function cleanForm() {
  if (prompt.value === true) {
    loading.value = false;
    number.value = "";
    program.value = null;
    owner.value = null;
    coordination.value = null;
    fStart.value = "";
    fEnd.value = "";
  }
}

function filterFn(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptions.value = programOptions.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterInstru(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterInstructors.value = ownerOptions.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterFiche(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    ficheOptions.value = ficheOpt.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function searchFiche() {
  if (ficheSelected.value.length === 0) {
    rowsFilter.value = rows.value;
  } else {
    rowsFilter.value = [];
    rowsFilter.value = rows.value.filter(
      (element) => element._id == ficheSelected.value.value
    );
  }
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
</style>
