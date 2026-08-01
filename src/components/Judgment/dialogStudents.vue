<template>
  <q-card>
    <q-bar class="bg-green-9">
      <q-space />
      <q-btn
        dense
        round
        icon="close"
        color="white"
        class="text-green-9"
        @click="props.closeDialog"
      >
        <q-tooltip class="bg-white text-green-9">Cerrar</q-tooltip>
      </q-btn>
    </q-bar>

    <q-card-section class="justify-center flex">
      <div class="text-title text-black">Filtro Por Aprendices</div>
    </q-card-section>

    <q-card-section
      class="row text-black justify-center text-center items-center"
    >
      <div class="col-md-1 col-2 text-bold q-pt-md">Aprendiz:</div>
      <div class="col-md-4 col-10 q-pt-md q-pr-xl">
        <q-select
          filled
          outlined
          use-input
          dense
          v-model="selectedStudent"
          hide-selected
          fill-input
          label="Seleccione el aprendiz"
          :options="optionsFilter"
          @filter="filterStudents"
          :popup-content-style="{ width: '300px' }"
          @update:model-value="selectData()"
          class="q-pr-xl"
        >
          <template v-slot:append>
            <q-icon
              class="cursor-pointer"
              name="clear"
              @click="selectedStudent = ''"
            />
          </template>
        </q-select>
      </div>
      <div class="col-md-1 col-2 text-bold q-pt-md">Juicio:</div>
      <div class="col-md-2 col-10 q-pt-md">
        <q-select
          filled
          outlined
          use-input
          dense
          v-model="selectedJudgment"
          hide-selected
          fill-input
          label="Seleccione el juicio"
          :options="optionsJudgment"
          :popup-content-style="{ width: '300px' }"
          @update:model-value="selectData()"
          class="q-pr-md"
        >
          <template v-slot:append>
            <q-icon
              class="cursor-pointer"
              name="clear"
              @click="selectedJudgment = ''"
            />
          </template>
        </q-select>
      </div>
    </q-card-section>
    <q-card-section class="justify-center row">
      <div class="col-10">
        <q-table
          class="my-sticky-header-table text-center"
          flat
          bordered
          :rows="rows"
          :columns="columns"
          :rows-per-page-options="[0]"
          hide-bottom
          separator="cell"
          style="height: 66vh !important"
        >
          <template v-slot:body-cell-fstart="props">
            <q-td
              :props="props"
              :style="{
                'background-color': props.value.color
                  ? props.value.color
                  : 'white',
              }"
            >
              <div>
                <span>
                  {{
                    props.value.fstart ? props.value.fstart : "NO ENCONTRADA"
                  }}
                </span>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-fend="props">
            <q-td
              :props="props"
              :style="{
                'background-color': props.value.color
                  ? props.value.color
                  : 'white',
              }"
            >
              <div>
                <span>
                  {{ props.value.fend ? props.value.fend : "NO ENCONTRADA" }}
                </span>
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, defineProps, watch, onBeforeMount } from "vue";

const props = defineProps({
  closeDialog: Function,
  dataStudents: Array,
  listStudents: Array,
});

const optionsJudgment = ref([
  { label: "Aprobado", value: 0 },
  { label: "Por Evaluar", value: 1 },
  { label: "Aprobado - Por Evaluar", value: 2 },
]);

let selectedStudent = ref();
let selectedJudgment = ref({ label: "Por Evaluar", value: 1 });
let optionsFilter = ref([]);
let optionsStudents = ref([]);
let dataForTable = ref([]);
let rows = ref([]);
let columns = ref([
  {
    name: "competence",
    label: "COMPETENCIA",
    align: "center",
    field: "competence",
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "outcome",
    label: "RESULTADO",
    align: "center",
    field: "outcome",
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "status",
    label: "ESTADO",
    align: "center",
    field: "status",
    sortable: true,
  },
  {
    name: "judgment",
    label: "JUICIO",
    align: "center",
    field: "judgment",
    sortable: true,
  },
  {
    name: "instructor",
    label: "INSTRUCTOR EVALUADOR SOFIA PLUS",
    align: "center",
    field: "instructor",
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "instructoreval",
    label: "INSTRUCTOR ASIGNADO",
    field: "instructorEval",
    align: "center",
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "fstart",
    label: "FECHA INICIAL",
    field: (row) => row,
    align: "center",
    sortable: true,
    sort: (a, b) => {
      if (a.fstart == null) return -1;
      if (b.fstart == null) return 1;
      return a.fstart > b.fstart ? 1 : -1;
    },
  },
  {
    name: "fend",
    label: "FECHA FINAL",
    field: (row) => row,
    align: "center",
    sortable: true,
    sort: (a, b) => {
      if (a.fend == null) return -1;
      if (b.fend == null) return 1;
      return a.fend > b.fend ? 1 : -1;
    },
  },
]);

onBeforeMount(() => {
  dataForTable.value = props.dataStudents;
  optionsStudents.value = props.listStudents;
});

function selectData() {
  if (selectedStudent.value == null) {
    rows.value = [];
    return;
  }

  if (selectedJudgment.value == null || selectedJudgment.value.value == 2) {
    //buscar el aprendiz en el array de aprendices
    let student = dataForTable.value.find(
      (element) => element.numdocument == selectedStudent.value.value
    );
    rows.value = student.data.porEvaluar.concat(student.data.aprobado);
  } else if (selectedJudgment.value.value == 0) {
    //buscar el aprendiz en el array de aprendices
    let student = dataForTable.value.find(
      (element) => element.numdocument == selectedStudent.value.value
    );
    rows.value = student.data.aprobado;
  } else {
    //buscar el aprendiz en el array de aprendices
    let student = dataForTable.value.find(
      (element) => element.numdocument == selectedStudent.value.value
    );
    rows.value = student.data.porEvaluar;
  }
}

function filterStudents(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    optionsFilter.value = optionsStudents.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}
</script>

<style scoped>
.text-title {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>