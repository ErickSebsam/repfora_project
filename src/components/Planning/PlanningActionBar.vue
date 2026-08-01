<template>
  <div class="row justify-center q-mb-md q-px-lg">
    <div class="col-12 flex justify-center q-gutter-sm">
      <q-btn v-if="isSynced" flat dense square no-caps color="green-9" label="Sincronizado" icon="cloud_done" />
      
      <q-btn unelevated square color="green-9" class="text-white" @click="$emit('save-template')" v-if="isLeader">
          <q-icon name="save" size="xs" class="q-mr-xs" />
          GUARDAR PLANILLA
          <q-tooltip class="bg-green-10 text-weight-bold">Guardar esta planeación como plantilla sugerida para este programa</q-tooltip>
      </q-btn>

      <q-btn unelevated square color="indigo-8" @click="$emit('import-template')" :disable="!hasTemplate" v-if="isLeader">
          <q-icon name="download" size="xs" class="q-mr-xs" />
          IMPORTAR PLANILLA
          <q-tooltip class="bg-indigo-9 text-weight-bold">Importar actividades sugeridas desde la planilla de este programa</q-tooltip>
      </q-btn>

      <q-btn unelevated square color="red-8" @click="$emit('clear-plan')">
          <q-icon name="logout" size="xs" class="q-mr-xs" />
          SALIR
      </q-btn>
      <q-btn unelevated square color="green-7" class="text-white" @click="$emit('export-excel')">
          <q-icon name="description" size="xs" class="q-mr-xs" />
          EXPORTAR A EXCEL
      </q-btn>
      <q-btn unelevated square color="green-9" class="text-white" @click="$emit('show-preview')">
        <q-icon name="calendar_month" size="xs" class="q-mr-xs" />
        PREVISUALIZAR PROGRAMACIÓN
      </q-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isSynced: { type: Boolean, default: false },
  isLeader: { type: Boolean, default: false },
  hasTemplate: { type: Boolean, default: false }
});

defineEmits([
  'save-template',
  'import-template',
  'clear-plan',
  'export-excel',
  'show-preview'
]);
</script>
