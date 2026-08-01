<template>
  <div>
    <BtnBack route="/news" />
    <HeaderLayout title="Reporte de Novedades" />
    <div class="row justify-center flex">
      <q-form
        ref="myForm"
        @submit.prevent.stop="generateReport()"
        class="col-11 col-sm-7 col-md-3 row flex"
      >
        <div class="col-12">
          <q-select
            filled
            class="full-width q-px-md"
            type="text"
            v-model="form.typeReport"
            :options="optionsTpReport"
            options-dense
            label="Tipo de reporte"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.toString().trim().length > 0) ||
                'El campo es requerido',
            ]"
            @update:model-value="clearInfoForm()"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> list </span>
            </template>
          </q-select>
        </div>

        <div class="col-12" v-if="form.typeReport.value === 'TIPO'">
          <q-select
            filled
            class="full-width q-px-md"
            type="text"
            v-model="form.tpNew"
            :options="optionsTpNew"
            options-dense
            label="Tipo de novedad"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.toString().trim().length > 0) ||
                'El campo es requerido',
            ]"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> list </span>
            </template>
          </q-select>
        </div>

        <div class="col-12" v-if="form.typeReport.value === 'ESTADO'">
          <q-select
            filled
            class="full-width q-px-md"
            type="text"
            v-model="form.stateNew"
            :options="optionsStateNew"
            options-dense
            label="Estado de la novedad"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.toString().trim().length > 0) ||
                'El campo es requerido',
            ]"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> list </span>
            </template>
          </q-select>
        </div>
        <div
          class="col-12"
          v-if="
            form.typeReport.value === 'TIPO' &&
            form.tpNew?.value !== 'PLAN DE MEJORAMIENTO'
          "
        >
          <q-select
            filled
            class="full-width q-px-md"
            type="text"
            :disable="loadingCoor"
            v-model="form.coordination"
            :options="optionsCoordination"
            options-dense
            label="Coordinación"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.toString().trim().length > 0) ||
                'El campo es requerido',
            ]"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> list </span>
            </template>
          </q-select>
        </div>

        <div class="col-12" v-if="form.typeReport.value === 'ACTA'">
          <q-input
            class="full-width q-px-md"
            filled
            type="text"
            v-model="form.acta"
            label="Numero de acta"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.trim().length > 0) || 'El campo es requerido',
            ]"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> pin </span>
            </template>
          </q-input>
        </div>

        <div class="col-12" v-if="form.typeReport.value === 'FICHA'">
          <q-select
            filled
            class="full-width q-px-md"
            use-input
            :disable="loadingFiche"
            v-model="form.fiche"
            hide-selected
            options-dense
            fill-input
            input-debounce="0"
            label="Seleccione la ficha"
            :options="ficheOptions"
            @filter="filterFiche"
            :popup-content-style="{ width: '300px' }"
            :rules="[
              (val) =>
                (val && val.toString().trim().length > 0) ||
                'El campo es requerido',
            ]"
          >
            <template v-slot:append>
              <q-icon
                v-if="form.fiche"
                class="cursor-pointer"
                name="clear"
                @click.stop.prevent="form.fiche = ''"
              />
            </template>
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> school </span>
            </template>
          </q-select>
        </div>
        <div class="col-12" v-if="form.typeReport.value === 'DETALLE'">
          <q-input
            class="full-width q-px-md"
            filled
            type="text"
            v-model="form.document"
            label="Numero documento del aprendiz"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.trim().length > 0) || 'El campo es requerido',
            ]"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> pin </span>
            </template>
          </q-input>
        </div>

        <div
          class="col-12"
          v-if="
            form.typeReport.value !== 'DETALLE' &&
            form.typeReport.value !== 'ACTA' &&
            form.typeReport.value !== 'FICHA'
          "
        >
          <q-input
            filled
            class="full-width q-px-md"
            v-model="form.fstart"
            mask="date"
            :rules="['date']"
            lazy-rules
            label="Fecha inicio"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date v-model="form.fstart" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> today </span>
            </template>
          </q-input>
        </div>

        <div
          class="col-12"
          v-if="
            form.typeReport.value !== 'DETALLE' &&
            form.typeReport.value !== 'ACTA' &&
            form.typeReport.value !== 'FICHA'
          "
        >
          <q-input
            filled
            class="full-width q-px-md"
            v-model="form.fend"
            mask="date"
            :rules="['date']"
            lazy-rules
            label="Fecha fin"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date v-model="form.fend" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> today </span>
            </template>
          </q-input>
        </div>

        <div class="justify-center flex items-start col-12 q-pb-md">
          <q-btn
            icon="save_as"
            label="GENERAR"
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
            @click="
              clearInfoForm();
              clearData();
              resetValidation();
            "
            v-close-popup
            ><span
              class="material-symbols-outlined q-mr-sm"
              style="font-size: 23px"
            >
              delete </span
            >Limpiar</q-btn
          >
        </div>
      </q-form>

      <div
        class="col-8 q-px-md row"
        style="max-height: 65vh; height: 65vh"
        v-if="existInfo"
      >
        <ReportActa
          v-if="form.typeReport.value == 'ACTA'"
          :dataReport="dataReport"
          :form="form"
          :dialogInfo="changeDialog"
          :generatePdf="generatePdf"
          :generateExcel="generateExcel"
        />
        <ReportTypeNew
          v-if="
            form.typeReport.value == 'TIPO' &&
            form.tpNew.value != 'PLAN DE MEJORAMIENTO'
          "
          :dataReport="dataReport"
          :form="form"
          :dialogInfo="changeDialog"
          :generatePdf="generatePdf"
          :generateExcel="generateExcel"
        />
        <ReportImprovement
          v-if="
            form.typeReport.value == 'TIPO' &&
            form.tpNew.value == 'PLAN DE MEJORAMIENTO'
          "
          :dataReport="dataReport"
          :form="form"
          :dialogInfo="changeDialog"
          :generatePdf="generatePdf"
          :generateExcel="generateExcel"
        />
        <ReportStatusNew
          v-if="form.typeReport.value == 'ESTADO'"
          :dataReport="dataReport"
          :form="form"
          :dialogInfo="changeDialog"
          :generatePdf="generatePdf"
          :generateExcel="generateExcel"
        />
        <ReportFiche
          v-if="form.typeReport.value == 'FICHA'"
          :dataReport="dataReport"
          :form="form"
          :dialogInfo="changeDialog"
          :generatePdf="generatePdf"
          :generateExcel="generateExcel"
        />
        <ReportStudent
          v-if="form.typeReport.value == 'DETALLE'"
          :dataReport="dataReport"
          :form="form"
          :dialogInfo="changeDialog"
          :generatePdf="generatePdf"
          :generateExcel="generateExcel"
        />
        <Charts
          v-if="form.typeReport.value == 'ESTADISTICO'"
          :dataReport="dataReport"
          :form="form"
        />
      </div>

      <div
        class="col-8 q-px-md text-bold text-h6 text-center q-pa-md text-grey"
        v-if="!existInfo"
        style="max-height: 65vh; height: 65vh"
      >
        <q-skeleton
          class="full-width full-height justify-center items-center flex"
        >
          Seleccione un tipo de reporte ...
        </q-skeleton>
      </div>
    </div>
    <q-dialog
      v-model="dataReport.showDialog"
      persistent
      :maximized="true"
      class="full-width full-height"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="">
        <q-bar class="bg-green-9">
          <q-space />
          <q-btn
            dense
            round
            icon="close"
            color="white"
            class="text-green-9"
            @click="changeDialog(false)"
          >
            <q-tooltip class="bg-white text-green-9">Cerrar</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section class="justify-center row">
          <ReportActa
            v-if="form.typeReport.value == 'ACTA'"
            :dataReport="dataReport"
            :form="form"
            :dialogInfo="changeDialog(true)"
            :generatePdf="generatePdf"
            :generateExcel="generateExcel"
          />
          <ReportTypeNew
            v-if="
              form.typeReport.value == 'TIPO' &&
              form.tpNew.value != 'PLAN DE MEJORAMIENTO'
            "
            :dataReport="dataReport"
            :form="form"
            :dialogInfo="changeDialog(true)"
            :generatePdf="generatePdf"
            :generateExcel="generateExcel"
          />
          <ReportImprovement
            v-if="
              form.typeReport.value == 'TIPO' &&
              form.tpNew.value == 'PLAN DE MEJORAMIENTO'
            "
            :dataReport="dataReport"
            :form="form"
            :dialogInfo="changeDialog(true)"
            :generatePdf="generatePdf"
            :generateExcel="generateExcel"
          />
          <ReportStatusNew
            v-if="form.typeReport.value == 'ESTADO'"
            :dataReport="dataReport"
            :form="form"
            :dialogInfo="changeDialog(true)"
            :generatePdf="generatePdf"
            :generateExcel="generateExcel"
          />
          <ReportFiche
            v-if="form.typeReport.value == 'FICHA'"
            :dataReport="dataReport"
            :form="form"
            :dialogInfo="changeDialog(true)"
            :generatePdf="generatePdf"
            :generateExcel="generateExcel"
          />
          <ReportStudent
            v-if="form.typeReport.value == 'DETALLE'"
            :dataReport="dataReport"
            :form="form"
            :dialogInfo="changeDialog(true)"
            :generatePdf="generatePdf"
            :generateExcel="generateExcel"
          />
          <Charts
            v-if="form.typeReport.value == 'ESTADISTICO'"
            :dataReport="dataReport"
            :form="form"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="dataReport.generateReport"
      persistent
      :maximized="true"
      class="full-width full-height"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <DialogPdfNew
        :data="dataPdf"
        :showDialog="() => (dataReport.generateReport = false)"
      />
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onBeforeMount } from "vue";
import { get, post } from "../../services/api.js";

