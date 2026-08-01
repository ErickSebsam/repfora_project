<template>
  <q-card class="row" style="max-width: 380px">
    <q-card-actions
      class="col-12 justify-center bg-green-10 text-white text-h6"
    >
      NOVEDAD REGISTRADA
    </q-card-actions>
    <q-card-section class="col-12 items-center justify-center flex">
 <!--      <q-img src="/images/logo.png" style="width: 60px; height: 60px" /> -->
    </q-card-section>
    <q-card-actions class="col-12 justify-center q-px-md">
      Su novedad ha sido registrada con éxito, será revisada por la coordinación
      académica y posteriormente se le notificará el estado de la misma.
    </q-card-actions>

    <q-card-actions class="col-12 justify-center flex q-mt-md q-mb-sm">
      <q-btn
        icon="save_as"
        label="CERRAR"
        color="green-10"
        v-close-popup
        to="/"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>

</script>