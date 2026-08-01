<template>
  <div>
    <BtnBack route="/home/instructor" />

    <HeaderLayout title="Planes de Mejoramiento" />

    <div class="row justify-center">
      <div class="col-1"></div>
      <div class="col-5">
        <q-btn
          class="bg-green-9 text-white"
          @click="(prompt2 = true), cleanForm(), (edit = false)"
          ><span
            class="material-symbols-outlined q-mr-sm"
            style="font-size: 20px"
          >
            add_circle
          </span>
          Crear
        </q-btn>
      </div>
      <div class="col-5 flex justify-end">
        <q-select
          filled
          style="width: 350px"
          outlined
          use-input
          dense
          v-model="aprendizSelected"
          options-dense
          hide-selected
          fill-input
          label="Nombre del aprendiz"
          input-debounce="0"
          :options="filterOptionsAprendiz"
          :popup-content-style="{ width: '300px' }"
          @filter="filterAprendiz"
        >
          <template v-slot:append>
            <q-icon
              v-if="aprendizSelected !== ''"
              class="cursor-pointer"
              name="clear"
              @click.stop.prevent="
                aprendizSelected = '';
                rows = optionsTable;
              "
            />
          </template>
        </q-select>
      </div>
      <div class="col-1"></div>
    </div>


    <!-- TABLE INFO -->
    <div class="row q-mt-md">
      <div class="col-12 q-mb-lg">
        <q-table
          flat
          bordered
          no-data-label="Sin registros aún"
          :rows="rows"
          :columns="columns"
          row-key="index"
          class="q-mx-md my-sticky-header-table"
          rows-per-page-label="Numero de documentos"
          :rows-per-page-options="[0]"
          :pagination="{
            rowsPerPage: 0,
          }"
        >
          <template v-slot:body-cell-options="props">
            <q-td :props="props">
              <div>
                <q-btn
                  round
                  icon="visibility"
                  class="q-mx-sm"
                  size="xs"
                  color="blue-10"
                  @click="showInfo(props.row)"
                >
                  <q-tooltip
                    transition-show="flip-right"
                    transition-hide="flip-left"
                  >
                    Ver
                  </q-tooltip>
                </q-btn>
                <q-btn
                  :disable="props.row.status != 'REGISTRADO' || loading"
                  round
                  icon="check"
                  class="q-mx-sm"
                  size="xs"
                  color="green-10"
                  :loading="loading"
                  @click="aproveNew(props.row._id)"
                >
                  <q-tooltip
                    transition-show="flip-right"
                    transition-hide="flip-left"
                  >
                    Aprobar
                  </q-tooltip>
                </q-btn>
                <q-btn
                  :disable="props.row.status != 'REGISTRADO' || loading"
                  round
                  icon="cancel"
                  class="q-mx-sm"
                  size="xs"
                  color="red-10"
                  :loading="loading"
                  @click="notAproveNew(props.row._id)"
                >
                  <q-tooltip
                    transition-show="flip-right"
                    transition-hide="flip-left"
                  >
                    No aprobar
                  </q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-datestart="props">
            <q-td
              :props="props"
              :style="{
                'background-color': validateColor(
                  props.row.createdAt,
                  props.row.fend,
                  props.row.status
                ),
              }"
            >
              <div>
                <span>
                  {{ props.row.createdAt?.split("T")[0] }}
                </span>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-dateend="props">
            <q-td
              :props="props"
              :style="{
                'background-color': validateColor(
                  props.row.createdAt,
                  props.row.fend,
                  props.row.status
                ),
              }"
            >
              <div>
                <span>
                  {{ props.row.fend?.split("T")[0] }}
                </span>
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- cuadro de dialogo para detalle de aplazamiento -->

    <q-dialog v-model="prompt">
      <q-card style="width: 750px; max-width: 80vw">
        <q-card-section class="bg-green-9 q-px-lg">
          <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
            INFORMACIÓN DEL APLAZAMIENTO
          </h5>
        </q-card-section>
        <div class="q-pa-md row">
          <div class="col-12 text-subtitle1">Información del Aprendiz:</div>
          <div class="col-12 row justify-center q-py-md">
            <q-item-section
              class="col-sm-3 col-5 q-px-none q-mx-none self-start"
            >
              <q-item-label>Nombre</q-item-label>

              <q-item-label caption> {{ dataNew.name }}</q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-3 col-5 q-px-none q-mx-none self-start"
            >
              <q-item-label>Documento</q-item-label>

              <q-item-label caption>
                {{ dataNew.tpdocument }} - {{ dataNew.document }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-3 col-5 q-px-none q-mx-none self-start"
            >
              <q-item-label>Correo</q-item-label>

              <q-item-label caption> {{ dataNew.email }} </q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-2 col-5 q-px-none q-mx-none self-start"
            >
              <q-item-label>Telefono</q-item-label>

              <q-item-label caption> {{ dataNew.phone }} </q-item-label>
            </q-item-section>
          </div>

          <div class="col-12 text-subtitle1 q-pt-md">
            Información de la novedad:
          </div>
          <div class="col-12 row justify-center">
            <q-item-section
              class="col-sm-2 col-5 q-px-none q-mx-none self-start q-pt-md"
            >
              <q-item-label>Ficha</q-item-label>

              <q-item-label caption>
                {{ dataNew.fiche?.number }} - {{ dataNew.fiche?.program.name }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-4 col-5 q-px-none q-mx-none self-start q-pt-md"
            >
              <q-item-label>Competencia</q-item-label>

              <q-item-label caption>
                {{ dataNew.competence.name }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-4 col-5 q-px-none q-mx-none self-start q-pt-md"
            >
              <q-item-label>Resultado</q-item-label>

              <q-item-label caption
                >{{ dataNew.outcome.outcomes }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-2 col-5 q-px-none q-mx-none self-start q-pt-md"
            >
              <q-item-label>Fecha de registro</q-item-label>

              <q-item-label caption>
                {{ dataNew.createdAt.split("T")[0] }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-2 col-5 q-px-none q-mx-none self-start q-pt-md"
            >
              <q-item-label>Fecha de entrega</q-item-label>

              <q-item-label caption>
                {{ dataNew.fend.split("T")[0] }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              class="col-sm-6 col-5 q-px-none q-mx-none self-start q-pt-md"
            >
              <q-item-label>Actividad</q-item-label>

              <q-item-label caption> {{ dataNew.activity }} </q-item-label>
            </q-item-section>
          </div>
        </div>
        <q-card-section class="q-px-lg justify-center flex">
          <q-btn
            :disable="dataNew.status != 'REGISTRADO' || loading"
            :loading="loading"
            icon="check"
            class="q-mx-sm"
            size="md"
            color="green-10"
            @click="aproveNew(dataNew._id)"
          >
            Aprobar
          </q-btn>
          <q-btn
            :disable="dataNew.status != 'REGISTRADO' || loading"
            :loading="loading"
            icon="cancel"
            class="q-mx-sm"
            size="md"
            color="red-10"
            @click="notAproveNew(dataNew._id)"
          >
            No aprobar
          </q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialogo para insertar o editar una novedad -->

    <q-dialog v-model="prompt2">
      <q-card style="width: 750px; max-width: 80vw">
        <q-card-section class="bg-green-9 q-px-lg q-py-sm">
          <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
            {{ edit ? "EDITAR NOVEDAD" : "REGISTRAR NOVEDAD" }}
          </h5>
        </q-card-section>

        <q-form
          class="row q-pt-lg flex"
          @submit.prevent.stop="edit ? putNew() : postNew()"
          novalidate
        >
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select
              filled
              class="full-width"
              type="text"
              v-model="form.tpNew"
              :options="optionsTpNew.filter((item) => item != 'TODAS')"
              options-dense
              label="Tipo de novedad"
              lazy-rules
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
              @update:model-value="
                clearOtherFields();
                clearOtherFields2();
              "
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> list </span>
              </template>
            </q-select>
          </div>

          
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select
              filled
              class="full-width"
              type="text"
              options-dense
              v-model="form.tpDocument"
              :options="optionsTpDoc"
              label="Tipo de documento"
              lazy-rules
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> recent_actors </span>
              </template>
            </q-select>
          </div>


          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input
              class="full-width"
              filled
              type="text"
              v-model="form.document"
              label="Numero de documento"
              lazy-rules
              :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> pin </span>
              </template>
            </q-input>
          </div>


          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input
              filled
              class="full-width"
              type="text"
              v-model="form.name"
              label="Nombre completo"
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
          </div>


          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input
              filled
              class="full-width"
              type="email"
              v-model="form.email"
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
          </div>


          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input
              filled
              class="full-width"
              type="number"
              v-model="form.phone"
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
          </div>


          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select
              filled
              class="full-width"
              use-input
              v-model="form.ficheSelected"
              hide-selected
              options-dense
              fill-input
              input-debounce="0"
              label="Seleccione la ficha"
              :options="ficheOptions"
              @filter="filterFiche"
              :loading="loadingFiche"
              @update:model-value="getCompetences()"
              :popup-content-style="{ width: '300px' }"
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
            >
              <template v-slot:append>
                <q-icon
                  v-if="form.ficheSelected"
                  class="cursor-pointer"
                  name="clear"
                  @click.stop.prevent="form.ficheSelected = ''"
                />
              </template>
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>
          <div
            v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
            <q-select
              filled
              class="full-width"
              use-input
              v-model="form.competence"
              hide-selected
              options-dense
              fill-input
              input-debounce="0"
              label="Seleccione la competencia"
              :options="filterOptionsCompences"
              :disable="optionsCompetence.length == 0"
              @filter="filterCompetence"
              :loading="loadingCompetence"
              :popup-content-style="{ width: '300px' }"
              @update:model-value="getOutcomes()"
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
            >
              <template v-slot:append>
                <q-icon
                  v-if="form.ficheSelected"
                  class="cursor-pointer"
                  name="clear"
                  @click.stop.prevent="form.ficheSelected = ''"
                />
              </template>
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>
          <div
            v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
            <q-select
              filled
              class="full-width"
              use-input
              v-model="form.outcome"
              hide-selected
              options-dense
              fill-input
              input-debounce="0"
              label="Seleccione el resultado"
              :options="filterOptionsOutcomes"
              :disable="optionsOutcome.length == 0"
              @filter="filterOutcome"
              :loading="loadingOutcome"
              :popup-content-style="{ width: '300px' }"
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
            >
              <template v-slot:append>
                <q-icon
                  v-if="form.ficheSelected"
                  class="cursor-pointer"
                  name="clear"
                  @click.stop.prevent="form.ficheSelected = ''"
                />
              </template>
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>

          <div
            v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
          <q-select
              filled
              outlined
              use-input
              hide-selected
              input-debounce="0"
              fill-input
              class="full-width"
              type="text"
              v-model="form.instructor"
              :options="filterOptionsInstructors"
              options-dense
              label="Instructor asignado"
              lazy-rules
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
              :loading="loadingInstr"
              @filter="filterInstructor"
              :popup-content-style="{ width: '300px' }"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>

          <div
            v-if="form.tpNew !== 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
            <q-input
              filled
              type="text"
              v-model="form.cause"
              label="Causa"
              autogrow
              class="q-mb-md full-width"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> note_alt </span>
              </template>
            </q-input>
          </div>
          <div
            v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
            <q-input
              class="full-width"
              filled
              autogrow
              type="input"
              v-model="form.activity"
              label="Actividad"
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
          </div>
          <div
            v-if="form.tpNew !== 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
            <q-input
              filled
              class="full-width"
              v-model="form.dateRegister"
              mask="date"
              :rules="['date']"
              lazy-rules
              label="Fecha Registro en Sofia Plus"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="form.dateRegister" minimal>
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
                <span class="material-symbols-outlined"> today </span>
              </template>
            </q-input>
          </div>

          <div
            v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
            <q-input
              filled
              class="full-width"
              v-model="form.fend"
              mask="date"
              :rules="['date']"
              lazy-rules
              label="Fecha Fin"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="form.fend" minimal>
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
                <span class="material-symbols-outlined"> today </span>
              </template>
            </q-input>
          </div>
          <div
            v-if="form.tpNew !== 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg flex"
          >
            <q-file
              v-model="form.file"
              filled
              label="Evidencia Fotográfica (1Mb max)"
              class="full-width"
              accept=".jpg, .png"
              @rejected="onRejected"
              max-file-size="1000000"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
              <template v-slot:append>
                <q-icon name="close" @click="form.file = ''" />
              </template>
            </q-file>
          </div>

          <div
            v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex"
          >
            <q-select
              filled
              class="full-width"
              type="text"
              v-model="form.status"
              :options="optionsStatus"
              options-dense
              label="Estado"
              lazy-rules
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined">
                  check_circle_outline
                </span>
              </template>
            </q-select>
          </div>

          <div class="justify-center flex col-12 q-pb-md">
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
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>
  
  <script setup>
import { onBeforeMount, onMounted, ref } from "vue";
import { get, put } from "../services/api.js";
import { storeUser } from "../store/users.js";
import { useQuasar } from "quasar";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();
const userStore = storeUser();

let prompt = ref(false);
let aprendizSelected = ref();
let dataNew = ref({});
let filterOptionsAprendiz = ref([]);
let loading = ref(false);
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
    field: "document",
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
    name: "datestart",
    label: "FECHA REGISTRO",
    field: "createdAt",
    align: "center",
    sortable: true,
  },
  {
    name: "dateend",
    label: "FECHA ENTREGA",
    field: "fend",
    align: "center",
    sortable: true,
  },
  {
    name: "status",
    label: "ESTADO",
    field: "status",
    align: "center",
    sortable: true,
  },
  { name: "options", label: "OPCIONES", align: "center" },
]);

let rows = ref([]);
let optionsTable = ref([]);


onBeforeMount(async () => {
  
  await getFiches();
  await getInstructors();
  await getNewsByInstructor()
});

//variables para el dialog de insertar novedad

let edit = ref(false);
let index = ref("");
let prompt2 = ref(false)
let optionsCompetence = ref([]);
let optionsOutcome = ref([]);
let optionsInstructor = ref([]);
let filterOptionsInstructors = ref([]);
let filterOptionsOutcomes = ref([]);
let ficheOptions = ref([]);
let ficheOpt = ref([]);
let filterOptionsCompences = ref([]);
let loadingFiche = ref(false);
let loadingCompetence = ref(false);
let loadingOutcome = ref(false);
let loadingInstr = ref(false);
let optionsTpNew = ref([
  "DESERCIÓN",
  "PLAN DE MEJORAMIENTO",
]);
let optionsTpDoc = ref(["CC", "TI", "CE", "PASAPORTE", "PPT"]);
let optionsTypeTransfer = ref(["CENTRO", "JORNADA", "POR CERTIFICACIÓN"]);
let optionsWorkingDay = ref(["MAÑANA", "TARDE", "NOCHE"]);
let optionsStatus = ref(["REGISTRADO", "APROBADO", "NO APROBADO", "VENCIDO"]);

let form = ref({
  tpNew: "",
  typeTransfer: "",
  subtype: "",
  center: "",
  city: "",
  workingDay: "",
  duration: "",
  fend: "",
  tpDocument: "",
  document: "",
  name: "",
  email: "",
  phone: "",
  ficheSelected: "",
  cause: "",
  dateRegister: "",
  file: "",
  competence: "",
  outcome: "",
  activity: "",
  status: "",
  instructor: "",
});

//-- funciones del modal

function cleanForm() {
  loading.value = false;
  index.value = "";
  form.value = {
    tpNew: "",
    typeTransfer: "",
    subtype: "",
    center: "",
    city: "",
    duration: "",
    fend: "",
    tpDocument: "",
    document: "",
    name: "",
    email: "",
    phone: "",
    statusStudent: "",
    ficheSelected: "",
    cause: "",
    dateRegister: "",
    file: "",
    competence: "",
    outcome: "",
    activity: "",
    status: "",
    instructor: "",
  };
}

// get instructors

async function getInstructors() {
  loadingInstr.value = true;
  const data = await get("/instructors?status=0");
  console.log(data);
  if (data) {
    optionsInstructor.value = data.map((v) => ({
      label: v.name,
      value: v._id,
    }));
  }
  filterOptionsInstructors.value = optionsInstructor.value;
  loadingInstr.value = false;
}


// get fiches
async function getFiches() {
  loadingFiche.value = true;
  const res = await get("/fiches?status=0");
  console.log(res);
  if (res) {
    rows.value = res;
    ficheOpt.value = [];
    rows.value.forEach((row, index) => {
      ficheOpt.value.push({
        label: `${row.number}: ${row.program.name}`,
        value: row._id,
        code: row.program._id,
      });
    });

    ficheOptions.value = ficheOpt.value;
    console.log(ficheOptions.value);
  }
  loadingFiche.value = false;
}

//get competences
async function getCompetences() {
  form.value.competence = "";
  form.value.outcome = "";
  loadingCompetence.value = true;
  console.log(form.value.ficheSelected);
  const data = await get(`/competences/program/${form.value.ficheSelected.code}`);
  if (data) {
    optionsCompetence.value = data.map((v) => ({
      label: v.name,
      value: v._id,
    }));
  }
  loadingCompetence.value = false;
}

//get News for instructor


//get outcomes
async function getOutcomes() {
  form.value.outcome = "";
  loadingOutcome.value = true;
  const data = await get(`/outcomes/competence/${form.value.competence.value}`);

  if (data) {
    optionsOutcome.value = data[0].outcomes.map((v) => ({
      label: v.outcomes,
      value: v._id,
    }));
    loadingOutcome.value = false;
  }
}

function filterFiche(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    ficheOptions.value = ficheOpt.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterCompetence(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsCompences.value = optionsCompetence.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterOutcome(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsOutcomes.value = optionsOutcome.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterInstructor(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsInstructors.value = optionsInstructor.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function clearOtherFields() {
  form.value.center = "";
  form.value.city = "";
  form.value.fend = "";
  form.value.duration = "";
  form.value.typeTransfer = "";
  form.value.subtype = "";

}

function clearOtherFields2() {
  form.value.center = "";
  form.value.city = "";
  form.value.workingDay = "";
  form.value.fend = "";
  form.value.duration = "";
}


//----------------------



function validateColor(fstart, fend, status) {
  const dateStart = new Date(fstart);
  const dateEnd = new Date(fend);
  const currentDate = new Date();

  if (currentDate >= dateEnd && status == "REGISTRADO") {
    return "#ff5a5a";
  } else if (
    currentDate >= dateStart &&
    currentDate < dateEnd &&
    status == "REGISTRADO"
  ) {
    return "#fffca0";
  } else if (status != "REGISTRADO") {
    return "#a9f7a0";
  }

  return "white";
}

async function getNewsByInstructor() {
  const instrValue = userStore.newConsult?.value;
  const data = await get(`/news/newbyinstructor/${instrValue}`);
  if (data) {
    rows.value = data.map((v, i) => ({
      index: i + 1,
      ...v,
    }));
    optionsTable.value = rows.value;
  }
}

async function showInfo(data) {
  prompt.value = true;
  dataNew.value = data;
}

async function aproveNew(id) {
  loading.value = true;
  const instrValue = userStore.newConsult?.value;
  await put("/news/aprovenew", { newid: id, instr: instrValue }).then(async (res) => {
    if (res) {
      prompt.value = false;
      await getNewsByInstructor();
    }
  });
  loading.value = false;
}

async function notAproveNew(id) {
  loading.value = true;
  const instrValue = userStore.newConsult?.value;
  await put("/news/notaprovenew", { newid: id, instr: instrValue }).then(async (res) => {
    if (res) {
      prompt.value = false;
      await getNewsByInstructor();
    }
  });
  loading.value = false;
}

function filterAprendiz(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    const aprendiz = optionsTable.value.filter(
      (v) => v.name.toLocaleLowerCase().indexOf(needle) > -1
    );
    filterOptionsAprendiz.value = aprendiz.map((v) => ({
      label: v.name,
      value: v._id,
    }));
    rows.value = aprendiz;
  });
}
</script>
  
  <style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

/* .close-dialog {
    border: 1px solid #a9f7a0
  
  } */
</style>
  