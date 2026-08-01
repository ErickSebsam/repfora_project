<template>
  <q-card class="">
    <q-bar class="bg-green-9">
      <q-space />
      <q-btn
        dense
        round
        icon="close"
        color="white"
        class="text-green-9"
        v-close-popup
      >
        <q-tooltip class="bg-white text-green-9">Cerrar</q-tooltip>
      </q-btn>
    </q-bar>

    <q-card-section class="justify-center flex">
      <div class="text-title text-black text-bold" style="font-size: 30px">
        Aplazamientos
      </div>
    </q-card-section>
    <q-card-section class="justify-center row">
      <q-table
        class="full-width q-mx-md my-sticky-header-table"
        style="height: 62vh"
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
        selection="multiple"
        v-model:selected="selected"
        row-key="_id"
        :selected-rows-label="getSelectedString"
      >
        <template v-slot:body-cell-options="props">
          <q-td :props="props">
            <div>
              <q-btn
                round
                icon="start"
                class="q-mx-sm"
                size="xs"
                color="cyan-8"
                @click="showDialogProcess(props.row._id)"
              >
                <q-tooltip class="bg-blue-grey-1 text-green-9"
                  >Proceso</q-tooltip
                >
              </q-btn>
              <q-btn
                round
                icon="edit"
                size="xs"
                color="green-10"
                @click="showInfo(props.row)"
              >
                <q-tooltip class="bg-blue-grey-1 text-green-9"
                  >Editar</q-tooltip
                >
              </q-btn>
              <q-btn
                v-if="props.row.status === 1"
                round
                size="xs"
                class="q-mx-sm"
                color="green-10"
                @click="activarInactivarNew(props.row)"
                ><span
                  class="material-symbols-outlined"
                  style="font-size: 18px"
                >
                  check
                </span>

                <q-tooltip class="bg-blue-grey-1 text-green-9"
                  >Activar</q-tooltip
                >
              </q-btn>
              <q-btn
                v-else
                class="q-mx-sm"
                round
                size="xs"
                color="red"
                @click="activarInactivarNew(props.row)"
                ><span
                  class="material-symbols-outlined"
                  style="font-size: 18px"
                >
                  close
                </span>
                <q-tooltip class="bg-blue-grey-1 text-green-9"
                  >Inactivar</q-tooltip
                >
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section class="justify-center flex">
      <q-btn
        v-if="selected.length > 0"
        color="green-9"
        label="Migrar Noveades"
        @click="upgradeNews"
      />
    </q-card-section>
  </q-card>
</template>
  
<script setup>
import { ref, computed, defineProps, onBeforeMount, watch } from "vue";
import { put } from "../../services/api.js";
import { notifySuccessRequest } from "../../common/notify.js";
import { useQuasar } from "quasar";

const $q = useQuasar();

const props = defineProps({
  activarDesactivar: {
    type: Function,
    required: true,
  },
  showInfo: {
    type: Function,
    required: true,
  },
  dataPostponed: {
    type: Array,
    required: true,
  },
  showDialogProcess: {
    type: Function,
    required: true,
  },
  showDialogPostpone: {
    type: Function,
    required: true,
  },
});

watch(
  () => props.dataPostponed,
  (newVal, oldVal) => {
    rows.value = newVal;
  }
);

let selected = ref([]);
let rows = ref([]);

const columns = ref([
  {
    name: "acta",
    label: "NUMERO DE ACTA",
    field: "acta",
    align: "center",
    sortable: true,
  },
  {
    name: "document",
    label: "NUMERO DE DOCUMENTO",
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
    label: "CORREO ELECTRONICO",
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
    name: "statusnew",
    label: "ESTADO",
    field: "state",
    align: "state",
    sortable: true,
  },
  {
    name: "dateregister",
    label: "FECHA DE REGISTRO",
    field: (row) => row.createdAt?.split("T")[0],
    align: "center",
    sortable: true,
    sort: (a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    },
  },
  { name: "options", label: "OPCIONES", align: "center" },
]);

onBeforeMount(async () => {
  rows.value = props.dataPostponed;
});

async function activarInactivarNew(row) {
  await props.activarDesactivar(row);
}

async function upgradeNews() {
  $q.loading.show({
    message: "Actualizando novedades, espere por favor...",
  });

  await put("/news/upgradepostpone", {
      news: selected.value.map((item) => item._id),
    })
    .then((res) => {
      if (res) {
        notifySuccessRequest("Novedades actualizadas correctamente");
          props.showDialogPostpone(true);
      }
    });

  $q.loading.hide();
}
</script>
    
    
    <style scoped>
</style>
    