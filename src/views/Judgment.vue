<template>
  <div class="drop-area">
    <BtnBack route="/home" />
    <HeaderLayout title="Juicios Evaluativos" />

    <!-- pantalla de suelta el archivo -->
    <div 
    v-if="isdragging"
    class="justify-center drop">
      <q-img
        src="/images/uploadFile.png"
        style="width: 150px; height: 150px; opacity: 0.8"
      />
      <div class="text-drop text-weight-bold style-text">
        Suelta Tu Archivo Aquí
      </div>
    </div>

    <div
      class="row justify-center"
      :class="isUpload ? '' : 'q-mb-lg'"
      v-if="!isdragging"
    >
      <div class="col-md-6 col-10 items-center flex">
        <q-file
          v-model="fileJudgment"
          filled
          @click="clearFields"
          label="Cargue el archivo"
          accept=".xlsx, .xls, .xlsm"
        >
          <template v-if="fileJudgment" v-slot:append>
            <q-icon
              name="cancel"
              @click.stop.prevent="clearFields"
              class="cursor-pointer"
            />
          </template>
          <template v-slot:prepend>
            <q-icon name="cloud_upload" />
          </template>
          <template v-slot:after v-if="fileJudgment">
            <q-btn
              class="save_as"
              dense
              icon="cloud_upload"
              round
              @click="uploadFile"
              :disable="!fileJudgment"
            >
              <q-tooltip
                transition-show="flip-right"
                transition-hide="flip-left"
              >
                Cargar archivo
              </q-tooltip>
            </q-btn>
          </template>
        </q-file>
      </div>
      <div class="col-md-2 col-sm-6 col-10 style-text justify-center flex">
        <div class="tooltip" v-if="isUpload">
          <h2 class="open-tooltip style-text">Más información</h2>
          <div class="content-tooltip text-center">
            <span class="h-tooltip">información</span>
            <div class="container-list">
              <q-list>
                <q-item
                  clickable
                  v-ripple
                  v-for="(item, index) in moreInfo"
                  :key="index"
                >
                  <q-item-section class="item-name">{{
                    item.name
                  }}</q-item-section>
                  <q-item-section class="item-value">{{
                    item.value
                  }}</q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-2 col-sm-6 col-10 style-text justify-center flex">
        <div class="items-center flex">
          <q-btn
            v-if="isUpload"
            class="bg-green-9 text-white"
            @click="showDialogStudents()"
            ><span
              class="material-symbols-outlined q-mr-sm"
              style="font-size: 20px"
            >
              add_circle
            </span>
            vista por aprendiz
          </q-btn>
        </div>
      </div>
    </div>

    <!-- TABLE INFO -->
    <div class="row justify-center" v-if="!isdragging">
      <div class="col-10">
        <div class="rounded-borders">
          Filtrar por:
          <q-option-group
            :disable="!isUpload"
            class="justify-around flex"
            name="accepted_genres"
            color="green-9"
            v-model="accepted"
            :options="[
              { label: 'Todos', value: 0 },
              { label: 'En Formación', value: 1 },
              { label: 'Retiro Voluntario', value: 2 },
              { label: 'Cancelado', value: 3 },
              { label: 'Aplazado', value: 4 },
              { label: 'Trasladado', value: 5 },
              { label: 'No Aprobado', value: 6 },
              { label: 'Por Certificar', value: 7 },
              { label: 'Certificado', value: 8 },
            ]"
            type="checkbox"
            inline
            @update:model-value="changeFilter"
          />
        </div>
      </div>
      <div class="col-10 q-my-sm justify-around flex">
        <q-select
          filled
          style="width: 350px"
          outlined
          use-input
          input-debounce="0"
          dense
          :disable="!isUpload"
          v-model="competenceSelected"
          hide-selected
          fill-input
          label="Seleccione la competencia"
          :options="filterCompetences"
          @filter="filterCompe"
          :popup-content-style="{ width: '350px' }"
          @update:model-value="searchOutcome"
        />

        <q-select
          filled
          style="width: 350px"
          outlined
          use-input
          input-debounce="0"
          dense
          :disable="!isUpload"
          v-model="outcomeSelected"
          hide-selected
          fill-input
          label="Seleccione el resultado"
          :options="filterOutcomes"
          @filter="filterOutco"
          :popup-content-style="{ width: '350px' }"
          @update:model-value="searchDataOutcome()"
        />
        <q-btn
          class="bg-green-9 text-white"
          :disable="!isUpload"
          @click="outcomePending(rows)"
          ><span
            class="material-symbols-outlined q-mr-sm"
            style="font-size: 25px"
          >
            text_snippet
          </span>
          <q-tooltip transition-show="flip-right" transition-hide="flip-left">
            Reporte de resultados pendientes
          </q-tooltip>
        </q-btn>
      </div>

      <div class="col-10 q-mb-lg">
        <q-table
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
          <template v-slot:body-cell-competence="props">
            <q-td :props="props">
              <div class="text-long">
                <span v-text="props.value"></span>
                <q-tooltip max-width="350px">
                  {{ props.value }}
                </q-tooltip>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-outcome="props">
            <q-td :props="props">
              <div class="text-long">
                <span v-text="props.value"></span>
                <q-tooltip max-width="350px">
                  {{ props.value }}
                </q-tooltip>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-aproved="props">
            <q-td
              class="dialog-student"
              :props="props"
              @click="
                props.value.studentsAproved.students
                  ? showDialog(props.value, 'APROBADOS')
                  : null
              "
            >
              <span>
                {{
                  props.value.studentsAproved.students
                    ? counterStudents(props.value.studentsAproved)
                    : 0
                }}
              </span>
            </q-td>
          </template>
          <template v-slot:body-cell-evaluate="props">
            <q-td
              class="dialog-student"
              :props="props"
              @click="
                props.value.studentsEvaluate.students
                  ? showDialog(props.value, 'POR EVALUAR')
                  : null
              "
            >
              <div class="text-long">
                <span>
                  {{
                    props.value.studentsEvaluate.students
                      ? counterStudents(props.value.studentsEvaluate)
                      : 0
                  }}
                </span>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-instructor="props">
            <q-td :props="props">
              <div class="text-long">
                <span v-text="props.value"></span>
                <q-tooltip max-width="350px">
                  {{ props.value }}
                </q-tooltip>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-instructoreval="props">
            <q-td :props="props">
              <div class="text-long">
                <span v-text="props.value"></span>
                <q-tooltip max-width="350px">
                  {{ props.value }}
                </q-tooltip>
              </div>
            </q-td>
          </template>

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
    </div>
  </div>

  <q-dialog v-model="showStudents" full-height>
    <q-spinner color="primary" size="3em" v-if="loadingStudents" />
    <q-card style="width: 700px; max-width: 80vw" v-else>
      <dialogAprovedEvaluate
        :closeDialog="closeDialog"
        :fiche="moreInfo[1].value"
        :competence="competence"
        :outcome="outcome"
        :listStudents="listStudents"
      />
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="DialogStudents"
    persistent
    :maximized="maximizedToggle"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <dialogStudents
      :closeDialog="closeDialogStudents"
      :dataStudents="dataStudents"
      :listStudents="selectStudents"
    />
  </q-dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { post } from "../services/api.js";
