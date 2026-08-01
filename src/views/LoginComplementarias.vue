<template>
  <div>
    <HeaderLayout :title="isPlanning ? 'Planeación' : 'Complementarias'" />
    <BtnBack :route="backRoute" />

    <div class="row justify-center">
      <div class="col-10 col-sm-6 col-md-4 col-lg-4 items-center flex q-my-lg">
        <q-card class="my-card shadow-8 full-width">
          <q-card-section class="bg-green-9 q-px-lg">
            <h4 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
              REPFORA
            </h4>
          </q-card-section>

          <div class="column items-center q-mt-md">
            <img
              src="/images/LOGO-SENA.png"
              style="height: 100px; width: 100px"
            />
          </div>

          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold">
              {{ isPlanning ? "ACCESO PLANEACIÓN" : "ACCESO COMPLEMENTARIAS" }}
            </div>
          </q-card-section>
          <q-separator />

          <q-card-section class="q-px-lg q-pb-lg">
            <!-- Estado DOC_VERIFIED: enviar código -->
            <div v-if="state === 'DOC_VERIFIED'" class="text-center">
              <div class="text-subtitle2 q-mb-lg">
                Para acceder al módulo de
                {{ isPlanning ? "planeación" : "complementarias" }}, genera un
                código de verificación que será enviado a tus correos
                registrados.
              </div>
              <q-card-actions class="column items-center">
                <q-btn
                  label="ENVIAR CÓDIGO"
                  icon="send"
                  class="button_style"
                  :loading="loading"
                  @click="sendCode"
                />
              </q-card-actions>
            </div>

            <!-- Estado CODE_SENT: ingresar OTP -->
            <div v-if="state === 'CODE_SENT'">
              <div
                class="bg-green-1 text-green-9 q-pa-md rounded-borders q-mb-md text-center"
              >
                <q-icon
                  name="mark_email_read"
                  color="green-9"
                  size="md"
                  class="q-mb-xs"
                />
                <div class="text-weight-bold q-mb-xs">
                  Código enviado exitosamente
                </div>
                <div class="text-caption q-mb-sm">
                  Se envió un código de verificación a:
                </div>
                <div
                  v-for="mail in sentEmails"
                  :key="mail"
                  class="text-weight-bold q-px-md q-py-xs bg-green-2 rounded-borders q-mt-xs"
                >
                  {{ maskEmail(mail) }}
                </div>
              </div>

              <q-separator class="q-mb-md" />

              <div class="text-subtitle2 text-center q-mb-sm">
                Ingrese el código de 6 dígitos:
              </div>
              <div class="row justify-center q-gutter-sm q-mb-sm">
                <q-input
                  v-for="(_, index) in otpDigits"
                  :key="index"
                  :ref="(el) => (otpRefs[index] = el)"
                  v-model="otpDigits[index]"
                  class="otp-input"
                  outlined
                  dense
                  maxlength="1"
                  inputmode="numeric"
                  :disable="loading"
                  @update:model-value="(v) => onOtpInput(v, index)"
                  @keydown.backspace="onBackspace(index)"
                />
              </div>

              <div
                v-if="codeError"
                class="text-negative text-caption text-center q-mb-sm"
              >
                {{ codeError }}
              </div>

              <!-- Countdown expiración -->
              <div class="text-center text-caption text-grey-7 q-mb-md">
                <span v-if="expiryCountdown > 0">
                  Expira en: {{ formatTime(expiryCountdown) }}
                </span>
                <span v-else class="text-negative">El código ha expirado</span>
              </div>

              <!-- Botón reenviar -->
              <q-card-actions class="column items-center">
                <q-btn
                  :label="
                    resendCountdown > 0
                      ? `Reenviar en ${resendCountdown}s`
                      : 'Reenviar código'
                  "
                  icon="refresh"
                  flat
                  color="green-9"
                  :disable="resendCountdown > 0 || loading"
                  :loading="loading"
                  @click="sendCode"
                />
              </q-card-actions>
            </div>

            <!-- Estado NO_ACCESS: sin instToken -->
            <div v-if="state === 'NO_ACCESS'" class="text-center q-py-md">
              <q-icon name="warning" color="orange-7" size="48px" />
              <div class="text-subtitle2 q-mt-md">
                Debes consultar tu información como instructor antes de acceder
                a este módulo.
              </div>
              <q-card-actions class="column items-center q-mt-md">
                <q-btn
                  label="IR A CONSULTA"
                  icon="arrow_back"
                  class="button_style"
                  @click="router.push('/consultor')"
                />
              </q-card-actions>
            </div>

            <!-- Estado CODE_VERIFIED -->
            <div v-if="state === 'CODE_VERIFIED'" class="text-center q-py-md">
              <q-icon name="check_circle" color="green-7" size="64px" />
              <div class="text-h6 text-green-9 q-mt-md">¡Acceso concedido!</div>
              <div class="text-caption text-grey-7 q-mt-sm">
                Redirigiendo...
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { post } from "../services/api.js";
import HeaderLayout from "../layouts/headerViewsLayout.vue";
import BtnBack from "../layouts/btnBackLayout.vue";
import { storeUser } from "../store/users";
import { notifySuccessRequest, notifyErrorRequest } from "../common/notify";

