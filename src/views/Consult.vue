<template>
  <div>
    <BtnBack
      :route="
        role !== 'USER'
          ? '/reports'
          : opcion == 'instructor'
          ? '/home/instructor'
          : '/consultor'
      "
    />

    <HeaderLayout title="Reportes" />
    <q-form @submit.prevent.stop="getReport()" novalidate v-if="!existInfo">
      <div class="row justify-center flex">
        <div class="col-11 col-sm-3 q-px-md" v-if="opcion == 'ficha'">
          <q-select
            :disable="isLoadingData"
            filled
            v-model="fiche"
            label="Ficha"
            use-input
            hide-selected
            options-dense
            fill-input
            input-debounce="0"
            :popup-content-style="{ width: '300px' }"
            :options="filterFiche"
            @filter="filterFicha"
            lazy-rules
            :rules="[(val) => !!val || 'El campo es requerido']"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> dataset </span>
            </template>
          </q-select>
        </div>
        <div class="col-11 col-sm-3 q-px-md" v-if="opcion == 'instructor'">
          <q-select
            filled
            :disable="isLoadingData"
            v-model="inst"
            label="Instructor"
            use-input
            hide-selected
            options-dense
            fill-input
            input-debounce="0"
            :options="filterInstructor"
            @filter="filterInstru"
            lazy-rules
            :rules="[(val) => !!val || 'El campo es requerido']"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> person </span>
            </template>
          </q-select>
        </div>
        <div class="col-11 col-sm-3 q-px-md" v-if="opcion == 'ambiente'">
          <q-select
            filled
            :disable="isLoadingData"
            v-model="environment"
            label="Ambiente"
            use-input
            hide-selected
            options-dense
            fill-input
            input-debounce="0"
            :options="filterEnvironment"
            @filter="filterEnvi"
            lazy-rules
            :rules="[(val) => !!val || 'El campo es requerido']"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
            <template v-slot:prepend>
              <span class="material-symbols-outlined"> person </span>
            </template>
          </q-select>
        </div>

        <div class="col-11 col-sm-3 q-px-md">
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
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-11 col-sm-3 q-px-md">
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
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-2 col-sm-1 justify-center flex-center q-mt-sm q-mx-md">
          <q-btn
            :loading="loadingData"
            type="submit"
            class="bg-green-9 text-white"
          >
            REPORTE
          </q-btn>
        </div>
      </div>
    </q-form>

    <div class="row justify-center" v-if="existInfo">
      <div
        class="col-11 justify-end flex"
        :class="
          $q.screen.width < 600 ? 'justify-center q-gutter-sm' : 'justify-end'
        "
      >
        <q-btn
          label="Generar PDF"
          icon="print"
          class="bg-green-7 text-white q-mr-md"
          @click="exportCalender()"
        />

        <q-btn
          label="Generar excel"
          icon="print"
          class="bg-green-9 text-white q-mr-md"
          @click="saveExcel()"
        />

        <q-btn
          v-if="opcion == 'ficha' && role !== 'USER'"
          label="Enviar"
          icon="send"
          class="bg-green-9 text-white q-mr-md"
          @click="sendReport()"
          :loading="isLoading"
          :disable="isLoading"
        >
          <template v-slot:loading>
            <q-spinner-oval color="white" size="1em" />
          </template>
        </q-btn>

        <q-btn
          label="Cancelar"
          icon="cancel"
          class="bg-red-5 text-white"
          @click="cancel()"
        />
      </div>
    </div>

    <div id="calenderPrint">
      <div class="row justify-center flex">
        <div class="col-9 q-mb-md q-mt-sm">
          <spam class="text-h6" v-if="opcion == 'instructor' && existInfo">
            <spam class="text-weight-bold"> INSTRUCTOR: </spam
            >{{ nameInstructor.toUpperCase() }}
            <br />
            <spam class="text-weight-bold"> HORAS DE FORMACIÓN: </spam
            >{{ Math.ceil(hoursWork1) }} HORAS
            <br />
            <spam class="text-weight-bold"> HORAS DE OTRAS ACTIVIDADES: </spam
            >{{ Math.ceil(hoursWork2) }} HORAS
            <br />
            <spam class="text-weight-bold"> TOTAL DE HORAS: </spam
            >{{ Math.ceil(hoursWork1 + hoursWork2) }} HORAS
          </spam>
          <spam class="text-h6" v-if="opcion == 'ficha' && existInfo">
            <spam class="text-weight-bold"> FICHA: </spam
            >{{ dataFiche.toUpperCase() }}
          </spam>
          <spam class="text-h6" v-if="opcion == 'ambiente' && existInfo">
            <spam class="text-weight-bold"> AMBIENTE: </spam
            >{{ nameEnvironment.toUpperCase() }}
          </spam>
        </div>
      </div>
      <div id="calenderHour" v-for="(c, i) in calendarOptions" :key="i">
        <div class="row justify-center flex" v-if="existInfo && showCalender">
          <div class="col-10 q-pb-lg q-mt-md justify-center flex">
            <FullCalendar id="calender" class="text-uppercase" :options="c">
              <template v-if="opcion == 'instructor'" v-slot:eventContent="arg">
                <VMenu
                  :autoHide="false"
                  :delay="0"
                  class="justify-center items-center customEvents"
                  v-if="arg.event.extendedProps.type == 1"
                >
                  <span>
                    <b>{{ arg.timeText }}</b>
                    <i>{{ arg.event.title }}</i></span
                  >

                  <template #popper>
                    <div class="content-tooltip-event">
                      <p>INSTRUCTOR: {{ arg.event.title }}</p>
                      <p>
                        ACTIVIDAD: {{ arg.event.extendedProps.typeactivity }}
                      </p>
                      <p>
                        ACTIVIDAD ADICIONAL:{{
                          arg.event.extendedProps.additionalactivity
                        }}
                      </p>
                      <p>
                        JUSTIFICACIÓN:
                        {{ arg.event.extendedProps.justification }}
                      </p>
                      <p>HORA INICIO: {{ arg.event.extendedProps.tstart }}</p>
                      <p>HORA FIN: {{ arg.event.extendedProps.tend }}</p>
                    </div>
                  </template>
                </VMenu>

                <VMenu
                  :autoHide="false"
                  :delay="0"
                  class="justify-center items-center customEvents"
                  v-else
                >
                  <span>
                    <b>{{ arg.timeText }}</b>
                    <i>{{ arg.event.title }}</i></span
                  >

                  <template #popper>
                    <div class="content-tooltip-event">
                      <p>FICHA: {{ arg.event.title }}</p>
                      <p>AMBIENTE: {{ arg.event.extendedProps.environment }}</p>
                      <p>PROGRAMA: {{ arg.event.extendedProps.program }}</p>
                      <p>RESULTADO: {{ arg.event.extendedProps.outcome }}</p>
                      <p>NOTA: {{ arg.event.extendedProps.supporttext }}</p>
                      <p>
                        OBSERVACIÓN: {{ arg.event.extendedProps.observation }}
                      </p>
                      <p>HORA INICIO: {{ arg.event.extendedProps.tstart }}</p>
                      <p>HORA FIN: {{ arg.event.extendedProps.tend }}</p>
                    </div>
                  </template>
                </VMenu>
              </template>
              <template v-else-if="opcion == 'ficha'" v-slot:eventContent="arg">
                <VMenu
                  :autoHide="false"
                  :delay="0"
                  class="justify-center items-center customEvents"
                >
                  <span>
                    <b>{{ arg.timeText }}</b>
                    <i>{{ arg.event.title }}</i></span
                  >

                  <template #popper>
                    <div class="content-tooltip-event">
                      <p>INSTRUCTOR: {{ arg.event.title }}</p>
                      <p>AMBIENTE: {{ arg.event.extendedProps.environment }}</p>
                      <p>PROGRAMA: {{ arg.event.extendedProps.program }}</p>
                      <p>RESULTADO: {{ arg.event.extendedProps.outcome }}</p>
                      <p>NOTA: {{ arg.event.extendedProps.supporttext }}</p>
                      <p>
                        OBSERVACIÓN: {{ arg.event.extendedProps.observation }}
                      </p>
                      <p>HORA INICIO: {{ arg.event.extendedProps.tstart }}</p>
                      <p>HORA FIN: {{ arg.event.extendedProps.tend }}</p>
                    </div>
                  </template>
                </VMenu>
              </template>
              <template v-else v-slot:eventContent="arg">
                <VMenu
                  :autoHide="false"
                  :delay="0"
                  class="justify-center items-center customEvents"
                >
                  <span>
                    <i>{{ arg.event.extendedProps.fiche }}</i>
                    <br />
                    <i
                      >({{ arg.event.extendedProps.tstart }} -
                      {{ arg.event.extendedProps.tend }})</i
                    >
                  </span>

                  <template #popper>
                    <div class="content-tooltip-event">
                      <p>INSTRUCTOR: {{ arg.event.title }}</p>
                      <p>FICHA: {{ arg.event.extendedProps.fiche }}</p>
                      <p>AMBIENTE: {{ arg.event.extendedProps.environment }}</p>
                      <p>PROGRAMA: {{ arg.event.extendedProps.program }}</p>
                      <p>RESULTADO: {{ arg.event.extendedProps.outcome }}</p>
                      <p>NOTA: {{ arg.event.extendedProps.supporttext }}</p>
                      <p>
                        OBSERVACIÓN: {{ arg.event.extendedProps.observation }}
                      </p>
                      <p>HORA INICIO: {{ arg.event.extendedProps.tstart }}</p>
                      <p>HORA FIN: {{ arg.event.extendedProps.tend }}</p>
                    </div>
                  </template>
                </VMenu>
              </template>
            </FullCalendar>
          </div>
        </div>
      </div>

      <div
        class="q-mb-md row"
        style="display: grid; justify-content: center"
        v-if="existInfo"
      >
        <tableFormacion
          :events="eventsCalender"
          :existInfo="existInfo"
          :print="print"
        />

        <tableOtrasActividades
          :events="eventsCalender"
          :existInfo="existInfo"
          :print="print"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, computed } from "vue";
