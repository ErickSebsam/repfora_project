<template>
  <div>
    <BtnBack route="/home" />

    <HeaderLayout title="Ambientes" />

    <div class="row justify-center">
      <div
        class="col-10 flex"
        :class="$q.screen.width < 600 ? 'justify-center' : ''"
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
    </div>
    <!-- TABLE INFO -->
    <div class="row q-mt-md">
      <div class="col-1"></div>
      <div class="col-10 q-mb-lg">
        <q-table
          class="my-sticky-header-table"
          flat
          no-data-label="Sin registros aún"
          bordered
          :rows="rows"
          :columns="columns"
          row-key="index"
          :rows-per-page-options="[0]"
          :pagination="{
            rowsPerPage: 0,
          }"
        >
          <template v-slot:body-cell-description="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip v-if="props.value.length > 28" max-width="350px">
                  {{ props.row.description }}
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
            @submit.prevent.stop="edit ? putEnvironments() : postEnvironments()"
            novalidate
          >
            <div>
              <q-input
                filled
                type="text"
                v-model="name"
                label="Nombre"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> draw </span>
                </template>
              </q-input>

              <q-input
                filled
                type="text"
                v-model="description"
                label="Descripción"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> article </span>
                </template>
              </q-input>
              <q-select
                filled
                options-dense
                v-model="department"
                :options="filterOptionsDepartment"
                label="Departamento"
                use-input
                input-debounce="0"
                @filter="filterDepartment"
                lazy-rules
                :rules="[
                  (val) =>
                    ((val) => val !== null && val !== '') ||
                    'El campo es requerido',
                ]"
                @update:model-value="getDepartments()"
                :loading="loadingDepartment"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> list </span>
                </template>
              </q-select>

              <q-select
                filled
                options-dense
                v-model="town"
                :options="filterOptionsTown"
                label="Municipio"
                :disable="disableTown"
                use-input
                input-debounce="0"
                @filter="filterTown"
                lazy-rules
                :rules="[
                  (val) =>
                    ((val) => val !== null && val !== '') ||
                    'El campo es requerido',
                ]"
                :loading="loadingTowns"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> list </span>
                </template>
              </q-select>

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
import { useQuasar } from "quasar";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

let prompt = ref(false);
let edit = ref(false);
let name = ref();
let description = ref();
let town = ref();
let department = ref();
let townOptions = ref([]);
let index = ref();
let filterOptionsTown = ref([]);
let filterOptionsDepartment = ref([]);
let loading = ref(false);
let loadingTowns = ref(false);
let loadingDepartment = ref(false);
let dataDepartaments = ref();
let disableTown = ref(true);

let columns = ref([
  {
    name: "index",
    label: "N°",
    field: "index",
    align: "center",
  },
  {
    name: "name",
    label: "NOMBRE",
    field: "name",
    align: "center",
    sortable: true,
  },
  {
    name: "description",
    label: "DESCRIPCIÓN",
    field: "description",
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "town",
    label: "MUNICIPIO",
    field: (row) => row.town.name,
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
  await getEnvironments();
  // await getTowns();
  await getDepartmentsStore();
});

async function getDepartmentsStore() {
  dataDepartaments.value = await get("/towns/departaments");
  await getDepartments();
}

async function getEnvironments() {
  try {
    const data = await get("/environments");
    rows.value = data;
    rows.value.forEach((row, index) => {
      row.index = index + 1;
    });
  } catch (error) {}
}

async function postEnvironments() {
  loading.value = true;
  try {
    await post("/environments/register", {
      name: name.value,
      description: description.value,
      town: town.value.value,
    });
    notifySuccessRequest("Ambiente guardardo correctamente");
    prompt.value = false;
    edit.value = false;

    cleanForm();
    getEnvironments();
  } catch (error) {}
  loading.value = false;
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    try {
      await put(`/environments/inactive/${data._id}`, null);
      notifySuccessRequest("Ambiente desactivado correctamente");
    } catch (error) {}
    await getEnvironments();
  } else {
    try {
      await put(`/environments/active/${data._id}`, null);
      notifySuccessRequest("Ambiente activado correctamente");
    } catch (error) {}
    await getEnvironments();
  }
}

function showInfo(data) {
  index.value = data._id;
  name.value = data.name;
  description.value = data.description;
  town.value = {
    label: data.town.name,
    value: data.town._id,
  };
  department.value = data.town.departament;
  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function putEnvironments() {
  loading.value = true;
  try {
    await put("/environments/update/" + index.value, {
      name: name.value,
      description: description.value,
      town: town.value.value,
    });
    notifySuccessRequest("Ambiente actualizado correctamente");
    edit.value = false;
    prompt.value = false;
    cleanForm();
    getEnvironments();
  } catch (error) {}

  loading.value = false;
}

async function getTowns() {
  town.value = null;
  townOptions.value = [];
  loadingTowns.value = true;
  const data = await get(`/towns/towns/${department.value}`);
  data.forEach((row, index) => {
    townOptions.value.push({ label: row.name, value: row._id });
    filterOptionsTown.value = townOptions.value;
  });
  loadingTowns.value = false;
}

async function getDepartments() {
  filterOptionsDepartment.value = [];
  loadingDepartment.value = true;
  dataDepartaments.value.forEach((row, index) => {
    filterOptionsDepartment.value.push({ label: row, value: row });
  });
  loadingDepartment.value = false;

  if (department.value != null || department.value != undefined) {
    await getTowns();
    disableTown.value = false;
  } else {
    disableTown.value = true;
  }
}

function filterTown(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsTown.value = townOptions.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterDepartment(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsDepartment.value = dataDepartaments.value.filter(
      (v) => v.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

async function cleanForm() {
  name.value = "";
  description.value = "";
  town.value = null;
  department.value = null;
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
</style>
