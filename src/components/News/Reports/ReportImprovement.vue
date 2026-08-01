<template>
  <div class="col-12 row">
    <div
      class="justify-center flex items-center titleReport"
      :class="props.dataReport.showDialog == true ? 'col-12' : 'col-7'"
    >
      Planes de Mejoramiento (
        {{ props.form.fstart?.split("T")[0] ?? "" }} - 
        {{ props.form.fend?.split("T")[0] ?? "" }}
      )
    </div>
    <div class="col-3" v-if="props.dataReport.showDialog == false">
      <q-btn
        type="button"
        class="q-mt-md q-mb-sm q-mx-sm"
        @click="dialogInfo(true)"
        ><span
          class="material-symbols-outlined q-mr-sm"
          style="font-size: 23px"
        >
          visibility </span
        >Maximizar</q-btn
      >
    </div>
    <div class="col-12">
      <q-table
        class="full-width q-mx-md my-sticky-header-table"
        :style="
          props.dataReport.showDialog == true ? 'height: 83vh' : 'height: 58vh'
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
});
let rows = ref(props.dataReport.dataImprovement);
let columns = ref([
{
    name: "acta",
    label: "ACTA",
    field: "acta",
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
    name: "email",
    label: "CORREO",
    field: "email",
    align: "center",
    sortable: true,
  },
  {
    name: "fiche",
    label: "FICHA",
    field: (row) => row.fiche?.number,
    align: "center",
    sortable: true,
  },
  {
    name: "fend",
    label: "FECHA DE ENTREGA",
    field: (row) => row.fend?.split("T")[0] ?? "",
    align: "center",
    sortable: true,
  },
  {
    name: "tramit",
    label: "TRAMITADOR",
    field: (row) => row.createdBy?.name ?? "",
    align: "center",
    sortable: true,
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
  },
  {
    name: "competence",
    label: "COMPETENCIA",
    field: (row) => row.competence?.name ?? "",
    align: "center",
    sortable: true,
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
  },
  {
    name: "outcome",
    label: "RESULTADO",
    field: (row) => row.outcome?.outcomes ?? "",
    align: "center",
    sortable: true,
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
  },
  { name: "options", label: "OPCIONES", align: "center" },
]);
</script>