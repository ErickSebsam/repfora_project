<template>
  <div>
    <HeaderLayout title="Reportes" />

    <div class="row">
      <div class="col-11 justify-end flex" v-if="existInfo">
        <q-btn
          label="Generar pdf"
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


      </div>
    </div>

    <div id="calenderPrint">
      <div id="calenderHour" v-for="(c, i) in calendarOptions" :key="i">
        <div class="row justify-center flex" v-if="existInfo && showCalender">
          <div class="col-10 q-pb-lg q-mt-md justify-center flex">
            <FullCalendar id="calender" class="text-uppercase" :options="c">
              <template v-slot:eventContent="arg">
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
                        ACTIVIDAD ADICIONAL:
                        {{ arg.event.extendedProps.additionalactivity }}
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
                      <p>INSTRUCTOR: {{ arg.event.title }}</p>
                      <p>FICHA: {{ arg.event.extendedProps.fiche }}</p>
                      <p>AMBIENTE: {{ arg.event.extendedProps.environment }}</p>
                      <p>PROGRAMA: {{ arg.event.extendedProps.program }}</p>
                      <p>NOTA: {{ arg.event.extendedProps.supporttext }}</p>
                      <p>
                        OBSERVACIÓN: {{ arg.event.extendedProps.observation }}
                      </p>
                      <p>RESULTADO: {{ arg.event.extendedProps.outcome }}</p>
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
import { postRaw } from "../services/api.js";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { jsPDF } from "jspdf";
import jwt_decode from "jwt-decode";

import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import tableFormacion from "../components/Reports/tables/tableFormacion.vue";
import tableOtrasActividades from "../components/Reports/tables/tableOtrasActividades.vue";

import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();
const router = useRouter();

let months = ref();
let yearsMonth = ref();
let eventsCalender = ref();
let calendarOptions = ref([]);
const existInfo = ref(false);
let showCalender = ref(true);
let print = ref(false);

onBeforeMount(async () => {
  const token = router.currentRoute.value.params.token;
  console.log("token buscado "+token);
  
  const decodeToken = jwt_decode(token);

  const data = {
    token: token,
    fiche: decodeToken.fiche,
    fstart: decodeToken.fstart,
    fend: decodeToken.fend,
  };

  const res = await postRaw("/reports/reporttemp", data);
  months.value = res.data.months;
  yearsMonth.value = res.data.yearsMonth;
  eventsCalender.value = res.data.events;
  generateCalendar();
  existInfo.value = true;
});

function generateCalendar() {
  yearsMonth.value.forEach((my) => {
    let events = null;
    events = eventsCalender.value[my.split("-")[1]];

    const formatDate = (my.split("-")[0] + "-" + my.split("-")[1] + "-" + "01").toString();

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
}

async function exportCalender() {
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
    compress: true, //para que no pese tanto el pdf
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
    },
    margin: [70, 20, 70, 20], //margen superior, izquierdo, inferior, derecho
  });
}
</script>

<style scoped>
#calender {
  width: 1000px !important;
  height: 680px !important;
}

.item {
  align-self: center;
  border: 1px solid #ededed;
  width: 800px;
}
</style>