import BtnBack from "../../layouts/btnBackLayout.vue";
import HeaderLayout from "../../layouts/headerViewsLayout.vue";
import ReportActa from "./Reports/ReportActa.vue";
import ReportTypeNew from "./Reports/ReportTpNew.vue";
import ReportImprovement from "./Reports/ReportImprovement.vue";
import ReportStatusNew from "./Reports/ReportStatusNews.vue";
import ReportFiche from "./Reports/ReportFiche.vue";
import ReportStudent from "./Reports/ReportStudent.vue";
import Charts from "./Reports/Charts.vue";
import DialogPdfNew from "./Reports/dialogPdfNew.vue";
import { exportNewToExcel } from "../../services/exporteExcelNews";

let myForm = ref(null);
let existInfo = ref(false);
let loading = ref(false);
let loadingCoor = ref(false);
let loadingFiche = ref(false);
let ficheOpt = [];
let ficheOptions = ref([]);
let optionsCoordination = ref([
  {
    label: "TODAS",
    value: "TODAS",
  },
]);

let dataReport = ref({
  circularBasic: [],
  linearBasic: {},
  dataActa: [],
  dataTpNew: [],
  dataImprovement: [],
  dataStateNews: [],
  dataNewsFiche: [],
  dataNewsStudent: [],
  handleChart: true,
  showDialog: false,
  generateReport: false,
});
let form = ref({
  typeReport: "",
  tpNew: "",
  coordination: "",
  stateNew: "",
  acta: "",
  fiche: "",
  document: "",
  fstart: "",
  fend: "",
});

