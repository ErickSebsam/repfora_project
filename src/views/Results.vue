<template>
  <div>
    <BtnBack route="/home" />
    <HeaderLayout title="Resultados" />

    <div class="row justify-evenly">
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
        class="col-sm-3 col-md-3 col-10"
        :class="$q.screen.width < 600 ? 'q-mt-md' : ''"
      >
        <q-select
          :label="!isLoadingProgram ? 'Programa' : 'Cargando...'"
          v-model="programSelected"
          :options="filterOptions"
          :disable="isLoadingProgram"
          dense
          filled
          hide-selected
          outlined
          options-dense
          use-input
          fill-input
          input-debounce="0"
          :popup-content-style="{ width: '300px' }"
          @filter="filterProgram"
          @update:model-value="getCompetence()"
        />
      </div>

      <div
        class="col-sm-3 col-md-3 col-10"
        :class="$q.screen.width < 600 ? 'q-mt-md' : ''"
      >
        <q-select
          :label="!isLoadingCompetence ? 'Competencia' : 'Cargando...'"
          v-model="competenceSelected"
          type="text"
          dense
          filled
          hide-selected
          outlined
          options-dense
          use-input
          fill-input
          :disable="isLoadingCompetence"
          :options="filterOptionsComp"
          input-debounce="0"
          @filter="filterCompetences"
          :popup-content-style="{ width: '300px' }"
          @update:model-value="getResults()"
        />
      </div>

      <div
        class="col-sm-1 col-12 justify-center flex q-mt-md"
        v-if="isLoadingResults"
      >
        <q-spinner color="green-9" size="2em" :thickness="8" />
      </div>
    </div>
    <!-- TABLE INFO -->
    <div class="row q-mt-md">
      <div class="col-1"></div>
      <div class="col-10 q-mb-lg">
        <q-table
          flat
          bordered
          :rows="rows"
          :columns="columns"
          row-key="index"
          class="my-table my-sticky-header-table"
          no-data-label="Por favor seleccione un programa y una competencia"
          :rows-per-page-options="[0]"
        >
          <template v-slot:body-cell-competence="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip v-if="props.value.length > 38" max-width="350px">
                  {{ props.row.namecompetence }}
                </q-tooltip>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-results="props">
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
            @submit.prevent.stop="edit ? putResults() : postResults()"
            novalidate
          >
            <div>
              <q-select
                v-if="!edit"
                type="text"
                filled
                v-model="program"
                use-input
                options-dense
                :popup-content-style="{ width: '300px' }"
                :options="filterOptions"
                @filter="filterProgram"
                label="Programa"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
                @update:model-value="getCompetence()"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> fact_check </span>
                </template>
              </q-select>

              <q-select
                v-if="!edit"
                :label="!isLoadingCom ? 'Competencia' : 'Cargando...'"
                v-model="competence"
                type="text"
                options-dense
                input-debounce="0"
                filled
                :popup-content-style="{ width: '300px' }"
                :disable="isLoadingCom"
                :options="filterCompetence"
                lazy-rules
                use-input
                @filter="filterCompe"
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined">
                    space_dashboard
                  </span>
                </template>
              </q-select>

              <q-select
                v-if="edit"
                :label="!isLoadingCom ? 'Competencia' : 'Cargando...'"
                v-model="competence"
                type="text"
                options-dense
                input-debounce="0"
                filled
                :options="filterOptionsComp"
                lazy-rules
                use-input
                :popup-content-style="{ width: '300px' }"
                @filter="filterCompetences"
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
                @update:model-value="getResults()"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined">
                    space_dashboard
                  </span>
                </template>
              </q-select>

              <template v-if="!edit">
                <div
                  class="row q-pa-sm"
                  v-for="(input, index) in results"
                  :key="index"
                >
                  <div class="col-10">
                    <q-input
                      label="Código Resultado"
                      v-model="input.code"
                      filled
                      class="q-pa-md"
                      :rules="[
                        (val) =>
                          (val && val.trim().length > 0) ||
                          'El campo es requerido',
                      ]"
                    >
                    </q-input>

                    <q-input
                      type="text"
                      filled
                      class="q-pa-md"
                      v-model="input.name"
                      label="Resultado"
                      lazy-rules
                      :rules="[
                        (val) =>
                          (val && val.trim().length > 0) ||
                          'El campo es requerido',
                      ]"
                    >
                    </q-input>
                  </div>

                  <div class="col-2 flex flex-center">
                    <q-btn
                      round
                      dense
                      style="height: 20px"
                      flat
                      icon="delete"
                      @click="removeInput(index)"
                    />

                    <q-btn
                      v-show="index == results.length - 1"
                      round
                      dense
                      flat
                      style="height: 20px"
                      icon="add"
                      @click="addInput()"
                    />
                  </div>
                </div>
              </template>

              <q-input
                v-if="edit"
                label="Código Resultado"
                v-model="code"
                lazy-rules
                filled
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                ]"
              >
              </q-input>

              <q-input
                v-if="edit"
                filled
                type="text"
                v-model="result"
                label="Resultado"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> checklist_rtl </span>
                </template>
              </q-input>

              <div class="justify-center flex">
                <q-btn
                  icon="save_as"
                  label="GUARDAR"
                  type="submit"
                  class="style-btn q-mt-md q-mb-sm q-mx-sm"
                  :loading="loading"
                >
                  <template v-slot:loading>
                    <q-spinner-oval color="white" size="1em" />
                  </template>
                </q-btn>
                <q-btn
                  type="button"
                  icon="close"
                  v-close-popup
                  class="q-mt-md q-mb-sm q-mx-sm"
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
import { useQuasar } from "quasar";
import { get, post, put } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

