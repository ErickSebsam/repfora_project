<template>
  <q-dialog v-model="show" persistent square>
    <q-card class="modal-repfora shadow-2" square>
      <!-- Header Estilo Repfora: Verde Sólido y Cuadrado -->
      <q-card-section class="header-repfora text-white q-pa-md">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="row items-center">
              <q-icon :name="icon" size="sm" class="q-mr-md" />
              <div>
                <div class="text-h6 text-weight-bold text-uppercase">{{ title }}</div>
              </div>
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup color="white" />
        </div>
      </q-card-section>

      <q-separator color="white" size="2px" />

      <!-- Cuerpo del Modal: Cuadrado y Plano -->
      <q-card-section class="q-pa-lg bg-white">
        <div class="text-overline text-weight-bold q-mb-xs" style="color: var(--color_header)">
          CONTENIDO DEL ELEMENTO
        </div>
        
        <q-input
          v-model="editModel"
          type="textarea"
          filled
          square
          autogrow
          color="green-9"
          placeholder="Ingrese el contenido aquí..."
          class="repfora-input"
          ref="inputRef"
          counter
          :rules="[val => !!val || 'El campo es obligatorio']"
        >
          <template v-slot:prepend>
            <q-icon name="edit_note" style="color: var(--color_header)" />
          </template>
        </q-input>
      </q-card-section>

      <q-separator />

      <!-- Acciones: Botones Cuadrados Estilo Repfora -->
      <q-card-actions align="right" class="q-pa-md bg-grey-2">
        <q-btn 
          flat 
          label="CANCELAR" 
          color="grey-9" 
          v-close-popup 
          class="q-px-lg text-weight-bold"
          square
        />
        <q-btn 
          label="GUARDAR CAMBIOS" 
          @click="onSave" 
          :disable="!editModel.trim()"
          class="q-px-xl text-weight-bold style-btn"
          unelevated
          square
          icon="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'EDITAR ELEMENTO' },
  initialValue: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'save']);

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const editModel = ref('');
const inputRef = ref(null);

const icon = computed(() => {
  const t = props.title.toLowerCase();
  if (t.includes('concepto')) return 'lightbulb';
  if (t.includes('proceso')) return 'settings';
  if (t.includes('criterio')) return 'assignment_turned_in';
  if (t.includes('estrategia')) return 'menu_book';
  if (t.includes('evidencia')) return 'description';
  if (t.includes('ambiente')) return 'business';
  if (t.includes('material')) return 'inventory';
  return 'edit';
});

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    editModel.value = props.initialValue;
    setTimeout(() => {
      if (inputRef.value) inputRef.value.focus();
    }, 100);
  }
});

const onSave = () => {
  if (editModel.value.trim()) {
    emit('save', editModel.value.trim());
    show.value = false;
  }
};
</script>

<style scoped>
.modal-repfora {
  width: 850px;
  max-width: 95vw;
  border: 1px solid #ccc;
}

.header-repfora {
  background-color: var(--color_header);
}

.repfora-input :deep(.q-field__control) {
  background-color: #f9f9f9 !important;
  border: 1px solid #ddd !important;
}

.repfora-input :deep(.q-field__control:before),
.repfora-input :deep(.q-field__control:after) {
  display: none !important; /* Eliminar líneas de Quasar para un look más plano */
}

.style-btn {
  background-color: var(--color_button) !important;
  color: var(--color_text_button) !important;
}

/* Forzar que todo sea cuadrado */
.q-btn, .q-card, .q-field__control {
  border-radius: 0 !important;
}

.text-uppercase {
  text-transform: uppercase;
}
</style>
