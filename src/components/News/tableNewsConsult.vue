<template>
  <div class="q-mb-md row justify-center flex">
    <div class="col-12 justify-center flex">
      <q-table
        class="full-width my-sticky-header-table"
        style="height: 62vh"
        flat
        bordered
        no-data-label="Sin registros"
        :rows="rows"
        :columns="columnsTable"
        rows-per-page-label="Numero de documentos"
        :pagination="{
          rowsPerPage: 30,
        }"
      >
        <template v-slot:body-cell-instructor="props" >
          <q-td :props="props">
            <div>
              <span>
                {{
                  !props.row.instructor?.name
                    ? "N/A"
                    : props.row.instructor?.name.toUpperCase()
                }}
              </span>
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-options="props" v-if="props.source=='news'">
          <q-td :props="props">
            <div>
              <q-btn
                v-if="source == 'news'"
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
              <span style="font-size: 15px" v-else> 🚫 </span>
              <q-tooltip class="bg-blue-grey-1 text-green-9"
                >Sin accion</q-tooltip
              >
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

console.log(role.value);

const props = defineProps({
  dataTable: {
    type: Array,
    required: true,
  },
  source: {
    type: String,
    requiered: true,
  },
});

let rows = ref(props.dataTable);
let showDialogImg = ref(false);
let img = ref();

watch(
  () => props.dataTable,
  (value) => {
    rows.value = value;
    console.log(rows.value);
  }
);
console.log(rows.value);



const columnsNews = ref([
  {
    name: "acta",
    label: "NUMERO DE ACTA",
    field: "acta",
    format: (val, row) => {
      // Aquí puedes controlar lo que se muestra
      if (val) {
        return val;
      }
      return "N/A"; // Valor por defecto si 'val' está vacío o nulo
    },
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
    // La propiedad `format` se encarga de formatear el valor final
    format: (val, row) => {
      // Aquí puedes controlar lo que se muestra
      if (val) {
        return val;
      }
      return "N/A"; // Valor por defecto si 'val' está vacío o nulo
    },
    align: "center",
    sortable: true,
  },
  {
    name: "dateregister",
    label: "FECHA DE REGISTRO",
    field: (row) => {
      if (row.tpnew == "DESERCIÓN") {
        return row.createdAt?.split("T")[0];
      } else {
        return row.datesofia?.split("T")[0];
      }
    },
    align: "center",
    sortable: true,
  },

  { name: "options", label: "OPCIONES", align: "center" },
]);

const columnsImprovements = ref([
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
    field: "status",
    // La propiedad `format` se encarga de formatear el valor final
    format: (val, row) => {
      // Aquí puedes controlar lo que se muestra
      if (val) {
        return val;
      }
      return "N/A"; // Valor por defecto si 'val' está vacío o nulo
    },
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
  {
    name: "dateend",
    label: "FECHA FINAL",
    field: (row) => row.fend?.split("T")[0],
    align: "center",
    sortable: true,
  }

]);

const columnsTable = computed(()=>{
  if (props.source=="news") {
    return columnsNews.value
  }else{
    return columnsImprovements.value
  }
}) 

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
  


<!-- const columnsNews = ref([
  {
    name: "acta",
    label: "NUMERO DE ACTA",
    field: "acta",
    format: (val, row) => {
      // Aquí puedes controlar lo que se muestra
      if (val) {
        return val;
      }
      return "N/A"; // Valor por defecto si 'val' está vacío o nulo
    },
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
    field: (row) => {
      // Aquí usamos la lógica del ternario para seleccionar el campo
      if (props.source === "news") {
        return row.state;
      }
      // Cuando es 'IMPROVEMENTS' (o cualquier otra cosa)
      return row.status;
    },
    // La propiedad `format` se encarga de formatear el valor final
    format: (val, row) => {
      // Aquí puedes controlar lo que se muestra
      if (val) {
        return val;
      }
      return "N/A"; // Valor por defecto si 'val' está vacío o nulo
    },
    align: "center",
    sortable: true,
  },
  {
    name: "dateregister",
    label: "FECHA DE REGISTRO",
    field: (row) => {
      if (props.source === "news") {
        if (row.tpnew == "DESERCIÓN") {
          return row.createdAt?.split("T")[0];
        } else {
          return row.datesofia?.split("T")[0];
        }
      } else {
        return row.createdAt?.split("T")[0];
      }
    },
    align: "center",
    sortable: true,
  },

  { name: "options", label: "OPCIONES", align: "center" },
]); -->