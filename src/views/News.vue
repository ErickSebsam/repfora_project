<template>
  <div class="drop-area">
    <BtnBack route="/home" />
    <HeaderLayout title="Novedades" />

    <div class="row justify-center">
      <div class="col-12 justify-around items-center flex q-gutter-y-md q-gutter-x-md">
        <div class="q-gutter-x-md" :class="$q.screen.width < 800 ? 'row justify-center items-center q-gutter-y-md' : 'row justify-start items-center'">
          <q-btn class="bg-green-7 text-white" @click="(prompt = true), cleanForm()"><span
              class="material-symbols-outlined q-mr-sm" style="font-size: 20px">
              add_circle
            </span>
            Registrar novedad
          </q-btn>

          <q-btn-dropdown class="bg-green-8 text-white" color="primary" label="Soluciones Multiples" icon="more_vert">
            <q-list style="display: flex; flex-direction: column">
              <q-btn class="bg-green-10 text-white q-mt-sm" @click="showDialogProcessMultiple(true, 'process')"><span
                  class="material-symbols-outlined q-mr-sm" style="font-size: 20px">
                  library_add
                </span>
                Procesos Multiples
              </q-btn>
              <q-btn class="bg-green-10 text-white q-mt-sm" @click="showDialogProcessMultiple(true, 'acta')"><span
                  class="material-symbols-outlined q-mr-sm" style="font-size: 20px">
                  control_point_duplicate
                </span>
                Acta Multiple
              </q-btn>
            </q-list>
          </q-btn-dropdown>

          <q-btn-dropdown class="bg-green-8 text-white" color="primary" label="Otras Novedades" icon="more_vert">
            <q-list style="display: flex; flex-direction: column">
              <q-btn class="bg-green-10 text-white q-mt-sm" @click="showDialog()"><span
                  class="material-symbols-outlined q-mr-sm" style="font-size: 20px">
                  list_alt
                </span>
                Migrar Aplazamientos
              </q-btn>
              <q-btn class="bg-green-10 text-white q-mt-sm" @click="showDialogImprove()"><span
                  class="material-symbols-outlined q-mr-sm" style="font-size: 20px">
                  newspaper
                </span>
                Planes de Mejoramiento
              </q-btn>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div>
          <q-btn class="bg-green-10 text-white" to="/news/reports"><span class="material-symbols-outlined q-mr-sm"
              style="font-size: 20px">
              lab_profile
            </span>
            Reportes
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Seccion de filtros -->

    <div class="q-pa-md">
      <q-list bordered class="rounded-borders">
        <q-expansion-item class="expansion_hover" header-style="background:#f0faf4" expand-separator icon="filter_alt"
          label="Filtros" caption="Selecciona criterios para buscar novedades">
          <q-card style="background:#f0faf4">
            <q-card-section class="card-section">
              <div class="row">
                <div class="col-12 col-md-6 row justify-center items-center q-my-md q-gutter-x-md">
                  <div class="col-5">
                    <q-input filled dense placeholder="aaaa/mm/dd" v-model="fStart" mask="date" label="Fecha inicio">
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="fStart" minimal>
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div class="col-5">
                    <q-input filled dense placeholder="aaaa/mm/dd" v-model="fEnd" mask="date" label="Fecha Fin">
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="fEnd" minimal>
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div class=" row " :class="$q.screen.width < 700 ? 'col-12 justify-center q-mt-sm' : 'col-1 justify-end'">
                    <q-btn class="bg-green-7 text-white" :loading="loading"><span class="material-symbols-outlined"
                        style="font-size: 20px" @click="getNewsFilter()">
                        search
                      </span>
                      {{ $q.screen.width < 700 ? 'Consulta' : '' }}
                    </q-btn>
                  </div>
                </div>
                <div class="col-12 col-md-6 row justify-center items-center q-my-md q-gutter-x-md">
                  <div class="col-5" :class="$q.screen.width < 450 ? 'col-12' : 'col-5'">
                    <q-select  filled dense type="text" v-model="filter1" :options="optionsTpNew.filter((item) => item != 'PLAN DE MEJORAMIENTO')
                      " options-dense label="Tipo de novedad" @update:model-value="filterNewsByInput">
                      <template v-slot:prepend>
                        <span class="material-symbols-outlined"> list </span>
                      </template>
                    </q-select>
                  </div>
                  <div class="col-5" :class="$q.screen.width < 450 ? 'col-12 q-mt-sm' : 'col-5'">
                    <q-input  filled dense type="text" v-model="filter2"
                      label="Numero de documento,nombre,acta, ficha" @update:model-value="filterNewsByInput">
                      <template v-slot:prepend>
                        <span class="material-symbols-outlined"> pin </span>
                      </template>
                    </q-input>
                  </div>
                </div>
                
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

      </q-list>
    </div>

    <!-- Table -->
    <TableNews class="q-pa-md" :dataTable="filterTable" :activarDesactivar="activarDesactivar" :showInfo="showInfo"
      :showDialogProcess="showDialogProcess" />

    <!-- Formulario -->

    <q-dialog v-model="prompt">
      <q-card style="width: 750px; max-width: 80vw">
        <q-card-section class="bg-green-9 q-px-lg q-py-sm">
          <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
            {{ edit ? "EDITAR NOVEDAD" : "REGISTRAR NOVEDAD" }}
          </h5>
        </q-card-section>

        <q-form class="row q-pt-lg flex" @submit.prevent.stop="edit ? putNew() : postNew()" novalidate>
          <div class="col-12 col-sm-6 q-px-lg items-center flex q-px-lg">
            <q-select filled class="full-width" type="text" v-model="form.tpNew"
              :options="optionsTpNew.filter((item) => item != 'TODAS')" options-dense label="Tipo de novedad" lazy-rules
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" @update:model-value="
                clearOtherFields();
              clearOtherFields2();
              ">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> list </span>
              </template>
            </q-select>
          </div>
          <div v-if="form.tpNew === 'TRASLADO' || form.tpNew === 'APLAZAMIENTO'"
            class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select class="full-width" filled type="text" v-model="form.subtype" :options="form.tpNew === 'APLAZAMIENTO'
              ? optionsSubType.filter(
                (item) => item !== 'MOTIVOS LABORALES'
              )
              : optionsSubType.filter(
                (item) =>
                  item == 'MOTIVOS LABORALES' ||
                  item == 'MOTIVOS PERSONALES'
              )
              " options-dense label="Subtipo de novedad" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> filter_list </span>
              </template>
            </q-select>
          </div>
          <div v-if="form.tpNew === 'TRASLADO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select class="full-width" filled type="text" v-model="form.typeTransfer" :options="optionsTypeTransfer"
              options-dense label="Tipo de traslado" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]" @update:model-value="clearOtherFields2()">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> filter_list </span>
              </template>
            </q-select>
          </div>

          <div v-if="form.typeTransfer === 'CENTRO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input class="full-width" filled type="text" v-model="form.center" label="Centro de destino" lazy-rules
              :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> pin </span>
              </template>
            </q-input>
          </div>

          <div v-if="form.typeTransfer === 'CENTRO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input filled class="full-width" type="text" v-model="form.city" label="Nombre de la ciudad del centro"
              lazy-rules :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> location_city </span>
              </template>
            </q-input>
          </div>
          <div v-if="form.tpNew === 'TRASLADO' && form.typeTransfer === 'JORNADA'"
            class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select filled class="full-width" type="text" v-model="form.workingDay" :options="optionsWorkingDay"
              options-dense label="Seleccione la jornada" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> light_mode </span>
              </template>
            </q-select>
          </div>

          <div v-if="form.tpNew === 'APLAZAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input filled class="full-width" type="number" v-model="form.duration" label="Duración" lazy-rules :rules="[
              (val) =>
                (val && val.trim().length > 0) || 'Mínimo 1 caracteres',
            ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> timelapse </span>
              </template>
            </q-input>
          </div>
          <div v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
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
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select filled class="full-width" type="text" options-dense v-model="form.tpDocument"
              :options="optionsTpDoc" label="Tipo de documento" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> recent_actors </span>
              </template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input class="full-width" filled type="text" v-model="form.document" label="Numero de documento"
              lazy-rules :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> pin </span>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input filled class="full-width" type="text" v-model="form.name" label="Nombre completo" lazy-rules
              :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> person </span>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input filled class="full-width" type="email" v-model="form.email" label="Correo electrónico" lazy-rules
              :rules="[
                (val) =>
                  (val && val.trim().length > 0) || 'El campo es requerido',
              ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> mail </span>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input filled class="full-width" type="number" v-model="form.phone" label="Teléfono" lazy-rules :rules="[
              (val) =>
                (val && val.trim().length > 9) || 'Mínimo 10 caracteres',
            ]">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> call </span>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select filled class="full-width" use-input v-model="form.ficheSelected" hide-selected options-dense
              fill-input input-debounce="0" label="Seleccione la ficha" :options="ficheOptions" @filter="filterFiche"
              :loading="loadingFiche" @update:model-value="getCompetences()" :popup-content-style="{ width: '300px' }"
              :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:append>
                <q-icon v-if="form.ficheSelected" class="cursor-pointer" name="clear"
                  @click.stop.prevent="form.ficheSelected = ''" />
              </template>
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>
          <div v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select filled class="full-width" use-input v-model="form.competence" hide-selected options-dense
              fill-input input-debounce="0" label="Seleccione la competencia" :options="filterOptionsCompences"
              :disable="optionsCompetence.length == 0" @filter="filterCompetence" :loading="loadingCompetence"
              :popup-content-style="{ width: '300px' }" @update:model-value="getOutcomes()" :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:append>
                <q-icon v-if="form.ficheSelected" class="cursor-pointer" name="clear"
                  @click.stop.prevent="form.ficheSelected = ''" />
              </template>
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>
          <div v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-select filled class="full-width" use-input v-model="form.outcome" hide-selected options-dense fill-input
              input-debounce="0" label="Seleccione el resultado" :options="filterOptionsOutcomes"
              :disable="optionsOutcome.length == 0" @filter="filterOutcome" :loading="loadingOutcome"
              :popup-content-style="{ width: '300px' }" :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
              <template v-slot:append>
                <q-icon v-if="form.ficheSelected" class="cursor-pointer" name="clear"
                  @click.stop.prevent="form.ficheSelected = ''" />
              </template>
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> school </span>
              </template>
            </q-select>
          </div>

          <div v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
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

          <div v-if="form.tpNew !== 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input
              v-if="form.tpNew === 'REINGRESO' || form.tpNew === 'REINGRESO ESPECIAL' || form.tpNew === 'TRASLADO' || !form.tpNew"
              filled type="text" v-model="form.cause" label="Causa" autogrow class="q-mb-md full-width">
              <template v-slot:prepend>
                <span class="material-symbols-outlined"> note_alt </span>
              </template>
            </q-input>
            <q-select
              v-if="form.tpNew === 'APLAZAMIENTO' || form.tpNew === 'DESERCIÓN' || form.tpNew === 'RETIRO VOLUNTARIO'"
              filled class="full-width custom-qselect" type="text" behavior="dialog" options-dense v-model="form.cause"
              :options="selectCause" label="Seleccione la causa" lazy-rules :rules="[
                (val) =>
                  (val && val.toString().trim().length > 0) ||
                  'El campo es requerido',
              ]">
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
          <div v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
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
          <div v-if="form.tpNew !== 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input filled class="full-width" v-model="form.dateRegister" mask="date" :rules="['date']" lazy-rules
              label="Fecha Registro en Sofia Plus">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
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
          </div>

          <div v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
            <q-input filled class="full-width" v-model="form.fend" mask="date" :rules="['date']" lazy-rules
              label="Fecha Fin">
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
          <div v-if="form.tpNew !== 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg flex">
            <q-file v-model="form.file" filled label="Evidencia Fotográfica (1Mb max)" class="full-width"
              accept=".jpg, .png" @rejected="onRejected" max-file-size="1000000">
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
              <template v-slot:append>
                <q-icon name="close" @click="form.file = ''" />
              </template>
            </q-file>
          </div>

          <div v-if="form.tpNew === 'PLAN DE MEJORAMIENTO'" class="col-12 col-sm-6 q-px-lg items-center flex">
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
      </q-card>
    </q-dialog>

    <!-- Dialogo para ver los aplazamientos -->
    <q-dialog v-model="dialogPostpone" persistent :maximized="true" class="full-width full-height"
      transition-show="slide-up" transition-hide="slide-down">
      <DialogAplazados :activarDesactivar="activarDesactivar" :showInfo="showInfo" :dataPostponed="dataPostponed"
        :showDialogProcess="showDialogProcess" :showDialogPostpone="showDialog" />
    </q-dialog>

    <!-- Dialogo para ver los planes de mejoramiento -->
    <q-dialog v-model="dialogImprove" persistent :maximized="true" class="full-width full-height"
      transition-show="slide-up" transition-hide="slide-down">
      <dialogImprovement />
    </q-dialog>

    <!-- Dialogo para el proceso de la novedad -->
    <q-dialog v-model="dialogProcess" persistent :maximized="true" class="full-width full-height"
      transition-show="slide-up" transition-hide="slide-down">
      <DialogProcess :idNew="idProcess" :showDialogProcess="showDialogProcess" />
    </q-dialog>

    <!-- Dialogo para modificar multiples procesos -->
    <q-dialog v-model="dialogMultipleProcess" persistent :maximized="true" class="full-width full-height"
      transition-show="slide-up" transition-hide="slide-down">
      <DialogProcessMultiple :showDialogProcess="showDialogProcessMultiple" :type="typeMultiple" />
    </q-dialog>
  </div>
