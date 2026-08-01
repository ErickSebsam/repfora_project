<template>
  <div class="col-12 row">
    <div
      class="justify-center flex items-center titleReport"
      :class="props.dataReport.showDialog == true ? 'col-12' : 'col-7'"
    >
      Reporte De Horas Programadas
      {{ props.form.type == "TODOS" ? "" : props.form.type.value }}
      {{ props.form.fstart }} - {{ props.form.fend }}
    </div>
    <div class="col-5 flex" v-if="props.dataReport.showDialog == false">
      <q-btn
        type="button"
        class="q-mt-md q-mb-sm"
        @click="props.dialogInfo(true)"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 22px"
        >
          visibility </span
        >Maximizar</q-btn
      >
      <q-btn
        type="button"
        class="q-mt-md q-mb-sm q-mx-sm"
        @click="props.generateExcel()"
        color="green-8"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 22px"
        >
          export_notes </span
        >Excel</q-btn
      >
    </div>
    <div class="col-12">
      <q-table
        class="full-width q-mx-md my-sticky-header-table"
        :style="
          props.dataReport.showDialog == true ? 'height: 74vh' : 'height: 58vh'
        "
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
      </q-table>
    </div>
    <div v-if="props.dataReport.showDialog" class="col-12 justify-center flex">
      <q-btn
        type="button"
        class="q-mt-md q-mb-sm q-mx-sm"
        @click="props.generateExcel()"
        color="green-8"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 22px"
        >
          export_notes </span
        >Excel</q-btn
      >
    </div>
  </div>
</template>
    <script setup>
import { ref, defineProps } from "vue";

const props = defineProps({
  dataReport: {
    type: Object,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
  dialogInfo: {
    type: Function,
    default: () => {},
  },
  generateExcel: {
    type: Function,
    default: () => {},
  },
});

let rows = ref(props.dataReport.dataHoursIns);

let columns = ref([
  {
    name: "name",
    label: "NOMBRE INSTRUCTOR",
    field: "name",
    align: "center",
    sortable: true,
  },
  {
    name: "document",
    label: "DOCUMENTO",
    field: "document",
    align: "center",
    sortable: true,
  },
]);

props.dataReport.months.forEach((element) => {
  columns.value.push({
    name: element.concat,
    label: element.concat,
    field: (row) => {
      let hours = 0;
      row.months.forEach((element2) => {
        if (element2.concat == element.concat) {
          hours = element2.hours;
        }
      });
      return hours;
    },
    align: "center",
    sortable: true,
  });
});
</script>