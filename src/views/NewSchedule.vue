<template>
  <div class="customRow">
    <div id="formHour">
      <div class="row justify-center flex">
        <div class="col-md-11 col-sm-6 col-11">
          <q-card class="my_card full-width q-my-lg" flat>
            <div class="q-pa-md">
              <q-card-section class="card_header q-mb-md">
                <BtnBack route="/schedules" />
                <h5 class="q-mt-sm q-mb-sm text-center text-weight-bold">
                  DILIGENCIA LA INFORMACIÓN
                </h5>
              </q-card-section>

              <q-form
                ref="formCalender"
                @submit.prevent.stop="validateInfo"
                novalidate
              >
                <div>
                  <q-select
                    :label="!isLoadingFiche ? 'Ficha' : 'Cargando...'"
                    v-model="fiche"
                    :options="filterOptionsFiche"
                    :disable="isLoadingFiche || isEdit"
                    dense
                    use-input
                    input-debounce="0"
                    options-dense
                    @filter="filterFiche"
                    @update:model-value="setProgram(fiche)"
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.toString().trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined">
                        workspaces
                      </span>
                    </template>
                  </q-select>

                  <q-select
                    type="text"
                    v-model="program"
                    options-dense
                    dense
                    class="q-mb-sm"
                    label="Programa"
                    disable
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> list </span>
                    </template>
                  </q-select>

                  <q-select
                    :label="
                      !isLoadingCom || competence
                        ? 'Competencia'
                        : 'Cargando...'
                    "
                    v-model="competence"
                    options-dense
                    dense
                    :disable="isLoadingCom && !competence"
                    :options="filterOptionsComp"
                    use-input
                    input-debounce="0"
                    @filter="filterCompe"
                    @update:model-value="
                      getResults();
                      clearDataCalender();
                    "
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.toString().trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> checklist </span>
                    </template>
                  </q-select>

                  <q-select
                    :label="
                      !isLoadingRes || result ? 'Resultado' : 'Cargando...'
                    "
                    options-dense
                    dense
                    :disable="isLoadingRes && !result"
                    v-model="result"
                    :options="filterOptionsResult"
                    use-input
                    input-debounce="0"
                    @filter="filterResult"
                    @update:model-value="clearDataCalender()"
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.toString().trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined">
                        background_dot_large
                      </span>
                    </template>
                  </q-select>

                  <q-select
                    label="Instructor"
                    options-dense
                    dense
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
                    @update:model-value="
                      getInstructors();
                      clearDataCalender();
                    "
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> person </span>
                    </template>
                  </q-select>

                  <q-input
                    type="text"
                    v-model="supporttext"
                    label="Nota"
                    dense
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> edit_note </span>
                    </template>
                  </q-input>

                  <q-input
                    type="text"
                    v-model="observation"
                    label="Observación"
                    dense
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined"> note_alt </span>
                    </template>
                  </q-input>

                  <q-select
                    label="Ambiente"
                    options-dense
                    dense
                    v-model="environment"
                    :options="filterOptionsEnvi"
                    use-input
                    input-debounce="0"
                    @filter="filterEnvir"
                    @update:model-value="
                      getResults();
                      clearDataCalender();
                    "
                    lazy-rules
                    :rules="[
                      (val) =>
                        (val && val.toString().trim().length > 0) ||
                        'El campo es requerido',
                    ]"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined">
                        diversity_2
                      </span>
                    </template>
                  </q-select>

                  <q-input
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

                  <q-input
                    v-model="timeStart"
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
                    v-model="timeEnd"
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
                      :loading="loadingPrev"
                      :disable="loadingPrev"
                      class="previ q-mt-md q-mb-sm q-mx-sm"
                    >
                      <template v-slot:loading>
                        <q-spinner-oval color="white" size="1em" />
                      </template>
                      <span
                        class="material-symbols-outlined q-mr-sm"
                        style="font-size: 20px"
                      >
                        calendar_month
                      </span>
                      PREVISUALIZAR
                    </q-btn>
                    <q-btn
                      type="button"
                      class="q-mt-md q-mb-sm q-mx-sm button_closed"
                      to="/schedules"
                      v-close-popup
                    >
                      <span
                        class="material-symbols-outlined q-mr-sm"
                        style="font-size: 23px"
                      >
                        cancel
                      </span>
                      CERRAR
                    </q-btn>
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
                  class="justify-center col-9 col-md-10 col-xl-11 items-center customEvents"
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
              :disable="loading"
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