</template>


<script setup>
import { computed, onBeforeMount, onMounted, ref } from "vue";
import { get, post, put } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify.js";
import { storeUser } from "../store/users.js";
import { useQuasar } from "quasar";

import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

import TableNews from "../components/News/tableNews.vue";
import DialogAplazados from "../components/News/dialogPostpone.vue";
import DialogProcess from "../components/News/dialogProcess.vue";
import DialogProcessMultiple from "../components/News/dialogProcessMultiples.vue";
import dialogImprovement from "../components/News/dialogImprovement.vue";

const $q = useQuasar();
const userStore = storeUser();

const fStart = ref(null)
const fEnd = ref(null)
let dialogPostpone = ref(false);
let dialogImprove = ref(false);
let dialogProcess = ref(false);
let dialogMultipleProcess = ref(false);
let loading = ref(false);
let edit = ref(false);
let index = ref("");
let optionsTpNew = ref([
  "TODAS",
  "TRASLADO",
  "RETIRO VOLUNTARIO",
  "REINGRESO",
  "REINGRESO ESPECIAL",
  "APLAZAMIENTO",
  "DESERCIÓN",
  "PLAN DE MEJORAMIENTO",
]);
let optionsTpDoc = ref(["CC", "TI", "CE", "PASAPORTE", "PPT"]);
let optionsTypeTransfer = ref(["CENTRO", "JORNADA", "POR CERTIFICACIÓN"]);
let optionsWorkingDay = ref(["MAÑANA", "TARDE", "NOCHE"]);
let optionsStatus = ref(["REGISTRADO", "APROBADO", "NO APROBADO", "VENCIDO"]);
let optionstpImprovement = ref(["ACADÉMICO", "DISCIPLINARIO"]);
let optionsSubType = ref([
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
  "f) Prestación del servicio militar: De acuerdo con lo establecido en la ley vigente. La certificación de la culminación de dicho servicio será el documento para el reingreso del aprendiz a la formación."
])

