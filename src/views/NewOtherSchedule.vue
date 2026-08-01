<template>
  <div class="customRow">
    <div id="formHour">
      <div class="row justify-center flex">
        <div class="col-md-11 col-sm-6 col-11">
          <q-card class="my_card full-width q-my-lg" flat>
            <div class="q-pa-md">
              <q-card-section class="card_header q-mb-md">
                <BtnBack route="/otherSchedule" />
                <h5 class="q-mt-sm q-mb-md text-center text-weight-bold">
                  DILIGENCIA LA INFORMACIÓN
                </h5>
              </q-card-section>

              <q-form
                ref="formCalender"
                @submit.prevent.stop="validateInfo"
                novalidate
              >
                <div class="q-mt-lg">
                  <q-select
                    class="q-mb-sm q-mt-md"
                    type="text"
                    v-model="activity"
                    options-dense
                    dense
                    use-input
                    label="Tipo de actividad"
                    disable
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

                  <q-select
                    class="q-mb-sm"
                    type="text"
                    v-model="aditionalActivity"
                    use-input
                    options-dense
                    :options="optionsAditionalAcivity"
                    label="Tipo de actividad adicional"
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

                  <q-input
                    v-if="aditionalActivity == 'OTRO'"
                    class="q-mb-sm"
                    type="text"
                    v-model="otheractivity"
                    label="Otro tipo de actividad adicional"
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                    @update:model-value="clearDataCalender()"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> article </span>
                    </template>
                  </q-input>

                  <q-select
                    class="q-mb-sm"
                    :label="!isLoadingInstru ? 'Instructor' : 'Cargando...'"
                    options-dense
                    dense
                    :disable="isLoadingInstru"
                    v-model="instructor"
                    :options="filterOptionsInstru"
                    use-input
                    input-debounce="0"
                    @filter="filterInstru"
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.toString().trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                    @update:model-value="clearDataCalender()"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> person </span>
                    </template>
                  </q-select>

                  <q-input
                    class="q-mb-sm"
                    type="text"
                    v-model="justification"
                    label="Justificación"
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.length > 0) || 'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> article </span>
                    </template>
                  </q-input>
                  <q-input
                    v-model="tstart"
                    type="time"
                    label="Hora inicio"
                    @update:model-value="clearDataCalender()"
                    dense
                    lazy-rules
                    :rules="[
                      (val) =>
                        ((val) => val !== null && val !== '') ||
                        'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> alarm </span>
                    </template>
                  </q-input>

                  <q-input
                    v-model="tend"
                    type="time"
                    label="Hora fin"
                    dense
                    lazy-rules
                    :rules="[
                      (val) =>
                        ((val) => val !== null && val !== '') ||
                        'El campo es requerido',
                    ]"
                    @update:model-value="clearDataCalender()"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> timer_off </span>
                    </template>
                  </q-input>

                  <q-input
                    class="q-mb-sm"
                    dense
                    v-model="fStart"
                    mask="date"
                    :rules="['date']"
                    lazy-rules
                    label="Fecha Inicio"
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
                      <span class="material-symbols-outlined"> today </span>
                    </template>
                  </q-input>

                  <q-input
                    class="q-mb-sm"
                    dense
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
                      <span class="material-symbols-outlined"> event </span>
                    </template>
                  </q-input>

                  <div class="justify-center flex bg-grey-3 q-mb-md">
                    <q-checkbox
                      class="text-black"
                      v-for="(i, index) in days"
                      :key="index"
                      v-model="selectDays"
                      :val="i.value"
                      :label="i.label"
                      @update:model-value="clearDataCalender()"
                    />
                  </div>
                  <div class="justify-center flex">
                    <q-btn
                      type="submit"
                      :loading="loading"
                      class="previ q-mt-md q-mb-sm q-mx-sm"
                    >
                      <template v-slot:loading>
                        <q-spinner-oval color="white" size="1em" />
                      </template>
                      <span
                        class="material-symbols-outlined q-mr-sm"
                        style="font-size: 20px"
                      >
                        calendar_month </span
                      >PREVISUALIZAR
                    </q-btn>
                    <q-btn
                      type="button"
                      class="q-mt-md q-mb-sm q-mx-sm button_closed"
                      to="/otherSchedule"
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
        </div>
      </div>
    </div>
    <div id="calenderHour">
      <div class="row justify-center flex">
        <div class="col-11 q-py-lg">
          <FullCalendar
            class="full-width text-uppercase"
            :options="calendarOptions"
          >
            <template v-slot:eventContent="arg">
              <div class="row justify-center flex">
                <VMenu
                  :autoHide="false"
                  :delay="0"
                  class="justify-center col-9 col-md-10 col-xl-11 items-center customEvents"
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
                  class="col-9 col-md-10 col-xl-11 justify-center items-center customEvents"
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
                      <p>HORA INICIO: {{ arg.event.extendedProps.tstart }}</p>
                      <p>HORA FIN: {{ arg.event.extendedProps.tend }}</p>
                    </div>
                  </template>
                </VMenu>

                <div class="col-3 col-md-2 col-xl-1 justify-center flex">
                  <div class="roundedIcon">
                    <q-icon
                      name="close"
                      class="cursor-pointer"
                      color="red"
                      size="17px"
                    />
                  </div>
                </div>
              </div>
            </template>
          </FullCalendar>

          <div class="justify-center flex" v-if="diasProgramados.length > 0">
            <q-btn
              class="q-mt-md q-mb-sm q-mx-sm save_as"
              :loading="loading"
              @click="isEdit ? updateData() : saveData()"
              ><span
                class="material-symbols-outlined q-mr-sm"
                style="font-size: 23px"
              >
                {{ isEdit ? "edit" : "save" }}
              </span>
              {{ isEdit ? "ACTUALIZAR" : "GUARDAR" }}
              <template v-slot:loading>
                <q-spinner-oval color="white" size="1em" />
              </template>
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeMount } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

