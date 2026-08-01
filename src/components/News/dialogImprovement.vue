<template>
  <q-card class="">
    <q-bar class="bg-green-9">
      <q-space />
      <q-btn dense round icon="close" color="white" class="text-green-9" v-close-popup>
        <q-tooltip class="bg-white text-green-9">Cerrar</q-tooltip>
      </q-btn>
    </q-bar>

    <q-card-section class="justify-center flex">
      <div class="text-title text-black text-bold" style="font-size: 30px">
        Planes De Mejoramiento
      </div>
    </q-card-section>

    <div class="row col-12 q-mx-lg q-gutter-sm items-center">
      <div class="column col-12 col-sm-auto">
        <q-btn class="bg-green-9 text-white q-px-md" @click="(prompt = true), cleanForm(), (edit = false)"><span class="material-symbols-outlined q-mr-sm" style="font-size: 18px">add_circle</span>Crear</q-btn>
      </div>
      <div class="row col q-gutter-sm justify-end">
        <div class="row col-12 col-md  q-gutter-y-sm" :class="$q.screen.lt.sm ? '' : 'q-gutter-x-sm'">
          <q-input class="col-6 col-sm-5 " filled dense placeholder="aaaa/mm/dd" v-model="dtStart" mask="date" label="Fecha inicio">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="dtStart" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input class="col-6 col-sm-5" filled dense placeholder="aaaa/mm/dd" v-model="dtEnd" mask="date" label="Fecha Fin">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="dtEnd" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-btn dense class="col-12 col-sm-1 bg-green-7 text-white"><span class="material-symbols-outlined" style="font-size: 18px" @click="getImprovementFilter()">search</span>{{ $q.screen.lt.sm ? 'Consulta' : '' }}</q-btn>
        </div>
        <div class="col-12 col-sm q-gutter-sm q-mx-none">
          <q-select filled outlined use-input dense v-model="aprendizSelected" options-dense hide-selected fill-input
            label="Nombre del aprendiz" input-debounce="0" :popup-content-style="{ width: '300px' }"
            @filter="filterAprendiz" @update:model-value="filterSelectedAprendiz">
            <template v-slot:append>
              <q-icon v-if="aprendizSelected !== ''" class="cursor-pointer" name="clear" @click.stop.prevent="
                aprendizSelected = '';
              rows = optionsTable;
              " />
            </template>
          </q-select>
        </div>
      </div>
    </div>

    <q-card-section class="justify-center row">
      <div class="col-12 q-mb-lg">
        <q-table style="height: 72vh" flat bordered no-data-label="Sin registros aún" :rows="rows" :columns="columns"
          row-key="index" class="q-mx-md my-sticky-header-table" rows-per-page-label="Numero de documentos"
          :rows-per-page-options="[0]" :pagination="{
            rowsPerPage: 0,
          }">
          <template v-slot:body-cell-options="props">
            <q-td :props="props">
              <div>
                <q-btn round icon="edit" class="q-mx-md" size="xs" color="green-10"
                  @click="showInfo(props.row)"></q-btn>
                <q-btn round icon="notifications_active" :loading="loadingNotify" :disable="loadingNotify" size="xs"
                  @click="notifyNew(props.row._id)" :style="{
                    'background-color': validateColor(
                      props.row.createdAt,
                      props.row.fend,
                      props.row.status
                    ),
                  }">
                  <q-tooltip transition-show="flip-right" transition-hide="flip-left">
                    Notificar
                  </q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-datestart="props">
            <q-td :props="props" :style="{
              'background-color': validateColor(
                props.row.createdAt,
                props.row.fend,
                props.row.status
              ),
            }">
              <div>
                <span>
                  {{ props.row.createdAt?.split("T")[0] }}
                </span>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-dateend="props">
            <q-td :props="props" :style="{
              'background-color': validateColor(
                props.row.createdAt,
                props.row.fend,
                props.row.status
              ),
            }">
              <div>
                <span>
                  {{ props.row.fend?.split("T")[0] }}
                </span>
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
    </q-card-section>
  </q-card>

  <q-dialog v-model="prompt">
    <q-card style="width: 750px; max-width: 80vw">
      <q-card-section class="bg-green-9 q-px-lg q-py-md">
        <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
          {{ edit ? "MODIFIFCA LA INFORMACIÓN" : "DILIGENCIA LA INFORMACIÓN" }}
        </h5>
      </q-card-section>

      <!-- Formulario -->

      <div class="q-pa-md">
        <q-form class="row q-pt-lg flex justify-center" @submit.prevent.stop="edit ? putNew() : postNew()" novalidate>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select disable filled class="full-width" type="text" input-debounce="0" v-model="form.tpnew"
              :options="optionsTpNew" options-dense label="Tipo de novedad" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" :popup-content-style="{ width: '300px' }">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> list </span>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select filled class="full-width" type="text" options-dense v-model="form.tpImprovement"
              :options="optionstpImprovement" label="Academico o Disciplinario..." lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> recent_actors </span>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-input class="full-width" filled type="text" v-model="form.name" label="Nombre del aprendiz" lazy-rules
              :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> badge </span>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select filled class="full-width" type="text" v-model="form.tpdocument" :options="optionsTpDoc"
              options-dense input-debounce="0" label="Tipo de documento" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" :popup-content-style="{ width: '300px' }">
              <template v-slot:prepend>
                <span class="material-symbols-outlined">
                  format_indent_increase
                </span>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-input class="full-width" filled type="text" v-model="form.document" label="Documento del aprendiz"
              lazy-rules :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> 123 </span>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-input class="full-width" filled type="number" v-model="form.phone" label="Teléfono del aprendiz"
              lazy-rules :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
                (val) =>
                  (val && val.toString().trim().length > 9) ||
                  'El campo debe tener 10 digitos',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> phone_in_talk </span>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-input class="full-width" filled type="text" v-model="form.email" label="Correo del aprendiz" lazy-rules
              :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> outgoing_mail </span>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select filled outlined use-input hide-selected input-debounce="0" fill-input class="full-width"
              type="text" v-model="form.fiche" :options="filterOptionsFiches" options-dense label="Ficha" lazy-rules
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" :loading="loadingFiche" @update:model-value="getCompetences()" @filter="filterFiche"
              :popup-content-style="{ width: '300px' }">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select filled outlined use-input hide-selected fill-input input-debounce="0" class="full-width"
              type="text" v-model="form.competence" :options="filterOptionsCompences"
              :disable="optionsCompetence.length == 0" @filter="filterCompetence" options-dense label="Competencia"
              lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" :loading="loadingCompetence" :popup-content-style="{ width: '300px' }"
              @update:model-value="getOutcomes()">
              <template v-slot:prepend>
                <span class="material-symbols-outlined">receipt_long </span>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select filled outlined use-input hide-selected input-debounce="0" fill-input class="full-width"
              type="text" v-model="form.outcome" :options="filterOptionsOutcomes" :disable="optionsOutcome.length == 0"
              @filter="filterOutcome" options-dense label="Resultado" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" :loading="loadingOutcome" :popup-content-style="{ width: '300px' }">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> task_alt </span>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select filled outlined use-input hide-selected input-debounce="0" fill-input class="full-width"
              type="text" v-model="form.instructor" :options="filterOptionsInstructors" options-dense
              label="Instructor asignado" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" :loading="loadingInstr" @filter="filterInstructor" :popup-content-style="{ width: '300px' }">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-input class="full-width" filled autogrow type="input" v-model="form.activity" label="Actividad"
              lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> description </span>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 items-center flex">
            <q-input filled class="full-width q-px-md" v-model="form.fend" mask="date" :rules="['date']" lazy-rules
              label="Fecha fin">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.fend" minimal>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
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

          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select filled class="full-width" type="text" v-model="form.status" :options="optionsStatus" options-dense
              label="Estado" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined">
                  check_circle_outline
                </span>
              </template>
            </q-select>
          </div>
          <div class="justify-center flex col-12 q-pb-md">
            <q-btn icon="save_as" label="GUARDAR" type="submit" class="q-mt-md q-mb-sm q-mx-sm save_as"
              :loading="loading">
              <template v-slot:loading>
                <q-spinner-oval color="white" size="1em" />
              </template>
            </q-btn>

            <q-btn type="button" class="q-mt-md q-mb-sm q-mx-sm" to="" v-close-popup><span
                class="material-symbols-outlined q-mr-sm" style="font-size: 23px">
                cancel </span>CERRAR</q-btn>
          </div>
        </q-form>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onBeforeMount } from "vue";
