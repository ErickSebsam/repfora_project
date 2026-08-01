<template>
  <q-card class="">
    <q-bar class="bg-green-9">
      <q-space />
      <q-btn
        dense
        round
        icon="close"
        color="white"
        class="text-green-9"
        v-close-popup
      >
        <q-tooltip class="bg-white text-green-9">Cerrar</q-tooltip>
      </q-btn>
    </q-bar>

    <q-card-section class="justify-center flex">
      <div class="text-title text-black text-bold" style="font-size: 28px">
        Proceso de la Novedad
      </div>
    </q-card-section>
    <q-card-section class="q-py-none row">
      <div class="col-12 text-h6 text-weight-bolder q-mb-sm">
        Información de la novedad <q-separator color="black"/>
      </div>

      <div class="col-12 row justify-start">
        <q-item-section
          v-for="(item, index) in dataBaseNew"
          :key="index"
          :class="
            item.name == 'Correo Electronico' || item.name == 'Instructor ' || item.name == 'Causa de la novedad'
              ? 'col-sm-4 col-md-3 col-lg-3 col-11  q-px-none q-mx-none q-mt-lg'
              : 'col-sm-3 col-md-2  col-5 q-px-none q-mx-none q-mt-lg'
          "
          v-show="item.value"
        >
          <q-item-label>{{ item.name }}</q-item-label>
          <q-item-label caption>
            {{ item.value }}
          </q-item-label>
        </q-item-section>
      </div>
    </q-card-section>

    <q-card-section class="justify-center row q-mt-xl">
      <div class="col-12 text-h6 text-weight-bolder q-mb-sm">
        Tramite <q-separator color="black" />
      </div>
      <div class="col-md-8 col-12 row q-px-lg flex">
        <div class="col-12 text-subtitle1 text-grey-7">Respuestas</div>
        <div class="col-12 q-mt-md full-height">
          <q-card class="card-answers">
            <div class="justify-center flex q-pb-md" v-if="!aprovedEdit">
              <q-btn
                round
                color="green-8"
                icon="add"
                @click="addInputAnswer()"
                :disable="aprovedEdit"
              />
            </div>

            <template v-for="(answer, index) in answers" :key="index">
              <q-card-section>
                <q-item class="q-ma-none q-pa-none">
                  <q-item-section class="target-answer q-pa-sm">
                    <q-item-label caption>
                      <div class="cursor-pointer label-news text-subtitle2">
                        {{ answer.data }}
                      </div>
                    </q-item-label>
                    <q-popup-edit
                      :disable="aprovedEdit"
                      v-model="answer.data"
                      auto-save
                      v-slot="scope"
                    >
                      <q-item-label caption>
                        <q-input
                          :disable="aprovedEdit"
                          v-model="answer.data"
                          label="Establecer respuesta"
                          filled
                          autogrow
                          @keyup.enter="scope.set"
                        />
                      </q-item-label>
                    </q-popup-edit>
                    <q-item-section>
                      <q-item-label class="justify-end flex q-mt-sm" caption>{{
                        answer.date
                          ? answer.date.split("T")[0]
                          : getDateFormat()
                      }}</q-item-label>
                    </q-item-section>
                  </q-item-section>
                  <q-item-section
                    v-if="!aprovedEdit"
                    side
                    class="cursor-pointer"
                  >
                    <q-btn
                      round
                      dense
                      style="height: 20px"
                      flat
                      color="green"
                      icon="delete"
                      @click="removeInputAnswer(index)"
                      :disable="aprovedEdit"
                    />
                  </q-item-section>
                </q-item>
              </q-card-section>

              <q-separator />
            </template>
          </q-card>
        </div>
      </div>
      <div class="col-md-4 col-12 row q-px-md">
        <div class="col-12 text-subtitle1 text-grey-7">
          Opciones adicionales
        </div>
        <div class="col-12 q-mt-md">
          <q-form @submit.prevent.stop="updateAdvencedNew()" novalidate>
            <q-input
              :disable="aprovedEdit"
              filled
              type="text"
              v-model="acta"
              label="Numero de acta"
              lazy-rules
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> description </span>
              </template>
            </q-input>

            <q-input
              v-if="tpnew == 'RETIRO VOLUNTARIO'"
              :disable="true"
              filled
              placeholder="aaaa/mm/dd"
              v-model="fSopia"
              mask="date"
              label="Fecha Registro Evidencia En Sofia Plus"
              class="q-mt-md"
              lazy-rules
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="fStart" minimal>
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          label="Close"
                          color="primary"
                          flat
                        />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>

              <template v-slot:prepend>
                <span class="material-symbols-outlined"> event </span>
              </template>
            </q-input>

            <q-select
              :disable="aprovedEdit"
              filled
              type="text"
              v-model="statusSelected"
              :options="statusOptions"
              label="Estado"
              options-dense
              use-input
              input-debounce="0"
              lazy-rules
              class="q-mt-md"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined">
                  app_registration
                </span>
              </template>
            </q-select>

            <q-checkbox
              :disable="aprovedEdit"
              color="green-8"
              v-model="aproved"
              label="Finalizar Novedad"
              class="q-mt-md"
            />

            <div class="justify-center flex" v-if="!aprovedEdit">
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
            </div>
          </q-form>
        </div>
      </div>
    </q-card-section>
  </q-card>

  <q-dialog v-model="confirm" persistent>
    <q-card style="max-width: 450px">
      <q-card-section class="bg-green-9 text-white justify-center flex">
        <div class="text-h6">CONFIRMAR ACCIÓN</div>
      </q-card-section>
      <q-card-section class="row items-center">
        <span class="q-ml-sm">
          Al finalizar la novedad se enviarán los respectivos correos y no podrá
          editar la información.

          <span class="text-bold"></span>
        </span>

        <strong class="q-ml-sm q-pt-md">
          Una vez confirmado no podra revertir esta acción.
        </strong>
      </q-card-section>

      <q-card-actions align="center" class="q-my-sm">
        <q-btn
          label="Cancelar"
          color="grey-9"
          @click="
            confirm = false;
            loading = false;
          "
        />
        <q-btn
          label="Continuar"
          color="green-9"
          v-close-popup
          @click="saveInfo()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
  