let dataPdf = ref({
  data: [],
  type: "",
  nameFile: "reporte",
});

const optionsTpReport = ref([
  {
    label: "ACTA",
    value: "ACTA",
  },
  {
    label: "TIPO DE NOVEDAD",
    value: "TIPO",
  },
  {
    label: "ESTADO DE NOVEDAD",
    value: "ESTADO",
  },
  {
    label: "FICHA",
    value: "FICHA",
  },
  {
    label: "DETALLE NOVEDAD POR APRENDIZ",
    value: "DETALLE",
  },
  {
    label: "REPORTE ESTADISTICO",
    value: "ESTADISTICO",
  },
]);

const optionsTpNew = ref([
  {
    label: "TODOS (SIN PLANES DE MEJORAMIENTO)",
    value: "TODOS",
  },
  {
    label: "TRASLADO",
    value: "TRASLADO",
  },
  {
    label: "RETIRO VOLUNTARIO",
    value: "RETIRO VOLUNTARIO",
  },
  {
    label: "REINGRESO",
    value: "REINGRESO",
  },
  {
    label: "REINGRESO ESPECIAL",
    value: "REINGRESO ESPECIAL",
  },
  {
    label: "APLAZAMIENTO",
    value: "APLAZAMIENTO",
  },
  {
    label: "DESERCIÓN",
    value: "DESERCIÓN",
  },
  {
    label: "PLAN DE MEJORAMIENTO",
    value: "PLAN DE MEJORAMIENTO",
  },
]);

const optionsStateNew = ref([
  "TODOS",
  "REGISTRADA",
  "EN PROCESO",
  "RECHAZADA",
  "FINALIZADA",
]);

onBeforeMount(async () => {
  await getFiches();
  await getCoor();
});

async function statisticsReport() {
  const data = await post("/reportnew/statistics", {
    fstart: form.value.fstart,
    fend: form.value.fend,
  });
  dataReport.value.circularBasic = data.newsAnual;
  dataReport.value.linearBasic = data.newsByMonth;
  existInfo.value = true;
}

async function getReportByActa() {
  const data = await post("/reportnew/acta", {
    acta: form.value.acta,
  });
  dataReport.value.dataActa = data.news;
  existInfo.value = true;
}

async function getReportByType() {
  const data = await post("/reportnew/typenew", {
    tpnew: form.value.tpNew.value,
    coordination: form.value.coordination.value,
    fstart: form.value.fstart,
    fend: form.value.fend,
  });
  dataReport.value.dataTpNew = data.news;
  existInfo.value = true;
}