import { get, post, put } from "../../services/api.js";
import { notifySuccessRequest } from "../../common/notify.js";
import { useQuasar } from "quasar";

const $q = useQuasar();

let prompt = ref(false);
let edit = ref(false);
let index = ref("");
let loading = ref(false);
let loadingNotify = ref(false);
let loadingFiche = ref(false);
let loadingInstr = ref(false);
let loadingCompetence = ref(false);
let loadingOutcome = ref(false);
let aprendizSelected = ref();
let dtStart = ref();
let dtEnd = ref();


let form = ref({
  tpnew: "PLAN DE MEJORAMIENTO",
  name: "",
  tpdocument: "",
  document: "",
  email: "",
  phone: "",
  fiche: "",
  competence: "",
  outcome: "",
  fend: "",
  activity: "",
  status: "",
  instructor: "",
  tpImprovement: "",
});

let optionsFiche = ref([]);
let filterOptionsFiches = ref([]);
let optionsCompetence = ref([]);
let filterOptionsCompences = ref([]);
let optionsOutcome = ref([]);
let filterOptionsOutcomes = ref([]);
let optionsInstructor = ref([]);
let filterOptionsInstructors = ref([]);
let optionsStatus = ref(["REGISTRADO", "APROBADO", "NO APROBADO", "VENCIDO"]);
let optionsTpDoc = [
  { label: "Cédula de ciudadanía", value: "CC" },
  { label: "Cédula de extranjería", value: "CE" },
  { label: "Nit", value: "NIT" },
  { label: "Pasaporte", value: "PASAPORTE" },
  { label: "PPT", value: "PPT" },
];

