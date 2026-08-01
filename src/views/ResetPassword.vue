<template>
  <div>
    <HeaderLayout title="Restablecer Contraseña" />

    <div class="row justify-center">
      <div class="col-5 text-center q-mt-lg q-mb-xl">
        <q-card class="my-card shadow-8">
          <q-avatar size="90px" class="q-mt-md">
            <img src="/images/LOGO-SENA.png" />
          </q-avatar>
          <q-card-section>
            <div class="text-subtitle1">Digite la nueva contraseña:</div>
          </q-card-section>
          <q-form ref="myForm">
            <q-card-section>
              <q-input
                filled
                v-model="password"
                label="Nueva contraseña"
                :type="isPwd ? 'password' : 'text'"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
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

              <q-input
                filled
                v-model="confirmPassword"
                label="Confirmar contraseña"
                :type="isPwd2 ? 'password' : 'text'"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.trim().length > 0) || 'El campo es requerido',
                  (val && val.trim().length > 6) || 'Mínimo 5 caracteres',
                ]"
              >
                <template v-slot:append>
                  <q-icon
                    :name="isPwd2 ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd2 = !isPwd2"
                  />
                </template>
              </q-input>

              <div class="justify-center flex q-mb-xs">
                <q-btn
                  icon="send"
                  label="ENVIAR"
                  @click="validate(), resetValidation()"
                  class="q-mt-md q-mb-sm q-mx-sm save_as"
                  :loading="loading"
                >
                  <template v-slot:loading>
                    <q-spinner-oval color="white" size="1em" />
                  </template>
                </q-btn>
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { storeUser } from "../store/users.js";
import { useRouter } from "vue-router";
import { notifyErrorRequest } from "../common/notify.js";

import HeaderLayout from "../layouts/headerViewsLayout.vue";

const router = useRouter();
const useUsers = storeUser();

const token = router.currentRoute.value.params.token;

let password = ref();
let isPwd = ref(true);
let isPwd2 = ref(true);
let confirmPassword = ref();
let loading = ref(false);
const myForm = ref(null);

async function putPassword() {
  loading.value = true;
  await useUsers
    .sendPassword({ password: confirmPassword.value}, token)
    .then((res) => {
      if (res.status == 200) {
        setTimeout(() => {
        router.push("/");
      }, 3000);
      }
    });

  loading.value = false;
  cleanFields();
}

function validate() {
  if (password.value != confirmPassword.value) {
    notifyErrorRequest(
      "Las contraseñas no coinciden, por favor revise nuevamente"
    );
  } else {
    putPassword();
  }
}

function cleanFields() {
  (password.value = null), (confirmPassword.value = null);
}

function resetValidation() {
  myForm.value.resetValidation();
}
</script>

<style scoped></style>