// ─── Setup ────────────────────────────────────────────────────────────────────
const router = useRouter();
const useStore = storeUser();

const isPlanning = computed(
  () => router.currentRoute.value.query.redirect === "planning",
);

onMounted(() => {
  const isAdmin = ["COORDINADOR", "PROGRAMADOR", "ADMIN"].includes(
    useStore.getRole(),
  );
  if (isAdmin) {
    const isPlanning = router.currentRoute.value.query.redirect === "planning";
    const redirectPath = isPlanning
      ? "/planning-dashboard"
      : "/home/complementarias";
    console.log(
      "=== [LoginComplementarias] Admin bypass redirecting directly to:",
      redirectPath,
    );
    router.replace(redirectPath);
  }
});

const backRoute = computed(() => {
  const isAdmin = ["COORDINADOR", "PROGRAMADOR", "ADMIN"].includes(
    useStore.getRole(),
  );
  return router.currentRoute.value.query.redirect === "planning" && isAdmin
    ? "/home"
    : "/home/instructor";
});

// ─── Estado ───────────────────────────────────────────────────────────────────
const state = ref(useStore.token ? "DOC_VERIFIED" : "NO_ACCESS");
const loading = ref(false);
const sentEmails = ref([]);
const codeError = ref("");
const otpDigits = ref(["", "", "", "", "", ""]);
const otpRefs = ref([]);
const resendCountdown = ref(0);
const expiryCountdown = ref(0);
let resendTimer = null;
let expiryTimer = null;

// ─── Enviar código ────────────────────────────────────────────────────────────
async function sendCode() {
  codeError.value = "";
  loading.value = true;
  clearTimers();
  try {
    const res = await post("/complementary/access/send-code", {
      email: useStore.email,
      module: isPlanning.value ? "planning" : "complementary",
    });
    sentEmails.value = res.emails || [];
    otpDigits.value = ["", "", "", "", "", ""];
    state.value = "CODE_SENT";

    if (res.devCode) {
      notifySuccessRequest(`[Modo Desarrollo] Código generado: ${res.devCode}`);
      otpDigits.value = res.devCode.split("");
      setTimeout(() => verifyCode(), 1000);
    } else {
      notifySuccessRequest("Código enviado a tus correos");
    }

    startResendCountdown();
    startExpiryCountdown();
  } catch (err) {
    const msg =
      err?.response?.data?.msg ||
      "No se pudo enviar el código. Intenta de nuevo.";
    if (state.value === "CODE_SENT") codeError.value = msg;
    else notifyErrorRequest(msg);
  } finally {
    loading.value = false;
  }
}

// ─── Verificar código ─────────────────────────────────────────────────────────
async function verifyCode() {
  codeError.value = "";
  loading.value = true;
  const code = otpDigits.value.join("");
  try {
    const res = await post("/complementary/access/verify-code", {
      email: useStore.email,
      code,
    });

    const isAdmin = ["COORDINADOR", "PROGRAMADOR", "ADMIN"].includes(
      useStore.getRole(),
    );
    if (isAdmin) {
      useStore.complementaryToken = res.token;
    } else {
      useStore.token = res.token;
      if (res.instructor) useStore.instructorData = res.instructor;
    }

    clearTimers();
    state.value = "CODE_VERIFIED";

    const isPlanningRedirect =
      router.currentRoute.value.query.redirect === "planning";
    notifySuccessRequest(
      isPlanningRedirect
        ? "Acceso a planeación concedido"
        : "Acceso a complementarias concedido",
    );

    const redirectPath = isPlanningRedirect
      ? "/planning-dashboard"
      : "/home/complementarias";
    setTimeout(() => router.push(redirectPath), 3000);
  } catch (err) {
    const msg =
      err?.response?.data?.msg || "Código incorrecto. Intenta de nuevo.";
    codeError.value = msg;
    otpDigits.value = ["", "", "", "", "", ""];
    if (otpRefs.value[0]) otpRefs.value[0].focus();
  } finally {
    loading.value = false;
  }
}

function onOtpInput(val, i) {
  otpDigits.value[i] = val ? val.slice(-1) : "";
  if (otpDigits.value[i] && i < 5) otpRefs.value[i + 1]?.focus();
  if (otpDigits.value.every((d) => d !== "")) verifyCode();
}

function onBackspace(i) {
  if (!otpDigits.value[i] && i > 0) otpRefs.value[i - 1]?.focus();
}

function startResendCountdown() {
  resendCountdown.value = 30;
  resendTimer = setInterval(() => {
    resendCountdown.value -= 1;
    if (resendCountdown.value <= 0) clearInterval(resendTimer);
  }, 1000);
}

function startExpiryCountdown() {
  expiryCountdown.value = 300;
  expiryTimer = setInterval(() => {
    expiryCountdown.value -= 1;
    if (expiryCountdown.value <= 0) {
      clearTimers();
      codeError.value = "";
      state.value = "DOC_VERIFIED";
    }
  }, 1000);
}

function clearTimers() {
  clearInterval(resendTimer);
  clearInterval(expiryTimer);
}

function maskEmail(email) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 3)}****@${domain}`;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

onUnmounted(clearTimers);
</script>

<style scoped>
.otp-input {
  width: 48px;
}
.otp-input :deep(.q-field__control) {
  justify-content: center;
}
.otp-input :deep(input) {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}
</style>
