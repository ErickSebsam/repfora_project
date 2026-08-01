<template>
  <div>
    <BtnBack route="/reports" />
    <HeaderLayout title="Reporte de Horas Programadas" />
    <div class="row justify-center flex">
      <q-form
        ref="myForm"
        @submit.prevent.stop="generateReport()"
        class="col-11 col-sm-7 col-md-3 row flex"
      >
        <div class="col-12">
          <q-input
            filled
            class="full-width q-px-md"
            v-model="form.fstart"
            mask="date"
            :rules="['date']"
            lazy-rules
            label="Fecha Inicio"
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

        <div class="col-12">
          <q-input
            filled
            class="full-width q-px-md"
            v-model="form.fend"
            mask="date"
            :rules="['date']"
            lazy-rules
            label="Fecha Fin"
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

        <div class="col-12">
          <q-select
            filled
            class="full-width q-px-md"
            type="text"
            v-model="form.type"
            :options="optionsTpReport"
            options-dense
            label="Tipo de reporte"
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
        v-if="dataReport.dataHoursIns != null"
      >
        <ReportHoursInstru
          :dataReport="dataReport"
          :form="form"
          :dialogInfo="changeDialog"
          :generateExcel="generateExcel"
        />
      </div>

      <div
        class="col-8 q-px-md text-bold text-h6 text-center q-pa-md text-grey"
        v-if="dataReport.dataHoursIns == null"
        style="max-height: 65vh; height: 65vh"
      >
        <q-skeleton
          class="full-width full-height justify-center items-center flex"
        >
          Esperando datos ...
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
          <ReportHoursInstru
            :dataReport="dataReport"
            :form="form"
            :dialogInfo="changeDialog(true)"
            :generateExcel="generateExcel"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onBeforeMount } from "vue";
import { post } from "../services/api.js";
import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";
import ReportHoursInstru from "../components/Reports/reportHoursInstru.vue";
import { exportHoursToExcel } from "../services/exporteExcelHoursIns.js";
import { notifyErrorRequest } from "../common/notify.js";

let myForm = ref(null);
let loading = ref(false);
let dataReport = ref({
  dataHoursIns: null,
  months: null,
  showDialog: false,
});

const optionsTpReport = [
  {
    label: "EN FORMACIÓN",
    value: "EN FORMACION",
  },
  {
    label: "OTRAS ACTIVIDADES",
    value: "OTRAS ACTIVIDADES",
  },
  {
    label: "TODOS",
    value: "TODOS",
  },
];

let form = ref({
  fstart: "",
  fend: "",
  type: "",
});

function clearInfoForm() {
  form.value.fstart = "";
  form.value.fend = "";
  form.value.type = "";
  dataReport.value = {
    dataHoursIns: null,
    months: null,
    showDialog: false,
  };
}

async function generateReport() {
  dataReport.value = {
    dataHoursIns: null,
    months: null,
    showDialog: false,
  };
  loading.value = true;

  const res = await post("/reports/hoursinstructors", {
    fstart: form.value.fstart,
    fend: form.value.fend,
    type: form.value.type.value,
  });
  if (res.data.length > 0) {
    dataReport.value = {
      dataHoursIns: res.data,
      months: res.months,
      showDialog: false,
    };
  } else {
    notifyErrorRequest("Sin información para mostrar");
  }

  loading.value = false;
}

function changeDialog(show = false) {
  dataReport.value.showDialog = show;
}

function resetValidation() {
  myForm.value.resetValidation();
}

function generateExcel() {
  const name = `Horas 
  ${form.value.type.value == "TODOS" ? "Programadas" : form.value.type.value}
  ${form.value.fstart} - ${form.value.fend}`;
  exportHoursToExcel(
    dataReport.value.dataHoursIns,
    dataReport.value.months,
    name,
    form.value
  );
}
</script>