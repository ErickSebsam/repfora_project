<template>
  <div>
    <BtnBack route="/home" />

    <HeaderLayout title="Instructores" />

    <div class="row justify-center">
      <div
        class="col-sm-2 col-md-1 col-12 justify-center flex justify-sm-start"
      >
        <q-btn
          class="bg-green-9 text-white"
          @click="(prompt = true), cleanForm(), (edit = false)"
          ><span
            class="material-symbols-outlined q-mr-sm"
            style="font-size: 20px"
          >
            add_circle
          </span>
          Crear
        </q-btn>
      </div>
      <div
        class="col-sm-8 col-md-9 col-12 flex"
        :class="
          $q.screen.width < 600 ? 'justify-center q-mt-md' : 'justify-end'
        "
      >
        <q-select
          filled
          style="width: 350px"
          outlined
          use-input
          dense
          v-model="instructorSelected"
          hide-selected
          fill-input
          label="Seleccione el nombre"
          :options="filterOptions"
          @filter="filterInstructor"
          :popup-content-style="{ width: '300px' }"
          @update:model-value="searchInstructor()"
        >
          <template v-slot:append>
            <q-icon
              v-if="instructorSelected.length !== 0"
              class="cursor-pointer"
              name="clear"
              @click.stop.prevent="instructorSelected = []"
            />
          </template>
        </q-select>
      </div>
    </div>
    <!-- TABLE INFO -->
    <div class="row q-mt-md">
      <div class="col-12 q-mb-lg">
        <q-table
          flat
          bordered
          no-data-label="Sin registros aún"
          :rows="instructorSelected.length == 0 ? rows : rowsFilter"
          :columns="columns"
          row-key="index"
          class="q-mx-md my-sticky-header-table"
          rows-per-page-label="Numero de documentos"
          :rows-per-page-options="[0]"
          :pagination="{
            rowsPerPage: 0,
          }"
        >
          <template v-slot:body-cell-thematicarea="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip v-if="props.value.length > 50" max-width="350px">
                  {{ props.row.thematicarea }}
                </q-tooltip>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-knowledge="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip
                  v-if="props.value.trim().length > 56"
                  max-width="350px"
                >
                  {{ props.row.knowledge }}
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
                  @click="showInfo(props.row)"
                ></q-btn>
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

    <q-dialog v-model="prompt">
      <q-card>
        <q-card-section class="bg-green-9 q-px-lg">
          <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
            {{
              edit ? "MODIFIFCA LA INFORMACIÓN" : "DILIGENCIA LA INFORMACIÓN"
            }}
          </h5>
        </q-card-section>
        <div class="q-pa-md">
          <q-form
            @submit.prevent.stop="edit ? putInstructors() : postInstructors()"
            novalidate
          >
            <div>
              <q-input
                filled
                type="text"
                v-model="name"
                label="Nombre"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> person </span>
                </template>
              </q-input>

              <q-select
                filled
                type="text"
                v-model="tpdocument"
                :options="optionsTpDoc"
                label="Tipo documento"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> list </span>
                </template>
              </q-select>

              <q-input
                filled
                type="number"
                v-model="numdocument"
                label="Documento"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                  (val) => val > 0 || 'El campo debe ser mayor a 0',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> badge </span>
                </template>
              </q-input>

              <q-input
                filled
                type="email"
                v-model="emailpersonal"
                label="Correo electrónico personal"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> contact_mail </span>
                </template>
              </q-input>

              <q-input
                filled
                type="email"
                v-model="email"
                label="Correo electrónico institucional"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> mail </span>
                </template>
              </q-input>

              <q-input
                filled
                type="number"
                v-model="phone"
                label="Teléfono"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 9) || 'Mínimo 10 caracteres',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> call </span>
                </template>
              </q-input>

              <q-select
                filled
                type="text"
                v-model="knowledge"
                label="Red de conocimiento"
                options-dense=""
                :options="optionsKnowledge"
                :option-label="(row) => row.red"
                :option-value="(row) => row"
                use-input
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
                @update:model-value="thematicarea = null"
                @filter="filterKnowledge"
                :popup-content-style="{ width: '300px' }"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> category </span>
                </template>
                <template v-slot:append>
                  <q-icon
                    v-if="knowledge"
                    class="cursor-pointer"
                    name="clear"
                    @click.stop.prevent="knowledge = null"
                  />
                </template>
              </q-select>

              <q-select
                filled
                type="text"
                v-model="thematicarea"
                label="Área temática"
                options-dense=""
                :options="optionsThematicarea"
                :disable="!knowledge"
                use-input
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
                @filter="filterThematicarea"
                :popup-content-style="{ width: '300px' }"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> category </span>
                </template>
                <template v-slot:append>
                  <q-icon
                    v-if="thematicarea"
                    class="cursor-pointer"
                    name="clear"
                    @click.stop.prevent="thematicarea = null"
                  />
                </template>
              </q-select>

              <q-select
                filled
                type="text"
                v-model="bindingtype"
                label="Tipo de vinculación"
                :options="optionsBinding"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> hub </span>
                </template>
              </q-select>

              <q-input
                type="number"
                filled
                v-model="caphour"
                label="Máximo de horas"
                lazy-rules
                :rules="[(val) => (val && val > 0) || 'El campo es requerido']"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> timelapse </span>
                </template>
              </q-input>

              <div class="justify-center flex">
                <q-btn
                  icon="save_as"
                  label="GUARDAR"
                  type="submit"
                  class="q-mt-md q-mb-sm q-mx-sm save_as"
                  :loading="loading"
                >
                  <template v-slot:loading>
                    <q-spinner-oval color="white" size="1em" />
                  </template>
                </q-btn>

                <q-btn
                  type="button"
                  class="q-mt-md q-mb-sm q-mx-sm"
                  to=""
                  v-close-popup
                  ><span
                    class="material-symbols-outlined q-mr-sm"
                    style="font-size: 23px"
                  >
                    cancel </span
                  >CERRAR</q-btn
                >
              </div>
            </div>
          </q-form>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { onBeforeMount, onMounted, ref } from "vue";