import { outcomePending } from "../services/excelExportJudgment.js";
import dialogAprovedEvaluate from "../components/Judgment/dialogAprovedEvaluate.vue";
import dialogStudents from "../components/Judgment/dialogStudents.vue";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

let isUpload = ref(false);
let isdragging = ref(false);
let fileJudgment = ref(null);
let moreInfo = ref([]);
let students = ref([]);
let oldSelected = ref([0, 1, 2, 3, 4, 5, 6, 7, 8]);
let accepted = ref([0, 1, 2, 3, 4, 5, 6, 7, 8]);
let showStudents = ref(false);
let DialogStudents = ref(false);
let listStudents = ref([]);
let dataStudents = ref();
let selectStudents = ref();
let competence = ref("");
let outcome = ref("");
let loadingStudents = ref(true);
let rows = ref([]);
let allData = ref([]);
let competenceSelected = ref({
  label: "Todas",
  value: 0,
});
let filterCompetences = ref([]);
let outcomeSelected = ref({
  label: "Todos",
  value: 0,
});
let filterOutcomes = ref([]);

let maximizedToggle = ref(true);

let columns = ref([
  {
    name: "competence",
    label: "COMPETENCIA",
    field: "competence",
    align: "center",
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "outcome",
    label: "RESULTADO",
    field: "outcome",
    align: "center",
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "aproved",
    label: "APROBADOS",
    field: (row) => row,
    align: "center",
    sortable: true,
    sort: (a, b) => {
      if (a.studentsAproved.students == null) {
        return 1;
      } else if (b.studentsAproved.students == null) {
        return -1;
      } else {
        return (
          a.studentsAproved.students.length - b.studentsAproved.students.length
        );
      }
    },
  },
  {
    name: "evaluate",
    label: "POR EVALUAR",
    field: (row) => row,
    align: "center",
    sortable: true,
    sort: (a, b) => {
      if (a.studentsEvaluate.students == null) {
        return 1;
      } else if (b.studentsEvaluate.students == null) {
        return -1;
      } else {
        return (
          a.studentsEvaluate.students.length -
          b.studentsEvaluate.students.length
        );
      }
    },
  },
  {
    name: "instructor",
    label: "INSTRUCTOR EVALUADOR SOFIA PLUS",
    field: "instructor",
    align: "center",
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
      if (a.fstart == null) {
        return 1;
      } else if (b.fstart == null) {
        return -1;
      } else {
        return new Date(a.fstart) - new Date(b.fstart);
      }
    },
  },
  {
    name: "fend",
    label: "FECHA FINAL",
    field: (row) => row,
    align: "center",
    sortable: true,
    sort: (a, b) => {
      if (a.fend == null) {
        return 1;
      } else if (b.fend == null) {
        return -1;
      } else {
        return new Date(a.fend) - new Date(b.fend);
      }
    },
  },
]);

