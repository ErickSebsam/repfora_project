<template>
  <div>
    <BtnBack route="/home/instructor" />

    <HeaderLayout
      :title="
        tab == 'news'
          ? 'Novedades'
          : tab == 'improvements'
          ? 'Planes de mejoramiento'
          : 'Consulta'
      "
    />

    <q-tabs
      v-model="tab"
      class="q-mx-lg text-weight-bolder row"
      dense
      align="justify"
      active-color="lime-2"
      active-bg-color="green-9"
      indicator-color="black h"
    >
      <q-tab
        class="text-green-9 bg-white col-4"
        name="news"
        icon="save"
        :label="$q.screen.lt.sm ? '' : 'Novedades'"
      />
      <q-tab
        class="text-green-9 bg-white col-4"
        name="improvements"
        icon="alarm"
        :label="$q.screen.lt.sm ? '' : 'Planes de mejoramiento'"
      />
      <q-tab
        class="text-green-9 bg-white col-4"
        name="consult"
        icon="search"
        :label="$q.screen.lt.sm ? '' : 'Consulta'"
      />
    </q-tabs>
    <q-tab-panels v-model="tab">
      <!-- Comienza el panel de Novedades -->

      <q-tab-panel class="q-px-lg" name="news">
        <div class="row justify-center">
          <div class="col-12 col-sm-6 q-mb-md q-sm-mb-none">
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
          <div class="col-12 col-sm-6 flex justify-end">
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
        </div>

        <!-- TABLE NEWS -->
        <div class="row q-mt-md">
          <div class="col-12">
            <TableNews
              :dataTable="filterTable"
              :activarDesactivar="activarDesactivar"
              :showInfo="showInfo2"
              :showDialogProcess="showDialogProcess"
            />

            <!-- Cuadro de dialogo de la desercion para registrar respuestas -->

            <q-dialog
              v-model="dialogProcess"
              persistent
              :maximized="true"
              class="full-width full-height"
              transition-show="slide-up"
              transition-hide="slide-down"
            >
              <DialogProcess
                :idNew="idProcess"
                :showDialogProcess="showDialogProcess"
              />
            </q-dialog>
          </div>
        </div>

        <!-- Dialogo para insertar o editar una novedad -->

        <q-dialog v-model="prompt2">
          <q-card style="width: 750px; max-width: 80vw">
            <q-card-section class="bg-green-9 q-px-lg q-py-sm">
              <h5
                class="q-mt-sm q-mb-sm text-white text-center text-weight-bold"
              >
                {{ edit ? "EDITAR NOVEDAD" : "REGISTRAR NOVEDAD" }}
              </h5>
            </q-card-section>

            <q-form
              ref="myForm"
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
                  :options="optionsTpNew"
                  options-dense
                  label="Tipo de novedad"
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
              </div>

              <!-- campo tipo documento -->

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
                    <span class="material-symbols-outlined">
                      recent_actors
                    </span>
                  </template>
                </q-select>
              </div>

              <!-- campo numero documento -->

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

              <!-- campo nombre completo -->

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

              <!-- campo correo -->

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

              <!-- campo telefono -->

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

              <!-- campo seleccionar ficha -->

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

              <!-- campo elegir una causa -->

              <div class="col-12 col-sm-6 q-px-lg items-center flex">
                <q-select
                  filled
                  class="full-width custom-qselect"
                  type="text"
                  options-dense
                  behavior="dialog"
                  v-model="form.cause"
                  :options="optionsTpCause"
                  label="Seleccione la causa"
                  lazy-rules
                  :rules="[
                    (val) =>
                      (val && val.toString().trim().length > 0) ||
                      'El campo es requerido',
                  ]"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps" class="custom-option">
                      <q-item-section>
                        <q-item-label caption>{{ scope.opt }}</q-item-label>
                        <q-separator color="grey-5" size="1px" />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <!-- campo seleccionar la fecha del momento que registró la novedad en Sofia -->

              <!-- <div
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
              </div> -->

              <!-- campo para subir imagen del registro sofia plus -->

              <div
                v-if="form.tpNew !== 'PLAN DE MEJORAMIENTO'"
                class="col-12 q-px-lg flex"
              >
                <q-file
                  v-model="form.file"
                  filled
                  label="Evidencia o soporte (pdf, jpg, png)"
                  class="full-width"
                  accept=".jpg, .png, .pdf"
                  @rejected="onRejected"
                  max-file-size="1000000"
                  counter
                  clearable
                >
                  <template v-slot:prepend>
                    <q-icon name="attach_file" />
                  </template>
                  <template v-slot:append>
                    <q-icon name="close" @click="form.file = ''" />
                  </template>
                  <template v-slot:hint> 1Mb max </template>
                </q-file>
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
      </q-tab-panel>

      <q-tab-panel name="improvements">
        <!-- TABLE IMPROVEMENTS -->
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
            <q-dialog v-model="prompt">
              <!-- cuadro de dialogo para detalle de plan de mejoramiento -->

              <q-card style="width: 750px; max-width: 80vw">
                <q-card-section class="bg-green-9 q-px-lg">
                  <h5
                    class="q-mt-sm q-mb-sm text-white text-center text-weight-bold"
                  >
                    INFORMACIÓN DEL PLAN DE MEJORAMIENTO
                  </h5>
                </q-card-section>
                <div class="q-pa-md row">
                  <div class="col-12 text-subtitle1 text-weight-bold">
                    Información del Aprendiz:
                  </div>
                  <div class="col-12 row q-py-md">
                    <q-item-section
                      class="col-sm-4 col-12 q-mb-md q-px-none q-mx-none self-start"
                    >
                      <q-item-label>Nombre</q-item-label>

                      <q-item-label caption> {{ dataNew.name }}</q-item-label>
                    </q-item-section>
                    <q-item-section
                      class="col-sm-3 col-12 q-mb-md q-px-none q-mx-none self-start"
                    >
                      <q-item-label>Documento</q-item-label>

                      <q-item-label caption>
                        {{ dataNew.tpdocument }} - {{ dataNew.document }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section
                      class="col-sm-3 col-12 q-mb-md q-px-none q-mx-none"
                    >
                      <q-item-label>Telefono</q-item-label>

                      <q-item-label caption> {{ dataNew.phone }} </q-item-label>
                    </q-item-section>
                    <q-item-section
                      class="col-sm-4 col-12 q-mb-md q-px-none q-mx-none self-start"
                    >
                      <q-item-label>Correo</q-item-label>

                      <q-item-label caption> {{ dataNew.email }} </q-item-label>
                    </q-item-section>
                  </div>

                  <div class="col-12 text-subtitle1 q-pt-md text-weight-bold">
                    Información de la novedad:
                  </div>
                  <div class="col-12 row justify-center">
                    <q-item-section
                      class="col-sm-2 col-5 q-px-none q-mx-none self-start q-pt-md"
                    >
                      <q-item-label>Ficha</q-item-label>

                      <q-item-label caption>
                        {{ dataNew.fiche?.number }} -
                        {{ dataNew.fiche?.program.name }}
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

                      <q-item-label caption>
                        {{ dataNew.activity }}
                      </q-item-label>
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
          </div>
        </div>
      </q-tab-panel>
      <q-tab-panel name="consult">
        <div class="row justify-center">
          <div class="col-6 flex items-center">
            <q-radio
              v-model="source"
              color="green-7"
              checked-icon="task_alt"
              unchecked-icon="panorama_fish_eye"
              val="news"
              label="Novedades"
            />
            <q-radio
              v-model="source"
              color="green-7"
              checked-icon="task_alt"
              unchecked-icon="panorama_fish_eye"
              val="improvements"
              label="Planes de mejoramiento"
            />
          </div>
          
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select
              filled
              class="full-width"
              use-input
              v-model="ficheSelectedConsult"
              hide-selected
              options-dense
              fill-input
              input-debounce="0"
              label="Seleccione la ficha"
              :options="ficheOptionsfilter"
              @filter="filterFicheConsult"
              :loading="loadingFiche"
              :popup-content-style="{ width: '300px' }"
              @update:model-value="getNewsByFiche()"
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]"
            >
              <template v-slot:append>
                <q-icon
                  v-if="ficheSelectedConsult"
                  class="cursor-pointer"
                  name="clear"
                  @click.stop.prevent="ficheSelectedConsult = ''"
                />
              </template>
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>
        </div>
        <!-- TABLE NEWS -->
        <div class="row q-mt-md">
          <div class="col-12">
            <TableNewsConsult
              :dataTable="filterTypeSource"
              :source="source"
            />
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
  
  <script setup>
