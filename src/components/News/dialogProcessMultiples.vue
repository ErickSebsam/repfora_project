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
      <div class="text-title text-black text-bold" style="font-size: 26px">
        {{ props.type == "process" ? "Procesos multiples" : "Acta Multiple" }}
      </div>
    </q-card-section>

    <q-card-section class="q-py-none row">
      <div class="col-12 text-subtitle1 q-mb-sm">
        Información de las novedades <q-separator />
      </div>

      <div class="col-12 row justify-center">
        <div class="col-12">
          <q-table
            style="height: 300px"
            flat
            bordered
            no-data-label="Agrega novedades"
            :rows="rows"
            :columns="columns"
            class="q-mx-md my-sticky-header-table"
            rows-per-page-label="Numero de documentos"
            :rows-per-page-options="[0]"
            :pagination="{
              rowsPerPage: 0,
            }"
          >
            <template v-slot:top>
              <div class="full-width row q-px-sm q-py-sm q-ma-none justify-end">
                <div class="col-10 col-sm-4">
                  <q-select
                    filled
                    outlined
                    use-input
                    dense
                    v-model="newSelected"
                    hide-selected
                    fill-input
                    label="Seleccione una novedad"
                    :options="filterNews"
                    options-dense
                    @filter="filterNew"
                    :popup-content-style="{ width: '300px' }"
                    :loading="loading"
                    :disable="loading"
                    input-debounce="0"
                  >
                    <template v-slot:append>
                      <q-icon
                        v-if="newSelected != ''"
                        class="cursor-pointer"
                        name="clear"
                        @click.stop.prevent="newSelected = ''"
                      />
                    </template>
                  </q-select>
                </div>
                <div class="col-1 justify-center flex">
                  <q-btn
                    round
                    dense
                    style="height: 20px"
                    color="green-8"
                    icon="add"
                    @click="addNewToTable()"
                  />
                </div>
              </div>
            </template>

            <template v-slot:body-cell-options="props">
              <q-td :props="props">
                <div>
                  <q-btn
                    round
                    icon="delete_forever"
                    class="q-mx-md"
                    size="sm"
                    color="green-10"
                    @click="removeNewTable(props.row._id)"
                  >
                    <q-tooltip class="bg-blue-grey-1 text-green-9"
                      >Eliminar</q-tooltip
                    >
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="justify-center row">
      <div class="col-12 text-subtitle1 q-mb-sm">Tramite <q-separator /></div>
      <div class="col-md-8 col-12 row q-px-lg flex">
        <div class="col-12 text-subtitle1 text-grey-7">Respuestas</div>
        <div class="col-12 q-mt-md full-height">
          <q-card class="card-answers">
            
            <div class="justify-center flex q-pb-md">
              <q-btn
                round
                color="green-8"
                icon="add"
                @click="addInputAnswer()"
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
                      v-model="answer.data"
                      auto-save
                      v-slot="scope"
                    >
                      <q-item-label caption>
                        <q-input
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
                  <q-item-section side class="cursor-pointer">
                    <q-btn
                      round
                      dense
                      style="height: 20px"
                      flat
                      color="green"
                      icon="delete"
                      @click="removeInputAnswer(index)"
                    />
                  </q-item-section>
                </q-item>
              </q-card-section>

              <q-separator />
            </template>

          </q-card>
        </div>
      </div>
      <div
        class="col-md-4 col-12 row q-px-md"
        :class="$q.screen.width < 500 ? 'q-pt-xl' : 'q-pt-md'"
      >
        <div class="col-12 text-subtitle1 text-grey-7">
          Opciones adicionales
        </div>
        <div class="col-12 q-mt-md">
          <q-form @submit.prevent.stop="confirm = true" novalidate>
            <q-input
              v-if="props.type != 'process'"
              filled
              type="text"
              v-model="acta"
              label="Numero de acta"
              lazy-rules
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> description </span>
              </template>
            </q-input>

            <q-select
              filled
              type="text"
              v-model="statusSelected"
              :options="statusOptions"
              label="Estado"
              options-dense
              use-input
              input-debounce="0"
              lazy-rules
              :class="props.type == 'process' ? 'q-mt-md' : ''"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined">
                  app_registration
                </span>
              </template>
            </q-select>

            <q-checkbox
              v-if="props.type != 'process'"
              class="q-mt-sm"
              color="green-9"
              v-model="aproved"
              label="Finalizar Novedad"
            />

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
        <span class="q-ml-sm" v-if="statusSelected">
          El estado de las novedades seleccionadas sera cambiado a
          <span class="text-bold">{{ statusSelected }}.</span>
        </span>
        <span class="q-ml-sm">
          Una vez confirmado no podra revertir esta acción.
        </span>
      </q-card-section>

      <q-card-actions align="center" class="q-my-sm">
        <q-btn label="Cancelar" color="grey-9" v-close-popup />
        <q-btn
          label="Continuar"
          color="green-9"
          v-close-popup
          @click="saveinfo()"
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
  showDialogProcess: {
    type: Function,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

let confirm = ref(false);
let statusOptions = ref(["APROBADA", "NO APROBADA"]);
let loading = ref(false);
let newsOptions = ref();
let filterNews = ref();
let newSelected = ref("");
let statusSelected = ref("");
let acta = ref("");
let aproved = ref(false);

let answers = ref([
  {
    data: "",
    date: "",
  },
]);

let rows = ref([]);

const columns = ref([
  {
    name: "document",
    label: "NUMERO DE DOCUMENTO",
    field: "document",
    align: "center",
    sortable: true,
  },
  {
    name: "tpnew",
    label: "TIPO DE NOVEDAD",
    field: "tpnew",
    align: "center",
    sortable: true,
  },
  {
    name: "name",
    label: "NOMBRE",
    field: "name",
    align: "center",
    sortable: true,
  },
  {
    name: "email",
    label: "CORREO ELECTRONICO",
    field: "email",
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
    align: "state",
    sortable: true,
  },
  {
    name: "dateregister",
    label: "FECHA DE REGISTRO",
    field: (row) => row.dateregister?.split("T")[0],
    align: "center",
    sortable: true,
  },
  { name: "options", label: "OPCIONES", align: "center" },
]);

onBeforeMount(async () => {
  if (props.type == "acta") {
    getNewsProccedsNullActa();
  } else {
    getNewsProcceds();
    statusOptions.value.unshift("EN PROCESO");
  }
});

function getNewsProcceds() {
  loading.value = true;
  get("/news/onlyprocessed").then((res) => {
    if (res) {
      newsOptions.value = res.news;

      filterNews.value = newsOptions.value.map((v) => {
        return {
          label: `${v.tpnew} - ${v.document} - ${v.name}`,
          value: v._id,
        };
      });

      loading.value = false;
    }
  });
}

function getNewsProccedsNullActa() {
  loading.value = true;
  get("/news/onlyprocessedactanull").then((res) => {
    if (res) {
      newsOptions.value = res.news;

      filterNews.value = newsOptions.value.map((v) => {
        return {
          label: `${v.tpnew} - ${v.document} - ${v.name}`,
          value: v._id,
        };
      });

      loading.value = false;
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
  if (answers.value[0].data == "") return;
  answers.value.unshift({
    data: "",
    date: "",
  });

}

function removeInputAnswer(index) {
  if (answers.value.length === 1) {
    return;
  }
  answers.value.splice(index, 1);
}

async function saveinfo() {
  let idNews;

  console.log(rows.value);

  if (rows.value.length == 0) {
    notifyErrorRequest("Seleccione al menos una novedad");
    return;
  } else {
    idNews = rows.value.map((item) => item._id);
  }
  loading.value = true;
  answers.value = answers.value.filter((item) => item.data != "");

  $q.loading.show({
    message: "Actializando novedades, espere por favor...",
  });

  await put("/news/updatemultiple", {
      news: idNews,
      answers: answers.value,
      type: props.type,
      numberact: acta.value,
      state: statusSelected.value,
      processed: aproved.value,
    })
    .then((res) => {
      if (res) {
        notifySuccessRequest("Novedades actualizadas correctamente");
        props.showDialogProcess(false);
      }
    });

  $q.loading.hide();
  loading.value = false;
}

function addNewToTable() {
  if (newSelected.value == "") return;

  let newSelectedData = newsOptions.value.find(
    (v) => v._id == newSelected.value.value
  );
  rows.value.push(newSelectedData);

  newSelected.value = "";
}

function removeNewTable(id) {
  rows.value = rows.value.filter((v) => v._id != id);
}

function filterNew(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    //reotnar un obejto con label y value ya que el q-select lo necesita
    filterNews.value = newsOptions.value
      .filter((v) => {
        //validar si ya esta en la tabla
        let exist = rows.value.find((v2) => v2._id == v._id);
        if (exist) return false;

        return (
          v.tpnew.toLocaleLowerCase().indexOf(needle) > -1 ||
          v.document.toLocaleLowerCase().indexOf(needle) > -1 ||
          v.name.toLocaleLowerCase().indexOf(needle) > -1
        );
      })
      .map((v) => {
        return {
          label: `${v.tpnew} - ${v.document} - ${v.name}`,
          value: v._id,
        };
      });
  });
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
    