let causeRetirement = ref([
  "a) Incapacidad médica igual o superior a veinte (20) días expedida por la entidad promotora de salud - EPS correspondiente o por médico competente.",
  "b) Licencia de maternidad o paternidad expedida por la entidad promotora de salud - EPS correspondiente o por médico competente.",
  "c) Calamidad doméstica.",
  "d) Asuntos judiciales.",
  "f) Prestación del servicio militar: De acuerdo con lo establecido en la ley vigente. La certificación de la culminación de dicho servicio será el documento para el reingreso del aprendiz a la formación.",
])

let causeDesertion = ref([
  "a) En la formación presencial, excepto la complementaria, tener tres (3) días continuos de inasistencia injustificada o acumular cinco (5) días no continuos de inasistencia injustificada durante todo el proceso de formación.",
  "b) En la formación bajo la modalidad virtual en etapa lectiva, se presenta cuando el aprendiz no asiste a tres (3) citaciones seguidas elevadas por el instructor o por el responsable del grupo o no ingresa a su ambiente virtual de formación (plataforma LMS) durante veinte (20) días consecutivos, sin previa justificación soportada ante el sistema de gestión académico-administrativo",
  "c) En la formación a distancia en etapa lectiva, se presenta cuando el aprendiz no justifica la inasistencia a tres (3) encuentros presenciales programados para el desarrollo de sus actividades formativas.",
  "d) En formación presencial, virtual y a distancia en etapa productiva: se presenta inasistencia injustificada durante tres (3) días consecutivos a la empresa con la que desarrolla la alternativa establecida.",
  "e) En la formación complementaria virtual se presenta cuando el aprendiz no registra ingreso al ambiente virtual del programa en el que está matriculado, o ingresa al ambiente virtual y no participa en ninguna de las actividades previstas en el curso.",
  "f) En la formación complementaria presencial se presentan cuando el aprendiz no registra cumplimiento justificado del diez por ciento (10%) de las horas asignadas para la formación.",
]);

