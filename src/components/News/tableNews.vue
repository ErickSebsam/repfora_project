<template>
  <div class="q-mb-md row justify-center flex ">
    <div class="col-12 justify-center flex">
      <q-table
        class="full-width my-sticky-header-table"
        style="height: 62vh"
        flat
        bordered
        no-data-label="Sin registros"
        :rows="rows"
        :columns="columns"
        rows-per-page-label="Numero de documentos"
        :pagination="{
          rowsPerPage: 30,
        }"
      >
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
        <!-- <template v-slot:body-cell-instructor="props" v-if="role!=='USER'">
          <q-td :props="props">
            {{ !row.instructor?.name?'N/A':row.instructor?.name.toUpperCase() }}
          </q-td>
        </template> -->
        <template v-slot:body-cell-instructor="props">
          <q-td :props="props">
            <div>
              <span > 
                {{ !props.row.instructor?.name ? "N/A" : props.row.instructor?.name.toUpperCase() }}
              </span>
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-options="props">
          <q-td :props="props">
            <div>
              <q-btn
                round
                icon="image_search"
                class="q-mr-sm"
                size="xs"
                color="cyan-10"
                @click="
                  props.row.img ? showImg(props.row) : showMsgNotImg(props.row)
                "
              >
                <q-tooltip class="bg-blue-grey-1 text-green-9"
                  >Evidencia</q-tooltip
                >
              </q-btn>
              <q-btn
                round
                icon="start"
                class="q-mr-sm"
                size="xs"
                color="cyan-8"
                @click="showDialogProcess(props.row._id)"
                v-if="role !== 'USER'"
              >
                <q-tooltip class="bg-blue-grey-1 text-green-9"
                  >Proceso</q-tooltip
                >
              </q-btn>
              <q-btn
                round
                icon="edit"
                size="xs"
                class="q-mr-sm"
                color="green-10"
                @click="showInfo(props.row)"
                v-if="
                  (props.row.state == 'REGISTRADA' && role == 'USER') ||
                  role == 'COORDINADOR' ||
                  role == 'NOVEDADES'
                "
              >
                <q-tooltip class="bg-blue-grey-1 text-green-9"
                  >Editar</q-tooltip
                >
              </q-btn>
              <q-btn
                v-if="role !== 'USER' && props.row.status === 1"
                round
                size="xs"
                class="q-mr-sm"
                color="green-10"
                @click="activarDesactivar(props.row)"
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
                v-if="
                  role !== 'USER' &&
                  props.row.status === 0 &&
                  props.row.processed === false
                "
                class="q-mr-sm"
                round
                size="xs"
                color="red"
                @click="activarDesactivar(props.row)"
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
    </div>
    <q-dialog v-model="showDialogImg">
      <DialogImg :img="img" />
    </q-dialog>
  </div>
</template>
  
  <script setup>
import { ref, computed, defineProps, onBeforeMount, watch } from "vue";
import { useQuasar } from "quasar";
import DialogImg from "./dialogImg.vue";
import { storeUser } from "../../store/users.js";

const userStore = storeUser();
const $q = useQuasar();

let role = ref(userStore.getRole());



const props = defineProps({
  dataTable: {
    type: Array,
    required: true,
  },
  activarDesactivar: {
    type: Function,
    required: true,
  },
  showInfo: {
    type: Function,
    required: true,
  },
  showDialogProcess: {
    type: Function,
    required: true,
  },
});

let rows = ref(props.dataTable);
let showDialogImg = ref(false);
let img = ref();

watch(
  () => props.dataTable,
  (value) => {
    rows.value = value;
  }
);
console.log(rows.value);

const columns = ref([
  {
    name: "acta",
    label: "NUMERO DE ACTA",
    field: "acta",
    align: "center",
    sortable: true,
  },
  {
    name: "datecreated",
    label: "FECHA DE CREACION",
    field: (row) => row.createdAt?.split("T")[0],
    align: "center",
    sortable: true,
  },
  {
    name: "typenew",
    label: "TIPO DE NOVEDAD",
    field: "tpnew",
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
    label: "NOMBRE APRENDIZ",
    field: "name",
    align: "center",
    sortable: true,
  },
  {
    name: "instructor",
    label: "INSTRUCTOR",
    field: (row) => row.instructor.name,
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
    field: (row) =>
      row.tpnew == "DESERCIÓN"
        ? row.createdAt?.split("T")[0]
        : row.datesofia?.split("T")[0],
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
  { name: "options", label: "OPCIONES", align: "center" },
]);

function showMsgNotImg(file) {
  console.log(file);
  $q.notify({
    color: "red-10",
    textColor: "white",
    icon: "warning",
    position: "top",
    message: "No hay imagen para mostrar",
  });
}

function showImg(row) {
  console.log(row);
  img.value = row.img;
  showDialogImg.value = true;
}
</script>
  
  
  <style scoped>
</style>
  