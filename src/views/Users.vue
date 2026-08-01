<template>
  <div>
    <BtnBack route="/home" />

    <HeaderLayout title="Usuarios" />

    <div class="row">
      <div class="col-1"></div>
      <div class="col-10">
        <q-btn
          class="bg-green-9 text-white"
          @click="clearForm(), (prompt = true), (edit = false)"
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
          rows-per-page-label="Numero de documentos"
          :rows-per-page-options="[10, 20, 30, 40, 50, 0]"
          :pagination="{
            rowsPerPage: 50,
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
            {{ edit ? "MODIFICA LA INFORMACIÓN" : "DILIGENCIA LA INFORMACIÓN" }}
          </h5>
        </q-card-section>
        <div class="q-pa-md">
          <q-form
            @submit.prevent.stop="edit ? putUser() : postUsers()"
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
                v-model="role"
                :options="optionsRole"
                label="Rol"
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

              
              <q-select
              v-if="role === 'NOVEDADES'"
                filled
                v-model="coordinations"
                multiple
                :options="optionsCoor"
                options-dense
                use-chips
                use-input
                label="Coordinacion de novedades"
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
                v-model="password"
                label="Contraseña"
                :type="isPwd ? 'password' : 'text'"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 6) || 'Mínimo 5 caracteres',
                ]"
              >
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
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
import { onBeforeMount, ref } from "vue";
import { useQuasar } from "quasar";
import { storeUser } from "../store/users.js";
import { get } from "../services/api.js";
import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const userStore = storeUser();
const $q = useQuasar();

let index = ref();
let prompt = ref(false);
let edit = ref(false);
let name = ref();
let role = ref();
let email = ref();
let password = ref();
let isPwd = ref(true);
let loading = ref(false);
let coordinations = ref([]);
let optionsCoor = ref([]);

let optionsRole = ref(["PROGRAMADOR", "COORDINADOR", "EVALUADOR", "NOVEDADES"]);

let columns = ref([
  {
    name: "nombre",
    label: "NOMBRE",
    field: "name",
    align: "center",
    sortable: true,
  },
  {
    name: "correo",
    label: "CORREO",
    field: "email",
    align: "center",
    sortable: true,
  },
  {
    name: "rol",
    label: "ROL",
    field: "role",
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
  await getUsers();
  await getCoor();  
});

function showInfo(data) {
  index.value = data._id;
  name.value = data.name;
  role.value = data.role;
  coordinations.value = data.coordinations?.map((item) => {
    return {
      label: item.name + " - " + item.coordinator.name,
      value: item._id,
    };
  });
  email.value = data.email;
  password.value = "";
  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    await userStore.inactiveUser(data._id);
    await getUsers();
  } else {
    await userStore.activeUser(data._id);
    await getUsers();
  }
}

const getUsers = async () => {
  const data = await userStore.allUsers();
  rows.value = data;
};

const getCoor = async () => {
  const data = await get("/coordinations?status=0");
  optionsCoor.value = data?.map((item) => {
    return {
      label: item.name + " - " + item.coordinator.name,
      value: item._id,
    };
  });
};

const clearForm = () => {
  name.value = "";
  role.value = "";
  coordinations.value = [];
  email.value = "";
  password.value = "";
};

async function postUsers() {
  loading.value = true;
  await userStore
    .registerUser({
      name: name.value,
      email: email.value,
      role: role.value,
      coordinations: coordinations.value.map((item) => item.value),
      password: password.value,
    })
    .then(async (res) => {
      if (res && res.status < 299) {
        prompt.value = false;
        edit.value = false;
        clearForm();
        await getUsers();
      }
    });
  loading.value = false;
}

async function putUser() {
  loading.value = true;
  await userStore
    .updateUser(index.value, {
      name: name.value,
      email: email.value,
      role: role.value,
      coordinations: coordinations.value.map((item) => item.value),
      password: password.value,
    })
    .then(async (res) => {
      if (res && res.status < 299) {
        clearForm();
        prompt.value = false;
        edit.value = false;
        await getUsers();
      }
    });
  loading.value = false;
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
</style>
