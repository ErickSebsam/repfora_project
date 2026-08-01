<template>
  <div>
    <BtnBack route="/home" />

    <HeaderLayout title="Programas" />

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
          v-model="programSelected"
          hide-selected
          fill-input
          label="Seleccione el programa"
          :options="filterOptions"
          @filter="filterFn"
          :popup-content-style="{ width: '300px' }"
          @update:model-value="searchProgram()"
        >
          <template v-slot:append>
            <q-icon
              v-if="programSelected.length !== 0"
              class="cursor-pointer"
              name="clear"
              @click.stop.prevent="programSelected = []"
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
          class="my-sticky-header-table"
          flat
          bordered
          no-data-label="Sin registros aún"
          :rows="programSelected.length == 0 ? rows : rowsFilter"
          :columns="columns"
          row-key="index"
          :rows-per-page-options="[0]"
          :pagination="{
            rowsPerPage: 0,
          }"
        >
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip
                  v-if="props.value.trim().length > 35"
                  max-width="350px"
                >
                  {{ props.row.name }}
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
          <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold q-my-sm">
            {{
              edit ? "MODIFIFCA LA INFORMACIÓN" : "DILIGENCIA LA INFORMACIÓN"
            }}
          </h5>
        </q-card-section>
        <div class="q-pa-md">
          <q-form
            @submit.prevent.stop="edit ? putPrograms() : postPrograms()"
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
                  <span class="material-symbols-outlined"> article </span>
                </template>
              </q-input>

              <q-input
                filled
                type="number"
                v-model="code"
                label="Código"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                  (val) => val > 0 || 'El campo debe ser mayor a 0',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> pin </span>
                </template>
              </q-input>

              <q-input
                filled
                type="number"
                v-model="version"
                label="Versión"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                  (val) => val > 0 || 'El campo debe ser mayor a 0',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> repeat_one </span>
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
import { useQuasar } from "quasar";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

let prompt = ref(false);
let edit = ref(false);
let code = ref();
let name = ref();
let index = ref();
let version = ref();
let loading = ref(false);

let programSelected = ref([]);
let filterOptions = ref([]);
let rowsFilter = ref([]);
let programOptions = [];

let columns = ref([
  {
    name: "index",
    label: "N°",
    field: "index",
    align: "center",
  },
  {
    name: "code",
    label: "CÓDIGO",
    field: "code",
    align: "center",
    sortable: true,
  },
  {
    name: "name",
    label: "NOMBRE",
    field: "name",
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "version",
    label: "VERSIÓN",
    field: "version",
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
  { name: "options", label: "OPCIONES", align: "center" },
]);

let rows = ref([]);

onBeforeMount(async () => {
  await getPrograms();
});

// get
async function getPrograms() {
  try {
    const data = await get("/programs");
    rows.value = data;
    programOptions = [];
    rows.value.forEach((row, index) => {
      row.index = index + 1;
      programOptions.push({
        label: `${row.code} v${row.version} : ${row.name} `,
        value: row._id,
      });
      filterOptions.value = programOptions;
    });
  } catch (error) {}
}

async function postPrograms() {
  loading.value = true;
  try {
    await post("/programs/register", {
      code: code.value,
      name: name.value,
      version: version.value,
    });
    notifySuccessRequest("Programa registrado correctamente");
    prompt.value = false;
    edit.value = false;
    cleanForm();
    await getPrograms();
  } catch (error) {}
  loading.value = false;
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    try {
      await put(`/programs/inactive/${data._id}`, null);
      notifySuccessRequest("Programa desactivado correctamente");
    } catch (error) {}

    await getPrograms();
  } else {
    try {
      await put(`/programs/active/${data._id}`, null);
      notifySuccessRequest("Programa activado correctamente");
    } catch (error) {}

    await getPrograms();
  }
  searchProgram();
}

function showInfo(data) {
  index.value = data._id;
  code.value = data.code;
  name.value = data.name;
  version.value = data.version;
  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function putPrograms() {
  loading.value = true;
  try {
    await put("/programs/update/" + index.value, {
      code: code.value,
      name: name.value,
      version: version.value,
    });
    notifySuccessRequest("Programa actualizado correctamente");
    cleanForm();
    edit.value = false;
    prompt.value = false;
    await getPrograms();
    searchProgram();
  } catch (error) {}

  loading.value = false;
}

async function cleanForm() {
  code.value = "";
  name.value = "";
  version.value = "";
}

function filterFn(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptions.value = programOptions.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function searchProgram() {
  if (programSelected.value.length === 0) {
    rowsFilter.value = rows.value;
  } else {
    rowsFilter.value = [];
    rowsFilter.value = rows.value.filter(
      (element) => element._id == programSelected.value.value
    );
  }
}

onBeforeMount(async () => {
  await getPrograms();
});
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
</style>