let optionsTpNew = ref(["PLAN DE MEJORAMIENTO"]);
let optionstpImprovement = ref(["ACADÉMICO", "DISCIPLINARIO"]);
let columns = ref([
  {
    name: "index",
    label: "CÓDIGO",
    field: (row) => row.code ?? "?",
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
    name: "type",
    label: "TIPO DE NOVEDAD",
    field: "type",
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
    name: "fiche",
    label: "FICHA",
    field: (row) => row.fiche.number,
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
  {
    name: "tramit",
    label: "INSTRUCTOR ASIGNADO",
    field: (row) => row.instructor?.name ?? "",
    align: "center",
    sortable: true,
  },
  { name: "options", label: "OPCIONES", align: "center" },
]);

let rows = ref([]);
let optionsTable = ref([]);

onBeforeMount(async () => {
  await getImprovements();
  await getFiches();
  await getInstructors();
});

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

async function getImprovements() {
  const data = await get("/news/onlyimprovement");
  if (data) {
    rows.value = data.map((v, i) => ({
      index: i + 1,
      ...v,
    }));
    optionsTable.value = rows.value;
  }
}

async function getImprovementFilter() {
  const data = await get("/news/onlyimprovement", { dateStart: dtStart.value, dateEnd: dtEnd.value });
  if (data) {
    rows.value = data.map((v, i) => ({
      index: i + 1,
      ...v,
    }));
    optionsTable.value = rows.value;
  }
}

async function getInstructors() {
  loadingInstr.value = true;
  const data = await get("/instructors?status=0");
  if (data) {
    optionsInstructor.value = data.map((v) => ({
      label: v.name,
      value: v._id,
    }));
  }
  filterOptionsInstructors.value = optionsInstructor.value;
  loadingInstr.value = false;
}

async function getFiches() {
  loadingFiche.value = true;
  const data = await get("/fiches/coordination");
  if (data) {
    optionsFiche.value = data.map((v) => ({
      label: `${v.number} - ${v.program.name}`,
      value: v.program._id,
      code: v._id,
    }));
  }
  filterOptionsFiches.value = optionsFiche.value;
  loadingFiche.value = false;
}

async function getCompetences() {
  form.value.competence = "";
  form.value.outcome = "";
  loadingCompetence.value = true;
  const data = await get(`/competences/program/${form.value.fiche.value}`);
  if (data) {
    optionsCompetence.value = data.map((v) => ({
      label: v.name,
      value: v._id,
    }));
  }
  loadingCompetence.value = false;
}

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

async function showInfo(data) {
  console.log(data);
  index.value = data._id;
  edit.value = true;
  prompt.value = true;
  loading.value = false;

  form.value.fiche = optionsFiche.value.find((v) => v.code == data.fiche._id);
  form.value.instructor = optionsInstructor.value.find(
    (v) => v.value == data.instructor._id
  );
  await getCompetences();
  form.value.competence = optionsCompetence.value.find(
    (v) => v.value == data.competence
  );

  await getOutcomes();
  form.value.outcome = optionsOutcome.value.find(
    (v) => v.value == data.outcome
  );

  form.value = {
    ...form.value,
    tpnew: data.tpnew,
    name: data.name,
    tpdocument: optionsTpDoc.find((v) => v.value == data.tpdocument),
    document: data.document,
    email: data.email,
    phone: data.phone,
    fend: data.fend,
    activity: data.activity,
    status: data.status,
    tpImprovement: data.type
  };
}

async function cleanForm() {
  form.value = {
    tpnew: "PLAN DE MEJORAMIENTO",
    name: "",
    tpdocument: "",
    document: "",
    email: "",
    phone: "",
    fiche: "",
    competence: "",
    outcome: "",
    fend: "",
    activity: "",
    status: "",
    instructor: "",
    tpImprovement: "",
  };
}

async function postNew() {
  loading.value = true;
  if (form.value.tpnew == "PLAN DE MEJORAMIENTO") {
    await post("/news/registerimprovement", {
        tpnew: form.value.tpnew,
        tpdocument: form.value.tpdocument.value,
        document: form.value.document,
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        fiche: form.value.fiche.code,
        competence: form.value.competence.value,
        outcome: form.value.outcome.value,
        fend: form.value.fend,
        activity: form.value.activity,
        instructor: form.value.instructor.value,
        status: form.value.status,
        type: form.value.tpImprovement
      })
      .then(async (res) => {
        if (res) {
          notifySuccessRequest("Plan de mejoramiento registrado");
          prompt.value = false;
          edit.value = false;

          cleanForm();
          await getImprovements();
        }
      });
  } else if (form.value.tpnew == "DESERCIÓN") {
  }

  loading.value = false;
}

async function putNew() {
  loading.value = true;
  if (form.value.tpnew == "PLAN DE MEJORAMIENTO") {
    await put(`/news/updateimprovement/${index.value}`, {
        tpnew: form.value.tpnew,
        tpdocument: form.value.tpdocument.value,
        document: form.value.document,
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        fiche: form.value.fiche.code,
        competence: form.value.competence.value,
        outcome: form.value.outcome.value,
        fend: form.value.fend,
        activity: form.value.activity,
        status: form.value.status,
        instructor: form.value.instructor.value,
        type: form.value.tpImprovement
      })
      .then(async (res) => {
        if (res) {
          notifySuccessRequest("Plan de mejoramiento actualizado");
          prompt.value = false;
          edit.value = false;

          cleanForm();
          await getImprovements();
        }
      });
  } else if (form.value.tpnew == "DESERCIÓN") {
    await post("/news/registerpublic", form.value).then(async (res) => {
      if (res) {
        notifySuccessRequest("Novedad registrada correctamente");
        prompt.value = false;
        edit.value = false;

        cleanForm();
        await getImprovements();
      }
    });
  }

  loading.value = false;
}

async function notifyNew(id) {
  loadingNotify.value = true
  await put(`/news/sendemail/${id}`).then(() => {
    notifySuccessRequest("Novedad notificada correctamente");
  });
  loadingNotify.value = false
}


function filterInstructor(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsInstructors.value = optionsInstructor.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}

function filterFiche(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsFiches.value = optionsFiche.value.filter(
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

function filterAprendiz(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    const aprendiz = optionsTable.value.filter(
      (v) => v.name.toLocaleLowerCase().indexOf(needle) > -1
    );
    rows.value = aprendiz;
  });
}

function filterSelectedAprendiz() {
  const needle = aprendizSelected.value.label.toLocaleLowerCase();
  const aprendiz = optionsTable.value.filter(
    (v) => v.name.toLocaleLowerCase().indexOf(needle) > -1
  );
  rows.value = aprendiz;
}
</script>

<style scoped>
.save_as {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

/* .close-dialog {
    border: 1px solid red
  } */
</style>