const closeDialog = () => {
  showStudents.value = false;
};

const closeDialogStudents = () => {
  DialogStudents.value = false;
};

const onDragOver = (e) => {
  e.preventDefault();
  isdragging.value = true;
};

const onDragLeave = (e) => {
  e.preventDefault();
  isdragging.value = false;
};

const onDrop = (e) => {
  e.preventDefault();
  isdragging.value = false;
  fileJudgment.value = e.dataTransfer.files[0];

  if (!fileJudgment.value) {
    fileJudgment.value = null;
  } else if (
    fileJudgment.value.name.split(".").pop() != "xlsx" &&
    fileJudgment.value.name.split(".").pop() != "xls" &&
    fileJudgment.value.name.split(".").pop() != "xlsm"
  ) {
    $q.notify({
      message: "El archivo debe ser de tipo .xlsx, .xls o .xlsm",
      type: "negative",
      position: "top",
    });
    fileJudgment.value = null;
  } else {
    uploadFile();
  }
};

onMounted(() => {
  const dropArea = document.querySelector(".drop-area");

  dropArea.addEventListener("dragover", onDragOver);
  dropArea.addEventListener("dragleave", onDragLeave);
  dropArea.addEventListener("drop", onDrop);

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    isdragging.value = true;
  });

  document.addEventListener("dragleave", (e) => {
    e.preventDefault();
    isdragging.value = false;
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
  });
});

function clearFields() {
  fileJudgment.value = null;
  isUpload.value = false;
  moreInfo.value = [];
  students.value = [];
  oldSelected.value = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  accepted.value = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  showStudents.value = false;
  listStudents.value = [];
  competence.value = "";
  outcome.value = "";
  loadingStudents.value = true;
  rows.value = [];
  allData.value = [];
  competenceSelected.value = {
    label: "Todas",
    value: 0,
  };
  filterCompetences.value = [];
}

function showDialogStudents() {
  DialogStudents.value = true;
}

function showDialog(studentsToShow, type) {
  loadingStudents.value = true;
  showStudents.value = false;
  showStudents.value = true;

  if (type == "APROBADOS") {
    listStudents.value = listStudentsDialog(
      studentsToShow.studentsAproved.students
    );
  } else {
    listStudents.value = listStudentsDialog(
      studentsToShow.studentsEvaluate.students
    );
  }

  competence.value = studentsToShow.competence;
  outcome.value = studentsToShow.outcome;

  loadingStudents.value = false;
}

function changeFilter() {
  if (!oldSelected.value.includes(0) && accepted.value.includes(0)) {
    accepted.value = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  } else if (oldSelected.value.includes(0) && !accepted.value.includes(0)) {
    accepted.value = [];
  } else {
    //buscar el valor que se elimino del array
    let value = oldSelected.value.filter(
      (item) => !accepted.value.includes(item)
    );
    //si el valor es 0, entonces se debe eliminar el resto de valores
    if (value[0] == 0) {
      accepted.value = [];
    } else {
      //si el valor es diferente de 0, entonces se debe eliminar el valor 0
      accepted.value = accepted.value.filter((item) => item != 0);
    }
  }

  oldSelected.value = accepted.value;
}