let filter1 = ref("TODAS");
let filter2 = ref();
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
  tpImprovement: "",
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

let ficheOptions = ref([]);
let ficheOpt = ref([]);
let filterOptionsCompences = ref([]);
let optionsCompetence = ref([]);
let filterOptionsOutcomes = ref([]);
let optionsOutcome = ref([]);
let filterOptionsInstructors = ref([]);
let optionsInstructor = ref([]);
let rows = ref([]);
let prompt = ref(false);
let dataTable = ref([]);
let filterTable = ref([]);
let dataPostponed = ref([]);
let idProcess = ref("");
let typeMultiple = ref("");

let loadingFiche = ref(false);
let loadingCompetence = ref(false);
let loadingOutcome = ref(false);
let loadingInstr = ref(false);

async function showDialog(reload = false) {
  dialogPostpone.value = !dialogPostpone.value;
  if (reload) await getNews();
}

function showDialogImprove() {
  dialogImprove.value = !dialogImprove.value;
}

async function showDialogProcess(id = null) {
  dialogProcess.value = !dialogProcess.value;
  idProcess.value = id;

  if (!id) {
    await getNews();
  }
}

let selectCause = computed(() => {
  if (form.value.tpNew === "APLAZAMIENTO") {
    return causePostponement.value;
  } else if (form.value.tpNew === "RETIRO VOLUNTARIO") {
    return causeRetirement.value;
  } else if (form.value.tpNew === "DESERCIÓN") {
    return causeDesertion.value;
  }
});