import { get, post, postRaw, put } from "../services/api.js";
import {
  notifySuccessRequest,
  notifyWarningRequest,
} from "../common/notify.js";
import BtnBack from "../layouts/btnBackLayout.vue";

const $q = useQuasar();
const $router = useRouter();

let idSchedule = ref();
let instructor = ref();
let filterOptionsInstru = ref([]);
let optionsInstructors = ref([]);
let formCalender = ref();
let activity = ref("APOYO A LA FORMACIÓN");
let aditionalActivity = ref();
let quantityOfHours = ref();
let fStart = ref();
let fEnd = ref();
let tstart = ref();
let tend = ref();
let justification = ref();
let optionsAditionalAcivity = ref([
  "DESARROLLO CURRICULAR",
  "DISEÑO CURRICULAR",
  "PROYECTOS DE INVESTIGACIÓN APLICADA",
  "NORMALIZACIÓN Y CERTIFICACIÓN DE COMPETENCIAS",
  "FORTALECIMIENTO IDIOMAS PARA INSTRUCTORES",
  "ASEGURAMIENTO DE CALIDAD",
  "EXTENSIÓN - AGROPECUARIA",
  "OTRO",
]);
let selectDays = ref([]);
let isEdit = ref(false);
let loading = ref(false);
let isLoadingInstru = ref(true);
let diasProgramados = ref([]);
let otheractivity = ref();

onBeforeMount(async () => {
  //capturar el params de la url
  idSchedule.value = $router.currentRoute.value.params.id;
  if (idSchedule.value) {
    isEdit.value = true;
    const data = await get("/othersschedules/" + idSchedule.value);

    instructor.value = {
      label: data.instructor.name,
      value: data.instructor._id,
    };
    activity.value = data.typeactivity;
    aditionalActivity.value = data.additionalactivity;
    otheractivity.value = data.otheractivity;
    quantityOfHours.value = data.hours;
    justification.value = data.justification;

    days.value = [
      { label: "Lunes", value: 1 },
      { label: "Martes", value: 2 },
      { label: "Miércoles", value: 3 },
      { label: "Jueves", value: 4 },
      { label: "Viernes", value: 5 },
      { label: "Sábado", value: 6 },
      { label: "Domingo", value: 0 },
    ];

    selectDays.value = data.days;
    fStart.value = data.fstart;
    fEnd.value = data.fend;
    tstart.value = data.tstart;
    tend.value = data.tend;
    //timeout para que se cargue el calendario y se pueda mostrar los dias programados
    setTimeout(() => {
      diasProgramados.value = data.events;
      calendarOptions.value.events = diasProgramados.value;
    }, 100);
  }

  await getInstructors();
});
let days = ref([
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
]);

// CALENDAR
let calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: esLocale,
  initialView: "dayGridMonth",
  selectable: true,
  eventClick: handleEventClick,
  headerToolbar: {
    right: "prev,next today",
    center: "",
    left: "title",
  },
  droppable: true,
});

function handleEventClick(clickInfo) {
  if (
    instructor.value.value !== clickInfo.event.extendedProps.idInstructor ||
    clickInfo.event.extendedProps.autogenerated == false
  ) {
    $q.dialog({
      title: "Confirm",
      message: "Esta seguro que desea eliminar el evento?",
      cancel: true,
      persistent: true,
    })
      .onOk(async () => {
        clickInfo.event.remove();
        let indexEvent = diasProgramados.value.findIndex((value) => {
          return value.id == clickInfo.event.id;
        });

        if (clickInfo.event.extendedProps.type == 1) {
          await put(
            "/othersschedules/deleteevent/" +
              clickInfo.event.extendedProps.code,
            { event: clickInfo.event.start.toISOString().split("T")[0] }
          );
          notifySuccessRequest("Evento eliminado correctamente");
          diasProgramados.value.splice(indexEvent, 1);
        } else {
          await put(
            "/schedules/deleteevent/" +
              clickInfo.event.extendedProps.code,
            { event: clickInfo.event.start.toISOString().split("T")[0] }
          );
          notifySuccessRequest("Evento eliminado correctamente");
          diasProgramados.value.splice(indexEvent, 1);
        }
      })
      .onCancel(() => {})
      .onDismiss(() => {});
  } else {
    clickInfo.event.remove();
    let indexEvent = diasProgramados.value.findIndex((value) => {
      return value.id == clickInfo.event.id;
    });

    diasProgramados.value.splice(indexEvent, 1);
  }
}