function counterStudents(students) {
  let total = 0;
  if (accepted.value.length > 0) {
    if (accepted.value.includes(0)) {
      total =
        students.formacion +
        students.retirado +
        students.cancelado +
        students.aplazado +
        students.traslado +
        students.noAprobado +
        students.porCertificar +
        students.certificado;
    } else {
      if (accepted.value.includes(1)) {
        total += students.formacion;
      }
      if (accepted.value.includes(2)) {
        total += students.retirado;
      }
      if (accepted.value.includes(3)) {
        total += students.cancelado;
      }
      if (accepted.value.includes(4)) {
        total += students.aplazado;
      }
      if (accepted.value.includes(5)) {
        total += students.traslado;
      }
      if (accepted.value.includes(6)) {
        total += students.noAprobado;
      }
      if (accepted.value.includes(7)) {
        total += students.porCertificar;
      }
      if (accepted.value.includes(8)) {
        total += students.certificado;
      }
    }
  }

  return total;
}

const listStudentsDialog = (student) => {
  students.value = [];
  //filtrar los estudiantes cuyo estado este en el array accepted
  if (accepted.value.length > 0) {
    if (accepted.value.includes(0)) {
      students.value = student;
    } else {
      students.value = student.filter((item) => {
        if (accepted.value.includes(1) && item.status == "EN FORMACION") {
          return item;
        } else if (
          accepted.value.includes(2) &&
          item.status == "RETIRO VOLUNTARIO"
        ) {
          return item;
        } else if (accepted.value.includes(3) && item.status == "CANCELADO") {
          return item;
        } else if (accepted.value.includes(4) && item.status == "APLAZADO") {
          return item;
        } else if (accepted.value.includes(5) && item.status == "TRASLADADO") {
          return item;
        } else if (accepted.value.includes(6) && item.status == "NO APROBADO") {
          return item;
        } else if (
          accepted.value.includes(7) &&
          item.status == "POR CERTIFICAR"
        ) {
          return item;
        } else if (accepted.value.includes(8) && item.status == "CERTIFICADO") {
          return item;
        }
      });
    }
  }
  return students.value;
};

//upload file
async function uploadFile() {
  const formData = new FormData();

  formData.append("file", fileJudgment.value);

  $q.loading.show({
    message: "Cargando información al sistema, por favor no cierre la ventana.",
  });

  const response = await post("/uploads/uploadexceljudgment", formData);

  $q.loading.hide();
  moreInfo.value = response.moreInfo;
  allData.value = response.dataGroup;
  rows.value = response.dataGroup;
  selectStudents.value = response.listStudents;
  dataStudents.value = response.dataForStudents;

  //agregar las competencias a las options, la competencia solo puede aparecer una vez
  filterCompetences.value = [
    {
      label: "Todas",
      value: 0,
    },
  ];

  response.dataGroup.forEach((item) => {
    if (
      !filterCompetences.value.some(
        (competence) => competence.value == item.codeCompetence
      )
    ) {
      filterCompetences.value.push({
        label: item.competence,
        value: item.codeCompetence,
      });
    }
  });

  isUpload.value = true;
}

function searchOutcome() {
  outcomeSelected.value = {
    label: "Todos",
    value: 0,
  };

  if (competenceSelected.value.value == 0) {
    //si la competencia seleccionada es todas, entonces mostrar todos los resultados
    rows.value = allData.value;
  } else {
    //solo dejar en la tabla los resultados que tengan la competencia seleccionada
    rows.value = allData.value.filter(
      (item) => item.codeCompetence == competenceSelected.value.value
    );

    //buscar todos los resultados que tengan la competencia seleccionada
    filterOutcomes.value = [
      {
        label: "Todos",
        value: 0,
      },
    ];

    allData.value.forEach((item) => {
      //seleciionar solo los resultados cuya competencia sea la seleccionada
      if (item.codeCompetence == competenceSelected.value.value) {
        //agregar los resultados a las options, el resultado solo puede aparecer una vez

        filterOutcomes.value.push({
          label: item.outcome,
          value: item.codeOutcome,
        });
      }
    });
  }
}