import { onBeforeMount, onMounted, ref, computed } from "vue";
import { get, post, put } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { storeUser } from "../store/users.js";
import { useQuasar } from "quasar";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";
import TableNews from "../components/News/tableNews.vue";
import TableNewsConsult from "../components/News/tableNewsConsult.vue"
import DialogProcess from "../components/News/dialogProcess.vue";

const $q = useQuasar();
const userStore = storeUser();

console.log(userStore.newConsult.value);

let prompt = ref(false);
let myForm = ref(null);
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
    name: "type",
    label: "TIPO DE NOVEDAD",
    field: "type",
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
let rows2 = ref([]);
let optionsTable = ref([]);

onBeforeMount(async () => {
  await getNewsByInstructor();
  await getFiches();
});

//variables para el dialog de insertar novedad

let edit = ref(false);
let tab = ref("improvements");
let index = ref("");
let prompt2 = ref(false);
let ficheOptions = ref([]);
let ficheOptionsfilter = ref([]);
let ficheOpt = ref([]);
let filterTable = ref([]);
let filterTableConsult = ref([]);
let idProcess = ref("");
let dialogProcess = ref(false);
let loadingFiche = ref(false);
let optionsTpNew = ref(["DESERCIÓN"]);
let optionsTpDoc = ref(["CC", "TI", "CE", "PASAPORTE", "PPT"]);
/* let optionsTpCause = ref([
  "Por 3 dias consecutivos",
  "Termina perido de aplazamiento y no reingresa",
  "Despues de 2 años no presenta etapa productiva"
]) */