async function getReportByImprovement() {
  const data = await post("/reportnew/typenew/improvement", {
    tpnew: form.value.tpNew.value,
    fstart: form.value.fstart,
    fend: form.value.fend,
  });
  dataReport.value.dataImprovement = data.improvements;
  existInfo.value = true;
}

async function getReportByState() {
  const data = await post("/reportnew/status", {
    state: form.value.stateNew,
    fstart: form.value.fstart,
    fend: form.value.fend,
  });
  dataReport.value.dataStateNews = data.news;
  existInfo.value = true;
}

async function getReportByFiche() {
  const data = await post("/reportnew/fiche", {
    fiche: form.value.fiche.value,
  });
  dataReport.value.dataNewsFiche = data.news;
  existInfo.value = true;
}
async function getReportByDocument() {
  const data = await post("/reportnew/student", {
    student: form.value.document,
  });
  console.log(data);
  dataReport.value.dataNewsStudent = data.news;
  existInfo.value = true;
}

async function getFiches() {
  loadingFiche.value = true;
  const data = await get("/fiches");

  ficheOpt = [];
  data.forEach((row, index) => {
    ficheOpt.push({
      label: `${row.number}: ${row.program.name}`,
      value: row._id,
    });
  });

  ficheOptions.value = ficheOpt;
  loadingFiche.value = false;
}

async function getCoor() {
  loadingCoor.value = true;
  const data = await get("/coordinations");

  data.forEach((row, index) => {
    optionsCoordination.value.push({
      label: row.name,
      value: row._id,
    });
  });
  loadingCoor.value = false;
}

function clearInfoForm() {
  form.value.tpNew = "";
  form.value.stateNew = "";
  form.value.coordination = "";
  form.value.acta = "";
  form.value.fiche = "";
  form.value.document = "";
  form.value.fstart = "";
  form.value.fend = "";
  existInfo.value = false;
}

function clearData() {
  dataReport.value = {
    circularBasic: [],
    linearBasic: {},
    dataActa: [],
    dataTpNew: [],
    dataImprovement: [],
    dataStateNews: [],
    dataNewsFiche: [],
    dataNewsStudent: [],
    handleChart: true,
    showDialog: false,
  };
}

async function generateReport() {
  loading.value = true;
  existInfo.value = false;
  clearData();
  switch (form.value.typeReport.value) {
    case "ACTA":
      await getReportByActa();
      break;
    case "TIPO":
      if (form.value.tpNew.value != "PLAN DE MEJORAMIENTO")
        await getReportByType();
      else await getReportByImprovement();
      break;
    case "ESTADO":
      await getReportByState();
      break;
    case "FICHA":
      await getReportByFiche();
      break;
    case "DETALLE":
      await getReportByDocument();
      break;
    case "ESTADISTICO":
      await statisticsReport();
      break;
    default:
      break;
  }

  loading.value = false;
}

function filterFiche(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    ficheOptions.value = ficheOpt.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function changeDialog(show = false) {
  dataReport.value.showDialog = show;
}

function resetValidation() {
  myForm.value.resetValidation();
}

function generatePdf(type = "acta",name, data = null) {
  let dataToPdf;
  if (!data) {
    switch (type) {
      case "acta":
        dataToPdf = dataReport.value.dataActa;

        break;
      case "tpnew":
        dataToPdf = dataReport.value.dataTpNew;

        break;
      case "improvement":
        dataToPdf = dataReport.value.dataImprovement;

        break;
      case "state":
        dataToPdf = dataReport.value.dataStateNews;

        break;
      case "fiche":
        dataToPdf = dataReport.value.dataNewsFiche;

        break;
      case "student":
        dataToPdf = dataReport.value.dataNewsStudent;

        break;
      default:
        break;
    }
  }
  dataPdf.value.data = dataToPdf ?? [data];
  dataPdf.value.type = type;
  console.log(name);
  dataPdf.value.nameFile = name;

  dataReport.value.generateReport = true;
}

async function generateExcel(type = "acta",name, data = null) {
  let dataToExcel;
  if (!data) {
  switch (type) {
    case "acta":
      dataToExcel = dataReport.value.dataActa;

      break;
    case "tpnew":
      dataToExcel = dataReport.value.dataTpNew;

      break;
    case "improvement":
      dataToExcel = dataReport.value.dataImprovement;

      break;
    case "state":
      dataToExcel = dataReport.value.dataStateNews;

      break;
    case "fiche":
      dataToExcel = dataReport.value.dataNewsFiche;

      break;
    case "student":
      dataToExcel = dataReport.value.dataNewsStudent;

      break;
    default:
      break;
  }
}
  await exportNewToExcel(dataToExcel ?? [data],name, type == "improvement" ? true : false);
}
</script>