import { get, post } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { format, useQuasar } from "quasar";
import { jsPDF } from "jspdf";
import { useRouter } from "vue-router";

import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import { storeUser } from "../store/users.js";
import tableFormacion from "../components/Reports/tables/tableFormacion.vue";
import tableOtrasActividades from "../components/Reports/tables/tableOtrasActividades.vue";
import { excelToReports } from "../services/excelToReports.js";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

const useUser = storeUser();
const role = ref(useUser.getRole());

let fiche = ref();
let inst = ref();
let environment = ref();
let fStart = ref();
let fEnd = ref();
let optionsFiches = ref([]);
let optionsInst = ref([]);
let optionsEnvir = ref([]);
let months = ref();
let yearsMonth = ref();
let eventsCalender = ref();
let calendarOptions = ref([]);
let existInfo = ref(false);
let nameInstructor = ref("");
let dataFiche = ref("");
let nameEnvironment = ref("");
let hoursWork1 = ref(0);
let hoursWork2 = ref(0);
let showCalender = ref(true);
let isLoading = ref(false);
let isLoadingData = ref(false);
let opcion = ref("");
let filterFiche = ref([]);
let filterInstructor = ref([]);
let filterEnvironment = ref([]);
let loadingData = ref(false);
let print = ref(false);

