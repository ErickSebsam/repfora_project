<template>
  <div>
    <!-- Back Button matching REPFORA views layout -->
    <BtnBack :route="backRoute" />

    <!-- Title layout matching standard Home/HomeSchedules views -->
    <div class="row q-my-xl justify-center row-tittle">
      <div class="col-12 text-center text-h5 text-weight-bold text-uppercase">
        PLANEACIÓN PEDAGÓGICA AUTOMÁTICA
      </div>
      <div class="col-12 text-center text-subtitle1 text-grey-6 q-mt-sm">
        Cargue los documentos oficiales de la plataforma SENA para generar la planeación pedagógica automáticamente.
      </div>
    </div>

    <!-- MAIN CARD FOR UPLOADING DOCUMENTS -->
    <div class="row justify-center q-px-md">
      <div class="col-12 col-md-10 col-lg-9" style="max-width: 1000px;">
        <q-card class="my-card-1 shadow-5 full-width q-pa-lg bg-white">
          <q-card-section class="text-center q-pb-none">
            <q-chip outline color="green-9" class="text-weight-bold text-uppercase">Plataforma SENA</q-chip>
            <div class="text-h6 text-weight-bold q-mt-md q-mb-xs">Cargue de Documentos</div>
            <p class="text-grey-7 text-body2">Suba los 3 documentos requeridos para generar la planeación con asignación de instructores.</p>
          </q-card-section>

          <q-separator class="q-my-md" />

          <!-- Drop Zones Grid -->
          <q-card-section class="row q-col-gutter-lg">
            <!-- Drop Zone 1 -->
            <div class="col-12 col-sm-4">
              <div class="drop-zone flex flex-center column q-pa-xl cursor-pointer"
                :class="{ 'drop-zone-active': file1 }" @click="$refs.fileInput1.click()">
                <q-icon :name="file1 ? 'check_circle' : 'description'" :color="file1 ? 'green-9' : 'grey-5'"
                  size="56px" />
                <div class="text-subtitle2 text-weight-bold q-mt-sm text-center">1. Programa de Formación</div>
                <input type="file" ref="fileInput1" class="hidden" accept=".pdf" @change="handleFile1" />
                <div v-if="file1" class="text-caption text-green-9 text-center q-mt-sm text-weight-bold">
                  {{ file1.name }}
                </div>
              </div>
            </div>

            <!-- Drop Zone 2 -->
            <div class="col-12 col-sm-4">
              <div class="drop-zone flex flex-center column q-pa-xl cursor-pointer"
                :class="{ 'drop-zone-active': file2 }" @click="$refs.fileInput2.click()">
                <q-icon :name="file2 ? 'check_circle' : 'bar_chart'" :color="file2 ? 'green-9' : 'grey-5'"
                  size="56px" />
                <div class="text-subtitle2 text-weight-bold q-mt-sm text-center">2. Proyecto Formativo</div>
                <input type="file" ref="fileInput2" class="hidden" accept=".pdf" @change="handleFile2" />
                <div v-if="file2" class="text-caption text-green-9 text-center q-mt-sm text-weight-bold">
                  {{ file2.name }}
                </div>
              </div>
            </div>

            <!-- Drop Zone 3 -->
            <div class="col-12 col-sm-4">
              <div class="drop-zone flex flex-center column q-pa-xl cursor-pointer"
                :class="{ 'drop-zone-active': file3 }" @click="$refs.fileInput3.click()">
                <q-icon :name="file3 ? 'check_circle' : 'group'" :color="file3 ? 'green-9' : 'grey-5'"
                  size="56px" />
                <div class="text-subtitle2 text-weight-bold q-mt-sm text-center">3. Equipo Ejecutor</div>
                <input type="file" ref="fileInput3" class="hidden" accept=".pdf" @change="handleFile3" />
                <div v-if="file3" class="text-caption text-green-9 text-center q-mt-sm text-weight-bold">
                  {{ file3.name }}
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Upload / Extract Button -->
          <q-card-actions class="flex flex-center q-mt-md q-pb-md">
            <q-btn class="button_style q-px-xl text-weight-bold text-uppercase" size="lg" :loading="loading"
              :disabled="!file1 || !file2 || !file3" @click="processDocuments">
              CRUZAR Y EXTRAER DOCUMENTOS
            </q-btn>
          </q-card-actions>
        </q-card>


      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { PlanningService } from '../services/planning.service';
import { storeUser } from '../store/users.js';
import BtnBack from "../layouts/btnBackLayout.vue";

const router = useRouter();
const $q = useQuasar();

const backRoute = '/planning-dashboard';
const ficheNumber = ref('');

const file1 = ref(null);
const file2 = ref(null);
const file3 = ref(null);
const loading = ref(false);

const handleFile1 = (e) => {
  file1.value = e.target.files[0];
};

const handleFile2 = (e) => {
  file2.value = e.target.files[0];
  // Intentar detectar número de ficha del nombre del archivo
  const match = file2.value.name.match(/(\d{7})/);
  if (match) {
    ficheNumber.value = match[1];
    $q.notify({ message: `Ficha detectada: ${match[1]}`, color: 'blue-7', timeout: 2000 });
  }
};

const handleFile3 = (e) => {
  file3.value = e.target.files[0];
};


const getActiveUserEmail = () => {
  const useUser = storeUser();
  if (useUser.email) return useUser.email;

  const activeToken = useUser.token;
  if (activeToken) {
    try {
      const decoded = JSON.parse(atob(activeToken.split('.')[1]));
      if (decoded.email) return decoded.email;
    } catch (e) { }
  }

  const repforaUserRaw = localStorage.getItem('repfora_user');
  if (repforaUserRaw) {
    try {
      const user = JSON.parse(repforaUserRaw);
      if (user.email) return user.email;
    } catch (e) { }
  }
  return '';
};

const processDocuments = async () => {
  loading.value = true;
  try {
    const finalFiche = ficheNumber.value || 'EXTRACTED_' + Date.now();
    const leaderEmail = getActiveUserEmail();

    // Ahora enviamos los 3 archivos
    const response = await PlanningService.extractFromPDFs(file1.value, file2.value, file3.value, finalFiche, leaderEmail);
    const finalRealFiche = response?.finalFiche || finalFiche;

    // Registrar la ficha como creada por el usuario actual
    if (leaderEmail) {
      const createdFichesKey = `repfora_created_fiches_${leaderEmail.replace(/[@.]/g, '_')}`;
      const createdFiches = JSON.parse(localStorage.getItem(createdFichesKey) || '[]');
      if (!createdFiches.includes(finalRealFiche)) {
        createdFiches.push(finalRealFiche);
        localStorage.setItem(createdFichesKey, JSON.stringify(createdFiches));
      }
    }

    $q.notify({ message: '¡Extracción exitosa! Redirigiendo...', color: 'green-9', icon: 'check_circle' });
    router.push({ name: 'planning', query: { fiche: finalRealFiche } });
  } catch (error) {
    console.error('Error en extracción:', error);
    $q.notify({
      message: 'Error en la extracción. Verifique los archivos o intente de nuevo.',
      color: 'red-8',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  background: #f9f9f9;
  transition: all 0.3s;
}

.drop-zone:hover {
  border-color: #2e7d32;
  background: #f1f8e9;
}

.drop-zone-active {
  border-color: #2e7d32;
  background: #e8f5e9;
}

.button_style {
  background-color: var(--color_button);
  color: var(--color_text_button);
}

.row-tittle {
  margin-top: 50px;
}
</style>