let formCalender = ref();
let fiche = ref("");
let program = ref("");
let competence = ref();
let result = ref();
let instructor = ref();
let supporttext = ref();
let observation = ref();
let environment = ref();
let fStart = ref();
let fEnd = ref();
let timeStart = ref();
let timeEnd = ref();
let selectDays = ref([]);
let optionsFiches = ref([]);
let optionsCompetences = ref([]);
let optionsResult = ref([]);
let optionsInstructors = ref([]);
let optionsEnvironment = ref([]);
let diasProgramados = ref([]);
let isEdit = ref(false);
let isLoadingFiche = ref(true);
let isLoadingCom = ref(true);
let isLoadingRes = ref(true);
let idSchedule = ref(null);
let filterOptionsFiche = ref([]);
let filterOptionsInstru = ref([]);
let filterOptionsComp = ref([]);
let filterOptionsEnvi = ref([]);
let filterOptionsResult = ref([]);
let loading = ref(false);
let loadingPrev = ref(false);

onBeforeMount(async () => {
  //capturar el params de la url
  idSchedule.value = $router.currentRoute.value.params.id;
  if (idSchedule.value) {
    isEdit.value = true;
    const data = await get("/schedules/" + idSchedule.value);

    fiche.value = {
      label: `${data.fiche.number} - ${data.program.name}`,
      value: data.fiche,
    };

    program.value = {
      label: `${data.program.code} - ${data.program.name}`,
      value: data.program._id,
    };

    competence.value = {
      label: `${data.competence.number} - ${data.competence.name}`,
      value: data.competence._id,
    };

    result.value = {
      label: `${data.outcome.code} - ${data.outcome.outcomes}`,
      value: data.outcome._id,
    };

    instructor.value = {
      label: data.instructor.name,
      value: data.instructor._id,
    };

    environment.value = {
      label: data.environment.name,
      value: data.environment._id,
    };

    supporttext.value = data.supporttext;
    observation.value = data.observation;

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
    timeStart.value = data.tstart;
    timeEnd.value = data.tend;

    //timeout para que se cargue el calendario y se pueda mostrar los dias programados
    setTimeout(() => {
      diasProgramados.value = data.events;
      calendarOptions.value.events = diasProgramados.value;
    }, 100);
    await getCompetence();
    await getResults();
  }

  await getFiches();
  await getInstructors();
  await getEnvironments();
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
  loadingPrev.value = true;

  const data = {
    fiche: fiche.value.value._id,
    instructor: instructor.value.value,
    fstart: fStart.value,
    fend: fEnd.value,
    tstart: timeStart.value,
    tend: timeEnd.value,
    days: selectDays.value,
    environment: environment.value.value,
    program: program.value.value,
    outcome: result.value.value,
    competence: competence.value.value,
  };

  if (idSchedule.value) {
    const res = await postRaw(
      "/schedules/validateeditschedule/" + idSchedule.value,
      data
    );
    if (res.data.msg) {
      if (res.data.msg.errorSchedule)
        notifyWarningRequest(res.data.msg.errorSchedule);
      if (res.data.msg.errorEnvirontment)
        notifyWarningRequest(res.data.msg.errorEnvirontment);
    }
    if (res.data) {
      diasProgramados.value = res.data.events;
      calendarOptions.value.events = res.data.events;
    }
  } else {
    const res = await postRaw("/schedules/validateschedule", data);
    if (res.data.msg) {
      if (res.data.msg.errorSchedule)
        notifyWarningRequest(res.data.msg.errorSchedule);
      if (res.data.msg.errorEnvirontment)
        notifyWarningRequest(res.data.msg.errorEnvirontment);
    }
    if (res.data) {
      diasProgramados.value = res.data.events;
      calendarOptions.value.events = res.data.events;
    }
  }
  loadingPrev.value = false;
}

function setProgram(info) {
  program.value = {
    label: `${info.value.program.code} - ${info.value.program.name}`,
    value: info.value.program._id,
  };
  getCompetence();
}

async function getCompetence() {
  optionsCompetences.value = [];
  isLoadingCom.value = true;
  const data = await get(
    "/competences/program/" + program.value.value
  );
  data.forEach((row, index) => {
    optionsCompetences.value.push({
      label: `${row.number} - ${row.name}`,
      value: row._id,
    });
    filterOptionsComp.value = optionsCompetences.value;
  });
  isLoadingCom.value = false;
}

async function getResults() {
  optionsResult.value = [];
  isLoadingRes.value = true;
  const data = await get(
    "/outcomes/competence/" + competence.value.value
  );

  data[0].outcomes.forEach((row, index) => {
    optionsResult.value.push({
      label: `${row.code} - ${row.outcomes}`,
      value: row._id,
    });
    filterOptionsResult.value = optionsResult.value;
  });
  isLoadingRes.value = false;
}

async function getFiches() {
  optionsFiches.value = [];
  isLoadingFiche.value = true;
  const data = await get("/fiches?status=0");
  data.forEach((row, index) => {
    optionsFiches.value.push({
      label: `${row.number} - ${row.program.name}`,
      value: row,
    });
    filterOptionsFiche.value = optionsFiches.value;
  });
  isLoadingFiche.value = false;
}

async function getInstructors() {
  optionsInstructors.value = [];
  const data = await get("/instructors?status=0");
  data.forEach((row, index) => {
    optionsInstructors.value.push({ label: row.name, value: row._id });
    filterOptionsInstru.value = optionsInstructors.value;
  });
}

async function getEnvironments() {
  optionsEnvironment.value = [];
  const data = await get("/environments?status=0");
  data.forEach((row, index) => {
    optionsEnvironment.value.push({ label: row.name, value: row._id });
    filterOptionsEnvi.value = optionsEnvironment.value;
  });
}

function clearFields() {
  fiche.value = null;
  program.value = null;
  competence.value = null;
  result.value = null;
  instructor.value = null;
  supporttext.value = null;
  observation.value = null;
  environment.value = null;
  fStart.value = null;
  fEnd.value = null;
  timeStart.value = null;
  timeEnd.value = null;

  calendarOptions.value.events = [];
  diasProgramados.value = [];
  selectDays.value = [];
  formCalender.value.resetValidation();
  loading.value = false;
}

async function saveData() {
  loading.value = true;

  let dataShedule = {
    fiche: fiche.value.value._id,
    program: program.value.value,
    competence: competence.value.value,
    outcome: result.value.value,
    instructor: instructor.value.value,
    supporttext: supporttext.value,
    observation: observation.value,
    environment: environment.value.value,
    days: selectDays.value,
    fstart: fStart.value,
    fend: fEnd.value,
    tstart: timeStart.value,
    tend: timeEnd.value,
  };

  dataShedule.events = diasProgramados.value;

  await post("/schedules/register", dataShedule);
  notifySuccessRequest("Programación guardada correctamente");
  clearFields();
  loading.value = false;
}

async function updateData() {
  loading.value = true;

  let dataSchedule = {
    fiche: fiche.value.value._id,
    competence: competence.value.value,
    outcome: result.value.value,
    supporttext: supporttext.value,
    observation: observation.value,
    instructor: instructor.value.value,
    environment: environment.value.value,
    days: selectDays.value,
    fstart: fStart.value,
    fend: fEnd.value,
    tstart: timeStart.value,
    tend: timeEnd.value,
  };

  dataSchedule.events = diasProgramados.value;

  await put("/schedules/update/" + idSchedule.value, dataSchedule);
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

function filterFiche(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptionsFiche.value = optionsFiches.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterInstru(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsInstru.value = optionsInstructors.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterCompe(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsComp.value = optionsCompetences.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterEnvir(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptionsEnvi.value = optionsEnvironment.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterResult(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptionsResult.value = optionsResult.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}
</script>

<style>
.roundedIcon {
  background-color: white;
  border-radius: 50%;
}

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
