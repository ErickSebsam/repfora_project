
<template>
  <div id="pdf" class="q-pa-md row justify-center">
    <q-card class="my-card col-12 col-sm-10 col-md-7">
      <q-parallax src="/images/Sena.png" :height="150" />

      <q-card-section>
        <div style="font-size: 3rem">Registro Novedades de Aprendices</div>
        <div class="text-subtitle2">
          Para continuar con su proceso por favor registre toda la información
          solicitada
        </div>
      </q-card-section>
    </q-card>
    <q-form
      ref="formNew"
      @submit="submitForm"
      class="col-12 col-sm-10 col-md-7 q-mt-md"
    >
      <CardForm title="Seleccione el tipo de novedad">
        <q-select
          class="full-width q-mb-md"
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
          @update:model-value="clearOtherFields()"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> list </span>
          </template>
        </q-select>
      </CardForm>
      <CardForm
        v-if="form.tpNew === 'TRASLADO'"
        title="Seleccione el tipo de traslado"
      >
        <q-select
          class="full-width q-mb-md"
          type="text"
          v-model="form.typeTransfer"
          :options="optionsTypeTransfer"
          options-dense
          label="Tipo de traslado"
          lazy-rules
          :rules="[
            (val) =>
              (val && val.toString().trim().length > 0) ||
              'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> filter_list </span>
          </template>
        </q-select>
      </CardForm>

      <CardForm
        v-if="form.tpNew === 'TRASLADO' || form.tpNew === 'APLAZAMIENTO'"
        title="Seleccione el subtipo de novedad "
      >
        <q-select
          class="full-width q-mb-md"
          type="text"
          v-model="form.subtype"
          :options="
            form.tpNew === 'APLAZAMIENTO'
              ? optionsSubTypes.filter((item) => item !== 'MOTIVOS LABORALES')
              : optionsSubTypes.filter(
                  (item) =>
                    item == 'MOTIVOS LABORALES' || item == 'MOTIVOS PERSONALES'
                )
          "
          options-dense
          label="Subtipo de novedad"
          lazy-rules
          :rules="[
            (val) =>
              (val && val.toString().trim().length > 0) ||
              'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> filter_list </span>
          </template>
        </q-select>
      </CardForm>

      <CardForm
        v-if="form.tpNew === 'TRASLADO' && form.typeTransfer === 'JORNADA'"
        title="Jornada de destino"
      >
        <q-select
          class="full-width q-mb-md"
          type="text"
          v-model="form.workingDay"
          :options="optionsWorkingDay"
          options-dense
          label="Seleccione la jornada"
          lazy-rules
          :rules="[
            (val) =>
              (val && val.toString().trim().length > 0) ||
              'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> light_mode </span>
          </template>
        </q-select>
      </CardForm>

      <CardForm
        v-if="form.tpNew === 'TRASLADO' && form.typeTransfer === 'CENTRO'"
        title="Centro de destino"
      >
        <q-input
          class="full-width q-mb-md"
          type="text"
          v-model="form.center"
          label="Nombre del centro"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 0) || 'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> apartment </span>
          </template>
        </q-input>
      </CardForm>

      <CardForm
        v-if="form.tpNew === 'TRASLADO' && form.typeTransfer === 'CENTRO'"
        title="Ciudad del centro de destino"
      >
        <q-input
          class="full-width q-mb-md"
          type="text"
          v-model="form.city"
          label="Nombre de la ciudad"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 0) || 'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> location_city </span>
          </template>
        </q-input>
      </CardForm>

      <CardForm title="Seleccione el tipo de documento">
        <q-select
          class="full-width q-mb-md"
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
      </CardForm>

      <CardForm title="Ingrese el numero de documento">
        <q-input
          class="full-width q-mb-md"
          type="text"
          v-model="form.document"
          label="Numero de documento"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 0) || 'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> pin </span>
          </template>
        </q-input>
      </CardForm>

      <CardForm title="Ingrese su nombre completo">
        <q-input
          class="full-width q-mb-md"
          type="text"
          v-model="form.name"
          label="Nombre completo"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 0) || 'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> person </span>
          </template>
        </q-input>
      </CardForm>

      <CardForm title="Ingrese su correo electrónico">
        <q-input
          class="full-width q-mb-md"
          type="email"
          v-model="form.email"
          label="Correo electrónico"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 0) || 'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> mail </span>
          </template>
        </q-input>
      </CardForm>

      <CardForm title="Ingrese su número de teléfono">
        <q-input
          class="full-width q-mb-md"
          type="number"
          v-model="form.phone"
          label="Teléfono"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 9) || 'Mínimo 10 caracteres',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> call </span>
          </template>
        </q-input>
      </CardForm>

      <CardForm title="Ficha actual de formación">
        <q-select
          class="full-width q-mb-md"
          use-input
          v-model="form.ficheSelected"
          hide-selected
          options-dense
          fill-input
          input-debounce="0"
          label="Seleccione la ficha"
          :options="ficheOptions"
          @filter="filterFiche"
          :popup-content-style="{ width: '300px' }"
          :rules="[
            (val) =>
              (val && val.toString().trim().length > 0) ||
              'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> school </span>
          </template>
        </q-select>
      </CardForm>

      <CardForm title="Causa de la novedad">
        <q-input
          v-if="
            form.tpNew === 'REINGRESO' ||
            form.tpNew === 'TRASLADO' ||
            !form.tpNew
          "
          type="text"
          v-model="form.cause"
          label="Causa"
          autogrow
          class="q-mb-md full-width"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 0) || 'El campo es requerido',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> note_alt </span>
          </template>
        </q-input>
        <q-select
          v-if="
            form.tpNew === 'APLAZAMIENTO' || form.tpNew === 'RETIRO VOLUNTARIO'"
          class="full-width q-mb-md"
          behavior="dialog"
          v-model="form.cause"
          :options="selectCause"
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
      </CardForm>

      <CardForm
        v-if="form.tpNew === 'APLAZAMIENTO'"
        title="Duración del aplazamiento (* en meses)"
      >
        <q-input
          class="q-mb-md full-width"
          type="number"
          v-model="form.duration"
          label="Duración"
          lazy-rules
          :rules="[
            (val) => (val && val.trim().length > 0) || 'Mínimo 1 caracteres',
          ]"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined"> call </span>
          </template>
        </q-input>
      </CardForm>

      <CardForm title="Fecha de registro novedad sofia plus">
        <q-input
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
      </CardForm>
      <CardForm
        title="Evidencia registro de la novedad en Sofia Plus (1MB max)"
      >
        <q-uploader
          class="q-mt-sm"
          hide-upload-btn
          color="green-10"
          accept=".jpg, .png"
          v-model="form.file"
          @rejected="onRejected"
          @added="(file) => (form.file = file[0])"
          @removed="() => (form.file = '')"
          max-file-size="1000000"
        />
      </CardForm>

      <div class="justify-center flex col-12 q-pb-md">
        <q-btn
          icon="save_as"
          label="Enviar"
          type="submit"
          :disable="loadingBtn"
          :loading="loadingBtn"
          class="q-mt-md q-mb-sm q-mx-sm save_as"
        >
          <template v-slot:loading>
            <q-spinner-hourglass size="24px" color="white" />
          </template>
        </q-btn>
      </div>
    </q-form>

    <q-dialog
      v-model="success"
      persistent
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <DialogSucess />
    </q-dialog>
  </div>
