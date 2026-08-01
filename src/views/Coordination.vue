<template>
  <div>
    <BtnBack route="/home" />
    <HeaderLayout title="Coordinación" />

    <div class="row">
      <div class="col-1"></div>
      <div class="col-10">
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
      <div class="col-1"></div>
    </div>
    <!-- TABLE INFO -->
    <div class="row q-mt-md justify-center">
      <div class="col-11 q-mb-lg">
        <q-table
          flat
          bordered
          no-data-label="Sin registros aún"
          :rows="rows"
          :columns="columns"
          row-key="index"
          class="q-mx-md my-sticky-header-table"
        >
          <template v-slot:body-cell-programmers="props">
            <q-td :props="props">
              <div>
                <span v-text="props.value"></span>
                <q-tooltip max-width="350px">
                  {{ props.value }}
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
      <q-card style="max-width: 450px !important">
        <q-card-section class="bg-green-9 q-px-lg">
          <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
            {{ edit ? "MODIFICA LA INFORMACIÓN" : "DILIGENCIA LA INFORMACIÓN" }}
          </h5>
        </q-card-section>
        <div class="q-pa-md">
          <q-form
            @submit.prevent.stop="edit ? putCoordination() : postCoordination()"
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
                  <span class="material-symbols-outlined"> keyboard_alt </span>
                </template>
              </q-input>

              <q-input
                filled
                type="email"
                v-model="email"
                label="Correo electrónico"
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
                v-model="passapp"
                label="Contraseña de aplicación"
                :type="isPwd ? 'password' : 'text'"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 4) || 'Mínimo 5 caracteres',
                ]"
              >
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
                </template>
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> lock </span>
                </template>
              </q-input>

              <q-input
                filled
                v-model="namefoldernew"
                label="Nombre de carpeta de las novedades"
                type="text"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 4) || 'Mínimo 5 caracteres',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> folder </span>
                </template>
              </q-input>

              <q-select
                filled
                type="text"
                v-model="coordinator"
                :options="usersOptions"
                label="Coordinador"
                options-dense
                use-input
                input-debounce="0"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> person </span>
                </template>
              </q-select>

             

              <q-input
                filled
                type="email"
                v-model="emailSupervisor"
                label="Correo electrónico del supervisor"
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
                type="email"
                v-model="emailNews"
                label="Correo electrónico para novedades"
            
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> mail </span>
                </template>
              </q-input>

              <q-select
                filled
                v-model="programmers"
                multiple
                :options="optionsProgrammers"
                options-dense
                use-chips
                use-input
                label="Selecciona los programadores"
                input-debounce="0"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> person </span>
                </template>
              </q-select>

              <q-select
                filled
                type="text"
                v-model="modality"
                :options="optionsmodality"
                label="Modalidad"
                input-debounce="0"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.toString().trim().length > 0) ||
                    'El campo es requerido',
                ]"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined">
                    drag_indicator
                  </span>
                </template>
              </q-select>

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
import { onBeforeMount, ref } from "vue";
import { get, post, put } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { storeUser } from "../store/users.js";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const useUsers = storeUser();

let prompt = ref(false);
let edit = ref(false);
let name = ref();
let email = ref();
let passapp = ref();
let namefoldernew = ref();
let coordinator = ref();

let emailNews = ref();
let emailSupervisor = ref();
let programmers = ref();
let modality = ref();
let isPwd = ref(true);
let usersOptions = ref([]);
let optionsProgrammers = ref([]);
let loading = ref(false);
let index = ref();
let optionsmodality = ["TITULADA", "VIRTUAL", "PROGRAMAS ESPECIALES"];

