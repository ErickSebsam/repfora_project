<template>
  <q-card-section class="header text-white text-center">
    <div class="text-h6">APRENDICES FICHA : {{ fiche }}</div>
  </q-card-section>

  <q-card-section class="text-center q-py-none q-my-none">
    <q-item class="q-ma-none q-pa-none">
      <q-item-section class="q-ma-none q-pa-none">
        <q-item-label class="q-ma-none q-pa-none" caption
          >COMPETENCIA</q-item-label
        >
      </q-item-section>
      <q-item-section class="q-ma-none q-pa-none">
        <q-item-label class="q-ma-none q-pa-none" caption
          >RESULTADO</q-item-label
        >
      </q-item-section>
    </q-item>
    <q-item class="q-ma-none q-pa-none">
      <q-item-section class="q-ma-none q-pa-none">
        <q-item-label class="q-ma-none q-pa-none" caption>{{
          competence
        }}</q-item-label>
      </q-item-section>
      <q-item-section class="q-ma-none q-pa-none">
        <q-item-label class="q-ma-none q-pa-none" caption>{{
          outcome
        }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-card-section>
  <q-separator />

  <q-table
    class="my-sticky-header-table text-center"
    flat
    bordered
    :rows="listStudents"
    :columns="columns"
    :rows-per-page-options="[0]"
    hide-bottom
    separator="none"
  />

  <q-separator />

  <q-card-actions align="center">
    <q-btn
      class="save_as"
      label="CERRAR"
      v-close-popup
      @click="props.closeDialog"
    />
  </q-card-actions>
</template>
  
  
<script setup>
import { ref, defineProps } from "vue";

const props = defineProps({
  closeDialog: Function,
  fiche: String,
  competence: String,
  outcome: String,
  listStudents: Array,
});

let columns = ref([
  {
    name: "name",
    label: "TIPO - DOCUMENTO",
    field: (row) => row.tpdocument + " - " + row.numdocument,
    align: "center",
    sortable: true,
  },
  {
    name: "name",
    label: "NOMBRE",
    field: (row) => row.name + " " + row.lastname,
    align: "center",
    sortable: true,
  },
  {
    name: "status",
    label: "ESTADO",
    field: "status",
    align: "center",
    sortable: true,
  },
  {
    name: "news",
    label: "NOVEDADES",
    // row: {
    //   aproved: [],
    //   pending: [],
    // }

    //unir los dos arreglos en uno solo
    field: (row) => {
      let newsStudent = row.newsStudent.map((item) => item);
      let improvementStudent = row.improvementStudent.map((item) => item);
      let news = newsStudent.concat(improvementStudent);

      return news.map((item) => item.code + " - " + item.tpnew).join(",\n ");
    },
    align: "center",
    sortable: true,
  },
]);
</script>

<style scoped>
.header {
  background-color: var(--color_header);
}
</style>
  