</template>

<script setup >
import { ref, defineProps, computed, onBeforeMount } from "vue";
import { get, post } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { useQuasar } from "quasar";
import html2pdf from "html2pdf.js";

import DialogSucess from "../components/News/dialogSucessForm.vue";
import CardForm from "../components/News/cardFormPublic.vue";

const $q = useQuasar();

let loadingBtn = ref(false);
let success = ref(false);
let formNew = ref(null);
let form = ref({
  tpNew: "",
  typeTransfer: "",
  subtype: "",
  workingDay: "",
  duration: null,
  center: "",
  city: "",
  tpDocument: "",
  document: "",
  name: "",
  email: "",
  phone: "",
  ficheSelected: "",
  cause: "",
  dateRegister: "",
  file: "",
});
let ficheOptions = ref([]);
let ficheOpt = [];

let optionsTpNew = ref([
  "TRASLADO",
  "REINGRESO",
  "RETIRO VOLUNTARIO",
  "APLAZAMIENTO",
]);

let optionsTpDoc = ref(["CC", "TI", "CE", "PASAPORTE", "PPT"]);
let optionsTypeTransfer = ref(["CENTRO", "JORNADA", "POR CERTIFICACIÓN"]);
let optionsWorkingDay = ref(["MAÑANA", "TARDE", "NOCHE"]);
let optionsSubTypes = ref([
  "MOTIVOS LABORALES",
  "MOTIVOS PERSONALES",
  "CALAMIDAD DOMESTICA",
  "CAMBIO DE DOMICILIO",
  "ENFERMEDAD",
  "LICENCIA DE MATERNIDAD",
  "PROBLEMAS ECÓNOMICOS",
  "PROBLEMAS FAMILIARES",
  "PROBLEMAS LABORALES",
  "SERVICIO MILITAR",
]);