let prompt = ref(false);
let edit = ref(false);

let loading = ref(false);
let competence = ref("");
let program = ref("");
let results = ref([{}]);
let isLoadingCom = ref(true);
let filterCompetence = ref([]);
let optionsCompetence = [];

let result = ref("");
let resultEditId = "";
let index = ref();
let code = ref("");

let programSelected = ref();
let isLoadingProgram = ref(true);
let optionsProgram = [];
let filterOptions = ref([]);

let optionsCompetences = [];
let competenceSelected = ref("");
let filterOptionsComp = ref([]);

let isLoadingCompetence = ref(true);
let isLoadingResults = ref(false);

let columns = ref([
  {
    name: "index",
    label: "N°",
    field: "index",
    align: "center",
  },
  {
    name: "code",
    label: "Código",
    align: "center",
    field: (row) => row.outcomes.code,
    sortable: true,
  },
  {
    name: "competence",
    label: "COMPETENCIA",
    field: (row) => row.namecompetence,
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "results",
    label: "RESULTADOS",
    field: (row) => row.outcomes.outcomes,
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
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
  await getPrograms();
});

async function cleanForm() {
  results.value = [{}];
  program.value = "";
  competence.value = null;

  result.value = "";
  resultEditId = "";
  index.value = "";
  code.value = "";
}

async function getPrograms() {
  isLoadingProgram.value = true;
  const res = await get("/programs?status=0");
  res.forEach((row, index) => {
    optionsProgram.push({
      label: `${row.code} v${row.version} - ${row.name}`,
      value: row._id,
    });
    filterOptions.value = optionsProgram;
  });
  isLoadingProgram.value = false;
}

function filterProgram(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptions.value = optionsProgram.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

async function getCompetence() {
  if (prompt.value == true) {
    optionsCompetence = [];

    isLoadingCom.value = true;

    competence.value = null;

    const data = await get(`/competences/program/${program.value.value}`);

    data.forEach((row, index) => {
      optionsCompetence.push({
        label: `${row.number} - ${row.name}`,
        value: row._id,
      });
    });

    filterCompetence.value = optionsCompetence;

    isLoadingCom.value = false;
  } else {
    optionsCompetences = [];

    isLoadingCompetence.value = true;

    competenceSelected.value = null;

    const data = await get(
      `/competences/program/${programSelected.value.value}`
    );

    data.forEach((row, index) => {
      optionsCompetences.push({
        label: `${row.number} - ${row.name}`,
        value: row._id,
        code: row.number,
      });
    });

    filterOptionsComp.value = optionsCompetences;

    isLoadingCompetence.value = false;
  }
}

function filterCompetences(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsComp.value = optionsCompetences.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterCompe(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterCompetence.value = optionsCompetence.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

// get
async function getResults() {
  if (competenceSelected.value.length !== 0) {
    isLoadingResults.value = true;

    const { value } = competenceSelected.value;
    const data = await get(`/outcomes/competence/${value}`);

    if (data) {
      rows.value = data;
      let resultsConcat = [];
      let index = 1;

      data.forEach((e) => {
        e.outcomes.forEach((out) => {
          resultsConcat.push({
            index,
            idoutcome: out._id,
            competence: e.competence,
            namecompetence: e.namecompetence,
            outcomes: {
              code: out.code,
              outcomes: out.outcomes,
            },
            status: out.status,
          });
          index++;
        });
      });

      rows.value = resultsConcat;
    } else {
    }

    isLoadingResults.value = false;
  }
}

async function postResults() {
  loading.value = true;

  try {
    const result = await post("/outcomes/register", {
      outcomes: results.value,
      competence: competence.value.value,
    });
    notifySuccessRequest(result.msg);
    prompt.value = false;
    edit.value = false;
    cleanForm();
    await getResults();
  } catch (error) {}
  loading.value = false;
}

function addInput() {
  results.value.push({});
}

const removeInput = (index) => {
  if (results.value.length === 1) {
    results.value = [{}];
    return;
  }
  results.value.splice(index, 1);
};

function showInfo(data) {
  index.value = data._id;
  code.value = data.outcomes.code;
  result.value = data.outcomes.outcomes;
  resultEditId = data.idoutcome;
  competence.value = {
    label: `${competenceSelected.value.code} - ${data.namecompetence}`,
    value: data.competence,
  };
  program.value = {
    label: data.namecompetence,
    value: data.competence,
  };
  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function putResults() {
  loading.value = true;

  try {
    await put("/outcomes/update", {
      outcome: resultEditId,
      name: result.value,
      code: code.value,
      competence: competence.value.value,
    });
    notifySuccessRequest("Resultado actualizado correctmante");
    edit.value = false;
    prompt.value = false;
    cleanForm();
    await getResults();
  } catch (error) {}

  loading.value = false;
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    try {
      await put(`/outcomes/inactive/${data.idoutcome}`, null);
      notifySuccessRequest("Resultado desactivado correctamente");
    } catch (error) {}
    await getResults();
  } else {
    try {
      await put(`/outcomes/active/${data.idoutcome}`, null);
      notifySuccessRequest("Resultado activado correctamente");
    } catch (error) {}
    await getResults();
  }
}
</script>

<style>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
.my-table .q-table__middle tbody tr th,
.my-table .q-table__middle tbody tr td {
  white-space: normal;
  overflow: visible;
  text-overflow: initial !important; /* text-overflow: ellipsis; para cortar el texto */
}
.q-table__bottom--nodata {
  color: red;
}
</style>