async function showDialogProcessMultiple(value = true, type = "process") {
  dialogMultipleProcess.value = value;
  typeMultiple.value = type;

  if (dialogMultipleProcess.value == false) {
    await getNews();
  }
}

onBeforeMount(async () => {
  await getFiches();
  await getNews();
  await getInstructors();
});

window.addEventListener("keyup", (e) => {
  if (e.key === "+" && prompt.value == false) {
    prompt.value = true;
  } else if (e.key == "Escape" && prompt.value == true) {
    prompt.value = false;
  }
});

//get instructors
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

// get fiches
async function getFiches() {
  loadingFiche.value = true;
  const res = await get("/fiches/coordination");

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
  }
  loadingFiche.value = false;
}

//get competences
async function getCompetences() {
  form.value.competence = "";
  form.value.outcome = "";
  loadingCompetence.value = true;
  const data = await get(`/competences/program/${form.value.ficheSelected.code}`);
  if (data) {
    optionsCompetence.value = data.map((v) => ({
      label: v.name,
      value: v._id,
    }));
  }
  loadingCompetence.value = false;
}

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

async function getNews() {
  await get("/news").then((res) => {
    if (res) {
      console.log(res.news);
      dataTable.value = res.news;
      filterTable.value = res.news;
      dataPostponed.value = res.newsPostpone;
    }
  });
}

