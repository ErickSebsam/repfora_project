<template>
  <div>
    <BtnBack route="/home" />

    <HeaderLayout
      :title="
        fileToUpload.value == 'INST'
          ? 'cargar instructores'
          : 'cargar competencias y resultados'
      "
    />

    <q-form
      ref="formUpload"
      @submit.prevent.stop="uploadFile()"
      class="row justify-center flex"
    >
      <div
        class="items-center flex q-mb-md"
        :class="
          fileToUpload.value == 'CYR'
            ? 'col-sm-4 col-10'
            : 'col-10 justify-center flex'
        "
      >
        <q-btn class="bg-green-9 text-white" @click="downloadTemplate()"
          ><span
            class="material-symbols-outlined q-mr-sm"
            style="font-size: 20px"
          >
            cloud_download
          </span>
          Descargar plantilla
        </q-btn>
      </div>

      <div class="col-sm-5 col-md-4 col-10" v-if="fileToUpload.value == 'CYR'">
        <q-select
          type="text"
          filled
          v-model="program"
          use-input
          options-dense
          :options="filterOptions"
          @filter="filterFn"
          label="Selecciona el programa"
          lazy-rules
          :rules="[
            (val) =>
              (val && val.toString().trim().length > 0) ||
              'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> list_alt </span>
          </template>
        </q-select>
      </div>

      <div class="col-12">
        <!-- 
            crear un componente para subir archivos con drag and drop -->
        <div class="row justify-center">
          <div
            class="drop-area col-sm-6 col-12 text-center full-height"
            :class="{ active: isActive }"
          >
            <h2 v-text="dragText"></h2>
            <span v-if="!fileUploaded">o</span>
            <q-btn type="button" @click="openFileInput">
              <span class="material-symbols-outlined q-mr-sm text-white">
                cloud_upload
              </span>
              {{ fileUploaded ? file.name : "Seleccionar archivo" }}
            </q-btn>
            <input
              type="file"
              ref="fileInput"
              @input="handleFileSelect"
              style="display: none"
              accept=".xlsx, .xls, .xlsm"
            />
          </div>
        </div>
      </div>

      <div class="col-12 text-center q-my-md">
        <q-btn
          type="submit"
          class="bg-green-9 text-white"
          :disable="!file || (fileToUpload.value == 'CYR' && !program)"
        >
          <span class="material-symbols-outlined q-mr-sm"> cloud_upload </span>
          Subir archivo
        </q-btn>
      </div>
    </q-form>
  </div>
  <q-dialog v-model="dialogSelectBulkload" persistent>
    <q-card>
      <q-card-section class="row items-center justify-center flex">
        <q-img src="/images/logo.png" style="width: 40px; height: 40px" />
      </q-card-section>
      <q-card-section class="row items-center">
        <q-select
          label="Archivo a cargar"
          v-model="fileToUpload"
          :options="[
            { label: 'Competencias y Resultados', value: 'CYR' },
            { label: 'Intructores', value: 'INST' },
          ]"
          outlined
          use-input
          input-debounce="0"
          lazy-rules
          :rules="[
            (val) =>
              (val && val.toString().trim().length > 0) ||
              'El campo es requerido',
          ]"
          style="max-width: 330px"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> workspaces </span>
          </template>
        </q-select>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          icon="save_as"
          label="Cancelar"
          to="/home"
          class="q-mt-md q-mb-sm q-mx-sm"
        >
          <template v-slot:loading>
            <q-spinner-oval color="white" size="1em" />
          </template>
        </q-btn>
        <q-btn
          icon="save_as"
          label="CONTINUAR"
          :disable="!fileToUpload"
          class="q-mt-md q-mb-sm q-mx-sm save_as"
          @click="dialogSelectBulkload = false"
        >
          <template v-slot:loading>
            <q-spinner-oval color="white" size="1em" />
          </template>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onBeforeMount, onMounted, ref } from "vue";
import { get, post } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { requestAxios } from "../common/axios.js";
import { storeUser } from "../store/users.js";
import { useQuasar } from "quasar";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const userStore = storeUser();
const $q = useQuasar();

let program = ref("");
let programOptions = ref([]);
let filterOptions = ref([]);
let formUpload = ref(null);
let dialogSelectBulkload = ref(true);
let fileToUpload = ref({
  label: "Competencias y Resultados",
  value: "CYR",
});

//drag and drop
const isActive = ref(false);
const dragText = ref("Arrastra y suelta el archivo");
let file = ref(null);
const fileInput = ref(null);
let fileUploaded = ref(false);
const openFileInput = () => {
  //reset file input
  fileInput.value.value = null;
  fileInput.value.click();
};