// -------------------- codigo principal --------------------
async function validateInfo() {
  loading.value = true;

  const data = {
    instructor: instructor.value.value,
    typeactivity: activity.value,
    additionalactivity: aditionalActivity.value,
    otheractivity: otheractivity.value,
    tstart: tstart.value,
    tend: tend.value,
    hours: quantityOfHours.value,
    days: selectDays.value,
    justification: justification.value,
    fstart: fStart.value,
    fend: fEnd.value,
  };

  if (idSchedule.value) {
    const res = await postRaw(
      "/othersschedules/validateeditschedule/" + idSchedule.value,
      data
    );
    if (res.data.msg) {
      notifyWarningRequest(res.data.msg);
    }
    if (res.data) {
      diasProgramados.value = res.data.events;
      calendarOptions.value.events = res.data.events;
    }
  } else {
    const res = await postRaw(
      "/othersschedules/validateschedule",
      data
    );
    if (res.data.msg) {
      notifyWarningRequest(res.data.msg);
    }
    if (res.data) {
      diasProgramados.value = res.data.events;
      calendarOptions.value.events = res.data.events;
    }
  }

  loading.value = false;
}

async function getInstructors() {
  isLoadingInstru.value = true;
  optionsInstructors.value = [];
  const data = await get("/instructors?status=0");
  data.forEach((row, index) => {
    optionsInstructors.value.push({ label: row.name, value: row._id });
    filterOptionsInstru.value = optionsInstructors.value;
  });

  isLoadingInstru.value = false;
}

function clearFields() {
  aditionalActivity.value = "";
  quantityOfHours.value = "";
  otheractivity.value = "";
  justification.value = "";
  instructor.value = "";
  fStart.value = null;
  fEnd.value = null;
  tstart.value = null;
  tend.value = null;
  fStart.value = null;
  fEnd.value = null;
  calendarOptions.value.events = [];
  diasProgramados.value = [];
  selectDays.value = [];
  formCalender.value.resetValidation();
  loading.value = false;
}

async function saveData() {
  loading.value = true;

  let dataShedule = {
    instructor: instructor.value.value,
    typeactivity: activity.value,
    otheractivity: otheractivity.value,
    additionalactivity: aditionalActivity.value,
    tstart: tstart.value,
    tend: tend.value,
    hours: quantityOfHours.value,
    days: selectDays.value,
    justification: justification.value,
    fstart: fStart.value,
    fend: fEnd.value,
  };

  dataShedule.events = diasProgramados.value;

  await post("/othersschedules/register", dataShedule);
  notifySuccessRequest("Programación guardada correctamente");
  clearFields();
  loading.value = false;
}

async function updateData() {
  loading.value = true;

  let dataSchedule = {
    instructor: instructor.value.value,
    typeactivity: activity.value,
    additionalactivity: aditionalActivity.value,
    otheractivity: otheractivity.value,
    tstart: tstart.value,
    tend: tend.value,
    hours: quantityOfHours.value,
    days: selectDays.value,
    justification: justification.value,
    fstart: fStart.value,
    fend: fEnd.value,
  };

  dataSchedule.events = diasProgramados.value;

  await put("/othersschedules/update/" + idSchedule.value, dataSchedule);
  notifySuccessRequest("Programación actualizada correctamente");
  loading.value = false;
  clearFields();
  $router.back();

  loading.value = false;
}

const clearDataCalender = () => {
  calendarOptions.value.events = [];
  diasProgramados.value = [];
};

function filterInstru(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptionsInstru.value = optionsInstructors.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}
</script>

<style>
.save_as {
  background-color: var(--color_button) !important;
  color: var(--color_text_button) !important;
}

.previ {
  background-color: var(--color_button) !important;
  color: var(--color_text_button) !important;
}

.customRow {
  display: grid;
  grid-template-columns: repeat(2, 30% 70%);
}

@media screen and (max-width: 1200px) {
  .customRow {
    display: grid;
    grid-template-columns: auto;
  }
}

.card_header {
  background-color: var(--color_card);
  color: var(--color_text_card);
}

.my-tooltip {
  background-color: var(--color_tooltip);
}

.fc .fc-deleteEvent-button {
  background: url(/icon/delete1.png) no-repeat center center;
  background-size: 25px;
  border-color: rgb(42, 60, 80);
  border-radius: 50%;
  margin-left: 2px;
  width: 45px;
  height: 45px;
  position: relative;
}

.fc .fc-deleteEvent-button:hover {
  background: url(/icon/delete2.png) no-repeat center center;
  background-color: rgb(42, 60, 80);
}

.fc .fc-deleteEvent-button::after {
  /* insertar el texto e icono */
  background: url(/icon/delete1.png) no-repeat center center;
  font-size: 14px;
}

.fc .fc-deleteEvent-button:hover::after {
  content: "Arrastra un evento";
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 5px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
  animation: fadeIn 0.5s ease-in-out forwards;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }

  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
