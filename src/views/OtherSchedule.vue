<template>
  <div>
    <BtnBack route="/homeSchedules" />
    <HeaderLayout title="Otros Horarios" />
    <div class="row justify-around">
      <div class="col-sm-3 col-12 items-center flex "
      :class="$q.screen.width < 600 ? 'justify-center' : ''"
      >
        <q-btn class="bg-green-9 text-white" to="/newOtherSchedule"
          ><span
            class="material-symbols-outlined q-mr-sm"
            style="font-size: 20px"
          >
            add_circle
          </span>
          Crear
        </q-btn>
      </div>
      <div class="col-sm-3 col-12 q-mt-md justify-center"
      :class="$q.screen.width < 600 && 'q-px-lg'"
      >
        <q-select
          :label="!isLoadingInstructor ? 'Instructor' : 'Cargando...'"
          v-model="instructorSelected"
          :options="filterOptionsInstructor"
          :disable="isLoadingInstructor"
          dense
          filled
          hide-selected
          outlined
          options-dense
          use-input
          fill-input
          input-debounce="0"
          @filter="filterInstructor"
          :rules="[
            (val) =>
              ((val) => val !== null && val !== '') || 'El campo es requerido',
          ]"
          @update:model-value="searchOtherSchedule()"
        />
      </div>
      <div
        class="col-sm-1 col-12  justify-center flex q-mt-md"
        v-if="isLoadingData"
      >
        <q-spinner color="green-9" size="2em" :thickness="8" />
      </div>
    </div>
    <!-- TABLE INFO -->
    <div class="row q-mt-md justify-center flex">
      <div class="col-11 q-mb-lg">
        <q-table
          class="q-mx-md"
          flat
          bordered
          :rows="rows"
          :columns="columns"
          row-key="index"
        >
          <template v-slot:body-cell-justification="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip v-if="props.value.length > 20" max-width="350px">
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
                  :to="`/editOtherSchedule/${props.row._id}`"
                />
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
    </div>

    <div class="row">
      <div class="col-12">
        <Calander />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount, ref } from "vue";
import {useQuasar} from "quasar";
import { get, put } from "../services/api.js";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";
import Calander from "../components/PlanningCalendar/ScheduleCalendar.vue";

const $q = useQuasar();
let instructorSelected = ref("");
let isLoadingInstructor = ref(true);
let isLoadingData = ref(false);
let optionsInstructor = ref([]);
let filterOptionsInstructor = ref([]);
let rows = ref();

onBeforeMount(async () => {
  await getInstructors();
});

const getInstructors = async () => {
  isLoadingInstructor.value = true;
  const res = await get("/instructors?status=0");

  res.forEach((row, index) => {
    optionsInstructor.value.push({ label: row.name, value: row });
    filterOptionsInstructor.value = optionsInstructor.value;
  });
  isLoadingInstructor.value = false;
};

const searchOtherSchedule = async () => {
  isLoadingData.value = true;

  rows.value = await get(
    `/othersschedules/instructor/${instructorSelected.value.value._id}`
  );

  isLoadingData.value = false;
};

let columns = ref([
  {
    name: "instructor",
    label: "INSTRUCTOR",
    field: (row) => row.instructor.name,
    align: "center",
    sortable: true,
  },

  {
    name: "typeactivity",
    label: "TIPO DE ACTIVIDAD",
    field: (row) => row.typeactivity,
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "additionalactivity",
    label: "ACTIVIDAD ADICIONAL",
    field: (row) => row.additionalactivity,
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
  },
  {
    name: "hours",
    label: "HORAS",
    field: (row) => Math.round(row.hourswork),
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "justification",
    label: "JUSTIFICACIÓN",
    field: (row) => row.justification,
    align: "center",
    style:
      "max-width: 150px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
  },
  {
    name: "fstart",
    label: "FECHA INICIAL",
    field: (row) => (row.fstart ? row.fstart.split("T")[0] : ""),
    align: "center",
    sortable: true,
  },
  {
    name: "fend",
    label: "FECHA FINAL",
    field: (row) => (row.fend ? row.fend.split("T")[0] : ""),
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
  {
    name: "options",
    label: "OPCIONES",
    align: "center",
  },
]);

function filterInstructor(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptionsInstructor.value = optionsInstructor.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

async function activarDesactivar(data) {
  console.log(data);
  
  if (data.status === 0) {
    await put(`/othersschedules/inactive/${data._id}`, null);

    await searchOtherSchedule();
  } else {
    await put(`/othersschedules/active/${data._id}`, null);

    await searchOtherSchedule();
  }
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

.my_card {
  color: var(--color_text_card);
}

.card_header {
  background-color: var(--color_card);
}

.button_closed {
  color: var(--color_button_closed);
}

/* .textTable {
} */
</style>