let optionsTpCause = ref([
  "a) En la formación presencial, excepto la complementaria, tener tres (3) días continuos de inasistencia injustificada o acumular cinco (5) días no continuos de inasistencia injustificada durante todo el proceso de formación.",
  "b) En la formación bajo la modalidad virtual en etapa lectiva, se presenta cuando el aprendiz no asiste a tres (3) citaciones seguidas elevadas por el instructor o por el responsable del grupo o no ingresa a su ambiente virtual de formación (plataforma LMS) durante veinte (20) días consecutivos, sin previa justificación soportada ante el sistema de gestión académico-administrativo",
  "c) En la formación a distancia en etapa lectiva, se presenta cuando el aprendiz no justifica la inasistencia a tres (3) encuentros presenciales programados para el desarrollo de sus actividades formativas.",
  "d) En formación presencial, virtual y a distancia en etapa productiva: se presenta inasistencia injustificada durante tres (3) días consecutivos a la empresa con la que desarrolla la alternativa establecida.",
  "e) En la formación complementaria virtual se presenta cuando el aprendiz no registra ingreso al ambiente virtual del programa en el que está matriculado, o ingresa al ambiente virtual y no participa en ninguna de las actividades previstas en el curso.",
  "f) En la formación complementaria presencial se presentan cuando el aprendiz no registra cumplimiento justificado del diez por ciento (10%) de las horas asignadas para la formación.",
]);
let ficheSelectedConsult = ref("");
let source = ref("news")
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
  tpImprovement: "",
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
    tpImprovement: "",
  };
}

function onRejected(files) {
  $q.notify({
    color: "negative",
    position: "top",
    message: "El archivo no cumple con los requisitos",
    icon: "report_problem",
  });
}

// get fiches
async function getFiches() {
  loadingFiche.value = true;
  let rows = [];
  const res = await get("/fiches?status=0");
  if (res) {
    rows = res;
    ficheOpt.value = [];
    rows.forEach((row, index) => {
      ficheOpt.value.push({
        label: `${row.number}: ${row.program.name}`,
        value: row._id,
        code: row.program._id,
      });
    });

    ficheOptions.value = ficheOpt.value;
  }
  loadingFiche.value = false;
}

/* agregar una nueva desercion */

