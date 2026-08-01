<template>
  <q-card
    style="width: 700px; max-width: 80vw; height: 500px; max-height: 80vh"
  >
    <q-card-section class="full-height q-pa-sm">
      <iframe
        :src="img?.url"
        class="full-width full-height"
        allow="autoplay"
      ></iframe>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, defineProps } from "vue";

const props = defineProps({
  img: {
    type: Object,
    required: true,
  },
});
</script>