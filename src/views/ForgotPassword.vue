<template>
  <div>
    <HeaderLayout title="Recuperar contraseña" />

    <div class="row justify-center">
      <div class="col-5 text-center q-mt-lg">
        <q-card class="my-card shadow-8">
          <q-avatar size="90px" class="q-mt-md">
            <img src="/images/LOGO-SENA.png" />
          </q-avatar>

          <q-card-section>
            <div class="text-subtitle2">
              Por favor digite el correo electrónico con el que se ha registrado
              anteriormente, <br />
              allí le enviaremos todos los pasos para recuperar su contraseña.
            </div>
          </q-card-section>
          <q-form ref="myForm">
            <q-card-section>
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

              <div class="justify-center flex q-mb-xs">
                <q-btn
                  icon="send"
                  label="ENVIAR"
                  @click="postSendEmail(), resetValidation()"
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

import HeaderLayout from "../layouts/headerViewsLayout.vue";

const useUsers = storeUser();
const router = useRouter();

let email = ref();
let loading = ref(false);
const myForm = ref(null);

async function postSendEmail() {
  loading.value = true;
  await useUsers
    .sendEmail({
      email: email.value,
    })
    .then((res) => {
      setTimeout(() => {
        router.push("/");
      }, 3000);
    });
  loading.value = false;
  email.value = "";
}

function resetValidation() {
  myForm.value.resetValidation();
}
</script>

<style scoped></style>