async function postNew() {
  loading.value = true;
  console.log("instructor " + userStore.newConsult.value);
  const formData = new FormData();
  formData.append("file", form.value.file);
  formData.append("tpnew", form.value.tpNew);
  formData.append("instructor", userStore.newConsult.value);
  formData.append("fend", form.value.fend);
  formData.append("tpdocument", form.value.tpDocument);
  formData.append("document", form.value.document);
  formData.append("email", form.value.email);
  formData.append("name", form.value.name);
  formData.append("phone", form.value.phone);
  formData.append("fiche", form.value.ficheSelected.value);
  formData.append("cause", form.value.cause);
  formData.append("type", form.value.tpImprovement);

  $q.loading.show({
    message: "Cargando contenido, esto puede tardar unos segundos...",
  });

  await post("/news/register", formData).then(async (res) => {
    if (res) {
      notifySuccessRequest("Novedad registrada correctamente");
      prompt.value = false;
      edit.value = false;
      cleanForm();
      await getNewsByInstructor();
    }
  });
  console.log("hola");
  $q.loading.hide();
  loading.value = false;
  myForm.value.resetValidation();
}

/* editar una desercion */

async function putNew() {
  loading.value = true;
  const formData = new FormData();

  formData.append("file", form.value.file);
  formData.append("tpnew", form.value.tpNew);
  formData.append("fend", form.value.fend);
  formData.append("tpdocument", form.value.tpDocument);
  formData.append("document", form.value.document);
  formData.append("email", form.value.email);
  formData.append("name", form.value.name);
  formData.append("phone", form.value.phone);
  formData.append("fiche", form.value.ficheSelected.value);
  formData.append("cause", form.value.cause);
  formData.append("type", form.value.tpImprovement);

  $q.loading.show({
    message: "Cargando contenido, esto puede tardar unos segundos...",
  });

  await put(`/news/update/${index.value}`, formData).then(async (res) => {
    if (res) {
      notifySuccessRequest("Novedad actualizada correctamente");
      edit.value = false;
      prompt.value = false;
      cleanForm();
      await getNewsByInstructor();
    }
  });
  $q.loading.hide();
  loading.value = false;
  myForm.value.resetValidation();
}

async function activarDesactivar(data) {
  if (data.status === 0) {
    await put(`/news/inactive/${data._id}`);
  } else {
    await put(`/news/active/${data._id}`);
  }
  await getNewsByInstructor();
}

async function showDialogProcess(id = null) {
  console.log(id);
  dialogProcess.value = !dialogProcess.value;
  idProcess.value = id;

  if (!id) {
    await getNewsByInstructor();
  }
}

function showInfo2(data) {
  index.value = data._id;
  form.value.tpNew = data.tpnew;
  form.value.tpDocument = data.tpdocument;
  form.value.document = data.document;
  form.value.name = data.name;
  form.value.email = data.email;

  form.value.phone = data.phone;
  form.value.cause = data.cause;
  form.value.dateRegister = data.createdAt?.split("T")[0].replace(/-/g, "/");

  form.value.ficheSelected = {
    label: `${data.fiche.number}: ${data.fiche.program.name}`,
    value: data.fiche._id,
  };
  edit.value = true;
  prompt2.value = true;
  loading.value = false;
}

function filterFiche(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    ficheOptions.value = ficheOpt.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterFicheConsult(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    ficheOptionsfilter.value = ficheOpt.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

/* function clearOtherFields() {
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
} */

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
    rows.value = data.improvements.map((v, i) => ({
      index: i + 1,
      ...v,
    }));
    console.log(rows.value);
    optionsTable.value = rows.value;

    filterTable.value = data.news.map((v, i) => ({
      index: i + 1,
      ...v,
    }));
    console.log(filterTable.value);
    optionsTable.value = rows2.value;
  }
}

async function getNewsByFiche() {
  try {
    const data = await get(`news/fiche/${ficheSelectedConsult.value.value}/items`);
    filterTableConsult.value = data
  } catch (error) {
    console.log(error);
  }
}

const filterTypeSource = computed(()=>{
  if (source.value=="news" && ficheSelectedConsult.value!==""){
      return filterTableConsult.value.filter((item,i)=>item.source=="NEWS")
    }else if (source.value=="improvements" && ficheSelectedConsult.value!==""){
      return filterTableConsult.value.filter((item,i)=>item.source=="IMPROVEMENT")
    }else {
      return filterTableConsult.value = []
    }
})

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

/* Estilos de las opciones */
.custom-option {
  padding: 12px;
  transition: background 0.3s;
}

.custom-option:hover {
  background-color: #318335;
  color: white;
}

.q-item__label--caption {
  font-size: 12px;
  color: black;
}

.q-item__label:hover {
  color: white;
}

/* .close-dialog {
    border: 1px solid #a9f7a0
  
  } */
</style>
  