let causePostponement = ref([
  "a) Incapacidad médica igual o superior a veinte (20) días expedida por la entidad promotorade salud - EPS correspondiente o por médico competente.",
  "b) Licencia de maternidad o paternidad expedida por la entidad promotora de salud - EPScorrespondiente o por médico competente.",
  "e) Calamidad doméstica.",
  "d) Asuntos judiciales.",
  "e) Participación en representación del SENA o del país a nivel nacional e internacional, en actividades académicas, culturales y/o eventos deportivos.",
  "f) Prestación del servicio militar: De acuerdo con lo establecido en la ley vigente. La certificación de la culminación de dicho servicio será el documento para el reingreso del aprendiz a la formación.",
]);

let causeRetirement = ref([
  "a) Incapacidad médica igual o superior a veinte (20) días expedida por la entidad promotora de salud - EPS correspondiente o por médico competente.",
  "b) Licencia de maternidad o paternidad expedida por la entidad promotora de salud - EPS correspondiente o por médico competente.",
  "c) Calamidad doméstica.",
  "d) Asuntos judiciales.",
  "f) Prestación del servicio militar: De acuerdo con lo establecido en la ley vigente. La certificación de la culminación de dicho servicio será el documento para el reingreso del aprendiz a la formación.",
]);

let causeDesertion = ref([
  "a) En la formación presencial, excepto la complementaria, tener tres (3) días continuos de inasistencia injustificada o acumular cinco (5) días no continuos de inasistencia injustificada durante todo el proceso de formación.",
  "b) En la formación bajo la modalidad virtual en etapa lectiva, se presenta cuando el aprendiz no asiste a tres (3) citaciones seguidas elevadas por el instructor o por el responsable del grupo o no ingresa a su ambiente virtual de formación (plataforma LMS) durante veinte (20) días consecutivos, sin previa justificación soportada ante el sistema de gestión académico-administrativo",
  "c) En la formación a distancia en etapa lectiva, se presenta cuando el aprendiz no justifica la inasistencia a tres (3) encuentros presenciales programados para el desarrollo de sus actividades formativas.",
  "d) En formación presencial, virtual y a distancia en etapa productiva: se presenta inasistencia injustificada durante tres (3) días consecutivos a la empresa con la que desarrolla la alternativa establecida.",
  "e) En la formación complementaria virtual se presenta cuando el aprendiz no registra ingreso al ambiente virtual del programa en el que está matriculado, o ingresa al ambiente virtual y no participa en ninguna de las actividades previstas en el curso.",
  "f) En la formación complementaria presencial se presentan cuando el aprendiz no registra cumplimiento justificado del diez por ciento (10%) de las horas asignadas para la formación.",
]);