import { get, post, put } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { useQuasar } from "quasar";
import dataRedConocimiento from "../static/dataRedConocimiento.js";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

let instructorSelected = ref([]);
let filterOptions = ref([]);
let instructorOptions = [];
let rowsFilter = ref([]);

let prompt = ref(false);
let edit = ref(false);
let name = ref();
let tpdocument = ref();
let numdocument = ref();
let email = ref();
let emailpersonal = ref();
let phone = ref();
let thematicarea = ref();
let index = ref();
let caphour = ref();
let bindingtype = ref();
let knowledge = ref();
let optionsKnowledge = ref([...dataRedConocimiento]);
let optionsThematicarea = ref();
let loading = ref(false);
let optionsBinding = [
  { label: "Planta", value: "PLANTA" },
  { label: "Contratista", value: "CONTRATISTA" },
];
let optionsTpDoc = [
  { label: "Cédula de ciudadanía", value: "CC" },
  { label: "Cédula de extranjería", value: "CE" },
  { label: "Nit", value: "NIT" },
  { label: "Pasaporte", value: "PASAPORTE" },
  { label: "PPT", value: "PPT" },
];

let columns = ref([
  {
    name: "index",
    label: "N°",
    field: "index",
    align: "center",
  },
  {
    name: "name",
    label: "NOMBRE",
    field: "name",
    align: "center",
    sortable: true,
  },
  {
    name: "tpdocument",
    label: "TIPO DE DOCUMENTO",
    field: "tpdocument",
    align: "center",
    sortable: true,
  },
  {
    name: "numdocument",
    label: "N° DOCUMENTO",
    field: "numdocument",
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
    name: "phone",
    label: "TELÉFONO",
    field: "phone",
    align: "center",
    sortable: true,
  },
  {
    name: "thematicarea",
    label: "ÁREA TEMÁTICA",
    field: "thematicarea",
    align: "center",
    style:
      "max-width: 300px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "knowledge",
    label: "RED DE CONOCIMIENTO",
    field: "knowledge",
    align: "center",
    style:
      "max-width: 350px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "bindingtype",
    label: "TIPO DE VINCULACIÓN",
    field: "bindingtype",
    align: "center",
  },
  {
    name: "caphour",
    label: "MÁXIMO DE HORAS",
    field: "caphour",
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

let rows = ref([]);

onBeforeMount(async () => {
  await getInstructors();
});

// get
async function getInstructors() {
  try {
    const data = await get("/instructors");
    rows.value = data;
    instructorOptions = [];
    rows.value.forEach((row, index) => {
      row.index = index + 1;
      instructorOptions.push({ label: row.name, value: row._id });
    });

    filterOptions.value = instructorOptions;
  } catch (error) {}
}

async function postInstructors() {
  loading.value = true;
  try {
    await post("/instructors/register", {
      name: name.value,
      tpdocument: tpdocument.value.value,
      numdocument: numdocument.value,
      emailpersonal: emailpersonal.value,
      email: email.value,
      phone: phone.value,
      thematicarea: thematicarea.value,
      knowledge: knowledge.value.red,
      caphour: caphour.value,
      bindingtype: bindingtype.value.value,
    });
    notifySuccessRequest("Instructor guardado correctamente");
    prompt.value = false;
    edit.value = false;
    cleanForm();
    await getInstructors();
  } catch (error) {}

  loading.value = false;
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    try {
      await put(`/instructors/inactive/${data._id}`, null);
      notifySuccessRequest("Instructor desactivado correctamente");
    } catch (error) {}
  } else {
    try {
      await put(`/instructors/active/${data._id}`, null);
      notifySuccessRequest("Instructor activado correctamente");
    } catch (error) {}
  }
  await getInstructors();
  searchInstructor();
}

function showInfo(data) {
  index.value = data._id;
  name.value = data.name;
  tpdocument.value = {
    label: data.tpdocument,
    value: data.tpdocument,
  };
  numdocument.value = data.numdocument;
  emailpersonal.value = data.emailpersonal;
  email.value = data.email;
  phone.value = data.phone;
  caphour.value = data.caphour;
  bindingtype.value = {
    label: data.bindingtype,
    value: data.bindingtype,
  };
  dataRedConocimiento.forEach((element) => {
    if (element.red == data.knowledge) {
      element.areas.forEach((area) => {
        if (area == data.thematicarea) {
          knowledge.value = {
            red: data.knowledge,
            areas: element.areas,
          };
          thematicarea.value = data.thematicarea;
        }
      });
    }
  });

  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function putInstructors() {
  loading.value = true;

  try {
    await put("/instructors/update/" + index.value, {
      name: name.value,
      tpdocument: tpdocument.value.value,
      numdocument: numdocument.value,
      emailpersonal: emailpersonal.value,
      email: email.value,
      phone: phone.value,
      thematicarea: thematicarea.value,
      knowledge: knowledge.value.red,
      caphour: caphour.value,
      bindingtype: bindingtype.value.value,
    });
    notifySuccessRequest("Instructor actualizado correctamente");
    edit.value = false;
    prompt.value = false;
    cleanForm();
    await getInstructors();
    searchInstructor();
  } catch (error) {}

  loading.value = false;
}

async function cleanForm() {
  loading.value = false;
  name.value = "";
  tpdocument.value = null;
  numdocument.value = "";
  emailpersonal.value = "";
  email.value = "";
  phone.value = "";
  thematicarea.value = "";
  knowledge.value = "";
  caphour.value = "";
  bindingtype.value = null;
}

function filterInstructor(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptions.value = instructorOptions.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function searchInstructor() {
  if (instructorSelected.value.length === 0) {
    rowsFilter.value = rows.value;
  } else {
    rowsFilter.value = [];
    rowsFilter.value = rows.value.filter(
      (element) => element._id == instructorSelected.value.value
    );
  }
}

function filterThematicarea(val, update, abort) {
  update(() => {
    const copyOptionsThematicarea = [...knowledge.value.areas];
    const needle = val.toLocaleLowerCase();
    optionsThematicarea.value = copyOptionsThematicarea.filter((v) => {
      return v.toLocaleLowerCase().indexOf(needle) > -1;
    });
  });
}

function filterKnowledge(val, update, abort) {
  update(() => {
    const copyOptionsKnowledge = [...dataRedConocimiento];

    const needle = val.toLocaleLowerCase();
    optionsKnowledge.value = copyOptionsKnowledge.filter((v) => {
      return v.red.toLocaleLowerCase().indexOf(needle) > -1;
    });
  });
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

/* .close-dialog {
  border: 1px solid red
} */
</style>
