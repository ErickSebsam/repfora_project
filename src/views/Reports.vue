
<template>
  <div>
    <BtnBack route="/home" />
    <div class="row q-my-xl justify-center row-tittle">
      <div class="col-12 text-center text-h5 text-weight-bold">
        CONSULTA DE PROGRAMACIÓN DE FORMACIÓN ACTUALIZADA
      </div>
    </div>

    <!-- Formaq 1 -->
    <div v-if="role !== 'USER'" class="row justify-center my-row">
      <div
        class="col-8 col-sm-4 col-md-3 q-mx-xl q-my-xl flex"
        v-for="(card, index) in cards"
        :key="index"
      >
        <Card :title="card.title" :route="card.route" :image="card.image" />
      </div>
    </div>

    <!-- is role USER -->
    <div v-else class="row justify-center flex">
      <div
        class="col-10 col-xs-10 col-sm-8 col-md-4 col-lg-4 items-center flex q-my-lg"
      >
        <q-card class="full-width shadow-8">
          <q-card-section>
            <q-select
              class="q-my-md"
              outlined
              v-model="consult"
              :options="optionsConsult"
              label="Consultar"
            />
            <div v-if="consult.value == 'instructor'">
              <q-input
                filled
                type="number"
                v-model="numdocument"
                label="Documento"
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> badge </span>
                </template>
              </q-input>

              <q-input
                filled
                type="email"
                v-model="email"
                label="Correo electrónico institucional"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> mail </span>
                </template>
              </q-input>
            </div>
            <div v-else>
              <q-input
                filled
                type="number"
                v-model="numfiche"
                label="Número de ficha"
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <span class="material-symbols-outlined"> 123 </span>
                </template>
              </q-input>
            </div>
            <q-card-actions class="column items-center">
              <q-btn
                class="button_style q-mt-md"
                :loading="loading"
                @click="goConsult()"
                label="CONSULTAR"
              >
                <template v-slot:loading>
                  <q-spinner-oval color="white" size="1em" />
                </template>
              </q-btn>
            </q-card-actions>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";

import { useRouter } from "vue-router";
import { storeUser } from "../store/users.js";
import { post } from "../services/api.js";
import BtnBack from "../layouts/btnBackLayout.vue";

import Card from "../layouts/Card.vue";

const userStore = storeUser();
const role = ref(userStore.getRole());

const router = useRouter();

let loading = ref(false);

const cards = ref([
  {
    title: "Consultar por ficha",
    route: "/tipoConsulta/ficha",
    image: "/images/grupo2.jpg",
  },
  {
    title: "Consultar por instructor",
    route: "/tipoConsulta/instructor",
    image: "/images/instructores.jpg",
  },
  {
    title: "Consultar por ambiente",
    route: "/tipoConsulta/ambiente",
    image: "/images/ambienteReporte.jpg",
  },
  {
    title: "Reporte de horas",
    route: "/reportehours",
    image: "/images/hours.png",
  },
]);

// is role USER
const consult = ref({ label: "Ficha", value: "ficha" });

const optionsConsult = ref([
  { label: "Ficha", value: "ficha" },
  { label: "Instructor", value: "instructor" },
]);

function cleanData() {
  consult.value = { label: "Ficha", value: "ficha" };

  email.value = "";
  (numdocument.value = ""), (numfiche.value = "");
}

async function goConsult() {
  loading.value = true;

  if (consult.value.value == "ficha") {
    if (numfiche.value.trim() !== "") {
      const data = await post("/reports/validatefiche", {
        fiche: numfiche.value,
      });
      userStore.newConsult = {
        label: data.fiche[0].number,
        value: data.fiche[0]._id,
      };
      cleanData();
      router.push("/tipoConsulta/ficha");
    }
  } else {
    if (email.value.trim() !== "") {
      const data = await post("/reports/validateinst", {
        document: numdocument.value,
        email: email.value,
      });
      userStore.email = data.instructor.email;
      userStore.newConsult = {
        label: data.instructor.numdocument,
        value: data.instructor._id,
        name:  data.instructor.name,
        phone: data.instructor.phone || "",
      };
      cleanData();
      router.push("/home/instructor");
    }
  }

  loading.value = false;
}

// instructor
const numdocument = ref("");
const email = ref("");

// ficha
const numfiche = ref("");
</script>

<style scoped>
.card_style {
  background-color: var(--color_card) !important;
  color: var(--color_text_card);
}

.img-card {
  display: flex;
  width: 50% !important;
  max-width: 50% !important;
  height: 30%;
  border: 0;
}

.button_style {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

.my-row {
  margin-top: 50px;
}
.row-tittle {
  margin-top: 50px;
}
</style>
