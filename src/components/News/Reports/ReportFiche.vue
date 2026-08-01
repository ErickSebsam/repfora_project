<template>
  <div class="col-12 row">
    <div
      class="justify-center flex items-center titleReport"
      :class="props.dataReport.showDialog == true ? 'col-12' : 'col-7'"
    >
      {{ name }}
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
        v-if="rows.length > 0"
        type="button"
        class="q-mt-md q-mb-sm q-mx-sm"
        @click="props.generateExcel('fiche',name)"
        color="green-8"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 22px"
        >
          export_notes </span
        >Excel</q-btn
      >
      <q-btn
        v-if="rows.length > 0"
        type="button"
        class="q-mt-md q-mb-sm"
        @click="props.generatePdf('fiche',name)"
        color="red-8"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 22px"
        >
          picture_as_pdf </span
        >PDF</q-btn
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
        <template v-slot:body-cell-options="datatable">
          <q-td :props="datatable">
            <div>
              <q-btn
                round
                icon="sticky_note_2"
                size="xs"
                color="green-10"
                @click="props.generateExcel('fiche',name, datatable.row)"
              >
                <q-tooltip class="bg-blue-grey-1 text-green-9">EXCEL</q-tooltip>
              </q-btn>
              <q-btn
                round
                icon="picture_as_pdf"
                class="q-mx-sm"
                size="xs"
                color="red-8"
                @click="props.generatePdf('fiche',name, datatable.row)"
              >
                <q-tooltip class="bg-blue-grey-1 text-green-9">PDF</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </div>
    <div v-if="props.dataReport.showDialog" class="col-12 justify-center flex">
      <q-btn
        v-if="rows.length > 0"
        type="button"
        class="q-mt-md q-mb-sm q-mx-sm"
        @click="props.generateExcel('fiche',name)"
        color="green-8"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 22px"
        >
          export_notes </span
        >Excel</q-btn
      >
      <q-btn
        v-if="rows.length > 0"
        type="button"
        class="q-mt-md q-mb-sm"
        @click="props.generatePdf('fiche',name)"
        color="red-8"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 22px"
        >
          picture_as_pdf </span
        >PDF</q-btn
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
  generatePdf: {
    type: Function,
    default: () => {},
  },
  generateExcel: {
    type: Function,
    default: () => {},
  },
});
let rows = ref(props.dataReport.dataNewsFiche);
let name = ref(
  ` 
  ${props.form.fiche.label}
  `
);
//eliminar \n de la variable name
name.value = name.value.replace(/\n/g, "");
let columns = ref([
  {
    name: "code",
    label: "CÓDIGO",
    field: "code",
    align: "center",
    sortable: true,
  },
  {
    name: "fiche",
    label: "fiche",
    field: "fiche",
    align: "center",
    sortable: true,
  },
  {
    name: "tpnew",
    label: "TIPO DE NOVEDAD",
    field: "tpnew",
    align: "center",
    sortable: true,
  },
  {
    name: "subtpnew",
    label: "SUB NOVEDAD",
    field: (row) => {
      if (row.typetrasfer) {
        if (row.center) {
          return `${row.typetrasfer} - ${center} de ${row.city}`;
        } else if (row.workingday) {
          return `${row.typetrasfer} - ${row.workingday}`;
        } else {
          return `${row.typetrasfer}`;
        }
      }
      return "";
    },
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
  {
    name: "name",
    label: "NOMBRE",
    field: "name",
    align: "center",
    sortable: true,
  },
  {
    name: "status",
    label: "ESTADO",
    field: "state",
    align: "center",
    sortable: true,
  },
  {
    name: "dateproceded",
    label: "FECHA DE CIERRE",
    field: (row) => row.dateprocessed?.split("T")[0] ?? "",
    align: "center",
    sortable: true,
  },
  {
    name: "dateregister",
    label: "FECHA DE REGISTRO",
    field: (row) => row.createdAt?.split("T")[0],
    align: "center",
    sortable: true,
  },
  { name: "options", label: "OPCIONES", align: "center" },
]);
</script>