async function getNewsFilter() {
  loading.value = true;
  if (!fStart.value || !fEnd.value) {
    $q.notify({
      type: "negative",
      message: "Por favor seleccione ambas fechas para filtrar",
      position: "top-right",
    });
    loading.value = false;
  }else if (fStart.value > fEnd.value) {
    $q.notify({
      type: "negative",
      message: "La fecha de inicio no puede ser mayor a la fecha fin",
      position: "top-right",
    });
    loading.value = false;
  } else{
     await get("/news", { dateStart: fStart.value, dateEnd: fEnd.value }).then((res) => {
    if (res) {
      dataTable.value = res.news;
      filterTable.value = res.news;
      dataPostponed.value = res.newsPostpone;
    }
    loading.value = false;
  });
  }

}

async function activarDesactivar(data) {
  if (data.status === 0) {
    await put(`/news/inactive/${data._id}`);
  } else {
    await put(`/news/active/${data._id}`);
  }
  await getNews();
}

function cleanForm() {
  loading.value = false;
  index.value = "";
  form.value = {
    tpNew: "",
    tpImprovement: "",
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

function clearOtherFields() {
  form.value.center = "";
  form.value.city = "";
  form.value.fend = "";
  form.value.duration = "";
  form.value.typeTransfer = "";
  form.value.subtype = "";
  form.value.cause = ""
}

function clearOtherFields2() {
  form.value.center = "";
  form.value.city = "";
  form.value.workingDay = "";
  form.value.fend = "";
  form.value.duration = "";
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

function showInfo(data) {
  cleanForm();
  clearOtherFields();
  index.value = data._id;
  form.value.tpNew = data.tpnew;
  form.value.tpDocument = data.tpdocument;
  form.value.document = data.document;
  form.value.name = data.name;
  form.value.email = data.email;
  form.value.statusStudent = data.statusstudent;
  form.value.phone = data.phone;
  form.value.cause = data.cause;
  form.value.dateRegister = data.datesofia?.split("T")[0].replace(/-/g, "/");
  form.value.ficheSelected = {
    label: `${data.fiche.number}: ${data.fiche.program.name}`,
    value: data.fiche._id,
  };
  form.value.typeTransfer = data.typetransfer;
  form.value.subtype = data.subtype;
  form.value.center = data.center;
  form.value.city = data.city;
  form.value.workingDay = data.workingday;
  console.log(form.value);
  edit.value = true;
  prompt.value = true;
  loading.value = false;
}

async function postNew() {
  loading.value = true;

  const formData = new FormData();

  formData.append("file", form.value.file);
  formData.append("tpnew", form.value.tpNew);
  formData.append("typetransfer", form.value.typeTransfer);
  formData.append("subtype", form.value.subtype);
  formData.append("workingday", form.value.workingDay);
  formData.append("center", form.value.center);
  formData.append("city", form.value.city);
  formData.append("duration", form.value.duration);
  formData.append("instructor", form.value.instructor.value);
  formData.append("fend", form.value.fend);
  formData.append("tpdocument", form.value.tpDocument);
  formData.append("document", form.value.document);
  formData.append("email", form.value.email);
  formData.append("name", form.value.name);
  formData.append("phone", form.value.phone);
  formData.append("fiche", form.value.ficheSelected.value);
  formData.append("cause", form.value.cause);
  formData.append("datesofia", form.value.dateRegister);

  $q.loading.show({
    message: "Cargando contenido, esto puede tardar unos segundos...",
  });

  if (form.value.tpNew == "PLAN DE MEJORAMIENTO") {
    await post("/news/registerimprovement", {
        tpnew: form.value.tpNew,
        type: form.value.tpImprovement,
        tpdocument: form.value.tpDocument,
        document: form.value.document,
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        fiche: form.value.ficheSelected.value,
        competence: form.value.competence.value,
        outcome: form.value.outcome.value,
        fend: form.value.fend,
        activity: form.value.activity,
        status: form.value.status,
        instructor: form.value.instructor.value,
      })
      .then(async (res) => {
        if (res) {
          notifySuccessRequest("Plan de mejoramiento registrado");
          prompt.value = false;
          edit.value = false;
          cleanForm();
        }
      });
  } else {
    await post("/news/register", formData).then(async (res) => {
      if (res) {
        notifySuccessRequest("Novedad registrada correctamente");
        prompt.value = false;
        edit.value = false;
        cleanForm();
        await getNews();
      }
    });
  }
  $q.loading.hide();
  loading.value = false;
}

async function putNew() {
  loading.value = true;
  const formData = new FormData();

  formData.append("file", form.value.file);
  formData.append("tpnew", form.value.tpNew);
  formData.append("typetransfer", form.value.typeTransfer);
  formData.append("subtype", form.value.subtype);
  formData.append("workingday", form.value.workingDay);
  formData.append("center", form.value.center);
  formData.append("city", form.value.city);
  formData.append("duration", form.value.duration);
  formData.append("fend", form.value.fend);
  formData.append("tpdocument", form.value.tpDocument);
  formData.append("document", form.value.document);
  formData.append("email", form.value.email);
  formData.append("name", form.value.name);
  formData.append("phone", form.value.phone);
  formData.append("fiche", form.value.ficheSelected.value);
  formData.append("cause", form.value.cause);
  formData.append("datesofia", form.value.dateRegister);
  $q.loading.show({
    message: "Cargando contenido, esto puede tardar unos segundos...",
  });

  await put(`/news/update/${index.value}`, formData).then(async (res) => {
    if (res) {
      notifySuccessRequest("Novedad actualizada correctamente");
      edit.value = false;
      prompt.value = false;
      cleanForm();
      await getNews();
    }
  });
  $q.loading.hide();
  loading.value = false;
}

function onRejected(files) {
  $q.notify({
    color: "negative",
    position: "top",
    message: "El archivo no cumple con los requisitos",
    icon: "report_problem",
  });
}

function filterNewsByInput() {
  if (filter1.value == "TODAS") {
    if (!filter2.value) filterTable.value = dataTable.value;
    else {
      filterTable.value = dataTable.value.filter(
        (v) =>
          v.name
            .toLocaleLowerCase()
            .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
          v.acta
            .toLocaleLowerCase()
            .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
          v.document
            .toLocaleLowerCase()
            .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
          v.document
            .toLocaleLowerCase()
            .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
          v.fiche.number
            .toLocaleLowerCase()
            .indexOf(filter2.value?.toLocaleLowerCase()) > -1
      );
    }
  } else {
    if (!filter2.value) {
      filterTable.value = dataTable.value.filter(
        (item) => item.tpnew == filter1.value
      );
    } else {
      filterTable.value = filterTable.value.filter(
        (v) =>
          (v.name
            .toLocaleLowerCase()
            .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
            v.acta
              .toLocaleLowerCase()
              .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
            v.document
              .toLocaleLowerCase()
              .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
            v.document
              .toLocaleLowerCase()
              .indexOf(filter2.value?.toLocaleLowerCase()) > -1 ||
            v.fiche.number
              .toLocaleLowerCase()
              .indexOf(filter2.value?.toLocaleLowerCase()) > -1) &&
          v.tpnew.indexOf(filter1.value) > -1
      );
    }
  }
}

function filterInstructor(val, update, abort) {
  update(() => {
    const needle = val.toLocaleLowerCase();
    filterOptionsInstructors.value = optionsInstructor.value.filter(
      (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
    );
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

.tamano {
  font-size: 16px !important;
  height: 30px !important;
}

.card-section{
  padding: 0px !important;
}

.expansion_hover:hover :deep(.q-item) {
  background-color: #dff2e6 !important;
  border: 1.5px solid #d4edda !important;
  color: #1b5e20 !important;
}

:deep(.q-expansion-item__toggle-icon) {
  background-color: #dff2e6 !important;
}
</style>