<script setup>
import { ref, computed, defineProps, onBeforeMount, watch } from "vue";
import { get, put } from "../../services/api.js";
import { notifySuccessRequest } from "../../common/notify.js";
import { notifyErrorRequest } from "../../common/notify.js";
import { useQuasar } from "quasar";

const $q = useQuasar();

const props = defineProps({
  idNew: {
    type: String,
    required: true,
  },
  showDialogProcess: {
    type: Function,
    required: true,
  },
});

console.log(props.idNew);
console.log(props.showDialogProcess);

let statusOptions = ref([
  "REGISTRADA",
  "EN PROCESO",
  "APROBADA",
  "NO APROBADA",
]);

let confirm = ref(false);
let loading = ref(false);
let infoNew = ref({});
let dataBaseNew = ref([]);
let statusSelected = ref("");
let acta = ref("");
let fSopia = ref("");
let aproved = ref(false);
let aprovedEdit = ref(false);
let tpnew = ref("");

let answers = ref([
  {
    data: "",
    date: "",
  },
]);

onBeforeMount(async () => {
  getInfo(props.idNew);
});

function getInfo() {
  get(`/news/${props.idNew}`).then((res) => {
    if (res) {
      infoNew.value = res;
      tpnew.value = res.tpnew;
      console.log(tpnew.value);
      dataBaseNew.value = [
        {
          name: "Tipo de Novedad",
          value: res.tpnew,
        },
        {
          name: "Aprendiz",
          value: `${res.document} - ${res.name} `,
        },
        {
          name: "Telefono",
          value: res.phone,
        },
        {
          name: "Ficha",
          value: `${res.fiche.number} - ${res.fiche.program?.name} `,
        },
        {
          name: "Instructor",
          value: res.instructor?.name,
        },
        {
          name: "Correo Electronico",
          value: res.email,
        },
        {
          name: "Causa de la novedad",
          value: res.cause,
        },
      ];

      if (res.tpnew == "TRASLADO") {
        dataBaseNew.value.push(
          {
            name: "Tipo de traslado",
            value: res.typetransfer,
          },
          {
            name: "Motivo",
            value: res.subtype,
          }
        );
      }

      if (res.typetransfer == "CENTRO") {
        dataBaseNew.value.push(
          {
            name: "Centro de destino",
            value: res.center,
          },
          {
            name: "Ciudad del centro",
            value: res.center,
          }
        );
      } else if (res.typetransfer == "JORNADA") {
        dataBaseNew.value.push({
          name: "Jornada de destino",
          value: res.workingday,
        });
      }

      statusSelected.value = res.state;
      acta.value = res.acta;
      fSopia.value = res.datesofia;
      aproved.value = res.processed;
      aprovedEdit.value = res.processed;

      if (res.answers.length > 0) {
        answers.value = res.answers;
      }
    }
  });
}

function getDateFormat() {
  let date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  return `${year}-${month}-${day}`;
}

function addInputAnswer() {
  console.log(answers.value);
  if (answers.value[0]?.data == "" ) return;
  answers.value.unshift({
    data: "",
    date: "",
  });
}

function removeInputAnswer(index) {
  if (answers.value.length === 0) {
    return;
  }
  answers.value.splice(index, 1);
}

async function updateAdvencedNew() {
  loading.value = true;
  //eliminar todas las respuestas vacias
  answers.value = answers.value.filter((item) => item.data != "");

  if (statusSelected.value == "REGISTRADA") {
    notifyErrorRequest("El debe ser diferente a REGISTRADA");
    loading.value = false;
    return;
  }

  if (
    aproved.value &&
    statusSelected.value != "APROBADA" &&
    statusSelected.value != "NO APROBADA"
  ) {
    notifyErrorRequest("El estado debe ser APROBADA o NO APROBADA");
    loading.value = false;
    return;
  }

  if (aproved.value) {
    if(answers.value[0]?.data == "" || answers.value.length == 0){
      notifyErrorRequest("Por favor escriba una respuesta a la solicitud");
      loading.value = false;
    }else{
      confirm.value = true;
    }
    
  } else {
    await saveInfo();
  }
}

async function saveInfo() {
  await put(`/news/updateadvanced/${props.idNew}`, {
      answers: answers.value,
      numberact: acta.value,
      datesofia: fSopia.value,
      state: statusSelected.value,
      processed: aproved.value,
    })
    .then((res) => {
      if (res) {
        notifySuccessRequest("Novedad actualizada correctamente");
        props.showDialogProcess();
      }
    });

  loading.value = false;
}
</script>
    
    
<style scoped>
.target-answer {
  box-shadow: 0px 0px 5px grey;
  border-radius: 8px;
}

.card-answers {
  max-height: 55vh;
  overflow-y: auto;
}
</style>
    