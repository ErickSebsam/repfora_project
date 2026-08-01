<template>
  <div class="q-mb-md row justify-center flex" v-if="props.existInfo">
    <div class="col-12 q-mt-md text-center text-h4 q-mb-md">Formación</div>

    <div class="col-11 justify-center flex">
      <q-table
        style="width: 90vw !important"
        :style="props.print ? 'width: 1300px !important;' : ''"
        flat
        bordered
        no-data-label="Sin registros"
        :rows="rows"
        :columns="columns"
        rows-per-page-label="Numero de documentos"
        :rows-per-page-options="[0]"
        :pagination="{
          rowsPerPage: 0,
        }"
        hide-bottom
      >
        <template v-slot:body-cell-title="props">
          <td>
            <q-chip
              v-if="props.row.fiche"
              :style="{
                backgroundColor: props.row.backgroundColor,
                color: props.row.textColor,
                borderColor: props.row.borderColor,
              }"
              class="q-ma-sm"
            >
              {{ props.row.fiche }}
            </q-chip>
          </td>
        </template>
        <template v-slot:body-cell-hours="props">
          <td
            style="
              max-width: 150px;
              white-space: break-spaces;
              text-overflow: ellipsis !important;
              overflow: hidden;
              text-align: center;
            "
          >
            <span class="q-ma-sm">
              DE {{ props.row.tstart }} HASTA {{ props.row.tend }}
            </span>
          </td>
        </template>
        <template v-slot:body-cell-dates="props">
          <td
            style="
              max-width: 200px;
              white-space: break-spaces;
              text-overflow: ellipsis !important;
              overflow: hidden;
              text-align: center;
            "
          >
            <div
              v-for="(date, index) in props.row.dates"
              :key="index"
              class="q-ma-sm"
            >
              {{ date.nameMonth }}: {{ date.dates.join(", ") }}
              <br />
              <span class="text-bold">DEL {{ date.year }}</span>
            </div>
          </td>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, onBeforeMount } from "vue";
import { generateInfoFormated } from "../../../services/excelToReports.js";

const props = defineProps({
  events: {
    type: Object,
    required: true,
  },
  existInfo: {
    type: Boolean,
    required: true,
  },
  print: {
    type: Boolean,
    required: false,
  },
});

let rows = ref();

onBeforeMount(() => {
  let events = props.events || [];
  if (events) {
    events = Object.values(events);

    events = events.map((event) => {
      return event.filter((e) => e.type == 0);
    });

    events = events.flat();
  }

  rows.value = generateInfoFormated(events);
});

const columns = ref([
  {
    name: "title",
    label: "FICHA",
    field: (row) => row,
    align: "center",
    sortable: true,
    sort: (a, b) => {
      if (a.fiche < b.fiche) return -1;
      if (a.fiche > b.fiche) return 1;
      return 0;
    },
  },
  {
    name: "instructor",
    label: "INSTRUCTOR",
    field: "instructor",
    align: "center",
    style:
      "max-width: 150px; white-space: break-spaces; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "environment",
    label: "AMBIENTE",
    field: "environment",
    align: "center",
    style:
      "max-width:150px; white-space: break-spaces; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "program",
    label: "PROGRAMA",
    field: "program",
    align: "center",
    style:
      "max-width: 200px; white-space: break-spaces; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "competence",
    label: "COMPETENCIA",
    field: "competence",
    align: "center",
    style:
      "max-width: 200px; white-space: break-spaces; text-overflow: ellipsis !important;overflow: hidden;",
  },
  {
    name: "result",
    label: "RESULTADO",
    field: "outcome",
    align: "center",
    style:
      "max-width: 200px; white-space: break-spaces; text-overflow: ellipsis !important;overflow: hidden;",
  },
  {
    name: "note",
    label: "NOTA",
    field: "supporttext",
    align: "center",
    style:
      "max-width: 200px; white-space: break-spaces; text-overflow: ellipsis !important;overflow: hidden;",
  },
  {
    name: "result",
    label: "OBSERVACIÓN",
    field: "observation",
    align: "center",
    style:
      "max-width: 200px; white-space: break-spaces; text-overflow: ellipsis !important;overflow: hidden;",
  },

  {
    name: "hours",
    label: "HORARIO",
    field: (row) => row,
    align: "center",
  },
  {
    name: "dates",
    label: "FECHAS",
    field: (row) => row,
    align: "center",
  },
]);
</script>


<style scoped>
</style>