let columns = ref([
  {
    name: "index",
    label: "N°",
    field: "index",
    align: "center",
  },
  {
    name: "name",
    label: "NOMBRE COORDINACIÓN",
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
    name: "coordinator",
    label: "COORDINADOR",
    field: (row) => row.coordinator.name,
    align: "center",
    sortable: true,
  },
  
  {
    name: "emailsupervisor",
    label: "CORREO SUPERVISOR",
    field: row => row.emailsupervisor?.split(",")[0],
    align: "center",
    sortable: true,
  },

  {
    name: "emailnews",
    label: "CORREO NOVEDADES",
    field: row => row.emailsupervisor?.split(",")[1],
    align: "center",
    sortable: true,
  },
  {
    name: "programmers",
    label: "PROGRAMADORES",
    //uni9r con join
    field: (row) => row.programmers.map((row) => row.name).join(", "),
    align: "center",
    style:
      "max-width: 300px; white-space: nowrap; text-overflow: ellipsis !important;overflow: hidden;",
    sortable: true,
  },
  {
    name: "modality",
    label: "MODALIDAD",
    field: "modality",
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
  getCoordination();
  getUsers();
});

// get
async function getCoordination() {
  try {
    const data = await get("/coordinations");
    rows.value = data;
    rows.value.forEach((row, index) => {
      row.index = index + 1;
    });
  } catch (error) {}
}

async function postCoordination() {
  loading.value = true;
  try {
    await post("/coordinations/register", {
      name: name.value,
      coordinator: coordinator.value.value,
      modality: modality.value,
      email: email.value,
      emailsupervisor: emailSupervisor.value+","+emailNews.value,
      passapp: passapp.value,
      namefoldernew: namefoldernew.value,
      programmers: programmers.value.map((row) => row.value),
    });
    notifySuccessRequest("Coordinación registrada correctamente");
    prompt.value = false;
    edit.value = false;
    cleanForm();
    await getCoordination();
  } catch (error) {}
  loading.value = false;
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    try {
      await put(`/coordinations/inactive/${data._id}`, null);
      notifySuccessRequest("Coordinación desactivada correctamente");
    } catch (error) {}
    await getCoordination();
  } else {
    try {
      await put(`/coordinations/active/${data._id}`, null);
      notifySuccessRequest("Coordinación activada correctamente");
    } catch (error) {}
    await getCoordination();
  }
}

function showInfo(data) {
  index.value = data._id;
  name.value = data.name;
  coordinator.value = {
    label: data.coordinator.name,
    value: data.coordinator._id,
  };
  passapp.value = data.passapp;
  emailSupervisor.value = data.emailsupervisor.split(",")[0];
  emailNews.value = data.emailsupervisor.split(",")[1];
  namefoldernew.value = data.namefoldernew;
  email.value = data.email;
  modality.value = data.modality;
  programmers.value = data.programmers.map((row) => {
    return { label: row.name, value: row._id };
  });

  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function putCoordination() {
  loading.value = true;
  try {
    await put("/coordinations/update/" + index.value, {
      name: name.value,
      coordinator: coordinator.value.value,
      modality: modality.value,
      email: email.value,
      emailsupervisor: emailSupervisor.value+","+emailNews.value,
      passapp: passapp.value,
      namefoldernew: namefoldernew.value,
      programmers: programmers.value.map((row) => row.value),
    });
    notifySuccessRequest("Coordinación actualizada correctamente");
    cleanForm();
    edit.value = false;
    prompt.value = false;
    await getCoordination();
  } catch (error) {}
  loading.value = false;
}

//get users
async function getUsers() {
  usersOptions.value = [];
  const res = await useUsers.allUsersCoordinator();
  res.forEach((row, index) => {
    usersOptions.value.push({ label: row.name, value: row._id });
    // filterOptions.value = usersOptions.value;
  });

  const res2 = await useUsers.allUsersProgrammers();
  res2.forEach((row, index) => {
    optionsProgrammers.value.push({ label: row.name, value: row._id });
    // filterOptions.value = usersOptions.value;
  });
}

async function cleanForm() {
  loading.value = false;
  name.value = "";
  email.value = "";
  passapp.value = "";
  namefoldernew.value = "";
  coordinator.value = null;
  modality.value = null;
  programmers.value = [];
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
</style>