const router = useRouter();

onBeforeMount(async () => {
  opcion.value = router.currentRoute.value.params.opcion;
  isLoadingData.value = true;

  if (role.value == "USER") {
    opcion.value == "instructor"
      ? (inst.value = useUser.newConsult)
      : (fiche.value = useUser.newConsult);
  } else {
    opcion.value == "instructor"
      ? await getInst()
      : opcion.value == "ficha"
      ? await getFiches()
      : await getEnvironments();
    isLoadingData.value = false;
  }
});

function cancel() {
  existInfo.value = false;
  fiche.value = "";
  inst.value = "";
  environment.value = "";
  fStart.value = "";
  fEnd.value = "";
  nameInstructor.value = "";
  hoursWork1.value = 0;
  hoursWork2.value = 0;
  dataFiche.value = "";
  nameEnvironment.value = "";
  calendarOptions.value = [];

  if (role.value == "USER") {
    useUser.newConsult = "";
    router.push("/consultor");
  }
}

async function sendReport() {
  let data = {
    fiche: fiche.value.value,
    fstart: fStart.value,
    fend: fEnd.value,
  };
  isLoading.value = true;
  await post("/reports/sendreport", data);
  notifySuccessRequest("Programación enviada correctamente");
  fiche.value = "";
  fStart.value = "";
  fEnd.value = "";
  months.value = "";
  yearsMonth.value = "";
  eventsCalender.value = "";
  calendarOptions.value = [];
  existInfo.value = false;

  isLoading.value = false;
}