const handleFileSelect = (e) => {
  if (e.target.files[0] == undefined) {
    return;
  }

  file.value = e.target.files[0];

  if (!file.value) {
    dragText.value = "No se ha seleccionado ningún archivo";
    file.value = null;
  } else if (
    file.value.name.split(".").pop() != "xlsx" &&
    file.value.name.split(".").pop() != "xls" &&
    file.value.name.split(".").pop() != "xlsm"
  ) {
    $q.notify({
      type: "negative",
      message: "El archivo debe ser de tipo .xlsx, .xls, .xlsm",
      position: "top",
    });
    file.value = null;
  } else {
    dragText.value = "Archivo cargado ...";
    fileUploaded.value = true;
  }
};

const onDragOver = (e) => {
  e.preventDefault();
  dragText.value = "Suelta para subir los archivos";
  isActive.value = true;
};

const onDragLeave = (e) => {
  e.preventDefault();
  isActive.value = false;
  dragText.value = "Arrastra y suelta el archivo";
};

const onDrop = (e) => {
  e.preventDefault();
  file.value = e.dataTransfer.files[0];

  if (!file.value) {
    dragText.value = "No se ha seleccionado ningún archivo";
    file.value = null;
  } else if (
    file.value.name.split(".").pop() != "xlsx" &&
    file.value.name.split(".").pop() != "xls" &&
    file.value.name.split(".").pop() != "xlsm"
  ) {
    $q.notify({
      message: "El archivo debe ser de tipo .xlsx, .xls, .xlsm",
      type: "negative",
      position: "top",
    });
    file.value = null;
  } else {
    dragText.value = "Archivo cargado";
    fileUploaded.value = true;
  }
};

onMounted(() => {
  const dropArea = document.querySelector(".drop-area");

  dropArea.addEventListener("dragover", onDragOver);
  dropArea.addEventListener("dragleave", onDragLeave);
  dropArea.addEventListener("drop", onDrop);

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    isActive.value = true;
  });

  document.addEventListener("dragleave", (e) => {
    e.preventDefault();
    isActive.value = false;
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
  });
});

//---- drag and drop ----

onBeforeMount(async () => {
  getPrograms();
  await showDialogUpload();
});

function showDialogUpload() {}

function filterFn(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();

    filterOptions.value = programOptions.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

//download template file
async function downloadTemplate() {
  try {
    const response = await requestAxios.post(
      "/uploads/downloadexcel",
      {
        fileDownload: fileToUpload.value.value,
      },
      {
        responseType: "blob",
        headers: { token: userStore.token },
      }
    );
    const res = response.data;
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${
        fileToUpload.value.value !== "CYR"
          ? "instructores.xlsm"
          : "competenciasYResultados.xlsx"
      }`
    );
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {}
}

//get programs
async function getPrograms() {
  const data = await get("/programs?status=0");
  data.forEach((row, index) => {
    programOptions.value.push({
      label: `${row.code}: ${row.name}`,
      value: row._id,
    });
    filterOptions.value = programOptions.value;
  });
}

//clear fields
function clearFields() {
  program.value = "";
  file.value = null;
  fileUploaded.value = false;
  dragText.value = "Arrastra y suelta el archivo";
  formUpload.value.resetValidation();
}

//upload file
async function uploadFile() {
  const formData = new FormData();
  formData.append("file", file.value);

  $q.loading.show({
    message: "Cargando información al sistema, por favor no cierre la ventana.",
  });
  console.log(program.value);

  if (fileToUpload.value.value == "CYR") {
    await post(`/uploads/uploadexcel/${program.value.value}`, formData);
    notifySuccessRequest("Se ha cargado el archivo correctamente");
  } else {
    await post("/uploads/uploadexcelinstructor", formData);
    notifySuccessRequest("Se ha cargado el archivo correctamente");
  }

  $q.loading.hide();

  //limpiar campos
  clearFields();
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

.drop-area {
  height: 50vh !important;
  border: 5px dashed #ddd;
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  -ms-border-radius: 5px;
  -o-border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.active {
  background-color: #29ae0061;
  color: black;
  border: 2px dashed #618ac9;
}

.drop-area h2 {
  font-size: 30px;
  font-weight: 500;
  color: #000;
}

.drop-area span {
  font-size: 25px;
  font-weight: 500;
  color: #000;
}

.drop-area button {
  padding: 10px 25px;
  font-size: 15px;
  border: 0;
  outline: none;
  background-color: #266400;
  color: white;
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  -ms-border-radius: 5px;
  -o-border-radius: 5px;
  cursor: pointer;
  margin: 20px;
}
</style>
