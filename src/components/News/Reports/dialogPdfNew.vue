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

    <q-card-section class="justify-center row">
      <q-page-sticky position="top-right" :offset="[50, 0]">
        <q-btn
          icon="picture_as_pdf"
          color="red-10"
          size="14px"
          round
          @click="generatePdf"
        >
          <q-tooltip class="bg-white text-green-9">Descargar PDF</q-tooltip>
        </q-btn>
      </q-page-sticky>

      <div
        id="pdf"

        :style="
        generatingPdf
          ? 'zoom: 0;'
          : 'zoom: 3; border: 0.1px solid #000000'"


        
        class="content row items-center flex"
      >
        <template v-for="(item, index) in dataPdf" :key="index">
          <div
            class="col-12 row items-center flex"
            v-if="dataType != 'PLAN DE MEJORAMIENTO'"
          >
            <div
              class="col-12 title-content text-center q-mb-sm"
              :class="index != 0 ? 'q-mt-xl' : ''"
            >
              {{ item.code }} - {{ item.tpnew }}
            </div>
            <div class="col-12 content-table">
              <strong> Datos del aprendiz </strong>
            </div>
            <div class="col-12 content-table q-pl-md row q-gutter-y-xs">
              <div class="col-2 items-center flex">Nombre:</div>
              <div class="col-4">
                {{ item.name }}
              </div>

              <div class="col-2 items-center flex">Documento:</div>
              <div class="col-4">
                {{ item.tpdocument }} - {{ item.document }}
              </div>

              <div class="col-2 items-center flex">Correo:</div>
              <div class="col-4">
                {{ item.email }}
              </div>

              <div class="col-2 items-center flex">Teléfono:</div>
              <div class="col-4">
                {{ item.phone }}
              </div>
            </div>
            <div class="col-12 content-table q-mt-sm">
              <strong> Datos de la novedad </strong>
            </div>
            <div class="col-12 content-table q-pl-md row q-gutter-y-xs">
              <div class="col-2 items-center flex">Código:</div>
              <div class="col-4 items-center flex">
                {{ item.code }}
              </div>

              <div class="col-2 items-center flex">Acta:</div>
              <div class="col-4 items-center flex">
                {{ item.acta }}
              </div>

              <div class="col-2 items-center flex">Ficha:</div>
              <div class="col-4 items-center flex">
                {{ item.fiche.number }} - {{ item.fiche.program.name }}
              </div>

              <div class="col-2 items-center flex">Tipo de novedad:</div>
              <div class="col-4 items-center flex">
                {{ item.tpnew }}
              </div>

              <div
                v-if="
                  item.tpnew === 'TRASLADO' || item.tpnew === 'APLAZAMIENTO'
                "
                class="col-2 items-center flex"
              >
                Subtipo de novedad:
              </div>
              <div
                v-if="
                  item.tpnew === 'TRASLADO' || item.tpnew === 'APLAZAMIENTO'
                "
                class="col-4 items-center flex"
              >
                {{ item.subtype }}
              </div>

              <div
                v-if="item.tpnew === 'TRASLADO'"
                class="col-2 items-center flex"
              >
                Tipo de traslado:
              </div>
              <div
                v-if="item.tpnew === 'TRASLADO'"
                class="col-4 items-center flex"
              >
                {{ item.typetransfer }}
              </div>

              <div
                v-if="item.typetransfer == 'JORNADA'"
                class="col-2 items-center flex"
              >
                Jornada:
              </div>
              <div
                v-if="item.typetransfer == 'JORNADA'"
                class="col-4 items-center flex"
              >
                {{ item.workingday }}
              </div>

              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-2 items-center flex"
              >
                Centro:
              </div>
              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-4 items-center flex"
              >
                {{ item.center }}
              </div>

              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-2 items-center flex"
              >
                Ciudad:
              </div>
              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-4 items-center flex"
              >
                {{ item.city }}
              </div>

              <div
                v-if="item.tpnew == 'APLAZAMIENTO'"
                class="col-2 items-center flex"
              >
                Duración:
              </div>
              <div
                v-if="item.tpnew == 'APLAZAMIENTO'"
                class="col-4 items-center flex"
              >
                {{ item.duration }}
              </div>

              <div class="col-2 items-center flex">Fecha de fin:</div>
              <div class="col-4 items-center flex">
                {{ item.fend?.split("T")[0] }}
              </div>

              <div class="col-2 items-center flex">Causa:</div>
              <div class="col-4 items-center flex">
                {{ item.cause }}
              </div>

              <div class="col-2 items-center flex">Estado:</div>
              <div class="col-4 items-center flex">
                {{ item.state }}
              </div>

              <div class="col-2 items-center flex">Procesada:</div>
              <div class="col-4 items-center flex">
                {{ item.processed ? "SI" : "NO" }}
              </div>

              <div class="col-2 items-center flex">Fecha Registro Sofia:</div>
              <div class="col-4 items-center flex">
                {{ item.datesofia?.split("T")[0] }}
              </div>

              <div class="col-2 items-center flex">Fecha de procesamiento:</div>
              <div class="col-4 items-center flex">
                {{ item.dateprocessed?.split("T")[0] }}
              </div>

              <div class="col-2 items-center flex">Fecha de Registro:</div>
              <div class="col-4 items-center flex">
                {{ item.createdAt?.split("T")[0] }}
              </div>

              <div class="col-12">
                <strong> Imagen: </strong>
              </div>
              <div class="col-11 justify-center flex bg-white">
                <a class="q-py-xs" :href="item.img?.url" target="_blank">
                  {{ item.img?.url }}
                </a>

                <iframe
                  v-if="!generatingPdf"
                  :src="item.img?.url"
                  frameborder="0"
                  width="100%"
                ></iframe>
              </div>
              <div class="col-12 q-pt-sm q-pb-xs">
                <strong> Proceso: </strong>
              </div>
              <div class="col-12 row justify-center">
                <div class="col-2 items-center flex text-center">
                  <strong> Fecha </strong>
                </div>
                <div class="col-9 text-center">
                  <strong> Observación </strong>
                </div>

                <template v-for="(item, index) in item.answers" :key="index">
                  <div class="col-2 items-center flex text-center">
                    {{ item.date.split("T")[0] }}
                  </div>
                  <div class="col-9 text-center">
                    {{ item.data }}
                  </div>
                </template>
              </div>
            </div>

            <!-- <div id="hoja-pdf" class="content row"></div> -->
          </div>
          <div class="col-12 row items-center flex" v-else>
            <div
              class="col-12 title-content text-center q-mb-sm"
              :class="index != 0 ? 'q-mt-xl' : ''"
            >
              {{ item.code }} - {{ item.tpnew }}
            </div>
            <div class="col-12 content-table">
              <strong> Datos del aprendiz </strong>
            </div>
            <div class="col-12 content-table q-pl-md row q-gutter-y-xs">
              <div class="col-2 items-center flex">Nombre:</div>
              <div class="col-4">
                {{ item.name }}
              </div>

              <div class="col-2 items-center flex">Documento:</div>
              <div class="col-4">
                {{ item.tpdocument }} - {{ item.document }}
              </div>

              <div class="col-2 items-center flex">Correo:</div>
              <div class="col-4">
                {{ item.email }}
              </div>

              <div class="col-2 items-center flex">Teléfono:</div>
              <div class="col-4">
                {{ item.phone }}
              </div>
            </div>
            <div class="col-12 content-table q-mt-sm">
              <strong> Datos de la novedad </strong>
            </div>
            <div class="col-12 content-table q-pl-md row q-gutter-y-xs">
              <div class="col-2 items-center flex">Código:</div>
              <div class="col-4 items-center flex">
                {{ item.code }}
              </div>

              <div class="col-2 items-center flex">Acta:</div>
              <div class="col-4 items-center flex">
                {{ item.acta }}
              </div>

              <div class="col-2 items-center flex">Ficha:</div>
              <div class="col-4 items-center flex">
                {{ item.fiche.number }} - {{ item.fiche.program.name }}
              </div>

              <div class="col-2 items-center flex">Tipo de novedad:</div>
              <div class="col-4 items-center flex">
                {{ item.tpnew }}
              </div>

              <div
                v-if="
                  item.tpnew === 'TRASLADO' || item.tpnew === 'APLAZAMIENTO'
                "
                class="col-2 items-center flex"
              >
                Subtipo de novedad:
              </div>
              <div
                v-if="
                  item.tpnew === 'TRASLADO' || item.tpnew === 'APLAZAMIENTO'
                "
                class="col-4 items-center flex"
              >
                {{ item.subtype }}
              </div>

              <div
                v-if="item.tpnew === 'TRASLADO'"
                class="col-2 items-center flex"
              >
                Tipo de traslado:
              </div>
              <div
                v-if="item.tpnew === 'TRASLADO'"
                class="col-4 items-center flex"
              >
                {{ item.typetransfer }}
              </div>

              <div
                v-if="item.typetransfer == 'JORNADA'"
                class="col-2 items-center flex"
              >
                Jornada:
              </div>
              <div
                v-if="item.typetransfer == 'JORNADA'"
                class="col-4 items-center flex"
              >
                {{ item.workingday }}
              </div>

              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-2 items-center flex"
              >
                Centro:
              </div>
              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-4 items-center flex"
              >
                {{ item.center }}
              </div>

              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-2 items-center flex"
              >
                Ciudad:
              </div>
              <div
                v-if="item.typetransfer == 'CENTRO'"
                class="col-4 items-center flex"
              >
                {{ item.city }}
              </div>

              <div
                v-if="item.tpnew == 'APLAZAMIENTO'"
                class="col-2 items-center flex"
              >
                Duración:
              </div>
              <div
                v-if="item.tpnew == 'APLAZAMIENTO'"
                class="col-4 items-center flex"
              >
                {{ item.duration }}
              </div>

              <div class="col-2 items-center flex">Fecha de fin:</div>
              <div class="col-4 items-center flex">
                {{ item.fend?.split("T")[0] }}
              </div>

              <div class="col-2 items-center flex">Causa:</div>
              <div class="col-4 items-center flex">
                {{ item.cause }}
              </div>

              <div class="col-2 items-center flex">Estado:</div>
              <div class="col-4 items-center flex">
                {{ item.state }}
              </div>

              <div class="col-2 items-center flex">Procesada:</div>
              <div class="col-4 items-center flex">
                {{ item.processed ? "SI" : "NO" }}
              </div>

              <div class="col-2 items-center flex">Fecha Registro Sofia:</div>
              <div class="col-4 items-center flex">
                {{ item.datesofia?.split("T")[0] }}
              </div>

              <div class="col-2 items-center flex">Fecha de procesamiento:</div>
              <div class="col-4 items-center flex">
                {{ item.dateprocessed?.split("T")[0] }}
              </div>

              <div class="col-2 items-center flex">Fecha de Registro:</div>
              <div class="col-4 items-center flex">
                {{ item.createdAt?.split("T")[0] }}
              </div>

              <div class="col-12">
                <strong> Imagen: </strong>
              </div>
              <div class="col-11 justify-center flex bg-white">
                <iframe
                  :src="item.img?.url"
                  frameborder="0"
                  width="100%"
                ></iframe>
              </div>
              <div class="col-12 q-pt-sm q-pb-xs">
                <strong> Proceso: </strong>
              </div>
              <div class="col-12 row justify-center">
                <div class="col-2 items-center flex text-center">
                  <strong> Fecha </strong>
                </div>
                <div class="col-9 text-center">
                  <strong> Observación </strong>
                </div>

                <template v-for="(item, index) in item.answers" :key="index">
                  <div class="col-2 items-center flex text-center">
                    {{ item.date.split("T")[0] }}
                  </div>
                  <div class="col-9 text-center">
                    {{ item.data }}
                  </div>
                </template>
              </div>
            </div>

            <!-- <div id="hoja-pdf" class="content row"></div> -->
          </div>
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, defineProps } from "vue";
import { jsPDF } from "jspdf";
import { useQuasar } from "quasar";