function searchDataOutcome() {
  if (outcomeSelected.value.value == 0) {
    //si el resultado seleccionado es todos, entonces mostrar todos los resultados
    rows.value = allData.value.filter(
      (item) => item.codeCompetence == competenceSelected.value.value
    );
  } else {
    //solo dejar en la tabla los resultados que tengan la competencia y el resultado seleccionado
    rows.value = allData.value.filter(
      (item) =>
        item.codeCompetence == competenceSelected.value.value &&
        item.codeOutcome == outcomeSelected.value.value
    );
  }
}

function filterCompe(val, update, abort) {
  if (val == "") {
    update(() => {
      filterCompetences.value = [
        {
          label: "Todas",
          value: 0,
        },
      ];
      allData.value.forEach((item) => {
        if (
          !filterCompetences.value.some(
            (competence) => competence.value == item.codeCompetence
          )
        ) {
          filterCompetences.value.push({
            label: item.competence,
            value: item.codeCompetence,
          });
        }
      });
    });
  } else {
    update(() => {
      const needle = val.toLocaleLowerCase();
      filterCompetences.value = filterCompetences.value.filter((v) =>
        v.label.toLocaleLowerCase().includes(needle)
      );
    });
  }
}

function filterOutco(val, update, abort) {
  if (val == "") {
    update(() => {
      filterOutcomes.value = [
        {
          label: "Todos",
          value: 0,
        },
      ];

      allData.value.forEach((item) => {
        //seleciionar solo los resultados cuya competencia sea la seleccionada
        if (item.codeCompetence == competenceSelected.value.value) {
          //agregar los resultados a las options, el resultado solo puede aparecer una vez

          filterOutcomes.value.push({
            label: item.outcome,
            value: item.codeOutcome,
          });
        }
      });
    });
  } else {
    update(() => {
      const needle = val.toLocaleLowerCase();
      filterOutcomes.value = filterOutcomes.value.filter((v) =>
        v.label.toLocaleLowerCase().includes(needle)
      );
    });
  }
}
</script>

<style scoped>
.drop {
  border: 5px dashed #008626;
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  -ms-border-radius: 5px;
  -o-border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 22vh 30vw;
  background: rgba(198, 238, 192, 0.831);
  opacity: 0.8;
}
.text-drop {
  font-size: 18px;
  color: #3b3b3b;
  font-weight: bold;
}

.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
.header {
  background-color: var(--color_header);
}

.titleList {
  font-size: 16px;
  font-weight: bold;
}

.dialog-student {
  cursor: pointer;
  font-weight: 600;
}

.text-more {
  /* texto conoce más aqui */
  font-size: 16px;
  text-decoration: underline;
  cursor: pointer;
}
.container-list {
  /* contenedor de la lista */
  max-height: 300px;
  overflow-y: auto; /* Agrega desplazamiento vertical al contenido */
  max-height: 300px; /* Limita la altura máxima del tooltip */
}

.item-value {
  /* valor de cada item */
  color: rgb(148, 147, 147);
}

.text-long {
  max-width: 350px;
  white-space: nowrap;
  text-overflow: ellipsis !important;
  overflow: hidden;
}

.table-judgment {
  z-index: 0;
  position: relative;
}

.open-tooltip-table {
  font-size: 12px;
  color: black;
  text-decoration: underline;
  cursor: pointer;
  font-weight: normal;
}

.content-tooltip-table {
  visibility: hidden;
  width: 800px;
  max-height: 300px;
  color: #fff;
  text-align: left;
  border-radius: 5px;
  padding: 5px;
  position: absolute;
  z-index: 100;
  top: 150%; /* Cambiar a -100% para que aparezca arriba del tooltip */
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s, visibility 0.3s;
}

/* Estilos para motores Webkit y blink (Chrome, Safari, Opera... )*/

.container-list::-webkit-scrollbar {
  -webkit-appearance: none;
}

.container-list::-webkit-scrollbar:vertical {
  width: 10px;
}

.container-list::-webkit-scrollbar-button:increment,
.container-list::-webkit-scrollbar-button {
  display: none;
}

.container-list::-webkit-scrollbar:horizontal {
  height: 10px;
}

.container-list::-webkit-scrollbar-thumb {
  background-color: #797979;
  border-radius: 10px;
  border: 2px solid #f1f2f3;
}

.container-list::-webkit-scrollbar-track {
  border-radius: 10px;
}
</style>