function generateCalendar() {
  yearsMonth.value.forEach((my) => {
    let events = null;
    events = eventsCalender.value[my.split("-")[1]];

    const formatDate = (
      my.split("-")[0] +
      "-" +
      my.split("-")[1] +
      "-" +
      "01"
    ).toString();

    calendarOptions.value.push({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      locale: esLocale,
      initialView: "dayGridMonth",
      selectable: true,
      initialDate: formatDate,
      fixedWeekCount: false,
      headerToolbar: {
        left: "",
        center: "title",
        right: "",
      },
      events,
    });
  });

  existInfo.value = true;
}

async function getFiches() {
  const res = await get("/fiches?status=0");
  console.log(res);
  res.forEach((row, index) => {
    optionsFiches.value.push({
      label: `${row.number} - ${row.program.name}`,
      value: row._id,
    });
    filterFiche.value = optionsFiches.value;
  });
}

async function getInst() {
  const res = await get("/instructors");

  res.forEach((row, index) => {
    optionsInst.value.push({ label: row.name, value: row._id });
    filterInstructor.value = optionsInst.value;
  });
}

async function getEnvironments() {
  const res = await get("/environments?status=0");

  res.forEach((row, index) => {
    optionsEnvir.value.push({ label: row.name, value: row._id });
    filterEnvironment.value = optionsEnvir.value;
  });
}

async function getReport() {
  loadingData.value = true;
  if (opcion.value == "instructor") {
    let data = {
      instructor: inst.value.value,
      fstart: fStart.value,
      fend: fEnd.value,
    };

    const res = await post("/reports/instructor", data);
    months.value = res.months;
    yearsMonth.value = res.yearsMonth;
    eventsCalender.value = res.events;
    nameInstructor.value = res.instructor;
    hoursWork1.value = res.hoursworkFormacion;
    hoursWork2.value = res.hoursworkOthers;

    generateCalendar();
  } else if (opcion.value == "ficha") {
    let data = {
      fiche: fiche.value.value,
      fstart: fStart.value,
      fend: fEnd.value,
    };
    const res = await post("/reports", data);
    months.value = res.months;
    yearsMonth.value = res.yearsMonth;
    eventsCalender.value = res.events;
    dataFiche.value = `${res.fiche} - ${res.program}`;
    generateCalendar();
  } else {
    let data = {
      environment: environment.value.value,
      fstart: fStart.value,
      fend: fEnd.value,
    };
    const res = await post("/reports/environment", data);
    months.value = res.months;
    yearsMonth.value = res.yearsMonth;
    eventsCalender.value = res.events;
    nameEnvironment.value = res.environment;
    generateCalendar();
  }
  loadingData.value = false;
}

async function exportCalender() {
  isLoading.value = true;
  let calenderExport = document.getElementById("calenderPrint");
  //agregar la clase maxSize
  calenderExport.classList.add("maxSizeCalender");
  showCalender.value = false;

  await new Promise((resolve) => setTimeout(resolve, 100));
  showCalender.value = true;
  print.value = true;

  const notif = $q.notify({
    type: "ongoing",
    message: "Generando pdf...",
    position: "top",
  });

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    //el formato más grande posible
    format: [1500, 820],
    compress: true,
    precision: 2, //para que no se vea borroso el texto
  });

  doc.html(calenderExport, {
    callback: async function (doc) {
      doc.save("reporte.pdf");

      notif({
        type: "positive",
        message: "Tu archivo se ha generado correctamente",
        timeout: 1000,
        position: "top",
      });

      calenderExport.classList.remove("maxSizeCalender");
      showCalender.value = false;
      print.value = false;
      await new Promise((resolve) => setTimeout(resolve, 100));
      showCalender.value = true;
      isLoading.value = false;
    },
    margin: [70, 20, 70, 20], //margen superior, izquierdo, inferior, derecho
  });
}

async function saveExcel() {
  await excelToReports(eventsCalender.value);
}

function filterFicha(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterFiche.value = optionsFiches.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterInstru(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterInstructor.value = optionsInst.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterEnvi(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterEnvironment.value = optionsEnvir.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}
</script>

<style scoped>
#calender {
  width: 1000px !important;
  height: 665px !important;
}

.item {
  align-self: center;
  border: 1px solid #00a91c;
  width: 800px;
}
</style>