let selectCause = computed(() => {
  if (form.value.tpNew === "APLAZAMIENTO") {
    form.value.cause = "";
    return causePostponement.value;
  } else if (form.value.tpNew === "RETIRO VOLUNTARIO") {
    form.value.cause = "";
    return causeRetirement.value;
  } 
});



async function generatePdf() {
  const pdfToSend = document.getElementById("pdf");

  var opt = {
    margin: 1,
    filename: "myfile.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "b4", orientation: "l" },
  };

  // New Promise-based usage:
  const data = await html2pdf().from(pdfToSend).set(opt).outputPdf("blob");
  const filePdf = new File([data], "pdfPublic.pdf", {
    type: data.type,
  });

  return filePdf;
}

onBeforeMount(async () => {
  await getFiches();
});

async function getFiches() {
  const res = await get("/fiches/public");

  if (res) {
    ficheOpt = [];
    res.forEach((row, index) => {
      ficheOpt.push({
        label: `${row.number}: ${row.program.name}`,
        value: row._id,
      });
    });

    ficheOptions.value = ficheOpt;
  }
}

function onRejected(files) {
  $q.notify({
    color: "negative",
    position: "top",
    message: "El archivo no cumple con los requisitos",
    icon: "report_problem",
  });
}

async function submitForm() {
  if (!form.value.file) {
    $q.notify({
      color: "negative",
      position: "top",
      message: "Debe adjuntar la evidencia de la novedad",
      icon: "report_problem",
    });
    return;
  }
  const pdfSend = await generatePdf();
  const formData = new FormData();

  formData.append("file", form.value.file);
  formData.append("pdf", pdfSend);
  formData.append("tpnew", form.value.tpNew);
  formData.append("typetransfer", form.value.typeTransfer);
  formData.append("subtype", form.value.subtype);
  formData.append("duration", parseInt(form.value.duration));
  formData.append("workingday", form.value.workingDay);
  formData.append("center", form.value.center);
  formData.append("city", form.value.city);
  formData.append("tpdocument", form.value.tpDocument);
  formData.append("document", form.value.document);
  formData.append("email", form.value.email);
  formData.append("name", form.value.name);
  formData.append("phone", form.value.phone);
  formData.append("fiche", form.value.ficheSelected.value);
  formData.append("cause", form.value.cause);
  formData.append("datesofia", form.value.dateRegister);
  $q.loading.show({
    message: "Cargando imagen, no cierre la ventana por favor ...",
  });
  loadingBtn.value = true;

  await post("/news/registerpublic", formData).then(async (res) => {
    if (res) {
      notifySuccessRequest("Novedad registrada correctamente");
      cleanForm();
      success.value = true;
    }
  });

  $q.loading.hide();
  loadingBtn.value = false;
}

function clearOtherFields() {
  form.value.typeTransfer = "";
  form.value.subtype = "";
  form.value.workingDay = "";
  form.value.center = "";
  form.value.city = "";
  form.value.cause=""
}

function cleanForm() {
  form.value.tpNew = "";
  form.value.typeTransfer = "";
  form.value.subtype = "";
  form.value.workingDay = "";
  form.value.center = "";
  form.value.city = "";
  form.value.tpDocument = "";
  form.value.document = "";
  form.value.name = "";
  form.value.email = "";
  form.value.phone = "";
  form.value.ficheSelected = "";
  form.value.cause = "";
  form.value.dateRegister = "";
  //eliminar url de la imagen
  window.URL.revokeObjectURL(form.value.file);
  form.value.file = "";

  formNew.value.resetValidation();
}

function filterFiche(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    ficheOptions.value = ficheOpt.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
  });
}
</script>