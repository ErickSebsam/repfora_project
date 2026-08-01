<template>
  <q-page class="row justify-center flex">
    <div class="col-12 flex justify-end q-mr-lg">
      <div style="margin-top: 20px;">
        <q-btn
          icon="note_add"
          color="green-10"
          label="Registrar Novedad"
          to="/registernew/form"
        />
      </div>
    </div>
    <div
      class="col-10 col-xs-10 col-sm-6 col-md-4 col-lg-4 items-center flex q-my-lg"
    >
      <q-card class="my-card shadow-8 full-width">
        <q-card-section class="bg-green-9 q-px-lg tittle">
          <h4 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
            REPFORA
          </h4>
        </q-card-section>
        <div class="column items-center q-mt-md">
          <img
            src="/images/LOGO-SENA.png"
            style="height: 100px; width: 100px"
          />
        </div>
        <q-card-section class="text-center">
          <div class="text-h5 text-weight-bold">LOGIN</div>
        </q-card-section>
        <q-separator />

        <q-card-section>
          <q-select
            class="box_style q-my-md style-select"
            outlined
            v-model="role"
            :options="optionsRol"
            label="Rol"
          />
          <div v-if="role.value === 'ADMIN'">
            <q-input
              class="box_style q-mb-md"
              outlined
              v-model="email"
              label="Usuario"
            />
            <q-input
              class="box_style"
              v-model="password"
              outlined
              :type="isPwd ? 'password' : 'text'"
              label="Contraseña"
            >
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>
          </div>

          <q-card-actions class="column items-center">
            <q-btn
              class="button_style q-mt-md"
              :loading="loading"
              @click="signIn()"
              ref="btnLogin"
              label="INICIAR SESIÓN"
            >
              <template v-slot:loading>
                <q-spinner-oval color="white" size="1em" />
              </template>
            </q-btn>
          </q-card-actions>
          <router-link to="/forgotPassword" style="color: #2e7d32">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-weight-bold">
                Olvidé mi contraseña
              </div>
            </q-card-section>
          </router-link>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { storeUser } from "../store/users.js";

const userStore = storeUser();


let router = useRouter();
let btnLogin = ref();
let role = ref({ label: "CONSULTOR", value: "USER" });
let email = ref();
let password = ref("");
let isPwd = ref(true);
let optionsRol = [
  { label: "ADMINISTRADOR", value: "ADMIN" },
  { label: "CONSULTOR", value: "USER" },
];

let loading = ref(false);

window.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    btnLogin.value.click();
  }
});

async function signIn() {
  loading.value = true;
  await userStore.loginUser({
    role: role.value.value,
    email: email.value,
    password: password.value,
  });

  const roleU = userStore.getRole();

  if (
    userStore.token &&
    ["PROGRAMADOR", "COORDINADOR", "EVALUADOR", "NOVEDADES"].includes(roleU)
  )
    router.replace("/home");
  else if (userStore.token && roleU == "USER") router.replace("/consultor");

  loading.value = false;
}
</script>

<style scoped>
.color_card {
  background-color: var(--color_card) !important;
}

.button_style {
  display: flex;
  background-color: var(--color_button);
  color: var(--color_text_button);
  font-size: 17px;
}

/* no sirve box_style */
.box_style {
  color: var(--color_card);
}
.tittle {
  font-family: "Lucida Sans", "Lucida Sans Regular", "Lucida Grande",
    "Lucida Sans Unicode", Geneva, Verdana, sans-serif;
}
</style>