const $q = useQuasar();

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  showDialog: {
    type: Function,
    default: () => {},
  },
});

let generatingPdf = ref(false);
let dataPdf = ref(props.data.data);
let dataType = ref(props.data.type);
let nameFile = ref(props.data.nameFile);

const doc = new jsPDF({
  orientation: "p",
  unit: "px",
  format: [210, 297],
  compress: true, //para que no pese tanto el pdf
  precision: 2, //para que no se vea borroso el texto
});

function generatePdf() {
  generatingPdf.value = true;

  $q.loading.show({
    message: "Generando PDF...",
  });

  doc.html(document.getElementById("pdf"), {
    callback: function (doc) {
      let date = new Date().toISOString().split("T")[0];
      
      $q.loading.hide();
      console.log(nameFile.value)

      doc.save(`${nameFile.value}-${date}.pdf`);

      generatingPdf.value = false;
    },
    x: 0,
    y: 0,
    margin:[15,0,15,0] //top, left, bottom, right
  });
}
</script>



<style scoped>
.title-content {
  font-size: 4.5px;
  font-weight: bold;
}
.content-table {
  font-size: 4px;
}

.dialog {
  width: 100%;
  height: 100%;
  padding: 0px !important;
  margin: 0px !important;
}
#pdf {
  width: 210px;
  font-family: sans-serif;
  border: none;
  overflow: auto;
  padding: 10px;
  margin: 0;
}
#hoja-pdf {
  width: 210px;

  background-color: #fff;
  color: black;
}

#hoja-pdf.content {
  height: 257px;
  margin: 0;
  padding: 0;
  color: #000;
}
#hoja-pdf.normal {
  color: #b11919 !important;
}

.text-portada {
  font-size: 4px;
  font-weight: normal;
  margin: 0;
  padding: 0;
  color: #000;
  text-align: justify;
  letter-spacing: normal;
  word-spacing: normal;
}

.img_project {
  width: 100%;
  height: 90%;
  object-fit: cover;
}

.subtitle {
  font-size: 4px;
  font-weight: bold;
  margin: 0;
  padding: 0;
  color: #000;
  text-align: justify;
  letter-spacing: normal;
  word-spacing: normal;
}

.content-text {
  font-size: 3.9px;

  text-align: justify;
  margin: 0;
  padding: 0;
  color: #000;
  text-align: justify;
  letter-spacing: normal;
  word-spacing: normal;
}

.content-text span {
  font-weight: bold;
}

.content-text span span {
  font-weight: normal;
}
</style>